import { RenderStatus, VideoStatus } from "@prisma/client";
import { Job, Worker } from "bullmq";
import fs from "fs";
import path from "path";
import { downloadDir, renderDir } from "../config/fs.config";
import prismaClient from "../prisma/client";
import { videoRenderQueue } from "../queues/video.queue";
import { redisClient } from "../redis/client";
import ffmpegService from "../services/ffmpeg.service";
import s3Service from "../services/s3.service";

// Utility function to pause execution for a given number of seconds
const sleep = (t: number) =>
  new Promise((resolve) => setTimeout(resolve, t * 1000));

// Main function to initialize the video worker
export async function videoWorker() {
  // Create a new worker for the video render queue
  return new Worker(
    videoRenderQueue.name, // Queue name
    async (job: Job) => {
      try {
        // Update the render status to IN_PROGRESS in the database
        await prismaClient.render.update({
          where: { id: job.name },
          data: {
            status: RenderStatus.IN_PROGRESS,
          },
        });

        // Fetch the video details and associated trims from the database
        const video = await prismaClient.video.findUnique({
          where: { id: job.data.videoId },
          include: { trims: true },
        });
        if (!video) {
          throw new Error("Video not found"); // Throw error if video is not found
        }

        if (!video.trims.length) throw new Error("No trims exist"); // Ensure trims exist

        let currentProgress = 0; // Initialize progress counter
        const totalProgress = video.trims.length + 4; // Total progress steps

        const updateProgress = () =>
          Math.floor((++currentProgress / totalProgress) * 100);

        // Extract IDs of trimmed videos
        const trimmedVideoIds = video.trims.map((trim) => trim.trimmedVideoId);

        // Fetch details of trimmed videos that are uploaded
        const trimmedVideos = await prismaClient.video.findMany({
          where: {
            id: { in: trimmedVideoIds },
            status: VideoStatus.UPLOADED,
          },
        });

        await job.log(`Fetched trimmed videos: ${trimmedVideos.length}`); // Log the number of trimmed videos

        await job.updateProgress(updateProgress()); // Update job progress

        // Download each trimmed video from S3 and save locally
        const inputFilePaths = await Promise.all(
          trimmedVideos.map(async (video) => {
            const s3Key = video.filePath.split(".com/")[1]; // Extract S3 key from file path
            const filePath = path.join(
              downloadDir,
              `${video.id}_${video.filename}` // Construct local file path
            );
            await s3Service.saveFile(s3Key, filePath); // Download file from S3
            await job.updateProgress(updateProgress()); // Update job progress
            return filePath; // Return local file path
          })
        );

        await job.log(`Downloaded trimmed videos: ${inputFilePaths.length}`); // Log the number of downloaded videos

        /*  // Create a file list for ffmpeg to join videos
        const fileListContent = inputFilePaths
          .map((file) => `file '${file}'`) // Format file paths for ffmpeg
          .join("\n");
        const fileListPath = path.join(renderDir, `filelist_${Date.now()}.txt`); // Generate unique file list path
        fs.writeFileSync(fileListPath, fileListContent); // Write file list to disk

        await job.log(`Created file list for ffmpeg: ${fileListPath}`); // Log the file list path */

        // Define output file name and path
        const outputFileName = `render_${Date.now()}_${video.filename}`;
        const outputFilePath = path.join(renderDir, outputFileName);

        // Use ffmpeg to join videos
        await ffmpegService.joinVideos(inputFilePaths, outputFilePath);
        await job.updateProgress(updateProgress()); // Update job progress
        await job.log(`Joined videos using ffmpeg: ${outputFilePath}`); // Log the output file path

        // Upload the rendered video to S3
        const renderedS3Key = `videos/renders/${outputFileName}`; // Define S3 key for rendered video
        const fileStream = fs.createReadStream(outputFilePath); // Create a read stream for the rendered file
        await s3Service.uploadFile(
          renderedS3Key,
          fileStream,
          video.contentType // Use the original video's content type
        );
        await job.updateProgress(updateProgress()); // Update job progress
        await job.log(`Uploaded rendered video to S3: ${renderedS3Key}`); // Log the S3 key

        const s3Url = s3Service.constructUrl(renderedS3Key); // Construct S3 URL for the uploaded file

        // Extract metadata from the rendered video
        const metadata = await ffmpegService.getVideoMetadata(outputFilePath);
        const duration = metadata.format.duration || 0; // Get video duration
        const size = fs.statSync(outputFilePath).size; // Get file size

        // Save the rendered video metadata to the database
        const subbedVideo = await prismaClient.video.create({
          data: {
            filename: outputFileName,
            filePath: s3Url,
            duration: duration,
            size: size,
            contentType: video.contentType,
            status: VideoStatus.UPLOADED, // Mark the video as uploaded
          },
        });

        // Update the render record with the rendered video details
        const render = await prismaClient.render.update({
          where: { id: job.name },
          data: {
            videoId: video.id,
            renderedVideoId: subbedVideo.id,
            outputPath: s3Url,
            status: RenderStatus.COMPLETED, // Mark the render as completed
          },
        });
        await job.updateProgress(updateProgress()); // Update job progress
        await job.log(`Saved rendered video to database: ${subbedVideo.id}`); // Log the S3 URL

        // Clean up temporary files
        // fs.unlinkSync(fileListPath); // Delete the file list
        inputFilePaths.forEach((filePath) => fs.unlinkSync(filePath)); // Delete downloaded trimmed videos
        fs.unlinkSync(outputFilePath); // Delete the rendered video file

        await job.log(`Render complete ${job.name}`);

        return {
          subbedVideo, // Return the rendered video details
          render, // Return the render record
        };
      } catch (error) {
        console.log("Error processing video render job:", error); // Log the error

        // Update the render status to FAILED in case of an error
        await prismaClient.render.update({
          where: { id: job.name },
          data: {
            status: RenderStatus.FAILED,
          },
        });
        throw error; // Rethrow the error
      }
    },
    { connection: redisClient } // Use the Redis connection for the worker
  );
}

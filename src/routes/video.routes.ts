// src/routes/video.routes.js
import { RenderStatus, VideoStatus } from "@prisma/client";
import express from "express";
import fs from "fs";
import path from "path";
import { downloadDir, subbedDir, subsDir, trimsDir } from "../config/fs.config";
import videoUploadMiddleware from "../middlewares/upload.middleware";
import prismaClient from "../prisma/client";
import ffmpegService, { generateSRT } from "../services/ffmpeg.service";
import s3Service from "../services/s3.service";
import { videoRenderQueue } from "../queues/video.queue";

const videoRouter = express.Router();

videoRouter.post(
  "/upload",
  videoUploadMiddleware.single("video"),
  async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
      }

      const filePath = file.path;
      const fileStream = fs.createReadStream(filePath);

      // Upload to S3
      const s3Key = `videos/${file.filename}`;
      await s3Service.uploadFile(s3Key, fileStream, file.mimetype);

      // Construct the S3 URL
      const s3Url = s3Service.constructUrl(s3Key);

      // Extract video metadata
      const metadata = await ffmpegService.getVideoMetadata(filePath);
      const duration = metadata.format.duration;

      // Save metadata to the database
      const video = await prismaClient.video.create({
        data: {
          filename: file.filename,
          filePath: s3Url,
          duration: duration || 0,
          size: file.size,
          contentType: file.mimetype,
          status: VideoStatus.UPLOADED,
        },
      });

      // Delete the local file after upload
      fs.unlinkSync(filePath);

      res.status(201).json({
        message: "Video uploaded successfully",
        video,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  }
);

videoRouter.post("/:id/trim", async (req, res) => {
  const { id } = req.params;
  const { startTime, endTime } = req.body;

  if (startTime === undefined || endTime === undefined) {
    res.status(400).json({ error: "startTime and endTime are required." });
    return;
  }

  try {
    // Retrieve video metadata from the database
    const video = await prismaClient.video.findUnique({
      where: { id },
    });
    if (!video) {
      res.status(404).json({ error: "Video not found." });
      return;
    }

    // Calculate duration
    const startSeconds = parseFloat(startTime);
    const endSeconds = parseFloat(endTime);
    const duration = endSeconds - startSeconds;

    if (
      duration <= 0 ||
      duration > video.duration ||
      startSeconds > video.duration
    ) {
      res.status(400).json({ error: "Invalid startTime and endTime values." });
      return;
    }

    const s3Key = video.filePath.split(".com/")[1];
    const inputFilePath = path.join(
      downloadDir,
      `${video.id}_${video.filename}`
    );
    const outputFileName = `trimmed_${Date.now()}_${video.filename}`;
    const outputFilePath = path.join(trimsDir, outputFileName);

    await s3Service.saveFile(s3Key, inputFilePath);

    await ffmpegService.trimVideo(
      inputFilePath,
      outputFilePath,
      startSeconds,
      duration
    );

    // Upload the trimmed video to S3
    const trimmedS3Key = `videos/trimmed/${outputFileName}`;
    const fileStream = fs.createReadStream(outputFilePath);

    await s3Service.uploadFile(trimmedS3Key, fileStream, video.contentType);

    const s3Url = s3Service.constructUrl(trimmedS3Key);

    // Save the trimmed video metadata to the database
    const trimmedVideo = await prismaClient.video.create({
      data: {
        filename: outputFileName,
        filePath: s3Url,
        duration: duration,
        size: fs.statSync(outputFilePath).size,
        contentType: video.contentType,
        status: VideoStatus.UPLOADED,
      },
    });

    const trim = await prismaClient.trim.create({
      data: {
        startTime: startSeconds,
        endTime: endSeconds,
        videoId: video.id,
        trimmedVideoId: trimmedVideo.id,
      },
    });

    // Clean up temporary files
    fs.unlinkSync(inputFilePath);
    fs.unlinkSync(outputFilePath);

    res.status(201).json({
      message: "Video trimmed successfully",
      trim: trim,
      video: trimmedVideo,
    });
  } catch (error) {
    console.error("Error trimming video:", error);
    res.status(500).json({ error: "Failed to trim video" });
  }
});

videoRouter.post("/:id/subtitles", async (req, res) => {
  const { id } = req.params;
  const { subtitles } = req.body; // Expecting an array of { text, startTime, endTime }

  if (!subtitles || !Array.isArray(subtitles)) {
    res.status(400).json({ error: "Invalid subtitles data." });
    return;
  }

  try {
    // Generate SRT content
    const srtContent = generateSRT(subtitles);
    const srtPath = path.join(subsDir, `subtitles_${Date.now()}.srt`);
    fs.writeFileSync(srtPath, srtContent);

    // Retrieve video metadata from the database
    const video = await prismaClient.video.findUnique({
      where: { id },
    });
    if (!video) {
      res.status(404).json({ error: "Video not found." });
      return;
    }

    const s3Key = video.filePath.split(".com/")[1];
    const inputFilePath = path.join(
      downloadDir,
      `${video.id}_${video.filename}`
    );
    const outputFileName = `subbed_${Date.now()}_${video.filename}`;
    const outputFilePath = path.join(subbedDir, outputFileName);

    await s3Service.saveFile(s3Key, inputFilePath);

    await ffmpegService.addSubtitlesToVideo(
      inputFilePath,
      outputFilePath,
      srtPath
    );

    // Upload the subbed video to S3
    // const subbedS3Key = `videos/subbed/${outputFileName}`;
    const fileStream = fs.createReadStream(outputFilePath);

    await s3Service.uploadFile(s3Key, fileStream);

    const s3Url = s3Service.constructUrl(s3Key);

    // Save the subbed video metadata to the database
    const subbedVideo = await prismaClient.video.update({
      where: {
        id,
      },
      data: {
        size: fs.statSync(outputFilePath).size,
      },
    });

    const subs = await prismaClient.subtitle.createMany({
      data: subtitles.map((subtitle) => ({
        text: subtitle.text,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        videoId: subbedVideo.id,
      })),
    });

    // Clean up temporary files
    fs.unlinkSync(srtPath);
    fs.unlinkSync(inputFilePath);
    fs.unlinkSync(outputFilePath);

    res.status(200).json({
      message: "Subtitles added successfully.",
      video: subbedVideo,
      subtitles: subs,
    });
  } catch (error) {
    console.error("Error adding subtitles:", error);
    res.status(500).json({ error: "Failed to add subtitles." });
  }
});

videoRouter.post("/:id/render", async (req, res) => {
  const { id } = req.params;

  const render = await prismaClient.render.create({
    data: { videoId: id, status: RenderStatus.PENDING },
  });

  videoRenderQueue.add(render.id, { videoId: id });

  res.json({
    videoId: id,
    render,
  });
});

videoRouter.get("/:id/download", async (req, res) => {
  const { id } = req.params;

  // Retrieve video metadata from the database
  const video = await prismaClient.video.findUnique({
    where: { id },
  });
  if (!video) {
    res.status(404).json({ error: "Video not found." });
    return;
  }

  // Download the video from S3
  const s3Key = video.filePath.split(".com/")[1];
  const filePath = path.join(downloadDir, `${video.id}_${video.filename}`);
  await s3Service.saveFile(s3Key, filePath);

  // Send the file as a response
  res.download(filePath, (err) => {
    if (err) {
      console.error("Error downloading video:", err);
    }
    fs.unlinkSync(filePath); // Clean up the local file after download
  });
});

export default videoRouter;

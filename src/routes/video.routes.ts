// src/routes/video.routes.js
import { VideoStatus } from "@prisma/client";
import express from "express";
import fs from "fs";
import videoUploadMiddleware from "../middlewares/upload.middleware";
import prismaClient from "../prisma/client";
import ffmpegService from "../services/ffmpeg.service";
import s3Service from "../services/s3.service";
import path from "path";
import { Readable } from "stream";
import { downloadDir, trimsDir } from "../config/fs.config";

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

  if (!startTime || !endTime) {
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

    const data = await s3Service.getFile(s3Key);
    const writeStream = fs.createWriteStream(inputFilePath);
    (data.Body as Readable)?.pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    await ffmpegService.trimVideo(
      inputFilePath,
      outputFilePath,
      startSeconds,
      duration
    );

    // Upload the trimmed video to S3
    const trimmedS3Key = `videos/${outputFileName}`;
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

export default videoRouter;

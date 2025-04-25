// src/routes/video.routes.js
import { VideoStatus } from "@prisma/client";
import express from "express";
import fs from "fs";
import videoUploadMiddleware from "../middlewares/upload.middlleware";
import prismaClient from "../prisma/client";
import ffmpegService from "../services/ffmpeg.service";
import s3Service from "../services/s3.service";

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
      const r = await s3Service.uploadFile(s3Key, fileStream, file.mimetype);

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

export default videoRouter;

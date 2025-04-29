import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import videoRouter from "./routes/video.routes";
import { videoWorker } from "./workers/video.worker";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { videoRenderQueue } from "./queues/video.queue";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, async () => {
  await videoWorker();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/jobs");

  createBullBoard({
    queues: [new BullMQAdapter(videoRenderQueue)],
    serverAdapter,
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.use("/jobs", serverAdapter.getRouter());
  app.use("/api/videos", videoRouter);

  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

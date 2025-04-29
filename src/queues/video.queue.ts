import { Queue } from "bullmq";
import { redisClient } from "../redis/client";
import { VideoRenderJob } from "../types";

export const videoRenderQueue = new Queue<VideoRenderJob>("video-render", {
  connection: redisClient,
});

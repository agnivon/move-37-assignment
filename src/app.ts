import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import videoRouter from "./routes/video.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

// Start server
app.listen(PORT, () => {
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.use("/api/videos", videoRouter);

  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

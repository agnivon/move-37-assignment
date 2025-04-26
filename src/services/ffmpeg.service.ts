import ffmpeg from "fluent-ffmpeg";

export const getVideoMetadata = (filePath: string) => {
  return new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
};

export const trimVideo = async (
  inputFilePath: string,
  outputFilePath: string,
  startSeconds: number,
  duration: number
) => {
  // Trim the video using FFmpeg
  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .setStartTime(startSeconds)
      .setDuration(duration)
      .output(outputFilePath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  return;
};
const ffmpegService = {
  getVideoMetadata,
  trimVideo,
};

export default ffmpegService;

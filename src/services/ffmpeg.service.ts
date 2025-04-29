import ffmpeg from "fluent-ffmpeg";
import { renderDir } from "../config/fs.config";

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

export function generateSRT(
  subtitles: { startTime: number; endTime: number; text: string }[]
) {
  return subtitles
    .map((subtitle, index) => {
      const start = formatTime(subtitle.startTime);
      const end = formatTime(subtitle.endTime);
      return `${index + 1}
${start} --> ${end}
${subtitle.text}
`;
    })
    .join("\n");
}

function formatTime(seconds: number) {
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8) + ",000";
}

export const addSubtitlesToVideo = (
  videoPath: string,
  outputPath: string,
  subtitlePath: string
) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf subtitles=${subtitlePath}:force_style='Fontsize=20'`,
      ])
      .on("end", () => {
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      })
      .save(outputPath);
  });
};

/* export const joinVideos = (fileListPath: string, outputFilePath: string) => {
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(outputFilePath)
      .on("end", () => {
        resolve();
      })
      .on("error", (err) => {
        reject();
      })
      .run();
  });
}; */

export const joinVideos = (filePathList: string[], outputFilePath: string) => {
  // Initialize ffmpeg command
  let command = ffmpeg();

  // Add each video file as input
  filePathList.forEach((file) => {
    command = command.input(file);
  });

  return new Promise<void>((resolve, reject) => {
    command
      .on("end", () => {
        resolve();
      })
      .on("error", (err) => {
        reject();
      })
      .mergeToFile(outputFilePath, renderDir);
  });
};

const ffmpegService = {
  getVideoMetadata,
  trimVideo,
  generateSRT,
  addSubtitlesToVideo,
  joinVideos,
};

export default ffmpegService;

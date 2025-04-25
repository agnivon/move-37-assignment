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

const ffmpegService = {
  getVideoMetadata,
};

export default ffmpegService;

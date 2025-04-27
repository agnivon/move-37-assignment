import fs from "fs";

// Ensure the uploads directory exists
export const uploadDir = "./temp/uploads";

export const downloadDir = "./temp/downloads";

export const trimsDir = "./temp/trims";

export const subsDir = "./temp/subs";

export const subbedDir = "./temp/subbed";

const dirs = [uploadDir, downloadDir, trimsDir, subsDir, subbedDir];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

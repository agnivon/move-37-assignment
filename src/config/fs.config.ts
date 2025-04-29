import fs from "fs";

// Ensure the uploads directory exists
export const uploadDir = "./temp/uploads";

export const downloadDir = "./temp/downloads";

export const trimsDir = "./temp/trims";

export const subsDir = "./temp/subs";

export const subbedDir = "./temp/subbed";

export const renderDir = "./temp/render";

const dirs = [uploadDir, downloadDir, trimsDir, subsDir, subbedDir, renderDir];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

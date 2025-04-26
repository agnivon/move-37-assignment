import fs from "fs";

// Ensure the uploads directory exists
export const uploadDir = "./temp/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const downloadDir = "./temp/downloads";
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

export const trimsDir = "./temp/trims";
if (!fs.existsSync(trimsDir)) {
  fs.mkdirSync(trimsDir, { recursive: true });
}

import dotenv from "dotenv";

dotenv.config();

export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY = process.env
  .AWS_SECRET_ACCESS_KEY as string;
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME as string;

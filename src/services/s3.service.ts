import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_S3_BUCKET_NAME,
  AWS_SECRET_ACCESS_KEY,
} from "../config/aws.config";
import fs from "fs";
import { Readable } from "stream";

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

function getFile(key: string) {
  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
  };

  return s3.send(new GetObjectCommand(params));
}

function uploadFile(key: string, body: any, contentType?: string) {
  const params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  return s3.send(new PutObjectCommand(params));
}

function constructUrl(key: string) {
  return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

async function saveFile(key: string, path: string) {
  const data = await getFile(key);
  const writeStream = fs.createWriteStream(path);
  (data.Body as Readable)?.pipe(writeStream);

  await new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

const s3Service = {
  getFile,
  uploadFile,
  saveFile,
  constructUrl,
};
export default s3Service;

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_S3_BUCKET_NAME,
  AWS_SECRET_ACCESS_KEY,
} from "../config/aws.config";

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

function uploadFile(key: string, body: any, contentType: string) {
  const uploadParams = {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  return s3.send(new PutObjectCommand(uploadParams));
}

function constructUrl(key: string) {
  return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

const s3Service = {
  uploadFile,
  constructUrl,
};
export default s3Service;

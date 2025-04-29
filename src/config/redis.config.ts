import dotenv from "dotenv";

dotenv.config();

export const REDIS_HOST = process.env.REDIS_HOST as string;
export const REDIS_PORT = parseInt(process.env.REDIS_PORT as string, 10);
export const REDIS_USERNAME = process.env.REDIS_USERNAME as string;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD as string;

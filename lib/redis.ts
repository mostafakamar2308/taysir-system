import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || "localhost";
  const port = process.env.REDIS_PORT || "6379";
  return `redis://${host}:${port}`;
};

export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: null, // Required for BullMQ
});

export const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

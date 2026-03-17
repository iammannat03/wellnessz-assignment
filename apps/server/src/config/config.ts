import { getEnv } from "./env.js";

const env = getEnv();

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_SECRET,
  corsOrigin: env.CORS_ORIGIN,
  cacheTtlSeconds: env.CACHE_TTL_SECONDS,
} as const;


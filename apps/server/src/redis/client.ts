import { createClient, type RedisClientType } from "redis";

export type RedisClient = RedisClientType;

let client: RedisClient | null = null;

export function getRedisClient(redisUrl: string): RedisClient {
  if (client) return client;
  client = createClient({ url: redisUrl });
  client.on("error", () => {
    // handled by readiness endpoint; don't crash on transient errors
  });
  return client;
}

export async function redisPing(c: RedisClient): Promise<boolean> {
  try {
    const res = await c.ping();
    return res === "PONG";
  } catch {
    return false;
  }
}


import type { RedisClient } from "../redis/client.js";

export class CacheService {
  constructor(
    private redis: RedisClient | any,
    private ttlSeconds: number,
  ) {}

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number) {
    try {
      const ttl = ttlSeconds ?? this.ttlSeconds;
      await this.redis.set(key, JSON.stringify(value), { EX: ttl });
    } catch {}
  }

  async delByPrefix(prefix: string) {
    try {
      const iter = this.redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 });
      const keys: string[] = [];
      for await (const key of iter) {
        if (typeof key === "string" && key.length > 0) keys.push(key);
      }
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch {}
  }

  async del(key: string) {
    try {
      await this.redis.del(key);
    } catch {}
  }
}

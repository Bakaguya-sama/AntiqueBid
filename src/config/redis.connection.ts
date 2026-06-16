import Redis, { type RedisOptions } from "ioredis";

export const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const redis = new Redis({
  ...redisOptions,
  maxRetriesPerRequest: 20,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

export default redis;

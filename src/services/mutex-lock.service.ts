import redis from "@/config/redis.connection";
import { setTimeout as sleep } from "timers/promises";

const DEFAULT_LOCK_TTL = 3;
const DEFAULT_RETRY_DELAY = 10;
const DEFAULT_MAX_RETRIES = 50;

class MutexLockService {
  async acquire(key: string, ttl = DEFAULT_LOCK_TTL) {
    const result = await redis.set(this.getKey(key), "1", "EX", ttl, "NX");

    return result === "OK";
  }

  async release(key: string) {
    await redis.del(this.getKey(key));
  }

  async acquireWithRetry(
    key: string,
    ttl?: number,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
  ) {
    for (let attemp = 0; attemp < maxRetries; attemp++) {
      const acquired = await this.acquire(key, ttl);

      if (acquired) return true;

      sleep(retryDelay);
    }
    return false;
  }

  private getKey(key: string) {
    return `lock:${key}`;
  }
}

export const mutexLockService = new MutexLockService();

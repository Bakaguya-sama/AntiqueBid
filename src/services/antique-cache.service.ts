import redis from "@/config/redis.connection";
import { mutexLockService } from "./mutex-lock.service";
const ANTIQUE_CACHE_TTL = 3600;

class AntiqueCacheService {
  async getOrFetch<T>(
    antiqueId: string,
    fetchFn: () => Promise<T>,
  ): Promise<T> {
    const cachedData = await this.getCacheData<T>(antiqueId);
    if (cachedData) {
      console.log(`[CACHE HIT]  antique:${antiqueId}`);

      return cachedData;
    }

    console.log(`[CACHE MISS] antique:${antiqueId} → acquiring lock...`);
    const lockKey = this.getKey(antiqueId);
    const acquired = await mutexLockService.acquireWithRetry(lockKey);

    const cachedAfterLock = await this.getCacheData<T>(antiqueId);
    if (cachedAfterLock) {
      console.log(
        `[LOCK HIT]   antique:${antiqueId} → cache populated by other request`,
      );
      if (acquired) await mutexLockService.release(lockKey);

      return cachedAfterLock;
    }

    if (acquired) {
      console.log(
        `[DB QUERY]   antique:${antiqueId} → only this should appear once!`,
      );
      try {
        const data = await fetchFn();
        await this.setCacheData(antiqueId, data);
        return data;
      } catch (error) {
      } finally {
        mutexLockService.release(lockKey);
      }
    }

    console.warn(
      `[Mutex] Timeout waiting for lock: ${lockKey}, fallback to DB`,
    );
    return await fetchFn();
  }

  async getCacheData<T>(antiqueId: string): Promise<T | null> {
    try {
      const key = this.getKey(antiqueId);
      const data = await redis.get(key);

      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      return null;
    }
  }

  async setCacheData(antiqueId: string, data: unknown): Promise<void> {
    try {
      const key = this.getKey(antiqueId);
      await redis.set(key, JSON.stringify(data), "EX", ANTIQUE_CACHE_TTL);
    } catch (error) {}
  }

  async invalidate(antiqueId: string): Promise<void> {
    try {
      const key = this.getKey(antiqueId);
      await redis.del(key);
    } catch (error) {}
  }

  async invalidateMany(antiqueIds: string[]): Promise<void> {
    if (!antiqueIds.length) return;
    try {
      await redis.del(...antiqueIds.map((id) => this.getKey(id)));
    } catch (error) {}
  }

  private getKey(antiqueId: string) {
    return `antique_details:${antiqueId}`;
  }
}

export const antiqueCacheService = new AntiqueCacheService();

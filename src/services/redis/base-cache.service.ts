import redis from "@/config/redis.connection";
import { mutexLockService } from "./mutex-lock.service";

export abstract class BaseCacheService {
  protected abstract readonly ttl: number;
  protected abstract readonly keyPrefix: string;

  async getOrFetch<T>(id: string, fetchFn: () => Promise<T>): Promise<T> {
    const cachedData = await this.getCacheData<T>(id);
    if (cachedData) {
      console.log(`[CACHE HIT] ${this.keyPrefix}:${id}`);

      return cachedData;
    }

    console.log(`[CACHE MISS] ${this.keyPrefix}:${id} → acquiring lock...`);
    const lockKey = this.getKey(id);
    const acquired = await mutexLockService.acquireWithRetry(lockKey);

    const cachedAfterLock = await this.getCacheData<T>(id);
    if (cachedAfterLock) {
      console.log(
        `[LOCK HIT] ${this.keyPrefix}:${id} → cache populated by other request`,
      );
      if (acquired) await mutexLockService.release(lockKey);

      return cachedAfterLock;
    }

    if (acquired) {
      console.log(
        `[DB QUERY] ${this.keyPrefix}:${id} → only this should appear once!`,
      );
      try {
        const data = await fetchFn();
        await this.setCacheData(id, data);
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

  async getCacheData<T>(id: string): Promise<T | null> {
    try {
      const key = this.getKey(id);
      const data = await redis.get(key);

      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      return null;
    }
  }

  async setCacheData(id: string, data: unknown): Promise<void> {
    try {
      const key = this.getKey(id);
      await redis.set(key, JSON.stringify(data), "EX", this.ttl);
    } catch (error) {}
  }

  async invalidate(id: string): Promise<void> {
    try {
      const key = this.getKey(id);
      await redis.del(key);
    } catch (error) {}
  }

  async invalidateMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    try {
      await redis.del(...ids.map((id) => this.getKey(id)));
    } catch (error) {}
  }

  private getKey(id: string) {
    return `${this.keyPrefix}:${id}`;
  }
}

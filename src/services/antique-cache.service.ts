import redis from "@/config/redis.connection";
const ANTIQUE_CACHE_TTL = 3600;

class AntiqueCacheService {
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

import redis from "@/config/redis.connection";
import bcrypt from "bcrypt";

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
const ACCESS_TOKEN_TTL = 15 * 60;

export class RedisService {
  async saveRefreshToken(
    userId: string,
    refreshToken: string,
    tokenFamily: string,
  ): Promise<void> {
    const key = this.refreshKey(userId, tokenFamily);
    const value = await bcrypt.hash(refreshToken, 10);

    await redis.set(key, value, "EX", REFRESH_TOKEN_TTL);
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
    tokenFamily: string,
  ): Promise<boolean> {
    const key = this.refreshKey(userId, tokenFamily);
    const storedHash = await redis.get(key);

    if (!storedHash) return false;

    return bcrypt.compare(refreshToken, storedHash);
  }

  async revokeRefreshToken(userId: string, tokenFamily: string) {
    const key = this.refreshKey(userId, tokenFamily);

    await redis.del(key);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    const pattern = `rt:${userId}:*`;
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );

      if (keys.length > 0) {
        await redis.del(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== "0");
  }

  async blacklistAccessToken(jti: string, remainingTTL: number): Promise<void> {
    if (remainingTTL <= 0) return;

    const key = this.blacklistKey(jti);

    await redis.set(key, "1", "EX", remainingTTL);
  }

  async isAccessTokenBlacklisted(jti: string) {
    const key = this.blacklistKey(jti);
    const res = await redis.get(key);
    return res != null;
  }

  async incrementLoginAttempts(identifier: string): Promise<number> {
    const key = `rl:login:${identifier}`;

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, 15 * 60);
    }

    return attempts;
  }

  async getLoginAttempts(identifier: string): Promise<number> {
    const key = `rl:login:${identifier}`;
    const val = await redis.get(key);
    return val ? parseInt(val) : 0;
  }

  async resetLoginAttempts(identifier: string): Promise<void> {
    await redis.del(`rl:login:${identifier}`);
  }

  private refreshKey(userId: string, tokenFamily: string): string {
    return `rt:${userId}:${tokenFamily}`;
  }

  private blacklistKey(jti: string): string {
    return `bl:${jti}`;
  }
}

export const redisService = new RedisService();

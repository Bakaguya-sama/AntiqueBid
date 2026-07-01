import redis from "@/config/redis.connection";
const TRENDING_KEY = "trending_auctions";

class TrendingService {
  async incrementScore(auctionId: string, points = 1) {
    await redis.zincrby(TRENDING_KEY, points, auctionId);
  }

  async getTopTrending(limit = 10) {
    return await redis.zrange(TRENDING_KEY, 0, limit - 1, "REV");
  }

  async getAllTrending() {
    return await redis.zrange(TRENDING_KEY, 0, -1, "REV");
  }

  async removeAuction(auctionId: string) {
    await redis.zrem(TRENDING_KEY, auctionId);
  }

  async decayScore(auctionId: string, factor: number) {
    const scores = await redis.zscore(TRENDING_KEY, auctionId);
    if (!scores) return;

    const newScores = Number(scores) * factor;
    if (newScores < 0.5) {
      await redis.zrem(TRENDING_KEY, auctionId);
    } else {
      await redis.zadd(TRENDING_KEY, newScores, auctionId);
    }
  }
}

export const trendingService = new TrendingService();

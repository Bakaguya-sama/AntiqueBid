import { redisOptions } from "@/config/redis.connection";
import { Worker, Job } from "bullmq";
import { trendingService } from "@/services/redis/trending.service";

const DECAY_FACTOR = 0.8;

export const trendingWorker = new Worker(
  "trending-decay",
  async (job: Job) => {
    switch (job.name) {
      case "decay": {
        const trendingAuctions = await trendingService.getAllTrending();

        await Promise.all(
          trendingAuctions.map((val) =>
            trendingService.decayScore(val, DECAY_FACTOR),
          ),
        );
        break;
      }
      default:
        console.warn(`[Queue] Unknown job: ${job.name}`);
    }
  },
  {
    connection: redisOptions,
  },
);

trendingWorker.on("completed", (job) => {
  console.log(`[Queue] ✅ Job ${job.name}:${job.id} completed`);
});

trendingWorker.on("failed", (job, error) => {
  console.error(
    `[Queue] ❌ Job ${job?.name}:${job?.id} failed:`,
    error.message,
  );
});

import { Queue } from "bullmq";
import { redisOptions } from "@/config/redis.connection";

export const trendingQueue = new Queue("trending-decay", {
  connection: redisOptions,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000,
  },
});

export async function scheduleTrendingDecay() {
  const repeatableJobs = await trendingQueue.getJobSchedulers();
  for (const job of repeatableJobs) {
    if (job.id === "trending-decay-job") {
      await trendingQueue.removeJobScheduler(job.key);
    }
  }

  await trendingQueue.add(
    "decay",
    {},
    {
      repeat: { every: 60 * 1000 * 60 },
      jobId: "trending-decay-job",
    },
  );
}

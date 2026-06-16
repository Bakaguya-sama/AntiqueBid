import { Queue } from "bullmq";
import { redisOptions } from "@/config/redis.connection";

export interface AuctionFinishJobData {
  auctionId: string;
}

export interface AuctionExtendJobData {
  auctionId: string;
  newEndsAt: string;
}

export const auctionQueue = new Queue("auction", {
  connection: redisOptions,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export async function scheduleAuctionFinish(
  auctionId: string,
  endsAt: Date,
): Promise<void> {
  const delay = endsAt.getTime() - Date.now();

  await auctionQueue.add(
    "finish-auction",
    {
      auctionId,
    },
    {
      delay,
      jobId: `finish-${auctionId}`,
    },
  );
}

export async function rescheduleAuctionFinish(
  auctionId: string,
  newEndsAt: Date,
): Promise<void> {
  const existingJob = await auctionQueue.getJob(`finish-${auctionId}`);
  if (existingJob) existingJob.remove();

  await scheduleAuctionFinish(auctionId, newEndsAt);
}

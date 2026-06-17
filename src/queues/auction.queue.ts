import { Queue } from "bullmq";
import { redisOptions } from "@/config/redis.connection";

export interface AuctionFinishJobData {
  auctionId: string;
}

export interface AuctionStartJobData {
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
      delay: Math.max(0, delay),
      jobId: `finish-${auctionId}`,
    },
  );
}

export async function scheduleAuctionStart(
  auctionId: string,
  startsAt: Date,
): Promise<void> {
  const delay = startsAt.getTime() - Date.now();

  await auctionQueue.add(
    "start-auction",
    {
      auctionId,
    },
    {
      delay: Math.max(0, delay),
      jobId: `start-${auctionId}`,
    },
  );
}

export async function rescheduleAuctionFinish(
  auctionId: string,
  newEndsAt: Date,
): Promise<void> {
  const existingJob = await auctionQueue.getJob(`finish-${auctionId}`);
  if (existingJob) await existingJob.remove();

  await scheduleAuctionFinish(auctionId, newEndsAt);
}

export async function rescheduleAuctionStart(
  auctionId: string,
  newStartsAt: Date,
): Promise<void> {
  const existingJob = await auctionQueue.getJob(`start-${auctionId}`);
  if (existingJob) await existingJob.remove();

  await scheduleAuctionStart(auctionId, newStartsAt);
}

export async function removeJobFromAuctionQueue(
  activity: string,
  auctionId: string,
): Promise<void> {
  const existingJob = await auctionQueue.getJob(`${activity}-${auctionId}`);
  if (existingJob) await existingJob.remove();
}

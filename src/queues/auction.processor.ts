import { redisOptions } from "@/config/redis.connection";
import { AuctionFinishJobData, AuctionStartJobData } from "./auction.queue";
import { Worker, Job } from "bullmq";
import { auctionService } from "@/modules/auction/auction.service";

export const auctionWorker = new Worker(
  "auction",
  async (job: Job) => {
    switch (job.name) {
      case "finish-auction": {
        const { auctionId } = job.data as AuctionFinishJobData;
        console.log(`[Queue] Finishing auction ${auctionId}`);
        await auctionService.finishAuction(auctionId);
        break;
      }
      case "start-auction": {
        const { auctionId } = job.data as AuctionStartJobData;
        console.log(`[Queue] Activating auction ${auctionId}`);
        await auctionService.startAuction(auctionId);
        break;
      }
      default:
        console.warn(`[Queue] Unknown job: ${job.name}`);
    }
  },
  {
    connection: redisOptions,
    concurrency: 5,
  },
);

auctionWorker.on("completed", (job) => {
  console.log(`[Queue] ✅ Job ${job.name}:${job.id} completed`);
});

auctionWorker.on("failed", (job, error) => {
  console.error(
    `[Queue] ❌ Job ${job?.name}:${job?.id} failed:`,
    error.message,
  );
});

import { redisOptions } from "@/config/redis.connection";
import { AuctionFinishJobData, AuctionStartJobData } from "./auction.queue";
import { Worker, Job } from "bullmq";
import { auctionService } from "@/modules/auction/auction.service";
import { getIO } from "@/config/socket.config";

export const auctionWorker = new Worker(
  "auction",
  async (job: Job) => {
    switch (job.name) {
      case "finish-auction": {
        const { auctionId } = job.data as AuctionFinishJobData;
        console.log(`[Queue] Finishing auction ${auctionId}`);
        const finished = await auctionService.finishAuction(auctionId);

        if (finished) {
          const io = getIO();
          io.to(`auction:${auctionId}`).emit("auction:finished", {
            auctionId,
            winnerId: finished.winnerId,
          });
        }

        break;
      }
      case "start-auction": {
        const { auctionId } = job.data as AuctionStartJobData;
        console.log(`[Queue] Activating auction ${auctionId}`);
        const activeAuction = await auctionService.startAuction(auctionId);

        if (activeAuction) {
          const io = getIO();
          io.to(`auction:${auctionId}`).emit("auction:start", {
            auctionId,
          });
        }

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

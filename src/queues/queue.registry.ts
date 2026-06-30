import { auctionWorker } from "./auction/auction.processor";
import { trendingWorker } from "./trending/trending.processor";
import { scheduleTrendingDecay } from "./trending/trending.queue";

export function startQueues(): void {
  console.log("🚀 Queue workers started");
  scheduleTrendingDecay().catch((err) =>
    console.error("Failed to schedule trending decay job:", err),
  );

  process.on("SIGTERM", async () => {
    await Promise.all([auctionWorker.close(), trendingWorker.close()]);

    console.log("Queue workers stopped");
  });
}

import { auctionWorker } from "./auction.processor";

export function startQueues(): void {
  console.log("🚀 Queue workers started");

  process.on("SIGTERM", async () => {
    await auctionWorker.close();
    console.log("Queue workers stopped");
  });
}

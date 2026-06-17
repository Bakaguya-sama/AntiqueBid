import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { auctionQueue } from "@/queues/auction.queue";
import { Express } from "express";

export function setupBullBoard(app: Express) {
  if (process.env.NODE_ENV !== "development") return;

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(auctionQueue)],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
  console.log("🎯 Bull Board: http://localhost:3000/admin/queues");
}

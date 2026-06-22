import { Socket } from "socket.io";
import redis from "@/config/redis.connection";
import { auctionService } from "@/modules/auction/auction.service";

export function registerAuctionHandlers(socket: Socket) {
  socket.on("auction:join", async (auctionId: string) => {
    const { valid, message } =
      await auctionService.validateAuctionJoinable(auctionId);

    if (!valid) {
      socket.emit("auction:error", {
        auctionId,
        message,
      });
      return;
    }

    socket.join(`auction:${auctionId}`);

    const userId = socket.data.userId!;

    if (!socket.data.joinedAuctions) {
      socket.data.joinedAuctions = new Set();
    }
    socket.data.joinedAuctions.add(auctionId);

    const viewerCount = await addViewer(auctionId, userId);

    socket.emit("auction:viewer_count", {
      auctionId,
      viewerCount,
    });

    socket.to(`auction:${auctionId}`).emit("auction:user_joined", {
      auctionId,
      userId,
      viewerCount,
    });

    console.log(`User ${socket.data.userId} joined auction:${auctionId}`);
  });

  socket.on("auction:leave", async (auctionId: string) => {
    socket.leave(`auction:${auctionId}`);

    const userId = socket.data.userId!;
    const viewerCount = await removeViewer(auctionId, userId);

    socket.data.joinedAuctions?.delete(auctionId);

    socket.to(`auction:${auctionId}`).emit("auction:user_left", {
      auctionId,
      userId,
      viewerCount,
    });

    console.log(`User ${socket.data.userId} left auction:${auctionId}`);
  });

  socket.on("disconnect", async () => {
    const auctions = socket.data.joinedAuctions;
    if (!auctions || auctions.size === 0) return;

    for (const auctionId of auctions) {
      const viewerCount = await removeViewer(auctionId, socket.data.userId!);
      socket.to(`auction:${auctionId}`).emit("auction:user_left", {
        auctionId,
        userId: socket.data.userId!,
        viewerCount,
      });
    }
  });
}

async function addViewer(auctionId: string, userId: string) {
  const key = `viewers:${auctionId}`;

  await redis.sadd(key, userId);
  await redis.expire(key, 3600);
  return await redis.scard(key);
}

async function removeViewer(auctionId: string, userId: string) {
  const key = `viewers:${auctionId}`;

  await redis.srem(key, userId);
  return await redis.scard(key);
}

import { TypedServer } from "@/config/socket.config";
import { socketAuthMiddleware } from "./socket.middleware";
import { registerAuctionHandlers } from "./handlers/auction.socket";

export function registerSocketHandlers(io: TypedServer) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.data.userId})`);

    registerAuctionHandlers(socket);
    // registerNotificationHandlers(socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

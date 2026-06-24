import { Socket } from "socket.io";

export function registerNotificationHandlers(socket: Socket) {
  socket.on("notification:join", async () => {
    const userId = socket.data.userId!;

    socket.join(`notification:${userId}`);
    console.log(`User ${socket.data.userId} joined notification:${userId}`);
  });

  socket.on("notification:leave", async () => {
    const userId = socket.data.userId!;

    socket.leave(`notification:${userId}`);
    console.log(`User ${socket.data.userId} left notification:${userId}`);
  });
}

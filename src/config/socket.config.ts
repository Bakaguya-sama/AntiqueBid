import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "@/sockets/socket.types";

export type TypedServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

let io: TypedServer;

export function initSocketServer(httpServer: HTTPServer): TypedServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:3000"],
      credentials: true,
    },
  });

  return io;
}

export function getIO(): TypedServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

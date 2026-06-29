import app from "./app";
import dotenv from "dotenv";
import redis from "./config/redis.connection";
import { createServer } from "http";
import { initSocketServer } from "./config/socket.config";
import { registerSocketHandlers } from "./sockets/socket.registry";
import { startQueues } from "./queues/queue.registry";

dotenv.config(); // Load biến môi trường từ file .env

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = initSocketServer(httpServer);
registerSocketHandlers(io);

startQueues();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running smoothly on port ${PORT}`);
  console.log(`👉 Check health at: http://localhost:${PORT}/api/health`);
});

const shutdown = (signal: string) => {
  console.log(`🛑 Received ${signal}. Shutting down...`);
  httpServer.close(async () => {
    try {
      await redis.quit();
    } catch (err) {
      console.error("❌ Redis quit error:", err);
    } finally {
      process.exit(0);
    }
  });

  // Force shutdown if close hangs
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Bắt các lỗi văng ra ngoài không lường trước được
process.on("unhandledRejection", (err: any) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  httpServer.close(() => {
    process.exit(1);
  });
});

import fs from "fs";
import path from "path";

// Redirect console.log ra file khi cần debug
const logFile = fs.createWriteStream(
  path.join(process.cwd(), "debug.log"),
  { flags: "w" }, // "w" = ghi đè mỗi lần start | "a" = append
);

const originalLog = console.log;
console.log = (...args) => {
  const message = args.map(String).join(" ");
  logFile.write(`${message}\n`);
  originalLog(...args); // Vẫn hiện trên terminal
};

import app from "./app";
import dotenv from "dotenv";
import redis from "./config/redis.connection";

dotenv.config(); // Load biến môi trường từ file .env

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running smoothly on port ${PORT}`);
  console.log(`👉 Check health at: http://localhost:${PORT}/api/health`);
});

const shutdown = (signal: string) => {
  console.log(`🛑 Received ${signal}. Shutting down...`);
  server.close(async () => {
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
  server.close(() => {
    process.exit(1);
  });
});

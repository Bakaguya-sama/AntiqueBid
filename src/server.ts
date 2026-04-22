import app from "./app";
import dotenv from "dotenv";

dotenv.config(); // Load biến môi trường từ file .env

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running smoothly on port ${PORT}`);
  console.log(`👉 Check health at: http://localhost:${PORT}/api/health`);
});

// Bắt các lỗi văng ra ngoài không lường trước được
process.on("unhandledRejection", (err: any) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// src/app.js
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoute from "@/modules/auth/auth.routes";

const app = express();

// 1. Middlewares cơ bản
app.use(helmet()); // Bảo mật
app.use(cors()); // Cho phép cross-origin
app.use(morgan("dev")); // Log request
app.use(express.json()); // Đọc data dạng JSON từ body

// 2. Test Route (Hello World)
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Antique Bid API is up and running!",
  });
});

// 3. TODO: Khai báo các Routes chính ở đây sau (Auth, Auctions, Bids...)
app.use("/api/v1/auth", authRoute);

// 4. TODO: Global Error Handler ở đây sau

export default app;

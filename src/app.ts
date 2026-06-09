// src/app.js
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoute from "@/modules/auth/auth.routes";
import { authenticate } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/global-error-handler.middleware";
import passport from "@/config/passport.config";

const app = express();

// 1. Middlewares cơ bản
app.use(helmet()); // Bảo mật
app.use(cors()); // Cho phép cross-origin
app.use(morgan("dev")); // Log request
app.use(express.json()); // Đọc data dạng JSON từ body
app.use(passport.initialize()); // ← Thêm dòng này, KHÔNG dùng passport.session()

// 3. TODO: Khai báo các Routes chính ở đây sau (Auth, Auctions, Bids...)
app.use("/api/v1/auth", authRoute);

// 4. TODO: Global Error Handler ở đây sau
app.use(errorHandler);

export default app;

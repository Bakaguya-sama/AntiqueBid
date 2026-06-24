// src/app.js
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoute from "@/modules/auth/auth.routes";
import antiqueRoute from "@/modules/antique/antique.routes";
import auctionRoute from "@/modules/auction/auction.routes";
import notificationRoute from "@/modules/notification/notification.routes";
import categoryRoute from "@/modules/antique-category/antique-category.routes";
import { authenticate } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/global-error-handler.middleware";
import { userOnly, adminOnly, anyUser } from "./middlewares/role.middleware";
import passport from "@/config/passport.config";
import { setupBullBoard } from "./config/bull-board";

const app = express();

setupBullBoard(app);

// 1. Middlewares cơ bản
app.use(helmet()); // Bảo mật
app.use(cors()); // Cho phép cross-origin
app.use(morgan("dev")); // Log request
app.use(express.json()); // Đọc data dạng JSON từ body
app.use(passport.initialize()); // ← Thêm dòng này, KHÔNG dùng passport.session()

// 3. TODO: Khai báo các Routes chính ở đây sau (Auth, Auctions, Bids...)
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/antique", authenticate, userOnly, antiqueRoute);
app.use("/api/v1/auction", authenticate, userOnly, auctionRoute);
app.use("/api/v1/notification", authenticate, anyUser, notificationRoute);
app.use("/api/v1/category", authenticate, categoryRoute);

app.use(errorHandler);

export default app;

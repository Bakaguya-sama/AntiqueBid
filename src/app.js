// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// 1. Middlewares cơ bản
app.use(helmet()); // Bảo mật
app.use(cors()); // Cho phép cross-origin
app.use(morgan("dev")); // Log request
app.use(express.json()); // Đọc data dạng JSON từ body

// 2. Test Route (Hello World)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Antique Bid API is up and running!",
  });
});

// 3. TODO: Khai báo các Routes chính ở đây sau (Auth, Auctions, Bids...)

// 4. TODO: Global Error Handler ở đây sau

module.exports = app;

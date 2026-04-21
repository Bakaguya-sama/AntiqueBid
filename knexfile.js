require("dotenv").config();
require;
module.exports = {
  development: {
    client: "pg", // postgresql
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: "./src/database/migrations", // Nơi chứa các file tạo bảng
    },
    seeds: {
      directory: "./src/database/seeds", // Nơi chứa data mẫu
    },
  },
};

# AntiqueBid - Real-Time Antique Auction Platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Typescript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF6B6B?style=for-the-badge&logo=bull&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)

## Description

**AntiqueBid** is a backend-focused real-time digital auction platform built for trading antique items. It enables sellers to list antiques for auction and buyers to place competitive bids in a live, time-sensitive environment — with automated auction lifecycle management, anti-sniping protection, and instant price broadcasting.

The project is built as a RESTful API server using a strict Controller-Service-Repository layered architecture, ensuring high maintainability, separation of concerns, and scalability.

### ✨ Features

- **🔐 Authentication & Security:** Secure JWT authentication with access/refresh token rotation, Redis-based token blacklisting, and Google OAuth2 integration via Passport.js.
- **🏺 Antique Management:** Full CRUD for antique items with category support, soft delete, status tracking (available, sold), and Redis Cache-Aside caching for high-read items.
- **🔨 Auction Lifecycle:** Automated auction status transitions (not_started → active → finished/cancelled) driven by BullMQ delayed job queues — no CPU blocking.
- **⏱️ Anti-Sniping Protection:** Dynamically extends auction deadlines when bids are placed within the final time window, preventing last-second sniping. BullMQ jobs are rescheduled accordingly.
- **💸 High-Concurrency Bidding:** `SELECT FOR UPDATE` row locking combined with `Serializable` transaction isolation prevents race conditions when multiple users bid simultaneously.
- **📡 Real-time Updates:** Socket.IO broadcasts live price updates, auction finish events, and viewer presence to all participants in an auction room with sub-second latency.
- **🔔 Notification System:** Personal and system-wide notifications with per-user read tracking via a dedicated `NotificationReadReceipt` table.
- **🚦 Rate Limiting:** Redis atomic `SET NX` prevents bid spamming and brute-force login attempts.
- **📋 OTP Verification:** Redis-backed email OTP flow for account registration and password reset, with bcrypt hashing and attempt limiting.

## Installation

This project uses **pnpm** as the package manager.

### Requirements

- Node.js v18+
- PostgreSQL (local or cloud)
- Redis (local via Memurai on Windows, or Upstash for cloud)
- Google OAuth2 credentials (Google Cloud Console)
- SMTP credentials (for OTP email delivery)

### Setup Steps

1.  **Clone the repository:**

    ```bash
    git clone <your-repo-url>
    cd AntiqueBid
    ```

2.  **Install dependencies from the root directory:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory. If an example file (`.env.example`) is provided, you can copy it.

    ```env
    # Server
    PORT=3000
    NODE_ENV=development

    # Database
    DATABASE_URL=postgresql://user:password@localhost:5432/antiquebid

    # Redis
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    REDIS_PASSWORD=your_redis_password

    # JWT
    JWT_ACCESS_SECRET=your_access_secret
    JWT_REFRESH_SECRET=your_refresh_secret

    # Google OAuth2
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

    # Client (Frontend URL for OAuth redirect)
    CLIENT_URL=http://localhost:5173

    # Email (for OTP)
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    ```

4.  **Run database migrations:**
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```

## Usage / Development

Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`.

## Roadmap

- [ ] Distributed Mutex Lock (`SETNX`) for Cache Stampede prevention
- [ ] WebSocket support for real-time admin monitoring dashboard
- [ ] Image upload for antique items (Cloudinary integration)
- [ ] Frontend client (React + Vite)
- [ ] Containerization with Docker & Docker Compose
- [ ] Unit and integration testing (Jest + Supertest)
- [ ] CI/CD pipeline (GitHub Actions)

## Authors

Personal Project — University of Information Technology (UIT), VNU-HCM

- **Vu Quoc Huy** (Student ID: 23520657) — Backend Developer

## License

This project is licensed under the MIT License.

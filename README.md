# Wellness Challenge Tracker

A full-stack wellness challenge tracker where users can register, join habit-based challenges (steps, meditation, water intake), log daily progress, and view leaderboards.

## Tech Stack


| Layer     | Technology                     |
| --------- | ------------------------------ |
| Backend   | Node.js, Express 5             |
| Database  | MongoDB (Mongoose)             |
| Cache     | Redis                          |
| Auth      | JWT, Argon2 (password hashing) |
| API Docs  | OpenAPI / Swagger (tsoa)       |
| Container | Docker, docker-compose         |
| Frontend  | Next.js 16 (App Router)        |


## Prerequisites

- **Node.js** 18+ (or Bun)
- **Docker & Docker Compose** (for MongoDB, Redis, and optionally running the whole stack)
- **MongoDB** (local or Docker)
- **Redis** (local or Docker)

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/iammannat03/wellnessz-assignment.git
cd wellnessz-assignment
bun install   # or: npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

**Server env vars** (required for backend):


| Variable            | Description                           | Example (local)                       |
| ------------------- | ------------------------------------- | ------------------------------------- |
| `MONGO_URI`         | MongoDB connection string             | `mongodb://localhost:27017/wellnessz` |
| `REDIS_URL`         | Redis connection string               | `redis://localhost:6379`              |
| `JWT_SECRET`        | Secret for JWT signing (min 16 chars) | `your-secret-at-least-16-chars`       |
| `PORT`              | Server port (optional)                | `4000`                                |
| `CORS_ORIGIN`       | Allowed origins (optional)            | `http://localhost:3000`               |
| `CACHE_TTL_SECONDS` | Redis cache TTL (optional)            | `60`                                  |


**Frontend env vars** (required for web app):


| Variable              | Description  | Example                 |
| --------------------- | ------------ | ----------------------- |
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:4000` |


Create `apps/web/.env.local` with `NEXT_PUBLIC_API_URL` when running the frontend separately.

## Running the Application

### Option A: Docker Compose (all services)

Starts backend, frontend, MongoDB, and Redis.

```bash
# Build and run
docker-compose up --build

# Backend:  http://localhost:4000
# Frontend: http://localhost:3000
# MongoDB:   localhost:27017
# Redis:    localhost:6379
```

Set `JWT_SECRET` before running (e.g. `export JWT_SECRET=your-secret-min-16-chars`).

### Option B: Local development (backend + frontend separately)

**Terminal 1 – MongoDB & Redis**

```bash
docker run -d -p 27017:27017 mongo:8
docker run -d -p 6379:6379 redis:7-alpine
```

**Terminal 2 – Backend**

```bash
cd apps/server
# Ensure .env has MONGO_URI, REDIS_URL, JWT_SECRET
bun run dev   # or: npm run dev
# API: http://localhost:4000
```

**Terminal 3 – Frontend**

```bash
cd apps/web
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
bun run dev   # or: npm run dev
# App: http://localhost:3000
```

### Option C: Turborepo (backend + frontend together)

```bash
turbo dev
# Backend: http://localhost:4000
# Frontend: http://localhost:3000
```

Ensure MongoDB and Redis are running, and env vars are set (e.g. in root `.env` or `apps/server/.env`).

---

## API Documentation (Swagger)

**Swagger UI:** [http://localhost:4000/docs](http://localhost:4000/docs)

The API documentation is generated from the code (tsoa + OpenAPI 3) and served at `/docs` when the backend is running.

### Obtaining a JWT

1. **Register** – `POST /auth/register` with `{ "email": "...", "password": "...", "name": "..." }`
2. **Login** – `POST /auth/login` with `{ "email": "...", "password": "..." }`
3. Both return `{ "token": "<jwt>", "user": {...} }`

### Using the JWT

Include the token in the `Authorization` header for protected routes:

```
Authorization: Bearer <your-jwt-token>
```

Example:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/me
```

---

## Example API Requests

### Register

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create Challenge (requires JWT)

```bash
curl -X POST http://localhost:4000/challenges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title":"Daily Steps",
    "description":"Walk 8000 steps daily",
    "metric":"steps",
    "dailyTarget":8000,
    "startDate":"2025-03-17",
    "endDate":"2025-03-24",
    "visibility":"public"
  }'
```

### List Challenges

```bash
curl "http://localhost:4000/challenges"
curl "http://localhost:4000/challenges?metric=steps&active=true"
```

### Join Challenge (requires JWT)

```bash
curl -X POST http://localhost:4000/challenges/CHALLENGE_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Log Progress (requires JWT)

```bash
curl -X POST http://localhost:4000/challenges/CHALLENGE_ID/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":8500}'
```

### Leaderboard

```bash
curl "http://localhost:4000/challenges/CHALLENGE_ID/leaderboard"
```

### Health Endpoints

```bash
curl http://localhost:4000/health/live
curl http://localhost:4000/health/ready
```

---

## Frontend

### How to Run

```bash
cd apps/web
bun run dev   # or: npm run dev
```

Runs on [http://localhost:3000](http://localhost:3000).

### Environment Variables


| Variable              | Required | Description          |
| --------------------- | -------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | Yes      | Backend API base URL |


Create `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Implemented Pages


| Route              | Description                                 |
| ------------------ | ------------------------------------------- |
| `/`                | Landing / hero (redirects if logged in)     |
| `/login`           | Login form                                  |
| `/register`        | Registration form                           |
| `/challenges`      | Browse public challenges, create new        |
| `/challenges/[id]` | Challenge detail, leaderboard, log progress |
| `/my/challenges`   | User's joined challenges                    |


---

## Project Structure

```
├── apps/
│   ├── server/     # Express backend (port 4000)
│   └── web/        # Next.js frontend (port 3000)
├── packages/
│   ├── contracts/  # Shared API types
│   └── ...
├── docker-compose.yml
├── .env.example
└── README.md
```


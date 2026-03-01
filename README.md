# QuestXP

> **Learning platform first, game second.** QuestXP turns any YouTube playlist into a structured, gamified course — with XP, streaks, AI-generated notes, and a Doubt chatbot.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS 3 + Framer Motion |
| Backend | Node.js + Express + MongoDB (Mongoose) |
| Queue | BullMQ + Redis |
| Auth | JWT (HttpOnly cookies) + Google OAuth |
| AI Pipeline | Whisper (transcription) + GPT / Gemini (notes, quizzes) |
| Deployment | Docker Compose |

---

## Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas URI)
- Redis (local or Upstash)
- Google OAuth Client ID + Secret
- (Optional) AI API key (OpenAI / Google)

---

## Quick Start (Local Development)

### 1. Clone & install dependencies

```bash
git clone https://github.com/your-org/questxp.git
cd questxp

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# → Fill in: MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
#            REDIS_URL, FRONTEND_URL

# Frontend
cp frontend/.env.example frontend/.env
# → Set VITE_API_URL (leave empty to use the Vite dev proxy at /api)
```

### 3. Start services

```bash
# Backend (with nodemon)
cd backend && npm run dev

# Frontend (dev server with proxy)
cd frontend && npm run dev
```

Frontend runs on **http://localhost:5173** → API calls at `/api/*` are proxied to `http://localhost:5000`.

---

## Docker Compose (Full Stack)

```bash
docker compose up --build
```

Starts MongoDB, Redis, Node backend, and Vite preview together.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Email/password registration |
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Current user + streak |
| POST | `/api/courses` | Create a new course |
| GET | `/api/courses` | List user's courses |
| GET | `/api/courses/:id` | Course detail |
| GET | `/api/courses/:id/status` | Processing status |
| PATCH | `/api/courses/:id/sections` | Add a section to an existing course |
| POST | `/api/progress/:courseId/lectures/:lectureId/watch` | Mark lecture watched + award XP |
| GET | `/api/progress/:courseId` | Course progress |
| GET | `/api/plan/today` | Today's study targets |

---

## Project Structure

```
questxp/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # auth, featureGate
│   │   ├── models/        # Mongoose schemas
│   │   ├── queues/        # BullMQ queue definitions
│   │   ├── routes/        # Express routers
│   │   ├── services/      # Business logic (xp, streak, studyPlan…)
│   │   └── workers/       # BullMQ workers (course, streak)
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI (Gamification, Dashboard, Course…)
│   │   ├── pages/         # Route-level page components
│   │   ├── services/      # Axios API client
│   │   └── store/         # Zustand stores (auth, gamification)
│   └── .env.example
│
├── design-system/         # QuestXP design tokens, page specs
├── specs/                 # Feature specs (001–005)
└── docker-compose.yml
```

---

## Design System

All UI follows the **QuestXP Master Design System** at [`design-system/questxp/MASTER.md`](./design-system/questxp/MASTER.md).

Key rules:
- **Zero** animations during video playback
- XP / badge toasts only fire **after** lecture or quiz completion
- Primary: `#38BDF8` (sky blue) · Background: `#050505` (true black)
- Fonts: Space Grotesk (headings) · Inter (body) · JetBrains Mono (code)

---

## Gamification XP Table

| Trigger | XP |
|---------|----|
| Lecture completed (≥ 80%) | +30 |
| Lecture started | +5 |
| Streak day maintained | +20 |
| Daily goal met | +50 |
| Daily goal exceeded | +80 |
| Quiz passed | +40 |
| Quiz aced | +75 |

Level unlocks: Doubt Chatbot (L2) · Study Plan (L3) · Unlimited Chatbot (L4).

---

## Development Notes

> ⚠️ **Auth bypass active**: `useAuthStore.checkAuth` is mocked for UI testing. Re-enable before production.
> ⚠️ **401 redirect disabled**: `api.js` interceptor bypass is commented in. Re-enable for production.
> ⚠️ Set `NODE_ENV=production` to hide error stack traces from API responses.

---

## License

MIT © QuestXP

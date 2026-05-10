<p align="center">
  <img src="frontend/public/logo.png" width="120" alt="QuestXP Logo">
</p>

<h1 align="center">QuestXP</h1>

<p align="center">
  <strong>Advanced Gamified Learning and Productivity Ecosystem</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.5.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/status-production-success.svg" alt="Status">
</p>

<p align="center">
  QuestXP is a high-performance Learning Management System (LMS) designed to solve "Playlist Fatigue." It converts unstructured YouTube content into structured curricula using AI orchestration, vector-based RAG, and an adaptive scheduling engine.
</p>

---

## 🏗️ System Architecture

QuestXP utilizes a **Decoupled Monolith** architecture with an **Event-Driven AI Pipeline**.

### Backend (Node.js/Express)
- **Layered Pattern**: Strictly separates `Routes` -> `Middleware` -> `Services` (Business Logic) -> `Models` (Data).
- **Identity & Security**: JWT-based authentication with HttpOnly cookies and RBAC (Role-Based Access Control).
- **Worker Tier**: BullMQ + Redis cluster for non-blocking execution of compute-intensive AI tasks (Transcription, Summarization).

### Frontend (React/Vite)
- **State Management**: Zustand for global UI/Auth state; TanStack Query for declarative server-state synchronization.
- **Design System**: Atomic-based Tailwind configuration with a custom glassmorphic aesthetic.
- **Performance**: Code-splitting and optimized re-render cycles using Framer Motion for micro-interactions.

---

## 📊 Interface Preview

<table style="width: 100%;">
  <tr>
    <td align="center"><b>Landing Page</b></td>
    <td align="center"><b>Productivity Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="frontend/public/screenshots/landing.png" alt="Landing Page"></td>
    <td><img src="frontend/public/screenshots/dashboard.png" alt="Dashboard"></td>
  </tr>
  <tr>
    <td align="center"><b>Adaptive Roadmap</b></td>
    <td align="center"><b>Leaderboard (Hall of Fame)</b></td>
  </tr>
  <tr>
    <td><img src="frontend/public/screenshots/roadmap.png" alt="Roadmap"></td>
    <td><img src="frontend/public/screenshots/leaderboard.png" alt="Leaderboard"></td>
  </tr>
  <tr>
    <td align="center"><b>Learning Analytics</b></td>
    <td align="center"><b>Identity Management</b></td>
  </tr>
  <tr>
    <td><img src="frontend/public/screenshots/streak.png" alt="Analytics"></td>
    <td><img src="frontend/public/screenshots/profile.png" alt="Profile"></td>
  </tr>
</table>

---

## 🗄️ Database Schema (MongoDB)

### 1. User Model
Core entity for identity and progress tracking.
- `totalXP / level`: Gamification anchors.
- `streak`: Tracks `current`, `longest`, and `lastStudiedDate`.
- `fcmToken`: Firebase token for cross-platform notifications.
- `username`: Anime-themed handle (unique, identity-protected).

### 2. Course Model
The backbone of the curriculum.
- `sections`: Nested array containing `lectures`.
- `aiStatus`: Granular tracking of `transcription`, `notes`, `quiz`, and `embedding` statuses per lecture.
- `topics`: Automated timestamp-based lecture segmentation.

### 3. Progress Model
- Junction collection mapping `User` <-> `Course` <-> `Lecture`.
- Tracks completion percentages and mastery levels.

### 4. Roadmap Model
- Stores calculated study dates for the adaptive planner.
- Enables downstream recalculation without mutating the original Course model.

---

## 🧠 Core Technical Logic

### AI Pipeline (Event-Driven)
When a course is added, a job is enqueued in BullMQ:
1.  **Metadata Extraction**: Fetches playlist data via YouTube Data API v3.
2.  **Transcription**: Extracts raw captions or generates them via Whisper-equivalents.
3.  **Refinement**: Gemini 1.5 Flash generates lecture notes, key takeaways, and quizzes.
4.  **Vectorization**: Content is chunked and stored in **Pinecone** for RAG-based chat.

### Surgical Adaptive Study Planner
The `Roadmap.jsx` logic uses a **Linear Propagation Algorithm**:
- **Forward Shift (+)**: Incrementing a date pushes all downstream lecture deadlines by `N` days, accounting for weekends/user capacity.
- **Backward Shift (-)**: Compresses the schedule if a user finishes early.
- **Dynamic Recalculation**: The entire downstream pipeline is updated in $O(n)$ time on each click.

### RAG-Powered Doubt Resolution
- Uses **Cosine Similarity** to search the vector space (Pinecone) for relevant lecture context.
- Augments the LLM prompt with retrieved chunks to ensure zero-hallucination answers.
- **Fallback Logic**: Switches from Gemini to Llama 3.2 via OpenRouter if rate limits are hit.

---

## 🚀 API Surface

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/google` | OAuth 2.0 Identity Resolution |
| `POST` | `/api/courses/add` | Enqueue course processing job |
| `GET` | `/api/lectures/:id/notes` | Fetch AI-generated lecture summary |
| `POST` | `/api/lectures/:id/quiz/submit` | Evaluate quiz & award XP |
| `POST` | `/api/doubt/ask` | Contextual RAG-based query resolution |
| `PATCH` | `/api/roadmap/update` | Mutate downstream study schedule |

---

## 🛠️ Technical Stack

- **Runtime**: Node.js v20+
- **Database**: MongoDB (Atlas) / Pinecone (Vector)
- **Caching/Queue**: Redis / BullMQ
- **AI Models**: Gemini 1.5 Flash, Llama 3.2
- **Notification**: Firebase Cloud Messaging (FCM)
- **Deployment**: Vercel (Frontend), Railway (Backend/Redis/Worker)

---

## 🔧 Installation

```bash
# 1. Clone & Install
git clone https://github.com/parthpatidar03/QuestXP.git
cd QuestXP && npm run install-all

# 2. Setup Environment
# Create .env files in /backend and /frontend based on .env.example

# 3. Launch Services (Docker Recommended)
docker-compose up --build
```

---

## 📄 License
MIT License. Developed by Parth Patidar.

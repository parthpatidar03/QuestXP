<p align="center">
  <a href="https://www.questxp.in/">
    <img src="https://img.shields.io/badge/LIVE_DEMO-QuestXP-green?style=for-the-badge&logo=vercel" alt="Live Demo">
  </a>
</p>

<p align="center">
  <img src="frontend/public/favicon.png" width="120" alt="QuestXP Logo">
</p>

<h1 align="center">QuestXP</h1>

<p align="center">
  <strong>Advanced Gamified Learning and Productivity Ecosystem</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.11.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/status-production-success.svg" alt="Status">
</p>

QuestXP is a high-performance Learning Management System (LMS) designed to solve "Playlist Fatigue." It converts unstructured YouTube content—including massive 10+ hour "one-shot" lectures—into structured, modular curricula using AI orchestration, vector-based RAG, and an adaptive scheduling engine.

---

## 🏗️ System Architecture

QuestXP utilizes a **Decoupled Monolith** architecture with an **Event-Driven AI Pipeline**.

### Backend (Node.js/Express)
- **Layered Pattern**: `Routes` -> `Middleware` -> `Services` -> `Controllers` -> `Models`.
- **Identity & Security**: JWT-based authentication with a **Dual-Mode System** supporting both `HttpOnly` cookies and `Authorization: Bearer` headers.
- **Worker Tier**: BullMQ + Redis cluster for non-blocking execution of AI tasks (Transcription, Summarization).

### Frontend (React/Vite)
- **State Management**: Zustand (UI/Auth) & TanStack Query (Server-state).
- **Design System**: Atomic-based Tailwind configuration with a custom glassmorphic aesthetic.

---

## 🛠️ Technical Stack

- **Runtime**: Node.js v20+
- **Database**: MongoDB (Atlas) / Pinecone (Vector)
- **Caching/Queue**: Redis / BullMQ
- **AI Models**: OpenAI (GPT-4o-mini)
- **Notification**: Firebase Cloud Messaging (FCM)
- **Deployment**: Vercel (Frontend), Railway (Backend)

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

## 🗺️ Surgical Adaptive Roadmap Algorithm (v2)
QuestXP's roadmap engine is designed for realism, not perfection.
- **75% Efficiency Rule**: Realistic scheduling accounting for note-taking.
- **Granular Scheduling**: Shift specific videos without breaking the entire plan.
- **Universal Roadmap Hub**: Centralized management of all active study plans.
- **🛡️ Auth & Progress Stability**: Resolved 500 errors and ReferenceErrors. [Read more →](docs/012-auth-and-progress-fix.md)
- **🔄 Bi-Directional Roadmap Sync**: Instant synchronization between Player and Hub. [Read more →](docs/roadmap-sync.md)
- **🌐 Domain Migration & CORS Fix**: Full support for `questxp.in`. [Read more →](docs/020-domain-migration-and-cors.md)
- **⚡ Optimistic UI & Tab Sync**: Instant progress updates with zero-flicker sync. [Read more →](docs/021-optimistic-ui-and-tab-sync.md)
- **🔍 Observability & Logging**: Robust error tracking and diagnostic logs. [Read more →](docs/OBSERVABILITY_AND_LOGGING.md)
- **🎨 UI & Gamification**: Visual refinements and progress tracking logic. [Read more →](docs/UI_AND_GAMIFICATION.md)

---

## 📄 License
MIT License. Developed by Parth Patidar.

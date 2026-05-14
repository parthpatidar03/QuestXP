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
  <strong>Advanced Gamified Learning Ecosystem | AI-Driven Roadmap Architecture</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.13.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/status-production-success.svg" alt="Status">
</p>

QuestXP is a high-performance Learning Management System (LMS) optimized for "Playlist Fatigue." It programmatically transforms unstructured YouTube content—ranging from multi-video playlists to 10+ hour "one-shot" lectures—into structured, modular curricula using AI orchestration, Redis-backed background processing, and an adaptive scheduling engine.

---

## 🏗️ System Architecture

QuestXP utilizes a **Decoupled Monolith** architecture with an **Event-Driven AI Pipeline**.

### Backend (Node.js/Express)
- **Layered Pattern**: `Routes` -> `Middleware` -> `Services` -> `Controllers` -> `Models`.
- **Worker Tier**: BullMQ + Redis cluster for non-blocking execution of intensive AI tasks (Transcription, Summarization, Chapterization).
- **Identity & Security**: JWT-based authentication with a Dual-Mode System supporting both `HttpOnly` cookies and `Authorization: Bearer` headers.

### Frontend (React/Vite)
- **Performance Layer**: Optimistic UI updates with cross-tab synchronization.
- **State Management**: Zustand (UI/Auth) & TanStack Query (Server-state caching).
- **Optimization**: Zero-flicker re-fetching logic using Tab-Specific Identification.

---

## ⚙️ Core Technical Implementations

### 1. The Chapterization Engine (One-Shot Support)
The Chapterization Engine is a sophisticated backend service that partitions long-form videos into logical, educational modules.
- **AI-Driven Topic Segmentation**: Instead of fixed-length splitting (which disrupts pedagogy), the `ChapterizationService` analyzes transcripts to detect natural shifts in topic.
- **Temporal Validation**: Ensures all generated timestamps are strictly chronological and encompass 100% of the video duration.
- **Graceful Degradation**: Implements a JSON fallback mechanism to ensure course creation success even if the AI provider encounters a transient error.

### 2. Dynamic Gamification Engine (v2.0)
A progressive reward system that scales with user consistency and effort.
- **Progressive Lecture XP**: Implements a `50 + 10n` XP formula per lecture completion, rewarding deeper engagement.
- **Screen-Time Bonuses**: Automated background tracking awards +50 XP for 1hr sessions and +200 XP for 3hr sessions.
- **Custom Awarding Logic**: Refactored `XPService` to support dynamic, multi-factor XP calculation beyond static constants.

### 3. Surgical Adaptive Roadmap Algorithm (v2)
A dynamic scheduling engine that treats learning paths as living documents rather than static lists.
- **75% Efficiency Rule**: Built-in scheduling logic that accounts for note-taking and cognitive load, providing realistic completion estimates.
- **Granular Shifting**: Allows users to shift specific lessons or blocks without breaking the entire relational dependency tree of the roadmap.
- **Atomic Operations**: Backend updates are performed using atomic MongoDB operations to prevent race conditions during simultaneous progress updates.

### 4. Frontend: Optimistic UI & Cross-Tab Sync
To ensure a "Zero-Latency" feel, QuestXP implements a custom **Tab-Aware Synchronization** system.
- **Optimistic Updates**: The frontend calculates and reflects progress changes (e.g., lesson completion) *before* the backend confirms the write, providing instant feedback.
- **Source Filtering**: Each browser tab is assigned a unique `window.name` ID. When a tab receives a "Progress Updated" event, it checks the `sourceId`. If it was the initiator, it skips redundant re-fetches to prevent UI flicker.
- **Local Persistence Sync**: Uses `localStorage` events to maintain state parity across multiple open tabs without the overhead of WebSockets.

---

## 🛠️ Technical Stack

- **Runtime**: Node.js v20+
- **Database**: MongoDB (Atlas) / Pinecone (Vector Search)
- **Caching/Queue**: Redis / BullMQ
- **AI Orchestration**: OpenAI (GPT-4o-mini) / LangChain
- **Notification Engine**: Firebase Cloud Messaging (FCM)
- **Monitoring**: Custom `ObservabilityService` for diagnostic logging and error tracking.

---

## 🚦 Key API & Routing Structure

| Endpoint | Method | Function | Technical Context |
| :--- | :--- | :--- | :--- |
| `/api/courses/generate` | POST | Course Generation | Triggers the AI pipeline (Chapters + Summaries) |
| `/api/progress/toggle` | PATCH | Progress Update | atomic $addToSet/$pull with total XP calculation |
| `/api/roadmaps/sync` | POST | Bidirectional Sync | Merges Player progress with Roadmap schedule |
| `/api/auth/google` | POST | Identity Sync | OAuth2 flow with internal JWT generation |

---

## 🔍 Observability & Stability
QuestXP includes a robust logging layer designed for production monitoring:
- **Error Propagation**: Centralized middleware catches and sanitizes errors, returning structured JSON while logging the stack trace internally.
- **CORS Hardening**: Fully configured for secure multi-domain communication (supporting `questxp.in` and local environments).
- **Diagnostic Logs**: Injected at every stage of the AI pipeline to track transcription health and LLM response latency.

---

## 📄 License
MIT License. Developed by Parth Patidar.

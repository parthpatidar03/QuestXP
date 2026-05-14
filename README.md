<p align="center">
  <a href="https://www.questxp.in/">
    <img src="https://img.shields.io/badge/LIVE_DEMO-QuestXP-indigo?style=for-the-badge&logo=vercel" alt="Live Demo">
  </a>
</p>

<p align="center">
  <img src="frontend/public/favicon.png" width="120" alt="QuestXP Logo">
</p>

<h1 align="center">QuestXP</h1>

<p align="center">
  <strong>The Future of Hyper-Efficient Learning</strong><br>
  <em>Advanced Gamified Learning Ecosystem | AI-Driven Roadmap Architecture</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.15.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/status-production_ready-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/Cloud-Azure-blue?style=flat&logo=microsoft-azure" alt="Azure">
</p>

QuestXP is a high-performance LMS engineered to solve "Playlist Fatigue." It programmatically transforms unstructured YouTube content—from massive playlists to 10-hour "one-shot" lectures—into structured, modular curricula using an AI-orchestrated pipeline, Redis-backed background processing, and a surgical adaptive scheduling engine.

---

## 🌟 Feature Highlights (Hackathon Ready)

| Feature | Description | Implementation |
| :--- | :--- | :--- |
| **Video One-Shots** | Split long-form videos into logical missions | Semantic AI Chapterization (GPT-4o-mini) |
| **Achievement Capture** | High-fidelity streak sharing (TUF-style) | `html-to-image` + React Portals + Backdrop-Blur |
| **Bulk Mastery** | Instant course/roadmap completion | Atomic MongoDB batch writes + XP aggregation |
| **Adaptive Roadmaps** | Dynamic schedules that shift with your pace | 75% Cognitive Load Efficiency Algorithm |
| **Zero-Latency Sync** | Instant progress updates across all tabs | BroadcastChannel API + Tab-Aware Source Filtering |
| **Global Leaderboard** | Real-time competitive ranking & percentiles | Redis-backed XP Pipeline + Real-time Aggregation |

---

## 🏗️ System Architecture

QuestXP uses a **Decoupled Monolith** architecture with an **Event-Driven AI Pipeline**.

### Backend (Node.js/Express)
- **Asynchronous Tier**: BullMQ + Redis cluster for non-blocking execution of transcription and semantic chapterization.
- **Identity & Security**: JWT-based auth with Dual-Mode support (`HttpOnly` cookies + `Authorization` headers).
- **Persistence**: MongoDB for relational-style learning data with atomic operations for progress integrity.

### Frontend (React/Vite)
- **Sync Layer**: Cross-tab synchronization via `questxp_progress_updated` events, eliminating manual refreshes.
- **State Management**: Optimized Zustand store for UI/Auth; TanStack Query for surgical server-state caching.
- **UI Architecture**: High-density dashboard with progressive disclosure and premium glassmorphism aesthetics.

---

## ⚙️ Core Technical Implementations

### 1. AI "One-Shot" Chapterization Pipeline
A custom-built processing pipeline that handles 10+ hour "Roadmap" videos.
- **Semantic Segmentation**: Analyzes video transcripts via GPT-4o-mini to identify natural pedagogical breaks rather than fixed-time splits.
- **Fault Tolerance**: Implements background retries and JSON fallback mechanisms to guarantee curriculum generation.

### 2. Achievement Capture 2.0
A premium achievement sharing system inspired by top-tier platforms.
- **High-Fidelity Export**: Uses `html-to-image` with a 2.0 pixel ratio for Retina-quality PNG exports.
- **Immersive Modals**: Implemented using React Portals with `backdrop-blur-xl` for a focused, premium user experience.

### 3. Surgical Adaptive Roadmap Algorithm (v2)
- **75% Efficiency Rule**: Accounts for cognitive load and note-taking time, providing realistic, non-overwhelming study plans.
- **Atomic Shifting**: Allows users to re-schedule specific lessons without breaking the global dependency graph.

### 4. Cross-Tab Synchronization (Zero-Latency)
- **BroadcastChannel**: Updates are broadcasted locally to all browser tabs.
- **Source Filtering**: Each tab uses a unique `sourceId` to ignore its own broadcasted events, preventing redundant re-fetches and UI flickering.

---

## 🛠️ Technical Stack

- **Runtime**: Node.js v22 LTS (Azure App Service)
- **Database**: MongoDB Atlas, Redis (Caching/Queues)
- **AI**: OpenAI GPT-4o-mini, yt-transcript
- **Cloud**: Microsoft Azure (Backend), Vercel (Frontend)
- **Sync**: BroadcastChannel API, Firebase FCM
- **Export**: html-to-image, canvas-confetti

---

## 🚦 Key API & Routing

| Endpoint | Method | Function | Backend Context |
| :--- | :--- | :--- | :--- |
| `/api/courses/generate` | POST | Course Generation | AI Semantic Chapterization Pipeline |
| `/api/progress/toggle` | PATCH | Progress Update | Atomic $addToSet with real-time XP math |
| `/api/roadmaps/sync` | POST | Bidirectional Sync | Merges Player progress into Global Roadmap |
| `/api/auth/google` | POST | Identity Sync | OAuth2 flow + internal JWT issuance |

---

## 📚 Documentation
- [Cloud Architecture (Azure)](docs/025-azure-cloud-deployment.md) - Infrastructure and scaling.
- [Streak & Sharing System](docs/024-streak-capture-and-sharing.md) - Deep dive into achievement sharing.
- [Backend Engineering](docs/backend-features.md) - AI pipeline and XP system logic.
- [Mobile UI Optimization](docs/019-ui-density-refinement.md) - High-density responsive design.

## 📄 License
MIT License. Developed by **Parth Patidar**.

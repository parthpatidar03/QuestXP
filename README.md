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
  <em>Gamified LMS · AI-Orchestrated Pipelines · Adaptive Scheduling · Cloud-Native on Azure</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.16.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/status-production_ready-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/Cloud-Azure_App_Service-0078D4?style=flat&logo=microsoft-azure" alt="Azure">
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat&logo=github-actions" alt="GitHub Actions">
  <img src="https://img.shields.io/badge/DB-MongoDB_Atlas-47A248?style=flat&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Queue-Valkey_%2B_BullMQ-D1312E?style=flat&logo=valkey" alt="Valkey">
</p>

QuestXP is a high-performance Learning Management System engineered to eliminate "Playlist Fatigue." It programmatically transforms unstructured YouTube content — from massive playlists to 10-hour "one-shot" lectures — into structured, modular curricula using an AI-orchestrated background pipeline, Redis-backed job queues, and a pure-JavaScript adaptive scheduling engine.

---

## 🌟 Feature Highlights

| Feature | Description | Implementation |
| :--- | :--- | :--- |
| **AI Course Generation** | YouTube playlist/one-shot → structured course | BullMQ pipeline, YouTube Data API v3, GPT-4o-mini |
| **RAG Doubt Chatbot** | Ask questions grounded in lecture transcripts | Pinecone vector search + OpenAI embeddings |
| **Adaptive Roadmaps** | Personalized schedules that shift with pace | Greedy allocation algo with 75% efficiency factor |
| **Gamification Engine** | XP, levels, streaks, badges, leaderboard | Idempotent XP awards, streak multipliers, Redis rate limiting |
| **Achievement Capture** | TUF-style streak sharing | `html-to-image` + React Portals |
| **Bi-directional Sync** | Player progress ↔ Roadmap, cross-tab | Atomic MongoDB writes + BroadcastChannel API |
| **One-Shot Chapterization** | Timestamp parsing → logical chapters | Description regex + YouTube Data API |
| **Push Notifications** | Firebase Cloud Messaging via backend scheduler | `node-cron` + `firebase-admin` |
| **Structured Logging** | Centralized, clean, and masked observability | `winston`, `morgan`, custom Express middleware |
| **Geo-Blocking** | **India-Only Security Guard** | Regional firewall active | `geoip-lite` offline IP filter |
| **FriendZones (OTP)** | Private squads with shared leaderboards | `bcrypt` OTP hashing, IP throttling, atomic member sync |
| **Simple Chat** | Fast, history-aware AI teaching assistant | Context-injected LLM prompt, history state tracking |
| **Granular Roadmap** | Select specific sections/videos for plans | Backend tiered filter + Nested UI |
| **Notification Throttling** | Only top 3 major updates pop on login | Frontend dispatcher with 1.5s staggered delay |
| **Video Stability** | Zero-refresh playback | Ref-based callback stabilization, origin-locked IFrame |
| **Fullscreen Stabilization** | Auto-exit native fullscreen & trigger system popup on completion | Standard Fullscreen API + HTML5 Desktop Web Notifications |
| **SEO Optimization** | Dynamic meta tags and sitemap | `react-helmet-async`, automated indexing |

---

## 🏗️ System Architecture

**Decoupled Monolith with Event-Driven AI Pipeline.**

```
[React Frontend / Vercel]
         │  HTTPS + JWT
         ▼
[Express API / Azure App Service]
  ├── Auth Layer (JWT + Google OAuth)
  ├── Rate Limiter (Redis-backed, per-user + per-IP)
  ├── REST Controllers
  └── BullMQ Job Producers
         │  Redis job queue
         ▼
[BullMQ Workers (same process)]
  ├── courseProcessor  — YouTube API ingestion
  ├── transcriptionWorker — yt-transcript fetch
  ├── embeddingWorker  — OpenAI embeddings → Pinecone
  ├── quizWorker       — GPT quiz generation
  └── notificationWorker — FCM push dispatch

[MongoDB Atlas]  ←→  [Valkey (Aiven)]  ←→  [Pinecone]
```

---

## ⚙️ Core Backend Implementations

### 1. Multi-Stage AI Processing Pipeline (BullMQ)

Course creation is fully asynchronous — the API returns instantly while workers process in the background.

**Flow:** `POST /api/courses/generate` → saves stub doc with `status: pending` → pushes job to `course-processing` BullMQ queue → `courseProcessor` worker fetches YouTube metadata → pushes per-lecture jobs to `transcription-processing` queue → `transcriptionWorker` fetches transcripts → `embeddingWorker` chunks text via `@langchain/textsplitters` and upserts vectors to Pinecone (namespaced by `lectureId`) → `quizWorker` generates MCQs via GPT-4o-mini.

- **File:** `backend/src/workers/courseProcessor.js`, `embeddingWorker.js`, `transcriptionWorker.js`
- **Pattern:** Fan-out — one course job fans out to N lecture jobs (N = total lectures)
- **Fault Tolerance:** Failed jobs bubble to BullMQ's failed set; course document status → `error`; no partial ghost courses

### 2. RAG Doubt Chatbot (Pinecone + OpenAI)

Lecture-grounded question answering using Retrieval-Augmented Generation.

- Question is embedded with `text-embedding-3-small`
- Queried against Pinecone namespace (one namespace per lecture) with `topK=5`, minimum cosine score `0.75`
- Context + question assembled into a structured GPT-4o-mini prompt
- Response schema validated via custom AJV schema (`ragAnswerSchema.js`)
- Falls back to general LLM knowledge when score threshold not met — never returns "no answer"
- **File:** `backend/src/services/ragService.js`

### 3. Adaptive Study Plan Algorithm (Pure JS, No AI)

A deterministic scheduling engine in `studyPlanService.js` (~740 lines, zero AI calls).

- **Tiered Filtering (Curated Generation):** Supports three levels of selection: `playlistIds` (Courses), `sectionIds` (Playlists), and `lectureIds` (Individual Videos). This allows users to skip specific topics and generate plans for a curated list of missions.
- **75% Efficiency Factor:** User's stated study time is multiplied by `0.75` to account for note-taking, breaks, and cognitive overhead.
- **Greedy Forward-Fill:** Lectures distributed proportionally across available days using a capacity midpoint algorithm — not simple round-robin.
- **Feasibility Detection:** If total lecture minutes exceed total available capacity, returns `isFeasible: false` with `pushDeadlineDays` suggestion.
- **Daily Recalculation (Idempotent):** On each login, recalculates from today using only incomplete lectures; compares planned vs actual to compute `scheduleStatus: ahead | on_track | behind`.
- **File:** `backend/src/routes/roadmap.js` (Filtering logic), `backend/src/services/studyPlanService.js` (Distribution logic)

### 4. XP Engine with Streak Multipliers (Idempotent Awards)

A transactional gamification system preventing duplicate XP exploits.

- Each award checked against `XPAward` collection within a 24-hour window by `(userId, actionType, resourceId)` — duplicate → returns `{ duplicate: true }` without writing
- XP multiplied by streak tier: `1.0x → 1.25x → 1.5x → 2.0x`
- Level-up computed in the same transaction using `LEVELS` threshold array; unlocked features propagated to user doc atomically
- Badge evaluation runs post-award using current stats snapshot
- **File:** `backend/src/services/xpService.js`

### 5. Redis-Backed Multi-Tier Rate Limiting

Distributed rate limiting stored in Redis, not in-memory (survives restarts).

| Limiter | Window | Max | Key Strategy |
| :--- | :--- | :--- | :--- |
| Global IP | 15 min | 1000 req | Per IP (`rl:global:`) |
| Chatbot Hourly | 1 hr | 3 (L1) / 7 (L2+) | Per `userId`, level-aware |
| Chatbot 2-hr Window | 2 hr | 10 | Per `userId` |
| Quiz Attempts | 12 hr | 5 | Per `userId` |
| Summary Generation | 1 hr | 5 | Per `userId` |

- **Library:** `express-rate-limit` + `rate-limit-redis`
- **File:** `backend/src/middleware/rateLimiter.js`
- **Resiliency & Connection Isolation**: Implements an isolated `generalClient` connection (with `enableOfflineQueue: false`) alongside the main BullMQ connection. By using `passOnStoreError: true` on all rate limiters, any Redis network drop or outage will immediately bypass the rate limiter (fail-open) and prevent API requests from hanging/timing out.

### 6. Bi-Directional Progress Sync

When a lecture is toggled complete in the Course Player, the backend simultaneously updates the associated Roadmap document — keeping both in sync atomically.

- `toggleLecture` in `progressService.js` finds all Roadmaps containing the `lectureId` and updates `vid.completed` in the same request cycle
- Non-blocking: roadmap sync failure logs but does not fail the primary toggle response
- **File:** `backend/src/services/progressService.js`

### 7. Security Hardening (Production-Grade)

- **Helmet.js:** Sets 15+ security response headers (CSP, HSTS, X-Frame-Options, etc.)
- **HPP:** HTTP Parameter Pollution protection
- **CORS:** Dynamic origin validator — whitelist + wildcard for `*.vercel.app` and `*.questxp.in`; localhost allowed in non-production only
- **JWT:** HttpOnly cookie + `Authorization` header dual-mode; all protected routes require valid JWT via `auth.js` middleware
- **Geo-Blocking (India-Only):** `geoip-lite` offline IP→country lookup on all auth routes; non-Indian IPs get `403 GEO_BLOCKED`; country metadata stored per user and per session for audit trail. See `docs/geo-blocking.md`
- **Input Validation:** `express-validator` on all write endpoints; AJV schema validation on AI responses

### 8. Structured Logging & Error Handling

- **Winston + Morgan:** Replaced all `console.log` with structured, prefixed (`[API]`, `[AUTH]`, etc.) Winston loggers. HTTP requests tracked via Morgan middleware.
- **Sensitive Data Redaction:** Custom formatter automatically masks `password`, `token`, and `apiKey` fields before outputting to Azure Log Stream.
- **Centralized Express Error Middleware:** Replaced scattered inline try/catches. Central middleware formats stack traces (in dev) and catches Express-Validator errors. Process-level `unhandledRejection` catchers prevent silent crashes.
- **File:** `backend/src/utils/logger.js`, `backend/src/middleware/errorMiddleware.js`

### 9. FriendZone OTP System (Security & Social)
To prevent password fatigue, we implemented a short-lived (10m), single-use OTP system for private squads.
- **Bcrypt Hashing**: Plaintext OTPs are never stored; only bcrypt(12) hashes are saved to MongoDB.
- **IP-Based Throttling**: A custom in-memory bucket limiter prevents brute-force OTP guessing.
- **Atomic Member Sync**: `memberCount` and `members` array are updated atomically to prevent zone over-filling race conditions.
- **File:** `backend/src/routes/friendZones.js`

### 10. Simple Chat & Activity Feed
A non-RAG, history-aware LLM chat for instant educational clarifications.
- **Context Injection**: Current course and lecture titles are injected into the system prompt to ground responses without expensive vector searches.
- **Multi-Turn History**: Supports up to 20 conversation turns via client-side state propagation.
- **Event-Driven Feed**: Friend activity is aggregated from `XPAward` documents, providing a live social feed of achievements.
- **File:** `backend/src/controllers/simpleChatController.js`

### 11. Push Notification System (Firebase + node-cron)
- Backend uses `firebase-admin` SDK to send FCM push notifications
- `notificationScheduler.js` runs a `node-cron` job daily to dispatch streak reminders and study nudges
- `notificationWorker.js` processes notification jobs from BullMQ queue
- **File:** `backend/src/workers/notificationWorker.js`, `notificationScheduler.js`

### 12. Viewport-Locked Responsive Player Page & Sidebar Integration (UX Performance)

Native app-like experience on mobile screens (`< 640px`) using strict `100dvh` viewport height constraints and page-level `overflow-hidden` to completely prevent double-scrollbar body scroll.

- Stacks video at `aspect-video shrink-0` (edge-to-edge) and allocates exactly the remaining viewport space to the sidebar panel (`flex-grow flex-1 min-h-0`).
- Re-architected RAG Doubt Chatbot to dynamically switch between absolute draggable floating bubble mode on desktop, and a static flex-grow tab inside the mobile sidebar tabbed panel via `isSidebarMode={true}` prop, keeping the video persistent while providing zero-lag internal scrolling.
- Automatically handles fallback to timeline tab on desktop resize to prevent blank panels.
- **File:** `frontend/src/pages/Player.jsx`, `frontend/src/components/Lecture/DoubtChatbot.jsx`

---

## 🚀 Cloud Infrastructure & CI/CD

### Deployment Architecture

| Layer | Platform | Notes |
| :--- | :--- | :--- |
| **Frontend** | Vercel | Auto-deploys from `main` branch |
| **Backend API** | Azure App Service (Linux) | Node.js 22 LTS runtime |
| **Database** | MongoDB Atlas | M0/M2 cluster, TLS |
| **Cache / Queue** | Aiven Valkey | High-performance open-source Redis fork |
| **Vectors** | Pinecone | Serverless index, per-lecture namespaces |
| **Push** | Firebase Cloud Messaging | Via `firebase-admin` |

### GitHub Actions CI/CD Pipeline

**File:** `.github/workflows/main_questxp.yml`

```
git push → main branch
       │
       ▼
[GitHub Actions: build job]
  1. Checkout code
  2. Setup Node.js 22.x
  3. cd backend && npm install && npm run build
  4. Upload artifact (backend/ folder)
       │
       ▼
[GitHub Actions: deploy job] (needs: build)
  1. Download artifact
  2. Azure Login (OIDC — no static secrets)
  3. azure/webapps-deploy → QuestXP App Service, Production slot
```

**Authentication:** Uses **OIDC Federated Identity** (not username/password). GitHub requests a short-lived JWT; Azure validates it via a configured Federated Credential. Secrets stored: `AZUREAPPSERVICE_CLIENTID`, `AZUREAPPSERVICE_TENANTID`, `AZUREAPPSERVICE_SUBSCRIPTIONID`.

**Trigger:** Any push to `main` branch automatically kicks off the pipeline. Manual trigger also available via `workflow_dispatch`. Total deploy time: ~2–3 minutes.

---

## ⚛️ Key Frontend Engineering Patterns

### Optimistic UI Updates
Progress toggles update the UI immediately before the server responds. The checkbox state is set locally in the component, and the API call runs in parallel. If the API fails, the state rolls back. This eliminates the ~200–400ms perceived latency on every lecture toggle.

### Cross-Tab Synchronization (BroadcastChannel API)
When a lecture is completed in the Player tab, a `questxp_progress_updated` event is broadcast via the native `BroadcastChannel` API to all other open tabs (Dashboard, Roadmap). Each tab filters by a unique `sourceId` to ignore events it generated itself — preventing double-fetch loops.

### AI Status Polling (`useLectureStatus` hook)
After course creation, lecture AI processing (transcription, quiz, embedding) is async. The `useLectureStatus` custom hook polls `/api/lectures/:id/ai-status` every 3 seconds and stops automatically when all statuses reach `completed | failed`. No unnecessary re-renders after completion.

### Zustand Gamification Store
A lightweight global store (`useGamificationStore`) manages XP, level, streak, toast queue, and level-up modal state. The `applyAward()` action processes the backend's award response, updates XP atomically, queues XP toasts, and triggers the level-up sequence — all without server round-trips. Toast suppression during active video playback prevents UI clutter.

### TanStack Query for Server State
API data (courses, progress, leaderboard) is managed by TanStack Query with configured `staleTime` and cache invalidation. Progress toggles call `queryClient.invalidateQueries()` to surgically refetch only affected data, not the entire app state.

### Frontend Performance & Paint Optimization
The frontend architecture underwent significant optimization to eliminate scroll jank, reduce memory leaks, and prevent CPU spikes:
- **GPU Offloading:** Replaced global `useState` hooks with Framer Motion `useMotionValue` to prevent 60fps React re-renders during mouse movement.
- **Throttled Listeners:** Global scroll event listeners (e.g., in `UserTour`) are wrapped in `requestAnimationFrame` and dynamically unmounted when not visible to prevent continuous Layout Thrashing.
- **Glassmorphism Penalty Elimination:** Removed computationally expensive CSS `backdrop-blur` from large scrolling containers (like the sticky NavBar and landing page cards) to prevent the browser from recalculating blur geometry on every pixel scroll, drastically reducing GPU paint time.
- **Query Batching & Polling:** Refactored aggressive `setInterval` AI polling (`useLectureStatus`) into TanStack React Query to ensure deduplicated polling, automatic garbage collection on unmount, and pause-on-blur capabilities.

### Scroll & Mouse Event Optimization (GPU Offloading)
Global interactive effects and scroll listeners have been heavily optimized. React state updates (`useState`) for `mousemove` events were replaced with Framer Motion's `useMotionValue` to bypass React's render cycle completely, offloading work to the GPU. Global scroll listeners are throttled via `requestAnimationFrame` and dynamically attached only when actively needed to prevent continuous Layout Thrashing and scroll jank.

### SEO & Discoverability Architecture
Implemented a comprehensive SEO engine to improve search visibility and indexing.
- **Dynamic Meta Injection:** Using `react-helmet-async` for page-specific titles, descriptions, and Open Graph tags.
- **Automated Indexing:** Dedicated `sitemap.xml` and `robots.txt` for search engine crawler guidance.
- **Social Metadata:** Optimized OG/Twitter cards for consistent branding across social shares.
- **Semantic HTML:** Strict adherence to HTML5 landmark elements for structural clarity.
- **Production-Grade Code Quality:** Achieved **zero ESLint warnings** across the entire frontend. Implemented strict hook dependency tracking and memoized event handlers (`useCallback`) to eliminate stale closure bugs and unnecessary re-renders in complex components like `UserTour` and `GamificationProfile`.

---

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | Node.js v22 LTS |
| **API Framework** | Express.js 4 |
| **Database** | MongoDB Atlas + Mongoose |
| **Cache / Queue Broker** | Valkey (Aiven) via ioredis |
| **Job Queues** | BullMQ |
| **AI / LLM** | OpenAI GPT-4o-mini, `text-embedding-3-small` |
| **Vector DB** | Pinecone (serverless) |
| **Text Chunking** | LangChain `@langchain/textsplitters` |
| **YouTube Data** | YouTube Data API v3 + `youtube-transcript` |
| **Auth** | JWT + Google OAuth2 (`google-auth-library`) |
| **Security** | Helmet, HPP, CORS, express-rate-limit |
| **Push Notifications** | Firebase Admin SDK (FCM) |
| **Scheduling** | node-cron |
| **Cloud** | Azure App Service (Backend), Vercel (Frontend) |
| **CI/CD** | GitHub Actions (OIDC → Azure) |
| **Validation** | `express-validator` (API), `AJV` (AI JSON Schemas) |
| **Frontend** | React 18 + Vite, Zustand, TanStack Query |

---

## 🚦 Key API Routes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/google` | POST | Google OAuth → internal JWT issuance |
| `/api/courses/generate` | POST | Trigger AI course generation pipeline |
| `/api/progress/toggle` | PATCH | Toggle lecture completion + XP award |
| `/api/progress/markAllComplete` | POST | Bulk completion with atomic XP aggregation |
| `/api/plan/generate` | POST | Generate adaptive study plan |
| `/api/doubts/query` | POST | RAG chatbot query against lecture transcript |
| `/api/gamification/profile` | GET | XP, level, streak, badges for current user |
| `/api/gamification/leaderboard` | GET | Global XP leaderboard with percentile rank |
| `/api/roadmap/sync` | POST | Bi-directional Player ↔ Roadmap sync |
| `/api/health` | GET | Health check (no auth required) |



---

## 📄 License

MIT License. Developed by **Parth Patidar**.
### 6. Notification UX Throttling
To prevent notification overload for returning users, we implement a **Throttled Dispatcher** in the `Dashboard`. 
- **Mechanism**: The top 5 features are tracked via `localStorage`.
- **Constraint**: Only the first 3 unseen features trigger a popup toast.
- **Persistence**: All 5 features remain visible in the "What's New" Dashboard tab for passive discovery.
- **Staggering**: Popups are staggered by 1.5s to ensure visual clarity.

### 7. Granular Roadmap Generation
Refactored roadmap engine to support sub-section and video-level selection.
- **Backend**: `POST /api/roadmap/generate` supports `lectureIds` for surgical precision.
- **Logic**: Filters out unselected content from the generated schedule, allowing students to skip known material.

### 8. Fullscreen Autoplay Stabilization & System Notifications
Stabilized native full-screen video playback transitions and added desktop web notifications to secure visual feedback on mission completions.
- **Auto-Exit Fullscreen**: Listens to course completions and calls `document.exitFullscreen()` to gracefully return user to interactive normal view.
- **Desktop Push Overlays**: Employs the HTML5 `Notification` API to push OS-level overlay alerts, bypassing the isolated context of the cross-origin fullscreen YouTube iframe.
- **Dismissible High-Density Modals**: Enhanced bottom completion cards and new top banners with explicit close buttons for maximum UX agency.

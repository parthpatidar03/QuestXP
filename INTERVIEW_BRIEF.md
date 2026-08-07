# QuestXP — Technical Interview Brief

Single-file recall document. Every feature, how it's built, which technology does what, and where it lives in the codebase.

---

## 1. The 30-Second Pitch

QuestXP converts any YouTube playlist into a structured, gamified course. You paste a playlist URL; the system pulls every video via the YouTube Data API, fetches transcripts, uses an LLM to split long videos into chapters, generates quizzes and notes, embeds transcripts into a vector database for a RAG-powered doubt chatbot, and builds a day-by-day study roadmap that fits your actual available hours. Progress is tracked with XP, levels, streaks, and leaderboards. A mission only completes when you pass its quiz, so XP is proof of knowledge rather than proof of attendance.

**Stack in one line:** React 18 + Vite + Tailwind frontend; Node/Express + MongoDB + Redis + BullMQ backend; OpenAI for generation and embeddings; Pinecone for vector search.

---

## 2. System Architecture

```
                         ┌─────────────────────────────┐
   Browser               │   React 18 SPA (Vite)       │
                         │   Zustand + React Query     │
                         └──────────────┬──────────────┘
                                        │ axios (JWT in cookie or Bearer)
                                        ▼
                         ┌─────────────────────────────┐
                         │   Express 4 API             │
                         │   helmet, cors, hpp,        │
                         │   rate-limit, sanitizers    │
                         └───┬──────────────────┬──────┘
                             │                  │
             synchronous     │                  │  enqueue job
             read/write      ▼                  ▼
                    ┌────────────────┐   ┌──────────────────┐
                    │   MongoDB      │   │  Redis (BullMQ)  │
                    │   (Mongoose)   │   │  9 queues        │
                    └────────────────┘   └────────┬─────────┘
                                                  │ consume
                                                  ▼
                                       ┌──────────────────────┐
                                       │  9 Worker processes  │
                                       │  course, transcript, │
                                       │  quiz, notes, topics,│
                                       │  embedding, streak,  │
                                       │  notification x2     │
                                       └──┬─────────┬─────────┘
                                          │         │
                            ┌─────────────▼──┐  ┌───▼──────────┐
                            │  OpenAI API    │  │  Pinecone    │
                            │  gpt-4o-mini   │  │  vector DB   │
                            │  text-embed-3  │  └──────────────┘
                            └────────────────┘
                            ┌────────────────┐
                            │ YouTube Data   │
                            │ API v3         │
                            └────────────────┘
                            ┌────────────────┐
                            │ Firebase Cloud │
                            │ Messaging      │
                            └────────────────┘
```

**Key architectural decision:** anything slow or expensive is pushed off the request thread into a BullMQ queue. The HTTP layer never waits on OpenAI, YouTube, or Pinecone. A course creation request returns in milliseconds with `status: 'processing'`; the frontend polls `/api/courses/:id/status` every 3 seconds until it flips to `ready`.

---

## 3. Tech Stack — What, Why, Where

### Backend Core

| Technology | What it is | Where used in QuestXP |
|---|---|---|
| **Node.js + Express 4** | JavaScript server runtime and minimal HTTP framework. | `backend/src/app.js` wires all middleware and mounts 15 route files under `/api/*`. `index.js` is the entrypoint, connects Mongo, then loads workers. |
| **MongoDB + Mongoose** | Document database; Mongoose adds schemas and validation on top. | 18 models in `backend/src/models/`. Chosen because course structure is deeply nested (course → sections → lectures) and varies per playlist, which maps badly to relational tables. |
| **Redis (ioredis)** | In-memory key-value store. | Three jobs: BullMQ's backing store, distributed rate-limit counters (`rate-limit-redis`), and general caching. Connection in `queues/redisConnection.js`. |
| **BullMQ** | Redis-backed job queue for Node. | The entire async pipeline. 9 queues in `queues/`, 9 workers in `workers/`. Gives retries, backoff, concurrency control, and job persistence across restarts. |
| **JWT (jsonwebtoken)** | Signed token format for stateless auth. | `utils/authTokens.js`. Access token 15 min, refresh token 7 days. |
| **bcryptjs** | Password hashing with salt. | `controllers/authController.js` on register and login. Passwords never stored in plaintext. |
| **node-cron** | In-process cron scheduler. | `workers/notificationScheduler.js` runs hourly (`0 * * * *`) to queue study-reminder notifications. |

### AI and Data

| Technology | What it is | Where used in QuestXP |
|---|---|---|
| **OpenAI API** | LLM provider. | `services/ai-provider.js` is the single wrapper. Uses `gpt-4o-mini` for all generation (chosen for cost and latency) and `text-embedding-3-small` for embeddings. Three methods: `generateJSON` (temp 0.1, `response_format: json_object`), `generateChat` (temp 0.7), `generateEmbedding`. |
| **Pinecone** | Managed vector database for similarity search. | `services/ragService.js` and `workers/embeddingWorker.js`. One namespace per lecture ID, so a search is automatically scoped to the right video without a metadata filter. |
| **LangChain text splitters** | Utility for chunking text with overlap. | `workers/embeddingWorker.js` uses `RecursiveCharacterTextSplitter` at `chunkSize: 500, chunkOverlap: 200`. Overlap prevents a concept being cut in half at a chunk boundary. |
| **YouTube Data API v3** | Google's API for playlist and video metadata. | `workers/courseProcessor.js` and `controllers/courseController.js`. Paginates `playlistItems` (50/page cap) and batches `videos` calls (50 IDs/call) to fetch ISO-8601 durations, which are parsed to seconds with a regex. |
| **youtube-transcript** | Scrapes YouTube's caption track. | `services/transcriptionService.js`, first attempt at getting a transcript. |
| **fluent-ffmpeg** | Node wrapper around FFmpeg for audio extraction. | Fallback path in `transcriptionService.js` when no captions exist: extract audio, then run local speech-to-text (faster-whisper). |
| **ajv** | JSON Schema validator. | `schemas/ragAnswerSchema.js` validates the LLM's JSON output before it reaches the client. Guards against malformed model responses. |

### Security and Ops

| Technology | What it is | Where used in QuestXP |
|---|---|---|
| **helmet** | Sets ~12 security HTTP headers. | `app.js`. Gives HSTS, `X-Content-Type-Options`, frameguard, Referrer-Policy. CSP is behind a `CSP_ENABLED` flag because a strict policy breaks Google OAuth and YouTube embeds. |
| **cors** | Cross-origin request control. | `app.js`, with a function-based origin allowlist: exact matches from env, a `*.questxp.in` regex, optional Vercel previews behind a flag, and localhost only outside production. |
| **hpp** | HTTP Parameter Pollution guard. | `app.js`. Stops `?id=1&id=2` from turning a string into an array and confusing downstream logic. |
| **express-rate-limit + rate-limit-redis** | Request throttling with a shared store. | `middleware/rateLimiter.js`. Global limiter: 1000 req / 15 min per IP, **fail-open** if Redis dies. Chatbot limiter: 3/hr at level 1, 7/hr at level 2+, keyed by user ID, **fail-closed** because the route costs money. |
| **express-validator** | Request body validation. | Auth and course routes, before controllers run. |
| **Custom sanitizers** | NoSQL-injection and prototype-pollution guards. | `middleware/security.js` exports `mongoSanitize` and `blockPrototypeKeys`. Must run after `express.json()` so `req.body` exists. |
| **geoip-lite** | Offline IP-to-country lookup. | `middleware/geoBlock.js`. Product is India-only at launch; returns a `GEO_BLOCKED` code the frontend renders as a friendly message. |
| **winston** | Structured logging. | `utils/logger.js`, with per-domain child loggers (`serverLogger`, `dbLogger`, `jobLogger`). |
| **morgan** | HTTP access logging. | Request-level logs in development. |
| **compression** | gzip response bodies. | `app.js`, applied globally. |
| **cookie-parser** | Parses the Cookie header. | Needed because access and refresh tokens are httpOnly cookies. |
| **firebase-admin** | Server SDK for Firebase. | `services/firebase.js` sends push notifications through FCM to stored device tokens. |
| **nodemailer** | SMTP email sender. | Transactional email. |

### Frontend

| Technology | What it is | Where used in QuestXP |
|---|---|---|
| **React 18** | UI library. | 12 pages in `src/pages/`, component tree in `src/components/`. |
| **Vite 7** | Build tool and dev server. | `vite.config.js`. Dev proxy sends `/api` to `localhost:5002` so there is no CORS in development. `rollup-plugin-visualizer` outputs a bundle treemap to `stats.html`. |
| **Tailwind CSS 3.4** | Utility-first CSS. | All styling. `tailwind.config.js` maps every colour to a CSS custom property, so light and dark themes swap by toggling one class on `<html>`. |
| **Zustand** | Minimal global state store. | `store/useAuthStore.js` (session, user object) and `store/useGamificationStore.js` (XP, level, streak). Chosen over Redux because there is no need for middleware, devtools ceremony, or reducers at this scale. |
| **TanStack React Query** | Server-state cache with refetching. | `pages/Dashboard.jsx` and elsewhere. Handles caching, background refetch on window focus, and polling (`refetchInterval` returns 3000 only while a course has `status: 'processing'`, otherwise `false`). Removes the need for manual loading and error state. |
| **React Router 7** | Client-side routing. | `App.jsx`, including a `ProtectedRoute` wrapper that admits authenticated users and demo-mode guests. |
| **axios** | HTTP client. | `services/api.js`. Holds the interceptor that catches 401s, attempts a single token refresh, queues concurrent failed requests, and replays them with the new token. |
| **framer-motion** | Animation library for React. | Scroll reveals (`components/ui/Reveal.jsx`), leaderboard podium entrance, page transitions. Uses `useReducedMotion` so animations are skipped for users who ask for that. |
| **react-hot-toast** | Toast notifications. | XP gains, errors, feature announcements. |
| **react-helmet-async** | Manages `<head>` per route. | `LandingPage.jsx` sets title, meta description, Open Graph, Twitter cards, and three JSON-LD blocks for SEO rich results. |
| **canvas-confetti** | Confetti particle effect. | `utils/confetti.js`, fired on mission completion, signup, and login. |
| **html-to-image** | Renders a DOM node to PNG. | `StreakCalendar.jsx` "share achievement" — turns the streak grid into a downloadable image. |
| **date-fns** | Date utilities. | Roadmap day calculations, `isSameDay` checks in the daily-mission widget. |
| **lucide-react** | SVG icon set. | Icons across the app. |
| **firebase (client)** | Web SDK. | Registers the service worker and retrieves the FCM device token, which is stored on the User document. |
| **@react-oauth/google** | Google Sign-In button and flow. | `pages/Auth.jsx`. Returns a credential JWT that the backend verifies with `google-auth-library`. |
| **@vercel/analytics** | Page-view analytics. | Mounted at app root. |
| **Vitest + Testing Library** | Test runner and DOM assertions. | `npm test`, jsdom environment. |

---

## 4. Request Lifecycle (be ready to walk through this)

A request to `GET /api/courses`:

1. **`trust proxy`** — Express honours `X-Forwarded-For` up to 2 hops so rate limiting sees the real client IP behind Cloudflare and Azure.
2. **CORS** — origin function checks the allowlist; rejects with an error otherwise.
3. **helmet** — attaches security headers.
4. **`express.json({ limit: '1mb' })`** — body parsed with a size cap to prevent memory-exhaustion payloads.
5. **`mongoSanitize` + `blockPrototypeKeys`** — strips `$` operators and `__proto__` keys from the body.
6. **`requestId`** — attaches a UUID so a frontend error report can be joined to a backend log line.
7. **`requestLogger`** — structured winston log.
8. **`globalLimiter`** — Redis-backed IP throttle.
9. **`dbReady`** — returns 503 in under a millisecond if Mongoose is disconnected, instead of letting the client hang for a 12-second axios timeout.
10. **`auth`** — reads the token from the httpOnly cookie, falls back to the `Authorization: Bearer` header, verifies the JWT, loads the user, and confirms the `Session` document is not revoked and not expired.
11. **Controller** → **Service** → **Model**.
12. **`errorMiddleware`** — central error handler, last in the chain.

**Point worth making in interview:** the middleware order is deliberate. `/api/health`, `/api/feedback`, and `/api/logs` are mounted *before* the global limiter so monitoring, user feedback, and client error reporting keep working during a Redis outage.

---

## 5. Feature Deep-Dives

### 5.1 Course Creation (playlist → structured course)

**Flow:**
1. `POST /api/courses` with one or more playlist URLs. Controller validates, creates a `Course` document with `status: 'processing'`, enqueues a `course-processing` job, and returns immediately.
2. `workers/courseProcessor.js` picks it up:
   - Detects playlist versus single video by checking for `list=` in the URL.
   - Paginates `youtube/v3/playlistItems` with `nextPageToken` because the API caps at 50 items per page.
   - Batches `youtube/v3/videos` in groups of 50 to fetch `contentDetails.duration`.
   - Parses ISO-8601 (`PT1H23M45S`) to seconds with a regex.
   - **Smart split heuristic:** if the playlist has more than 5 videos, each video becomes its own lecture. If it has 5 or fewer (likely long-form "one-shot" content), each video gets chapterized into multiple lectures.
3. For long videos it chains into transcription → chapterization.
4. Sets `status: 'ready'`; the frontend's polling query picks it up on the next 3-second tick.

**Interview angle:** explain why this is a queue and not a synchronous request. A 200-video playlist means five paginated calls plus four batched duration calls plus transcript fetches. That is minutes of work; an HTTP request would time out and any retry would restart from zero.

### 5.2 Transcription and AI Chapterization

`services/transcriptionService.js` has a two-tier strategy:
1. **`youtube-transcript`** — scrapes the existing caption track. Free and instant.
2. **Local Whisper fallback** — if no captions, `fluent-ffmpeg` extracts audio and a spawned `faster-whisper` process transcribes it.

`services/chapterizationService.js` then sends the full transcript to `gpt-4o-mini` with a system prompt requiring:
- one core concept per module,
- 10–20 minute target length,
- descriptive titles ("The Power of Closures", not "Part 1"),
- strictly chronological `startTime`/`endTime` in seconds,
- first chapter starts at 0, last chapter ends at total duration.

Failure returns a single-chapter fallback covering the whole video, so the pipeline never hard-fails.

**This is the differentiating feature.** It turns a 10-hour unwatchable "one-shot" tutorial into 30 addressable missions.

### 5.3 RAG Doubt Chatbot

**Indexing** (`workers/embeddingWorker.js`):
1. Deletes the Pinecone namespace for the lecture first — an atomic rebuild, so re-indexing never leaves stale vectors behind.
2. Splits the transcript with `RecursiveCharacterTextSplitter` (500 chars, 200 overlap).
3. Embeds each chunk with `text-embedding-3-small`.
4. Upserts in batches into `index.namespace(lectureId)`, with each vector carrying `startTimestamp`, `text`, and `chunkIndex` metadata.

**Querying** (`services/ragService.js`):
1. Embed the user's question.
2. Query the lecture's namespace, `topK = 5`.
3. **Relevance gate:** if `topScore < MIN_RELEVANCE_SCORE` (default 0.75), the context string is replaced with an explicit "no relevant lecture context found" instruction so the model answers from general knowledge instead of hallucinating a citation.
4. Send context plus question to `gpt-4o-mini` with a grounding system prompt that demands JSON: `answerText`, `citations[]`, `usedGeneralKnowledge`, `notFound`.
5. Validate against a JSON Schema with ajv before returning.
6. Latency for each stage (embedding, Pinecone, LLM) is logged separately for observability.

**Why namespaces instead of a metadata filter:** namespace isolation means Pinecone only searches vectors for that one lecture. Faster than filtering a shared index, and it makes deletion trivial.

**Rate limited** at 3 questions/hour on level 1 and 7/hour at level 2+, keyed by user ID, fail-closed.

### 5.4 Quiz Generation and Mastery Gating

- `workers/quizWorker.js` + `services/quizService.js` generate multiple-choice questions from the transcript via `generateJSON`.
- Questions support single and multiple correct answers (`isMultipleChoice`, `correctIndices`).
- `QuizAttempt` records score, time taken, and whether it beat a previous personal best.
- **The core product rule:** a lecture is only marked complete when the quiz is passed. XP is proof of knowledge, not attendance.
- Frontend `QuizTab.jsx` adds a deliberate 1.2-second delay before showing results, so the "AI grading" feels substantive rather than instant.

### 5.5 Adaptive Study Roadmap

`services/roadmapGenerator.js` is **deterministic, not AI** — an important point to make, since it needs to be predictable and free.

Algorithm:
- User supplies a deadline, weekday hours, weekend hours, and rest days.
- **75% efficiency rule:** one hour of stated availability becomes 45 minutes of allocated content. Accounts for pausing, note-taking, and re-watching. Without it, every plan overruns and users quit.
- Walks day by day, checks weekday versus weekend capacity, skips excluded rest days, and packs videos until the daily budget is exhausted.
- Each video is a separate entry, which allows a single missed video to be shifted without recomputing the whole plan.

The dashboard's `DailyMissionWidget` finds today's entry with `isSameDay` and surfaces it as "today's mission".

### 5.6 Gamification

**XP** (`services/xpService.js`, `constants/xp.js`):
- 29 defined action types. `LECTURE_COMPLETED: 30`, `QUIZ_ACED: 75`, `COURSE_COMPLETED: 500`, `SCREEN_TIME_3HR: 200`.
- **Idempotency:** before awarding, it queries `XPAward` for the same `(user, actionType, resourceId)` inside a 24-hour window. A duplicate returns `xpEarned: 0` rather than double-paying. This is the answer to "how do you stop users farming XP by replaying a lecture".
- **Streak multiplier** applied at award time from `STREAK_MULTIPLIERS`: 1.25× at 7 days, 1.5× at 14, 2× at 30, 3× at 100.
- Uses `findByIdAndUpdate` with `$inc` — an atomic database increment, so two concurrent awards cannot lose an update through a read-modify-write race.
- Every award is written to the `XPAward` collection, giving a full audit trail of where every point came from.

**Levels** (`constants/levels.js`): 10 levels, thresholds 0 → 20,000. Each level unlocks named features, mirrored in `FEATURE_LEVELS` and enforced server-side by `middleware/featureGate.js` and client-side by `hooks/useFeatureGate.js`. Server-side is the real gate; the client version only controls what the UI shows.

**Streaks** (`services/streakService.js`):
- All date comparison normalised to **IST** via `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`, because the product is India-only and UTC day boundaries would break streaks at 5:30am local.
- `daysDiff === 1` extends the streak; greater than 1 resets to 1; same day is a no-op.
- Freeze tokens let a user miss one day without losing the streak.

**Leaderboard:** `GET /api/gamification/leaderboard`, rendered by `LeaderboardPodium` (top 3) and `LeaderboardTable` (full list).

### 5.7 Friend Zones

Private squads. `models/FriendZone.js`, `routes/friendZones.js`, pages `FriendZones.jsx` / `FriendZoneDetail.jsx` / `JoinFriendZone.jsx`. Six-digit join code, shared XP leaderboard scoped to members, and an activity feed.

### 5.8 Push Notifications

- Client registers a service worker, retrieves an FCM token, stores it on the User document alongside `timezone` and `notificationState` (`active` / `cooling_down` / `stopped`).
- `workers/notificationScheduler.js` runs hourly on cron, finds users whose local time matches their study window, and enqueues jobs.
- `workers/notificationWorker.js` sends via `firebase-admin`.
- The `cooling_down` state exists so a user who ignores notifications gets fewer, rather than being spammed into disabling them entirely.

### 5.9 Focus Guardian

A distraction detector. `models/ActiveWindow.js` plus `hooks/useHeartbeat.js` on the client track engagement; when the user drifts away, a personalised nudge fires. Paired with a purpose-built player (`components/Player/`) that has no recommendations, shorts, or ads.

### 5.10 Auth

- **Email/password:** bcrypt hash on register, compare on login.
- **Google OAuth:** `@react-oauth/google` returns a credential JWT; backend verifies it with `google-auth-library` and links or creates the account by `googleId`.
- **Token model:** short-lived access token (15 min) plus long-lived refresh token (7 days), both httpOnly cookies, with a `Bearer` header fallback for iOS Safari and incognito where third-party cookies are blocked.
- **Session documents:** each login creates a `Session` row. Auth middleware checks the session is not revoked and not expired on every request, which makes server-side logout and "revoke all devices" possible — something pure stateless JWT cannot do.
- **Refresh flow in `services/api.js`:** on a 401, a module-level `isRefreshing` flag ensures only one refresh call fires; concurrent failed requests are pushed onto a `failedQueue` and replayed once the new token arrives. Prevents a refresh stampede when five requests 401 simultaneously.

---

## 6. Data Models (18 collections)

| Model | Holds |
|---|---|
| `User` | Auth, XP, level, streak object, badges, unlocked features, FCM token, timezone, geo metadata, role. |
| `Course` | Title, status, sections with nested lectures, totals, thumbnail. |
| `Progress` | Per user per course: completed lecture IDs, per-lecture progress, completion percentage. |
| `Transcript` | Full text plus timestamped segments for one lecture. |
| `Quiz` / `QuizAttempt` | Generated questions; each submission with score and timing. |
| `XPAward` | Immutable audit row per XP grant. Powers the dedup window and history charts. |
| `Roadmap` | Config plus the generated day array. |
| `StudySession` / `ActiveWindow` | Time tracking and focus detection. |
| `DoubtQuery` / `DoubtAnswer` | Chatbot Q&A history. |
| `EmbeddingStatus` | Per-lecture indexing state, so the UI can show "AI is analysing this video". |
| `Notes` | AI-generated and user-edited notes. |
| `Session` | Active login sessions for revocation. |
| `FriendZone` | Squad membership and join code. |
| `Feedback` | In-app feedback submissions. |
| `NotificationLog` | Delivery history, prevents duplicate sends. |

---

## 7. The Async Pipeline — 9 Queues

| Queue | Worker | Job |
|---|---|---|
| `course-processing` | `courseProcessor` | YouTube fetch, pagination, duration parsing, structure build. |
| `transcription` | `transcriptionWorker` | Caption scrape, Whisper fallback. |
| `topics` | `topicsWorker` | Timestamped topic extraction for the player sidebar. |
| `quiz` | `quizWorker` | Quiz generation from transcript. |
| `notes` | `notesWorker` | AI notes generation. |
| `embedding` | `embeddingWorker` | Chunk, embed, upsert to Pinecone. |
| `streak` | `streakWorker` | Nightly streak evaluation and freeze-token consumption. |
| `notification` | `notificationWorker` | FCM delivery. |
| (cron) | `notificationScheduler` | Hourly scan that enqueues notification jobs. |

**Resilience detail worth mentioning:** workers are loaded inside a `try/catch` in `index.js`. If Redis is unavailable the server logs a warning and continues serving HTTP traffic without background processing, rather than crash-looping.

---

## 8. Performance and Reliability Decisions

- **`dbReady` middleware** returns 503 in under a millisecond during a Mongo outage instead of letting requests hang until axios times out at 12 seconds.
- **Fire-and-forget session touch:** `Session.updateOne({ lastUsedAt })` is intentionally not awaited in auth middleware. It removed a synchronous Mongo round-trip from every authenticated request.
- **Optimistic UI with debounced writes:** in `CourseDetail.jsx`, ticking a lecture updates local state instantly and queues the write in a ref. All pending toggles flush after 5 seconds of inactivity, and on unmount. Marking 20 lectures fires one batch, not 20 requests.
- **Undo window:** course deletion hides the card optimistically and runs a 5-second countdown before the actual API call, so undo requires no server round-trip.
- **Cross-tab sync:** a `storage` event listener plus a custom `questxp_progress_updated` event keep multiple open tabs consistent. Each tab has an ID so it ignores its own broadcasts.
- **Code splitting:** React Router lazy routes plus `rollup-plugin-visualizer` to inspect bundle composition.
- **Fail-open vs fail-closed rate limiting:** the global IP limiter passes traffic through if Redis is down (availability matters more than perfect throttling); the AI chatbot limiter blocks (cost control matters more than availability).

---

## 9. Frontend Architecture Notes

- **State split:** Zustand for client state that outlives a route (auth, gamification). React Query for anything that came from the server. The rule is that server data is never copied into Zustand — that avoids two sources of truth going stale.
- **Feature gating:** `useFeatureGate('DOUBT_CHATBOT_LIMITED')` returns `{ locked, requiredLevel, xpToUnlock }`, rendered by `LockedFeature.jsx`. Purely presentational; `middleware/featureGate.js` is the enforcement.
- **Error boundary:** `ErrorBoundary.jsx` catches render crashes; client errors POST to `/api/logs`, which is mounted before the rate limiter so reports survive a Redis outage.
- **Theming:** every colour is a CSS custom property in `index.css`; `tailwind.config.js` references `var(--token)`. A single `dark` class on `<html>` swaps the whole palette. An inline script in `index.html` resolves the theme before first paint to prevent a flash.
- **SEO:** `react-helmet-async` with three JSON-LD blocks (`SoftwareApplication`, `Organization`, `WebSite`) for rich-result eligibility.

---

## 10. Likely Interview Questions and Answers

**Why MongoDB and not PostgreSQL?**
Course structure is nested and irregular — a course has sections, sections have lectures, and shape varies by playlist. Storing that relationally means three tables and a join on every read. As a document it is one read. The tradeoff is no foreign-key enforcement, so referential integrity is handled in application code.

**Why a queue instead of doing it in the request?**
A 200-video playlist means paginated YouTube calls, transcript fetches, and multiple LLM round-trips. That is minutes of work. HTTP would time out, and a retry would restart from zero. BullMQ gives retries with backoff, persistence across restarts, and concurrency limits so we do not exhaust the OpenAI rate limit.

**How do you stop users farming XP?**
Three layers. `XPAward` dedup on `(user, actionType, resourceId)` inside a 24-hour window. Atomic `$inc` so concurrent awards cannot race. And completion requires passing a quiz, not just playing a video.

**How do you keep the RAG bot from hallucinating?**
A relevance threshold. If the top Pinecone match scores below 0.75 the lecture context is dropped entirely and the prompt explicitly tells the model to answer from general knowledge and set `usedGeneralKnowledge: true`. The output is then validated against a JSON Schema with ajv. So the bot never fabricates a citation to a timestamp that does not support the claim.

**Why `gpt-4o-mini` and not a larger model?**
Cost and latency. Chapterization runs on transcripts that can be 100k+ characters, and quiz generation runs per lecture. At volume the price difference is the difference between viable and not. All prompts return structured JSON with `temperature: 0.1`, where the smaller model performs comparably to a larger one.

**What is the hardest bug you fixed?**
The token-refresh stampede. When five requests 401 at once, five refresh calls fire, four of which use an already-rotated refresh token and fail, logging the user out. The fix is an `isRefreshing` flag with a `failedQueue` — the first 401 triggers the refresh, the rest park on a promise and replay once it resolves.

**Where would this break at scale?**
Three places. Embedding cost grows linearly with content and there is currently no cache for identical videos across users. Pinecone namespace-per-lecture is clean but has a namespace-count ceiling on some plans. And the notification cron scans all users hourly, which needs an index on timezone plus batching past roughly 100k users.

**What would you do differently?**
Add integration tests around the worker pipeline — right now it is manually verified. Introduce a per-video transcript cache keyed by YouTube ID so two users importing the same playlist do not pay to embed it twice. Move `faster-whisper` out of a spawned child process into a separate containerised service so backend deploys are not coupled to a Python environment.

---

## 11. Numbers Worth Memorising

- Access token **15 min**, refresh token **7 days**.
- Chunking: **500 chars, 200 overlap**. RAG `topK = 5`, relevance floor **0.75**.
- Global rate limit **1000 req / 15 min per IP**. Chatbot **3/hr** level 1, **7/hr** level 2+.
- Roadmap efficiency factor **75%**.
- Streak multipliers: **1.25× / 1.5× / 2× / 3×** at 7 / 14 / 30 / 100 days.
- **10 levels**, 0 → 20,000 XP. **29 XP action types**. **18 Mongo models**. **9 queues and workers**. **15 route files**.
- YouTube API caps: **50 items per page**, **50 video IDs per batch**.
- Course status polling: every **3 seconds**, only while processing.
- Progress write debounce: **5 seconds**. Delete undo window: **5 seconds**.

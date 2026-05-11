# QuestXP Technical Implementation Guide

This document tracks major backend architectural decisions and feature implementations for learning and interview preparation.

---

## 1. Identity & Anonymous Username System

### The Problem
Allowing users to compete globally while protecting their real identity (Name/Email) and ensuring existing users don't break the system.

### The Solution
A **Sparse Unique Identity System**.

- **Utility (`utils/nameGenerator.js`)**: 
  - Uses a combinatoric approach: `Adjective` + `AnimeCharacter` + `Random4DigitID`.
  - ensures high entropy (1,600,000+ unique combinations) to prevent collisions during auto-assignment.
  
- **Model Design (`models/User.js`)**:
  - `username`: `type: String, unique: true, sparse: true`.
  - **Sparse Indexing**: This is the "magic" for production. In MongoDB, a standard unique index fails if multiple users have a `null` value. A `sparse` index only enforces uniqueness for fields that *actually exist*, allowing existing users to remain `null` until they get assigned a handle.
  
- **Lazy Assignment (`routes/gamification.js`)**:
  - The leaderboard API checks `if (!p.username)`.
  - If missing, it generates one on-the-fly and saves it back to the DB.
  - This "Lazy Load" pattern avoids expensive database migration scripts for existing users.

---

## 2. Global Leaderboard Architecture

### Design Pattern
**Aggregate & Transform**.

- **Sorting**: Done at the DB level using `.sort({ totalXP: -1 })`.
- **Scaling**: Capped at `.limit(50)` to keep API response times constant regardless of user base size.
- **Frontend Sync**: The response includes an `isMe` boolean by comparing `req.user._id` with the player's ID. This allows the frontend to highlight the current user without extra client-side logic.

### UI Implementation
- **Podium Logic**: The frontend maps indices `[1, 0, 2]` to the top 3 players to create the classic "Center-High" podium layout visually.

---

## 3. Productivity Metrics Engine

### Metrics Calculation
- **Rank**: Calculated via a weighted XP comparison.
- **Percentile**: (Rank / TotalUsers) * 100.
- **Study Time**: Aggregated from `Progress` model by summing durations of `completedLectures`.

### API Structure (`/api/dashboard/stats`)
Uses `Promise.all` to fetch stats in parallel (Rank, Study Time, Deadlines, Mastery) to minimize TTFB (Time to First Byte).

---

## 4. Security & Validation

- **Case Insensitivity**: Usernames are stored in `.toLowerCase()` to prevent users from claiming `Goku` and `goku` separately.
- **Regex Sanitization**: Frontend and Backend both enforce `/[^a-z0-9_]/g` to prevent special characters or injection attempts in handles.

---

## 5. V1 Identity Pivot (Name Sync)

### The Decision
To maximize privacy and minimize user friction, the platform now treats the "Identity Name" (Username) as the user's primary name across the entire system.

### Technical Implementation
- **Automatic Sync**: In `authController.js`, both the registration and `updateUsername` flows now set `user.name = user.username`.
- **Dynamic Avatars**: The frontend `NavBar` and `Profile` headers calculate initials dynamically using `.split(/[ _]/).map(n => n[0]).join('')`. This supports both space-separated and underscore-separated identity names.
- **Privacy Enforcement**: The "Real Name" field has been removed from the public-facing UI to ensure that only the chosen identity is visible to others.

---

## 6. Project Communication Standards

### Git Commit Messages
- **Format**: Plain English, one-line only, no machine prefixes.
- **Purpose**: To maintain a beginner-friendly and professional history that reads like a development log rather than a machine-generated list.

---

## 7. "Anti-Vibe" Production Refactor

### The Problem
Early-stage "vibe coding" (fast feature building) led to monolithic components, inline business logic, and "fat" controllers, making the codebase hard to maintain.

### The Solution: production-grade refactoring

- **Logic Gating via Hooks (`hooks/useLectureStatus.js`)**:
  - **Pattern**: Polling logic was moved from `Player.jsx` into a dedicated custom hook.
  - **Benefit**: Automates side-effect cleanup (clearInterval) and prevents memory leaks. Components stay "dumb" (UI-focused).

- **Service Layer Orchestration (`services/courseService.js`)**:
  - **Pattern**: Moved 30+ lines of course deletion logic (cleaning up Transcripts, Notes, Quizzes, Progress) into a service.
  - **Benefit**: Controller is reduced to 5 lines. Logic is now reusable and can be tested in isolation from HTTP concerns.

- **Atomic UI Extraction**:
  - **Pattern**: Isolated `CourseSearch` from `NavBar.jsx`. 
  - **Benefit**: Improves build-time performance via smaller chunks and allows for independent testing of the search engine.

---

## 8. Optimistic UI & Zero-Latency Design

### The Problem
API round-trips for state mutations (like shifting a schedule or marking progress) create a "janky" experience where the user waits for a spinner before seeing their action reflected.

### The Solution
Implement **Optimistic Updates** across high-traffic interactions.

- **Implementation Strategy**:
  1. **Mutate State Immediately**: Update local state/Zustand store the instant the user clicks.
  2. **Background Sync**: Fire the API call with a debounce (to handle rapid clicks).
  3. **Silent Reconciliation**: When the server responds, overwrite the local state with the ground truth.
  4. **Error Handling**: If the API fails, trigger a "Revert & Sync" to keep data consistent.

- **Current Use Cases**:
  - **Roadmap Schedule**: Plus/Minus buttons shift dates instantly while the generator runs in the background.

- **Future Roadmap for Optimistic UI**:
  - **Lecture Completion**: Update progress bars and XP totals before the DB write finishes.
  - **Doubt Chatbot**: Push user messages to the UI stack instantly before the LLM streaming starts.
  - **Course Deletion**: Remove from dashboard list immediately with a "Undo/Canceling" window.

---

## Interview Questions Solved

1. **How do you handle a unique field for existing users without a migration?**
   *Answer*: Use a Sparse Unique Index in MongoDB and Lazy-assignment logic in the API.
2. **How do you optimize a leaderboard for performance?**
   *Answer*: Cap the limit (Top 50), use indexing on the sorting field (XP), and only fetch required fields (Projection).
3. **How do you ensure UI consistency across different user states?**
   *Answer*: A `usernameSet` boolean flag that determines whether to show a "Claim Identity" prompt or the actual profile.
4. **Why use a Service Layer in Express?**
   *Answer*: To decouple business logic from transport logic. This makes the app easier to test, maintain, and adapt.
5. **How do you protect expensive AI features from spam?**
   *Answer*: Use user-level rate limiting with Redis-backed state, tied to the user's level.

---

## 9. Unified AI Orchestration & RAG Protection
**Centralized AIProvider Service**. All AI interactions route through `services/ai-provider.js`, allowing seamless provider swaps and feature-level rate limiting (3-7 req/hr).

## 10. Security Infrastructure Hardening
Integrated `helmet` and `hpp`. Global rate limiting (1000 req/15 min) is positioned *after* auth routes to prevent lockout.

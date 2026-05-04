# QuestXP File Structure Reference

This file explains the project structure and highlights files changed during each task.

## Top-Level Structure

```text
QuestXP/
  backend/                 Express API, MongoDB models, services, queues, workers
  frontend/                React/Vite frontend
  Docs/                    Engineering documentation created during implementation
  design-system/           Design-system assets and references
  specs/                   Product/specification references
  docker-compose.yml       Local MongoDB and Redis services
  README.md                Project overview and setup guide
```

## Backend Structure

```text
backend/
  package.json             Backend scripts and dependencies
  src/
    app.js                 Express app setup, middleware, route mounting
    index.js               Server entrypoint, MongoDB connection, worker loading
    constants/             XP, levels, badges, AI pipeline constants
    controllers/           Request handlers
    middleware/            Auth, feature gates, AI logging, embedding checks
    models/                Mongoose schemas
    queues/                BullMQ queue definitions and Redis connection helpers
    routes/                Express routers
    schemas/               AI output validation schemas
    scripts/               Maintenance/setup scripts
    services/              Business logic and integrations
    utils/                 Shared backend helpers
    workers/               Background job processors
  test/                    Backend integration tests
```

## Frontend Structure

```text
frontend/
  package.json             Frontend scripts and dependencies
  src/
    App.jsx                App routes and main UI shell
    services/              API client modules
    store/                 Zustand state stores
    pages/                 Route-level screens
    components/            Reusable UI components
    constants/             Shared frontend constants
    hooks/                 React hooks
```

## Task 001 File Changes

### Added

```text
backend/src/models/Session.js
backend/src/utils/authTokens.js
backend/test/auth.integration.test.js
Docs/README.md
Docs/TASK-001-AUTHENTICATION.md
Docs/FILE-STRUCTURE.md
Docs/DEPLOYMENT-READINESS.md
```

### Updated

```text
backend/package.json
backend/src/controllers/authController.js
backend/src/middleware/auth.js
backend/src/models/index.js
backend/src/routes/auth.js
frontend/src/services/api.js
README.md
```

## Why These Files Changed

| File | Why it changed | Product effect |
|---|---|---|
| `backend/src/models/Session.js` | Added persistent session tracking | Enables logout, refresh rotation, device tracking |
| `backend/src/utils/authTokens.js` | Centralized token/cookie behavior | Reduces duplicated auth logic |
| `backend/src/controllers/authController.js` | Implemented session issue, refresh, logout, logout-all | Makes auth stateful and revocable |
| `backend/src/middleware/auth.js` | Requires active session for protected routes | Blocks revoked or expired sessions |
| `backend/src/routes/auth.js` | Added `/signup`, `/refresh`, `/logout-all` | Matches Phase 1 API requirements |
| `frontend/src/services/api.js` | Retries requests after access-token refresh | Keeps users logged in across short token expiry |
| `backend/test/auth.integration.test.js` | Added end-to-end auth tests | Proves behavior against real MongoDB |
| `backend/package.json` | Replaced placeholder test script | Enables `npm test` |
| `README.md` | Added current implementation and docs references | Keeps project overview current |

## Current Auth Flow

```text
Signup/Login
  -> validate input
  -> create or find user
  -> create Session
  -> issue 15 min accessToken cookie
  -> issue 7 day refreshToken cookie
  -> store hash(refreshToken) in Session

Protected route
  -> read accessToken cookie
  -> verify JWT
  -> load user
  -> load active Session
  -> allow request

Refresh
  -> read refreshToken cookie
  -> verify JWT
  -> load Session
  -> compare hash(refreshToken)
  -> if valid, rotate refresh token
  -> if reused/invalid, revoke sessions

Logout
  -> identify current session
  -> set revokedAt
  -> clear cookies
```

## UI 001 File Changes

### Added

```text
PRODUCT.md
DESIGN.md
Docs/UI-001-PROFESSIONAL-REDESIGN.md
```

### Updated

```text
frontend/tailwind.config.js
frontend/src/index.css
frontend/src/App.jsx
frontend/src/components/NavBar.jsx
frontend/src/components/Course/CourseCreationForm.jsx
frontend/src/components/Dashboard/XPLeaderboardSidebar.jsx
frontend/src/pages/Auth.jsx
frontend/src/pages/Dashboard.jsx
frontend/src/pages/LandingPage.jsx
frontend/src/pages/Profile.jsx
```

## Current Design System Direction

```text
QuestXP UI
  -> product-first learning workspace
  -> warm neutral background
  -> white/off-white cards
  -> green primary actions
  -> amber XP accent
  -> Inter/system-style typography
  -> minimal glow, no purple-blue gradient styling
```

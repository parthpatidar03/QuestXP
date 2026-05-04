# Deployment Readiness

## Current Answer

The project is **not ready for a real full-product live deployment yet**.

The frontend can be deployed as a static Vite app later, but the full QuestXP product currently needs:

- persistent backend hosting for Express
- a separate worker process for BullMQ jobs
- MongoDB
- Redis
- production environment variables
- safe secret rotation
- CORS/cookie configuration for the deployed domains

Vercel is a good fit for the frontend. It is not the best fit for the current backend and worker shape because QuestXP needs long-running background workers and Redis-backed queues.

## What Can Be Deployed Today

### Frontend Preview

Technically possible after setting:

```env
VITE_API_URL=https://your-backend-domain/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

But without a live backend URL, the frontend would mostly be a UI shell and auth/API calls would fail.

Local production build check:

```bash
cd frontend
npm run build
```

Latest result: build passed. Vite reported a large chunk warning, which is not a deployment blocker but should be optimized later.

### Backend Preview

Possible on a backend-friendly host, but not yet recommended.

Better targets:

- Render
- Railway
- Fly.io
- DigitalOcean App Platform
- AWS ECS
- Google Cloud Run for API plus separate worker service

Required services:

- MongoDB Atlas
- Upstash Redis or another managed Redis
- deployed API service
- deployed worker service

## Current Deployment Blockers

| Blocker | Why it matters |
|---|---|
| No production backend host configured | Frontend needs a real API URL |
| No worker deployment setup | Course ingestion and AI jobs depend on workers |
| No production MongoDB/Redis config committed as examples | Deployment needs clear env contract |
| Local `.env` contains real-looking secrets | Secrets must be rotated before going public |
| No Dockerfile yet for backend/worker | Harder to deploy backend and worker consistently |
| CORS/cookie settings need final deployed domains | Auth cookies depend on correct cross-site settings |
| No rate limiting yet | Public auth endpoints are not abuse-resistant |

## Vercel Status

The Vercel CLI is installed locally, so a frontend preview deployment can be started when there is a real backend URL to point `VITE_API_URL` at.

Recommended Vercel use for this project:

- deploy `frontend/` to Vercel
- deploy `backend/` to a backend host
- deploy workers as a separate long-running service

## Before Going Live Checklist

1. Rotate all exposed keys.
2. Create `backend/.env.example`.
3. Create `frontend/.env.example`.
4. Choose backend host.
5. Provision MongoDB Atlas.
6. Provision managed Redis.
7. Deploy backend API.
8. Deploy worker process separately.
9. Set `FRONTEND_URL` to the deployed frontend domain.
10. Set frontend `VITE_API_URL` to deployed API URL.
11. Run auth tests against staging.
12. Add rate limiting before any public launch.

## Recommended Next Deployment Step

Do not deploy the full app yet.

First implement Phase 1 Task 2 and Task 3:

- Course Creation API
- Queue + Worker Setup

Then add:

- `.env.example`
- Dockerfile for backend
- Dockerfile or process command for worker
- deployment guide for API + worker + MongoDB + Redis

At that point a preview deployment will be meaningful instead of only partially functional.

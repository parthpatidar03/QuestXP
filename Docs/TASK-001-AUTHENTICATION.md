# Task 001 - Authentication System

## Goal

Implement QuestXP Phase 1 Task 1: a secure authentication baseline with signup, login, logout, protected route access, refresh-token rotation, and database-backed session tracking.

## What Was Built

The previous auth flow used one long-lived JWT cookie named `token`. That was not enough for the product spec because it could not rotate refresh tokens, track active devices, revoke sessions, or detect token reuse.

The new auth flow uses:

- `accessToken` cookie: short-lived JWT, 15 minutes
- `refreshToken` cookie: rotating JWT, 7 days
- `Session` database record for each login/signup
- hashed refresh token storage
- session revocation on logout
- global session revocation on refresh-token reuse detection

## Routes Added Or Updated

| Route | Status | Purpose |
|---|---:|---|
| `POST /api/auth/signup` | Added | Spec-aligned signup endpoint |
| `POST /api/auth/register` | Preserved | Existing frontend compatibility |
| `POST /api/auth/login` | Updated | Creates access token, refresh token, and session |
| `POST /api/auth/refresh` | Added | Rotates refresh token and issues new access token |
| `POST /api/auth/logout` | Updated | Revokes the current session |
| `POST /api/auth/logout-all` | Added | Revokes all active user sessions |
| `GET /api/auth/me` | Updated | Requires a valid access token and active session |

## Important Files Changed

### `backend/src/models/Session.js`

New model that stores server-side session state.

Fields:

- `user`: owner of the session
- `refreshTokenHash`: SHA-256 hash of the current refresh token
- `userAgent`: browser or client info
- `ip`: request IP
- `lastUsedAt`: updated when a protected route or refresh is used
- `expiresAt`: refresh-token expiry, also used by MongoDB TTL cleanup
- `revokedAt`: set when a session is invalidated
- `revokeReason`: explains why it was revoked

Effect:

The backend can now invalidate sessions even if a JWT has not expired yet.

### `backend/src/utils/authTokens.js`

New helper module for token and cookie logic.

Responsibilities:

- create access tokens
- create refresh tokens
- verify access tokens
- verify refresh tokens
- hash refresh tokens
- set auth cookies
- clear auth cookies

Effect:

Token behavior is centralized instead of duplicated in controllers and middleware.

### `backend/src/controllers/authController.js`

Updated the auth controller to:

- create session records on signup/login/Google login
- store only hashed refresh tokens
- rotate refresh tokens on refresh
- detect refresh-token reuse
- revoke sessions on logout
- return `activeSessions` from `/auth/me`

Effect:

Auth now matches the Phase 1 spec much more closely and supports future device/session management.

### `backend/src/middleware/auth.js`

Updated protected-route auth.

The middleware now requires:

- valid `accessToken` cookie
- token type must be `access`
- user must exist
- session must exist
- session must not be revoked
- session must not be expired

Effect:

Protected routes are tied to active server-side sessions, not just JWT signature validity.

### `backend/src/routes/auth.js`

Added spec-aligned endpoints and wired controller functions.

Effect:

The API now exposes the required Phase 1 auth surface while keeping existing frontend compatibility.

### `frontend/src/services/api.js`

Updated Axios response handling.

Behavior:

1. If a protected request returns `401`, call `/auth/refresh`.
2. If refresh succeeds, retry the original request once.
3. If refresh fails, redirect to login.

Effect:

The frontend can survive normal access-token expiry without forcing the user to log in again.

### `backend/test/auth.integration.test.js`

Added integration tests using Node's built-in test runner.

The test starts a temporary local `mongod` process and verifies the auth flow against Express routes and real MongoDB persistence.

Covered:

- signup creates cookies and a session
- protected `/auth/me` works
- multiple sessions are tracked
- refresh rotates the refresh token
- reused refresh tokens are rejected
- refresh-token reuse revokes active sessions
- logout invalidates current tokens

## Security Impact

Improved:

- refresh tokens are no longer stored raw in MongoDB
- refresh tokens rotate on use
- replayed old refresh tokens trigger revocation
- access tokens are short-lived
- protected routes require active database sessions
- logout invalidates the current server-side session

Remaining Phase 1/Phase 3 work:

- add auth route rate limiting
- add stronger password rules
- add account lockout or login-attempt throttling
- add structured audit logs for auth events
- add email verification later
- rotate any exposed local development secrets before deployment

## Testing

Backend test command:

```bash
cd backend
npm test
```

Result:

```text
4 pass
0 fail
```

Frontend build command:

```bash
cd frontend
npm run build
```

Result: build passed. Vite reported large chunk/code-splitting warnings, which are not caused by this auth change and are not blocking Task 1.

## Notes For Learning

JWTs are stateless by default. That is convenient, but it means the server cannot easily revoke a token after issuing it.

QuestXP now uses a hybrid approach:

- access token proves identity for a short time
- refresh token extends the session
- database `Session` record gives the server control

This lets the backend answer important security questions:

- Is this device still logged in?
- Was this refresh token already replaced?
- Should this user be logged out everywhere?
- Can this specific session be revoked?

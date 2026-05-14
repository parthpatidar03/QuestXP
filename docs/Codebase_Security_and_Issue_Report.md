# Codebase Security & Issue Report

**Role:** Senior Security Analyst & Architect  
**Scope:** Full-stack codebase (Backend API, Frontend UI, Database Models)  
**Date:** Current  

## Executive Summary
The application has a solid foundation with modern security practices like Helmet, HPP, and rate limiting. However, there are critical vulnerabilities in CORS configuration, business logic flaws in gamification, scalability bottlenecks in the database queries, and missing protections against brute force attacks. 

Below is a detailed breakdown of every hidden bug, vulnerability, and architectural issue that can break production or compromise users.

---

## 1. Critical Security Vulnerabilities

### 1.1 CORS Misconfiguration (Subdomain Takeover Risk)
**Location:** `backend/src/app.js` (Lines 40-44)
**Issue:** 
```javascript
origin.endsWith('.vercel.app')
```
**Impact:** Any user can create a Vercel project (e.g., `https://hacker-questxp.vercel.app`) and it will bypass CORS checks. This allows attackers to perform cross-site request forgery or steal session cookies if SameSite is poorly configured.
**Fix:**
Use an exact match for production domains or a strict Regex.
```javascript
const allowedOrigins = ['https://questxp.in', 'https://www.questxp.in', 'https://your-exact-app.vercel.app'];
const isAllowed = allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));
```

### 1.2 Authentication Brute Force & Credential Stuffing
**Location:** `backend/src/routes/auth.js`
**Issue:** There is no specific rate limiting on `/login` or `/register`. They only fall under `globalLimiter` (1000 requests / 15 minutes).
**Impact:** Attackers can easily run automated credential stuffing attacks to guess passwords or enumerate user accounts.
**Fix:** Create a strict limiter in `rateLimiter.js`.
```javascript
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 5, // 5 attempts
    message: "Too many login attempts."
});
// Apply to router.post('/login', loginLimiter, authController.login)
```

### 1.3 Gamification API Abuse (Heartbeat Spoofing)
**Location:** `backend/src/routes/gamification.js` (Line 197)
**Issue:** 
```javascript
const seconds = parseInt(req.body.seconds) || 60;
await User.findByIdAndUpdate(userId, { $inc: { totalStudyTime: seconds } });
```
**Impact:** A user can send a POST request with `{ "seconds": 999999999 }` and instantly top the leaderboards or break XP algorithms. Trusting client input directly for gamification metrics is a fatal logic flaw.
**Fix:** Cap the maximum allowed value to a reasonable threshold (e.g., 120 seconds for a 60s ping interval).
```javascript
const clientSeconds = parseInt(req.body.seconds) || 60;
const seconds = Math.min(clientSeconds, 120); // Cap at 2 minutes max per ping
```

---

## 2. Scalability & Production Crash Risks

### 2.1 Unpaginated Leaderboard Query (OOM Crash)
**Location:** `backend/src/routes/gamification.js` (Line 161)
**Issue:** 
```javascript
const players = await User.find({}, 'name username ...').sort({ totalXP: -1 });
```
**Impact:** As the platform grows to 10,000+ users, this query will load all users into RAM, causing the Node.js process to run out of memory (OOM) and crash.
**Fix:** Add pagination or limit the leaderboard to top 100 users.
```javascript
const players = await User.find({}).sort({ totalXP: -1 }).limit(100);
```

### 2.2 Redis Failure Causes Global API Crash
**Location:** `backend/src/middleware/rateLimiter.js`
**Issue:** The rate limiter uses `redisClient.call(...args)`. If the Azure Redis instance disconnects or restarts, `call()` throws an unhandled exception.
**Impact:** Every single API request will return a 500 Internal Server Error or crash the app completely because the global rate limiter sits at the top of `app.js`.
**Fix:** Implement a fallback mechanism or wrap the Redis call.
```javascript
sendCommand: async (...args) => {
    try {
        return await redisClient.call(...args);
    } catch (err) {
        // Fallback or fail open if Redis is down
        console.error("Redis down, failing open");
        return null; 
    }
}
```

---

## 3. Temporary Solutions & Tech Debt

### 3.1 Refresh Token Grace Period
**Location:** `backend/src/controllers/authController.js` (Line 187)
**Issue:** There is a 30-second grace period for refresh token reuse (`wasJustUsed`). 
**Impact:** If a token is stolen, the attacker has a 30-second window to use it without triggering the security revocation protocol.
**Fix:** Reduce this to 2-5 seconds, which is enough to handle network race conditions (like a double-click on a React frontend) without leaving a wide attack window.

### 3.2 JWT Secret Fallback
**Location:** `backend/src/utils/authTokens.js` (Line 19)
**Issue:** If `JWT_SECRET` is missing, it falls back to `dev_secret` unless `NODE_ENV === 'production'`.
**Impact:** If an environment like "staging" or "preview" is deployed without setting `NODE_ENV=production`, it will use a highly predictable hardcoded secret, leading to total account takeovers.
**Fix:** Enforce `require('crypto').randomBytes(32).toString('hex')` as a fallback so it's secure by default if env vars fail, or simply hard crash the app if no secret is provided in any environment.

### 3.3 Frontend Dependency Vulnerabilities
**Location:** `frontend/package.json`
**Issue:** `npm audit` revealed multiple high/critical vulnerabilities in `jspdf`, `vite`, and `esbuild` regarding prototype pollution and unescaped CSS stringify.
**Impact:** While mostly dev-dependencies, `jspdf` is a client-side library and could allow PDF object injection if user input is rendered into a PDF.
**Fix:** `npm audit fix` was successfully run, but `jspdf` and `esbuild` require manual version bumps as they involve breaking changes.

---

## 4. User Experience (UX) Glitches

1. **Tour/Onboarding Race Condition**: The `updateUsername` generates a username automatically if missing. However, if a user visits the leaderboard *before* finishing onboarding, it assigns a random username immediately, potentially skipping the custom username prompt.
2. **"Public" Data Placeholders**: If the app uses hardcoded stats for public landing pages, as real users join, the stats won't update dynamically unless properly cached and invalidated.

## Action Plan (Checklist for Devs)
- [ ] Fix CORS origin logic in `app.js`.
- [ ] Add `.limit(100)` to the leaderboard query.
- [ ] Clamp `req.body.seconds` to `120` in the gamification heartbeat.
- [ ] Apply specific `express-rate-limit` configs to `/register` and `/login`.
- [ ] Add `try/catch` to Redis Store in `rateLimiter.js`.

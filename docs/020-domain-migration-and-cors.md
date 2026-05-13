# Domain Migration & CORS Fix (v0.20)

## Problem
After purchasing and migrating to `questxp.in`, users encountered:
1.  **CORS Errors**: The backend rejected requests from `https://www.questxp.in` because it wasn't in the allowed origins list.
2.  **Google Authentication Failures**: Users couldn't log in via Google.

## Solution Implemented

### 1. Backend CORS Update
Modified `backend/src/app.js` to dynamically allow requests from:
- `https://questxp.in` (Naked domain)
- `*.questxp.in` (All subdomains, including `www`)

**Reasoning:**
Hardcoding origins is brittle. By using `.endsWith('.questxp.in')`, we ensure that any subdomain the user might use (like a staging environment or `www`) is automatically trusted by the backend.

### 2. Google Authentication Resolution
Google Auth requires explicit authorization for each domain. Even if the backend trusts the domain, Google's servers will reject login attempts if the domain isn't registered in the **Google Cloud Console**.

## Required Manual Steps (For User)
To fully fix Google Auth, you MUST do the following:

1.  **Google Cloud Console**:
    - Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
    - Select your **OAuth 2.0 Client ID** (used for QuestXP).
    - Under **Authorized JavaScript origins**, add:
        - `https://questxp.in`
        - `https://www.questxp.in`
    - Under **Authorized redirect URIs**, ensure you have the correct callback if using custom redirects (usually not needed for the popup method but good to check).
    - **Save** and wait 5-10 minutes for changes to propagate.

2.  **Firebase Console** (If using Firebase for Auth UI):
    - Go to [Firebase Console](https://console.firebase.google.com/).
    - Go to **Authentication** > **Settings** > **Authorized domains**.
    - Add `questxp.in` and `www.questxp.in`.

## Why this happened?
CORS (Cross-Origin Resource Sharing) is a security feature where the browser asks the backend "Is it okay if I talk to you from this other website?". Since `questxp.in` was new, the backend didn't know it yet and said "No".

Google Auth fails because Google wants to prevent "Phishing". If someone copies your site and tries to trick users into logging in, Google checks the domain. Since `questxp.in` wasn't on the "Safe List" (Authorized Domains), Google blocked it.

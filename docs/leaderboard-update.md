# Dynamic Leaderboard Scaling

## Overview
Leaderboard previously hardcoded to 50 users. Updated to scale dynamically with database size.

## Changes
- **Backend**: Removed `.limit(50)` from `/api/gamification/leaderboard` route in `backend/src/routes/gamification.js`.
- **Frontend**: Updated `GlobalLeaderboardModal.jsx` to display `players.length` instead of static "50".
- **UI**: Increased visibility of total user count with larger font and primary color branding.

## Technical Details
- Query now returns all users sorted by XP.
- Frontend adapts header and ranking badge to reflect real-time user count.

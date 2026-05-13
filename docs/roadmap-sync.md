# Bi-Directional Roadmap & Progress Synchronization

This document explains the implementation and reasoning behind the synchronization between the Course Progress (Player) and the Learning Roadmap.

## Overview
Previously, the Roadmap and Course Progress were independent entities. Completing a video in the player would not mark it as "done" in the roadmap, and vice versa. This led to fragmented user experience and "dead" roadmap states.

## Implementation Details

### 1. Backend Sync Logic
We implemented a multi-layered sync strategy:

- **Active Sync (`progressService.toggleLecture`)**:
  - Whenever a user marks a lecture as complete/incomplete in the Course Player, the backend now searches for any active Roadmaps containing that `videoId`.
  - It automatically updates the `completed` status in the `Roadmap` model to match the `Progress` model.
  
- **On-Fetch Sync (`roadmap.js`)**:
  - When a user fetches their current roadmap (`GET /api/roadmap/current`), the backend performs a "Reactive Sync".
  - It fetches the user's overall progress for that course and ensures every video in the roadmap reflects the true state of the `Progress` model. This resolves any drifts caused by edge cases or race conditions.

- **Initial Sync (`roadmap.js` /generate)**:
  - When generating a new roadmap, the system now checks existing course progress.
  - If a user has already finished 5 videos, the new roadmap will start with those 5 videos pre-marked as complete.

### 2. Frontend Tab Consistency
To handle users having multiple tabs open (e.g., Roadmap in one, Course Player in another):

- **Window Focus Listeners**:
  - Both `Roadmap.jsx` and `Dashboard.jsx` now use `window.addEventListener('focus', ...)`.
  - When a user returns to a tab, the app automatically triggers a background re-fetch (throttled to 5 seconds) to ensure the UI is fresh.
  - This makes the sync feel "live" even across browser windows.

### 3. UI Enhancements
- Added a **Learning Progress** bar to the Roadmap header.
- This bar tracks actual video completion (Missions Done), while the existing **Time Progress** bar tracks the current date relative to the roadmap's start/end dates.

## Rationale & Alternatives
- **Why not WebSockets?**: While WebSockets provide real-time updates, they add significant complexity and server overhead. For a learning platform, focus-based refreshing combined with optimistic UI updates provides a 99% "real-time" feel with much lower cost and complexity.
- **Why bi-directional?**: Users might want to "plan ahead" in the Roadmap or "catch up" in the Player. Allowing both ensures the system adapts to the user's behavior, not the other way around.

## Beginner to Advanced Explanation
1. **Beginner**: When you click the checkmark in the player, it also clicks it in your roadmap.
2. **Intermediate**: We use a central service (`progressService`) that acts as the "source of truth", pushing updates to secondary models (`Roadmap`).
3. **Advanced**: We use optimistic UI updates for instant feedback, backed by a throttled "Reactive Sync" on fetch and focus-polling to handle multi-client consistency without the overhead of full state synchronization protocols.

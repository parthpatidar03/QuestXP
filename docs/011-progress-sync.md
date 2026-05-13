# Progress Synchronization System

## Overview
Bi-directional, live synchronization between **Course Player** and **Roadmap Hub**. Marking a video as completed in one view instantaneously updates the other when focused.

## Implementation Details

### Backend: Unified Toggle Logic
- **`progressService.toggleLecture`**: Single source of truth for toggling completion.
  - Handles `isCompleted: true/false`.
  - Awards XP only on first-time completion.
  - Automatically recalculates `completionPct` for the course.
- **`roadmap.js` Integration**: The roadmap completion route now calls `progressService.toggleLecture` to ensure Roadmap states match Course states.

### Frontend: Focus Listeners
- **`Roadmap.jsx`**: Added a 5s throttled focus listener. When user switches from Player tab to Roadmap tab, the roadmap refreshes to show newly completed items.
- **`CourseDetail.jsx`**: Added similar focus listener to refresh progress bar and mission ticks when returning from the Roadmap Hub.

## Reasoning
- **Consistency**: Users expect a "unified" progress state. If they finish a video in the player, the roadmap "tick" should appear.
- **Optimistic UI**: Both views update locally first for zero-lag feeling, then sync with the server.
- **Cross-Tab Sync**: Uses `window.focus` event to trigger background refreshes, ensuring data stays fresh without constant polling.

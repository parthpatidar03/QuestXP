# Dashboard Rebranding & Universal Roadmap Hub

## Overview
Renamed the core "My Courses" section to **Dashboard** to reflect its role as a centralized workspace for missions, stats, and roadmap management.

## Changes

### 1. Navigation Rebranding
- **Desktop**: "My Courses" -> "Dashboard"
- **Mobile**: "Courses" -> "Dashboard"
- Ensures users recognize the primary hub for their learning progress.

### 2. Page Content Updates
- Main heading changed from "Active Missions" to "Dashboard".
- "Load More Courses" updated to "Load More Missions" to match the mission-based gamification theme.

### 3. Reasoning
The term "Dashboard" better encapsulates the multi-functional nature of the page, which includes:
- Active Missions (Courses)
- Productivity Stats
- Rank and Percentile tracking
- Daily Mission widgets
- Study Streak calendar

### 4. Implementation Details
Modified `frontend/src/components/NavBar.jsx` and `frontend/src/pages/Dashboard.jsx`.
Consistent routing maintained at `/dashboard`.

## Related Features
- **Universal Roadmap**: Accessible via the "Roadmap" tab in the newly rebranded navbar.
- **Mission Management**: Creating a "New Mission" adds a card to the Dashboard.

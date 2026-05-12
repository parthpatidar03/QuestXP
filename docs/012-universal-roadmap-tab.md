# Universal Roadmap Tab & Title Management

## Overview
This feature transforms the roadmap section from a single course-locked view into a "Universal Tab" that aggregates all active study plans. It also introduces the ability for users to customize their roadmap titles for better organization.

## Implementation Details

### 1. Database Schema Evolution
- **File**: `backend/src/models/Roadmap.js`
- **Change**: Added `title: { type: String }` to the `RoadmapSchema`.
- **Reasoning**: To allow persistence of custom names.

### 2. Universal Roadmap Listing
- **Endpoint**: `GET /api/roadmap/all`
- **Logic**: Fetches all roadmaps where `status: 'active'` for the authenticated user, sorted by the most recent update.
- **Frontend**: When a user navigates to `/roadmap` without a `courseId`, the application now fetches this list and renders `UniversalRoadmapCard` components.

### 3. Title Editing (In-Place)
- **Endpoint**: `PATCH /api/roadmap/:roadmapId/title`
- **UI/UX**: Users can click on the roadmap title in the individual view to enter an "Edit Mode".
- **Logic**: Uses a local state for optimistic updates and syncs with the backend on "Enter" or click.

### 4. Direct Dashboard Integration
- **Component**: `Dashboard.jsx` (CourseCard)
- **Change**: Added a "Roadmap" link directly to each course card.
- **Benefit**: Faster access to specific study plans without navigating through the course overview.

## Why this approach?
- **Universal View**: Encourages users to manage multiple learning paths simultaneously.
- **Custom Titles**: Important for users who generate different versions of a roadmap for the same course (e.g., "Intensive 1-week" vs "Relaxed 1-month").
- **Consistency**: Maintaining the `/roadmap` route for both specific and global views keeps the URL structure intuitive.

## Alternatives Considered
- **Separate Route**: We considered `/roadmaps` (plural), but decided against it to keep the "Roadmap" concept unified in the user's mind.
- **Automatic Sync**: We decided on manual title editing instead of auto-syncing with course names to give users more control.

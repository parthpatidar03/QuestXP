# Roadmap Navigation & Universal Hub Fix

## Problem
In the production environment, clicking on specific roadmaps in the Universal Roadmap hub resulted in no action. This was caused by two primary issues:
1. **URL Collision**: Course-less ("Universal") roadmaps all linked to `/roadmap`, which resulted in no navigation change when already on the hub page.
2. **Missing Unique Identifiers**: The system relied solely on `courseId` to find roadmaps, but roadmaps generated from the Hub (multi-course) have `courseId: null`.

## Solution
We transitioned the navigation system to use unique Roadmap IDs (`_id`) as the primary identifier.

### 1. Backend Enhancements (`roadmap.js`)
Updated the `GET /api/roadmap/current` endpoint to support a new `roadmapId` query parameter.
- **Priority Logic**: If `roadmapId` is provided, the system fetches that specific document.
- **Fallback**: Continues to support `courseId` for direct navigation from course pages.

### 2. API Service Update (`roadmapApi.js`)
Updated `getCurrentRoadmap` to accept and transmit both `courseId` and `roadmapId`.

### 3. Frontend Routing Fixes (`Roadmap.jsx`)
- **Unique Links**: `UniversalRoadmapCard` now links to `/roadmap?id=${roadmap._id}`. This ensures every card has a distinct URL, forcing React Router to trigger the navigation cycle.
- **Dynamic Fetching**: The `Roadmap` component now extracts the `id` param from the URL and passes it to the fetcher.
- **State Synchronization**: Added `roadmapId` to the `useEffect` dependency array to ensure the page reloads correctly when switching between different roadmaps in the same view.

## Results
- Users can now open any roadmap from the hub, including those with multiple courses.
- Navigation is reactive and consistent across production and local environments.
- Optimistic UI updates remain intact for title editing and deletion.

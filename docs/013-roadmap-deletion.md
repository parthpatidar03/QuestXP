# Roadmap Management & Deletion

QuestXP now supports full lifecycle management for study plans, allowing users to declutter their Universal Roadmap hub.

## Features
- **Delete Roadmap**: Users can permanently remove any roadmap from their dashboard.
- **Safety Confirmation**: To prevent accidental deletion, the system requires a confirmation before proceeding.
- **Optimistic UI**: The roadmap disappears instantly from the UI, with background sync to the server.
- **Automatic Cleanup**: Deleting a roadmap removes all associated progress tracking for those specific videos within that journey.

## Implementation Details
- **Backend**: Added `DELETE /api/roadmap/:roadmapId` endpoint.
- **Frontend**: 
    - Integrated `Trash2` icon into `UniversalRoadmapCard`.
    - Added `handleDeleteRoadmap` logic to `Roadmap.jsx`.
    - Styled with `bg-error/10` and hover-to-show transitions for a clean UX.

## How to Use
1. Go to the **Roadmap** section.
2. Hover over any roadmap card.
3. Click the red **Trash** icon.
4. Confirm deletion.

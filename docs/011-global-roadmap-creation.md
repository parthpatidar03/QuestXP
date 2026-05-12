# Global & Multi-Course Roadmaps

QuestXP now supports unified study roadmaps that span across multiple courses and playlists. This feature allows users to aggregate their entire learning queue into a single, cohesive schedule.

## Key Features

1.  **Unified Planning**: Select multiple courses or specific playlists from different courses to generate one roadmap.
2.  **Global Access**: A new `+ New Roadmap` button is available in the Roadmap tab, providing access to the full library for selection.
3.  **Cross-Course Scheduling**: The roadmap engine treats all selected videos as a single pool, applying the efficiency factor and capacity limits across all content.
4.  **Instant Switching**: Users can still maintain course-specific roadmaps or switch to a global view.

## UI Integration

-   **New Roadmap Button**: Located at the top of the `Roadmaps` page.
-   **Modal Filtering**: When triggered from the "Global" button, the roadmap modal displays all enrolled courses. When triggered from a specific course page, it defaults to that course but allows expansion.

## Implementation Details

-   **Backend Routing**: Updated `POST /api/roadmap/generate` to handle arrays of `playlistIds` and `sectionIds`.
-   **Storage**: Roadmaps with `courseId: null` are treated as global/unified plans.
-   **Regeneration**: Global plans can be regenerated or adjusted using the same granular `+`/`-` shifting logic.

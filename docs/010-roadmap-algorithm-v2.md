# Roadmap Generation Algorithm (V2)

## Overview
The Roadmap Generation algorithm has been updated to provide a more realistic and granular study plan for users. The core philosophy is that "1 hour of study goal != 1 hour of video content," as users need time for notes, practice, and comprehension.

## Key Changes

### 1. 75% Efficiency Rule
The algorithm now applies a **75% efficiency target** to the user's input hours. 
- **User Inputs:** 4 hours/day
- **Algorithm Targets:** 3 hours (180 mins) of raw video content.
- **Rationale:** Prevents burnout and ensures users actually have time to *study* the content, not just watch it.

### 2. Granular Video Mapping
To maximize the utility of the "Day Shift" (+/-) feature, videos are no longer "combined" into a single daily block in the data structure.
- Each video now receives its own **individual entry** in the roadmap.
- Videos that fit within the same daily capacity block share the same **calendar date**.
- Each video has a unique `dayIndex`.

### 3. Impact on UX (+/- Buttons)
Because each video is its own entry, the `+` and `-` buttons in the Roadmap UI now allow for **granular shifting**:
- If a user finishes one video but can't start the next one on the same day, they can click `+` on the *second* video.
- This moves that video (and all subsequent ones) to the next day, while keeping the first video on the original date.

### 4. Technical Fixes
- Resolved a unit mismatch where video durations (seconds) were being compared directly to daily capacity (minutes), which previously limited many days to a single video.
- Unified the 75% rule across both the manual **Roadmap** system and the automated **Study Plan** (Progress) system.

## Implementation Details
- **Location:** `backend/src/services/roadmapGenerator.js` and `backend/src/services/studyPlanService.js`
- **Units:** All internal calculations now correctly normalize to minutes.
- **Allocation:** Greedy forward-fill logic remains, but with separate object creation per video.

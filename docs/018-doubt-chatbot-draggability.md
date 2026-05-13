# Doubt Chatbot Refinement

## Overview
Improved the Doubt Chatbot's accessibility and solved UI overlap issues in the video player.

## Changes

### 1. Draggable Interface
- **Freedom of Movement**: Both the Doubt Bot FAB (floating action button) and the Chat Panel are now fully draggable using `framer-motion`.
- **Constraint-Aware**: Movement is constrained to the viewport boundaries to prevent the bot from being lost off-screen.
- **Zero Momentum**: Set `dragMomentum={false}` for precise, predictable positioning.

### 2. UI Conflict Resolution
- **Overlap Fix**: Repositioned the Pomodoro Timer's hidden toggle (`bottom-48`) and the Sidebar Toggle (`right-24`) to ensure they no longer overlap with the default Bot position.
- **Z-Index Audit**: Adjusted z-index stacking to ensure the active Chat Panel stays above most other UI elements but below critical system overlays.

## Technical Details
- **Implementation**: Wrapped the chatbot in a `constraintsRef` container with `fixed inset-0` and `pointer-events-none` to provide a full-screen canvas for dragging.
- **Interactivity**: Added `pointer-events-auto` to the draggable elements to preserve clickability while the parent container remains transparent to events.

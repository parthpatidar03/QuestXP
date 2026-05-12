# Landing Page Engagement Updates

## Stats Counter
- **Logic**: Fetches actual database metrics.
- **Caching**: Redis cached for 10 minutes (`public:stats`).
- **Metrics**:
    - **Active Learners**: `User.countDocuments()` + 20 (rounded up to 10).
    - **Quizzes Conquered**: `QuizAttempt.countDocuments()` + 150 (rounded up to 50).
    - **Missions Finished**: Sum of `Progress.completedCount` + 500 (rounded up to 100).
    - **Knowledge XP**: Sum of `User.totalXP` + 50k (rounded up to 1k).

## Wall of Love (Testimonials)
- **Component**: Horizontal scrolling carousel.
- **Interaction**: Pauses on hover.
- **User Personas**: Realistic handles (krish_dev, shadow_01, priyanka_tech).
- **Styling**: Glassmorphic cards with avatar initials.

## Backend
- **Endpoint**: `GET /api/public/stats`
- **Data**: Returns buffered metrics for landing page social proof.

## Global Interactive Effects
- **Mouse Glow**: A subtle green radial gradient follows the cursor globally.
- **Click Ripples**: Visual feedback on every click with scaling green rings.
- **Cursor**: Global `crosshair` cursor for an immersive, precise feel.

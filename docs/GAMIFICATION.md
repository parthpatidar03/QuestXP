# Gamification & Celebratory Effects

QuestXP uses high-energy visual feedback to reward user achievements and maintain high engagement levels.

## 🎨 Celebratory Visuals
We integrated `canvas-confetti` to trigger immersive visual celebrations at key milestones:

### 1. New User Welcome (Signup)
- **Effect**: `shootFireworks()`
- **Trigger**: Upon first successful registration or Google Login for new accounts.
- **Implementation**: The `Auth.jsx` component sets a `justSignedUp` flag in `localStorage`, which the `Dashboard.jsx` checks on mount to trigger the fireworks.

### 2. Course Creation
- **Effect**: `shootConfetti()`
- **Trigger**: Successfully adding a new course (YouTube playlist or One-Shot video).
- **Implementation**: Handled in `CourseCreationForm.jsx` within the success callback of the `/api/courses` POST request.

### 3. Mission Completion
- **Effect**: `shootConfetti()`
- **Trigger**: Completing a video lecture and its associated quiz.
- **Implementation**: Handled in `Player.jsx` within `handleMissionComplete` whenever XP is awarded.

## 🛠️ Technical Implementation
The utility is centralized in `frontend/src/utils/confetti.js` to ensure consistent performance and physics across the app.

```javascript
import confetti from 'canvas-confetti';

// Standard burst for milestones
export const shootConfetti = (origin) => { ... };

// Epic burst for major achievements (Signup)
export const shootFireworks = () => { ... };
```

## 📈 Impact on Engagement
- **Positive Reinforcement**: Immediate visual rewards create a "dopamine hit" associated with learning progress.
- **Premium Feel**: Celebratory effects add a layer of polish found in top-tier educational platforms like Duolingo.
- **User Delight**: Reduces the friction of starting new courses by making the setup process feel like a victory.

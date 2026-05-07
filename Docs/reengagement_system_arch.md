# Gen-Z Smart Re-engagement System

## 1. Stack
* **Backend:** Node.js (Express)
* **DB:** PostgreSQL (Prisma/TypeORM)
* **Queue:** Redis + BullMQ
* **Push:** Firebase Cloud Messaging (FCM)
* **AI:** OpenAI/Gemini API (dynamic text), simple ML/Stats (timing)

## 2. DB Schema (Postgres)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  timezone VARCHAR,
  fcm_token VARCHAR,
  last_active TIMESTAMP,
  streak INT,
  engagement_score FLOAT,
  notification_state VARCHAR -- 'active', 'cooling_down', 'stopped'
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  start_time TIMESTAMP,
  duration_mins INT,
  completed_lectures INT
);

-- Predicted Windows
CREATE TABLE active_windows (
  user_id UUID,
  day_type VARCHAR, -- 'weekday', 'weekend'
  best_hour_utc INT, -- 0-23
  confidence FLOAT,
  PRIMARY KEY (user_id, day_type)
);

-- Notification Logs
CREATE TABLE notif_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  tone VARCHAR,
  sent_at TIMESTAMP,
  opened BOOLEAN,
  content TEXT
);
```

## 3. Smart Timing Engine
* **Logic:** Circular mean of session start times (last 30 days).
* **Weighting:** Recent days = higher weight.
* **Update:** Cron runs nightly, updates `active_windows` per user.
* **Timezone:** Convert predicted UTC hour to local time. Skip 10 PM - 8 AM.

## 4. Emotional Escalation & Tones

| Inactivity | Tone | Example |
|---|---|---|
| 2-12h | Playful/Meme | "You opening reels again instead of studying? 👀" |
| 1 day | Guilt/Sarcastic | "Okay serious question… are we studying today or what 😓" |
| 3 days | Dramatic | "Your streak is fighting for survival rn 💀" |
| 7 days | Passive Aggressive | "We waited. You vanished. 🤡" |
| 14+ days | Soft Goodbye | "One last try. If no, we stop. Deal? 🤝" (Then set `notification_state = 'stopped'`) |

## 5. Queue Workflow (BullMQ)

1. **Hourly Cron (`SchedulerQueue`)**: 
   - Fetch users where `predicted_windows.best_hour_utc == current_hour` AND `last_active < NOW() - 4 hours` AND `state != 'stopped'`.
   - Push to `GeneratorQueue`.
2. **`GeneratorQueue`**:
   - Check user stats (streak, last active, preferred topics).
   - Determine tone based on inactivity gap.
   - Pick template OR call LLM for dynamic generation.
   - Push to `DeliveryQueue`.
3. **`DeliveryQueue`**:
   - Call FCM.
   - Insert to `notif_logs`.

## 6. Engagement Scoring
Score = (Session Freq * 0.4) + (Duration * 0.3) + (Completion % * 0.3).
* High score (>80): Send personalized flex ("You did 3 React lessons yesterday!").
* Low score (<30): Send low-barrier tasks ("Just watch 1 min to keep streak").

## 7. Spam Prevention / Cooldown
* Max 1 push / 24 hrs.
* If `opened == false` 3 days in a row -> drop frequency to 1 push / 3 days.
* After 14 days -> Stop completely.

## 8. Backend Folder Structure

```text
src/
├── workers/          # BullMQ processors (scheduler, generator, delivery)
├── services/         # FCM, AI, Analytics
├── repositories/     # DB access
├── algorithms/       # Timing prediction, scoring math
├── templates/        # JSON/text meme templates
└── api/              # Endpoints for webhook (opened, click tracking)
```

## 9. AI Text Generation (Pseudocode)

```javascript
async function generateNotifText(user) {
  const gapDays = getGapDays(user.last_active);
  const tone = determineTone(gapDays);
  
  const prompt = `
    Generate a 1-sentence push notification for a learning app.
    Tone: ${tone}. Gen-Z, meme-heavy, emotional.
    User name: ${user.name}. Streak: ${user.streak}.
    Last studied: ${user.last_topic}.
    Max 100 chars. Use emojis.
  `;
  
  return await llm.generate(prompt);
}
```

## 10. Scalability & Best Practices
* **Batching:** `SchedulerQueue` uses cursor pagination to fetch millions of users.
* **Rate Limits:** FCM bulk send (500 per batch).
* **A/B Testing:** Tag variants in `notif_logs`. Query conversion rates.
* **Idempotency:** Redis cache `sent_user_date` to prevent double-sends.

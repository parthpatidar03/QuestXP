const LEVELS = [
  { level: 1,  title: 'Curious Beginner',   threshold: 0,      unlockedFeatures: [] },
  { level: 2,  title: 'Active Learner',      threshold: 200,    unlockedFeatures: ['DOUBT_CHATBOT_LIMITED','MULTI_PLAYLIST','AI_NOTES_LIMITED'] },
  { level: 3,  title: 'Consistent Student',  threshold: 500,    unlockedFeatures: ['STUDY_PLAN','AI_NOTES_UNLIMITED','STREAK_FREEZE','QUIZ_LIMITED'] },
  { level: 4,  title: 'Knowledge Seeker',    threshold: 1000,   unlockedFeatures: ['FIVE_PLAYLISTS','DOUBT_CHATBOT_UNLIMITED','PDF_EXPORT','CUSTOM_QUIZ'] },
  { level: 5,  title: 'Dedicated Scholar',   threshold: 2000,   unlockedFeatures: ['COURSE_SHARE','LEADERBOARD','ANALYTICS','STREAK_FREEZE_3'] },
  { level: 6,  title: 'Deep Diver',          threshold: 3500,   unlockedFeatures: [] },
  { level: 7,  title: 'Concept Master',      threshold: 5500,   unlockedFeatures: ['UNLIMITED_PLAYLISTS','PRIORITY_PROCESSING','AI_PERSONA'] },
  { level: 8,  title: 'Domain Expert',       threshold: 8000,   unlockedFeatures: [] },
  { level: 9,  title: 'Elite Learner',       threshold: 12000,  unlockedFeatures: [] },
  { level: 10, title: 'Legendary Scholar',   threshold: 20000,  unlockedFeatures: ['ALL_FEATURES','LEGENDARY_BADGE','BETA_ACCESS'] },
];

const FEATURE_LEVELS = {
  DOUBT_CHATBOT_LIMITED: 2,
  MULTI_PLAYLIST: 2,
  AI_NOTES_LIMITED: 2,
  STUDY_PLAN: 3,
  AI_NOTES_UNLIMITED: 3,
  STREAK_FREEZE: 3,
  QUIZ_LIMITED: 3,
  FIVE_PLAYLISTS: 4,
  DOUBT_CHATBOT_UNLIMITED: 4,
  PDF_EXPORT: 4,
  CUSTOM_QUIZ: 4,
  COURSE_SHARE: 5,
  LEADERBOARD: 5,
  ANALYTICS: 5,
  STREAK_FREEZE_3: 5,
  UNLIMITED_PLAYLISTS: 7,
  PRIORITY_PROCESSING: 7,
  AI_PERSONA: 7,
  ALL_FEATURES: 10,
  LEGENDARY_BADGE: 10,
  BETA_ACCESS: 10,
};

const STREAK_MULTIPLIERS = [
  { minDays: 100, multiplier: 3.0 },
  { minDays: 30,  multiplier: 2.0 },
  { minDays: 14,  multiplier: 1.5 },
  { minDays: 7,   multiplier: 1.25 },
  { minDays: 0,   multiplier: 1.0 },
];

module.exports = {
  LEVELS,
  FEATURE_LEVELS,
  STREAK_MULTIPLIERS
};

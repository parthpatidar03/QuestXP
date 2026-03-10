import api from './api';

/** GET /api/gamification/profile — returns totalXP, level, levelTitle, streak, badges, unlockedFeatures */
export const getGamificationProfile = () => api.get('/gamification/profile').then(r => r.data);

/** GET /api/gamification/xp-history — returns array of { date, totalXP, actions } for last 30 days */
export const getXPHistory = () => api.get('/gamification/xp-history').then(r => r.data);

/** PATCH /api/gamification/badges/seen — marks all unseen badges as seen */
export const markBadgesSeen = () => api.patch('/gamification/badges/seen').then(r => r.data);

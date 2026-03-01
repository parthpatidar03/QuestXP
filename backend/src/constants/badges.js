const BADGES = [
  { id: 'FIRST_LECTURE',   name: 'First Step',        condition: (stats) => stats.lecturesCompleted >= 1 },
  { id: 'COURSE_COMPLETE', name: 'Course Completer',   condition: (stats) => stats.coursesCompleted >= 1 },
  { id: 'STREAK_7',        name: 'Week Warrior',       condition: (stats) => stats.longestStreak >= 7 },
  { id: 'STREAK_30',       name: 'Monthly Legend',     condition: (stats) => stats.longestStreak >= 30 },
  { id: 'QUIZ_ACE_10',     name: 'Quiz Ace',           condition: (stats) => stats.quizAces >= 10 },
  { id: 'LEVEL_10',        name: 'Legendary Scholar',  condition: (stats) => stats.level >= 10 },
  // Additional badges can be added here
];

module.exports = {
  BADGES
};

/**
 * XP, leveling, and streak calculations for Speak-EZ
 */

const LEVELS = [
  { level: 1, xp: 0, title: 'Beginner' },
  { level: 2, xp: 100, title: 'Getting Started' },
  { level: 3, xp: 300, title: 'Building Habits' },
  { level: 4, xp: 600, title: 'Finding Your Voice' },
  { level: 5, xp: 1000, title: 'Gaining Confidence' },
  { level: 6, xp: 1600, title: 'Rising Speaker' },
  { level: 7, xp: 2400, title: 'Skilled Communicator' },
  { level: 8, xp: 3500, title: 'Dynamic Presenter' },
  { level: 9, xp: 5000, title: 'Compelling Speaker' },
  { level: 10, xp: 7000, title: 'Master Communicator' },
  { level: 11, xp: 10000, title: 'Thought Leader' },
  { level: 12, xp: 14000, title: 'Keynote Ready' },
  { level: 13, xp: 20000, title: 'Legend' },
];

export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? (xp - current.xp) / (next.xp - current.xp)
    : 1;
  return { ...current, next, xp, progress };
}

/**
 * Calculate XP earned from a completed workout
 */
export function calculateSessionXp(session) {
  let xp = 0;

  // Base XP per exercise completed
  session.exercises.forEach(ex => {
    xp += 20 * ex.setsCompleted;
  });

  // Bonus for completing the full workout
  const allCompleted = session.exercises.every(
    ex => ex.setsCompleted >= ex.setsTotal
  );
  if (allCompleted) xp += 50;

  // Streak bonus
  if (session.streakDay > 1) {
    xp += Math.min(session.streakDay * 5, 50);
  }

  return xp;
}

/**
 * Check and update streak based on last practice date
 */
export function checkStreak(lastPracticeDate, currentStreak) {
  if (!lastPracticeDate) return { streak: 0, isNewDay: true };

  const last = new Date(lastPracticeDate);
  const now = new Date();
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { streak: currentStreak, isNewDay: false };
  } else if (diffDays === 1) {
    return { streak: currentStreak + 1, isNewDay: true };
  } else {
    return { streak: 1, isNewDay: true };
  }
}

/**
 * Get sessions completed this week (Mon-Sun)
 */
export function getWeeklyCount(history) {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // Convert Sunday=0 to 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);

  return history.filter(s => new Date(s.completedAt) >= monday).length;
}

export { LEVELS };

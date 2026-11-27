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
 * How a workout ended, based on which sets were actually finished.
 * Quitting or skipping before any set is finished discards the session.
 * Completion rewards require every set.
 */
export function classifyWorkoutFinish(sets) {
  const list = Array.isArray(sets) ? sets : [];
  const completed = list.filter(set => set && set.completed).length;
  return {
    completed,
    total: list.length,
    discard: completed === 0,
    finished: list.length > 0 && completed === list.length,
  };
}

/**
 * Calculate XP earned from a completed workout.
 * Unfinished sets pay nothing. The completion bonus and Daily Spark bonus
 * pay only when every set in the session was finished.
 */
export function calculateSessionXp(session) {
  const exercises = session.exercises || [];
  const completedSets = exercises.reduce(
    (sum, ex) => sum + (Number(ex.setsCompleted) || 0),
    0,
  );
  if (completedSets <= 0) return 0;

  let xp = completedSets * 20;

  const allCompleted = exercises.length > 0 && exercises.every(
    ex => (ex.setsTotal || 0) > 0 && ex.setsCompleted >= ex.setsTotal
  );
  if (allCompleted) xp += 50;

  // Streak bonus
  if (session.streakDay > 1) {
    xp += Math.min(session.streakDay * 5, 50);
  }

  // Daily Spark quest bonus only for a spark that was actually finished
  if (allCompleted && session.isDailySpark && session.sparkBonusXp) {
    xp += session.sparkBonusXp;
  }

  return xp;
}

/**
 * Check and update streak based on last practice date
 */
export function checkStreak(lastPracticeDate, currentStreak) {
  if (!lastPracticeDate) return { streak: 1, isNewDay: true };

  const diffDays = daysSince(lastPracticeDate);

  if (diffDays === 0) {
    // Max(1) heals users whose first-ever session was recorded as streak 0
    return { streak: Math.max(currentStreak, 1), isNewDay: false };
  } else if (diffDays === 1) {
    return { streak: currentStreak + 1, isNewDay: true };
  } else {
    return { streak: 1, isNewDay: true };
  }
}

/**
 * Streak to display right now: the stored streak while it's still alive
 * (last practice today or yesterday), otherwise 0. Unlike checkStreak,
 * this never previews the +1 for a day that hasn't been practiced yet.
 */
export function getDisplayStreak(lastPracticeDate, currentStreak) {
  if (!lastPracticeDate) return 0;
  return daysSince(lastPracticeDate) <= 1 ? currentStreak : 0;
}

function daysSince(dateStr) {
  const last = new Date(dateStr);
  const now = new Date();
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));
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

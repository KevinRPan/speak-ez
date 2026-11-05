/**
 * Daily Spark helpers — pick today's challenge, check completion, build a workout.
 */

import { dailySparks, DAILY_SPARK_BONUS_XP } from '../data/daily-sparks.js';

export { DAILY_SPARK_BONUS_XP };

/** Local calendar day key, e.g. "2026-11-05" */
export function getDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Stable hash so the same day always gets the same spark */
function dayIndex(dayKey) {
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return hash % dailySparks.length;
}

/**
 * Today's Daily Spark definition (rotated by calendar date).
 */
export function getTodaySpark(date = new Date()) {
  const dayKey = getDayKey(date);
  const spark = dailySparks[dayIndex(dayKey)];
  return { ...spark, dayKey };
}

/**
 * Build an ad-hoc workout object the active-workout screen can run.
 */
export function buildSparkWorkout(spark) {
  return {
    id: `daily-spark-${spark.id}`,
    name: spark.title,
    description: spark.hook,
    duration: spark.durationMin,
    difficulty: 'beginner',
    icon: spark.icon,
    color: spark.color,
    exercises: spark.exercises.map(ex => ({ ...ex })),
    isDailySpark: true,
    sparkId: spark.id,
    sparkDayKey: spark.dayKey,
  };
}

/**
 * Has the user already completed today's spark?
 * Matches either the spark id for today, or a session flagged with today's day key.
 */
export function isSparkCompletedToday(history, spark = getTodaySpark()) {
  if (!history?.length) return false;
  const dayKey = spark.dayKey;
  return history.some(s => {
    if (s.sparkDayKey === dayKey) return true;
    if (!s.isDailySpark) return false;
    // Fallback: completed today and same spark id (older sessions without day key)
    const completedKey = s.completedAt ? getDayKey(new Date(s.completedAt)) : null;
    return completedKey === dayKey && s.sparkId === spark.id;
  });
}

/**
 * Which days this week (Mon–Sun) already have a Daily Spark completion.
 * Returns a Set of 0–6 offsets from Monday.
 */
export function getSparkDaysThisWeek(history) {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);

  const days = new Set();
  (history || []).forEach(s => {
    if (!s.isDailySpark || !s.completedAt) return;
    const d = new Date(s.completedAt);
    if (d < monday) return;
    const diff = Math.floor((d - monday) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) days.add(diff);
  });
  return days;
}

/**
 * Count of consecutive days ending today (or yesterday if today not done yet)
 * where a Daily Spark was completed. Display-only; separate from main streak.
 */
export function getSparkStreak(history) {
  if (!history?.length) return 0;

  const completedDays = new Set();
  history.forEach(s => {
    if (s.isDailySpark && s.completedAt) {
      completedDays.add(getDayKey(new Date(s.completedAt)));
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If today isn't done, start counting from yesterday (streak still alive)
  let cursor = new Date(today);
  if (!completedDays.has(getDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!completedDays.has(getDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (completedDays.has(getDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

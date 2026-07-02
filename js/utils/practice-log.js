/**
 * Practice Log — records non-workout practice (mock interviews, scenarios,
 * drills) into the same history/XP/streak pipeline as workouts, so every
 * practice mode shows up on the home dashboard and performance charts.
 */

import { addSession, getUser, loadAll, saveAll } from './storage.js';
import { calculateSessionXp, checkStreak } from './xp.js';

/**
 * Record a completed practice session: awards XP, advances the streak,
 * and appends a normalized session to history. Returns the saved session.
 */
export function recordPracticeSession({
  type,
  name,
  icon = '🎯',
  color = 'var(--accent)',
  durationSeconds = 0,
  roundsCompleted = 1,
  roundsTotal = 1,
  rating = null,     // optional 1-5 rating
  aiScores = null,   // { clarity, structure, confidence, pace, ... } on 0-10
  fillerCount = null,
}) {
  const user = getUser();
  const streakInfo = checkStreak(user.lastPracticeDate, user.streak);

  const session = {
    id: crypto.randomUUID(),
    type,
    workoutName: name,
    icon,
    color,
    completedAt: new Date().toISOString(),
    totalDuration: durationSeconds,
    setsCompleted: roundsCompleted,
    totalSets: roundsTotal,
    streakDay: streakInfo.streak,
    exercises: [{
      exerciseName: name,
      setsCompleted: roundsCompleted,
      setsTotal: roundsTotal,
      ratings: rating != null ? [rating] : [],
    }],
    avgAiScores: aiScores && Object.keys(aiScores).length ? aiScores : null,
    totalFillerCount: fillerCount,
  };
  session.xpEarned = calculateSessionXp(session);

  const store = loadAll();
  store.user.xp += session.xpEarned;
  store.user.streak = streakInfo.streak;
  store.user.lastPracticeDate = session.completedAt;
  saveAll(store);

  addSession(session);
  return session;
}

/**
 * Map AI feedback scores onto the 0-10 avgAiScores keys the performance
 * charts read. `mapping` is { sourceKey: targetKey }; `scale` is the max
 * of the source scale (5 or 10).
 */
export function normalizeAiScores(scores, mapping, scale = 10) {
  if (!scores || typeof scores !== 'object') return null;
  const out = {};
  for (const [sourceKey, targetKey] of Object.entries(mapping)) {
    const v = Number(scores[sourceKey]);
    if (Number.isFinite(v) && v > 0) {
      out[targetKey] = Math.round((v / scale) * 100) / 10;
    }
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Map a criterion-score list ([{ criterion, score }] on 1-10, criterion
 * names vary by drill rubric) onto avgAiScores keys by name matching.
 * Criteria that match the same key are averaged; unmatched ones dropped.
 */
export function normalizeCriterionScores(scoreList) {
  if (!Array.isArray(scoreList)) return null;
  const matchers = [
    [/pace|pacing/i, 'pace'],
    [/structure/i, 'structure'],
    [/concise/i, 'conciseness'],
    [/clarity|language|communicat/i, 'clarity'],
    [/confiden|tonality|presence/i, 'confidence'],
  ];

  const totals = {};
  const counts = {};
  for (const entry of scoreList) {
    const v = Number(entry?.score);
    if (!Number.isFinite(v) || v <= 0) continue;
    const match = matchers.find(([re]) => re.test(entry.criterion || ''));
    if (!match) continue;
    const key = match[1];
    totals[key] = (totals[key] || 0) + v;
    counts[key] = (counts[key] || 0) + 1;
  }

  const out = {};
  for (const key of Object.keys(totals)) {
    out[key] = Math.round((totals[key] / counts[key]) * 10) / 10;
  }
  return Object.keys(out).length ? out : null;
}

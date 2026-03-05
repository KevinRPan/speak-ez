/**
 * Session Feedback — WHOOP-style post-session reaction generator
 *
 * Compares current session against recent history to produce:
 * - A tone (tough / solid / great / milestone)
 * - A headline ("That was a grind. You earned it.")
 * - A callout (specific data comparison)
 * - A suggestion (next drill to work on)
 */

const SCORE_LABELS = {
  clarity: 'Clarity',
  structure: 'Structure',
  confidence: 'Confidence',
  conciseness: 'Conciseness',
  filler_rate: 'Filler Rate',
  pace: 'Pace',
};

const DRILL_SUGGESTIONS = {
  clarity: 'Try the Concise Messaging drill to sharpen your clarity.',
  structure: 'Try the Structured Response drill — STAR or PREP framework.',
  confidence: 'Try the Volume Projection drill to build a more assertive delivery.',
  conciseness: 'Try the Concise Messaging drill — 30-second answer challenge.',
  filler_rate: 'Try the Filler Elimination drill to break the filler habit.',
  pace: 'Try the Pace & Rhythm drill — aim for 130–150 WPM.',
};

const TOUGH_HEADLINES = [
  "That was a grind. You earned it.",
  "Tough session. That's where growth happens.",
  "You pushed through. That's the work.",
  "Hard sessions build the skill. Keep showing up.",
];

const GREAT_HEADLINES = [
  "Locked in. That's your best session this week.",
  "Clean session. Numbers are moving.",
  "That's the standard. Keep it.",
  "Dialed in. This is what progress looks like.",
];

const SOLID_HEADLINES = [
  "Good session. Keep the reps coming.",
  "Solid work. Consistency wins.",
  "Another session in the books. It adds up.",
  "Steady progress. Stay on it.",
];

const MILESTONE_HEADLINES = {
  3: "3-day streak. The habit is forming.",
  7: "7-day streak. One week straight.",
  14: "14-day streak. Two weeks. Serious.",
  30: "30-day streak. One month. You're built different.",
  60: "60-day streak. This is who you are now.",
  100: "100-day streak. Legend.",
};

/**
 * Generate a WHOOP-style session reaction.
 *
 * @param {object} session — the completed session
 * @param {Array} history — all previous sessions (not including this one)
 * @returns {{ tone, headline, callout, suggestion }}
 */
export function generateSessionReaction(session, history = []) {
  const recent = history.slice(-5);

  const avgScores = getAvgScores(recent);
  const currentScores = session.avgAiScores || {};

  const duration = Math.round((session.totalDuration || 0) / 60);
  const currentFillers = session.totalFillerCount;
  const avgFillers = getAvgFillerCount(recent);

  const streak = session.streakDay || 0;

  // Determine tone
  const isMilestone = MILESTONE_HEADLINES[streak] != null;
  const isGreat = !isMilestone && (
    (Object.keys(currentScores).length > 0 && Object.values(currentScores).every(v => v >= 7)) ||
    session.hasNewPR
  );
  const isTough = !isMilestone && !isGreat && (
    duration >= 20 ||
    (Object.keys(currentScores).length > 0 && Object.values(currentScores).filter(v => v <= 4).length >= 2) ||
    (currentFillers !== null && avgFillers > 0 && currentFillers > avgFillers * 1.4)
  );

  let tone = 'solid';
  if (isMilestone) tone = 'milestone';
  else if (isGreat) tone = 'great';
  else if (isTough) tone = 'tough';

  // Pick headline
  const dayIndex = Math.floor(Date.now() / 86400000);
  let headline;
  if (tone === 'milestone') {
    headline = MILESTONE_HEADLINES[streak];
  } else if (tone === 'great') {
    headline = GREAT_HEADLINES[dayIndex % GREAT_HEADLINES.length];
  } else if (tone === 'tough') {
    headline = TOUGH_HEADLINES[dayIndex % TOUGH_HEADLINES.length];
  } else {
    headline = SOLID_HEADLINES[dayIndex % SOLID_HEADLINES.length];
  }

  // Build callout (specific data point comparison)
  const callout = buildCallout(session, recent, currentFillers, avgFillers, currentScores, avgScores, streak);

  // Build suggestion (weakest score → drill recommendation)
  const suggestion = buildSuggestion(currentScores);

  return { tone, headline, callout, suggestion };
}

function getAvgFillerCount(sessions) {
  const withFillers = sessions.filter(s => s.totalFillerCount !== null && s.totalFillerCount !== undefined);
  if (!withFillers.length) return 0;
  return withFillers.reduce((a, s) => a + s.totalFillerCount, 0) / withFillers.length;
}

function getAvgScores(sessions) {
  const withScores = sessions.filter(s => s.avgAiScores && Object.keys(s.avgAiScores).length > 0);
  if (!withScores.length) return {};
  const totals = {};
  const counts = {};
  withScores.forEach(s => {
    Object.entries(s.avgAiScores).forEach(([k, v]) => {
      totals[k] = (totals[k] || 0) + v;
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  const result = {};
  Object.keys(totals).forEach(k => { result[k] = totals[k] / counts[k]; });
  return result;
}

function buildCallout(session, recent, currentFillers, avgFillers, currentScores, avgScores, streak) {
  // Filler drop is the most concrete callout
  if (currentFillers !== null && avgFillers > 0) {
    const diff = currentFillers - avgFillers;
    if (diff <= -3) return `${Math.abs(Math.round(diff))} fewer filler words than your recent average. Clear improvement.`;
    if (diff >= 3) return `${Math.round(diff)} more filler words than usual. Worth watching.`;
  }

  // Score improvement in weakest area
  const improvedCategory = findBiggestImprovement(currentScores, avgScores);
  if (improvedCategory) {
    const label = SCORE_LABELS[improvedCategory.key] || improvedCategory.key;
    return `${label} up ${improvedCategory.delta.toFixed(1)} points vs your recent average.`;
  }

  // Streak callout if not milestone
  if (streak === 2) return "Back-to-back sessions. The streak is real.";
  if (streak >= 5 && ![7, 14, 30, 60, 100].includes(streak)) return `${streak}-day streak. Keep it going.`;

  // Duration note for long sessions
  const duration = Math.round((session.totalDuration || 0) / 60);
  if (duration >= 25) return `${duration} minutes of focused work. That's a serious session.`;

  return null;
}

function findBiggestImprovement(currentScores, avgScores) {
  let best = null;
  Object.entries(currentScores).forEach(([k, v]) => {
    if (avgScores[k] !== undefined) {
      const delta = v - avgScores[k];
      if (delta >= 1.5 && (!best || delta > best.delta)) {
        best = { key: k, delta };
      }
    }
  });
  return best;
}

function buildSuggestion(currentScores) {
  if (!Object.keys(currentScores).length) return null;

  // Find the weakest score
  let weakestKey = null;
  let weakestVal = 10;
  Object.entries(currentScores).forEach(([k, v]) => {
    if (SCORE_LABELS[k] && v < weakestVal) {
      weakestVal = v;
      weakestKey = k;
    }
  });

  if (weakestKey && weakestVal < 6) {
    return DRILL_SUGGESTIONS[weakestKey] || null;
  }
  return null;
}

/**
 * Recommendations — smart "what to work on next" engine
 *
 * Uses session history to identify the weakest skill area and suggest
 * a specific drill + course to focus on.
 */

import { CURRICULUM_UNITS } from '../data/curriculum.js';
import { getActiveCourse } from './curriculum-progress.js';

const SCORE_LABELS = {
  clarity: 'Clarity',
  structure: 'Structure',
  confidence: 'Confidence',
  conciseness: 'Conciseness',
  filler_rate: 'Filler Rate',
  pace: 'Pace',
};

// Map score categories to curriculum unit IDs
const SCORE_TO_UNIT = {
  filler_rate: 'filler-elimination',
  pace: 'pace-rhythm',
  confidence: 'confidence-tone',
  conciseness: 'concise-messaging',
  structure: 'strategic-pausing',
  clarity: 'clarity-structure',
};

/**
 * Generate a recommendation based on session history.
 *
 * @param {Array} history — full session history
 * @returns {{ focusCourse, reason, suggestedDrillId, quickWin, insight } | null}
 */
export function getRecommendation(history) {
  if (!history?.length) {
    return {
      focusCourse: CURRICULUM_UNITS.find(u => u.id === 'filler-elimination'),
      reason: 'Start here — filler words are the #1 quick win for most speakers.',
      suggestedDrillId: 'filler-elimination',
      quickWin: 'Try the 5-min Vocal Warmup before your first session.',
      insight: null,
    };
  }

  // Get average scores across last 10 sessions that have AI data
  const withScores = history.filter(s => s.avgAiScores && Object.keys(s.avgAiScores).length > 0);
  const recent = withScores.slice(-10);

  if (!recent.length) {
    // Has history but no AI reviews yet
    const activeCourse = getActiveCourse(history);
    return {
      focusCourse: activeCourse?.unit || CURRICULUM_UNITS[0],
      reason: 'Record yourself and use AI Review to unlock score tracking.',
      suggestedDrillId: activeCourse?.unit?.suggestedExercises?.[0] || 'filler-elimination',
      quickWin: 'Enable recording during your next workout to get AI feedback.',
      insight: null,
    };
  }

  // Average all scores
  const totals = {};
  const counts = {};
  recent.forEach(s => {
    Object.entries(s.avgAiScores).forEach(([k, v]) => {
      totals[k] = (totals[k] || 0) + v;
      counts[k] = (counts[k] || 0) + 1;
    });
  });
  const avgScores = {};
  Object.keys(totals).forEach(k => {
    if (SCORE_LABELS[k]) avgScores[k] = totals[k] / counts[k];
  });

  // Find weakest category
  let weakestKey = null;
  let weakestAvg = 10;
  Object.entries(avgScores).forEach(([k, v]) => {
    if (v < weakestAvg) {
      weakestAvg = v;
      weakestKey = k;
    }
  });

  // Check for filler trend (separate from AI scores — client-side data)
  const withFillers = history.filter(s => s.totalFillerCount !== null && s.totalFillerCount !== undefined);
  let fillerInsight = null;
  if (withFillers.length >= 3) {
    const recentFillers = withFillers.slice(-3).map(s => s.totalFillerCount);
    const trend = recentFillers[recentFillers.length - 1] - recentFillers[0];
    if (trend <= -3) {
      fillerInsight = `Filler words down ${Math.abs(trend)} over your last 3 tracked sessions.`;
    } else if (trend >= 3) {
      fillerInsight = `Filler words up ${trend} lately. Time to drill it.`;
    }
  }

  const activeCourse = getActiveCourse(history);
  const unitId = weakestKey ? (SCORE_TO_UNIT[weakestKey] || null) : null;
  const focusCourse = unitId ? CURRICULUM_UNITS.find(u => u.id === unitId) : activeCourse?.unit || CURRICULUM_UNITS[0];

  const label = weakestKey ? (SCORE_LABELS[weakestKey] || weakestKey) : null;
  const reason = label && weakestAvg < 8
    ? `${label} averages ${weakestAvg.toFixed(1)}/10 — your lowest skill right now.`
    : 'Keep drilling your weakest area to push scores higher.';

  const suggestedDrillId = focusCourse?.suggestedExercises?.[0] || 'impromptu-speaking';

  const quickWin = getQuickWin(weakestKey, weakestAvg);

  return {
    focusCourse,
    reason,
    suggestedDrillId,
    quickWin,
    insight: fillerInsight,
  };
}

function getQuickWin(scoreKey, avg) {
  const tips = {
    filler_rate: 'Before speaking, pause briefly — let silence replace the "um".',
    pace: 'Record yourself for 60 seconds. Listen back. You\'ll hear it.',
    confidence: 'Start your next answer with "I recommend…" or "The answer is…" — no hedging.',
    conciseness: 'Time your answers. Target under 90 seconds for most questions.',
    structure: 'Try PREP: Point, Reason, Example, Point. Works for any question.',
    clarity: 'Use the "explain it to a 12-year-old" test before your next answer.',
  };
  return scoreKey ? (tips[scoreKey] || null) : null;
}

/**
 * Generate AI insight text from score trends for the performance dashboard.
 * @param {Array} history
 * @returns {string|null}
 */
export function generateInsight(history) {
  if (!history?.length) return null;

  const withScores = history.filter(s => s.avgAiScores && Object.keys(s.avgAiScores).length > 0);
  if (withScores.length < 3) return null;

  const last3 = withScores.slice(-3);
  const first3 = withScores.slice(0, Math.min(3, withScores.length));

  // Compare average filler_rate between first and last 3 sessions with that data
  const lastAvg = avg(last3.map(s => s.avgAiScores?.filler_rate).filter(v => v != null));
  const firstAvg = avg(first3.map(s => s.avgAiScores?.filler_rate).filter(v => v != null));

  if (lastAvg !== null && firstAvg !== null) {
    const diff = lastAvg - firstAvg;
    if (diff >= 2) return `Your filler rate score improved ${diff.toFixed(1)} points since you started.`;
    if (diff <= -2) return `Your filler rate score dropped ${Math.abs(diff).toFixed(1)} points recently. More drilling needed.`;
  }

  // Check if any score is consistently high
  const categories = ['clarity', 'structure', 'confidence', 'conciseness', 'filler_rate', 'pace'];
  for (const cat of categories) {
    const vals = last3.map(s => s.avgAiScores?.[cat]).filter(v => v != null);
    if (vals.length >= 2 && avg(vals) >= 8) {
      return `${SCORE_LABELS[cat]} has been strong (${avg(vals).toFixed(1)}/10) across your recent sessions.`;
    }
    if (vals.length >= 2 && avg(vals) <= 4) {
      return `${SCORE_LABELS[cat]} is averaging ${avg(vals).toFixed(1)}/10 — this needs focused drilling.`;
    }
  }

  return null;
}

function avg(arr) {
  if (!arr?.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Curriculum — structured speaking courses with graduation criteria
 *
 * Two types:
 * - Finite courses: you graduate when you hit the mastery criteria consistently
 * - Evergreen courses: always relevant, no graduation (mark as evergreen: true)
 *
 * Graduation criteria use a `check(history)` function that receives the full
 * session history and returns true when the user has mastered the skill.
 */

/**
 * Check if recent sessions include enough data matching a predicate.
 * @param {Array} history
 * @param {number} required — how many matching sessions needed
 * @param {Function} predicate — (session) => bool
 * @param {number} window — look at last N sessions with relevant data
 */
function metricStreak(history, required, predicate, window = 7) {
  const relevant = history.filter(predicate);
  const recent = relevant.slice(-window);
  const passing = recent.filter(predicate);
  // Need `required` consecutive sessions from the end matching the criteria
  let streak = 0;
  for (let i = relevant.length - 1; i >= 0; i--) {
    if (predicate(relevant[i])) streak++;
    else break;
  }
  return streak >= required;
}

function hasAiScore(session, key, minScore) {
  return session.avgAiScores && session.avgAiScores[key] !== undefined && session.avgAiScores[key] >= minScore;
}

export const CURRICULUM_UNITS = [
  // === FINITE COURSES (graduate when mastered) ===
  {
    id: 'filler-elimination',
    name: 'Filler Elimination',
    description: 'Cut um, uh, like from your speech — speak with intention',
    icon: '🚫',
    color: '#FF7675',
    evergreen: false,
    suggestedExercises: ['filler-elimination', 'strategic-pausing'],
    graduationLabel: '5 sessions with < 2 fillers/min',
    graduation: {
      required: 5,
      check: (history) => {
        const relevant = history.filter(s => s.fillersPerMinute !== null && s.fillersPerMinute !== undefined);
        if (relevant.length < 5) return false;
        let streak = 0;
        for (let i = relevant.length - 1; i >= 0; i--) {
          if (relevant[i].fillersPerMinute < 2) streak++;
          else break;
        }
        return streak >= 5;
      },
      progress: (history) => {
        const relevant = history.filter(s => s.fillersPerMinute !== null && s.fillersPerMinute !== undefined);
        let streak = 0;
        for (let i = relevant.length - 1; i >= 0; i--) {
          if (relevant[i].fillersPerMinute < 2) streak++;
          else break;
        }
        return Math.min(streak / 5, 1);
      },
    },
  },

  {
    id: 'pace-rhythm',
    name: 'Pace & Rhythm',
    description: 'Find your ideal speaking speed — not too fast, not too slow',
    icon: '🎵',
    color: '#00B4D8',
    evergreen: false,
    suggestedExercises: ['pace-rhythm'],
    graduationLabel: '5 of last 7 sessions with Pace score ≥ 7',
    graduation: {
      required: 5,
      check: (history) => {
        const relevant = history.filter(s => hasAiScore(s, 'pace', 1));
        if (relevant.length < 7) return false;
        const recent = relevant.slice(-7);
        return recent.filter(s => hasAiScore(s, 'pace', 7)).length >= 5;
      },
      progress: (history) => {
        const relevant = history.filter(s => hasAiScore(s, 'pace', 1));
        const recent = relevant.slice(-7);
        const passing = recent.filter(s => hasAiScore(s, 'pace', 7)).length;
        return Math.min(passing / 5, 1);
      },
    },
  },

  {
    id: 'confidence-tone',
    name: 'Confidence & Tone',
    description: 'Sound like you mean it — assertive language, no hedging',
    icon: '💪',
    color: '#FF6B35',
    evergreen: false,
    suggestedExercises: ['volume-projection', 'power-pose'],
    graduationLabel: '5 sessions with Confidence score ≥ 8',
    graduation: {
      required: 5,
      check: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (hasAiScore(history[i], 'confidence', 8)) streak++;
          else if (history[i].avgAiScores?.confidence !== undefined) break;
        }
        return streak >= 5;
      },
      progress: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (hasAiScore(history[i], 'confidence', 8)) streak++;
          else if (history[i].avgAiScores?.confidence !== undefined) break;
        }
        return Math.min(streak / 5, 1);
      },
    },
  },

  {
    id: 'concise-messaging',
    name: 'Concise Messaging',
    description: 'Say more with less — cut the padding, keep the punch',
    icon: '✂️',
    color: '#7C5CFC',
    evergreen: false,
    suggestedExercises: ['concise-messaging'],
    graduationLabel: '5 sessions with Conciseness score ≥ 8',
    graduation: {
      required: 5,
      check: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (hasAiScore(history[i], 'conciseness', 8)) streak++;
          else if (history[i].avgAiScores?.conciseness !== undefined) break;
        }
        return streak >= 5;
      },
      progress: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (hasAiScore(history[i], 'conciseness', 8)) streak++;
          else if (history[i].avgAiScores?.conciseness !== undefined) break;
        }
        return Math.min(streak / 5, 1);
      },
    },
  },

  {
    id: 'strategic-pausing',
    name: 'Strategic Pausing',
    description: 'Use silence as a tool — pauses that create impact',
    icon: '⏸',
    color: '#FDCB6E',
    evergreen: false,
    suggestedExercises: ['strategic-pausing'],
    graduationLabel: '5 sessions with Structure score ≥ 7',
    graduation: {
      required: 5,
      check: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (hasAiScore(history[i], 'structure', 7)) streak++;
          else if (history[i].avgAiScores?.structure !== undefined) break;
        }
        return streak >= 5;
      },
      progress: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (hasAiScore(history[i], 'structure', 7)) streak++;
          else if (history[i].avgAiScores?.structure !== undefined) break;
        }
        return Math.min(streak / 5, 1);
      },
    },
  },

  {
    id: 'clarity-structure',
    name: 'Clarity & Structure',
    description: 'Organize your thoughts so any idea lands cleanly',
    icon: '🗺',
    color: '#58CC02',
    evergreen: false,
    suggestedExercises: ['structured-response', 'impromptu-speaking'],
    graduationLabel: '5 sessions with Clarity ≥ 8 and Structure ≥ 7',
    graduation: {
      required: 5,
      check: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          const s = history[i];
          if (s.avgAiScores?.clarity !== undefined || s.avgAiScores?.structure !== undefined) {
            if (hasAiScore(s, 'clarity', 8) && hasAiScore(s, 'structure', 7)) streak++;
            else break;
          }
        }
        return streak >= 5;
      },
      progress: (history) => {
        let streak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          const s = history[i];
          if (s.avgAiScores?.clarity !== undefined || s.avgAiScores?.structure !== undefined) {
            if (hasAiScore(s, 'clarity', 8) && hasAiScore(s, 'structure', 7)) streak++;
            else break;
          }
        }
        return Math.min(streak / 5, 1);
      },
    },
  },

  // === EVERGREEN COURSES (no graduation — always relevant) ===
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Make your ideas memorable — narrative that sticks',
    icon: '📖',
    color: '#E84393',
    evergreen: true,
    suggestedExercises: ['storytelling'],
  },

  {
    id: 'persuasion',
    name: 'Persuasion & Influence',
    description: 'Move people to action with your words',
    icon: '🎯',
    color: '#FF6B35',
    evergreen: true,
    suggestedExercises: ['persuasive-pitch'],
  },

  {
    id: 'impromptu',
    name: 'Impromptu Speaking',
    description: 'Think on your feet — handle any question that comes',
    icon: '⚡',
    color: '#00B4D8',
    evergreen: true,
    suggestedExercises: ['impromptu-speaking'],
  },

  {
    id: 'interview-mastery',
    name: 'Interview Mastery',
    description: 'Structured answers, confident delivery, every time',
    icon: '💼',
    color: '#7C5CFC',
    evergreen: true,
    suggestedExercises: ['structured-response'],
  },
];

export const FINITE_UNITS = CURRICULUM_UNITS.filter(u => !u.evergreen);
export const EVERGREEN_UNITS = CURRICULUM_UNITS.filter(u => u.evergreen);

/**
 * Preset workout templates for Speak-EZ
 * Structured like HEVY workout routines, but for communication skills
 */

export const workoutTemplates = [
  {
    id: 'quick-warmup',
    name: 'Quick Warmup',
    description: 'Loosen up your voice and body before any speaking situation.',
    duration: 5,
    difficulty: 'beginner',
    icon: '🔥',
    color: '#FF6B35',
    exercises: [
      { exerciseId: 'box-breathing', sets: 1, duration: 60, rest: 0 },
      { exerciseId: 'vocal-warmup', sets: 1, duration: 120, rest: 0 },
      { exerciseId: 'tongue-twisters', sets: 1, duration: 120, rest: 0 },
    ],
  },
  {
    id: 'interview-prep',
    name: 'Interview Prep',
    description: 'Nail structured responses, stay concise, and eliminate fillers.',
    duration: 20,
    difficulty: 'intermediate',
    icon: '💼',
    color: '#7C5CFC',
    exercises: [
      { exerciseId: 'box-breathing', sets: 1, duration: 120, rest: 30 },
      { exerciseId: 'structured-response', sets: 3, duration: 180, rest: 45 },
      { exerciseId: 'concise-messaging', sets: 2, duration: 120, rest: 30 },
      { exerciseId: 'filler-elimination', sets: 2, duration: 120, rest: 0 },
    ],
  },
  {
    id: 'presentation-power',
    name: 'Presentation Power',
    description: 'Command the room with vocal dynamics, gestures, and structured delivery.',
    duration: 25,
    difficulty: 'intermediate',
    icon: '🎤',
    color: '#00B4D8',
    exercises: [
      { exerciseId: 'vocal-warmup', sets: 1, duration: 120, rest: 30 },
      { exerciseId: 'volume-projection', sets: 2, duration: 180, rest: 30 },
      { exerciseId: 'hand-gestures', sets: 2, duration: 180, rest: 30 },
      { exerciseId: 'strategic-pausing', sets: 2, duration: 180, rest: 30 },
      { exerciseId: 'storytelling', sets: 2, duration: 180, rest: 0 },
    ],
  },
  {
    id: 'daily-confidence',
    name: 'Daily Confidence',
    description: 'A quick daily session to build speaking confidence and fluency.',
    duration: 15,
    difficulty: 'beginner',
    icon: '⚡',
    color: '#58CC02',
    exercises: [
      { exerciseId: 'power-pose', sets: 1, duration: 120, rest: 15 },
      { exerciseId: 'box-breathing', sets: 1, duration: 60, rest: 15 },
      { exerciseId: 'impromptu', sets: 3, duration: 120, rest: 30 },
      { exerciseId: 'pace-rhythm', sets: 2, duration: 120, rest: 0 },
    ],
  },
  {
    id: 'voice-command',
    name: 'Voice Command',
    description: 'Pure vocal training — projection, pitch, pace, and clarity.',
    duration: 15,
    difficulty: 'intermediate',
    icon: '🎙',
    color: '#E84393',
    exercises: [
      { exerciseId: 'vocal-warmup', sets: 1, duration: 120, rest: 20 },
      { exerciseId: 'volume-projection', sets: 2, duration: 150, rest: 20 },
      { exerciseId: 'pitch-variation', sets: 2, duration: 150, rest: 20 },
      { exerciseId: 'articulation', sets: 1, duration: 120, rest: 20 },
      { exerciseId: 'pace-rhythm', sets: 2, duration: 120, rest: 0 },
    ],
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Build your narrative power with stories, analogies, and emotional connection.',
    duration: 20,
    difficulty: 'intermediate',
    icon: '📖',
    color: '#FDCB6E',
    exercises: [
      { exerciseId: 'box-breathing', sets: 1, duration: 60, rest: 15 },
      { exerciseId: 'facial-expression', sets: 1, duration: 180, rest: 30 },
      { exerciseId: 'storytelling', sets: 3, duration: 180, rest: 45 },
      { exerciseId: 'analogies-metaphors', sets: 2, duration: 150, rest: 0 },
    ],
  },
  {
    id: 'body-language',
    name: 'Full Body Language',
    description: 'Master the physical side of communication — gestures, posture, presence.',
    duration: 20,
    difficulty: 'beginner',
    icon: '🧍',
    color: '#00CEC9',
    exercises: [
      { exerciseId: 'power-pose', sets: 1, duration: 120, rest: 15 },
      { exerciseId: 'eye-contact', sets: 2, duration: 150, rest: 20 },
      { exerciseId: 'hand-gestures', sets: 2, duration: 180, rest: 20 },
      { exerciseId: 'facial-expression', sets: 2, duration: 150, rest: 20 },
      { exerciseId: 'power-posture', sets: 1, duration: 180, rest: 15 },
      { exerciseId: 'movement-space', sets: 1, duration: 150, rest: 0 },
    ],
  },
  {
    id: 'persuasion-lab',
    name: 'Persuasion Lab',
    description: 'Sharpen your ability to influence, pitch, and win people over.',
    duration: 25,
    difficulty: 'advanced',
    icon: '🎯',
    color: '#FF7675',
    exercises: [
      { exerciseId: 'vocal-warmup', sets: 1, duration: 120, rest: 20 },
      { exerciseId: 'persuasive-pitch', sets: 3, duration: 180, rest: 45 },
      { exerciseId: 'analogies-metaphors', sets: 2, duration: 150, rest: 30 },
      { exerciseId: 'strategic-pausing', sets: 2, duration: 150, rest: 30 },
      { exerciseId: 'concise-messaging', sets: 2, duration: 120, rest: 0 },
    ],
  },
];

export function getWorkout(id) {
  return workoutTemplates.find(w => w.id === id);
}

export function getWorkoutsByDuration(minutes) {
  return workoutTemplates.filter(w => w.duration <= minutes);
}

/**
 * Calculate the actual total duration of a workout in seconds
 */
export function calculateWorkoutDuration(exercises) {
  let total = 0;
  exercises.forEach((ex, i) => {
    total += ex.duration * ex.sets;
    total += ex.rest * (ex.sets - 1); // rest between sets
    if (i < exercises.length - 1) {
      total += ex.rest || 30; // rest between exercises
    }
  });
  return total;
}

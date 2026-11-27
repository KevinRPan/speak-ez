import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSessionXp, classifyWorkoutFinish } from '../js/utils/xp.js';
import { recordPracticeSession } from '../js/utils/practice-log.js';

function session(overrides = {}) {
  return {
    exercises: [
      { setsCompleted: 1, setsTotal: 1 },
    ],
    streakDay: 1,
    ...overrides,
  };
}

test('quitting before any set is finished discards the workout', () => {
  const outcome = classifyWorkoutFinish([
    { completed: false },
    { completed: false },
  ]);
  assert.equal(outcome.discard, true);
  assert.equal(outcome.finished, false);
  assert.equal(outcome.completed, 0);
});

test('a partial quit keeps finished sets and withholds completion rewards', () => {
  const outcome = classifyWorkoutFinish([
    { completed: true },
    { completed: false },
  ]);
  assert.equal(outcome.discard, false);
  assert.equal(outcome.finished, false);
  assert.equal(outcome.completed, 1);
});

test('every finished set marks the workout complete', () => {
  const outcome = classifyWorkoutFinish([
    { completed: true },
    { completed: true },
  ]);
  assert.equal(outcome.finished, true);
  assert.equal(outcome.discard, false);
});

test('an empty workout earns no points, even with a streak or spark bonus attached', () => {
  assert.equal(calculateSessionXp(session({
    exercises: [{ setsCompleted: 0, setsTotal: 2 }],
    streakDay: 7,
    isDailySpark: true,
    sparkBonusXp: 40,
  })), 0);

  assert.equal(calculateSessionXp(session({
    exercises: [],
    streakDay: 3,
    isDailySpark: true,
    sparkBonusXp: 40,
  })), 0);
});

test('a partial session pays for finished sets only', () => {
  const xp = calculateSessionXp(session({
    exercises: [
      { setsCompleted: 1, setsTotal: 2 },
      { setsCompleted: 0, setsTotal: 1 },
    ],
    streakDay: 2,
    isDailySpark: true,
    sparkBonusXp: 40,
  }));
  // 20 for the set, 10 streak bonus, no +50 completion, no spark bonus
  assert.equal(xp, 30);
});

test('a finished session keeps the completion bonus and spark bonus', () => {
  const xp = calculateSessionXp(session({
    exercises: [
      { setsCompleted: 2, setsTotal: 2 },
    ],
    streakDay: 2,
    isDailySpark: true,
    sparkBonusXp: 40,
  }));
  // 40 for sets, 50 completion, 10 streak, 40 spark
  assert.equal(xp, 140);
});

test('a practice log with no finished rounds is not saved', () => {
  const saved = recordPracticeSession({
    type: 'scenario',
    name: 'Empty',
    roundsCompleted: 0,
    roundsTotal: 3,
  });
  assert.equal(saved, null);
});

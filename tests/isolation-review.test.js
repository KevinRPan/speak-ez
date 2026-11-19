import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIsolationReview, formatClock } from '../js/utils/isolation-review.js';
import {
  AUDIO_CHECKS,
  VISUAL_CHECKS,
  STRUCTURE_CHECKS,
  ISOLATION_TOPICS,
} from '../js/data/isolation.js';

const SAMPLE = [
  { t: 6, text: 'I used to think speaking fast meant I was prepared.' },
  { t: 70, text: 'Last March I lost 3 clients after a meeting where I never let a silence sit. I think I filled every gap.' },
  { t: 100, text: 'Um I mean the room was kind of waiting and I just kept talking.' },
  { t: 150, text: 'People want certainty from a leader. People want certainty even when you do not have it yet.' },
  { t: 180, text: 'I would like the team to like the plan like it was already decided yesterday.' },
  { t: 240, text: 'Maybe the better version is shorter. For example I now ask one question and then wait. Now I ask before I fill the quiet.' },
];

test('formatClock renders minute:second', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(65), '1:05');
  assert.equal(formatClock(280), '4:40');
});

test('review copy does not name a person', () => {
  const blob = JSON.stringify({ AUDIO_CHECKS, VISUAL_CHECKS, STRUCTURE_CHECKS, ISOLATION_TOPICS });
  assert.equal(/vinh|giang/i.test(blob), false);
});

test('each pass keeps its questions', () => {
  const review = buildIsolationReview({ segments: [], durationSeconds: 300 });
  assert.deepEqual(AUDIO_CHECKS.map(check => check.id), ['fillers', 'noises', 'melody', 'pace', 'restarts']);
  assert.deepEqual(review.audio.checks.map(check => check.id), AUDIO_CHECKS.map(check => check.id));
  assert.deepEqual(review.visual.checks.map(check => check.id), ['eyes', 'hands', 'stillness', 'face', 'posture']);
  assert.deepEqual(review.structure.checks.map(check => check.id), ['point', 'open', 'sequence', 'specifics', 'repeats', 'close']);
  for (const check of [...review.audio.checks, ...review.visual.checks, ...review.structure.checks]) {
    assert.ok(check.question.length > 10);
    assert.ok(check.ask.length > 10);
  }
});

test('empty take still gives eye checkpoints and a words question', () => {
  const review = buildIsolationReview({ segments: [], durationSeconds: 300 });
  assert.equal(review.audio.spots.length, 0);
  assert.equal(review.visual.spots.length, 3);
  assert.equal(review.visual.spots[0].t, 0);
  assert.equal(review.visual.spots[2].t, 280);
  assert.match(review.visual.spots[0].question, /planted/i);
  assert.match(review.structure.spots[0].question, /point/i);
  assert.equal(review.transcript, '');
});

test('a single ordinary "like" is not marked', () => {
  const review = buildIsolationReview({
    segments: [{ t: 4, text: 'I like this plan a lot and the team can start tomorrow morning.' }],
    durationSeconds: 30,
  });
  assert.equal(review.audio.spots.length, 0);
});

test('audio spots name the line and ask a question', () => {
  const review = buildIsolationReview({ segments: SAMPLE, durationSeconds: 300 });
  const filler = review.audio.spots.find(spot => spot.title === 'Filler cluster' && /\bum\b/i.test(spot.detail));
  const cluster = review.audio.spots.find(spot => spot.title === 'Filler cluster' && /\blike\b/i.test(spot.detail));
  assert.ok(filler, 'expected an um spot');
  assert.match(filler.detail, /kind of/);
  assert.match(filler.question, /gap|delete/i);
  assert.ok(cluster, 'expected a like cluster');
  assert.match(cluster.question, /doing a job/i);
  assert.ok(review.audio.spots.every(spot => spot.clock && spot.question));
  const times = review.audio.spots.map(spot => spot.t);
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
});

test('abandoned lines and held pauses become spots', () => {
  const review = buildIsolationReview({
    segments: [
      { t: 8, text: 'Wait let me start over with the actual point about silence.' },
      { t: 28, text: 'After that gap I asked one question and waited for the real answer from her.' },
    ],
    durationSeconds: 60,
  });
  const restart = review.audio.spots.find(spot => spot.title === 'Abandoned line');
  const pause = review.audio.spots.find(spot => spot.title === 'A held pause');
  assert.ok(restart);
  assert.match(restart.question, /finished sentence/i);
  assert.ok(pause);
  assert.match(pause.question, /lip smack/i);
});

test('audio spots are capped', () => {
  const line = 'Um silence works better than noise when the room is tense and waiting for a real answer from you.';
  const segments = Array.from({ length: 8 }, (_, index) => ({
    t: 8 + index * 6,
    text: line,
  }));
  const review = buildIsolationReview({ segments, durationSeconds: 120 });
  assert.equal(review.audio.spots.length, 5);
  const times = review.audio.spots.map(spot => spot.t);
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
});

test('words pass quotes the opening, the last line, a repeat, and a concrete spot', () => {
  const review = buildIsolationReview({ segments: SAMPLE, durationSeconds: 300 });
  const opening = review.structure.spots.find(spot => spot.id === 'structure-open');
  const last = review.structure.spots.find(spot => spot.id === 'structure-close');
  const repeat = review.structure.spots.find(spot => spot.id === 'structure-repeat');
  const concrete = review.structure.spots.find(spot => spot.id === 'structure-concrete');
  const hedge = review.structure.spots.find(spot => spot.id === 'structure-hedge');

  assert.match(opening.quote, /speaking fast/);
  assert.doesNotMatch(opening.quote, /lost 3 clients/);
  assert.match(opening.question, /warming up/);

  assert.match(last.quote, /fill the quiet/);
  assert.match(last.question, /so-what/);

  assert.match(repeat.detail, /people want certainty/i);
  assert.match(repeat.quote, /People want certainty/);
  assert.match(repeat.question, /Cut the other/);

  assert.match(concrete.detail, /concrete anchor/);
  assert.match(concrete.quote, /3|for example|yesterday/i);

  assert.match(hedge.quote, /i think|maybe/);
  assert.match(hedge.question, /already believe/);
});

test('garbage segments do not throw', () => {
  const review = buildIsolationReview({
    segments: [{ t: -5, text: '   ' }, { t: 'no', text: 12 }, null],
    durationSeconds: -1,
  });
  assert.equal(review.transcript, '');
  assert.equal(review.visual.spots.length, 3);
});

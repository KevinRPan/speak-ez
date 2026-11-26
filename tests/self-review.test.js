import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreSelfTranscript } from '../js/utils/transcript-analysis.js';

test('a blank note does not become a review', () => {
  assert.equal(scoreSelfTranscript('   ', 60), null);
  assert.equal(scoreSelfTranscript('', 60), null);
  assert.equal(scoreSelfTranscript(null, 60), null);
});

test('typed words get filler and pace scores from the time spoken', () => {
  const scored = scoreSelfTranscript(
    'Um you know the launch is ready now and the team can start.',
    60,
  );
  assert.equal(scored.fillerCount, 2);
  assert.equal(scored.wpm, 13);
  assert.equal(scored.scores.filler_rate, 7);
  assert.equal(scored.scores.pace, 2);
  assert.equal(scored.scores.clarity, undefined);
  assert.equal(scored.scores.directness, undefined);
  assert.match(scored.analysis.highlightedHtml, /filler-mark/);
  assert.match(scored.analysis.highlightedHtml, /you know/);
});

test('pace can be scored without inventing a message judgment', () => {
  const words = Array.from({ length: 140 }, () => 'ship').join(' ');
  const scored = scoreSelfTranscript(words, 60);
  assert.equal(scored.wpm, 140);
  assert.equal(scored.scores.pace, 10);
  assert.equal(scored.fillerCount, 0);
  assert.equal(scored.scores.filler_rate, 10);
});

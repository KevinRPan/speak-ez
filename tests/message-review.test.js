import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMessageReview, messageReviewMarkup } from '../js/utils/message-review.js';
import {
  buildColdSlidesPrompt,
  buildGamePrompt,
  buildTripleStepPrompt,
} from '../js/data/speaking-games.js';
import { getExercise } from '../js/data/exercises.js';
import { TRACKS } from '../js/data/tracks.js';
import { scenarios } from '../js/data/scenarios.js';
import { getWorkout } from '../js/data/workouts.js';

test('message review names a buried recommendation and stacked caveats', () => {
  const rows = formatMessageReview({
    answered: 'no',
    answered_note: 'They briefed the pipeline and never said whether to ship.',
    recommendation: 'buried',
    recommendation_note: 'The call showed up after three hedges.',
    caveats: 'stacked',
    caveat_note: '“It depends”, “I might be wrong”, and “there are a few risks” came first.',
  });

  assert.deepEqual(rows.map(row => [row.label, row.verdict, row.tone]), [
    ['The question', 'Missed', 'bad'],
    ['Recommendation', 'Buried', 'bad'],
    ['Caveats', 'Stacked', 'bad'],
  ]);
  assert.match(rows[2].note, /It depends/);
});

test('message review drops unknown codes and escapes notes', () => {
  assert.deepEqual(formatMessageReview(null), []);
  assert.deepEqual(formatMessageReview({ answered: 'maybe' }), []);
  const html = messageReviewMarkup({
    answered: 'yes',
    answered_note: 'Ship <the> smaller version.',
    recommendation: 'led',
    caveats: 'one',
  });
  assert.match(html, /What you said/);
  assert.match(html, /Answered/);
  assert.match(html, /Led with it/);
  assert.match(html, /One caveat/);
  assert.match(html, /Ship &lt;the&gt; smaller version/);
  assert.equal(html.includes('<the>'), false);
});

test('triple step holds a message and three ordered words', () => {
  const prompt = buildTripleStepPrompt(() => 0);
  assert.match(prompt, /^Hold this message: /);
  assert.match(prompt, /in this order/);
  const words = [...prompt.matchAll(/^\d\. (.+)$/gm)].map(match => match[1]);
  assert.equal(words.length, 3);
  assert.equal(new Set(words).size, 3);
});

test('cold slides hand over an unseen deck and ask for one recommendation', () => {
  const prompt = buildColdSlidesPrompt(() => 0);
  assert.match(prompt, /The number moved the wrong way/);
  assert.match(prompt, /Slide 1 —/);
  assert.match(prompt, /Slide 2 —/);
  assert.match(prompt, /Slide 3 —/);
  assert.match(prompt, /You have not seen these slides/);
  assert.match(prompt, /single recommendation/);
});

test('game prompts are built for the new drills only', () => {
  assert.equal(buildGamePrompt(null), null);
  assert.equal(buildGamePrompt({ id: 'impromptu' }), null);
  assert.match(buildGamePrompt(getExercise('triple-step'), () => 0), /Hold this message/);
  assert.match(buildGamePrompt(getExercise('cold-slides'), () => 0), /Slide 1/);
  assert.equal(buildGamePrompt(getExercise('executive-readout')), null);
});

test('executive practice is wired into tracks, workouts, and scenarios', () => {
  const ids = TRACKS.flatMap(track => track.levels.flatMap(level => level.projects.map(project => project.id)));
  assert.equal(new Set(ids).size, ids.length);

  for (const track of TRACKS) {
    for (const level of track.levels) {
      for (const project of level.projects) {
        assert.ok(getExercise(project.exerciseId), `${track.id}/${project.id}`);
      }
    }
  }

  const executive = TRACKS.find(track => track.id === 'executive');
  assert.equal(executive.levels.length, 3);
  for (const level of executive.levels) {
    for (const project of level.projects) {
      const exercise = getExercise(project.exerciseId);
      assert.ok(exercise, project.exerciseId);
      assert.ok(project.checklist.length >= 3);
      assert.ok(project.watchFor.length >= 2);
      assert.ok(project.repsRequired >= 1);
      assert.ok(project.duration >= 30);
      assert.ok(project.durationLabel);
      if (project.exerciseId === 'triple-step' || project.exerciseId === 'cold-slides') {
        assert.equal(project.prompts, undefined);
      }
    }
  }

  const workout = getWorkout('exec-reps');
  assert.deepEqual(workout.exercises.map(item => item.exerciseId), [
    'executive-readout',
    'triple-step',
    'cold-slides',
  ]);

  const readout = scenarios.find(scenario => scenario.id === 'exec-readout');
  const incomplete = scenarios.find(scenario => scenario.id === 'incomplete-data-brief');
  assert.equal(readout.unlocked, true);
  assert.equal(incomplete.unlocked, true);
  assert.match(readout.aiRole, /What do you want me to do/);
  assert.match(incomplete.context, /recommendation/);

  const exerciseIds = getExercise('executive-readout').prompts;
  assert.ok(exerciseIds.length >= 8);
  assert.ok(exerciseIds.every(prompt => typeof prompt === 'string' && prompt.length > 10));
});

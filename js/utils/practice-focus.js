/**
 * Practice focus — what the user chose to keep working on.
 *
 * A started learning track (a course) and pinned exercises are remembered
 * even before a rep is logged, so Home can recommend continuing them.
 *
 * Stored on the main local record as `practiceFocus`:
 *   { courses: { [trackId]: { startedAt } }, pins: [{ exerciseId, pinnedAt }] }
 */

import { getExercise, CATEGORY_INFO } from '../data/exercises.js';
import { TRACKS, getTrack } from '../data/tracks.js';
import { loadAll, saveAll } from './storage.js';
import { getTrackProgressMap, getTrackSummary } from './track-progress.js';

function readFocus() {
  const stored = loadAll().practiceFocus;
  return {
    courses: { ...(stored?.courses || {}) },
    pins: Array.isArray(stored?.pins) ? stored.pins.map(pin => ({ ...pin })) : [],
  };
}

function writeFocus(mutator) {
  const data = loadAll();
  const focus = {
    courses: { ...(data.practiceFocus?.courses || {}) },
    pins: Array.isArray(data.practiceFocus?.pins) ? data.practiceFocus.pins.map(pin => ({ ...pin })) : [],
  };
  mutator(focus);
  data.practiceFocus = focus;
  saveAll(data);
  return focus;
}

export function getPracticeFocus() {
  return readFocus();
}

function trackHasReps(track, progressMap) {
  return track.levels.some(level =>
    level.projects.some(project => (progressMap[project.id]?.reps || []).length > 0)
  );
}

function latestRepDate(track, progressMap) {
  let lastRep = '';
  track.levels.forEach(level => level.projects.forEach(project => {
    const reps = progressMap[project.id]?.reps || [];
    reps.forEach(rep => {
      if (rep.date > lastRep) lastRep = rep.date;
    });
  }));
  return lastRep;
}

/**
 * A track counts as started once the user taps Start, or once any rep exists.
 */
export function isCourseStarted(trackId, progressMap = getTrackProgressMap()) {
  if (readFocus().courses[trackId]) return true;
  const track = getTrack(trackId);
  if (!track) return false;
  return trackHasReps(track, progressMap);
}

/**
 * Mark a track as the course the user is working through.
 * Refreshing startedAt makes it the most recent thing to continue.
 */
export function touchCourse(trackId) {
  if (!getTrack(trackId)) return null;
  let saved = null;
  writeFocus(focus => {
    saved = { startedAt: new Date().toISOString() };
    focus.courses[trackId] = saved;
  });
  return saved;
}

export function isExercisePinned(exerciseId) {
  return readFocus().pins.some(pin => pin.exerciseId === exerciseId);
}

/**
 * Pin or unpin an exercise. Returns true when it is pinned afterward.
 */
export function togglePin(exerciseId) {
  if (!getExercise(exerciseId)) return false;
  let pinned = false;
  writeFocus(focus => {
    const index = focus.pins.findIndex(pin => pin.exerciseId === exerciseId);
    if (index >= 0) {
      focus.pins.splice(index, 1);
      pinned = false;
    } else {
      focus.pins.push({ exerciseId, pinnedAt: new Date().toISOString() });
      pinned = true;
    }
  });
  return pinned;
}

/**
 * One-set workout for a pinned exercise. Pass `exercises` as customExercises
 * so the active workout keeps this exercise instead of swapping warmups.
 */
export function buildPinnedWorkout(exercise) {
  const category = CATEGORY_INFO[exercise.category] || {};
  return {
    id: `pinned-${exercise.id}`,
    name: exercise.name,
    description: exercise.description,
    icon: category.icon || '🎯',
    color: category.color || '#7C5CFC',
    duration: Math.max(1, Math.round((exercise.defaultDuration || 60) / 60)),
    preserveExercises: true,
    exercises: [
      { exerciseId: exercise.id, sets: 1, duration: exercise.defaultDuration || 60, rest: 0 },
    ],
  };
}

/**
 * What Home (and the tracks list) should offer as "continue", newest first.
 *
 * Each item is either:
 *   { kind: 'course', recency, track, project, level, levelIndex }
 *   { kind: 'exercise', recency, exercise }
 *
 * A started track with zero reps is included. A finished track is not.
 * @param {object} [progressMap]
 * @param {{ limit?: number }} [options]
 */
export function getContinueItems(progressMap = getTrackProgressMap(), options = {}) {
  const focus = readFocus();
  const items = [];

  for (const track of TRACKS) {
    const summary = getTrackSummary(track, progressMap);
    if (!summary.nextProject) continue;

    const startedAt = focus.courses[track.id]?.startedAt || '';
    const lastRep = latestRepDate(track, progressMap);
    if (!startedAt && !lastRep) continue;

    items.push({
      kind: 'course',
      recency: startedAt > lastRep ? startedAt : lastRep,
      track,
      project: summary.nextProject.project,
      level: summary.nextProject.level,
      levelIndex: summary.nextProject.levelIndex,
    });
  }

  for (const pin of focus.pins) {
    const exercise = getExercise(pin.exerciseId);
    if (!exercise) continue;
    items.push({
      kind: 'exercise',
      recency: pin.pinnedAt || '',
      exercise,
    });
  }

  items.sort((a, b) => (b.recency || '').localeCompare(a.recency || ''));

  const limit = options.limit;
  if (Number.isFinite(limit) && limit >= 0) return items.slice(0, limit);
  return items;
}

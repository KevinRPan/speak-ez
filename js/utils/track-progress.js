/**
 * Track Progress — rep logging and completion state for learning tracks
 *
 * Stored in the main local store under `trackProgress`:
 *   { [projectId]: { reps: [rep], completedAt: iso|null } }
 *
 * A rep: { id, date, sessionId, rating, aiScores, fillerCount, checked: [idx], notes }
 * `checked` holds indices into the project's evaluation checklist.
 */

import { loadAll, saveAll } from './storage.js';
import { TRACKS, getTrackProject, getTrackProjectCount } from '../data/tracks.js';

export function getTrackProgressMap() {
  return loadAll().trackProgress || {};
}

export function getProjectProgress(projectId) {
  return getTrackProgressMap()[projectId] || { reps: [], completedAt: null };
}

export function isProjectComplete(project, progressMap = getTrackProgressMap()) {
  const entry = progressMap[project.id];
  return !!entry && entry.reps.length >= project.repsRequired;
}

/**
 * Level 0 is always unlocked; level N unlocks when every project
 * in level N-1 is complete.
 */
export function isLevelUnlocked(track, levelIndex, progressMap = getTrackProgressMap()) {
  if (levelIndex === 0) return true;
  return track.levels[levelIndex - 1].projects.every(p => isProjectComplete(p, progressMap));
}

/**
 * Log a completed rep for a project. Returns the saved rep.
 */
export function recordRep(trackId, projectId, rep) {
  const found = getTrackProject(trackId, projectId);
  if (!found) return null;

  const data = loadAll();
  if (!data.trackProgress) data.trackProgress = {};
  if (!data.trackProgress[projectId]) {
    data.trackProgress[projectId] = { reps: [], completedAt: null };
  }

  const entry = data.trackProgress[projectId];
  const saved = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    sessionId: rep.sessionId || null,
    rating: rep.rating ?? null,
    aiScores: rep.aiScores || null,
    fillerCount: rep.fillerCount ?? null,
    checked: rep.checked || [],
    notes: rep.notes || '',
  };
  entry.reps.push(saved);

  if (!entry.completedAt && entry.reps.length >= found.project.repsRequired) {
    entry.completedAt = saved.date;
  }

  saveAll(data);
  return saved;
}

/**
 * Patch a previously logged rep (checklist self-evaluation, notes).
 */
export function updateRep(projectId, repId, patch) {
  const data = loadAll();
  const entry = data.trackProgress?.[projectId];
  if (!entry) return null;
  const rep = entry.reps.find(r => r.id === repId);
  if (!rep) return null;
  Object.assign(rep, patch);
  saveAll(data);
  return rep;
}

/**
 * Per-checklist-item hit rate across logged reps.
 * Returns array of { item, hits, total, rate } aligned with project.checklist.
 */
export function getChecklistStats(project, progress = getProjectProgress(project.id)) {
  const total = progress.reps.length;
  return project.checklist.map((item, idx) => {
    const hits = progress.reps.filter(r => r.checked.includes(idx)).length;
    return { item, hits, total, rate: total ? hits / total : 0 };
  });
}

/**
 * Areas to monitor: checklist items the user marks in fewer than half
 * of their reps (once there are at least 2 reps), plus the project's
 * static watch-fors.
 */
export function getMonitorAreas(project, progress = getProjectProgress(project.id)) {
  const weak = progress.reps.length >= 2
    ? getChecklistStats(project, progress).filter(s => s.rate < 0.5).map(s => s.item)
    : [];
  return { weakSpots: weak, watchFor: project.watchFor || [] };
}

/**
 * Track-level summary: { completed, total, pct, nextProject } where
 * nextProject is the first incomplete project in an unlocked level.
 */
export function getTrackSummary(track, progressMap = getTrackProgressMap()) {
  const total = getTrackProjectCount(track);
  let completed = 0;
  let nextProject = null;

  track.levels.forEach((level, levelIndex) => {
    const unlocked = isLevelUnlocked(track, levelIndex, progressMap);
    level.projects.forEach(project => {
      if (isProjectComplete(project, progressMap)) {
        completed++;
      } else if (!nextProject && unlocked) {
        nextProject = { project, level, levelIndex };
      }
    });
  });

  return { completed, total, pct: total ? completed / total : 0, nextProject };
}

/**
 * The most relevant thing to do next across all tracks:
 * the next project of the most recently practiced unfinished track.
 * Returns { track, project, level, started } or null if nothing started.
 */
export function getContinueTarget(progressMap = getTrackProgressMap()) {
  let best = null;
  let bestDate = '';

  for (const track of TRACKS) {
    const summary = getTrackSummary(track, progressMap);
    if (!summary.nextProject) continue;

    // Latest rep date anywhere in this track
    let lastRep = '';
    track.levels.forEach(l => l.projects.forEach(p => {
      const reps = progressMap[p.id]?.reps || [];
      reps.forEach(r => { if (r.date > lastRep) lastRep = r.date; });
    }));

    if (lastRep && lastRep > bestDate) {
      bestDate = lastRep;
      best = { track, ...summary.nextProject, started: true };
    }
  }

  return best;
}

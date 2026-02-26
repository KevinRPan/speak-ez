/**
 * Persistence layer for Speak-EZ — facade
 * Delegates to storage-local.js for all reads/writes.
 * When authenticated, queues background sync via storage-remote.js.
 * Public API is unchanged — no screen code changes needed.
 */

import { loadLocal, saveLocal, clearLocal, invalidateCache } from './storage-local.js';
import { pushToServer, pullFromServer } from './storage-remote.js';
import { isAuthenticated } from './auth.js';

const SYNC_KEY = 'speakez_last_sync';
let _syncTimer = null;

export function loadAll() {
  return loadLocal();
}

export function saveAll(data) {
  data.updatedAt = new Date().toISOString();
  saveLocal(data);
  queueSync();
  return data;
}

export function update(path, value) {
  const data = loadAll();
  const keys = path.split('.');
  let obj = data;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  saveAll(data);
  return data;
}

export function addSession(session) {
  const data = loadAll();
  if (!session.id) session.id = crypto.randomUUID();
  data.history.unshift(session);
  saveAll(data);
  return data;
}

export function addInterviewUploadSession(payload) {
  const data = loadAll();
  const nowIso = new Date().toISOString();
  const overallScore = Number(payload?.feedback?.overallScore || 0);
  const threadId = payload?.threadId || crypto.randomUUID();
  const turnIndex = Number(payload?.turnIndex || 1);

  const session = {
    id: crypto.randomUUID(),
    threadId,
    turnIndex,
    type: 'interview-upload',
    icon: '📹',
    color: 'var(--blue)',
    workoutName: `Interview Upload - ${formatInterviewType(payload?.interviewType)} (Turn ${turnIndex})`,
    completedAt: nowIso,
    totalDuration: 0,
    setsCompleted: 1,
    totalSets: 1,
    xpEarned: 0,
    exercises: [{
      exerciseName: 'Uploaded interview response',
      setsCompleted: 1,
      setsTotal: 1,
      ratings: overallScore ? [Math.min(5, Math.max(1, Math.round(overallScore / 2)))] : [],
    }],
    upload: {
      fileName: payload?.fileName || 'upload',
      mimeType: payload?.mimeType || '',
      interviewType: payload?.interviewType || '',
      interviewerRole: payload?.interviewerRole || '',
      interviewScenario: payload?.interviewScenario || '',
      jobDescription: payload?.jobDescription || '',
      jobNotes: payload?.jobNotes || '',
      questionContext: payload?.questionContext || '',
      nextQuestion: payload?.nextQuestion || '',
      shouldContinue: payload?.shouldContinue !== false,
      targetRounds: Number(payload?.targetRounds || 4),
      turnIndex,
      threadId,
      turns: Array.isArray(payload?.turns) ? payload.turns : [],
      transcript: payload?.transcript || '',
      transcriptionNotes: payload?.transcriptionNotes || {},
      feedback: payload?.feedback || {},
    },
  };

  data.history.unshift(session);
  saveAll(data);
  return session;
}

export function getInterviewUploadSessions() {
  const history = loadAll().history;
  return history.filter(session => session?.type === 'interview-upload');
}

export function updateInterviewUploadSession(sessionId, updater) {
  if (!sessionId || typeof updater !== 'function') return null;
  const data = loadAll();
  const index = data.history.findIndex(session => session?.id === sessionId && session?.type === 'interview-upload');
  if (index === -1) return null;

  const current = data.history[index];
  const next = updater(current);
  if (!next) return null;

  data.history[index] = next;
  saveAll(data);
  return next;
}

export function getHistory() {
  return loadAll().history;
}

export function getUser() {
  return loadAll().user;
}

export function getSettings() {
  return loadAll().settings;
}

export function clearAll() {
  clearLocal();
}

function formatInterviewType(interviewType) {
  const map = {
    'recruiter-screen': 'Recruiter Screen',
    'hiring-manager': 'Hiring Manager',
    'behavioral': 'Behavioral',
    'coding': 'Coding',
    'system-design': 'System Design',
    'final-onsite': 'Final Onsite',
  };
  return map[interviewType] || 'Interview';
}

/** Debounced push to server (2s). Only runs when authenticated. */
function queueSync() {
  if (!isAuthenticated()) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
      const data = loadAll();
      await pushToServer({
        profile: data.user,
        settings: data.settings,
        history: data.history,
        personalRecords: data.personalRecords,
        customWorkouts: data.customWorkouts,
        updatedAt: data.updatedAt,
      });
      localStorage.setItem(SYNC_KEY, new Date().toISOString());
    } catch (err) {
      console.error('Background sync failed:', err);
    }
  }, 2000);
}

/**
 * Pull server data and merge into local store.
 * Called on app boot when authenticated.
 */
export async function pullAndMerge() {
  if (!isAuthenticated()) return;
  try {
    const since = localStorage.getItem(SYNC_KEY);
    const remote = await pullFromServer(since);
    const local = loadAll();

    // Profile/settings: last-write-wins
    if (remote.updatedAt && (!local.updatedAt || remote.updatedAt > local.updatedAt)) {
      if (Object.keys(remote.profile).length > 0) {
        local.user = { ...local.user, ...remote.profile };
      }
      if (Object.keys(remote.settings).length > 0) {
        local.settings = { ...local.settings, ...remote.settings };
      }
    }

    // Personal records: max-value-wins
    for (const [exercise, metrics] of Object.entries(remote.personalRecords || {})) {
      if (!local.personalRecords[exercise]) {
        local.personalRecords[exercise] = metrics;
        continue;
      }
      for (const [metric, value] of Object.entries(metrics)) {
        if (typeof value === 'number') {
          local.personalRecords[exercise][metric] = Math.max(
            local.personalRecords[exercise][metric] || 0,
            value
          );
        } else if (!local.personalRecords[exercise][metric]) {
          local.personalRecords[exercise][metric] = value;
        }
      }
    }

    // History: union by id
    const localIds = new Set(local.history.map(s => s.id).filter(Boolean));
    for (const session of remote.history || []) {
      if (session.id && !localIds.has(session.id)) {
        local.history.push(session);
      }
    }
    local.history.sort((a, b) => {
      const da = a.completedAt || a.date || '';
      const db = b.completedAt || b.date || '';
      return db.localeCompare(da);
    });

    // Custom workouts: union by id
    const localWorkoutIds = new Set(local.customWorkouts.map(w => w.id).filter(Boolean));
    for (const workout of remote.customWorkouts || []) {
      if (workout.id && !localWorkoutIds.has(workout.id)) {
        local.customWorkouts.push(workout);
      }
    }

    // Save merged state (without re-triggering sync push)
    saveLocal(local);
    invalidateCache();
    localStorage.setItem(SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.error('Pull and merge failed:', err);
  }
}

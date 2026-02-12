/**
 * Local storage layer — extracted from storage.js
 * Direct localStorage read/write with in-memory cache.
 */

const STORAGE_KEY = 'speakez';

export const defaults = {
  user: {
    name: '',
    xp: 0,
    level: 1,
    streak: 0,
    lastPracticeDate: null,
    weeklyGoal: 3,
    createdAt: Date.now(),
  },
  history: [],
  personalRecords: {},
  customWorkouts: [],
  settings: {
    restDuration: 30,
    soundEnabled: true,
    notifications: false,
  },
};

let _cache = null;

export function loadLocal() {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _cache = { ...defaults, ...JSON.parse(raw) };
      _cache.user = { ...defaults.user, ..._cache.user };
      _cache.settings = { ...defaults.settings, ..._cache.settings };
    } else {
      _cache = { ...defaults };
    }
  } catch {
    _cache = { ...defaults };
  }
  return _cache;
}

export function saveLocal(data) {
  _cache = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

export function clearLocal() {
  _cache = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function invalidateCache() {
  _cache = null;
}

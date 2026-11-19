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
  trackProgress: {},
  practiceFocus: {
    courses: {},
    pins: [],
  },
  settings: {
    restDuration: 30,
    soundEnabled: true,
    notifications: false,
    interviewPosition: '',
    interviewLevel: '',
  },
};

let _cache = null;

export function loadLocal() {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _cache = { ...structuredClone(defaults), ...JSON.parse(raw) };
      _cache.user = { ...defaults.user, ..._cache.user };
      _cache.settings = { ...defaults.settings, ..._cache.settings };
      _cache.practiceFocus = {
        courses: { ...(_cache.practiceFocus?.courses || {}) },
        pins: Array.isArray(_cache.practiceFocus?.pins) ? _cache.practiceFocus.pins : [],
      };
    } else {
      _cache = structuredClone(defaults);
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

/**
 * Persistence layer for Speak-EZ
 * Uses localStorage with JSON serialization
 */

const STORAGE_KEY = 'speakez';

const defaults = {
  user: {
    name: '',
    xp: 0,
    level: 1,
    streak: 0,
    lastPracticeDate: null,
    weeklyGoal: 3,       // sessions per week
    createdAt: Date.now(),
  },
  history: [],            // completed workout sessions
  personalRecords: {},    // best scores per exercise per metric
  customWorkouts: [],     // user-created workout templates
  settings: {
    restDuration: 30,     // default rest between exercises (seconds)
    soundEnabled: true,
    notifications: false,
  },
};

let _cache = null;

export function loadAll() {
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

export function saveAll(data) {
  _cache = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save:', e);
  }
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
  data.history.unshift(session);
  saveAll(data);
  return data;
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
  _cache = null;
  localStorage.removeItem(STORAGE_KEY);
}

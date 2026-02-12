/**
 * Auth state management
 * Checks session with server, exposes login/logout helpers.
 * Caches auth user in localStorage so profile renders correctly on load.
 */

const AUTH_CACHE_KEY = 'speakez_auth_user';

let _currentUser = null;
let _checked = false;

// Initialize from localStorage so getAuthUser() returns immediately on load
try {
  const cached = localStorage.getItem(AUTH_CACHE_KEY);
  if (cached) _currentUser = JSON.parse(cached);
} catch { /* ignore corrupt cache */ }

/** Check if there's a valid session cookie. Non-blocking, caches result. */
export async function checkSession() {
  if (_checked) return _currentUser;
  const prev = _currentUser;
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      _currentUser = data.user;
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data.user));
    } else {
      _currentUser = null;
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // Network error — keep cached state, don't wipe it
  }
  _checked = true;

  // Notify listeners if auth state changed (e.g. session expired)
  const changed = !!prev !== !!_currentUser;
  if (changed) _notifyListeners();

  return _currentUser;
}

/** Send magic link to email */
export async function sendMagicLink(email) {
  const res = await fetch('/api/auth/send-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send link');
  return data;
}

/** Log out — clear server session and local state */
export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch {
    // Network error is fine — cookie will expire
  }
  _currentUser = null;
  _checked = false;
  localStorage.removeItem(AUTH_CACHE_KEY);
}

/** Get cached user (null if not signed in or not yet checked) */
export function getAuthUser() {
  return _currentUser;
}

/** Whether we've completed the session check */
export function isSessionChecked() {
  return _checked;
}

export function isAuthenticated() {
  return !!_currentUser;
}

/** Reset check state so next checkSession() hits the server */
export function resetAuthState() {
  _currentUser = null;
  _checked = false;
}

/** Listeners notified when auth state changes after background session check */
const _listeners = new Set();

export function onAuthChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _notifyListeners() {
  for (const fn of _listeners) fn(_currentUser);
}

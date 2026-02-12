/**
 * Auth state management
 * Checks session with server, exposes login/logout helpers.
 */

let _currentUser = null;
let _checked = false;

/** Check if there's a valid session cookie. Non-blocking, caches result. */
export async function checkSession() {
  if (_checked) return _currentUser;
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      _currentUser = data.user;
    } else {
      _currentUser = null;
    }
  } catch {
    _currentUser = null;
  }
  _checked = true;
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

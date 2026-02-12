/**
 * Profile Screen — stats, level, settings, account
 */

import { getUser, getHistory, getSettings, update, loadAll, saveAll, clearAll, pullAndMerge } from '../utils/storage.js';
import { getLevelInfo, LEVELS, getWeeklyCount } from '../utils/xp.js';
import { getAuthUser, sendMagicLink, logout as authLogout, isSessionChecked, onAuthChange } from '../utils/auth.js';

function renderAccountCard() {
  const authUser = getAuthUser();
  if (authUser) {
    const lastSync = localStorage.getItem('speakez_last_sync');
    const syncText = lastSync ? timeAgo(lastSync) : 'Never';
    return `
      <div class="card mb-16" id="account-card">
        <div class="label mb-12">Account</div>
        <div class="auth-signed-in">
          <div class="auth-email">${authUser.email}</div>
          <div class="auth-sync-status">Last synced: ${syncText}</div>
          <div class="flex gap-8 mt-12">
            <button class="btn btn-sm btn-secondary flex-1" data-action="sync-now">Sync now</button>
            <button class="btn btn-sm btn-secondary flex-1" data-action="sign-out">Sign out</button>
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="card mb-16" id="account-card">
      <div class="label mb-12">Account</div>
      <div class="auth-signed-out">
        <div class="auth-prompt">Sign in to sync across devices</div>
        <div class="auth-form">
          <input type="email" class="auth-input" id="auth-email" placeholder="you@email.com" autocomplete="email" />
          <button class="btn btn-sm btn-primary" data-action="send-magic-link">Send magic link</button>
        </div>
        <div class="auth-status" id="auth-status"></div>
      </div>
    </div>`;
}

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function renderProfile(container) {
  const user = getUser();
  const history = getHistory();
  const settings = getSettings();
  const level = getLevelInfo(user.xp);

  const totalMinutes = Math.round(history.reduce((sum, s) => sum + s.totalDuration, 0) / 60);

  container.innerHTML = `
    <div class="screen">
      <div class="profile-header">
        <div class="profile-avatar">🗣</div>
        <div class="h1">${level.title}</div>
        <div class="subtitle">Level ${level.level}</div>

        <!-- Level progress -->
        <div class="mt-16" style="max-width: 280px; margin-left: auto; margin-right: auto;">
          <div class="level-bar">
            <span class="level-badge">LVL ${level.level}</span>
            <div class="level-progress">
              <div class="level-progress-fill" style="width: ${Math.round(level.progress * 100)}%"></div>
            </div>
          </div>
          <div class="level-xp-text">
            ${user.xp} XP${level.next ? ` / ${level.next.xp} XP to Level ${level.next.level}` : ' — Max Level!'}
          </div>
        </div>

        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${history.length}</div>
            <div class="profile-stat-label">Sessions</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${totalMinutes}</div>
            <div class="profile-stat-label">Minutes</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">${user.streak}</div>
            <div class="profile-stat-label">Day Streak</div>
          </div>
        </div>
      </div>

      <!-- Account -->
      ${renderAccountCard()}

      <!-- Weekly Goal -->
      <div class="card mb-16">
        <div class="label mb-12">Weekly goal</div>
        <div class="flex items-center justify-between">
          <span class="h3">${getWeeklyCount(history)} / ${user.weeklyGoal} sessions this week</span>
        </div>
        <div class="mt-12">
          <div class="label mb-8">Sessions per week</div>
          <div class="time-picker">
            ${[2, 3, 4, 5, 7].map(n => `
              <button class="time-chip ${user.weeklyGoal === n ? 'active' : ''}"
                data-action="set-weekly-goal" data-goal="${n}">
                ${n}x
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- All Levels -->
      <div class="card mb-16">
        <div class="label mb-12">All levels</div>
        ${LEVELS.map(l => `
          <div class="exercise-row" style="opacity: ${user.xp >= l.xp ? 1 : 0.4};">
            <div class="exercise-row-dot" style="background: ${user.xp >= l.xp ? 'var(--accent)' : 'var(--text-tertiary)'};"></div>
            <div class="exercise-row-info">
              <div class="exercise-row-name">Level ${l.level} — ${l.title}</div>
              <div class="exercise-row-detail">${l.xp.toLocaleString()} XP</div>
            </div>
            ${level.level === l.level ? '<span class="badge badge-accent">Current</span>' : ''}
            ${user.xp >= l.xp && level.level !== l.level ? '<span style="color: var(--success);">✓</span>' : ''}
          </div>
        `).join('')}
      </div>

      <!-- Settings -->
      <div class="card mb-16">
        <div class="label mb-12">Settings</div>
        <div class="settings-item">
          <span class="settings-label">Sound effects</span>
          <div class="toggle ${settings.soundEnabled ? 'on' : ''}" data-action="toggle-sound"></div>
        </div>
        <div class="settings-item">
          <span class="settings-label">Default rest (sec)</span>
          <div class="flex items-center gap-8">
            <button class="builder-btn" data-action="rest-change" data-delta="-5">−</button>
            <span class="builder-value">${settings.restDuration}</span>
            <button class="builder-btn" data-action="rest-change" data-delta="5">+</button>
          </div>
        </div>
      </div>

      <!-- Data -->
      <div class="card">
        <div class="label mb-12">Data</div>
        <div class="settings-item">
          <span class="settings-label">Export data</span>
          <button class="btn btn-sm btn-secondary" data-action="export-data">Export</button>
        </div>
        <div class="settings-item">
          <span class="settings-label">Reset all data</span>
          <button class="btn btn-sm btn-secondary" style="color: var(--danger);" data-action="reset-data">Reset</button>
        </div>
      </div>
    </div>
  `;

  // If session check hasn't completed yet, re-render account card when it does
  if (!isSessionChecked()) {
    const unsub = onAuthChange(() => {
      unsub();
      const cardEl = container.querySelector('#account-card');
      if (cardEl) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderAccountCard();
        cardEl.replaceWith(tmp.firstElementChild);
      }
    });
  }

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const type = action.dataset.action;

    if (type === 'set-weekly-goal') {
      const goal = parseInt(action.dataset.goal);
      update('user.weeklyGoal', goal);
      renderProfile(container);
    } else if (type === 'toggle-sound') {
      const store = loadAll();
      store.settings.soundEnabled = !store.settings.soundEnabled;
      saveAll(store);
      renderProfile(container);
    } else if (type === 'rest-change') {
      const delta = parseInt(action.dataset.delta);
      const store = loadAll();
      store.settings.restDuration = Math.max(5, Math.min(120, store.settings.restDuration + delta));
      saveAll(store);
      renderProfile(container);
    } else if (type === 'export-data') {
      exportData();
    } else if (type === 'reset-data') {
      if (confirm('This will delete ALL your data including workout history, XP, and streaks. Are you sure?')) {
        clearAll();
        renderProfile(container);
      }
    } else if (type === 'send-magic-link') {
      handleSendLink(container);
    } else if (type === 'sync-now') {
      handleSyncNow(container);
    } else if (type === 'sign-out') {
      handleSignOut(container);
    }
  };
}

async function handleSendLink(container) {
  const emailInput = document.getElementById('auth-email');
  const statusEl = document.getElementById('auth-status');
  const email = emailInput?.value?.trim();
  if (!email) {
    if (statusEl) statusEl.textContent = 'Please enter your email';
    return;
  }
  if (statusEl) statusEl.textContent = 'Sending...';
  try {
    await sendMagicLink(email);
    if (statusEl) {
      statusEl.textContent = `Check your email! Link sent to ${email}`;
      statusEl.className = 'auth-status auth-status-success';
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = err.message || 'Failed to send link';
      statusEl.className = 'auth-status auth-status-error';
    }
  }
}

async function handleSyncNow(container) {
  const syncBtn = container.querySelector('[data-action="sync-now"]');
  if (syncBtn) syncBtn.textContent = 'Syncing...';
  try {
    await pullAndMerge();
    renderProfile(container);
  } catch {
    if (syncBtn) syncBtn.textContent = 'Sync failed';
  }
}

async function handleSignOut(container) {
  await authLogout();
  renderProfile(container);
}

function exportData() {
  const store = loadAll();
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `speakez-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

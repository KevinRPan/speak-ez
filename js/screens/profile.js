/**
 * Profile Screen — stats, level, settings
 */

import { getUser, getHistory, getSettings, update, loadAll, saveAll, clearAll } from '../utils/storage.js';
import { getLevelInfo, LEVELS, getWeeklyCount } from '../utils/xp.js';

export function renderProfile(container) {
  const user = getUser();
  const history = getHistory();
  const settings = getSettings();
  const level = getLevelInfo(user.xp);

  const totalSets = history.reduce((sum, s) => sum + s.setsCompleted, 0);
  const totalMinutes = Math.round(history.reduce((sum, s) => sum + s.totalDuration, 0) / 60);
  const totalXp = user.xp;

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
    }
  };
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

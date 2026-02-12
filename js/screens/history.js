/**
 * History Screen — past workout sessions
 */

import { getHistory } from '../utils/storage.js';
import { navigateTo } from '../lib/router.js';

export function renderHistory(container) {
  const history = getHistory();

  container.innerHTML = `
    <div class="screen">
      <div class="h1 mb-8">History</div>
      <div class="subtitle mb-24">${history.length} session${history.length !== 1 ? 's' : ''} logged</div>

      ${history.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">No sessions yet. Complete a workout to see it here.</div>
          <button class="btn btn-primary mt-16" data-action="start-workout">Start First Workout</button>
        </div>
      ` : `
        <div class="history-list">
          ${history.map((session, i) => `
            <div class="card card-sm card-interactive history-item" data-action="view-session" data-index="${i}">
              <div class="history-icon" style="background: ${session.color || 'var(--accent)'}20;">
                ${session.icon || '🎯'}
              </div>
              <div class="history-info">
                <div class="history-name">${session.workoutName}</div>
                <div class="history-meta">
                  ${formatDate(session.completedAt)} · ${Math.round(session.totalDuration / 60)} min · ${session.setsCompleted}/${session.totalSets} sets
                </div>
              </div>
              <div class="history-xp">+${session.xpEarned} XP</div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;

    if (action.dataset.action === 'start-workout') {
      navigateTo('workouts');
    } else if (action.dataset.action === 'view-session') {
      const index = parseInt(action.dataset.index);
      const session = history[index];
      renderSessionDetail(container, session);
    }
  };
}

function renderSessionDetail(container, session) {
  if (!session) return;

  const avgRating = getAvgRating(session);

  container.innerHTML = `
    <div class="screen">
      <button class="back-btn" data-action="back">← History</button>

      <div style="text-align: center; padding: 12px 0 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">${session.icon || '🎯'}</div>
        <div class="h1 mb-4">${session.workoutName}</div>
        <div class="subtitle">${formatDate(session.completedAt)}</div>
      </div>

      <div class="complete-stats mb-24">
        <div class="stat-card">
          <div class="stat-value">${Math.round(session.totalDuration / 60)}</div>
          <div class="stat-label">minutes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${session.setsCompleted}/${session.totalSets}</div>
          <div class="stat-label">sets</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${session.exercises.length}</div>
          <div class="stat-label">exercises</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgRating ? avgRating.toFixed(1) : '—'}</div>
          <div class="stat-label">avg rating</div>
        </div>
      </div>

      <div class="card mb-16">
        <div class="label mb-12">Exercises</div>
        ${session.exercises.map(ex => `
          <div class="exercise-row">
            <div class="exercise-row-info">
              <div class="exercise-row-name">${ex.exerciseName}</div>
              <div class="exercise-row-detail">
                ${ex.setsCompleted}/${ex.setsTotal} sets
                ${ex.ratings.length ? ` · Avg rating: ${(ex.ratings.reduce((a, b) => a + b, 0) / ex.ratings.length).toFixed(1)}/5` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card card-sm">
        <div class="flex items-center justify-between">
          <span class="label">XP earned</span>
          <span style="font-weight: 700; color: var(--accent);">+${session.xpEarned} XP</span>
        </div>
      </div>
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'back') {
      renderHistory(container);
    }
  };
}

function getAvgRating(session) {
  const allRatings = session.exercises.flatMap(e => e.ratings);
  if (!allRatings.length) return null;
  return allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return 'Today at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

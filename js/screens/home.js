/**
 * Home Screen — the main dashboard
 * Shows streak, weekly progress, and quick-start workout options
 */

import { getUser, getHistory } from '../utils/storage.js';
import { getLevelInfo, getWeeklyCount, checkStreak } from '../utils/xp.js';
import { workoutTemplates } from '../data/workouts.js';

export function renderHome(container) {
  const user = getUser();
  const history = getHistory();
  const level = getLevelInfo(user.xp);
  const weeklyCount = getWeeklyCount(history);
  const streakInfo = checkStreak(user.lastPracticeDate, user.streak);

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;

  // Figure out which days this week had sessions
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);

  const daysWithSessions = new Set();
  history.forEach(s => {
    const d = new Date(s.completedAt);
    if (d >= monday) {
      const diff = Math.floor((d - monday) / (1000 * 60 * 60 * 24));
      if (diff < 7) daysWithSessions.add(diff);
    }
  });

  const greeting = getGreeting();

  container.innerHTML = `
    <div class="screen">
      <!-- Greeting & Streak -->
      <div class="mb-24">
        <div class="h1 mb-8">${greeting}</div>
        <div class="subtitle">Ready to sharpen your communication?</div>
      </div>

      <!-- Streak & Weekly Progress -->
      <div class="card mb-16">
        <div class="flex items-center justify-between mb-12">
          <div class="streak-display">
            <div class="streak-count">${streakInfo.streak}</div>
            <div class="streak-unit">day<br>streak</div>
          </div>
          <div style="text-align: right;">
            <div class="h3">${weeklyCount} / ${user.weeklyGoal}</div>
            <div class="label">this week</div>
          </div>
        </div>
        <div class="week-dots">
          ${weekDays.map((day, i) => `
            <div class="week-dot ${daysWithSessions.has(i) ? 'completed' : ''} ${i === dayOfWeek - 1 ? 'today' : ''}">
              ${daysWithSessions.has(i) ? '✓' : day}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Level Progress -->
      <div class="card card-sm mb-24">
        <div class="level-bar">
          <span class="level-badge">LVL ${level.level}</span>
          <div class="level-progress">
            <div class="level-progress-fill" style="width: ${Math.round(level.progress * 100)}%"></div>
          </div>
        </div>
        <div class="level-xp-text">${level.title} — ${user.xp} XP${level.next ? ` / ${level.next.xp} XP` : ''}</div>
      </div>

      <!-- Start Workout CTA -->
      <div class="section">
        <button class="btn btn-primary btn-lg btn-block" data-action="start-workout">
          Start Workout
        </button>
      </div>

      <!-- Quick Pick by Time -->
      <div class="section">
        <div class="section-header">
          <span class="label">Quick pick by time</span>
        </div>
        <div class="time-picker">
          <button class="time-chip" data-action="quick-time" data-minutes="5">5 min</button>
          <button class="time-chip" data-action="quick-time" data-minutes="15">15 min</button>
          <button class="time-chip" data-action="quick-time" data-minutes="20">20 min</button>
          <button class="time-chip" data-action="quick-time" data-minutes="25">25 min</button>
        </div>
      </div>

      <!-- Popular Workouts -->
      <div class="section">
        <div class="section-header">
          <span class="label">Popular workouts</span>
        </div>
        <div class="flex flex-col gap-8">
          ${workoutTemplates.slice(0, 4).map(w => `
            <div class="card card-interactive card-sm workout-card" data-action="view-workout" data-workout="${w.id}">
              <div class="workout-card-icon" style="background: ${w.color}20;">
                ${w.icon}
              </div>
              <div class="workout-card-info">
                <div class="workout-card-name">${w.name}</div>
                <div class="workout-card-meta">
                  <span>${w.duration} min</span>
                  <span>${w.exercises.length} exercises</span>
                  <span class="difficulty difficulty-${w.difficulty}">${w.difficulty}</span>
                </div>
              </div>
              <div class="workout-card-arrow">›</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recent Session -->
      ${history.length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="label">Last session</span>
          </div>
          <div class="card card-sm card-interactive history-item" data-action="view-session" data-index="0">
            <div class="history-icon" style="background: ${history[0].color || 'var(--accent)'}20;">
              ${history[0].icon || '🎯'}
            </div>
            <div class="history-info">
              <div class="history-name">${history[0].workoutName}</div>
              <div class="history-meta">${formatTimeAgo(history[0].completedAt)} — ${Math.round(history[0].totalDuration / 60)} min</div>
            </div>
            <div class="history-xp">+${history[0].xpEarned} XP</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Event delegation
  container.addEventListener('click', handleHomeClick);
}

function handleHomeClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;

  const type = action.dataset.action;

  if (type === 'start-workout') {
    document.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'workouts' } }));
  } else if (type === 'quick-time') {
    const minutes = parseInt(action.dataset.minutes);
    document.dispatchEvent(new CustomEvent('navigate', {
      detail: { screen: 'workouts', data: { filterMinutes: minutes } }
    }));
  } else if (type === 'view-workout') {
    document.dispatchEvent(new CustomEvent('navigate', {
      detail: { screen: 'workout-detail', data: { workoutId: action.dataset.workout } }
    }));
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

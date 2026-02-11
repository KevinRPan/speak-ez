/**
 * Home Screen — the main dashboard
 * Shows hero branding, streak, weekly progress, and quick-start options
 */

import { getUser, getHistory } from '../utils/storage.js';
import { getLevelInfo, getWeeklyCount, checkStreak } from '../utils/xp.js';
import { workoutTemplates } from '../data/workouts.js';
import { navigateTo } from '../lib/router.js';

export function renderHome(container) {
  const user = getUser();
  const history = getHistory();
  const level = getLevelInfo(user.xp);
  const weeklyCount = getWeeklyCount(history);
  const streakInfo = checkStreak(user.lastPracticeDate, user.streak);

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;

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
      <div class="hero">
        <div class="hero-brand">Speak<span class="brand-accent">-EZ</span></div>
        <div class="hero-tagline">${greeting}. Ready to train?</div>
      </div>

      <div class="stat-row">
        <div class="stat-pill">
          <div class="stat-pill-value">${streakInfo.streak}</div>
          <div class="stat-pill-label">Day Streak</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-value">${weeklyCount}/${user.weeklyGoal}</div>
          <div class="stat-pill-label">This Week</div>
        </div>
        <div class="stat-pill">
          <div class="stat-pill-value">LVL ${level.level}</div>
          <div class="stat-pill-label">${user.xp} XP</div>
        </div>
      </div>

      <div class="card mb-16">
        <div class="week-dots">
          ${weekDays.map((day, i) => `
            <div class="week-dot ${daysWithSessions.has(i) ? 'completed' : ''} ${i === dayOfWeek - 1 ? 'today' : ''}">
              ${daysWithSessions.has(i) ? '✓' : day}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card card-sm mb-24">
        <div class="level-bar">
          <span class="level-badge">LVL ${level.level}</span>
          <div class="level-progress">
            <div class="level-progress-fill" style="width: ${Math.round(level.progress * 100)}%"></div>
          </div>
        </div>
        <div class="level-xp-text">${level.title} — ${user.xp} XP${level.next ? ` / ${level.next.xp} XP` : ''}</div>
      </div>

      <div class="cta-section section">
        <button class="btn btn-primary btn-block" id="start-training-btn">
          Start Training
        </button>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="label">Quick pick by time</span>
        </div>
        <div class="time-picker">
          <button class="time-chip" data-minutes="5">5 min</button>
          <button class="time-chip" data-minutes="15">15 min</button>
          <button class="time-chip" data-minutes="20">20 min</button>
          <button class="time-chip" data-minutes="25">25 min</button>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="label">Popular workouts</span>
        </div>
        <div class="workout-grid">
          ${workoutTemplates.slice(0, 4).map(w => `
            <div class="card card-interactive card-sm workout-card" data-workout="${w.id}">
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
    </div>
  `;

  // Direct event listeners — no delegation, no CustomEvent
  document.getElementById('start-training-btn').addEventListener('click', () => {
    navigateTo('workouts');
  });

  container.querySelectorAll('.time-chip[data-minutes]').forEach(chip => {
    chip.addEventListener('click', () => {
      navigateTo('workouts', { filterMinutes: parseInt(chip.dataset.minutes) });
    });
  });

  container.querySelectorAll('.workout-card[data-workout]').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo('workout-detail', { workoutId: card.dataset.workout });
    });
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

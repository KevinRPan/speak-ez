/**
 * Performance Screen — WHOOP-style performance dashboard
 *
 * Tabs:
 *   Overview — skill rings, trends chart, streak calendar, AI insight
 *   Log      — session history (replaces old History screen)
 */

import { getHistory, getUser } from '../utils/storage.js';
import { getLevelInfo, getWeeklyCount } from '../utils/xp.js';
import { generateInsight } from '../utils/recommendations.js';
import { navigateTo } from '../lib/router.js';

const SCORE_CATEGORIES = [
  { key: 'clarity',     label: 'Clarity',     color: '#00B4D8' },
  { key: 'structure',   label: 'Structure',   color: '#7C5CFC' },
  { key: 'confidence',  label: 'Confidence',  color: '#FF6B35' },
  { key: 'conciseness', label: 'Concise',     color: '#FDCB6E' },
  { key: 'filler_rate', label: 'Fillers',     color: '#58CC02' },
  { key: 'pace',        label: 'Pace',        color: '#E84393' },
];

let activeTab = 'overview';

export function renderPerformance(container) {
  activeTab = 'overview';
  renderScreen(container);
}

function renderScreen(container) {
  const history = getHistory();
  const user = getUser();
  const weeklyCount = getWeeklyCount(history);
  const level = getLevelInfo(user.xp);

  container.innerHTML = `
    <div class="screen">
      <div class="perf-header">
        <div class="h1">Performance</div>
        <div class="perf-tab-row">
          <button class="perf-tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
          <button class="perf-tab ${activeTab === 'log' ? 'active' : ''}" data-tab="log">Session Log</button>
        </div>
      </div>

      <div id="perf-tab-content">
        ${activeTab === 'overview' ? renderOverview(history, user, weeklyCount, level) : renderLog(history)}
      </div>
    </div>
  `;

  container.querySelector('.perf-tab-row').addEventListener('click', (e) => {
    const tab = e.target.closest('.perf-tab');
    if (tab) {
      activeTab = tab.dataset.tab;
      renderScreen(container);
    }
  });

  if (activeTab === 'log') {
    container.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      if (action.dataset.action === 'view-session') {
        const index = parseInt(action.dataset.index);
        const session = getHistory()[index];
        renderSessionDetail(container, session);
      }
      if (action.dataset.action === 'start-workout') {
        navigateTo('workouts');
      }
    });
  }

  // Draw charts after render
  if (activeTab === 'overview') {
    setTimeout(() => {
      drawTrendChart(history);
      drawStreakCalendar(history);
    }, 0);
  }
}

// ===== OVERVIEW TAB =====

function renderOverview(history, user, weeklyCount, level) {
  const avgScores = getRecentAvgScores(history, 7);
  const insight = generateInsight(history);

  const totalMinutes = Math.round(history.reduce((a, s) => a + (s.totalDuration || 0), 0) / 60);
  const totalSessions = history.length;
  const streak = user.streak || 0;

  return `
    <!-- Today / Week stats -->
    <div class="whoop-stats-row">
      <div class="whoop-stat">
        <div class="whoop-stat-value">${streak}</div>
        <div class="whoop-stat-label">Day Streak</div>
      </div>
      <div class="whoop-stat">
        <div class="whoop-stat-value">${weeklyCount}</div>
        <div class="whoop-stat-label">This Week</div>
      </div>
      <div class="whoop-stat">
        <div class="whoop-stat-value">${totalMinutes}</div>
        <div class="whoop-stat-label">Total Min</div>
      </div>
      <div class="whoop-stat">
        <div class="whoop-stat-value">${totalSessions}</div>
        <div class="whoop-stat-label">Sessions</div>
      </div>
    </div>

    <!-- Skill rings -->
    <div class="card mb-16">
      <div class="label mb-12">7-Day Skill Averages</div>
      ${SCORE_CATEGORIES.length === 0 || Object.keys(avgScores).length === 0 ? `
        <div class="empty-state-inline">Complete sessions with AI Review to see scores here.</div>
      ` : `
        <div class="skill-rings-grid">
          ${SCORE_CATEGORIES.map(cat => {
            const val = avgScores[cat.key] ?? null;
            const pct = val !== null ? val / 10 : 0;
            return renderSkillRing(cat.label, val, pct, cat.color);
          }).join('')}
        </div>
      `}
    </div>

    ${insight ? `
      <div class="insight-card mb-16">
        <div class="insight-icon">💡</div>
        <div class="insight-text">${insight}</div>
      </div>
    ` : ''}

    <!-- Trend chart -->
    <div class="card mb-16">
      <div class="label mb-8">30-Day Score Trends</div>
      <div class="chart-legend">
        ${SCORE_CATEGORIES.map(cat => `
          <button class="chart-legend-item active" data-category="${cat.key}" style="--cat-color: ${cat.color};">
            ${cat.label}
          </button>
        `).join('')}
      </div>
      <div class="chart-container">
        <canvas id="trend-chart" class="trend-chart"></canvas>
        ${hasChartData(history) ? '' : `<div class="chart-empty">No score data yet — use AI Review during workouts.</div>`}
      </div>
    </div>

    <!-- Streak calendar -->
    <div class="card mb-16">
      <div class="label mb-8">Practice Calendar</div>
      <div class="calendar-container">
        <canvas id="streak-calendar" class="streak-calendar"></canvas>
      </div>
    </div>
  `;
}

function renderSkillRing(label, value, pct, color) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);
  const displayVal = value !== null ? value.toFixed(1) : '—';

  return `
    <div class="skill-ring-wrap">
      <svg class="skill-ring" viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="32" r="${radius}" class="skill-ring-track" />
        <circle cx="32" cy="32" r="${radius}"
          class="skill-ring-fill"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"
          transform="rotate(-90 32 32)"
        />
        <text x="32" y="36" class="skill-ring-text">${displayVal}</text>
      </svg>
      <div class="skill-ring-label">${label}</div>
    </div>
  `;
}

function hasChartData(history) {
  return history.some(s => s.avgAiScores && Object.keys(s.avgAiScores).length > 0);
}

// ===== SESSION LOG TAB =====

function renderLog(history) {
  if (!history.length) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">No sessions yet. Complete a workout to see it here.</div>
        <button class="btn btn-primary mt-16" data-action="start-workout">Start First Workout</button>
      </div>
    `;
  }

  return `
    <div class="history-list">
      ${[...history].reverse().map((session, i) => {
        const origIndex = history.length - 1 - i;
        const hasScores = session.avgAiScores && Object.keys(session.avgAiScores).length > 0;
        const avgScore = hasScores
          ? (Object.values(session.avgAiScores).reduce((a, b) => a + b, 0) / Object.values(session.avgAiScores).length).toFixed(1)
          : null;
        return `
          <div class="card card-sm card-interactive history-item" data-action="view-session" data-index="${origIndex}">
            <div class="history-icon" style="background: ${session.color || 'var(--accent)'}20;">
              ${session.icon || '🎯'}
            </div>
            <div class="history-info">
              <div class="history-name">${session.workoutName}</div>
              <div class="history-meta">
                ${formatDate(session.completedAt)} · ${Math.round(session.totalDuration / 60)} min · ${session.setsCompleted}/${session.totalSets} sets
                ${session.totalFillerCount !== null ? ` · ${session.totalFillerCount} fillers` : ''}
              </div>
            </div>
            <div class="history-right">
              ${avgScore ? `<div class="history-score">${avgScore}</div>` : `<div class="history-xp">+${session.xpEarned} XP</div>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderSessionDetail(container, session) {
  if (!session) return;
  const avgRating = getAvgRating(session);
  const hasScores = session.avgAiScores && Object.keys(session.avgAiScores).length > 0;

  container.innerHTML = `
    <div class="screen">
      <button class="back-btn" data-action="back">← Performance</button>

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
        ${session.totalFillerCount !== null ? `
          <div class="stat-card">
            <div class="stat-value">${session.totalFillerCount}</div>
            <div class="stat-label">fillers</div>
          </div>
        ` : `
          <div class="stat-card">
            <div class="stat-value">${session.exercises.length}</div>
            <div class="stat-label">exercises</div>
          </div>
        `}
        <div class="stat-card">
          <div class="stat-value">${avgRating ? avgRating.toFixed(1) : '—'}</div>
          <div class="stat-label">avg rating</div>
        </div>
      </div>

      ${hasScores ? `
        <div class="card mb-16">
          <div class="label mb-12">AI Scores</div>
          ${Object.entries(session.avgAiScores).map(([k, v]) => {
            const cat = SCORE_CATEGORIES.find(c => c.key === k);
            const label = cat?.label || k;
            const color = cat?.color || 'var(--accent)';
            const pct = Math.round((v / 10) * 100);
            return `
              <div class="ai-score">
                <div class="ai-score-label">${label}</div>
                <div class="ai-score-bar">
                  <div class="ai-score-fill" style="width: ${pct}%; background: ${color};"></div>
                </div>
                <div class="ai-score-value">${v}/10</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

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

  container.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'back') {
      renderPerformance(container);
    }
  });
}

// ===== CHART DRAWING =====

function drawTrendChart(history) {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;

  const withScores = history.filter(s => s.avgAiScores && Object.keys(s.avgAiScores).length > 0);
  if (!withScores.length) return;

  // Last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 86400000);

  // Group sessions by day
  const dayMap = {};
  withScores.forEach(s => {
    const d = new Date(s.completedAt);
    if (d < thirtyDaysAgo) return;
    const dayKey = d.toISOString().slice(0, 10);
    if (!dayMap[dayKey]) dayMap[dayKey] = [];
    dayMap[dayKey].push(s);
  });

  // Build 30-day x-axis
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    days.push(d.toISOString().slice(0, 10));
  }

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W = rect.width || 320;
  const H = 160;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL = 28, padR = 8, padT = 8, padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Background
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, W, H);

  // Y axis gridlines (0, 5, 10)
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  [0, 5, 10].forEach(val => {
    const y = padT + chartH - (val / 10) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = `${10 * dpr / dpr}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(val, padL - 4, y + 4);
  });

  // Draw a line per category
  SCORE_CATEGORIES.forEach(cat => {
    const points = days.map((day, i) => {
      const sessions = dayMap[day];
      if (!sessions?.length) return null;
      const vals = sessions.map(s => s.avgAiScores?.[cat.key]).filter(v => v != null);
      if (!vals.length) return null;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { x: padL + (i / (days.length - 1)) * chartW, y: padT + chartH - (avg / 10) * chartH };
    });

    const validPoints = points.filter(Boolean);
    if (validPoints.length < 2) return;

    ctx.strokeStyle = cat.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    let started = false;
    points.forEach((pt) => {
      if (!pt) { started = false; return; }
      if (!started) { ctx.moveTo(pt.x, pt.y); started = true; }
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // X axis labels (week markers)
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = `9px Inter, sans-serif`;
  ctx.textAlign = 'center';
  [0, 7, 14, 21, 29].forEach(i => {
    const d = new Date(now - (29 - i) * 86400000);
    const label = (d.getMonth() + 1) + '/' + d.getDate();
    const x = padL + (i / 29) * chartW;
    ctx.fillText(label, x, H - 4);
  });
}

function drawStreakCalendar(history) {
  const canvas = document.getElementById('streak-calendar');
  if (!canvas) return;

  // Build set of dates with sessions
  const sessionDates = new Set();
  history.forEach(s => {
    const d = new Date(s.completedAt);
    sessionDates.add(d.toISOString().slice(0, 10));
  });

  // 10 weeks × 7 days = 70 days
  const weeks = 10;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const cellSize = 14;
  const gap = 3;
  const padL = 24;
  const padT = 4;
  const W = padL + weeks * (cellSize + gap);
  const H = padT + 7 * (cellSize + gap) + 16;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Day labels (M T W T F S S)
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = `9px Inter, sans-serif`;
  ctx.textAlign = 'right';
  dayLabels.forEach((label, i) => {
    ctx.fillText(label, padL - 4, padT + i * (cellSize + gap) + cellSize - 2);
  });

  // Determine starting Sunday
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since last Monday
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - mondayOffset - (weeks - 1) * 7);
  startDate.setHours(0, 0, 0, 0);

  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + week * 7 + day);
      const dateStr = d.toISOString().slice(0, 10);

      const x = padL + week * (cellSize + gap);
      const y = padT + day * (cellSize + gap);

      const isToday = dateStr === today;
      const hasSession = sessionDates.has(dateStr);
      const isFuture = d > now;

      if (isFuture) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
      } else if (hasSession) {
        ctx.fillStyle = '#FF6B35';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
      }

      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, 3);
      ctx.fill();

      if (isToday) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 3);
        ctx.stroke();
      }
    }
  }
}

// ===== HELPERS =====

function getRecentAvgScores(history, days) {
  const cutoff = new Date(Date.now() - days * 86400000);
  const recent = history.filter(s => new Date(s.completedAt) >= cutoff && s.avgAiScores);

  if (!recent.length) return {};

  const totals = {};
  const counts = {};
  recent.forEach(s => {
    Object.entries(s.avgAiScores).forEach(([k, v]) => {
      totals[k] = (totals[k] || 0) + v;
      counts[k] = (counts[k] || 0) + 1;
    });
  });

  const result = {};
  Object.keys(totals).forEach(k => { result[k] = Math.round((totals[k] / counts[k]) * 10) / 10; });
  return result;
}

function getAvgRating(session) {
  const allRatings = session.exercises.flatMap(e => e.ratings);
  if (!allRatings.length) return null;
  return allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

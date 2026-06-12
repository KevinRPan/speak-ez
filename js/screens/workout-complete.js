/**
 * Workout Complete Screen — post-workout summary and celebration
 */

import { addSession, getUser, update, loadAll, saveAll, getHistory } from '../utils/storage.js';
import { calculateSessionXp, checkStreak, getLevelInfo } from '../utils/xp.js';
import { navigateTo } from '../lib/router.js';
import { generateSessionReaction } from '../utils/session-feedback.js';
import { getTrackProject, buildProjectWorkout } from '../data/tracks.js';
import { recordRep, updateRep, getProjectProgress, getMonitorAreas } from '../utils/track-progress.js';

export function renderWorkoutComplete(container, data = {}) {
  const session = data.session;
  if (!session) {
    navigateTo('workouts');
    return;
  }

  // Calculate XP
  const user = getUser();
  const historyBeforeSession = getHistory();
  const streakInfo = checkStreak(user.lastPracticeDate, user.streak);
  session.streakDay = streakInfo.streak;
  const xpEarned = calculateSessionXp(session);
  session.xpEarned = xpEarned;

  // Generate WHOOP-style reaction before saving (so history doesn't include this session yet)
  const reaction = generateSessionReaction(session, historyBeforeSession);

  // Update user stats
  const store = loadAll();
  store.user.xp += xpEarned;
  store.user.streak = streakInfo.isNewDay ? streakInfo.streak : user.streak;
  store.user.lastPracticeDate = new Date().toISOString();
  saveAll(store);

  // Save session to history
  addSession(session);

  // Track project rep: log it and prep the self-evaluation card
  let trackInfo = null;
  if (session.track) {
    const found = getTrackProject(session.track.trackId, session.track.projectId);
    if (found) {
      const avgSelfRating = getAvgRating(session);
      const rep = recordRep(found.track.id, found.project.id, {
        sessionId: session.id,
        rating: avgSelfRating ? Math.round(avgSelfRating * 10) / 10 : null,
        aiScores: session.avgAiScores,
        fillerCount: session.totalFillerCount,
      });
      const progress = getProjectProgress(found.project.id);
      trackInfo = {
        ...found,
        rep,
        repsDone: progress.reps.length,
        // Monitor areas should reflect reps before this one — its checklist is still empty
        prevProgress: { reps: progress.reps.slice(0, -1) },
      };
    }
  }

  const levelBefore = getLevelInfo(user.xp);
  const levelAfter = getLevelInfo(store.user.xp);
  const leveledUp = levelAfter.level > levelBefore.level;

  const avgRating = getAvgRating(session);
  const totalDuration = Math.round(session.totalDuration / 60);

  const reactionColors = {
    tough: { bg: 'rgba(124, 92, 252, 0.12)', border: 'var(--purple)', text: 'var(--purple)' },
    great: { bg: 'rgba(88, 204, 2, 0.12)', border: 'var(--success)', text: 'var(--success)' },
    milestone: { bg: 'rgba(253, 203, 110, 0.12)', border: 'var(--warning)', text: 'var(--warning)' },
    solid: { bg: 'rgba(255, 107, 53, 0.10)', border: 'var(--accent)', text: 'var(--accent)' },
  };
  const rc = reactionColors[reaction.tone] || reactionColors.solid;

  container.innerHTML = `
    <div class="screen">
      <div class="complete-screen">

        <!-- WHOOP-style reaction card -->
        <div class="reaction-card" style="background: ${rc.bg}; border-color: ${rc.border};">
          <div class="reaction-tone" style="color: ${rc.text};">${reaction.tone.toUpperCase()}</div>
          <div class="reaction-headline">${reaction.headline}</div>
          ${reaction.callout ? `<div class="reaction-callout">${reaction.callout}</div>` : ''}
        </div>

        ${trackInfo ? renderTrackEval(trackInfo) : ''}

        ${session.avgAiScores ? `
          <div class="card mb-16">
            <div class="label mb-12">Session Scores</div>
            ${Object.entries(session.avgAiScores).map(([k, v]) => {
              const labels = { clarity: 'Clarity', structure: 'Structure', confidence: 'Confidence', conciseness: 'Conciseness', filler_rate: 'Filler Rate', pace: 'Pace' };
              const label = labels[k] || k;
              const pct = Math.round((v / 10) * 100);
              const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
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

        ${session.totalFillerCount !== null ? `
          <div class="card card-sm mb-16">
            <div class="flex items-center justify-between">
              <span class="label">Filler words this session</span>
              <span style="font-weight: 700; color: ${session.totalFillerCount <= 5 ? 'var(--success)' : session.totalFillerCount <= 15 ? 'var(--warning)' : 'var(--danger)'};">${session.totalFillerCount}</span>
            </div>
          </div>
        ` : ''}

        <div class="complete-icon">${leveledUp ? '🎉' : '💪'}</div>
        <div class="complete-title">Workout Complete!</div>
        <div class="complete-subtitle">${session.workoutName}</div>

        ${leveledUp ? `
          <div class="card mb-16" style="background: var(--accent-dim); border: 1px solid var(--accent);">
            <div class="text-center">
              <div class="h2" style="color: var(--accent);">Level Up!</div>
              <div class="subtitle">You reached <strong>Level ${levelAfter.level}</strong> — ${levelAfter.title}</div>
            </div>
          </div>
        ` : ''}

        <div class="xp-earned mb-24">
          <div class="xp-earned-value">+${xpEarned} XP</div>
          <div class="xp-earned-label">earned this session</div>
        </div>

        <div class="complete-stats mb-24">
          <div class="stat-card">
            <div class="stat-value">${totalDuration}</div>
            <div class="stat-label">minutes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${session.setsCompleted}/${session.totalSets}</div>
            <div class="stat-label">sets completed</div>
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

        <!-- Exercise breakdown -->
        <div class="card mb-24">
          <div class="label mb-12">Exercise Breakdown</div>
          ${session.exercises.map(ex => `
            <div class="exercise-row">
              <div class="exercise-row-info">
                <div class="exercise-row-name">${ex.exerciseName}</div>
                <div class="exercise-row-detail">
                  ${ex.setsCompleted}/${ex.setsTotal} sets
                  ${ex.ratings.length ? ` · Avg: ${(ex.ratings.reduce((a, b) => a + b, 0) / ex.ratings.length).toFixed(1)}/5` : ''}
                </div>
              </div>
              <span>${ex.setsCompleted >= ex.setsTotal ? '✅' : '⏭'}</span>
            </div>
          `).join('')}
        </div>

        <!-- Level progress -->
        <div class="card card-sm mb-24">
          <div class="level-bar">
            <span class="level-badge">LVL ${levelAfter.level}</span>
            <div class="level-progress">
              <div class="level-progress-fill" style="width: ${Math.round(levelAfter.progress * 100)}%"></div>
            </div>
          </div>
          <div class="level-xp-text">
            ${levelAfter.title} — ${store.user.xp} XP${levelAfter.next ? ` / ${levelAfter.next.xp} XP` : ''}
          </div>
        </div>

        ${reaction.suggestion ? `
          <div class="card card-sm mb-16" style="border-left: 3px solid var(--purple);">
            <div class="label mb-4" style="color: var(--purple);">Next Focus</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${reaction.suggestion}</div>
          </div>
        ` : ''}

        <button class="btn btn-primary btn-lg btn-block mb-16" id="complete-done-btn">
          ${trackInfo ? 'Back to Project' : 'Done'}
        </button>
        <button class="btn btn-secondary btn-block" id="complete-repeat-btn">
          ${trackInfo
            ? (trackInfo.repsDone < trackInfo.project.repsRequired ? `Next Rep (${trackInfo.repsDone + 1} of ${trackInfo.project.repsRequired})` : 'Practice Again')
            : 'Repeat Workout'}
        </button>
      </div>
    </div>
  `;

  showConfetti();

  if (trackInfo) {
    bindTrackEval(container, trackInfo);
  }

  document.getElementById('complete-done-btn').addEventListener('click', () => {
    if (trackInfo) {
      navigateTo('track-project', { trackId: trackInfo.track.id, projectId: trackInfo.project.id });
    } else {
      navigateTo('home');
    }
  });

  document.getElementById('complete-repeat-btn').addEventListener('click', () => {
    if (trackInfo) {
      navigateTo('active-workout', {
        workout: buildProjectWorkout(trackInfo.track, trackInfo.project),
        trackContext: {
          trackId: trackInfo.track.id,
          projectId: trackInfo.project.id,
          prompts: trackInfo.project.prompts || null,
        },
      });
    } else {
      navigateTo('active-workout', { workoutId: session.workoutId });
    }
  });
}

/**
 * Toastmasters-style self-evaluation card for a track project rep.
 * Checkbox/notes changes are saved onto the logged rep immediately.
 */
function renderTrackEval({ track, project, repsDone, prevProgress }) {
  const projectDone = repsDone >= project.repsRequired;
  const monitor = getMonitorAreas(project, prevProgress);

  return `
    <div class="card mb-16 track-eval-card" style="border-left: 3px solid ${track.color}; text-align: left;">
      <div class="track-eval-header">
        <span class="track-eval-icon">${project.icon}</span>
        <div>
          <div class="track-eval-title">${project.name}</div>
          <div class="track-eval-sub">
            ${projectDone ? `Project complete — ${repsDone} reps logged 🎉` : `Rep ${repsDone} of ${project.repsRequired} logged`}
          </div>
        </div>
      </div>

      <div class="label mb-8 mt-16">Self-evaluation — what did you nail?</div>
      <div class="track-eval-checklist">
        ${project.checklist.map((item, idx) => `
          <label class="track-eval-item">
            <input type="checkbox" data-check-index="${idx}">
            <span>${item}</span>
          </label>
        `).join('')}
      </div>

      ${monitor.weakSpots.length || monitor.watchFor.length ? `
        <div class="label mb-8 mt-16" style="color: var(--warning);">Areas to monitor</div>
        <ul class="monitor-list">
          ${[...monitor.weakSpots, ...monitor.watchFor].map(item => `<li>${item}</li>`).join('')}
        </ul>
      ` : ''}

      <div class="label mb-8 mt-16">Notes for next rep</div>
      <textarea class="track-eval-notes" id="track-eval-notes" rows="2"
        placeholder="e.g. slow down the opening, hold the last pause longer"></textarea>
    </div>
  `;
}

function bindTrackEval(container, trackInfo) {
  const { project, rep } = trackInfo;
  if (!rep) return;

  container.querySelectorAll('[data-check-index]').forEach(box => {
    box.addEventListener('change', () => {
      const checked = [...container.querySelectorAll('[data-check-index]:checked')]
        .map(el => parseInt(el.dataset.checkIndex));
      updateRep(project.id, rep.id, { checked });
    });
  });

  const notesEl = container.querySelector('#track-eval-notes');
  if (notesEl) {
    notesEl.addEventListener('change', () => {
      updateRep(project.id, rep.id, { notes: notesEl.value.trim() });
    });
  }
}

function getAvgRating(session) {
  const allRatings = session.exercises.flatMap(e => e.ratings);
  if (!allRatings.length) return null;
  return allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
}

function showConfetti() {
  const confettiEl = document.createElement('div');
  confettiEl.className = 'confetti';

  const colors = ['#FF6B35', '#58CC02', '#7C5CFC', '#00B4D8', '#FDCB6E', '#FF7675'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 1}s`;
    piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    confettiEl.appendChild(piece);
  }

  document.body.appendChild(confettiEl);
  setTimeout(() => confettiEl.remove(), 3500);
}

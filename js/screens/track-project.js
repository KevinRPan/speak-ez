/**
 * Track Project Screen — a single project's reps checklist
 * Shows the objective, rep log, evaluation checklist hit-rates,
 * and areas to monitor. Launches reps through the workout engine.
 */

import { getTrackProject, buildProjectWorkout } from '../data/tracks.js';
import { getProjectProgress, getChecklistStats, getMonitorAreas } from '../utils/track-progress.js';
import { navigateTo } from '../lib/router.js';

export function renderTrackProject(container, data = {}) {
  const found = getTrackProject(data.trackId, data.projectId);
  if (!found) {
    navigateTo('tracks');
    return;
  }

  const { track, level, levelIndex, project } = found;
  const progress = getProjectProgress(project.id);
  const repsDone = progress.reps.length;
  const done = repsDone >= project.repsRequired;
  const checklistStats = getChecklistStats(project, progress);
  const monitor = getMonitorAreas(project, progress);

  container.innerHTML = `
    <div class="screen">
      <button class="back-btn" id="back-to-track">← ${track.name}</button>

      <div class="track-hero">
        <div class="track-hero-icon" style="background: ${track.color}20;">${project.icon}</div>
        <div class="h1 mb-4">${project.name}</div>
        <div class="subtitle mb-8">Level ${levelIndex + 1} — ${level.name}</div>
        <div class="project-meta-row">
          <span class="badge badge-accent">${project.repsRequired} reps × ${project.durationLabel}</span>
          ${done ? `<span class="badge" style="background: ${track.color}25; color: ${track.color};">✓ Complete</span>` : ''}
        </div>
      </div>

      <div class="card mb-16">
        <div class="label mb-8">Objective</div>
        <div class="project-objective">${project.objective}</div>
      </div>

      <!-- Rep checklist -->
      <div class="card mb-16">
        <div class="label mb-12">Reps · ${repsDone}/${project.repsRequired}</div>
        ${Array.from({ length: Math.max(project.repsRequired, repsDone) }, (_, i) => {
          const rep = progress.reps[i];
          if (!rep) {
            return `
              <div class="rep-row">
                <span class="rep-check">○</span>
                <div class="rep-row-info">
                  <div class="rep-row-name text-secondary">Rep ${i + 1}</div>
                </div>
              </div>
            `;
          }
          const avgScore = rep.aiScores && Object.keys(rep.aiScores).length
            ? (Object.values(rep.aiScores).reduce((a, b) => a + b, 0) / Object.values(rep.aiScores).length).toFixed(1)
            : null;
          const checkedCount = rep.checked.length;
          return `
            <div class="rep-row">
              <span class="rep-check" style="color: ${track.color};">✓</span>
              <div class="rep-row-info">
                <div class="rep-row-name">Rep ${i + 1}</div>
                <div class="rep-row-meta">
                  ${formatDate(rep.date)}
                  · ${checkedCount}/${project.checklist.length} checklist
                  ${rep.rating ? ` · ${rep.rating}/5 self` : ''}
                  ${avgScore ? ` · ${avgScore} AI` : ''}
                  ${rep.fillerCount !== null && rep.fillerCount !== undefined ? ` · ${rep.fillerCount} fillers` : ''}
                </div>
                ${rep.notes ? `<div class="rep-row-notes">"${rep.notes}"</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Evaluation checklist -->
      <div class="card mb-16">
        <div class="label mb-4">Evaluation Checklist</div>
        <div class="checklist-hint mb-12">
          You'll self-evaluate against these after each rep. Bars show how often you've nailed each one.
        </div>
        ${checklistStats.map(stat => `
          <div class="checklist-stat">
            <div class="checklist-stat-item">${stat.item}</div>
            <div class="checklist-stat-bar">
              <div class="checklist-stat-fill" style="width: ${Math.round(stat.rate * 100)}%; background: ${track.color};"></div>
            </div>
            <div class="checklist-stat-count">${stat.total ? `${stat.hits}/${stat.total}` : '—'}</div>
          </div>
        `).join('')}
      </div>

      <!-- Areas to monitor -->
      <div class="card mb-24" style="border-left: 3px solid var(--warning);">
        <div class="label mb-12" style="color: var(--warning);">Areas to Monitor</div>
        ${monitor.weakSpots.length ? `
          <div class="monitor-group-label">From your reps — you're missing these most:</div>
          <ul class="monitor-list">
            ${monitor.weakSpots.map(item => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
        <div class="monitor-group-label">${monitor.weakSpots.length ? 'Also watch for:' : 'Watch for:'}</div>
        <ul class="monitor-list">
          ${monitor.watchFor.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <button class="btn btn-primary btn-lg btn-block" id="start-rep-btn">
        ${done ? 'Practice Again' : `Start Rep ${repsDone + 1} of ${project.repsRequired}`}
      </button>
    </div>
  `;

  document.getElementById('back-to-track').addEventListener('click', () => {
    navigateTo('track-detail', { trackId: track.id });
  });

  document.getElementById('start-rep-btn').addEventListener('click', () => {
    navigateTo('active-workout', {
      workout: buildProjectWorkout(track, project),
      trackContext: {
        trackId: track.id,
        projectId: project.id,
        prompts: project.prompts || null,
      },
    });
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

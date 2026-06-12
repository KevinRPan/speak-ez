/**
 * Track Detail Screen — levels and projects within a learning track
 * Levels unlock sequentially; each project shows rep progress dots.
 */

import { getTrack, getTrackProjectCount } from '../data/tracks.js';
import { getTrackProgressMap, getTrackSummary, isProjectComplete, isLevelUnlocked } from '../utils/track-progress.js';
import { navigateTo } from '../lib/router.js';

export function renderTrackDetail(container, data = {}) {
  const track = getTrack(data.trackId);
  if (!track) {
    navigateTo('tracks');
    return;
  }

  const progressMap = getTrackProgressMap();
  const summary = getTrackSummary(track, progressMap);
  const total = getTrackProjectCount(track);

  container.innerHTML = `
    <div class="screen">
      <button class="back-btn" id="back-to-tracks">← Tracks</button>

      <div class="track-hero">
        <div class="track-hero-icon" style="background: ${track.color}20;">${track.icon}</div>
        <div class="h1 mb-4">${track.name}</div>
        <div class="subtitle mb-16">${track.tagline}</div>
        <div class="focus-progress-bar" style="max-width: 280px; margin: 0 auto;">
          <div class="focus-progress-fill" style="width: ${Math.round(summary.pct * 100)}%; background: ${track.color};"></div>
        </div>
        <div class="track-card-progress-label mt-8">${summary.completed}/${total} projects complete</div>
      </div>

      ${track.levels.map((level, levelIndex) => {
        const unlocked = isLevelUnlocked(track, levelIndex, progressMap);
        const levelDone = level.projects.every(p => isProjectComplete(p, progressMap));

        return `
          <div class="section">
            <div class="level-header ${unlocked ? '' : 'locked'}">
              <span class="level-header-badge" style="${levelDone ? `background: ${track.color}30; color: ${track.color};` : ''}">
                ${levelDone ? '✓' : unlocked ? levelIndex + 1 : '🔒'}
              </span>
              <span class="level-header-name">Level ${levelIndex + 1} — ${level.name}</span>
            </div>

            <div class="project-list">
              ${level.projects.map(project => {
                const entry = progressMap[project.id] || { reps: [] };
                const done = isProjectComplete(project, progressMap);
                const repDots = Array.from({ length: project.repsRequired }, (_, i) =>
                  `<span class="rep-dot ${i < entry.reps.length ? 'filled' : ''}" style="${i < entry.reps.length ? `background: ${track.color};` : ''}"></span>`
                ).join('');

                return `
                  <div class="card card-sm project-row ${unlocked ? 'card-interactive' : 'project-row-locked'}"
                    ${unlocked ? `data-project="${project.id}"` : ''}>
                    <div class="project-row-icon">${project.icon}</div>
                    <div class="project-row-info">
                      <div class="project-row-name">${project.name}</div>
                      <div class="project-row-meta">
                        ${project.repsRequired} reps × ${project.durationLabel}
                      </div>
                    </div>
                    <div class="project-row-right">
                      ${done
                        ? `<span class="project-done-badge" style="color: ${track.color};">✓ Done</span>`
                        : `<div class="rep-dots">${repDots}</div>`
                      }
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('back-to-tracks').addEventListener('click', () => {
    navigateTo('tracks');
  });

  container.querySelectorAll('.project-row[data-project]').forEach(row => {
    row.addEventListener('click', () => {
      navigateTo('track-project', { trackId: track.id, projectId: row.dataset.project });
    });
  });
}

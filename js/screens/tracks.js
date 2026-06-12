/**
 * Tracks Screen — browse Toastmasters-style learning tracks
 */

import { TRACKS, getTrackProjectCount } from '../data/tracks.js';
import { getTrackProgressMap, getTrackSummary, getContinueTarget } from '../utils/track-progress.js';
import { navigateTo } from '../lib/router.js';

export function renderTracks(container) {
  const progressMap = getTrackProgressMap();
  const continueTarget = getContinueTarget(progressMap);

  container.innerHTML = `
    <div class="screen">
      <div class="h1 mb-8">Learning Tracks</div>
      <div class="subtitle mb-24">Structured programs with projects, reps, and evaluations — Toastmasters style.</div>

      ${continueTarget ? `
        <div class="section">
          <div class="section-header">
            <span class="label">Continue</span>
          </div>
          <div class="card card-interactive track-continue-card" data-continue
            style="border-left: 3px solid ${continueTarget.track.color};">
            <div class="track-continue-icon">${continueTarget.project.icon}</div>
            <div class="track-continue-info">
              <div class="track-continue-name">${continueTarget.project.name}</div>
              <div class="track-continue-meta">${continueTarget.track.name} · Level ${continueTarget.levelIndex + 1}</div>
            </div>
            <div class="workout-card-arrow">›</div>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-header">
          <span class="label">All tracks</span>
        </div>
        <div class="track-list">
          ${TRACKS.map(track => {
            const summary = getTrackSummary(track, progressMap);
            const total = getTrackProjectCount(track);
            return `
              <div class="card card-interactive track-card" data-track="${track.id}">
                <div class="track-card-top">
                  <div class="track-card-icon" style="background: ${track.color}20;">${track.icon}</div>
                  <div class="track-card-info">
                    <div class="track-card-name">${track.name}</div>
                    <div class="track-card-tagline">${track.tagline}</div>
                  </div>
                </div>
                <div class="track-card-progress">
                  <div class="focus-progress-bar">
                    <div class="focus-progress-fill" style="width: ${Math.round(summary.pct * 100)}%; background: ${track.color};"></div>
                  </div>
                  <div class="track-card-progress-label">
                    ${summary.completed}/${total} projects · ${track.levels.length} levels
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  const continueEl = container.querySelector('[data-continue]');
  if (continueEl) {
    continueEl.addEventListener('click', () => {
      navigateTo('track-project', {
        trackId: continueTarget.track.id,
        projectId: continueTarget.project.id,
      });
    });
  }

  container.querySelectorAll('.track-card[data-track]').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo('track-detail', { trackId: card.dataset.track });
    });
  });
}

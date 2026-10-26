/**
 * Scenario Detail Screen — briefing before recording
 * Shows full scenario context, tips, and Start Recording CTA
 */

import { getScenario } from '../data/scenarios.js';
import { navigateTo } from '../lib/router.js';
import { flowBar } from '../ui/chrome.js';

export function renderScenarioDetail(container, data = {}) {
  const scenario = getScenario(data.scenarioId);
  if (!scenario) {
    navigateTo('scenarios');
    return;
  }

  container.innerHTML = `
    <div class="screen">
      ${flowBar({
        backAction: 'back',
        backLabel: 'Scenarios',
        steps: [{ label: scenario.name, current: true }],
      })}

      <div class="scenario-briefing">
        <div class="scenario-briefing-badge">
          <span class="difficulty difficulty-${scenario.difficulty}">${scenario.difficulty}</span>
          <span class="scenario-briefing-time">⏱ ${formatDuration(scenario.duration)}</span>
        </div>

        <h1 class="scenario-briefing-title">${scenario.name}</h1>
        <p class="scenario-briefing-desc">${scenario.description}</p>

        <div class="scenario-context-card">
          <div class="scenario-context-label">📋 The Scenario</div>
          <div class="scenario-context-text">${scenario.context}</div>
        </div>

        ${scenario.tips ? `
          <div class="scenario-tips-card">
            <div class="scenario-tips-label">💡 Tips</div>
            <div class="scenario-tips-text">${scenario.tips}</div>
          </div>
        ` : ''}

        <div class="scenario-flow-preview">
          <div class="scenario-flow-title">How it works</div>
          <div class="scenario-flow-steps">
            <div class="scenario-flow-step">
              <div class="scenario-flow-step-num">1</div>
              <div class="scenario-flow-step-text">Record your opening response</div>
            </div>
            <div class="scenario-flow-step">
              <div class="scenario-flow-step-num">2</div>
              <div class="scenario-flow-step-text">Review your recording</div>
            </div>
            <div class="scenario-flow-step">
              <div class="scenario-flow-step-num">3</div>
              <div class="scenario-flow-step-text">AI asks follow-up questions</div>
            </div>
            <div class="scenario-flow-step">
              <div class="scenario-flow-step-num">4</div>
              <div class="scenario-flow-step-text">Get personalized feedback</div>
            </div>
          </div>
        </div>
      </div>

      <div class="scenario-detail-cta">
        <button class="btn btn-primary btn-block btn-lg" data-action="start-practice">
          🎬 Start Scenario Practice
        </button>
      </div>
    </div>
  `;

  container.querySelector('[data-action="back"]').addEventListener('click', () => {
    navigateTo('scenarios');
  });

  container.querySelector('[data-action="start-practice"]').addEventListener('click', () => {
    navigateTo('scenario-practice', { scenarioId: scenario.id });
  });
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min} min`;
}

/**
 * Scenarios List Screen — PatterAI-inspired scenario browser
 * Shows categories with timeline-style scenario cards
 */

import { scenarios, SCENARIO_CATEGORY_INFO, SCENARIO_CATEGORIES, getScenariosByCategory, getCategories } from '../data/scenarios.js';
import { navigateTo } from '../lib/router.js';

let activeCategory = SCENARIO_CATEGORIES.PROFESSIONAL;

export function renderScenarios(container) {
  const categories = getCategories();
  const categoryScenarios = getScenariosByCategory(activeCategory);
  const catInfo = SCENARIO_CATEGORY_INFO[activeCategory];

  container.innerHTML = `
    <div class="screen">
      <div class="scenarios-header">
        <div class="scenarios-title">Scenario Practice</div>
        <div class="scenarios-subtitle">Practice real-world conversations with AI follow-up</div>
      </div>

      <div class="category-pills-scroll">
        <div class="category-pills">
          ${categories.map(cat => `
            <button class="category-pill ${cat.id === activeCategory ? 'active' : ''}" data-category="${cat.id}">
              <span class="category-pill-icon">${cat.icon}</span>
              <span class="category-pill-label">${cat.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="scenario-category-header">
        <div class="scenario-category-title">${catInfo.icon} ${catInfo.label}</div>
        <div class="scenario-category-desc">${catInfo.description}</div>
      </div>

      <div class="scenario-timeline">
        ${categoryScenarios.map((scenario, index) => {
          const isFirst = index === 0;
          const isLast = index === categoryScenarios.length - 1;

          return `
            <div class="scenario-timeline-item ${scenario.unlocked ? 'unlocked' : 'locked'}" data-scenario="${scenario.id}">
              <div class="timeline-rail">
                <div class="timeline-dot ${scenario.unlocked ? 'active' : ''}">
                  ${scenario.unlocked ? '▶' : '🔒'}
                </div>
                ${!isLast ? '<div class="timeline-line"></div>' : ''}
              </div>
              <div class="scenario-card ${isFirst && scenario.unlocked ? 'scenario-card-highlighted' : ''}">
                <div class="scenario-card-content">
                  ${isFirst && scenario.unlocked ? '<div class="scenario-card-status">Ready to Practice</div>' : ''}
                  <div class="scenario-card-name">${scenario.name}</div>
                  <div class="scenario-card-desc">${scenario.description}</div>
                  <div class="scenario-card-meta">
                    <span class="scenario-card-time">⏱ ${formatDuration(scenario.duration)}</span>
                    <span class="scenario-card-difficulty difficulty difficulty-${scenario.difficulty}">${scenario.difficulty}</span>
                  </div>
                </div>
                ${scenario.unlocked ? `
                  <div class="scenario-card-play">
                    <div class="scenario-play-btn">▶</div>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Category pill clicks
  container.querySelectorAll('.category-pill[data-category]').forEach(pill => {
    pill.addEventListener('click', () => {
      activeCategory = pill.dataset.category;
      renderScenarios(container);
    });
  });

  // Scenario card clicks
  container.querySelectorAll('.scenario-timeline-item.unlocked[data-scenario]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo('scenario-detail', { scenarioId: item.dataset.scenario });
    });
  });
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min} min`;
}

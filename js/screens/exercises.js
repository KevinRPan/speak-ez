/**
 * Exercise Library Screen — browse all exercises by category
 */

import { exercises, CATEGORIES, CATEGORY_INFO } from '../data/exercises.js';

export function renderExercises(container) {
  let activeCategory = null;

  function render() {
    const filtered = activeCategory
      ? exercises.filter(e => e.category === activeCategory)
      : exercises;

    container.innerHTML = `
      <div class="screen">
        <div class="h1 mb-8">Exercises</div>
        <div class="subtitle mb-20">${exercises.length} exercises across ${Object.keys(CATEGORIES).length} categories</div>

        <!-- Category Filter -->
        <div class="category-filter mb-24">
          <button class="category-chip ${!activeCategory ? 'active' : ''}" data-action="filter" data-category="">All</button>
          ${Object.entries(CATEGORY_INFO).map(([key, info]) => `
            <button class="category-chip ${activeCategory === key ? 'active' : ''}"
              data-action="filter" data-category="${key}">
              ${info.icon} ${info.label}
            </button>
          `).join('')}
        </div>

        <!-- Exercise List -->
        <div class="exercise-list">
          ${filtered.map(ex => {
            const catInfo = CATEGORY_INFO[ex.category];
            return `
              <div class="card card-interactive exercise-lib-card" data-action="view-exercise" data-id="${ex.id}">
                <div class="exercise-lib-header">
                  <div class="exercise-lib-dot" style="background: ${catInfo.color};"></div>
                  <div class="exercise-lib-name">${ex.name}</div>
                  <span class="badge badge-${getBadgeType(ex.category)}">${catInfo.label}</span>
                </div>
                <div class="exercise-lib-desc">${ex.description}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.onclick = (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      const type = action.dataset.action;

      if (type === 'filter') {
        activeCategory = action.dataset.category || null;
        render();
      } else if (type === 'view-exercise') {
        const ex = exercises.find(e => e.id === action.dataset.id);
        if (ex) renderExerciseDetail(container, ex, render);
      }
    };
  }

  render();
}

function renderExerciseDetail(container, exercise, goBack) {
  const catInfo = CATEGORY_INFO[exercise.category];

  container.innerHTML = `
    <div class="screen">
      <button class="back-btn" data-action="back">← Exercises</button>

      <div style="text-align: center; padding: 16px 0 24px;">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">${catInfo.icon}</div>
        <div class="h1 mb-4">${exercise.name}</div>
        <span class="badge badge-${getBadgeType(exercise.category)}">${catInfo.label}</span>
        <div class="subtitle mt-12">${exercise.description}</div>
      </div>

      <div class="card mb-16">
        <div class="label mb-12">How to practice</div>
        <ul class="instructions-list">
          ${exercise.instructions.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>

      ${exercise.tips ? `
        <div class="tips-callout mb-16">
          <div class="tips-callout-title">Pro Tip</div>
          <div class="tips-callout-text">${exercise.tips}</div>
        </div>
      ` : ''}

      ${exercise.prompts ? `
        <div class="card mb-16">
          <div class="label mb-12">Sample prompts</div>
          ${exercise.prompts.slice(0, 5).map(p => `
            <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.88rem; color: var(--text-secondary);">
              "${p}"
            </div>
          `).join('')}
          ${exercise.prompts.length > 5 ? `
            <div style="padding: 8px 0; font-size: 0.8rem; color: var(--text-tertiary);">
              +${exercise.prompts.length - 5} more prompts
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="card card-sm mb-16">
        <div class="flex items-center justify-between">
          <span class="label">Default duration</span>
          <span class="h3">${Math.round(exercise.defaultDuration / 60)} min</span>
        </div>
      </div>

      <div class="card card-sm">
        <div class="flex items-center justify-between">
          <span class="label">Tracks</span>
          <span style="font-size: 0.85rem; color: var(--text-secondary);">${exercise.metrics.join(', ')}</span>
        </div>
      </div>
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'back') {
      goBack();
    }
  };
}

function getBadgeType(category) {
  const map = { warmup: 'accent', vocal: 'purple', physical: 'blue', content: 'success' };
  return map[category] || 'accent';
}

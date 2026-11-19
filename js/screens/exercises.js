/**
 * Exercise Library Screen — browse all exercises by category
 */

import { exercises, CATEGORIES, CATEGORY_INFO } from '../data/exercises.js';
import { navigateTo } from '../lib/router.js';
import { flowBar, pageHeader } from '../ui/chrome.js';

export function renderExercises(container) {
  let activeCategory = null;

  function render() {
    const filtered = activeCategory
      ? exercises.filter(e => e.category === activeCategory)
      : exercises;

    container.innerHTML = `
      <div class="screen">
        ${flowBar({
          backAction: 'go-home',
          backLabel: 'Home',
          steps: [{ label: 'Exercises', current: true }],
        })}
        ${pageHeader({
          kicker: 'Practice',
          title: 'Exercise library',
          subtitle: `${exercises.length} exercises across ${Object.keys(CATEGORIES).length} categories.`,
        })}

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

      if (type === 'go-home') {
        navigateTo('home');
      } else if (type === 'filter') {
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
      ${flowBar({
        backAction: 'back',
        backLabel: 'Exercises',
        steps: [{ label: exercise.name, current: true }],
      })}

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

      ${exercise.workplaceSetup ? `
        <div class="card mb-16">
          <div class="label mb-12">Before you start</div>
          <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            You’ll set where you work, your role, and a few details people there would recognize. Each rep hands you a topic that might come up in that room. Your move is a funny story or a joke — quickly.
          </div>
        </div>
      ` : ''}

      ${exercise.structures?.length ? `
        <div class="card mb-16">
          <div class="label mb-12">Story shapes</div>
          ${exercise.landing ? `<p class="story-shapes-landing">${exercise.landing}</p>` : ''}
          ${exercise.structures.map(shape => `
            <div class="story-shape is-static ${shape.landing ? 'is-selected' : ''}">
              <span class="story-shape-name">
                ${shape.name}
                ${shape.landing ? '<span class="story-shape-tag">Start here</span>' : ''}
              </span>
              <span class="story-shape-beats">${shape.beats.join(' → ')}</span>
              <span class="story-shape-example">“${shape.example}”</span>
            </div>
          `).join('')}
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

      <div class="card card-sm mb-16">
        <div class="flex items-center justify-between">
          <span class="label">Tracks</span>
          <span style="font-size: 0.85rem; color: var(--text-secondary);">${exercise.metrics.join(', ')}</span>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-lg btn-block" data-action="practice">
        Practice this
      </button>
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'back') {
      goBack();
    } else if (action.dataset.action === 'practice') {
      navigateTo('active-workout', {
        workout: {
          id: `exercise-${exercise.id}`,
          name: exercise.name,
          icon: catInfo.icon,
          color: catInfo.color,
          exercises: [{ exerciseId: exercise.id, sets: 1, duration: exercise.defaultDuration, rest: 0 }],
        },
      });
    }
  };
}

function getBadgeType(category) {
  const map = { warmup: 'accent', vocal: 'purple', physical: 'blue', content: 'success', performance: 'pink' };
  return map[category] || 'accent';
}

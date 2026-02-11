/**
 * Workout Selection Screen
 * Browse templates, filter by time, or build custom workouts
 */

import { workoutTemplates, getWorkout, calculateWorkoutDuration } from '../data/workouts.js';
import { getExercise, CATEGORY_INFO } from '../data/exercises.js';

export function renderWorkouts(container, data = {}) {
  const filterMinutes = data.filterMinutes || null;

  const filtered = filterMinutes
    ? workoutTemplates.filter(w => w.duration <= filterMinutes)
    : workoutTemplates;

  container.innerHTML = `
    <div class="screen">
      <div class="h1 mb-8">Choose Workout</div>
      <div class="subtitle mb-24">Pick a template or set your available time.</div>

      <!-- Time Filter -->
      <div class="section">
        <div class="section-header">
          <span class="label">I have...</span>
        </div>
        <div class="time-picker">
          ${[5, 15, 20, 25, 30].map(m => `
            <button class="time-chip ${filterMinutes === m ? 'active' : ''}"
              data-action="filter-time" data-minutes="${m}">
              ${m} min
            </button>
          `).join('')}
          ${filterMinutes ? `<button class="time-chip" data-action="filter-time" data-minutes="0">All</button>` : ''}
        </div>
      </div>

      <!-- Workout Templates -->
      <div class="section">
        <div class="section-header">
          <span class="label">${filterMinutes ? `Workouts under ${filterMinutes} min` : 'All workouts'}</span>
        </div>
        <div class="flex flex-col gap-8">
          ${filtered.map(w => `
            <div class="card card-interactive card-sm workout-card" data-action="view-workout" data-workout="${w.id}">
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

        ${filtered.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">⏱</div>
            <div class="empty-text">No workouts fit that time. Try a longer window.</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  container.onclick = handleClick;
}

export function renderWorkoutDetail(container, data = {}) {
  const workout = getWorkout(data.workoutId);
  if (!workout) {
    document.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'workouts' } }));
    return;
  }

  const totalSeconds = calculateWorkoutDuration(workout.exercises);
  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets, 0);

  container.innerHTML = `
    <div class="screen">
      <button class="back-btn" data-action="back-to-workouts">← Workouts</button>

      <div style="text-align: center; padding: 16px 0 24px;">
        <div style="font-size: 3rem; margin-bottom: 8px;">${workout.icon}</div>
        <div class="h1 mb-8">${workout.name}</div>
        <div class="subtitle mb-16">${workout.description}</div>
        <div class="flex items-center justify-between" style="max-width: 200px; margin: 0 auto;">
          <div class="text-center">
            <div class="h3">${workout.duration}</div>
            <div class="label">min</div>
          </div>
          <div class="text-center">
            <div class="h3">${workout.exercises.length}</div>
            <div class="label">exercises</div>
          </div>
          <div class="text-center">
            <div class="h3">${totalSets}</div>
            <div class="label">sets</div>
          </div>
        </div>
      </div>

      <!-- Exercise List -->
      <div class="card mb-24">
        ${workout.exercises.map(ex => {
          const exercise = getExercise(ex.exerciseId);
          const catInfo = CATEGORY_INFO[exercise.category];
          return `
            <div class="exercise-row">
              <div class="exercise-row-dot" style="background: ${catInfo.color};"></div>
              <div class="exercise-row-info">
                <div class="exercise-row-name">${exercise.name}</div>
                <div class="exercise-row-detail">
                  ${ex.sets} set${ex.sets > 1 ? 's' : ''} × ${formatDuration(ex.duration)}
                  ${ex.rest ? ` · ${ex.rest}s rest` : ''}
                </div>
              </div>
              <span class="badge badge-${getBadgeType(exercise.category)}">${catInfo.label}</span>
            </div>
          `;
        }).join('')}
      </div>

      <button class="btn btn-primary btn-lg btn-block" data-action="start-this-workout" data-workout="${workout.id}">
        Start Workout
      </button>
    </div>
  `;

  container.onclick = handleDetailClick;
}

function handleClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const type = action.dataset.action;

  if (type === 'filter-time') {
    const minutes = parseInt(action.dataset.minutes);
    document.dispatchEvent(new CustomEvent('navigate', {
      detail: { screen: 'workouts', data: { filterMinutes: minutes || null } }
    }));
  } else if (type === 'view-workout') {
    document.dispatchEvent(new CustomEvent('navigate', {
      detail: { screen: 'workout-detail', data: { workoutId: action.dataset.workout } }
    }));
  }
}

function handleDetailClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const type = action.dataset.action;

  if (type === 'back-to-workouts') {
    document.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'workouts' } }));
  } else if (type === 'start-this-workout') {
    document.dispatchEvent(new CustomEvent('navigate', {
      detail: { screen: 'active-workout', data: { workoutId: action.dataset.workout } }
    }));
  }
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function getBadgeType(category) {
  const map = { warmup: 'accent', vocal: 'purple', physical: 'blue', content: 'success' };
  return map[category] || 'accent';
}

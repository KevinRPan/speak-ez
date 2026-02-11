/**
 * Workout Selection Screen
 * Browse templates, filter by time, or build custom workouts
 */

import { workoutTemplates, getWorkout, calculateWorkoutDuration } from '../data/workouts.js';
import { getExercise, CATEGORY_INFO } from '../data/exercises.js';
import { navigateTo } from '../lib/router.js';

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
              data-minutes="${m}">
              ${m} min
            </button>
          `).join('')}
          ${filterMinutes ? `<button class="time-chip" data-minutes="0">All</button>` : ''}
        </div>
      </div>

      <!-- Workout Templates -->
      <div class="section">
        <div class="section-header">
          <span class="label">${filterMinutes ? `Workouts under ${filterMinutes} min` : 'All workouts'}</span>
        </div>
        <div class="flex flex-col gap-8">
          ${filtered.map(w => `
            <div class="card card-interactive card-sm workout-card" data-workout="${w.id}">
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

  // Direct listeners
  container.querySelectorAll('.time-chip[data-minutes]').forEach(chip => {
    chip.addEventListener('click', () => {
      const minutes = parseInt(chip.dataset.minutes);
      navigateTo('workouts', { filterMinutes: minutes || null });
    });
  });

  container.querySelectorAll('.workout-card[data-workout]').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo('workout-detail', { workoutId: card.dataset.workout });
    });
  });
}

export function renderWorkoutDetail(container, data = {}) {
  const workout = getWorkout(data.workoutId);
  if (!workout) {
    navigateTo('workouts');
    return;
  }

  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets, 0);

  container.innerHTML = `
    <div class="screen">
      <button class="back-btn" id="back-to-workouts">← Workouts</button>

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

      <button class="btn btn-primary btn-lg btn-block" id="start-this-workout">
        Start Workout
      </button>
    </div>
  `;

  document.getElementById('back-to-workouts').addEventListener('click', () => {
    navigateTo('workouts');
  });

  document.getElementById('start-this-workout').addEventListener('click', () => {
    navigateTo('active-workout', { workoutId: workout.id });
  });
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

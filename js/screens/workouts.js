/**
 * Workout Selection Screen
 * Browse templates, filter by time, or build custom workouts
 */

import { workoutTemplates, getWorkout, calculateWorkoutDuration, warmupExercises } from '../data/workouts.js';
import { getExercise, CATEGORIES, CATEGORY_INFO } from '../data/exercises.js';
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
        <div class="workout-list">
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

  // Mutable copy of exercises so user can swap warmups before starting
  const customExercises = (data.customExercises || workout.exercises).map(ex => ({ ...ex }));

  const totalSets = customExercises.reduce((sum, e) => sum + e.sets, 0);

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
            <div class="h3">${customExercises.length}</div>
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
        ${customExercises.map((ex, idx) => {
          const exercise = getExercise(ex.exerciseId);
          const catInfo = CATEGORY_INFO[exercise.category];
          const isWarmup = exercise.category === CATEGORIES.WARMUP;
          return `
            <div class="exercise-row ${isWarmup ? 'exercise-row-swappable' : ''}"
              ${isWarmup ? `data-swap-index="${idx}"` : ''}>
              <div class="exercise-row-dot" style="background: ${catInfo.color};"></div>
              <div class="exercise-row-info">
                <div class="exercise-row-name">${exercise.name}</div>
                <div class="exercise-row-detail">
                  ${ex.sets} set${ex.sets > 1 ? 's' : ''} × ${formatDuration(ex.duration)}
                  ${ex.rest ? ` · ${ex.rest}s rest` : ''}
                </div>
              </div>
              ${isWarmup
                ? `<button class="warmup-swap-btn" data-swap-index="${idx}">Swap</button>`
                : `<span class="badge badge-${getBadgeType(exercise.category)}">${catInfo.label}</span>`
              }
            </div>
          `;
        }).join('')}
      </div>

      <button class="btn btn-primary btn-lg btn-block" id="start-this-workout">
        Start Workout
      </button>
    </div>

    <!-- Warmup Picker Bottom Sheet -->
    <div class="warmup-picker-overlay hidden" id="warmup-picker">
      <div class="warmup-picker-sheet">
        <div class="warmup-picker-header">
          <div class="warmup-picker-title">Choose Warmup</div>
          <button class="btn btn-ghost btn-sm" id="warmup-picker-close">Cancel</button>
        </div>
        <div class="warmup-picker-list">
          ${warmupExercises.map(w => `
            <div class="warmup-picker-option" data-warmup-id="${w.id}">
              <div class="warmup-picker-option-info">
                <div class="warmup-picker-option-name">${w.name}</div>
                <div class="warmup-picker-option-desc">${w.description}</div>
              </div>
              <div class="warmup-picker-option-duration">${formatDuration(w.defaultDuration)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // State for the picker
  let swapIndex = null;
  const picker = document.getElementById('warmup-picker');
  const pickerClose = document.getElementById('warmup-picker-close');

  function openPicker(index) {
    swapIndex = index;
    // Mark the currently selected warmup
    const currentId = customExercises[index].exerciseId;
    picker.querySelectorAll('.warmup-picker-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.warmupId === currentId);
    });
    picker.classList.remove('hidden');
  }

  function closePicker() {
    swapIndex = null;
    picker.classList.add('hidden');
  }

  // Warmup row tap → open picker
  container.querySelectorAll('[data-swap-index]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.swapIndex);
      openPicker(idx);
    });
  });

  // Pick a warmup → swap and re-render
  picker.querySelectorAll('.warmup-picker-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (swapIndex === null) return;
      const newId = opt.dataset.warmupId;
      const warmup = warmupExercises.find(w => w.id === newId);
      customExercises[swapIndex].exerciseId = newId;
      customExercises[swapIndex].duration = customExercises[swapIndex].duration || warmup.defaultDuration;
      closePicker();
      // Re-render with updated exercises
      renderWorkoutDetail(container, { workoutId: workout.id, customExercises });
    });
  });

  // Close picker
  pickerClose.addEventListener('click', closePicker);
  picker.addEventListener('click', (e) => {
    if (e.target === picker) closePicker();
  });

  document.getElementById('back-to-workouts').addEventListener('click', () => {
    navigateTo('workouts');
  });

  document.getElementById('start-this-workout').addEventListener('click', () => {
    navigateTo('active-workout', { workoutId: workout.id, customExercises });
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

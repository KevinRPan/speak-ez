/**
 * Active Workout Screen — the core workout experience
 * Manages exercise flow, timers, rest periods, self-ratings, and self-recording
 */

import { getWorkout } from '../data/workouts.js';
import { getExercise, getRandomPrompt, CATEGORY_INFO } from '../data/exercises.js';
import { navigateTo } from '../lib/router.js';

let state = null;
let timerInterval = null;
let container = null;

// Recording state
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingBlobUrl = null;
let recordingEnabled = false;

export function renderActiveWorkout(cont, data = {}) {
  container = cont;
  const workout = getWorkout(data.workoutId);
  if (!workout) {
    navigateTo('workouts');
    return;
  }

  // Build flat list of all sets
  const sets = [];
  workout.exercises.forEach((ex, exIndex) => {
    const exercise = getExercise(ex.exerciseId);
    for (let s = 0; s < ex.sets; s++) {
      sets.push({
        exerciseId: ex.exerciseId,
        exercise,
        exIndex,
        setNumber: s + 1,
        totalSets: ex.sets,
        duration: ex.duration,
        rest: ex.rest,
        prompt: getRandomPrompt(ex.exerciseId),
        rating: null,
        completed: false,
        recordingUrl: null,
      });
    }
  });

  state = {
    workout,
    sets,
    currentIndex: 0,
    phase: 'ready', // ready, active, rating, rest, done
    timeLeft: 0,
    startedAt: Date.now(),
    ratings: [],
  };

  // Reset recording state for new workout
  recordingEnabled = false;
  stopAndCleanupRecording();

  renderCurrentState();
}

function renderCurrentState() {
  if (!state || !container) return;
  clearInterval(timerInterval);

  const { phase } = state;

  if (phase === 'ready') renderReady();
  else if (phase === 'active') renderActive();
  else if (phase === 'rating') renderRating();
  else if (phase === 'rest') renderRest();
  else if (phase === 'done') finishWorkout();
}

function renderReady() {
  const set = state.sets[state.currentIndex];
  const catInfo = CATEGORY_INFO[set.exercise.category];
  const progress = state.currentIndex / state.sets.length;

  container.innerHTML = `
    <div class="screen">
      <div class="workout-header">
        <div class="flex items-center justify-between mb-8">
          <button class="btn btn-ghost btn-sm" data-action="quit-workout">✕ Quit</button>
          <span class="label">${state.currentIndex + 1} of ${state.sets.length} sets</span>
        </div>
        <div class="workout-progress-bar">
          <div class="workout-progress-fill" style="width: ${Math.round(progress * 100)}%"></div>
        </div>
      </div>

      <div class="exercise-display">
        <div class="exercise-display-icon">${catInfo.icon}</div>
        <div class="exercise-display-name">${set.exercise.name}</div>
        <div class="exercise-display-set">
          Set ${set.setNumber} of ${set.totalSets}
          <span class="badge badge-${getBadgeType(set.exercise.category)}" style="margin-left: 8px;">
            ${catInfo.label}
          </span>
        </div>
      </div>

      ${set.prompt ? `
        <div class="prompt-card">
          <div class="prompt-text">${set.prompt}</div>
          <button class="btn btn-ghost btn-sm mt-8" data-action="new-prompt">↻ Different prompt</button>
        </div>
      ` : ''}

      <div class="card mb-16">
        <ul class="instructions-list">
          ${set.exercise.instructions.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>

      ${set.exercise.tips ? `
        <div class="tips-callout">
          <div class="tips-callout-title">Pro Tip</div>
          <div class="tips-callout-text">${set.exercise.tips}</div>
        </div>
      ` : ''}

      <div class="timer-display">${formatTime(set.duration)}</div>

      <div class="recording-toggle" data-action="toggle-recording">
        <div class="recording-toggle-left">
          <span class="recording-toggle-icon">${recordingEnabled ? '🔴' : '📹'}</span>
          <div>
            <div class="recording-toggle-label">Record yourself</div>
            <div class="recording-toggle-hint">Camera &amp; audio for self-review</div>
          </div>
        </div>
        <div class="toggle ${recordingEnabled ? 'on' : ''}" data-action="toggle-recording"></div>
      </div>

      <div class="workout-controls">
        <button class="btn btn-timer-start btn-block" data-action="start-timer">
          ${recordingEnabled ? '📹 Start Set &amp; Record' : 'Start Set'}
        </button>
      </div>

      ${state.currentIndex > 0 ? `
        <div class="text-center mt-8">
          <button class="btn btn-ghost btn-sm" data-action="skip-exercise">Skip exercise →</button>
        </div>
      ` : ''}
    </div>
  `;

  container.onclick = handleReadyClick;
}

function renderActive() {
  const set = state.sets[state.currentIndex];
  const catInfo = CATEGORY_INFO[set.exercise.category];
  const progress = state.currentIndex / state.sets.length;

  container.innerHTML = `
    <div class="screen">
      <div class="workout-header">
        <div class="flex items-center justify-between mb-8">
          <button class="btn btn-ghost btn-sm" data-action="quit-workout">✕ Quit</button>
          <span class="label">${state.currentIndex + 1} of ${state.sets.length} sets</span>
        </div>
        <div class="workout-progress-bar">
          <div class="workout-progress-fill" style="width: ${Math.round(progress * 100)}%"></div>
        </div>
      </div>

      ${recordingEnabled ? `
        <div class="video-preview-container">
          <video id="video-preview" class="video-preview" autoplay muted playsinline></video>
          <div class="recording-indicator">
            <span class="recording-dot"></span>
            REC
          </div>
        </div>
      ` : `
        <div class="exercise-display">
          <div class="exercise-display-icon">${catInfo.icon}</div>
          <div class="exercise-display-name">${set.exercise.name}</div>
          <div class="exercise-display-set">Set ${set.setNumber} of ${set.totalSets}</div>
        </div>
      `}

      ${set.prompt ? `
        <div class="prompt-card">
          <div class="prompt-text">${set.prompt}</div>
        </div>
      ` : ''}

      <div class="timer-display running" id="timer">${formatTime(state.timeLeft)}</div>

      <div class="workout-controls">
        <button class="btn btn-timer-stop btn-block" data-action="stop-timer">
          Done
        </button>
      </div>
    </div>
  `;

  container.onclick = handleActiveClick;

  // Attach video stream to preview element if recording
  if (recordingEnabled && mediaStream) {
    const videoEl = document.getElementById('video-preview');
    if (videoEl) {
      videoEl.srcObject = mediaStream;
    }
  }

  startTimer();
}

function renderRating() {
  const set = state.sets[state.currentIndex];
  const hasRecording = !!set.recordingUrl;

  container.innerHTML = `
    <div class="screen">
      <div class="rating-section">
        <div class="exercise-display-name mb-16">${set.exercise.name}</div>

        ${hasRecording ? `
          <div class="playback-section">
            <div class="playback-header">
              <span class="recording-toggle-icon">📹</span>
              <span>Review your recording</span>
            </div>
            <video id="playback-video" class="playback-video" controls playsinline src="${set.recordingUrl}"></video>
          </div>
        ` : ''}

        <div class="rating-question">How did that set feel?</div>
        <div class="rating-stars">
          ${[1, 2, 3, 4, 5].map(n => `
            <button class="rating-star" data-action="rate" data-rating="${n}">${n}</button>
          `).join('')}
        </div>
        <div class="rating-labels">
          <span>Rough</span>
          <span>Nailed it</span>
        </div>
        <div class="mt-24">
          <button class="btn btn-ghost btn-sm" data-action="skip-rating">Skip rating</button>
        </div>
      </div>
    </div>
  `;

  container.onclick = handleRatingClick;
}

function renderRest() {
  const set = state.sets[state.currentIndex];
  const nextSet = state.sets[state.currentIndex + 1];
  const nextExercise = nextSet ? nextSet.exercise : null;

  container.innerHTML = `
    <div class="screen">
      <div class="rest-screen">
        <div class="rest-label">Rest</div>
        <div class="timer-display resting" id="timer">${formatTime(state.timeLeft)}</div>
        ${nextExercise ? `
          <div class="rest-next">
            Up next: <strong>${nextExercise.name}</strong>
            ${nextSet.setNumber > 1 ? ` — Set ${nextSet.setNumber}` : ''}
          </div>
        ` : ''}
        <div class="mt-24">
          <button class="btn btn-rest-skip" data-action="skip-rest">Skip rest →</button>
        </div>
      </div>
    </div>
  `;

  container.onclick = handleRestClick;
  startRestTimer();
}

function finishWorkout() {
  clearInterval(timerInterval);
  stopAndCleanupRecording();
  const totalDuration = Math.round((Date.now() - state.startedAt) / 1000);

  // Build session data
  const exerciseMap = {};
  state.sets.forEach(set => {
    if (!exerciseMap[set.exerciseId]) {
      exerciseMap[set.exerciseId] = {
        exerciseId: set.exerciseId,
        exerciseName: set.exercise.name,
        setsCompleted: 0,
        setsTotal: set.totalSets,
        ratings: [],
      };
    }
    if (set.completed) {
      exerciseMap[set.exerciseId].setsCompleted++;
    }
    if (set.rating) {
      exerciseMap[set.exerciseId].ratings.push(set.rating);
    }
  });

  const session = {
    workoutId: state.workout.id,
    workoutName: state.workout.name,
    icon: state.workout.icon,
    color: state.workout.color,
    exercises: Object.values(exerciseMap),
    totalDuration,
    completedAt: new Date().toISOString(),
    setsCompleted: state.sets.filter(s => s.completed).length,
    totalSets: state.sets.length,
  };

  // Revoke any remaining blob URLs
  state.sets.forEach(set => {
    if (set.recordingUrl) {
      URL.revokeObjectURL(set.recordingUrl);
    }
  });

  navigateTo('workout-complete', { session });

  state = null;
}

// === Recording Logic ===

async function startRecording() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true,
    });

    recordedChunks = [];

    // Pick a supported MIME type
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};

    mediaRecorder = new MediaRecorder(mediaStream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(1000); // collect data in 1s chunks
    return true;
  } catch (err) {
    console.warn('Recording failed to start:', err);
    recordingEnabled = false;
    mediaStream = null;
    mediaRecorder = null;
    return false;
  }
}

function stopRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      stopMediaTracks();
      resolve(null);
      return;
    }

    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType || 'video/webm';
      const blob = new Blob(recordedChunks, { type: mimeType });
      recordedChunks = [];

      // Revoke previous blob URL if any
      if (recordingBlobUrl) {
        URL.revokeObjectURL(recordingBlobUrl);
      }
      recordingBlobUrl = URL.createObjectURL(blob);

      stopMediaTracks();
      resolve(recordingBlobUrl);
    };

    mediaRecorder.stop();
  });
}

function stopMediaTracks() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  mediaRecorder = null;
}

function stopAndCleanupRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (e) { /* ignore */ }
  }
  stopMediaTracks();
  recordedChunks = [];
  if (recordingBlobUrl) {
    URL.revokeObjectURL(recordingBlobUrl);
    recordingBlobUrl = null;
  }
}

function getSupportedMimeType() {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

// === Timer Logic ===

function startTimer() {
  const set = state.sets[state.currentIndex];
  state.timeLeft = set.duration;

  timerInterval = setInterval(() => {
    state.timeLeft--;
    const el = document.getElementById('timer');
    if (el) el.textContent = formatTime(state.timeLeft);

    if (state.timeLeft <= 0) {
      clearInterval(timerInterval);
      completeSet();
    }
  }, 1000);
}

function startRestTimer() {
  const set = state.sets[state.currentIndex];
  const restDuration = set.rest || 30;
  state.timeLeft = restDuration;

  timerInterval = setInterval(() => {
    state.timeLeft--;
    const el = document.getElementById('timer');
    if (el) el.textContent = formatTime(state.timeLeft);

    if (state.timeLeft <= 0) {
      clearInterval(timerInterval);
      advanceToNext();
    }
  }, 1000);
}

async function completeSet() {
  state.sets[state.currentIndex].completed = true;

  // Stop recording and save the blob URL to this set
  if (recordingEnabled && mediaRecorder) {
    const url = await stopRecording();
    if (url) {
      state.sets[state.currentIndex].recordingUrl = url;
    }
  }

  state.phase = 'rating';
  renderCurrentState();
}

function advanceToNext() {
  state.currentIndex++;
  if (state.currentIndex >= state.sets.length) {
    state.phase = 'done';
  } else {
    state.phase = 'ready';
  }
  renderCurrentState();
}

// === Event Handlers ===

async function handleReadyClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const type = action.dataset.action;

  if (type === 'start-timer') {
    // Start recording if enabled
    if (recordingEnabled) {
      const started = await startRecording();
      if (!started) {
        // Recording failed — continue without it, re-render to show toggle off
        renderCurrentState();
        return;
      }
    }
    state.phase = 'active';
    renderCurrentState();
  } else if (type === 'quit-workout') {
    if (confirm('Quit this workout? Your progress will be saved.')) {
      state.phase = 'done';
      renderCurrentState();
    }
  } else if (type === 'skip-exercise') {
    advanceToNext();
  } else if (type === 'new-prompt') {
    const set = state.sets[state.currentIndex];
    set.prompt = getRandomPrompt(set.exerciseId) || set.prompt;
    renderCurrentState();
  } else if (type === 'toggle-recording') {
    recordingEnabled = !recordingEnabled;
    renderCurrentState();
  }
}

async function handleActiveClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;

  if (action.dataset.action === 'stop-timer') {
    clearInterval(timerInterval);
    await completeSet();
  } else if (action.dataset.action === 'quit-workout') {
    clearInterval(timerInterval);
    if (confirm('Quit this workout?')) {
      state.phase = 'done';
      renderCurrentState();
    }
  }
}

function handleRatingClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const type = action.dataset.action;

  if (type === 'rate') {
    const rating = parseInt(action.dataset.rating);
    state.sets[state.currentIndex].rating = rating;
    moveAfterRating();
  } else if (type === 'skip-rating') {
    moveAfterRating();
  }
}

function moveAfterRating() {
  // Revoke the recording URL for this set since we're moving on
  const set = state.sets[state.currentIndex];
  if (set.recordingUrl) {
    URL.revokeObjectURL(set.recordingUrl);
    set.recordingUrl = null;
  }

  const nextIndex = state.currentIndex + 1;

  // If there are more sets and rest is defined, show rest
  if (nextIndex < state.sets.length && set.rest > 0) {
    state.phase = 'rest';
    renderCurrentState();
  } else {
    advanceToNext();
  }
}

function handleRestClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;

  if (action.dataset.action === 'skip-rest') {
    clearInterval(timerInterval);
    advanceToNext();
  }
}

// === Helpers ===

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getBadgeType(category) {
  const map = { warmup: 'accent', vocal: 'purple', physical: 'blue', content: 'success' };
  return map[category] || 'accent';
}

export function cleanupActiveWorkout() {
  clearInterval(timerInterval);
  stopAndCleanupRecording();
  state = null;
}

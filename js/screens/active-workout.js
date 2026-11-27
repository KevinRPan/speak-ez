/**
 * Active Workout Screen — the core workout experience
 * Manages exercise flow, timers, rest periods, self-ratings, and self-recording
 */

import { getWorkout, randomizeWarmups } from '../data/workouts.js';
import { getExercise, getRandomPrompt, CATEGORY_INFO } from '../data/exercises.js';
import { buildBanterPrompt, normalizeWorkplace } from '../data/banter.js';
import { buildGamePrompt } from '../data/speaking-games.js';
import { messageReviewMarkup } from '../utils/message-review.js';
import { navigateTo } from '../lib/router.js';
import { getSettings, loadAll, saveAll } from '../utils/storage.js';
import { analyzeTranscript, getFillerRateScore, getPaceScore, getPaceLabel, scoreSelfTranscript } from '../utils/transcript-analysis.js';
import { classifyWorkoutFinish } from '../utils/xp.js';

let state = null;
let timerInterval = null;
let container = null;

// Recording state
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingBlobUrl = null;
let recordingBlob = null;
let recordingEnabled = false;

// Speech recognition state (for tongue twisters)
let recognition = null;
let liveTranscript = '';
let finalTranscript = '';

// AI review state
let feedbackResult = null; // null | 'loading' | { feedback object } | { error: string }

function getInterviewContext() {
  const settings = getSettings();
  if (!settings.interviewPosition) return null;
  return { position: settings.interviewPosition, level: settings.interviewLevel };
}

function getWorkplace() {
  return normalizeWorkplace(getSettings().workEnvironment);
}

let workplaceSaveTimer = null;

function sameWorkplace(a, b) {
  return a.place === b.place && a.role === b.role && a.details === b.details;
}

function saveWorkplace(workplace) {
  const store = loadAll();
  store.settings.workEnvironment = normalizeWorkplace(workplace);
  saveAll(store);
}

function retopicUpcomingBanter(workplace) {
  if (!state || state.trackContext?.prompts?.length) return;
  const avoid = [];
  state.sets.forEach((set, index) => {
    const pending = index >= state.currentIndex && set.exercise?.workplaceSetup;
    if (!pending) {
      if (set.promptKey) avoid.push(set.promptKey);
      return;
    }
    const built = buildBanterPrompt(workplace, { avoidSparks: avoid });
    set.prompt = built.text;
    set.promptKey = built.spark;
    avoid.push(built.spark);
  });
}

function commitWorkplace(workplace) {
  const next = normalizeWorkplace(workplace);
  const prev = getWorkplace();
  if (sameWorkplace(prev, next)) return next;
  saveWorkplace(next);
  retopicUpcomingBanter(next);
  return next;
}

function scheduleWorkplaceSave(workplace) {
  clearTimeout(workplaceSaveTimer);
  workplaceSaveTimer = setTimeout(() => commitWorkplace(workplace), 300);
}

function flushWorkplaceFromDom() {
  clearTimeout(workplaceSaveTimer);
  const form = container?.querySelector('[data-workplace-form]');
  if (!form) return getWorkplace();
  return commitWorkplace({
    place: form.querySelector('[data-field="place"]')?.value,
    role: form.querySelector('[data-field="role"]')?.value,
    details: form.querySelector('[data-field="details"]')?.value,
  });
}

function assignPrompt(exercise, trackContext, avoidSparks) {
  const tracked = pickTrackPrompt(trackContext);
  if (tracked) return { prompt: tracked, promptKey: null };
  if (exercise?.workplaceSetup) {
    const built = buildBanterPrompt(getWorkplace(), { avoidSparks });
    return { prompt: built.text, promptKey: built.spark };
  }
  const game = buildGamePrompt(exercise);
  if (game) return { prompt: game, promptKey: null };
  return {
    prompt: getRandomPrompt(exercise?.id, getInterviewContext()),
    promptKey: null,
  };
}

function pickTrackPrompt(trackContext) {
  const prompts = trackContext?.prompts;
  if (!prompts?.length) return null;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

export function renderActiveWorkout(cont, data = {}) {
  container = cont;
  // Track project reps pass an ad-hoc workout object; templates pass an id
  const workout = data.workout || getWorkout(data.workoutId);
  if (!workout) {
    navigateTo('workouts');
    return;
  }

  // Build flat list of all sets
  // If custom exercises were passed (user swapped warmups), use those directly.
  // Daily Sparks keep their exact recipe; otherwise randomize warmup slots.
  const sets = [];
  const usedSparks = [];
  const workoutExercises = data.customExercises
    ? data.customExercises
    : (workout.isDailySpark || workout.preserveExercises ? workout.exercises : randomizeWarmups(workout.exercises));
  workoutExercises.forEach((ex, exIndex) => {
    const exercise = getExercise(ex.exerciseId);
    const storyStructureId = exercise?.structures?.find(s => s.landing)?.id
      || exercise?.structures?.[0]?.id
      || null;
    for (let s = 0; s < ex.sets; s++) {
      const picked = assignPrompt(exercise, data.trackContext, usedSparks);
      if (picked.promptKey) usedSparks.push(picked.promptKey);
      sets.push({
        exerciseId: ex.exerciseId,
        exercise,
        exIndex,
        setNumber: s + 1,
        totalSets: ex.sets,
        duration: ex.duration,
        rest: ex.rest,
        prompt: picked.prompt,
        promptKey: picked.promptKey,
        storyStructureId,
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
    trackContext: data.trackContext || null,
    sparkContext: data.sparkContext || (workout.isDailySpark ? {
      sparkId: workout.sparkId,
      sparkDayKey: workout.sparkDayKey,
    } : null),
  };

  // Reset recording state for new workout
  recordingEnabled = false;
  stopAndCleanupRecording();

  renderCurrentState();
}

function sessionFlowLabel() {
  const parent = state.sparkContext
    ? 'Daily Spark'
    : state.trackContext
      ? 'Tracks'
      : 'Practice';
  return `${parent} · ${state.workout.name}`;
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
        <div class="session-kicker">${sessionFlowLabel()}</div>
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

      ${renderWorkplaceSetup()}
      ${renderPromptCard(set, { shuffle: true })}
      ${renderStoryShapes(set)}

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
  bindWorkplaceInputs();
}

function renderActive() {
  const set = state.sets[state.currentIndex];
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
        <div class="session-kicker">${sessionFlowLabel()}</div>
      </div>

      ${recordingEnabled ? `
        <div class="video-preview-container">
          <video id="video-preview" class="video-preview" autoplay muted playsinline></video>
          <div class="recording-indicator">
            <span class="recording-dot"></span>
            REC
          </div>
        </div>
        ${renderExerciseIdentity(set, { compact: true })}
      ` : renderExerciseIdentity(set)}

      ${renderPromptCard(set)}
      ${renderRecall(set)}

      ${isTongueTwister(set) ? `
        <div class="live-transcript-card">
          <div class="live-transcript-label">What we heard:</div>
          <div class="live-transcript-text" id="live-transcript">Listening...</div>
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

  // Start speech recognition for tongue twisters
  if (isTongueTwister(set)) {
    startSpeechRecognition();
  }

  startTimer();
}

function renderRating() {
  const set = state.sets[state.currentIndex];
  const hasRecording = !!set.recordingUrl;

  container.innerHTML = `
    <div class="screen">
      <div class="rating-section">
        <div class="session-kicker" style="margin-top: 0; margin-bottom: 8px;">${sessionFlowLabel()}</div>
        <div class="exercise-display-name mb-16">${set.exercise.name}</div>

        ${isTongueTwister(set) ? renderTongueTwisterResult(set) : ''}

        ${hasRecording ? `
          <div class="playback-section">
            <div class="playback-header">
              <span class="recording-toggle-icon">📹</span>
              <span>Review your recording</span>
            </div>
            <video id="playback-video" class="playback-video" controls playsinline src="${set.recordingUrl}"></video>
          </div>

          ${renderFeedbackSection(set)}
        ` : ''}

        ${renderSelfReview(set)}

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
  bindSelfReview();
}

// === Tongue Twister Result ===

function renderTongueTwisterResult(set) {
  const transcript = set.spokenTranscript;
  if (!transcript) {
    return `
      <div class="twister-result-card">
        <div class="twister-result-status mismatch">
          <span class="twister-status-icon">🎤</span>
          <span>No speech detected — try again next set!</span>
        </div>
      </div>
    `;
  }

  const isMatch = checkTranscriptMatch(transcript, set.prompt);

  return `
    <div class="twister-result-card">
      <div class="twister-result-status ${isMatch ? 'match' : 'mismatch'}">
        <span class="twister-status-icon">${isMatch ? '✅' : '❌'}</span>
        <span>${isMatch ? 'Nailed it!' : 'Not quite — keep practicing!'}</span>
      </div>
      <div class="twister-prompt-label">Prompt</div>
      <div class="twister-prompt-text">${escapeHtml(set.prompt)}</div>
      <div class="twister-transcript-label">You said</div>
      <div class="twister-transcript-text">${escapeHtml(transcript)}</div>
    </div>
  `;
}

// === AI Review ===

const SCORE_LABELS = {
  clarity: 'Clarity',
  structure: 'Structure',
  confidence: 'Confidence',
  conciseness: 'Conciseness',
  filler_rate: 'Filler Rate',
  pace: 'Pace',
  directness: 'Directness',
};

function renderFeedbackSection(set) {
  if (!feedbackResult) {
    return `
      <div class="ai-review-section">
        <button class="btn btn-secondary btn-block" data-action="request-review">
          ✨ Review My Answer
        </button>
        <div class="ai-review-hint">Get AI feedback — the answer, the recommendation, the caveats</div>
      </div>
    `;
  }

  if (feedbackResult === 'loading') {
    return `
      <div class="ai-review-section">
        <div class="ai-review-loading">
          <div class="ai-review-spinner"></div>
          <span>Analyzing your response...</span>
        </div>
      </div>
    `;
  }

  if (feedbackResult.error) {
    return `
      <div class="ai-review-section">
        <div class="ai-review-error">
          <span>Couldn't get feedback right now.</span>
          <button class="btn btn-ghost btn-sm" data-action="request-review">Try again</button>
        </div>
      </div>
    `;
  }

  const fb = feedbackResult;

  // Client-side transcript analysis if we have a transcript
  let transcriptAnalysis = null;
  if (fb.transcript) {
    const dur = set.duration || 0;
    transcriptAnalysis = analyzeTranscript(fb.transcript, dur);
  }

  // Merge client-side filler/pace scores into the score display
  const scores = fb.scores || {};
  if (transcriptAnalysis) {
    if (scores.filler_rate === undefined && transcriptAnalysis.fillersPerMinute !== null) {
      scores.filler_rate = getFillerRateScore(transcriptAnalysis.fillersPerMinute);
    }
    if (scores.pace === undefined && transcriptAnalysis.wpm !== null) {
      scores.pace = getPaceScore(transcriptAnalysis.wpm);
    }
  }

  return `
    <div class="ai-feedback-card">
      <div class="ai-feedback-header">
        <span>✨</span>
        <span>AI Feedback</span>
      </div>

      ${fb.summary ? `
        <div class="ai-feedback-summary">${escapeHtml(fb.summary)}</div>
      ` : ''}

      ${messageReviewMarkup(fb.message)}

      ${Object.keys(scores).length ? `
        <div class="ai-feedback-scores">
          ${Object.entries(scores)
            .filter(([k]) => SCORE_LABELS[k])
            .map(([k, v]) => renderScoreBar(SCORE_LABELS[k], v, 10))
            .join('')}
        </div>
      ` : ''}

      ${(fb.filler_count > 0 || transcriptAnalysis?.fillerCount > 0) ? (() => {
        const count = fb.filler_count ?? transcriptAnalysis?.fillerCount ?? 0;
        const fpm = transcriptAnalysis?.fillersPerMinute ?? null;
        return `
          <div class="filler-summary">
            <span class="filler-count">${count}</span>
            <span class="filler-label">filler word${count !== 1 ? 's' : ''} detected${fpm !== null ? ` · ${fpm}/min` : ''}</span>
          </div>
        `;
      })() : ''}

      ${transcriptAnalysis?.wpm ? `
        <div class="pace-summary">
          <span class="pace-wpm">${transcriptAnalysis.wpm} WPM</span>
          <span class="pace-label">${getPaceLabel(transcriptAnalysis.wpm)}</span>
        </div>
      ` : (fb.estimated_wpm ? `
        <div class="pace-summary">
          <span class="pace-wpm">~${fb.estimated_wpm} WPM</span>
          <span class="pace-label">${getPaceLabel(fb.estimated_wpm)}</span>
        </div>
      ` : '')}

      ${(transcriptAnalysis?.highlightedHtml && transcriptAnalysis.fillerCount > 0) ? `
        <details class="transcript-details">
          <summary>Transcript (fillers highlighted)</summary>
          <div class="transcript-text">${transcriptAnalysis.highlightedHtml}</div>
        </details>
      ` : ''}

      ${fb.strengths?.length ? `
        <div class="ai-feedback-list">
          <div class="ai-feedback-list-title">Strengths</div>
          ${fb.strengths.map(s => `<div class="ai-feedback-item strength">${escapeHtml(s)}</div>`).join('')}
        </div>
      ` : ''}

      ${fb.improvements?.length ? `
        <div class="ai-feedback-list">
          <div class="ai-feedback-list-title">To Improve</div>
          ${fb.improvements.map(i => `<div class="ai-feedback-item improvement">${escapeHtml(i)}</div>`).join('')}
        </div>
      ` : ''}

      ${fb.example ? `
        <div class="ai-feedback-example">
          <div class="ai-feedback-list-title">Stronger Answer</div>
          <div class="ai-feedback-example-text">${escapeHtml(fb.example)}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function spokenDuration(set) {
  if (set.spokenSeconds > 0) return set.spokenSeconds;
  return set.duration || 0;
}

function applySelfReview(set) {
  const scored = scoreSelfTranscript(set.selfTranscript, spokenDuration(set));
  set.selfReview = scored;
  if (set.aiReviewApplied) return;
  if (!scored) {
    set.feedbackScores = null;
    set.feedbackTranscript = null;
    set.feedbackFillerCount = null;
    set.feedbackWpm = null;
    return;
  }
  set.feedbackTranscript = scored.transcript;
  set.feedbackFillerCount = scored.fillerCount;
  set.feedbackWpm = scored.wpm;
  set.feedbackScores = scored.scores;
}

function renderSelfMetrics(set) {
  const analysis = set.selfReview?.analysis;
  if (!analysis) return '';
  const pace = analysis.wpm
    ? `<span>${analysis.wpm} WPM · ${escapeHtml(getPaceLabel(analysis.wpm))}</span>`
    : '';
  const fpm = analysis.fillersPerMinute != null ? ` · ${analysis.fillersPerMinute}/min` : '';
  const highlight = analysis.fillerCount > 0
    ? `<div class="transcript-text">${analysis.highlightedHtml}</div>`
    : '';
  return `
    <div class="self-review-stats">
      <span>${analysis.fillerCount} filler${analysis.fillerCount === 1 ? '' : 's'}${fpm}</span>
      ${pace}
    </div>
    ${highlight}
  `;
}

function renderSelfReview(set) {
  applySelfReview(set);
  return `
    <div class="self-review">
      <div class="self-review-label">Write what you said</div>
      <p class="self-review-hint">Type the words you actually said. Fillers and pace are counted on this device.</p>
      <textarea id="self-transcript" class="form-input" data-self-transcript rows="4"
        placeholder="Type the words you actually said…">${escapeHtml(set.selfTranscript || '')}</textarea>
      <div data-self-metrics>${renderSelfMetrics(set)}</div>
    </div>
  `;
}

function bindSelfReview() {
  const box = container?.querySelector('[data-self-transcript]');
  if (!box) return;
  box.addEventListener('input', () => {
    const set = state?.sets?.[state.currentIndex];
    if (!set || state.phase !== 'rating') return;
    set.selfTranscript = box.value;
    applySelfReview(set);
    const metrics = container.querySelector('[data-self-metrics]');
    if (metrics) metrics.innerHTML = renderSelfMetrics(set);
  });
}

function flushSelfReviewFromDom() {
  const box = container?.querySelector('[data-self-transcript]');
  const set = state?.sets?.[state.currentIndex];
  if (!box || !set || state.phase !== 'rating') return;
  set.selfTranscript = box.value;
  applySelfReview(set);
}

function renderScoreBar(label, value, maxValue = 10) {
  if (value === undefined || value === null) return '';
  const pct = Math.round((value / maxValue) * 100);
  const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
  return `
    <div class="ai-score">
      <div class="ai-score-label">${label}</div>
      <div class="ai-score-bar">
        <div class="ai-score-fill" style="width: ${pct}%; background: ${color};"></div>
      </div>
      <div class="ai-score-value">${value}/${maxValue}</div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Strip the data URL prefix (e.g. "data:video/webm;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function requestReview() {
  flushSelfReviewFromDom();
  if (!recordingBlob || !state) return;

  const setIndex = state.currentIndex;
  const set = state.sets[setIndex];
  feedbackResult = 'loading';
  renderCurrentState();

  try {
    const base64 = await blobToBase64(recordingBlob);
    const mimeType = recordingBlob.type || 'video/webm';
    const promptText = set.prompt || set.exercise.name;

    const feedbackBody = { media: base64, mimeType, prompt: promptText };
    // Track projects with drill-specific coaching (acting, improv) get judged
    // on the drill's own terms; interview tailoring would be wrong there.
    const coaching = state.trackContext?.coaching || set.exercise?.coaching;
    if (coaching) {
      feedbackBody.coachContext = coaching;
    } else {
      const interviewCtx = getInterviewContext();
      if (interviewCtx) {
        feedbackBody.interviewContext = interviewCtx;
      }
    }

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackBody),
    });

    // Check we're still on the same set (user might have moved on)
    if (!state || state.currentIndex !== setIndex || state.phase !== 'rating') return;

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();
    feedbackResult = data.feedback || { error: 'No feedback returned' };

    // Persist scores + transcript to this set so session summary can use them
    if (feedbackResult && !feedbackResult.error) {
      const reviewed = state.sets[setIndex];
      reviewed.aiReviewApplied = true;
      reviewed.feedbackScores = feedbackResult.scores || null;
      reviewed.feedbackTranscript = feedbackResult.transcript || null;
      reviewed.feedbackFillerCount = feedbackResult.filler_count ?? null;
      reviewed.feedbackWpm = feedbackResult.estimated_wpm ?? null;
      reviewed.sessionReaction = feedbackResult.session_reaction || null;
    }
  } catch (err) {
    // Only update if we're still on the same set
    if (!state || state.currentIndex !== setIndex || state.phase !== 'rating') return;
    feedbackResult = { error: err.message || 'Please try again.' };
  }

  // Re-render if still on the rating screen for this set
  if (state && state.currentIndex === setIndex && state.phase === 'rating') {
    renderCurrentState();
  }
}

function renderRest() {
  const set = state.sets[state.currentIndex];
  const nextSet = state.sets[state.currentIndex + 1];
  const nextExercise = nextSet ? nextSet.exercise : null;

  container.innerHTML = `
    <div class="screen">
      <div class="rest-screen">
        <div class="session-kicker" style="margin-top: 0;">${sessionFlowLabel()}</div>
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

function quitWorkout() {
  const done = (state?.sets || []).filter(set => set.completed).length;
  const message = done > 0
    ? 'Leave this workout? Finished sets will be saved.'
    : 'Leave this workout? It will not be logged.';
  if (!confirm(message)) return;

  clearInterval(timerInterval);
  if (done > 0) {
    state.phase = 'done';
    renderCurrentState();
  } else {
    abandonWorkout();
  }
}

function abandonWorkout() {
  const track = state?.trackContext
    ? { trackId: state.trackContext.trackId, projectId: state.trackContext.projectId }
    : null;
  state?.sets?.forEach(set => {
    if (set.recordingUrl) URL.revokeObjectURL(set.recordingUrl);
  });
  if (track) {
    navigateTo('track-project', track);
  } else {
    navigateTo('home');
  }
}

function finishWorkout() {
  clearInterval(timerInterval);
  stopAndCleanupRecording();

  const outcome = classifyWorkoutFinish(state.sets);
  if (outcome.discard) {
    abandonWorkout();
    return;
  }

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

  // Aggregate AI scores and filler data across all sets that had a review
  const setsWithScores = state.sets.filter(s => s.feedbackScores);
  let avgAiScores = null;
  if (setsWithScores.length > 0) {
    const totals = {};
    const counts = {};
    setsWithScores.forEach(s => {
      Object.entries(s.feedbackScores).forEach(([k, v]) => {
        if (!SCORE_LABELS[k] || !Number.isFinite(v)) return;
        totals[k] = (totals[k] || 0) + v;
        counts[k] = (counts[k] || 0) + 1;
      });
    });
    avgAiScores = {};
    Object.keys(totals).forEach(k => {
      avgAiScores[k] = Math.round((totals[k] / counts[k]) * 10) / 10;
    });
  }

  const setsWithFillers = state.sets.filter(s => s.feedbackFillerCount !== null && s.feedbackFillerCount !== undefined);
  const totalFillerCount = setsWithFillers.reduce((a, s) => a + (s.feedbackFillerCount || 0), 0);

  // Use the most dramatic session_reaction from any set
  const reactions = state.sets.map(s => s.sessionReaction).filter(Boolean);
  const sessionReaction = reactions.includes('tough') ? 'tough' : reactions.includes('great') ? 'great' : reactions.length ? 'solid' : null;

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
    avgAiScores,
    totalFillerCount: setsWithFillers.length > 0 ? totalFillerCount : null,
    sessionReaction,
  };

  const selfTranscripts = state.sets
    .map(set => (set.selfTranscript || '').trim())
    .filter(Boolean);
  if (selfTranscripts.length) session.selfTranscripts = selfTranscripts;

  if (state.trackContext) {
    session.track = {
      trackId: state.trackContext.trackId,
      projectId: state.trackContext.projectId,
    };
  }

  // Spark credit is a finished-quest reward. A partial quit keeps the sets
  // already done and leaves today's spark available.
  if (outcome.finished && state.sparkContext) {
    session.isDailySpark = true;
    session.sparkId = state.sparkContext.sparkId;
    session.sparkDayKey = state.sparkContext.sparkDayKey;
  }
  session.endedEarly = !outcome.finished;

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
      recordingBlob = blob; // Keep blob for AI review
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
  recordingBlob = null;
  if (recordingBlobUrl) {
    URL.revokeObjectURL(recordingBlobUrl);
    recordingBlobUrl = null;
  }
  stopSpeechRecognition();
  liveTranscript = '';
  finalTranscript = '';
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

// === Speech Recognition (Tongue Twisters) ===

function isTongueTwister(set) {
  return set.exerciseId === 'tongue-twisters';
}

function startSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  liveTranscript = '';
  finalTranscript = '';

  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    liveTranscript = finalTranscript + interim;
    const el = document.getElementById('live-transcript');
    if (el) el.textContent = liveTranscript || 'Listening...';
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return;
    console.warn('Speech recognition error:', event.error);
  };

  recognition.onend = () => {
    // Auto-restart if still in active phase
    if (state?.phase === 'active' && recognition) {
      try { recognition.start(); } catch (e) {}
    }
  };

  recognition.start();
}

function stopSpeechRecognition() {
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
    recognition = null;
  }
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkTranscriptMatch(transcript, prompt) {
  const normTranscript = normalizeText(transcript);
  const normPrompt = normalizeText(prompt);
  return normTranscript.includes(normPrompt) || normPrompt.includes(normTranscript);
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
  const set = state.sets[state.currentIndex];
  set.completed = true;
  const remaining = Number.isFinite(state.timeLeft) ? Math.max(0, state.timeLeft) : 0;
  set.spokenSeconds = Math.max(1, (set.duration || 0) - remaining);

  // Stop speech recognition and save transcript for tongue twisters
  if (isTongueTwister(set) && recognition) {
    stopSpeechRecognition();
    set.spokenTranscript = (liveTranscript || finalTranscript).trim();
    if (set.spokenTranscript && !set.selfTranscript) {
      set.selfTranscript = set.spokenTranscript;
    }
  }

  // Stop recording and save the blob URL to this set
  if (recordingEnabled && mediaRecorder) {
    const url = await stopRecording();
    if (url) {
      set.recordingUrl = url;
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

  // Re-rendering drops the form. Save whatever is typed before that.
  if (container?.querySelector('[data-workplace-form]')) {
    flushWorkplaceFromDom();
  }

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
    quitWorkout();
  } else if (type === 'skip-exercise') {
    advanceToNext();
  } else if (type === 'new-prompt') {
    refreshPrompt(state.sets[state.currentIndex]);
    renderCurrentState();
  } else if (type === 'pick-structure') {
    const set = state.sets[state.currentIndex];
    const id = action.dataset.structure;
    if (set.exercise?.structures?.some(s => s.id === id)) {
      set.storyStructureId = id;
      renderCurrentState();
    }
  } else if (type === 'toggle-recording') {
    recordingEnabled = !recordingEnabled;
    renderCurrentState();
  }
}

async function handleActiveClick(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;

  if (action.dataset.action === 'toggle-recall') {
    toggleRecall(action);
  } else if (action.dataset.action === 'stop-timer') {
    clearInterval(timerInterval);
    await completeSet();
  } else if (action.dataset.action === 'quit-workout') {
    quitWorkout();
  }
}

function handleRatingClick(e) {
  flushSelfReviewFromDom();
  const action = e.target.closest('[data-action]');
  if (!action) return;
  const type = action.dataset.action;

  if (type === 'rate') {
    const rating = parseInt(action.dataset.rating);
    state.sets[state.currentIndex].rating = rating;
    moveAfterRating();
  } else if (type === 'skip-rating') {
    moveAfterRating();
  } else if (type === 'request-review') {
    requestReview();
  }
}

function moveAfterRating() {
  // Clean up recording and review state for this set
  const set = state.sets[state.currentIndex];
  if (set.recordingUrl) {
    URL.revokeObjectURL(set.recordingUrl);
    set.recordingUrl = null;
  }
  recordingBlob = null;
  feedbackResult = null;

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
  const map = { warmup: 'accent', vocal: 'purple', physical: 'blue', content: 'success', performance: 'pink' };
  return map[category] || 'accent';
}

function refreshPrompt(set) {
  if (set.exercise?.workplaceSetup && !state.trackContext?.prompts?.length) {
    const workplace = flushWorkplaceFromDom();
    const avoidSparks = state.sets.map(s => s.promptKey).filter(Boolean);
    const built = buildBanterPrompt(workplace, { avoidSparks });
    set.prompt = built.text;
    set.promptKey = built.spark;
    return;
  }
  const game = !state.trackContext?.prompts?.length && buildGamePrompt(set.exercise);
  if (game) {
    set.prompt = game;
    set.promptKey = null;
    return;
  }
  set.prompt = pickTrackPrompt(state.trackContext) || getRandomPrompt(set.exerciseId, getInterviewContext()) || set.prompt;
}

function bindWorkplaceInputs() {
  const form = container?.querySelector('[data-workplace-form]');
  if (!form) return;
  form.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('input', () => {
      scheduleWorkplaceSave({
        place: form.querySelector('[data-field="place"]')?.value,
        role: form.querySelector('[data-field="role"]')?.value,
        details: form.querySelector('[data-field="details"]')?.value,
      });
    });
  });
}

function renderWorkplaceSetup() {
  const set = state.sets[state.currentIndex];
  if (!set.exercise?.workplaceSetup) return '';
  const w = getWorkplace();
  return `
    <div class="workplace-card" data-workplace-form>
      <div class="label mb-8">Your work</div>
      <p class="workplace-hint">Topics come from this. Specific details sound like your actual room.</p>
      <label class="workplace-field" for="workplace-place">Where you work</label>
      <input id="workplace-place" class="form-input" data-field="place" maxlength="120"
        placeholder="a night-shift ER, a hybrid design studio" value="${escapeAttr(w.place)}" />
      <label class="workplace-field" for="workplace-role">Your role</label>
      <input id="workplace-role" class="form-input" data-field="role" maxlength="80"
        placeholder="nurse, designer, teacher" value="${escapeAttr(w.role)}" />
      <label class="workplace-field" for="workplace-details">Details people there would recognize</label>
      <textarea id="workplace-details" class="form-input" data-field="details" rows="2" maxlength="240"
        placeholder="the broken coffee machine, Friday deploys, parent pickup">${escapeHtml(w.details)}</textarea>
    </div>
  `;
}

function renderPromptCard(set, { shuffle = false } = {}) {
  if (!set.prompt) return '';
  const shuffleLabel = set.exercise?.workplaceSetup ? '↻ New topic' : '↻ Different prompt';
  return `
    <div class="prompt-card">
      <div class="prompt-text${set.prompt.includes('\n') ? ' is-brief' : ''}">${escapeHtml(set.prompt)}</div>
      ${shuffle ? `<button type="button" class="btn btn-ghost btn-sm mt-8" data-action="new-prompt">${shuffleLabel}</button>` : ''}
    </div>
  `;
}

function renderExerciseIdentity(set, { compact = false } = {}) {
  const catInfo = CATEGORY_INFO[set.exercise.category];
  const description = set.exercise.description || '';
  return `
    <div class="exercise-display ${compact ? 'exercise-display-compact' : ''}">
      ${compact ? '' : `<div class="exercise-display-icon">${catInfo.icon}</div>`}
      <div class="exercise-display-name">${escapeHtml(set.exercise.name)}</div>
      <div class="exercise-display-set">Set ${set.setNumber} of ${set.totalSets}</div>
      ${description ? `<p class="exercise-display-desc">${escapeHtml(description)}</p>` : ''}
    </div>
  `;
}

function renderRecall(set) {
  const exercise = set.exercise;
  if (!exercise) return '';
  const structures = exercise.structures || [];
  const instructions = exercise.instructions || [];
  const selected = structures.find(s => s.id === set.storyStructureId)
    || structures.find(s => s.landing)
    || structures[0];
  const landing = exercise.landing || '';

  return `
    <div class="recall">
      <button type="button" class="recall-toggle" data-action="toggle-recall"
        aria-expanded="false" aria-controls="recall-panel">
        Remind me
      </button>
      <div class="recall-panel" id="recall-panel" hidden>
        <div class="recall-scroll">
          ${structures.length ? `
            <div class="recall-block">
              <div class="label mb-8">Shapes</div>
              ${landing ? `<p class="story-shapes-landing">${escapeHtml(landing)}</p>` : ''}
              ${structures.map(shape => `
                <div class="story-shape is-static ${shape.id === selected?.id ? 'is-selected' : ''}">
                  <span class="story-shape-name">
                    ${escapeHtml(shape.name)}
                    ${shape.id === selected?.id ? '<span class="story-shape-tag">Your pick</span>' : ''}
                  </span>
                  <span class="story-shape-beats">${escapeHtml(shape.beats.join(' → '))}</span>
                  ${shape.id === selected?.id ? `<span class="story-shape-example">“${escapeHtml(shape.example)}”</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${instructions.length ? `
            <div class="recall-block">
              <div class="label mb-8">Steps</div>
              <ul class="instructions-list">
                ${instructions.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${exercise.tips ? `
            <div class="tips-callout recall-tip">
              <div class="tips-callout-title">Pro tip</div>
              <div class="tips-callout-text">${escapeHtml(exercise.tips)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function toggleRecall(button) {
  const panel = container?.querySelector('#recall-panel');
  if (!panel) return;
  const willOpen = panel.hasAttribute('hidden');
  panel.toggleAttribute('hidden', !willOpen);
  button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  button.textContent = willOpen ? 'Hide reminder' : 'Remind me';
  if (willOpen) panel.scrollIntoView({ block: 'nearest' });
}

function renderStoryShapes(set) {
  const structures = set.exercise?.structures;
  if (!structures?.length) return '';
  const selected = structures.find(s => s.id === set.storyStructureId) || structures.find(s => s.landing) || structures[0];
  const landing = set.exercise.landing || 'Land the last line on something that changed within you.';

  return `
    <div class="story-shapes">
      <div class="label mb-8">Story shapes</div>
      <p class="story-shapes-landing">${escapeHtml(landing)}</p>
      ${structures.map(shape => {
        const isSelected = shape.id === selected.id;
        return `
          <button type="button" class="story-shape ${isSelected ? 'is-selected' : ''}"
            data-action="pick-structure" data-structure="${shape.id}"
            aria-pressed="${isSelected ? 'true' : 'false'}">
            <span class="story-shape-name">
              ${escapeHtml(shape.name)}
              ${shape.landing ? '<span class="story-shape-tag">Start here</span>' : ''}
            </span>
            <span class="story-shape-beats">${escapeHtml(shape.beats.join(' → '))}</span>
            ${isSelected ? `<span class="story-shape-example">“${escapeHtml(shape.example)}”</span>` : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

export function cleanupActiveWorkout() {
  clearInterval(timerInterval);
  clearTimeout(workplaceSaveTimer);
  stopAndCleanupRecording();
  state = null;
}

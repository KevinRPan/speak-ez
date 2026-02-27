/**
 * Interview Drill Screen
 *
 * Self-contained flow: field → level → round → practice → review
 * Uses pre-built question bank from interview-questions.js
 */

import { navigateTo } from '../lib/router.js';
import { FIELDS, getQuestions, getRandomQuestion } from '../data/interview-questions.js';

let state = null;
let container = null;

// Speech recognition
let recognition = null;
let liveTranscript = '';
let finalTranscript = '';

// Timer
let timerInterval = null;
let elapsedSeconds = 0;

export function renderInterviewDrill(cont, data = {}) {
  container = cont;
  cleanup();

  state = {
    phase: data.phase || 'field', // field | level | round | session | review
    field: data.field || null,
    level: data.level || null,
    round: data.round || null,
    question: data.question || null,
    response: '',
    mode: 'ready', // ready | recording | typing
    isRecording: false,
    feedback: null,
    feedbackLoading: false,
    feedbackError: null,
  };

  render();
}

function render() {
  if (!state || !container) return;

  switch (state.phase) {
    case 'field': renderFieldSelect(); break;
    case 'level': renderLevelSelect(); break;
    case 'round': renderRoundSelect(); break;
    case 'session': renderSession(); break;
    case 'review': renderReview(); break;
  }
}

// ── Field Selection ──

function renderFieldSelect() {
  const fields = Object.entries(FIELDS);

  container.innerHTML = `
    <div class="screen drill-screen">
      <div class="section-header">
        <h1 class="h1">Interview Drills</h1>
      </div>
      <p class="subtitle" style="margin-bottom: 24px;">
        Select your field to get interview questions tailored to your role, level, and the specific round you're preparing for.
      </p>

      <div class="drill-field-list">
        ${fields.map(([key, f]) => `
          <div class="card card-interactive drill-field-card" data-field="${key}">
            <div class="workout-card">
              <div class="workout-card-icon" style="background: var(--accent-dim);">
                ${f.icon}
              </div>
              <div class="workout-card-info">
                <div class="workout-card-name">${f.label}</div>
                <div class="workout-card-meta">
                  ${f.levels.join(' \u00B7 ')} \u00B7 ${Object.keys(f.rounds).length} round types
                </div>
              </div>
              <div class="workout-card-arrow">\u203A</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="drill-coming-soon" style="margin-top: 32px; padding: 16px; border-radius: var(--radius-sm); border: 1px dashed rgba(255,255,255,0.1); text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
        More fields coming soon \u2014 Engineering Management, Design, Marketing, and custom fields
      </div>

      <button class="btn btn-ghost btn-block" style="margin-top: 16px;" data-action="back-to-setup">
        \u2190 Back to Interview Setup
      </button>
    </div>
  `;

  container.onclick = (e) => {
    const fieldCard = e.target.closest('[data-field]');
    if (fieldCard) {
      state.field = fieldCard.dataset.field;
      state.phase = 'level';
      render();
      return;
    }
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'back-to-setup') {
      cleanup();
      navigateTo('interview-setup');
    }
  };
}

// ── Level Selection ──

function renderLevelSelect() {
  const f = FIELDS[state.field];
  if (!f) { state.phase = 'field'; render(); return; }

  const levelDescriptions = {
    'Senior': 'IC with scope over a team\u2019s problem area',
    'Staff': 'Cross-team technical leadership and strategy',
    'Staff/GPM': 'Group product ownership and strategy',
    'Principal': 'Org-wide technical direction and vision',
  };

  container.innerHTML = `
    <div class="screen drill-screen">
      <button class="btn btn-ghost btn-sm" data-action="back" style="margin-bottom: 16px;">
        \u2190 Back
      </button>

      <div style="font-size: 1.8rem; margin-bottom: 8px;">${f.icon}</div>
      <h2 class="h1" style="margin-bottom: 8px;">${f.label}</h2>
      <p class="subtitle" style="margin-bottom: 24px;">
        Select your target level. Questions and evaluation criteria scale with seniority.
      </p>

      <div class="drill-level-list">
        ${f.levels.map(lvl => `
          <div class="card card-interactive" data-level="${lvl}" style="margin-bottom: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-weight: 700; font-size: 1rem; margin-bottom: 2px;">${lvl}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                  ${levelDescriptions[lvl] || ''}
                </div>
              </div>
              <span style="color: var(--text-tertiary); font-size: 1.2rem;">\u203A</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.onclick = (e) => {
    const levelCard = e.target.closest('[data-level]');
    if (levelCard) {
      state.level = levelCard.dataset.level;
      state.phase = 'round';
      render();
      return;
    }
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'back') {
      state.field = null;
      state.phase = 'field';
      render();
    }
  };
}

// ── Round Selection ──

function renderRoundSelect() {
  const f = FIELDS[state.field];
  if (!f) { state.phase = 'field'; render(); return; }

  const rounds = Object.entries(f.rounds)
    .filter(([, r]) => (r.questions?.[state.level]?.length || 0) > 0);

  container.innerHTML = `
    <div class="screen drill-screen">
      <button class="btn btn-ghost btn-sm" data-action="back" style="margin-bottom: 16px;">
        \u2190 Back
      </button>

      <h2 class="h1" style="margin-bottom: 8px;">Choose your round</h2>
      <p class="subtitle" style="margin-bottom: 24px;">
        ${f.label} \u00B7 ${state.level} level
      </p>

      <div class="drill-round-list">
        ${rounds.map(([key, r]) => {
          const qCount = r.questions?.[state.level]?.length || 0;
          return `
            <div class="card card-interactive" data-round="${key}" style="margin-bottom: 8px;">
              <div style="display: flex; align-items: flex-start; gap: 14px;">
                <div style="font-size: 1.4rem; width: 44px; height: 44px; border-radius: 10px; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${r.icon}
                </div>
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px;">${r.label}</div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px; line-height: 1.4;">
                    ${r.description}
                  </div>
                  <div style="display: flex; gap: 12px; font-size: 0.75rem; color: var(--text-tertiary);">
                    <span style="color: var(--accent);">\u23F1 ${r.timeGuide}</span>
                    <span>${qCount} question${qCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <span style="color: var(--text-tertiary); font-size: 1.2rem; margin-top: 8px;">\u203A</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.onclick = (e) => {
    const roundCard = e.target.closest('[data-round]');
    if (roundCard) {
      state.round = roundCard.dataset.round;
      startSession();
      return;
    }
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'back') {
      state.level = null;
      state.phase = 'level';
      render();
    }
  };
}

// ── Session ──

function startSession() {
  const q = getRandomQuestion(state.field, state.round, state.level);
  state.question = q;
  state.response = '';
  state.mode = 'ready';
  state.feedback = null;
  state.feedbackError = null;
  state.phase = 'session';
  elapsedSeconds = 0;

  // Set up speech recognition
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && !recognition) {
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
  }

  render();
}

function renderSession() {
  const roundData = FIELDS[state.field]?.rounds?.[state.round];
  const q = state.question;
  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!q) {
    container.innerHTML = `
      <div class="screen drill-screen">
        <p class="subtitle">No questions available for this configuration.</p>
        <button class="btn btn-ghost" data-action="back-to-round" style="margin-top: 16px;">\u2190 Back</button>
      </div>
    `;
    container.onclick = (e) => {
      if (e.target.closest('[data-action="back-to-round"]')) {
        state.phase = 'round';
        render();
      }
    };
    return;
  }

  container.innerHTML = `
    <div class="screen drill-screen drill-session">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <button class="btn btn-ghost btn-sm" data-action="back-to-round">\u2190 Back</button>
        ${state.mode !== 'ready' ? `
          <div class="drill-timer" id="drill-timer" style="font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 500; letter-spacing: 0.05em; color: ${elapsedSeconds > 240 ? 'var(--danger)' : elapsedSeconds > 180 ? 'var(--warning)' : 'var(--text)'};">
            ${formatTime(elapsedSeconds)}
          </div>
        ` : ''}
      </div>

      <!-- Question Card -->
      <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));">
        <div class="label" style="color: var(--accent); margin-bottom: 10px;">
          ${roundData?.label || ''} \u00B7 ${roundData?.timeGuide || ''}
        </div>
        <div style="font-size: 1.15rem; font-weight: 600; line-height: 1.4; margin-bottom: 12px;">
          ${escapeHtml(q.q)}
        </div>
        ${q.hint && state.mode === 'ready' ? `
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; padding: 10px 12px; border-radius: 8px; background: var(--accent-dim); border-left: 3px solid var(--accent);">
            \u{1F4A1} ${escapeHtml(q.hint)}
          </div>
        ` : ''}
      </div>

      <!-- Controls -->
      ${state.mode === 'ready' ? `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${speechSupported ? `
            <button class="btn btn-primary btn-block btn-lg" data-action="start-recording">
              \u{1F399}\uFE0F Start Speaking
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-block" data-action="start-typing">
            \u2328\uFE0F Type Response Instead
          </button>
          <button class="btn btn-ghost btn-block" data-action="skip">
            Skip to another question \u2192
          </button>
        </div>
      ` : ''}

      ${state.mode === 'recording' ? `
        <div>
          <div class="card" style="min-height: 100px; margin-bottom: 16px; font-size: 0.95rem; line-height: 1.7; color: ${state.response ? 'var(--text)' : 'var(--text-tertiary)'};">
            <span id="drill-live-text">${state.response || 'Listening... Start speaking your answer.'}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
            <div class="drill-recording-dot"></div>
            <button class="btn btn-block" data-action="stop-recording" style="background: var(--danger); color: #fff; padding: 14px 32px;">
              \u23F9 Stop & Review
            </button>
          </div>
        </div>
      ` : ''}

      ${state.mode === 'typing' ? `
        <div>
          <textarea
            id="drill-typed-response"
            class="form-input"
            rows="8"
            placeholder="Type your answer here as if you were speaking it aloud. Don't overthink the writing \u2014 focus on the content and structure you'd actually say."
            style="min-height: 160px;"
          >${escapeHtml(state.response)}</textarea>
          <div style="margin-top: 14px; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-ghost" data-action="cancel-typing">Cancel</button>
            <button class="btn btn-primary" data-action="submit-typed" style="opacity: ${state.response.trim() ? '1' : '0.4'};">
              Submit for Review \u2192
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Rubric -->
      ${roundData?.rubric && state.mode !== 'ready' ? `
        <div class="card" style="margin-top: 20px;">
          <div class="label" style="margin-bottom: 8px;">You'll be evaluated on</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${roundData.rubric.map(r => `
              <span style="padding: 4px 10px; border-radius: 6px; background: var(--bg-elevated); font-size: 0.78rem; color: var(--text-secondary);">
                ${r}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Wire up textarea live updates
  const textarea = document.getElementById('drill-typed-response');
  if (textarea) {
    textarea.focus();
    textarea.addEventListener('input', () => {
      state.response = textarea.value;
      const submitBtn = container.querySelector('[data-action="submit-typed"]');
      if (submitBtn) submitBtn.style.opacity = state.response.trim() ? '1' : '0.4';
    });
  }

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const type = action.dataset.action;

    if (type === 'back-to-round') {
      stopTimer();
      stopRecognition();
      state.round = null;
      state.phase = 'round';
      render();
    } else if (type === 'start-recording') {
      startRecording();
    } else if (type === 'stop-recording') {
      stopRecognition();
      stopTimer();
      state.phase = 'review';
      render();
    } else if (type === 'start-typing') {
      state.mode = 'typing';
      startTimer();
      render();
    } else if (type === 'cancel-typing') {
      stopTimer();
      state.response = '';
      state.mode = 'ready';
      elapsedSeconds = 0;
      render();
    } else if (type === 'submit-typed') {
      if (state.response.trim()) {
        stopTimer();
        state.phase = 'review';
        render();
      }
    } else if (type === 'skip') {
      const q = getRandomQuestion(state.field, state.round, state.level);
      state.question = q;
      state.response = '';
      render();
    }
  };
}

function startRecording() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  liveTranscript = '';
  finalTranscript = '';
  state.response = '';

  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    state.response = finalTranscript + interim;
    const el = document.getElementById('drill-live-text');
    if (el) el.textContent = state.response || 'Listening...';
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return;
    console.warn('Speech recognition error:', event.error);
  };

  recognition.onend = () => {
    // Auto-restart if still in recording mode
    if (state?.mode === 'recording') {
      try { recognition.start(); } catch (e) {}
    }
  };

  recognition.start();
  state.mode = 'recording';
  state.isRecording = true;
  startTimer();
  render();
}

function stopRecognition() {
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
    recognition = null;
  }
  if (state) state.isRecording = false;
  liveTranscript = '';
  finalTranscript = '';
}

// ── Review ──

function renderReview() {
  const roundData = FIELDS[state.field]?.rounds?.[state.round];
  const q = state.question;
  const fb = state.feedback;

  container.innerHTML = `
    <div class="screen drill-screen drill-review">
      <h2 class="h1" style="margin-bottom: 6px;">Session Review</h2>
      <p class="subtitle" style="margin-bottom: 24px;">
        ${roundData?.label || ''} \u00B7 ${state.level} ${FIELDS[state.field]?.label || ''}
      </p>

      <!-- Question recap -->
      <div class="card" style="margin-bottom: 12px;">
        <div class="label" style="margin-bottom: 6px;">Question</div>
        <div style="font-size: 0.95rem; line-height: 1.5;">${escapeHtml(q?.q || '')}</div>
      </div>

      <!-- Your response -->
      <div class="card" style="margin-bottom: 20px;">
        <div class="label" style="margin-bottom: 6px;">Your Response</div>
        <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); white-space: pre-wrap;">
          ${escapeHtml(state.response) || '(No response recorded)'}
        </div>
      </div>

      <!-- Feedback area -->
      <div id="drill-feedback-area">
        ${renderFeedbackContent()}
      </div>

      <!-- Actions -->
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;">
        <button class="btn btn-primary" style="flex: 1;" data-action="practice-again">
          Practice Another Question
        </button>
        <button class="btn btn-secondary" style="flex: 1;" data-action="change-round">
          Change Round
        </button>
        <button class="btn btn-ghost" data-action="go-home">
          Home
        </button>
      </div>
    </div>
  `;

  // Auto-fetch feedback if not yet loaded
  if (!fb && !state.feedbackLoading && !state.feedbackError) {
    fetchFeedback();
  }

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const type = action.dataset.action;

    if (type === 'practice-again') {
      startSession();
    } else if (type === 'change-round') {
      state.round = null;
      state.phase = 'round';
      render();
    } else if (type === 'go-home') {
      cleanup();
      navigateTo('interview-setup');
    } else if (type === 'retry-feedback') {
      state.feedbackError = null;
      state.feedback = null;
      fetchFeedback();
    }
  };
}

function renderFeedbackContent() {
  if (state.feedbackLoading) {
    return `
      <div style="padding: 32px; text-align: center; color: var(--text-tertiary);">
        <div class="drill-spinner"></div>
        Analyzing your response...
      </div>
    `;
  }

  if (state.feedbackError) {
    return `
      <div class="card" style="text-align: center; background: rgba(224,82,82,0.08); border: 1px solid rgba(224,82,82,0.2);">
        <div style="color: var(--danger); margin-bottom: 10px;">${state.feedbackError}</div>
        <button class="btn btn-secondary btn-sm" data-action="retry-feedback">Retry</button>
      </div>
    `;
  }

  const fb = state.feedback;
  if (!fb) return '';

  return `
    <!-- Overall Score -->
    <div class="card" style="text-align: center; margin-bottom: 12px; background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));">
      <div style="font-size: 3rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: ${scoreColor(fb.overall_score)}; line-height: 1;">
        ${fb.overall_score}<span style="font-size: 1.2rem; color: var(--text-tertiary);">/10</span>
      </div>
      <div style="margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; max-width: 480px; margin-left: auto; margin-right: auto;">
        ${escapeHtml(fb.summary || '')}
      </div>
    </div>

    <!-- Criterion Scores -->
    ${fb.scores?.length ? `
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
        ${fb.scores.map(s => `
          <div class="card card-sm" style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: ${scoreColor(s.score)}18; color: ${scoreColor(s.score)}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 0.9rem; flex-shrink: 0;">
              ${s.score}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 2px;">${escapeHtml(s.criterion)}</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${escapeHtml(s.comment)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Strengths & Improvements -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
      <div style="padding: 14px; border-radius: var(--radius-sm); background: var(--success-dim); border: 1px solid rgba(88,204,2,0.2);">
        <div class="label" style="color: var(--success); margin-bottom: 8px;">\u2713 Strengths</div>
        ${(fb.strengths || []).map(s => `
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 6px; line-height: 1.4;">${escapeHtml(s)}</div>
        `).join('')}
      </div>
      <div style="padding: 14px; border-radius: var(--radius-sm); background: var(--accent-dim); border: 1px solid rgba(255,107,53,0.2);">
        <div class="label" style="color: var(--accent); margin-bottom: 8px;">\u2191 Improvements</div>
        ${(fb.improvements || []).map(s => `
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 6px; line-height: 1.4;">${escapeHtml(s)}</div>
        `).join('')}
      </div>
    </div>

    <!-- Example Reframe -->
    ${fb.example_reframe ? `
      <div style="padding: 14px; border-radius: var(--radius-sm); background: var(--blue-dim); border: 1px solid rgba(0,180,216,0.2); margin-bottom: 12px;">
        <div class="label" style="color: var(--blue); margin-bottom: 8px;">\u{1F4AC} Stronger Phrasing</div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; font-style: italic;">
          "${escapeHtml(fb.example_reframe)}"
        </div>
      </div>
    ` : ''}
  `;
}

async function fetchFeedback() {
  state.feedbackLoading = true;
  updateFeedbackArea();

  try {
    const roundData = FIELDS[state.field]?.rounds?.[state.round];
    const response = await fetch('/api/interview-drill-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: FIELDS[state.field]?.label,
        level: state.level,
        roundLabel: roundData?.label,
        rubric: roundData?.rubric || [],
        question: state.question?.q,
        transcript: state.response,
      }),
    });

    if (!response.ok) throw new Error('Failed to get feedback');

    const data = await response.json();
    state.feedback = data.feedback || data;
    state.feedbackLoading = false;
    state.feedbackError = null;
  } catch (err) {
    console.error('Drill feedback error:', err);
    state.feedbackLoading = false;
    state.feedbackError = 'Could not generate feedback. Please try again.';
  }

  updateFeedbackArea();
}

function updateFeedbackArea() {
  const area = document.getElementById('drill-feedback-area');
  if (area) area.innerHTML = renderFeedbackContent();
}

// ── Helpers ──

function startTimer() {
  elapsedSeconds = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const el = document.getElementById('drill-timer');
    if (el) {
      el.textContent = formatTime(elapsedSeconds);
      if (elapsedSeconds > 240) el.style.color = 'var(--danger)';
      else if (elapsedSeconds > 180) el.style.color = 'var(--warning)';
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ':' + sec.toString().padStart(2, '0');
}

function scoreColor(s) {
  if (s >= 8) return 'var(--success)';
  if (s >= 6) return 'var(--warning)';
  if (s >= 4) return 'var(--blue)';
  return 'var(--danger)';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function cleanup() {
  stopTimer();
  stopRecognition();
  liveTranscript = '';
  finalTranscript = '';
}

export function cleanupInterviewDrill() {
  cleanup();
  state = null;
}

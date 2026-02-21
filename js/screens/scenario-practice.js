/**
 * Scenario Practice Screen — the core scenario practice experience
 * Manages: Recording → Review → Q&A → Complete phases
 */

import { getScenario } from '../data/scenarios.js';
import { navigateTo } from '../lib/router.js';

// State
let state = null;
let container = null;

// Recording
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingBlobUrl = null;
let recordingBlob = null;

// Q&A recording (for responses)
let qaMediaStream = null;
let qaMediaRecorder = null;
let qaRecordedChunks = [];
let qaRecordingBlob = null;
let qaRecordingBlobUrl = null;

// Timer
let timerInterval = null;
let elapsedSeconds = 0;

export function renderScenarioPractice(cont, data = {}) {
  container = cont;
  const scenario = getScenario(data.scenarioId);
  if (!scenario) {
    navigateTo('scenarios');
    return;
  }

  state = {
    scenario,
    phase: 'recording', // recording, review, qa, complete
    qaMessages: [],       // { role: 'ai'|'user', text: string }[]
    qaRound: 0,
    qaTotal: 3,
    qaLoading: false,
    feedback: null,
  };

  elapsedSeconds = 0;
  stopAndCleanupRecording();
  stopAndCleanupQaRecording();
  renderCurrentPhase();
}

function renderCurrentPhase() {
  if (!state || !container) return;
  clearInterval(timerInterval);

  const { phase } = state;
  if (phase === 'recording') renderRecording();
  else if (phase === 'review') renderReview();
  else if (phase === 'qa') renderQA();
  else if (phase === 'complete') renderComplete();
}

// === RECORDING PHASE ===

function renderRecording() {
  const { scenario } = state;

  container.innerHTML = `
    <div class="screen scenario-practice-screen">
      <div class="scenario-practice-header">
        <button class="btn btn-ghost btn-sm" data-action="quit">✕ Exit</button>
        <div class="scenario-phase-dots">
          <span class="phase-dot active"></span>
          <span class="phase-dot"></span>
          <span class="phase-dot"></span>
          <span class="phase-dot"></span>
        </div>
        <span class="label">Recording</span>
      </div>

      <div class="scenario-prompt-banner">
        <div class="scenario-prompt-label">Your scenario</div>
        <div class="scenario-prompt-text">${scenario.context}</div>
      </div>

      <div class="video-preview-container" id="video-container">
        <video id="video-preview" class="video-preview" autoplay muted playsinline></video>
        <div class="recording-indicator" id="rec-indicator" style="display:none;">
          <span class="recording-dot"></span>
          REC
        </div>
        <div class="recording-timer" id="rec-timer">0:00</div>
      </div>

      <div class="scenario-recording-controls">
        <button class="btn btn-timer-start btn-block" id="record-btn" data-action="toggle-record">
          🔴 Start Recording
        </button>
      </div>
    </div>
  `;

  // Start camera preview immediately
  startCameraPreview();

  container.onclick = async (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;

    const type = action.dataset.action;
    if (type === 'quit') {
      if (confirm('Exit scenario practice?')) {
        stopAndCleanupRecording();
        navigateTo('scenarios');
      }
    } else if (type === 'toggle-record') {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        // Stop recording
        clearInterval(timerInterval);
        const url = await stopRecording();
        if (url) {
          state.phase = 'review';
          renderCurrentPhase();
        }
      } else {
        // Start recording
        const started = await startRecording();
        if (started) {
          const recBtn = document.getElementById('record-btn');
          const recIndicator = document.getElementById('rec-indicator');
          if (recBtn) {
            recBtn.textContent = '⏹ Stop Recording';
            recBtn.classList.remove('btn-timer-start');
            recBtn.classList.add('btn-timer-stop');
          }
          if (recIndicator) recIndicator.style.display = '';
          startElapsedTimer();
        }
      }
    }
  };
}

// === REVIEW PHASE ===

function renderReview() {
  const { scenario } = state;

  container.innerHTML = `
    <div class="screen scenario-practice-screen">
      <div class="scenario-practice-header">
        <button class="btn btn-ghost btn-sm" data-action="quit">✕ Exit</button>
        <div class="scenario-phase-dots">
          <span class="phase-dot completed">✓</span>
          <span class="phase-dot active"></span>
          <span class="phase-dot"></span>
          <span class="phase-dot"></span>
        </div>
        <span class="label">Review</span>
      </div>

      <h2 class="scenario-review-title">Review Your Response</h2>
      <p class="scenario-review-subtitle">Watch your recording, then continue to Q&A</p>

      <div class="playback-section">
        <video id="playback-video" class="playback-video" controls playsinline src="${recordingBlobUrl}"></video>
      </div>

      <div class="scenario-review-actions">
        <button class="btn btn-primary btn-block" data-action="continue-qa">
          Continue to Q&A →
        </button>
        <button class="btn btn-ghost btn-block mt-8" data-action="re-record">
          ↻ Re-record
        </button>
      </div>
    </div>
  `;

  container.onclick = async (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const type = action.dataset.action;

    if (type === 'quit') {
      if (confirm('Exit scenario practice?')) {
        stopAndCleanupRecording();
        navigateTo('scenarios');
      }
    } else if (type === 'continue-qa') {
      state.phase = 'qa';
      state.qaLoading = true;
      renderCurrentPhase();
      await fetchFirstQuestion();
    } else if (type === 're-record') {
      // Clean up and go back to recording
      if (recordingBlobUrl) URL.revokeObjectURL(recordingBlobUrl);
      recordingBlobUrl = null;
      recordingBlob = null;
      elapsedSeconds = 0;
      state.phase = 'recording';
      renderCurrentPhase();
    }
  };
}

// === Q&A PHASE ===

function renderQA() {
  const { scenario, qaMessages, qaRound, qaTotal, qaLoading, feedback } = state;

  container.innerHTML = `
    <div class="screen scenario-practice-screen">
      <div class="scenario-practice-header">
        <button class="btn btn-ghost btn-sm" data-action="quit">✕ Exit</button>
        <div class="scenario-phase-dots">
          <span class="phase-dot completed">✓</span>
          <span class="phase-dot completed">✓</span>
          <span class="phase-dot active"></span>
          <span class="phase-dot"></span>
        </div>
        <span class="label">Q&A (${qaRound}/${qaTotal})</span>
      </div>

      <div class="qa-chat-container">
        <div class="qa-chat-messages" id="qa-messages">
          ${qaMessages.map(msg => `
            <div class="qa-message qa-message-${msg.role}">
              <div class="qa-message-avatar">${msg.role === 'ai' ? '🤖' : '🎤'}</div>
              <div class="qa-message-bubble">${msg.text}</div>
            </div>
          `).join('')}

          ${qaLoading ? `
            <div class="qa-message qa-message-ai">
              <div class="qa-message-avatar">🤖</div>
              <div class="qa-message-bubble qa-typing">
                <span class="qa-typing-dot"></span>
                <span class="qa-typing-dot"></span>
                <span class="qa-typing-dot"></span>
              </div>
            </div>
          ` : ''}
        </div>

        ${!qaLoading && qaRound < qaTotal ? `
          <div class="qa-response-area">
            <div class="qa-response-prompt">Record your response</div>
            <div class="qa-record-controls">
              <button class="btn btn-timer-start btn-block" id="qa-record-btn" data-action="qa-toggle-record">
                🔴 Record Response
              </button>
            </div>
            ${qaRecordingBlobUrl ? `
              <div class="qa-review-response">
                <audio controls src="${qaRecordingBlobUrl}" class="qa-audio-playback"></audio>
                <div class="qa-response-actions">
                  <button class="btn btn-ghost btn-sm" data-action="qa-re-record">↻ Redo</button>
                  <button class="btn btn-primary btn-sm" data-action="qa-submit">Send →</button>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${!qaLoading && qaRound >= qaTotal ? `
          <div class="qa-complete-cta">
            <button class="btn btn-primary btn-block" data-action="finish-qa">
              See Your Feedback →
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Scroll to bottom of messages
  const messagesEl = document.getElementById('qa-messages');
  if (messagesEl) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  container.onclick = async (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const type = action.dataset.action;

    if (type === 'quit') {
      if (confirm('Exit scenario practice?')) {
        stopAndCleanupRecording();
        stopAndCleanupQaRecording();
        navigateTo('scenarios');
      }
    } else if (type === 'qa-toggle-record') {
      if (qaMediaRecorder && qaMediaRecorder.state === 'recording') {
        await stopQaRecording();
        renderCurrentPhase();
      } else {
        const started = await startQaRecording();
        if (started) {
          const btn = document.getElementById('qa-record-btn');
          if (btn) {
            btn.textContent = '⏹ Stop';
            btn.classList.remove('btn-timer-start');
            btn.classList.add('btn-timer-stop');
          }
        }
      }
    } else if (type === 'qa-re-record') {
      if (qaRecordingBlobUrl) URL.revokeObjectURL(qaRecordingBlobUrl);
      qaRecordingBlobUrl = null;
      qaRecordingBlob = null;
      renderCurrentPhase();
    } else if (type === 'qa-submit') {
      await submitQaResponse();
    } else if (type === 'finish-qa') {
      state.phase = 'complete';
      renderCurrentPhase();
    }
  };
}

// === COMPLETE PHASE ===

function renderComplete() {
  const { scenario, qaMessages, feedback } = state;

  // Build feedback display
  const fb = feedback || {};
  const hasScores = fb.scores && typeof fb.scores === 'object';

  container.innerHTML = `
    <div class="screen scenario-practice-screen">
      <div class="scenario-complete">
        <div class="complete-icon">🎉</div>
        <h2 class="complete-title">Scenario Complete!</h2>
        <p class="complete-subtitle">${scenario.name}</p>

        ${fb.summary ? `
          <div class="ai-feedback-card">
            <div class="ai-feedback-header">
              <span>✨</span>
              <span>AI Feedback</span>
            </div>
            <div class="ai-feedback-summary">${escapeHtml(fb.summary)}</div>

            ${hasScores ? `
              <div class="ai-feedback-scores">
                ${renderScoreBar('Confidence', fb.scores.confidence)}
                ${renderScoreBar('Relevance', fb.scores.relevance)}
                ${renderScoreBar('Clarity', fb.scores.clarity)}
                ${renderScoreBar('Engagement', fb.scores.engagement)}
              </div>
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
          </div>
        ` : `
          <div class="card">
            <p class="text-secondary">Feedback couldn't be loaded, but great job practicing!</p>
          </div>
        `}

        <div class="scenario-complete-actions">
          <button class="btn btn-primary btn-block" data-action="done">
            Back to Scenarios
          </button>
          <button class="btn btn-ghost btn-block mt-8" data-action="retry">
            ↻ Try Again
          </button>
        </div>
      </div>
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'done') {
      cleanup();
      navigateTo('scenarios');
    } else if (action.dataset.action === 'retry') {
      cleanup();
      navigateTo('scenario-practice', { scenarioId: state.scenario.id });
    }
  };
}

// === MAIN RECORDING LOGIC ===

async function startCameraPreview() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true,
    });
    const videoEl = document.getElementById('video-preview');
    if (videoEl) videoEl.srcObject = mediaStream;
  } catch (err) {
    console.warn('Camera preview failed:', err);
  }
}

async function startRecording() {
  try {
    if (!mediaStream) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
    }

    recordedChunks = [];
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};
    mediaRecorder = new MediaRecorder(mediaStream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.start(1000);
    return true;
  } catch (err) {
    console.warn('Recording failed:', err);
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

      if (recordingBlobUrl) URL.revokeObjectURL(recordingBlobUrl);
      recordingBlob = blob;
      recordingBlobUrl = URL.createObjectURL(blob);

      stopMediaTracks();
      resolve(recordingBlobUrl);
    };

    mediaRecorder.stop();
  });
}

// === Q&A RECORDING LOGIC ===

async function startQaRecording() {
  try {
    qaMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    qaRecordedChunks = [];

    const mimeType = getSupportedAudioMimeType();
    const options = mimeType ? { mimeType } : {};
    qaMediaRecorder = new MediaRecorder(qaMediaStream, options);

    qaMediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) qaRecordedChunks.push(e.data);
    };

    qaMediaRecorder.start(1000);
    return true;
  } catch (err) {
    console.warn('QA recording failed:', err);
    return false;
  }
}

function stopQaRecording() {
  return new Promise((resolve) => {
    if (!qaMediaRecorder || qaMediaRecorder.state === 'inactive') {
      stopQaMediaTracks();
      resolve(null);
      return;
    }

    qaMediaRecorder.onstop = () => {
      const mimeType = qaMediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(qaRecordedChunks, { type: mimeType });
      qaRecordedChunks = [];

      if (qaRecordingBlobUrl) URL.revokeObjectURL(qaRecordingBlobUrl);
      qaRecordingBlob = blob;
      qaRecordingBlobUrl = URL.createObjectURL(blob);

      stopQaMediaTracks();
      resolve(qaRecordingBlobUrl);
    };

    qaMediaRecorder.stop();
  });
}

// === API CALLS ===

async function fetchFirstQuestion() {
  try {
    const base64 = await blobToBase64(recordingBlob);
    const mimeType = recordingBlob.type || 'video/webm';

    const response = await fetch('/api/scenario-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media: base64,
        mimeType,
        scenarioContext: state.scenario.context,
        aiRole: state.scenario.aiRole,
        scenarioName: state.scenario.name,
        conversationHistory: [],
      }),
    });

    if (!response.ok) throw new Error('Failed to get question');

    const data = await response.json();
    state.qaMessages.push({ role: 'ai', text: data.question });
    state.qaRound = 1;
    state.qaLoading = false;

    if (data.isComplete) {
      state.qaRound = state.qaTotal;
      state.feedback = data.summary || null;
    }
  } catch (err) {
    console.error('Q&A fetch error:', err);
    state.qaMessages.push({ role: 'ai', text: 'Great response! Let me ask you a follow-up — what would you do differently if this situation happened again?' });
    state.qaRound = 1;
    state.qaLoading = false;
  }

  renderCurrentPhase();
}

async function submitQaResponse() {
  if (!qaRecordingBlob) return;

  // Add user message placeholder
  state.qaMessages.push({ role: 'user', text: '🎤 [Audio response]' });
  state.qaLoading = true;
  renderCurrentPhase();

  try {
    const base64 = await blobToBase64(qaRecordingBlob);
    const mimeType = qaRecordingBlob.type || 'audio/webm';

    // Clean up QA recording
    if (qaRecordingBlobUrl) URL.revokeObjectURL(qaRecordingBlobUrl);
    qaRecordingBlobUrl = null;
    qaRecordingBlob = null;

    const response = await fetch('/api/scenario-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media: base64,
        mimeType,
        scenarioContext: state.scenario.context,
        aiRole: state.scenario.aiRole,
        scenarioName: state.scenario.name,
        conversationHistory: state.qaMessages.map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          text: m.text,
        })),
        round: state.qaRound + 1,
        totalRounds: state.qaTotal,
      }),
    });

    if (!response.ok) throw new Error('Failed to get response');

    const data = await response.json();

    state.qaRound++;
    state.qaLoading = false;

    if (data.isComplete || state.qaRound >= state.qaTotal) {
      // Final round — add closing message and feedback
      if (data.question) {
        state.qaMessages.push({ role: 'ai', text: data.question });
      }
      state.qaRound = state.qaTotal;
      state.feedback = data.summary || null;
    } else {
      state.qaMessages.push({ role: 'ai', text: data.question });
    }
  } catch (err) {
    console.error('Q&A submit error:', err);
    state.qaRound++;
    state.qaLoading = false;

    if (state.qaRound >= state.qaTotal) {
      state.qaMessages.push({ role: 'ai', text: 'Great job working through this scenario! You showed strong communication skills.' });
      state.qaRound = state.qaTotal;
    } else {
      state.qaMessages.push({ role: 'ai', text: 'Interesting perspective! Can you elaborate on how you would handle any resistance?' });
    }
  }

  renderCurrentPhase();
}

// === HELPERS ===

function stopMediaTracks() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  mediaRecorder = null;
}

function stopQaMediaTracks() {
  if (qaMediaStream) {
    qaMediaStream.getTracks().forEach(t => t.stop());
    qaMediaStream = null;
  }
  qaMediaRecorder = null;
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
}

function stopAndCleanupQaRecording() {
  if (qaMediaRecorder && qaMediaRecorder.state !== 'inactive') {
    try { qaMediaRecorder.stop(); } catch (e) { /* ignore */ }
  }
  stopQaMediaTracks();
  qaRecordedChunks = [];
  qaRecordingBlob = null;
  if (qaRecordingBlobUrl) {
    URL.revokeObjectURL(qaRecordingBlobUrl);
    qaRecordingBlobUrl = null;
  }
}

function cleanup() {
  clearInterval(timerInterval);
  stopAndCleanupRecording();
  stopAndCleanupQaRecording();
  state = null;
}

function startElapsedTimer() {
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const el = document.getElementById('rec-timer');
    if (el) el.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getSupportedMimeType() {
  const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function getSupportedAudioMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderScoreBar(label, value) {
  if (!value) return '';
  const pct = Math.round((value / 5) * 100);
  return `
    <div class="ai-score">
      <div class="ai-score-label">${label}</div>
      <div class="ai-score-bar">
        <div class="ai-score-fill" style="width: ${pct}%"></div>
      </div>
      <div class="ai-score-value">${value}/5</div>
    </div>
  `;
}

export function cleanupScenarioPractice() {
  cleanup();
}

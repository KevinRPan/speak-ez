/**
 * Interview Practice Screen
 * Manages: Live transcription, audio/video recording, and Q&A interactions
 */

import { navigateTo } from '../lib/router.js';

let state = null;
let container = null;

// Media Recording (audio or video)
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingBlob = null;
let recordingBlobUrl = null;

// Speech Recognition (Live Transcription)
let recognition = null;
let liveTranscript = '';
let finalTranscript = '';

// Timer
let timerInterval = null;
let elapsedSeconds = 0;

export function renderInterviewPractice(cont, data = {}) {
  container = cont;

  // Protect against direct navigation without data
  if (!data.jobDescription) {
    navigateTo('interview-setup');
    return;
  }

  state = {
    interviewType: data.interviewType || 'hiring-manager',
    jobDescription: data.jobDescription,
    jobNotes: data.jobNotes || data.companyContext || '',
    phase: 'qa', // 'qa', 'complete'
    qaMessages: [],
    qaRound: 0,
    qaTotal: 4, // 4 rounds of interview questions
    qaLoading: true,
    feedback: null,
    isRecording: false,
    recordingKind: getInitialRecordingKind(),
    videoSupported: supportsVideoCapture(),
  };

  if (state.recordingKind === 'video' && !state.videoSupported) {
    state.recordingKind = 'audio';
  }

  elapsedSeconds = 0;
  cleanup();
  
  // Set up Speech Recognition if available
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      liveTranscript = finalTranscript + interim;
      updateTranscriptionUI();
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error', event.error);
    };
  }

  renderCurrentPhase();
  fetchFirstQuestion();
}

function renderCurrentPhase() {
  if (!state || !container) return;
  clearInterval(timerInterval);

  if (state.phase === 'qa') renderQA();
  else if (state.phase === 'complete') renderComplete();
}

// === QA PHASE ===

function renderQA() {
  const { qaMessages, qaRound, qaTotal, qaLoading, isRecording } = state;
  const canUseVideo = state.videoSupported;
  const isVideo = state.recordingKind === 'video';

  container.innerHTML = `
    <div class="screen interview-practice-screen" style="display: flex; flex-direction: column; height: 100%;">
      <div class="scenario-practice-header">
        <button class="btn btn-ghost btn-sm" data-action="quit">✕ Exit</button>
        <div class="scenario-phase-dots">
          ${Array(qaTotal).fill(0).map((_, i) => 
            `<span class="phase-dot ${i < qaRound ? 'completed' : (i === qaRound ? 'active' : '')}">${i < qaRound ? '✓' : ''}</span>`
          ).join('')}
        </div>
        <span class="label">Interview (Q${Math.min(qaRound + 1, qaTotal)}/${qaTotal})</span>
      </div>

      <div class="qa-chat-container" style="flex: 1; display: flex; flex-direction: column;">
        <div class="qa-chat-messages" id="interview-messages" style="flex: 1; overflow-y: auto;">
          ${qaMessages.map(msg => `
            <div class="qa-message qa-message-${msg.role}">
              <div class="qa-message-avatar">${msg.role === 'ai' ? '🤖' : '🎤'}</div>
              <div class="qa-message-bubble">${escapeHtml(msg.text)}</div>
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
          <div class="interview-response-area card mt-12" style="background: var(--bg-elevated); margin-top: 16px;">
            ${!isRecording ? `
              <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                <label class="label" style="margin: 0;">Recording Mode</label>
                <select class="form-input" data-action="set-recording-kind" style="max-width: 180px; padding: 8px 10px;">
                  <option value="audio" ${!isVideo ? 'selected' : ''}>Audio</option>
                  ${canUseVideo ? `<option value="video" ${isVideo ? 'selected' : ''}>Video + Audio</option>` : ''}
                </select>
              </div>
            ` : ''}

            ${!isRecording ? `
              <div style="margin-bottom: 12px;">
                <button class="btn btn-secondary btn-block" data-action="upload-recording">📤 Upload Recording Instead</button>
                <input id="interview-upload-input" type="file" accept="video/*,audio/*" style="display:none;" />
              </div>
            ` : ''}

            ${isRecording ? `
              ${isVideo ? `
                <div class="card" style="margin-bottom: 12px; overflow: hidden; padding: 0;">
                  <video id="live-video-preview" autoplay muted playsinline style="display: block; width: 100%; max-height: 220px; background: #000;"></video>
                </div>
              ` : ''}
              <div class="live-transcription-box mb-12" style="min-height: 50px; font-size: 0.95rem; color: var(--text-secondary); font-style: italic;">
                <span id="live-text">Listening...</span>
              </div>
            ` : ''}
            
            <div class="qa-record-controls" style="display: flex; align-items: center; gap: 12px;">
              ${!isRecording ? `
                <button class="btn btn-timer-start btn-block" data-action="toggle-record">
                  🔴 Answer Question
                </button>
              ` : `
                <div class="recording-timer" id="interview-timer" style="font-weight: bold; width: 60px; text-align: center;">0:00</div>
                <button class="btn btn-timer-stop btn-block" data-action="toggle-record">
                  ⏹ Finish Answer
                </button>
              `}
            </div>
            
            ${recordingBlobUrl && !isRecording ? `
              <div class="qa-review-response mt-12" style="margin-top: 16px;">
                ${recordingBlob?.type?.startsWith('video/')
                  ? `<video controls playsinline src="${recordingBlobUrl}" style="width: 100%; max-height: 280px; margin-bottom: 8px; background: #000;"></video>`
                  : `<audio controls src="${recordingBlobUrl}" style="width: 100%; margin-bottom: 8px;"></audio>`
                }
                <div class="qa-response-actions" style="display: flex; gap: 8px;">
                  <button class="btn btn-ghost" style="flex: 1;" data-action="re-record">↻ Redo</button>
                  <button class="btn btn-primary" style="flex: 2;" data-action="submit">Submit Answer →</button>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${!qaLoading && qaRound >= qaTotal ? `
          <div class="qa-complete-cta mt-16" style="margin-top: 16px;">
            <button class="btn btn-primary btn-block btn-lg" data-action="finish-interview">
              See Interview Feedback →
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Scroll to bottom of messages
  const messagesEl = document.getElementById('interview-messages');
  if (messagesEl) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  const uploadInput = document.getElementById('interview-upload-input');
  if (uploadInput) {
    uploadInput.addEventListener('change', async () => {
      const file = uploadInput.files?.[0];
      if (!file) return;
      await handleUploadedAnswer(file);
      uploadInput.value = '';
    });
  }

  if (isRecording && isVideo && mediaStream) {
    const previewEl = document.getElementById('live-video-preview');
    if (previewEl) previewEl.srcObject = mediaStream;
  }

  container.onclick = async (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const type = action.dataset.action;

    if (type === 'quit') {
      if (confirm('Exit interview practice? Your progress will be lost.')) {
        cleanup();
        navigateTo('interview-setup');
      }
    } else if (type === 'toggle-record') {
      if (state.isRecording) {
        await stopRecording();
        state.isRecording = false;
        renderCurrentPhase();
      } else {
        const started = await startRecording();
        if (started) {
          state.isRecording = true;
          renderCurrentPhase();
        }
      }
    } else if (type === 're-record') {
      if (recordingBlobUrl) URL.revokeObjectURL(recordingBlobUrl);
      recordingBlobUrl = null;
      recordingBlob = null;
      liveTranscript = '';
      finalTranscript = '';
      renderCurrentPhase();
    } else if (type === 'set-recording-kind') {
      const nextKind = action.value === 'video' ? 'video' : 'audio';
      if (nextKind === 'video' && !state.videoSupported) return;
      state.recordingKind = nextKind;
      localStorage.setItem('speak_ez_interview_recording_kind', nextKind);
      if (recordingBlobUrl) {
        URL.revokeObjectURL(recordingBlobUrl);
        recordingBlobUrl = null;
      }
      recordingBlob = null;
      renderCurrentPhase();
    } else if (type === 'upload-recording') {
      const input = document.getElementById('interview-upload-input');
      if (input) input.click();
    } else if (type === 'submit') {
      await submitAnswer();
    } else if (type === 'finish-interview') {
      state.phase = 'complete';
      renderCurrentPhase();
    }
  };
}

// === COMPLETE PHASE ===

function renderComplete() {
  const { feedback } = state;

  const fb = feedback || {};
  const hasScores = fb.scores && typeof fb.scores === 'object';

  container.innerHTML = `
    <div class="screen">
      <div class="scenario-complete" style="text-align: center;">
        <div class="complete-icon" style="font-size: 4rem; margin-bottom: 12px;">🏆</div>
        <h2 class="complete-title h1 mb-8">Interview Complete!</h2>
        <p class="complete-subtitle text-secondary mb-20">You completed ${state.qaTotal} rounds</p>

        ${fb.summary ? `
          <div class="ai-feedback-card card" style="text-align: left; margin-bottom: 24px;">
            <div class="ai-feedback-header" style="display: flex; gap: 8px; font-weight: 700; color: var(--accent); margin-bottom: 12px;">
              <span>✨</span>
              <span>Interviewer Feedback</span>
            </div>
            <div class="ai-feedback-summary" style="line-height: 1.5; margin-bottom: 16px;">${escapeHtml(fb.summary)}</div>

            ${hasScores ? `
              <div class="ai-feedback-scores" style="display: grid; gap: 8px; margin-bottom: 20px;">
                ${renderScoreBar('Technical Depth', fb.scores.technicalDepth || fb.scores.relevance)}
                ${renderScoreBar('Communication', fb.scores.communication || fb.scores.clarity)}
                ${renderScoreBar('Confidence', fb.scores.confidence)}
              </div>
            ` : ''}

            ${fb.strengths?.length ? `
              <div class="ai-feedback-list" style="margin-bottom: 16px;">
                <div class="ai-feedback-list-title label" style="margin-bottom: 8px; color: var(--success);">Strong Points</div>
                ${fb.strengths.map(s => `<div class="ai-feedback-item strength" style="padding: 8px; background: var(--success-dim); border-radius: 6px; margin-bottom: 4px; font-size: 0.9rem;">+ ${escapeHtml(s)}</div>`).join('')}
              </div>
            ` : ''}

            ${fb.improvements?.length ? `
              <div class="ai-feedback-list">
                <div class="ai-feedback-list-title label" style="margin-bottom: 8px; color: var(--warning);">Areas to Improve</div>
                ${fb.improvements.map(i => `<div class="ai-feedback-item improvement" style="padding: 8px; background: rgba(253, 203, 110, 0.15); border-radius: 6px; margin-bottom: 4px; font-size: 0.9rem;">- ${escapeHtml(i)}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="card mb-20">
            <p class="text-secondary">Feedback couldn't be loaded, but great job practicing!</p>
          </div>
        `}

        <button class="btn btn-primary btn-block mb-12" data-action="done">
          Back to Setup
        </button>
      </div>
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'done') {
      cleanup();
      navigateTo('interview-setup');
    }
  };
}

// === RECORDING ===

async function startRecording() {
  try {
    const wantsVideo = state.recordingKind === 'video' && state.videoSupported;
    const constraints = wantsVideo
      ? { audio: true, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }
      : { audio: true, video: false };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    recordedChunks = [];
    
    // Reset transcripts
    liveTranscript = '';
    finalTranscript = '';

    const mimeType = getSupportedMediaMimeType(wantsVideo ? 'video' : 'audio');
    const options = mimeType ? { mimeType } : {};
    mediaRecorder = new MediaRecorder(mediaStream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.start(1000);
    
    if (recognition) {
      try { recognition.start(); } catch (e) {}
    }

    startElapsedTimer();
    return true;
  } catch (err) {
    console.warn('QA recording failed:', err);
    alert('Camera/microphone access is required to record your answer.');
    return false;
  }
}

function stopRecording() {
  return new Promise((resolve) => {
    clearInterval(timerInterval);
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      stopMediaTracks();
      resolve(null);
      return;
    }

    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType || (state.recordingKind === 'video' ? 'video/webm' : 'audio/webm');
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

function updateTranscriptionUI() {
  const el = document.getElementById('live-text');
  if (el) {
    el.textContent = liveTranscript || 'Listening...';
  }
}

// === API SYNC ===

async function fetchFirstQuestion() {
  try {
    const response = await fetch('/api/interview-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewType: state.interviewType,
        jobDescription: state.jobDescription,
        jobNotes: state.jobNotes,
        conversationHistory: [],
        round: 1,
        totalRounds: state.qaTotal,
      }),
    });

    if (!response.ok) throw new Error('Failed to get question');

    const data = await response.json();
    state.qaMessages.push({ role: 'ai', text: data.question });
    state.qaLoading = false;
  } catch (err) {
    console.error('Interview fetch error:', err);
    state.qaMessages.push({ role: 'ai', text: "Let's start. Can you tell me about your background and how it relates to this role?" });
    state.qaLoading = false;
  }

  renderCurrentPhase();
}

async function submitAnswer() {
  if (!recordingBlob) return;

  const userText = liveTranscript.trim() ? liveTranscript : (state.recordingKind === 'video' ? '[Video response]' : '[Audio response]');
  state.qaMessages.push({ role: 'user', text: userText });
  state.qaLoading = true;
  renderCurrentPhase();

  try {
    const base64 = await blobToBase64(recordingBlob);
    const mimeType = recordingBlob.type || 'audio/webm';

    // Clean up
    if (recordingBlobUrl) URL.revokeObjectURL(recordingBlobUrl);
    recordingBlobUrl = null;
    recordingBlob = null;
    liveTranscript = '';
    finalTranscript = '';

    // round sent to the API (1-indexed: opening=1, first follow-up=2, etc.)
    const apiRound = state.qaRound + 2;

    const response = await fetch('/api/interview-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media: base64,
        mimeType,
        textFallback: userText, // Pass transcript as well
        interviewType: state.interviewType,
        jobDescription: state.jobDescription,
        jobNotes: state.jobNotes,
        conversationHistory: state.qaMessages.map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          text: m.text,
        })),
        round: apiRound,
        totalRounds: state.qaTotal,
      }),
    });

    if (!response.ok) throw new Error('Failed to process answer');

    const data = await response.json();

    state.qaRound++;
    state.qaLoading = false;

    // Complete if: API says so, client round count reached, OR API was told this was the last round
    const shouldComplete = data.isComplete || state.qaRound >= state.qaTotal || apiRound >= state.qaTotal;

    if (shouldComplete) {
      if (data.question) {
        state.qaMessages.push({ role: 'ai', text: data.question });
      }
      state.qaRound = state.qaTotal;
      state.feedback = data.summary || null;
    } else {
      state.qaMessages.push({ role: 'ai', text: data.question });
    }
  } catch (err) {
    console.error('Interview submit error:', err);
    state.qaRound++;
    state.qaLoading = false;

    if (state.qaRound >= state.qaTotal) {
      state.qaMessages.push({ role: 'ai', text: 'Thank you, we will be in touch.' });
      state.qaRound = state.qaTotal;
    } else {
      state.qaMessages.push({ role: 'ai', text: 'Interesting. Could you give an example of a challenge you faced doing that?' });
    }
  }

  renderCurrentPhase();
}

async function handleUploadedAnswer(file) {
  try {
    if (recordingBlobUrl) {
      URL.revokeObjectURL(recordingBlobUrl);
      recordingBlobUrl = null;
    }

    recordingBlob = file;
    recordingBlobUrl = URL.createObjectURL(file);
    liveTranscript = '';
    finalTranscript = '';
    renderCurrentPhase();
  } catch (err) {
    console.warn('Failed to load uploaded answer:', err);
    alert('Could not read this file. Please try another audio/video recording.');
  }
}

// === HELPERS ===

function stopMediaTracks() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  mediaRecorder = null;
}

function cleanup() {
  clearInterval(timerInterval);
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }
  
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (e) {}
  }
  stopMediaTracks();
  
  recordedChunks = [];
  recordingBlob = null;
  if (recordingBlobUrl) {
    URL.revokeObjectURL(recordingBlobUrl);
    recordingBlobUrl = null;
  }
  
  liveTranscript = '';
  finalTranscript = '';
}

export function cleanupInterviewPractice() {
  cleanup();
  state = null;
}

function startElapsedTimer() {
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const el = document.getElementById('interview-timer');
    if (el) el.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + s.toString().padStart(2, '0');
}

function getSupportedMediaMimeType(kind) {
  const types = kind === 'video'
    ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function supportsVideoCapture() {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
}

function getInitialRecordingKind() {
  const stored = localStorage.getItem('speak_ez_interview_recording_kind');
  return stored === 'video' ? 'video' : 'audio';
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
    <div class="ai-score" style="margin-bottom: 8px;">
      <div class="ai-score-label" style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>${label}</span>
        <span>${value}/5</span>
      </div>
      <div class="ai-score-bar" style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
        <div class="ai-score-fill" style="width: ${pct}%; height: 100%; background: var(--accent); transition: width 0.5s;"></div>
      </div>
    </div>
  `;
}

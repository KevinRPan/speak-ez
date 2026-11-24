/**
 * Isolation — speak for five minutes on one topic, then review the same
 * take three times: ears only, eyes only, then the words.
 */

import { navigateTo } from '../lib/router.js';
import { pageHeader } from '../ui/chrome.js';
import { ISOLATION_SECONDS, ISOLATION_TOPICS } from '../data/isolation.js';
import { buildIsolationReview, formatClock } from '../utils/isolation-review.js';
import { recordPracticeSession } from '../utils/practice-log.js';
import { loadAll, saveAll, getUser } from '../utils/storage.js';
import { getLevelInfo, getDisplayStreak } from '../utils/xp.js';
import { isolationLogCard } from '../ui/isolation-log.js';

const PASS_INTRO = {
  audio: {
    kicker: 'Pass 1 of 3',
    title: 'Ears only',
    lead: 'The picture stays off. Listen for sound that does not carry the idea.',
    spotsHeading: 'Spots to replay',
    spotsLead: 'Replay these. Each one names the moment and the question.',
    emptySpots: 'No moments were marked on a timeline. Captions did not catch words, so listen for the list below. Mouth noises never show up in a transcript either way.',
    caught: 'I heard this',
    note: 'The lip smack before every new point, around a minute in.',
    next: 'Next: eyes',
  },
  visual: {
    kicker: 'Pass 2 of 3',
    title: 'Eyes only',
    lead: 'The sound stays off. Watch for movement that does not illustrate the words.',
    spotsHeading: 'Windows to watch',
    spotsLead: 'Stop on the open, the middle, and the close. The question names what to look at in that window.',
    emptySpots: '',
    caught: 'I saw this',
    note: 'I touch my collar every time I search for a word.',
    next: 'Next: words',
  },
  structure: {
    kicker: 'Pass 3 of 3',
    title: 'Words only',
    lead: 'Read the take as content. Judge the shape, not the voice and not the face.',
    spotsHeading: 'Parts to read',
    spotsLead: 'Read the quoted part, then answer the question before you move on.',
    emptySpots: '',
    caught: 'This needs a change',
    note: 'The point showed up in minute four. The last line faded.',
    next: 'Save this rep',
  },
};

const BRIEF_STEPS = [
  ['Ears', 'Playback with the picture off. Fillers, mouth noises, pitch that does not mean anything, rushing, abandoned lines.'],
  ['Eyes', 'The picture with the sound off. Gaze, hands, sway, a face that runs on a loop, posture at the end versus the start. You stop on the open, the middle, and the close.'],
  ['Words', 'The transcript. The opening, the last line, repeats, and whether there is a concrete scene.'],
];

let root = null;
let state = null;
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let blobUrl = null;
let recognition = null;
let captionsOn = false;
let timer = null;
let recordStartedAt = 0;
let stopping = false;

export function renderIsolation(container) {
  releaseAll();
  root = container;
  state = freshState();
  render();
}

export function cleanupIsolation() {
  releaseAll();
  setChrome(true);
  if (root) root.onclick = null;
  root = null;
  state = null;
}

function freshState() {
  return {
    phase: 'brief',
    topic: null,
    topicId: null,
    topicOffset: 0,
    customDraft: '',
    cameraReady: false,
    cameraError: '',
    count: 3,
    elapsed: 0,
    duration: 0,
    segments: [],
    captions: false,
    recordingUrl: null,
    review: null,
    notes: { audio: '', visual: '', structure: '' },
    caught: { audio: {}, visual: {}, structure: {} },
    savedSession: null,
    saveError: '',
  };
}

function render() {
  if (!root || !state) return;
  const immersive = ['countdown', 'record', 'audio', 'visual', 'structure'].includes(state.phase);
  setChrome(!immersive);
  const views = {
    brief: renderBrief,
    topic: renderTopic,
    arm: renderArm,
    countdown: renderCountdown,
    record: renderRecord,
    audio: () => renderPass('audio'),
    visual: () => renderPass('visual'),
    structure: () => renderPass('structure'),
    done: renderDone,
  };
  root.innerHTML = views[state.phase]();
  root.onclick = onClick;
  const scroller = root.closest('.screen-container') || document.querySelector('.screen-container');
  if (scroller) scroller.scrollTop = 0;
  afterRender();
}

function afterRender() {
  if (['arm', 'countdown', 'record'].includes(state.phase)) attachPreview();
  if (state.phase === 'audio' || state.phase === 'visual') bindPlayer(state.phase);
  if (state.phase === 'topic') bindTopic();
  if (PASS_INTRO[state.phase]) {
    const note = document.getElementById('iso-note');
    if (note) note.value = state.notes[state.phase] || '';
  }
}

function renderBrief() {
  return `
    <div class="screen">
      ${pageHeader({
        kicker: 'Train',
        title: 'Isolation',
        subtitle: 'Speak for five minutes on one topic. Then review the same take three times: ears, then eyes, then the words.',
      })}
      <div class="card mb-16">
        <p class="iso-lead">You speak once. Each review gives you one channel, so a tic cannot hide inside a good idea, and a good idea cannot hide a tic.</p>
        <ol class="iso-steps">
          ${BRIEF_STEPS.map(([name, copy], index) => `
            <li>
              <span class="iso-step-index">${index + 1}</span>
              <span>
                <span class="iso-step-name">${name}</span>
                <span class="iso-step-copy">${copy}</span>
              </span>
            </li>
          `).join('')}
        </ol>
      </div>
      <button class="btn btn-primary btn-block" type="button" id="iso-to-topics" data-action="to-topics">Choose a topic</button>
    </div>
  `;
}

function renderTopic() {
  const topics = topicsOnScreen();
  return `
    <div class="screen">
      ${pageHeader({
        kicker: 'Isolation',
        title: 'Pick the topic',
        subtitle: 'You will talk for five minutes. Stay on it. If you blank, hold the silence and find the next true sentence.',
      })}
      <div class="iso-topics">
        ${topics.map(topic => `
          <button
            type="button"
            class="iso-topic ${state.topicId === topic.id ? 'is-selected' : ''}"
            data-action="pick-topic"
            data-topic="${esc(topic.id)}"
            aria-pressed="${state.topicId === topic.id ? 'true' : 'false'}"
          >
            <span class="iso-topic-title">${esc(topic.title)}</span>
            <span class="iso-topic-prompt">${esc(topic.prompt)}</span>
          </button>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-sm iso-shuffle" type="button" data-action="shuffle-topics">Different topics</button>
      <label class="label iso-custom-label" for="iso-custom">Or use your own</label>
      <textarea id="iso-custom" class="form-input" rows="2" placeholder="A decision you are in the middle of"></textarea>
      <p class="iso-hint">If you type here, this is the topic you will speak on.</p>
      <div class="iso-dock">
        <button class="btn btn-primary btn-block" type="button" id="iso-begin" data-action="begin-arm" disabled>Set up the camera</button>
        <button class="btn btn-ghost btn-block iso-follow" type="button" data-action="back-brief">Back</button>
      </div>
    </div>
  `;
}

function renderArm() {
  const topic = state.topic;
  return `
    <div class="screen">
      ${pageHeader({
        kicker: 'Isolation',
        title: topic.title,
        subtitle: 'Step back until your head and your hands are in frame. The second review is the picture.',
      })}
      <div class="prompt-card">
        <div class="iso-prompt">${esc(topic.prompt)}</div>
      </div>
      ${state.cameraReady ? `
        <div class="iso-frame-wrap">
          <video id="iso-preview" class="iso-preview" autoplay muted playsinline></video>
        </div>
        <p class="iso-hint">You will not get notes during the five minutes. Hold the topic, then talk.</p>
        <div class="iso-dock">
          <button class="btn btn-primary btn-block" type="button" id="iso-start" data-action="start-countdown">Start the five minutes</button>
          <button class="btn btn-ghost btn-block iso-follow" type="button" data-action="back-topic">Back</button>
        </div>
      ` : `
        <div class="iso-dock">
          <button class="btn btn-primary btn-block" type="button" id="iso-camera" data-action="enable-camera">Turn on camera and mic</button>
          ${state.cameraError ? `<p class="iso-error">${esc(state.cameraError)}</p>` : ''}
          <button class="btn btn-ghost btn-block iso-follow" type="button" data-action="back-topic">Back</button>
        </div>
      `}
    </div>
  `;
}

function renderCountdown() {
  return `
    <div class="screen iso-immerse">
      <div class="iso-pass-head">
        <button class="btn btn-ghost btn-sm" type="button" data-action="cancel-countdown">Cancel</button>
        <span class="label">${esc(state.topic.title)}</span>
      </div>
      <div class="iso-frame-wrap">
        <video id="iso-preview" class="iso-preview" autoplay muted playsinline></video>
        <div class="iso-count" id="iso-count">${state.count}</div>
      </div>
      <p class="iso-hint">Look at the lens. Start on the point, not on a warmup.</p>
    </div>
  `;
}

function renderRecord() {
  return `
    <div class="screen iso-immerse">
      <div class="iso-pass-head">
        <button class="btn btn-ghost btn-sm" type="button" data-action="leave">Leave</button>
        <span class="iso-rec-pill">
          <span class="recording-dot"></span>
          REC
        </span>
      </div>
      <div class="iso-frame-wrap">
        <video id="iso-preview" class="iso-preview" autoplay muted playsinline></video>
      </div>
      <div class="prompt-card">
        <div class="iso-topic-title">${esc(state.topic.title)}</div>
        <div class="iso-prompt">${esc(state.topic.prompt)}</div>
      </div>
      <div class="timer-display running" id="iso-timer">${formatClock(ISOLATION_SECONDS)}</div>
      <div class="workout-progress-bar">
        <div class="workout-progress-fill" id="iso-record-bar" style="width: 0%"></div>
      </div>
      <p class="iso-hint" id="iso-captions">${state.captions
        ? 'Captions are on for the words review.'
        : 'This browser will not caption the take. You will review the words from memory.'}</p>
      <button class="btn btn-timer-stop btn-block" type="button" id="iso-finish" data-action="finish-take">Finish and review</button>
    </div>
  `;
}

function renderPass(pass) {
  const intro = PASS_INTRO[pass];
  const review = state.review;
  const bundle = review ? review[pass] : { checks: [], spots: [] };
  return `
    <div class="screen iso-immerse">
      <div class="iso-pass-head">
        <button class="btn btn-ghost btn-sm" type="button" data-action="leave">Leave</button>
        <span class="label">${esc(intro.kicker)}</span>
        ${pass === 'audio'
          ? '<span></span>'
          : '<button class="btn btn-ghost btn-sm" type="button" data-action="back-pass">Back</button>'}
      </div>
      <h1 class="page-title">${esc(intro.title)}</h1>
      <p class="page-sub">${esc(intro.lead)}</p>
      ${pass === 'structure' ? '' : playerHtml(pass)}
      <div class="label iso-h">${esc(intro.spotsHeading)}</div>
      <p class="iso-hint">${esc(intro.spotsLead)}</p>
      ${spotsHtml(pass, bundle.spots, intro.emptySpots)}
      ${pass === 'structure' ? transcriptHtml(review) : ''}
      <div class="label iso-h">What to pay attention to</div>
      ${bundle.checks.map(check => checkHtml(pass, check, intro.caught)).join('')}
      <label class="label iso-h" for="iso-note">The spot I want to remember</label>
      <textarea id="iso-note" class="form-input" rows="3" maxlength="500" placeholder="${esc(intro.note)}"></textarea>
      ${state.saveError ? `<p class="iso-error">${esc(state.saveError)}</p>` : ''}
      <button class="btn btn-primary btn-block iso-next" type="button" data-action="next-pass">${esc(intro.next)}</button>
    </div>
  `;
}

function renderDone() {
  const session = state.savedSession;
  const iso = session?.isolation;
  const xp = session?.xpEarned ?? 0;
  return `
    <div class="screen">
      ${pageHeader({
        kicker: 'Logged',
        title: 'Isolation rep saved',
        subtitle: iso?.topicTitle || state.topic?.title || 'Isolation',
      })}
      <div class="iso-stats mb-16">
        <div class="stat-card">
          <div class="stat-value">${formatClock(state.duration)}</div>
          <div class="stat-label">spoken</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">3</div>
          <div class="stat-label">reviews</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">+${xp}</div>
          <div class="stat-label">XP</div>
        </div>
      </div>
      ${iso ? isolationLogCard({ type: 'isolation', isolation: iso }) : ''}
      <button class="btn btn-primary btn-block" type="button" data-action="another">Another topic</button>
      <button class="btn btn-ghost btn-block iso-follow" type="button" data-action="go-home">Home</button>
    </div>
  `;
}

function playerHtml(pass) {
  if (!state.recordingUrl) {
    return `<div class="card iso-missing">No recording on this take. Walk the questions from memory.</div>`;
  }
  const visual = pass === 'visual';
  return `
    <div class="iso-player">
      ${visual ? `
        <div class="iso-frame-wrap">
          <video id="iso-video" class="iso-video-visible" playsinline preload="auto" muted></video>
          <div class="iso-sound-off">Sound off</div>
        </div>
      ` : `
        <audio id="iso-audio" class="iso-audio-el" preload="auto"></audio>
        <div class="iso-audio-face">
          <div class="iso-audio-kicker">Picture off</div>
          <p>Listen. If you start replaying the look of it in your head, close your eyes.</p>
        </div>
      `}
      <div class="iso-transport">
        <button type="button" class="btn btn-secondary" id="iso-play">Play</button>
        <input id="iso-scrub" type="range" min="0" max="1000" value="0" aria-label="Position in the take">
        <span id="iso-clock" class="iso-clock">0:00</span>
      </div>
      <p class="iso-play-error" id="iso-play-error"></p>
    </div>
  `;
}

function spotsHtml(pass, spots, emptyCopy) {
  if (!spots?.length) {
    return emptyCopy ? `<div class="card iso-missing">${esc(emptyCopy)}</div>` : '';
  }
  return spots.map(spot => `
    <article class="iso-spot" data-spot-t="${Number(spot.t) || 0}">
      <div class="iso-spot-top">
        <div>
          <div class="iso-spot-title">${esc(spot.title)}</div>
          ${spot.window ? `<div class="iso-spot-window">${esc(spot.window)}</div>` : ''}
        </div>
        ${pass === 'structure' ? '' : `
          <button type="button" class="iso-spot-jump" data-action="seek" data-t="${Number(spot.t) || 0}">
            Play ${esc(spot.clock || '0:00')}
          </button>
        `}
      </div>
      ${spot.detail ? `<p class="iso-spot-detail">${esc(spot.detail)}</p>` : ''}
      ${quoteHtml(spot.quote)}
      <p class="iso-kicker">Ask yourself</p>
      <p class="iso-spot-question">${esc(spot.question)}</p>
    </article>
  `).join('');
}

function quoteHtml(quote) {
  if (!quote) return '';
  return String(quote)
    .split('\n')
    .filter(Boolean)
    .map(line => `<blockquote class="iso-quote">${esc(line)}</blockquote>`)
    .join('');
}

function checkHtml(pass, check, caughtLabel) {
  const on = !!state.caught[pass]?.[check.id];
  return `
    <button
      type="button"
      class="iso-check ${on ? 'is-on' : ''}"
      data-action="catch"
      data-id="${esc(check.id)}"
      aria-pressed="${on ? 'true' : 'false'}"
    >
      <span class="iso-check-title">${esc(check.title)}</span>
      <span class="iso-kicker">Pay attention to</span>
      <span class="iso-check-q">${esc(check.question)}</span>
      <span class="iso-kicker">Ask yourself</span>
      <span class="iso-check-ask">${esc(check.ask)}</span>
      <span class="iso-caught-label">${esc(caughtLabel)}</span>
    </button>
  `;
}

function transcriptHtml(review) {
  if (!review?.transcript) {
    return '';
  }
  const words = review.analysis?.wordCount || 0;
  return `
    <div class="label iso-h">Full transcript</div>
    <div class="iso-transcript">
      <div class="iso-transcript-meta">${words} words in ${formatClock(state.duration)}</div>
      <div class="iso-transcript-body">${esc(review.transcript)}</div>
    </div>
  `;
}

function onClick(event) {
  const action = event.target.closest('[data-action]');
  if (!action || !root?.contains(action) || !state) return;
  const type = action.dataset.action;

  if (type === 'to-topics') {
    state.phase = 'topic';
    render();
  } else if (type === 'back-brief') {
    state.phase = 'brief';
    render();
  } else if (type === 'shuffle-topics') {
    state.customDraft = document.getElementById('iso-custom')?.value || '';
    state.topicOffset += 3;
    render();
  } else if (type === 'pick-topic') {
    state.topicId = action.dataset.topic;
    state.customDraft = document.getElementById('iso-custom')?.value || '';
    if ((state.customDraft || '').trim().length >= 3) {
      state.customDraft = '';
      const field = document.getElementById('iso-custom');
      if (field) field.value = '';
    }
    root.querySelectorAll('[data-action="pick-topic"]').forEach(button => {
      const on = button.dataset.topic === state.topicId;
      button.classList.toggle('is-selected', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    syncBegin();
  } else if (type === 'begin-arm') {
    if (!chooseTopic()) return;
    state.phase = 'arm';
    render();
  } else if (type === 'back-topic') {
    stopStream();
    state.phase = 'topic';
    render();
  } else if (type === 'enable-camera') {
    enableCamera();
  } else if (type === 'start-countdown') {
    startCountdown();
  } else if (type === 'cancel-countdown') {
    if (timer) clearInterval(timer);
    timer = null;
    state.phase = 'arm';
    render();
  } else if (type === 'finish-take') {
    finishRecording({ auto: false });
  } else if (type === 'leave') {
    leave();
  } else if (type === 'back-pass') {
    stashNote(state.phase);
    const order = ['audio', 'visual', 'structure'];
    const index = order.indexOf(state.phase);
    if (index > 0) {
      state.phase = order[index - 1];
      render();
    }
  } else if (type === 'next-pass') {
    stashNote(state.phase);
    if (state.phase === 'audio') state.phase = 'visual';
    else if (state.phase === 'visual') state.phase = 'structure';
    else {
      saveRep();
      if (state.saveError) {
        render();
        return;
      }
      state.phase = 'done';
    }
    render();
  } else if (type === 'seek') {
    seekTo(Number(action.dataset.t) || 0);
  } else if (type === 'catch') {
    toggleCatch(action);
  } else if (type === 'another') {
    releaseAll();
    state = freshState();
    state.phase = 'topic';
    render();
  } else if (type === 'go-home') {
    navigateTo('home');
  }
}

function topicsOnScreen() {
  const count = Math.min(3, ISOLATION_TOPICS.length);
  const start = state.topicOffset % ISOLATION_TOPICS.length;
  const topics = [];
  for (let i = 0; i < count; i += 1) {
    topics.push(ISOLATION_TOPICS[(start + i) % ISOLATION_TOPICS.length]);
  }
  return topics;
}

function bindTopic() {
  const field = document.getElementById('iso-custom');
  if (!field) return;
  field.value = state.customDraft || '';
  field.addEventListener('input', () => {
    state.customDraft = field.value;
    if (field.value.trim().length >= 3 && state.topicId) {
      state.topicId = null;
      root.querySelectorAll('[data-action="pick-topic"]').forEach(button => {
        button.classList.remove('is-selected');
        button.setAttribute('aria-pressed', 'false');
      });
    }
    syncBegin();
  });
  syncBegin();
}

function syncBegin() {
  const button = document.getElementById('iso-begin');
  if (!button) return;
  const custom = (document.getElementById('iso-custom')?.value || '').trim();
  button.disabled = custom.length < 3 && !state.topicId;
}

function chooseTopic() {
  const custom = (document.getElementById('iso-custom')?.value || state.customDraft || '').trim();
  if (custom.length >= 3) {
    const prompt = clipPlain(custom, 280);
    state.topic = { id: 'custom', title: clipPlain(custom, 80), prompt };
    return true;
  }
  const picked = ISOLATION_TOPICS.find(topic => topic.id === state.topicId);
  if (!picked) return false;
  state.topic = picked;
  return true;
}

async function enableCamera() {
  state.cameraError = '';
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    state.cameraReady = true;
    render();
  } catch {
    state.cameraReady = false;
    state.cameraError = 'Camera and microphone are required. This drill reviews the picture and the sound.';
    render();
  }
}

function attachPreview() {
  const video = document.getElementById('iso-preview');
  if (!video || !mediaStream) return;
  video.srcObject = mediaStream;
  video.muted = true;
  video.playsInline = true;
  video.play().catch(() => {});
}

function startCountdown() {
  if (!mediaStream) return;
  state.phase = 'countdown';
  state.count = 3;
  render();
  timer = setInterval(() => {
    if (!state || state.phase !== 'countdown') return;
    state.count -= 1;
    if (state.count <= 0) {
      clearInterval(timer);
      timer = null;
      beginTake();
      return;
    }
    const el = document.getElementById('iso-count');
    if (el) el.textContent = String(state.count);
  }, 1000);
}

function beginTake() {
  if (!mediaStream || !state) return;
  stopping = false;
  recordedChunks = [];
  state.segments = [];
  state.captions = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const mimeType = supportedMime();
  try {
    mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
  } catch {
    state.cameraError = 'This browser could not start the recording.';
    state.phase = 'arm';
    render();
    return;
  }
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) recordedChunks.push(event.data);
  };
  mediaRecorder.start(1000);
  recordStartedAt = Date.now();
  state.elapsed = 0;
  state.phase = 'record';
  render();
  startCaptions();
  timer = setInterval(() => {
    if (!state || state.phase !== 'record') return;
    const elapsed = (Date.now() - recordStartedAt) / 1000;
    state.elapsed = elapsed;
    const left = Math.max(0, ISOLATION_SECONDS - elapsed);
    const label = document.getElementById('iso-timer');
    if (label) label.textContent = formatClock(left);
    const bar = document.getElementById('iso-record-bar');
    if (bar) bar.style.width = `${Math.min(100, (elapsed / ISOLATION_SECONDS) * 100)}%`;
    if (elapsed >= ISOLATION_SECONDS) finishRecording({ auto: true });
  }, 250);
}

function finishRecording({ auto }) {
  if (!state || state.phase !== 'record' || stopping) return;
  const elapsed = recordStartedAt ? (Date.now() - recordStartedAt) / 1000 : 0;
  if (!auto && elapsed < 45) {
    if (!confirm('This rep is five minutes. Review what you have so far?')) return;
  }
  stopping = true;
  if (timer) clearInterval(timer);
  timer = null;
  stopCaptions();
  state.duration = Math.min(ISOLATION_SECONDS, Math.max(elapsed, 0));

  const recorder = mediaRecorder;
  const finish = (url) => {
    if (!state) return;
    state.recordingUrl = url;
    state.review = buildIsolationReview({
      segments: state.segments,
      durationSeconds: state.duration,
    });
    stopStream();
    mediaRecorder = null;
    recordedChunks = [];
    stopping = false;
    state.phase = 'audio';
    render();
  };

  if (!recorder || recorder.state === 'inactive') {
    finish(null);
    return;
  }

  recorder.onstop = () => {
    const type = recorder.mimeType || 'video/webm';
    const blob = new Blob(recordedChunks, { type });
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = blob.size > 0 ? URL.createObjectURL(blob) : null;
    finish(blobUrl);
  };
  try {
    recorder.stop();
  } catch {
    finish(null);
  }
}

function startCaptions() {
  captionsOn = true;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !state) return;
  const rec = new SR();
  recognition = rec;
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';
  rec.onresult = (event) => {
    if (!captionsOn || !state) return;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      if (!event.results[i].isFinal) continue;
      const text = event.results[i][0].transcript.replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const t = recordStartedAt ? (Date.now() - recordStartedAt) / 1000 : 0;
      state.segments.push({ t: Math.round(t * 10) / 10, text });
    }
  };
  rec.onerror = (event) => {
    const fatal = event.error === 'not-allowed'
      || event.error === 'audio-capture'
      || event.error === 'service-not-allowed';
    if (!fatal) return;
    captionsOn = false;
    const el = document.getElementById('iso-captions');
    if (el) el.textContent = 'Captions stopped. You will review the words from memory.';
  };
  rec.onend = () => {
    if (!captionsOn || recognition !== rec) return;
    try { rec.start(); } catch { /* already running */ }
  };
  try {
    rec.start();
  } catch {
    recognition = null;
    const el = document.getElementById('iso-captions');
    if (el) el.textContent = 'Captions did not start. You will review the words from memory.';
  }
}

function stopCaptions() {
  captionsOn = false;
  if (!recognition) return;
  try {
    recognition.onend = null;
    recognition.stop();
  } catch { /* already stopped */ }
  recognition = null;
}

function activeMedia() {
  if (state?.phase === 'visual') return document.getElementById('iso-video');
  return document.getElementById('iso-audio');
}

function bindPlayer(pass) {
  const media = activeMedia();
  if (!media || !state.recordingUrl) return;
  media.src = state.recordingUrl;
  if (pass === 'visual') {
    media.playsInline = true;
    media.muted = true;
    media.addEventListener('volumechange', () => {
      if (state?.phase === 'visual') media.muted = true;
    });
  }
  const playButton = document.getElementById('iso-play');
  const scrub = document.getElementById('iso-scrub');
  const clock = document.getElementById('iso-clock');

  const durationOf = () => {
    if (Number.isFinite(media.duration) && media.duration > 0 && media.duration !== Infinity) {
      return media.duration;
    }
    return state?.duration || 0;
  };

  const paint = () => {
    const duration = durationOf();
    const current = media.currentTime || 0;
    if (scrub && duration) scrub.value = String(Math.round((current / duration) * 1000));
    if (clock) clock.textContent = `${formatClock(current)} / ${formatClock(duration)}`;
    if (playButton) playButton.textContent = media.paused ? 'Play' : 'Pause';
    highlightSpot(current);
  };

  media.addEventListener('timeupdate', paint);
  media.addEventListener('play', paint);
  media.addEventListener('pause', paint);
  media.addEventListener('loadedmetadata', paint);
  playButton?.addEventListener('click', () => {
    if (media.paused) {
      if (state?.phase === 'visual') media.muted = true;
      media.play().catch(() => {
        const err = document.getElementById('iso-play-error');
        if (err) err.textContent = 'Playback did not start. Tap play again.';
      });
    } else {
      media.pause();
    }
  });
  scrub?.addEventListener('input', () => {
    const duration = durationOf();
    if (!duration) return;
    media.currentTime = (Number(scrub.value) / 1000) * duration;
  });
  paint();
}

function seekTo(seconds) {
  const media = activeMedia();
  if (!media) return;
  if (state?.phase === 'visual') media.muted = true;
  const jump = () => {
    media.currentTime = seconds;
    media.play().catch(() => {});
  };
  if (media.readyState >= 1) jump();
  else media.addEventListener('loadedmetadata', jump, { once: true });
}

function highlightSpot(current) {
  if (!root) return;
  const spots = [...root.querySelectorAll('[data-spot-t]')];
  let nearest = null;
  spots.forEach(spot => {
    const distance = Math.abs(current - Number(spot.dataset.spotT));
    if (distance < 8 && (!nearest || distance < nearest.distance)) {
      nearest = { spot, distance };
    }
  });
  spots.forEach(spot => spot.classList.toggle('is-current', nearest?.spot === spot));
}

function toggleCatch(button) {
  const pass = state.phase;
  if (!state.caught[pass]) return;
  const id = button.dataset.id;
  const on = !state.caught[pass][id];
  state.caught[pass][id] = on;
  button.classList.toggle('is-on', on);
  button.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function stashNote(pass) {
  const note = document.getElementById('iso-note');
  if (!note || !state?.notes || !(pass in state.notes)) return;
  state.notes[pass] = note.value.slice(0, 500);
}

function saveRep() {
  if (state.savedSession) return;
  try {
    const review = state.review;
    const title = clipPlain(state.topic?.title || 'Isolation', 48);
    const session = recordPracticeSession({
      type: 'isolation',
      name: `Isolation · ${title}`,
      icon: '🎧',
      color: '#7C5CFC',
      durationSeconds: Math.round(state.duration || 0),
      roundsCompleted: 1,
      roundsTotal: 1,
      fillerCount: review?.transcript ? review.analysis.fillerCount : null,
    });
    const data = loadAll();
    const saved = data.history.find(item => item.id === session.id);
    if (saved) {
      saved.isolation = snapshot();
      saveAll(data);
    }
    state.savedSession = saved || session;
    state.saveError = '';
    refreshHeader();
  } catch {
    state.saveError = 'Could not save this rep on this device. Your notes are still on this screen.';
  }
}

function snapshot() {
  const review = state.review;
  const labels = (pass) => (review?.[pass]?.checks || [])
    .filter(check => state.caught[pass]?.[check.id])
    .map(check => check.title);
  return {
    topicTitle: state.topic?.title || 'Isolation',
    topicPrompt: state.topic?.prompt || '',
    transcript: review?.transcript || '',
    wordCount: review?.analysis?.wordCount || 0,
    wpm: review?.analysis?.wpm ?? null,
    fillerCount: review?.analysis?.fillerCount || 0,
    spots: {
      audio: (review?.audio?.spots || []).map(spot => ({
        clock: spot.clock,
        title: spot.title,
        detail: spot.detail,
      })),
      structure: (review?.structure?.spots || []).map(spot => ({
        title: spot.title,
        quote: spot.quote || '',
      })),
    },
    caught: {
      audio: labels('audio'),
      visual: labels('visual'),
      structure: labels('structure'),
    },
    notes: {
      audio: state.notes.audio.trim(),
      visual: state.notes.visual.trim(),
      structure: state.notes.structure.trim(),
    },
  };
}

function leave() {
  const dirty = ['countdown', 'record', 'audio', 'visual', 'structure'].includes(state.phase);
  if (dirty && !confirm('Leave this rep? It will not be logged.')) return;
  navigateTo('home');
}

function refreshHeader() {
  const user = getUser();
  const level = getLevelInfo(user.xp);
  const streak = getDisplayStreak(user.lastPracticeDate, user.streak);
  const streakEl = document.getElementById('header-streak');
  const xpEl = document.getElementById('header-xp');
  const levelEl = document.getElementById('header-level');
  if (streakEl) streakEl.textContent = streak;
  if (xpEl) xpEl.textContent = `${user.xp} XP`;
  if (levelEl) levelEl.textContent = `LVL ${level.level}`;
}

function stopStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (state) state.cameraReady = false;
}

function releaseAll() {
  stopping = true;
  if (timer) clearInterval(timer);
  timer = null;
  stopCaptions();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    } catch { /* already stopped */ }
  }
  mediaRecorder = null;
  recordedChunks = [];
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrl = null;
  }
  stopping = false;
  recordStartedAt = 0;
}

function supportedMime() {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function setChrome(visible) {
  const header = document.querySelector('.header');
  const nav = document.querySelector('.bottom-nav');
  if (header) header.style.display = visible ? '' : 'none';
  if (nav) nav.style.display = visible ? '' : 'none';
  document.body.classList.toggle('chrome-hidden', !visible);
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clipPlain(text, max) {
  const clean = String(text || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 24 ? cut.slice(0, space) : cut).trim()}…`;
}

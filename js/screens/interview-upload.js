import { navigateTo } from '../lib/router.js';
import { addInterviewUploadSession, getInterviewUploadSessions } from '../utils/storage.js';

const DEFAULT_ROLE = 'Senior Staff Data Science interviewer at Anthropic';
const DEFAULT_SCENARIO = 'Senior-level interview loop with technical and behavioral questions';
const DEFAULT_TYPE = 'hiring-manager';

const STORAGE_KEYS = {
  type: 'speak_ez_last_upload_interview_type',
  role: 'speak_ez_last_upload_role',
  scenario: 'speak_ez_last_upload_scenario',
  jobDescription: 'speak_ez_last_upload_jd',
  jobNotes: 'speak_ez_last_upload_job_notes',
  question: 'speak_ez_last_upload_question',
  targetRounds: 'speak_ez_last_upload_target_rounds',
};

export function renderInterviewUpload(container) {
  const state = buildInitialState();

  container.innerHTML = `
    <div class="screen interview-upload-screen">
      <button class="btn btn-ghost btn-sm" id="upload-back-btn" style="margin-bottom: 16px;">
        <- Back
      </button>

      <div class="section-header">
        <h1 class="h1">Upload Interview Recording</h1>
      </div>

      <p class="subtitle" style="margin-bottom: 18px;">
        Upload MP4/audio, transcribe it first, then evaluate and continue with grounded follow-up questions.
      </p>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-thread-mode" style="display: block; margin-bottom: 8px;">Session Mode</label>
        <select id="upload-thread-mode" class="form-input">
          <option value="new" selected>Start New Interview Thread</option>
          <option value="continue" ${state.availableThreads.length ? '' : 'disabled'}>Continue Existing Thread</option>
        </select>
      </div>

      <div class="card" id="continue-thread-card" style="margin-bottom: 12px; display: none;">
        <label class="label" for="upload-thread-select" style="display: block; margin-bottom: 8px;">Choose Thread</label>
        <select id="upload-thread-select" class="form-input">
          ${renderThreadOptions(state.availableThreads)}
        </select>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-interview-type" style="display: block; margin-bottom: 8px;">Interview Type</label>
        <select id="upload-interview-type" class="form-input">
          ${interviewTypeOption('recruiter-screen', 'Recruiter Screen', state.lastType)}
          ${interviewTypeOption('hiring-manager', 'Hiring Manager', state.lastType)}
          ${interviewTypeOption('behavioral', 'Behavioral', state.lastType)}
          ${interviewTypeOption('coding', 'Coding / Technical', state.lastType)}
          ${interviewTypeOption('system-design', 'System Design', state.lastType)}
          ${interviewTypeOption('final-onsite', 'Final Onsite', state.lastType)}
        </select>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-role" style="display: block; margin-bottom: 8px;">Interviewer Role</label>
        <input id="upload-role" class="form-input" type="text" value="${escapeAttribute(state.lastRole)}" />
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-scenario" style="display: block; margin-bottom: 8px;">Interview Scenario</label>
        <input id="upload-scenario" class="form-input" type="text" value="${escapeAttribute(state.lastScenario)}" />
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-jd" style="display: block; margin-bottom: 8px;">Job Description / Role Brief</label>
        <textarea id="upload-jd" class="form-input" rows="4" placeholder="Paste JD text or role expectations.">${escapeHtml(state.lastJd)}</textarea>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-job-notes" style="display: block; margin-bottom: 8px;">Job Notes / Company Context</label>
        <textarea id="upload-job-notes" class="form-input" rows="3" placeholder="Ex: Anthropic context, team focus, product constraints.">${escapeHtml(state.lastJobNotes)}</textarea>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-question" style="display: block; margin-bottom: 8px;">Current Question / Prompt</label>
        <textarea id="upload-question" class="form-input" rows="3" placeholder="Ex: Tell me about a high-impact project where you influenced cross-functional partners.">${escapeHtml(state.lastQuestion)}</textarea>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <label class="label" for="upload-target-rounds" style="display: block; margin-bottom: 8px;">Target Rounds</label>
        <select id="upload-target-rounds" class="form-input">
          ${targetRoundOption(3, state.targetRounds)}
          ${targetRoundOption(4, state.targetRounds)}
          ${targetRoundOption(5, state.targetRounds)}
          ${targetRoundOption(6, state.targetRounds)}
        </select>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <label class="label" for="upload-file" style="display: block; margin-bottom: 8px;">Recording File</label>
        <input id="upload-file" class="form-input" type="file" accept="video/mp4,video/*,audio/*" />
      </div>

      <div style="display: grid; gap: 8px; margin-bottom: 8px;">
        <button class="btn btn-primary btn-block btn-lg" id="upload-analyze-btn">Transcribe + Evaluate Turn</button>
        <button class="btn btn-secondary btn-block" id="upload-history-btn">Open Interview History</button>
      </div>

      <div id="upload-status" class="card" style="margin-top: 12px; display: none;"></div>
      <div id="upload-results" style="margin-top: 12px;"></div>
    </div>
  `;

  const backBtn = document.getElementById('upload-back-btn');
  const analyzeBtn = document.getElementById('upload-analyze-btn');
  const historyBtn = document.getElementById('upload-history-btn');
  const modeInput = document.getElementById('upload-thread-mode');
  const continueCardEl = document.getElementById('continue-thread-card');
  const threadSelectInput = document.getElementById('upload-thread-select');
  const fileInput = document.getElementById('upload-file');
  const interviewTypeInput = document.getElementById('upload-interview-type');
  const roleInput = document.getElementById('upload-role');
  const scenarioInput = document.getElementById('upload-scenario');
  const jdInput = document.getElementById('upload-jd');
  const jobNotesInput = document.getElementById('upload-job-notes');
  const questionInput = document.getElementById('upload-question');
  const targetRoundsInput = document.getElementById('upload-target-rounds');
  const statusEl = document.getElementById('upload-status');
  const resultsEl = document.getElementById('upload-results');

  const refreshContinueModeUI = () => {
    const isContinue = modeInput.value === 'continue';
    continueCardEl.style.display = isContinue ? '' : 'none';

    const selectedThread = findThread(state.availableThreads, threadSelectInput?.value);
    const lock = Boolean(selectedThread && isContinue);
    if (lock) {
      interviewTypeInput.value = selectedThread.interviewType || state.lastType;
      roleInput.value = selectedThread.interviewerRole || state.lastRole;
      scenarioInput.value = selectedThread.interviewScenario || state.lastScenario;
      jdInput.value = selectedThread.jobDescription || state.lastJd;
      jobNotesInput.value = selectedThread.jobNotes || state.lastJobNotes;
      targetRoundsInput.value = String(selectedThread.targetRounds || state.targetRounds);
      questionInput.value = selectedThread.nextQuestion || selectedThread.lastQuestion || state.lastQuestion;
    }

    interviewTypeInput.disabled = lock;
    roleInput.disabled = lock;
    scenarioInput.disabled = lock;
    jdInput.disabled = lock;
    jobNotesInput.disabled = lock;
    targetRoundsInput.disabled = lock;
  };

  backBtn.addEventListener('click', () => navigateTo('interview-setup'));
  historyBtn.addEventListener('click', () => navigateTo('interview-history'));
  modeInput.addEventListener('change', refreshContinueModeUI);
  threadSelectInput?.addEventListener('change', refreshContinueModeUI);
  refreshContinueModeUI();

  analyzeBtn.addEventListener('click', async () => {
    const file = fileInput.files?.[0];
    const mode = modeInput.value;
    const selectedThread = mode === 'continue' ? findThread(state.availableThreads, threadSelectInput?.value) : null;
    const interviewType = interviewTypeInput.value || DEFAULT_TYPE;
    const interviewRole = roleInput.value.trim() || DEFAULT_ROLE;
    const interviewScenario = scenarioInput.value.trim() || DEFAULT_SCENARIO;
    const jobDescription = jdInput.value.trim();
    const jobNotes = jobNotesInput.value.trim();
    const questionContext = questionInput.value.trim();
    const targetRounds = Number(targetRoundsInput.value || state.targetRounds || 4);

    if (!file) {
      showStatus(statusEl, 'Please select a video/audio file first.', 'error');
      return;
    }

    if (mode === 'continue' && !selectedThread) {
      showStatus(statusEl, 'Select a thread to continue.', 'error');
      return;
    }

    persistUploadForm({
      interviewType,
      interviewRole,
      interviewScenario,
      jobDescription,
      jobNotes,
      questionContext,
      targetRounds,
    });

    const threadId = selectedThread?.threadId || crypto.randomUUID();
    const currentRound = selectedThread ? Number(selectedThread.turnIndex || 0) + 1 : 1;
    const conversationHistory = selectedThread?.turns || [];

    try {
      setLoading(analyzeBtn, true);
      showStatus(statusEl, 'Uploading and transcribing...', 'loading');
      resultsEl.innerHTML = '';

      const media = await fileToBase64(file);
      const response = await fetch('/api/interview-video-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media,
          mimeType: file.type || 'video/mp4',
          interviewType,
          interviewRole,
          interviewScenario,
          jobDescription,
          jobNotes,
          questionContext,
          conversationHistory,
          currentRound,
          targetRounds,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to evaluate recording');
      }

      const data = await response.json();

      const turns = [
        ...conversationHistory,
        {
          turnIndex: currentRound,
          question: questionContext,
          transcript: data.transcript,
          score: data.feedback?.overallScore || null,
        },
      ];

      addInterviewUploadSession({
        fileName: file.name,
        mimeType: file.type || 'video/mp4',
        interviewType,
        interviewerRole: interviewRole,
        interviewScenario,
        questionContext,
        jobDescription,
        jobNotes,
        threadId,
        turnIndex: currentRound,
        targetRounds,
        turns,
        transcript: data.transcript,
        transcriptionNotes: data.transcriptionNotes,
        feedback: data.feedback,
        nextQuestion: data.nextQuestion,
        shouldContinue: data.shouldContinue,
      });

      showStatus(
        statusEl,
        data.shouldContinue ? `Turn ${currentRound} analyzed. Follow-up question generated.` : `Turn ${currentRound} analyzed. Thread complete.`,
        'success'
      );

      resultsEl.innerHTML = renderResults(data, {
        round: currentRound,
        targetRounds,
      });

      if (data.nextQuestion) {
        questionInput.value = data.nextQuestion;
      }

      fileInput.value = '';
      state.availableThreads = buildThreadSnapshots(getInterviewUploadSessions());
      if (mode === 'continue' && threadSelectInput) {
        threadSelectInput.innerHTML = renderThreadOptions(state.availableThreads);
        threadSelectInput.value = threadId;
      }
    } catch (err) {
      showStatus(statusEl, err.message || 'Something went wrong.', 'error');
    } finally {
      setLoading(analyzeBtn, false);
    }
  });
}

function buildInitialState() {
  const sessions = getInterviewUploadSessions();
  const availableThreads = buildThreadSnapshots(sessions);
  return {
    availableThreads,
    lastType: localStorage.getItem(STORAGE_KEYS.type) || DEFAULT_TYPE,
    lastRole: localStorage.getItem(STORAGE_KEYS.role) || DEFAULT_ROLE,
    lastScenario: localStorage.getItem(STORAGE_KEYS.scenario) || DEFAULT_SCENARIO,
    lastJd: localStorage.getItem(STORAGE_KEYS.jobDescription) || '',
    lastJobNotes: localStorage.getItem(STORAGE_KEYS.jobNotes) || '',
    lastQuestion: localStorage.getItem(STORAGE_KEYS.question) || '',
    targetRounds: Number(localStorage.getItem(STORAGE_KEYS.targetRounds) || 4),
  };
}

function buildThreadSnapshots(sessions) {
  if (!Array.isArray(sessions)) return [];
  const latestByThread = new Map();
  for (const session of sessions) {
    const upload = session.upload || {};
    const threadId = upload.threadId || session.threadId || session.id;
    if (!latestByThread.has(threadId)) {
      latestByThread.set(threadId, {
        threadId,
        turnIndex: Number(upload.turnIndex || session.turnIndex || 1),
        targetRounds: Number(upload.targetRounds || 4),
        interviewType: upload.interviewType || '',
        interviewerRole: upload.interviewerRole || '',
        interviewScenario: upload.interviewScenario || '',
        jobDescription: upload.jobDescription || '',
        jobNotes: upload.jobNotes || '',
        nextQuestion: upload.nextQuestion || '',
        lastQuestion: upload.questionContext || '',
        turns: Array.isArray(upload.turns) ? upload.turns : [],
        completedAt: session.completedAt,
      });
    }
  }
  return Array.from(latestByThread.values());
}

function renderResults(data, meta) {
  const transcript = escapeHtml(data.transcript || '');
  const notes = data.transcriptionNotes || {};
  const feedback = data.feedback || {};
  const scores = feedback.scores || {};
  const rubricWeights = data.rubricWeights || {};

  return `
    <div class="card" style="margin-bottom: 12px;">
      <div class="label" style="margin-bottom: 8px;">Turn ${meta.round}/${meta.targetRounds}</div>
      <div style="font-size: 0.9rem; color: var(--text-secondary);">
        ${data.shouldContinue ? 'Continue with the follow-up question below.' : 'Thread is complete for this target round count.'}
      </div>
      ${data.nextQuestion ? `<div style="margin-top: 8px; font-size: 0.9rem; line-height: 1.45;"><strong>Next Question:</strong> ${escapeHtml(data.nextQuestion)}</div>` : ''}
    </div>

    <div class="card" style="margin-bottom: 12px;">
      <div class="label" style="margin-bottom: 8px;">Transcript</div>
      <div style="font-size: 0.9rem; line-height: 1.55; white-space: pre-wrap;">${transcript || '(No transcript returned)'}</div>
    </div>

    <div class="card" style="margin-bottom: 12px;">
      <div class="label" style="margin-bottom: 8px;">Delivery Notes</div>
      <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">
        <div><strong>Hesitations:</strong> ${escapeHtml(notes.hesitations || 'Not provided')}</div>
        <div style="margin-top: 6px;"><strong>Pace/Tonality Signals:</strong> ${escapeHtml(notes.deliverySignals || 'Not provided')}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 12px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <div class="label">Interview Feedback</div>
        <div style="font-weight: 700;">${feedback.overallScore || '-'} / 10</div>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 8px;">
        Weighted rubric: P ${pct(rubricWeights.pausing)} • L ${pct(rubricWeights.language)} • T ${pct(rubricWeights.tonality)} • Pc ${pct(rubricWeights.pace)} • S ${pct(rubricWeights.structure)} • Fit ${pct(rubricWeights.interviewerFit)}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; font-size: 0.8rem; color: var(--text-secondary);">
        ${scoreChip('Pausing', scores.pausing)}
        ${scoreChip('Language', scores.language)}
        ${scoreChip('Tonality', scores.tonality)}
        ${scoreChip('Pace', scores.pace)}
        ${scoreChip('Structure', scores.structure)}
        ${scoreChip('Interviewer Fit', scores.interviewerFit)}
      </div>
      <div style="font-size: 0.9rem; line-height: 1.55; margin-bottom: 12px;">${escapeHtml(feedback.summary || '')}</div>

      ${renderStringList('Strengths', feedback.strengths)}
      ${renderStringList('Improvements', feedback.improvements)}
      ${feedback.rewriteExample ? `
        <div style="margin-top: 10px; padding: 10px; border-radius: 8px; background: var(--bg-elevated);">
          <div class="label" style="margin-bottom: 6px;">Example Rewrite</div>
          <div style="font-size: 0.86rem; line-height: 1.5; color: var(--text-secondary);">${escapeHtml(feedback.rewriteExample)}</div>
        </div>
      ` : ''}
      ${renderStringList('Likely Follow-ups', feedback.followUpQuestions)}
    </div>
  `;
}

function persistUploadForm({ interviewType, interviewRole, interviewScenario, jobDescription, jobNotes, questionContext, targetRounds }) {
  localStorage.setItem(STORAGE_KEYS.type, interviewType || DEFAULT_TYPE);
  localStorage.setItem(STORAGE_KEYS.role, interviewRole || DEFAULT_ROLE);
  localStorage.setItem(STORAGE_KEYS.scenario, interviewScenario || DEFAULT_SCENARIO);
  localStorage.setItem(STORAGE_KEYS.jobDescription, jobDescription || '');
  localStorage.setItem(STORAGE_KEYS.jobNotes, jobNotes || '');
  localStorage.setItem(STORAGE_KEYS.question, questionContext || '');
  localStorage.setItem(STORAGE_KEYS.targetRounds, String(targetRounds || 4));
}

function renderThreadOptions(threads) {
  if (!threads.length) return '<option value="">No threads available</option>';
  return threads.map(thread => {
    const label = `${formatInterviewType(thread.interviewType)} • Turn ${thread.turnIndex}/${thread.targetRounds} • ${shortDate(thread.completedAt)}`;
    return `<option value="${thread.threadId}">${escapeHtml(label)}</option>`;
  }).join('');
}

function findThread(threads, threadId) {
  if (!threadId) return null;
  return threads.find(thread => thread.threadId === threadId) || null;
}

function interviewTypeOption(value, label, selectedValue) {
  const selected = value === selectedValue ? 'selected' : '';
  return `<option value="${value}" ${selected}>${label}</option>`;
}

function targetRoundOption(value, selected) {
  const sel = Number(selected) === value ? 'selected' : '';
  return `<option value="${value}" ${sel}>${value} rounds</option>`;
}

function renderStringList(title, items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return `
    <div style="margin-top: 10px;">
      <div class="label" style="margin-bottom: 6px;">${escapeHtml(title)}</div>
      <div style="display: grid; gap: 6px;">
        ${items.map(item => `<div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45;">- ${escapeHtml(item)}</div>`).join('')}
      </div>
    </div>
  `;
}

function scoreChip(label, value) {
  const score = Number.isFinite(value) ? `${value}/10` : '-';
  return `<div style="padding: 8px; border-radius: 8px; background: var(--bg-elevated); display: flex; justify-content: space-between;"><span>${label}</span><strong>${score}</strong></div>`;
}

function pct(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return `${Math.round(num * 100)}%`;
}

function showStatus(el, message, kind) {
  if (!el) return;
  const colorMap = {
    loading: 'rgba(0, 180, 216, 0.2)',
    success: 'rgba(88, 204, 2, 0.2)',
    error: 'rgba(224, 82, 82, 0.2)',
  };
  el.style.display = 'block';
  el.style.border = `1px solid ${colorMap[kind] || 'rgba(255,255,255,0.15)'}`;
  el.textContent = message;
}

function setLoading(button, isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Analyzing...' : 'Transcribe + Evaluate Turn';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const base64 = String(result).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatInterviewType(interviewType) {
  const map = {
    'recruiter-screen': 'Recruiter Screen',
    'hiring-manager': 'Hiring Manager',
    'behavioral': 'Behavioral',
    'coding': 'Coding',
    'system-design': 'System Design',
    'final-onsite': 'Final Onsite',
  };
  return map[interviewType] || 'Interview';
}

function shortDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escapeAttribute(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

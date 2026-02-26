import { navigateTo } from '../lib/router.js';
import { getInterviewUploadSessions } from '../utils/storage.js';

export function renderInterviewHistory(container) {
  const sessions = getInterviewUploadSessions();
  const trendPoints = sessions
    .map(session => ({
      id: session.id,
      score: Number(session?.upload?.feedback?.overallScore || 0),
      date: session.completedAt,
    }))
    .filter(point => point.score > 0)
    .reverse();

  container.innerHTML = `
    <div class="screen interview-history-screen">
      <button class="btn btn-ghost btn-sm" data-action="back" style="margin-bottom: 16px;">
        <- Back
      </button>

      <div class="section-header">
        <h1 class="h1">Interview Upload History</h1>
      </div>
      <p class="subtitle" style="margin-bottom: 18px;">
        ${sessions.length} upload session${sessions.length === 1 ? '' : 's'} tracked
      </p>

      <div class="card" style="margin-bottom: 14px;">
        <div class="label" style="margin-bottom: 10px;">Score Trend</div>
        ${renderTrend(trendPoints)}
      </div>

      <div class="card" id="interview-history-list">
        ${renderSessionList(sessions)}
      </div>
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const type = action.dataset.action;

    if (type === 'back') {
      navigateTo('interview-setup');
      return;
    }

    if (type === 'view-detail') {
      const sessionId = action.dataset.id;
      const session = sessions.find(item => item.id === sessionId);
      if (session) renderInterviewHistoryDetail(container, session);
    }
  };
}

function renderInterviewHistoryDetail(container, session) {
  const upload = session.upload || {};
  const feedback = upload.feedback || {};
  const notes = upload.transcriptionNotes || {};
  const scores = feedback.scores || {};

  container.innerHTML = `
    <div class="screen interview-history-detail-screen">
      <button class="btn btn-ghost btn-sm" data-action="back-to-history" style="margin-bottom: 16px;">
        <- History
      </button>

      <div class="h1" style="margin-bottom: 6px;">${escapeHtml(upload.fileName || 'Interview Upload')}</div>
      <div class="subtitle" style="margin-bottom: 14px;">${formatDate(session.completedAt)} • ${escapeHtml(formatInterviewType(upload.interviewType))}</div>

      <div class="card" style="margin-bottom: 12px;">
        <div class="label" style="margin-bottom: 8px;">Overall Score</div>
        <div style="font-size: 2rem; font-weight: 700;">${feedback.overallScore || '-'} / 10</div>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <div class="label" style="margin-bottom: 8px;">Score Breakdown</div>
        <div style="display: grid; gap: 6px; font-size: 0.85rem; color: var(--text-secondary);">
          ${scoreRow('Pausing', scores.pausing)}
          ${scoreRow('Language', scores.language)}
          ${scoreRow('Tonality', scores.tonality)}
          ${scoreRow('Pace', scores.pace)}
          ${scoreRow('Structure', scores.structure)}
          ${scoreRow('Interviewer Fit', scores.interviewerFit)}
        </div>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <div class="label" style="margin-bottom: 8px;">Interviewer Summary</div>
        <div style="font-size: 0.9rem; line-height: 1.55; color: var(--text-secondary);">${escapeHtml(feedback.summary || 'No summary.')}</div>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <div class="label" style="margin-bottom: 8px;">Transcript</div>
        <div style="font-size: 0.88rem; line-height: 1.5; white-space: pre-wrap; color: var(--text-secondary);">${escapeHtml(upload.transcript || '(No transcript saved)')}</div>
      </div>

      <div class="card" style="margin-bottom: 12px;">
        <div class="label" style="margin-bottom: 8px;">Delivery Notes</div>
        <div style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary);">
          <div><strong>Hesitations:</strong> ${escapeHtml(notes.hesitations || 'Not provided')}</div>
          <div style="margin-top: 4px;"><strong>Pace/Tonality:</strong> ${escapeHtml(notes.deliverySignals || 'Not provided')}</div>
        </div>
      </div>

      ${renderTurnHistory(upload.turns)}
    </div>
  `;

  container.onclick = (e) => {
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'back-to-history') {
      renderInterviewHistory(container);
    }
  };
}

function renderTurnHistory(turns) {
  if (!Array.isArray(turns) || turns.length === 0) return '';
  return `
    <div class="card">
      <div class="label" style="margin-bottom: 8px;">Thread Turns</div>
      <div style="display: grid; gap: 10px;">
        ${turns.map(turn => `
          <div style="padding: 10px; border-radius: 8px; background: var(--bg-elevated);">
            <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 4px;">Turn ${turn.turnIndex || '-'}</div>
            <div style="font-size: 0.82rem; margin-bottom: 4px;"><strong>Q:</strong> ${escapeHtml(turn.question || 'N/A')}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary);"><strong>A:</strong> ${escapeHtml(turn.transcript || '').slice(0, 240)}${turn.transcript && turn.transcript.length > 240 ? '...' : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTrend(points) {
  if (!points.length) {
    return '<div class="text-secondary" style="font-size: 0.85rem;">No scored sessions yet.</div>';
  }

  const maxScore = Math.max(...points.map(point => point.score), 10);
  return `
    <div style="display: grid; gap: 8px;">
      ${points.slice(-12).map(point => {
        const width = Math.max(8, Math.round((point.score / maxScore) * 100));
        return `
          <div style="display: grid; grid-template-columns: 54px 1fr 36px; align-items: center; gap: 10px;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary);">${shortDate(point.date)}</div>
            <div style="height: 8px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden;">
              <div style="height: 100%; width: ${width}%; background: linear-gradient(90deg, var(--blue), var(--accent));"></div>
            </div>
            <div style="font-size: 0.8rem; text-align: right; color: var(--text-secondary);">${point.score}/10</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderSessionList(sessions) {
  if (!sessions.length) {
    return '<div class="text-secondary" style="font-size: 0.85rem;">No upload sessions yet.</div>';
  }
  return sessions.slice(0, 20).map(session => {
    const upload = session.upload || {};
    const score = upload.feedback?.overallScore;
    const nextQuestion = upload.nextQuestion || '';
    return `
      <div class="card card-sm card-interactive" data-action="view-detail" data-id="${session.id}" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <div>
            <div style="font-size: 0.9rem; font-weight: 600;">${escapeHtml(formatInterviewType(upload.interviewType))}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(upload.fileName || 'upload')}</div>
            ${nextQuestion ? `<div style="font-size: 0.76rem; color: var(--text-tertiary); margin-top: 2px;">Next: ${escapeHtml(nextQuestion).slice(0, 80)}${nextQuestion.length > 80 ? '...' : ''}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.84rem; color: var(--text-secondary);">${formatDate(session.completedAt)}</div>
            <div style="font-weight: 700; margin-top: 2px;">${Number.isFinite(score) ? `${score}/10` : '-'}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function scoreRow(label, value) {
  return `<div style="display: flex; justify-content: space-between;"><span>${label}</span><span>${Number.isFinite(value) ? `${value}/10` : '-'}</span></div>`;
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

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

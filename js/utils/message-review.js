/**
 * Message review — what was said, separate from fluency.
 * The model returns a `message` object. This turns it into rows
 * the feedback card can render.
 */

const ANSWERED = {
  yes: { verdict: 'Answered', tone: 'good' },
  partial: { verdict: 'Partly', tone: 'warn' },
  no: { verdict: 'Missed', tone: 'bad' },
};

const RECOMMENDATION = {
  led: { verdict: 'Led with it', tone: 'good' },
  buried: { verdict: 'Buried', tone: 'bad' },
  missing: { verdict: 'Missing', tone: 'bad' },
  not_asked: { verdict: 'Not asked', tone: 'neutral' },
};

const CAVEATS = {
  tight: { verdict: 'Tight', tone: 'good' },
  one: { verdict: 'One caveat', tone: 'good' },
  stacked: { verdict: 'Stacked', tone: 'bad' },
};

function note(value) {
  if (typeof value !== 'string') return '';
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.length > 240 ? `${cleaned.slice(0, 239).trim()}…` : cleaned;
}

function row(label, table, code, rawNote) {
  const match = table[code];
  if (!match) return null;
  return { label, verdict: match.verdict, tone: match.tone, note: note(rawNote) };
}

export function formatMessageReview(message) {
  if (!message || typeof message !== 'object') return [];
  return [
    row('The question', ANSWERED, message.answered, message.answered_note),
    row('Recommendation', RECOMMENDATION, message.recommendation, message.recommendation_note),
    row('Caveats', CAVEATS, message.caveats, message.caveat_note),
  ].filter(Boolean);
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function messageReviewMarkup(message) {
  const rows = formatMessageReview(message);
  if (!rows.length) return '';
  return `
    <div class="message-review">
      <div class="ai-feedback-list-title">What you said</div>
      ${rows.map(item => `
        <div class="message-review-row">
          <div class="message-review-top">
            <span class="message-review-label">${esc(item.label)}</span>
            <span class="message-review-verdict is-${item.tone}">${esc(item.verdict)}</span>
          </div>
          ${item.note ? `<div class="message-review-note">${esc(item.note)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

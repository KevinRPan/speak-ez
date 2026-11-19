/**
 * History / progress card for a logged isolation rep.
 */

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PASSES = [
  ['audio', 'Ears'],
  ['visual', 'Eyes'],
  ['structure', 'Words'],
];

export function isolationMeta(session) {
  if (session?.type !== 'isolation') return '';
  const minutes = Math.max(1, Math.round((session.totalDuration || 0) / 60));
  return `${minutes} min spoken · 3 reviews`;
}

export function isolationLogCard(session) {
  const iso = session?.isolation;
  if (session?.type !== 'isolation' || !iso) return '';

  const passes = PASSES.map(([key, label]) => {
    const caught = iso.caught?.[key] || [];
    const note = (iso.notes?.[key] || '').trim();
    const spots = key === 'visual' ? [] : (iso.spots?.[key] || []);
    const spotLine = spots
      .map(spot => esc(spot.clock ? `${spot.clock} ${spot.title}` : spot.title))
      .join(' · ');
    return `
      <div class="iso-log-pass">
        <div class="iso-log-label">${label}</div>
        <div class="iso-log-caught">${caught.length ? esc(caught.join(' · ')) : 'Nothing marked'}</div>
        ${spotLine ? `<div class="iso-log-spots">${spotLine}</div>` : ''}
        ${note ? `<p class="iso-log-note">${esc(note)}</p>` : ''}
      </div>
    `;
  }).join('');

  const transcript = (iso.transcript || '').trim();

  return `
    <div class="card iso-log mb-16">
      <div class="label mb-12">What you caught</div>
      <div class="iso-log-topic">${esc(iso.topicTitle || 'Isolation')}</div>
      ${passes}
      ${transcript ? `
        <details class="iso-log-transcript">
          <summary>Transcript</summary>
          <p>${esc(transcript)}</p>
        </details>
      ` : ''}
    </div>
  `;
}

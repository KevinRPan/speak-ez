/**
 * Shared screen chrome so every flow starts and steps the same way.
 */

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pageHeader({ kicker, title, subtitle }) {
  return `
    <header class="page-head">
      <p class="page-kicker">${esc(kicker)}</p>
      <h1 class="page-title">${esc(title)}</h1>
      ${subtitle ? `<p class="page-sub">${esc(subtitle)}</p>` : ''}
    </header>
  `;
}

export function flowBar({ backId, backAction, backLabel, steps = [] }) {
  const crumbs = [];
  if (backLabel && (backId || backAction)) {
    const attrs = backId
      ? `id="${esc(backId)}"`
      : `data-action="${esc(backAction)}"`;
    crumbs.push(`<button class="flow-back" type="button" ${attrs}>← ${esc(backLabel)}</button>`);
  }
  for (const step of steps) {
    crumbs.push(`<span class="flow-step${step.current ? ' is-current' : ''}">${esc(step.label)}</span>`);
  }
  return `<nav class="flow-trail" aria-label="Current flow">${crumbs.join('<span class="flow-sep" aria-hidden="true">/</span>')}</nav>`;
}

/**
 * Remote storage — API client for /api/sync/* endpoints
 */

export async function pushToServer(data) {
  const res = await fetch('/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);
  return res.json();
}

export async function pullFromServer(since = null) {
  const url = since ? `/api/sync/pull?since=${encodeURIComponent(since)}` : '/api/sync/pull';
  const res = await fetch(url, {
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  return res.json();
}

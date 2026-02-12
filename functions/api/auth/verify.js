/**
 * GET /api/auth/verify?token=xxx
 * Validate magic link token, create session, set cookie, redirect to app.
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect(url.origin, 'missing_token');
  }

  try {
    // Find and validate the magic link token
    const row = await env.DB.prepare(
      `SELECT token, user_id, expires_at, used_at FROM auth_tokens
       WHERE token = ? AND type = 'magic_link'`
    ).bind(token).first();

    if (!row) {
      return redirect(url.origin, 'invalid_token');
    }

    if (row.used_at) {
      return redirect(url.origin, 'already_used');
    }

    if (new Date(row.expires_at) < new Date()) {
      return redirect(url.origin, 'expired');
    }

    // Mark magic link as used
    await env.DB.prepare(
      `UPDATE auth_tokens SET used_at = datetime('now') WHERE token = ?`
    ).bind(token).run();

    // Create session token (30-day expiry)
    const sessionBytes = new Uint8Array(32);
    crypto.getRandomValues(sessionBytes);
    const sessionToken = Array.from(sessionBytes, b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO auth_tokens (token, user_id, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(sessionToken, row.user_id, 'session', expiresAt).run();

    // Set HttpOnly session cookie and redirect
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${url.origin}/?auth=success`,
        'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
      },
    });
  } catch (err) {
    console.error('verify error:', err);
    return redirect(url.origin, 'error');
  }
}

function redirect(origin, reason) {
  return new Response(null, {
    status: 302,
    headers: { 'Location': `${origin}/?auth=${reason}` },
  });
}

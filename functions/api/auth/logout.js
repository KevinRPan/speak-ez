/**
 * POST /api/auth/logout
 * Clear session cookie and invalidate token.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  // Invalidate the session token in DB
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  const sessionToken = match?.[1];

  if (sessionToken) {
    try {
      await env.DB.prepare(
        `UPDATE auth_tokens SET used_at = datetime('now') WHERE token = ? AND type = 'session'`
      ).bind(sessionToken).run();
    } catch (err) {
      console.error('logout DB error:', err);
    }
  }

  // Clear cookie
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      ...corsHeaders,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

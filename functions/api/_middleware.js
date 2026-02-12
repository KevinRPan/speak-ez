/**
 * Auth middleware for /api/* routes
 * Reads session cookie, validates against auth_tokens, attaches user to context.
 * Skips auth for public routes: send-link, verify, feedback.
 */

const PUBLIC_PATHS = [
  '/api/auth/send-link',
  '/api/auth/verify',
  '/api/feedback',
];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Skip auth for public routes and OPTIONS preflight
  if (PUBLIC_PATHS.includes(url.pathname) || request.method === 'OPTIONS') {
    return next();
  }

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  const sessionToken = match?.[1];

  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await env.DB.prepare(
      `SELECT t.user_id, t.expires_at, u.email, u.name
       FROM auth_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token = ? AND t.type = 'session' AND t.used_at IS NULL`
    ).bind(sessionToken).first();

    if (!result || new Date(result.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Attach user to context for downstream handlers
    context.data.user = {
      id: result.user_id,
      email: result.email,
      name: result.name,
    };

    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return new Response(JSON.stringify({ error: 'Auth error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

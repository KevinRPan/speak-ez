/**
 * GET /api/auth/session
 * Return current authenticated user, or 401.
 * User is attached by _middleware.js.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  // User is set by middleware — if we got here, we're authenticated
  const user = context.data.user;
  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

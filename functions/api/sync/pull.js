/**
 * GET /api/sync/pull?since=ISO_TIMESTAMP
 * Return server data. If `since` is provided, only return workout history
 * added after that timestamp (profile/settings/PRs always returned in full).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const user = context.data.user;
  const url = new URL(request.url);
  const since = url.searchParams.get('since');

  try {
    // Get user_data
    const userData = await env.DB.prepare(
      'SELECT * FROM user_data WHERE user_id = ?'
    ).bind(user.id).first();

    // Get workout history (optionally filtered by since)
    let historyQuery = 'SELECT * FROM workout_history WHERE user_id = ?';
    const bindings = [user.id];

    if (since) {
      historyQuery += ' AND created_at > ?';
      bindings.push(since);
    }

    historyQuery += ' ORDER BY completed_at DESC';

    const historyRows = await env.DB.prepare(historyQuery)
      .bind(...bindings)
      .all();

    const history = (historyRows.results || []).map(row => ({
      ...JSON.parse(row.data),
      id: row.id,
      completedAt: row.completed_at,
    }));

    return json({
      profile: userData ? JSON.parse(userData.profile || '{}') : {},
      settings: userData ? JSON.parse(userData.settings || '{}') : {},
      personalRecords: userData ? JSON.parse(userData.personal_records || '{}') : {},
      customWorkouts: userData ? JSON.parse(userData.custom_workouts || '[]') : [],
      history,
      updatedAt: userData?.updated_at || null,
    });
  } catch (err) {
    console.error('sync pull error:', err);
    return json({ error: 'Pull failed' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

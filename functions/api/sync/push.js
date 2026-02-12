/**
 * POST /api/sync/push
 * Receive client data, merge with server state, write to D1.
 * Merge rules:
 *   - profile/settings: last-write-wins by updatedAt
 *   - history: union merge by session id (append-only)
 *   - personalRecords: max-value-wins per metric per exercise
 *   - customWorkouts: union merge by workout id
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = context.data.user;

  try {
    const clientData = await request.json();
    const { profile, settings, history, personalRecords, customWorkouts, updatedAt } = clientData;

    // Get existing server data
    const existing = await env.DB.prepare(
      'SELECT * FROM user_data WHERE user_id = ?'
    ).bind(user.id).first();

    let mergedProfile = profile || {};
    let mergedSettings = settings || {};
    let mergedPRs = personalRecords || {};
    let mergedCustom = customWorkouts || [];

    if (existing) {
      const serverProfile = JSON.parse(existing.profile || '{}');
      const serverSettings = JSON.parse(existing.settings || '{}');
      const serverPRs = JSON.parse(existing.personal_records || '{}');
      const serverCustom = JSON.parse(existing.custom_workouts || '[]');

      // Last-write-wins for profile and settings
      if (updatedAt && existing.updated_at && updatedAt > existing.updated_at) {
        // Client is newer — use client values (already set above)
      } else if (existing.updated_at) {
        // Server is newer — keep server values
        mergedProfile = serverProfile;
        mergedSettings = serverSettings;
      }

      // Personal records: max-value-wins per exercise per metric
      mergedPRs = mergePRs(serverPRs, personalRecords || {});

      // Custom workouts: union by id
      mergedCustom = unionById(serverCustom, customWorkouts || []);
    }

    // Upsert user_data
    await env.DB.prepare(`
      INSERT INTO user_data (user_id, profile, settings, personal_records, custom_workouts, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        profile = excluded.profile,
        settings = excluded.settings,
        personal_records = excluded.personal_records,
        custom_workouts = excluded.custom_workouts,
        updated_at = excluded.updated_at
    `).bind(
      user.id,
      JSON.stringify(mergedProfile),
      JSON.stringify(mergedSettings),
      JSON.stringify(mergedPRs),
      JSON.stringify(mergedCustom),
    ).run();

    // Workout history: insert new sessions (ignore duplicates)
    if (history && history.length > 0) {
      for (const session of history) {
        const sessionId = session.id || crypto.randomUUID();
        const completedAt = session.completedAt || session.date || new Date().toISOString();
        try {
          await env.DB.prepare(
            `INSERT OR IGNORE INTO workout_history (id, user_id, data, completed_at)
             VALUES (?, ?, ?, ?)`
          ).bind(sessionId, user.id, JSON.stringify(session), completedAt).run();
        } catch {
          // Ignore duplicates
        }
      }
    }

    return json({
      ok: true,
      merged: {
        profile: mergedProfile,
        settings: mergedSettings,
        personalRecords: mergedPRs,
        customWorkouts: mergedCustom,
      },
    });
  } catch (err) {
    console.error('sync push error:', err);
    return json({ error: 'Sync failed' }, 500);
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

/** Max-value-wins merge for personal records */
function mergePRs(server, client) {
  const merged = { ...server };
  for (const [exercise, metrics] of Object.entries(client)) {
    if (!merged[exercise]) {
      merged[exercise] = metrics;
      continue;
    }
    for (const [metric, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        merged[exercise][metric] = Math.max(merged[exercise][metric] || 0, value);
      } else {
        // Non-numeric: keep client value if no server value
        if (!merged[exercise][metric]) merged[exercise][metric] = value;
      }
    }
  }
  return merged;
}

/** Union merge arrays by .id field */
function unionById(serverArr, clientArr) {
  const map = new Map();
  for (const item of serverArr) {
    if (item.id) map.set(item.id, item);
  }
  for (const item of clientArr) {
    if (item.id) map.set(item.id, item);
  }
  return Array.from(map.values());
}

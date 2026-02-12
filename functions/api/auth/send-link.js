/**
 * POST /api/auth/send-link
 * Accept email, find-or-create user, send magic link via Brevo.
 * Rate limited: max 3 requests per email per hour.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: max 3 magic links per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentCount = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM auth_tokens
       WHERE user_id IN (SELECT id FROM users WHERE email = ?)
       AND type = 'magic_link' AND created_at > ?`
    ).bind(normalizedEmail, oneHourAgo).first();

    if (recentCount?.cnt >= 3) {
      return json({ error: 'Too many requests. Try again later.' }, 429);
    }

    // Find or create user
    let user = await env.DB.prepare(
      'SELECT id, email FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();

    if (!user) {
      const userId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO users (id, email) VALUES (?, ?)'
      ).bind(userId, normalizedEmail).run();
      user = { id: userId, email: normalizedEmail };
    }

    // Generate magic link token (64 hex chars, 15min expiry)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await env.DB.prepare(
      'INSERT INTO auth_tokens (token, user_id, type, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(token, user.id, 'magic_link', expiresAt).run();

    // Build verify URL
    const origin = new URL(request.url).origin;
    const verifyUrl = `${origin}/api/auth/verify?token=${token}`;

    // Send email via Brevo
    const brevoKey = env.BREVO_API_KEY;
    if (!brevoKey) {
      return json({ error: 'Email service not configured' }, 500);
    }

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Speak-EZ', email: 'speakez-login@kpan.dev' },
        to: [{ email: normalizedEmail }],
        subject: 'Sign in to Speak-EZ',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #7c5cfc;">Speak-EZ</h2>
            <p>Click the button below to sign in. This link expires in 15 minutes.</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #7c5cfc; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Sign in to Speak-EZ
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Brevo error:', await emailResponse.text());
      return json({ error: 'Failed to send email' }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error('send-link error:', err);
    return json({ error: 'Server error' }, 500);
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

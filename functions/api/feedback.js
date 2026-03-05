/**
 * Cloudflare Pages Function - Gemini API Proxy
 *
 * Route: POST /api/feedback
 *
 * Supports two modes:
 * 1. Text-only: { prompt } → simple text response
 * 2. Audio/video review: { prompt, media, mimeType } → structured feedback JSON
 *
 * The media field is base64-encoded audio/video from a recording.
 * Gemini transcribes and analyzes the spoken response relative to the prompt.
 */

const REVIEW_SYSTEM_PROMPT = `You are a speaking coach reviewing a practice recording. The speaker was responding to this prompt:

"{{PROMPT}}"

Listen to the recording carefully. Transcribe what they said and provide constructive, specific feedback. Be encouraging but honest.

Return your response as JSON with exactly this structure:
{
  "summary": "2-3 sentence summary of what the speaker said",
  "transcript": "verbatim or near-verbatim transcript of the spoken response",
  "scores": {
    "clarity": <1-10, how clearly ideas were expressed — penalize jargon, vague language, confusing structure>,
    "structure": <1-10, how well-organized — does it have a clear opening, body, close?>,
    "confidence": <1-10, assertive language, steady delivery, no excessive hedging — penalize "I think maybe", "I guess", "sort of">,
    "conciseness": <1-10, direct and to the point — penalize padding, repetition, unnecessary tangents>,
    "filler_rate": <1-10, frequency of filler words (um, uh, like, you know) — 10=none, 7=occasional, 4=frequent, 1=constant>,
    "pace": <1-10, speaking speed — 10=ideal 120-160 WPM, penalize if clearly too fast or too slow>
  },
  "filler_count": <integer count of filler words detected>,
  "estimated_wpm": <estimated words per minute, or null if unclear>,
  "session_reaction": <"great" if all scores>=7, "tough" if 2+ scores<=4, otherwise "solid">,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["actionable improvement 1", "actionable improvement 2"],
  "example": "A concise example of a stronger way to answer this prompt (2-3 sentences)"
}

Important: scores must be integers 1-10. Keep strengths and improvements to 2-3 items each.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders };

  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const body = await request.json();
    const { prompt, media, mimeType, interviewContext } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Build Gemini request based on mode
    const isMediaReview = media && mimeType;
    let contents;
    let generationConfig;

    if (isMediaReview) {
      // Multimodal: analyze recording + prompt context
      let systemText = REVIEW_SYSTEM_PROMPT.replace('{{PROMPT}}', prompt);
      if (interviewContext?.position) {
        const role = interviewContext.level
          ? `${interviewContext.level}-level ${interviewContext.position}`
          : interviewContext.position;
        systemText += `\n\nThe speaker is preparing for interviews for a ${role} position. Tailor your feedback to what an interviewer for this role would expect. Consider whether the answer demonstrates relevant skills, domain knowledge, and the appropriate level of seniority.`;
      }
      contents = [{
        parts: [
          { text: systemText },
          { inline_data: { mime_type: mimeType, data: media } }
        ]
      }];
      generationConfig = {
        maxOutputTokens: 1200,
        temperature: 0.7,
        responseMimeType: 'application/json'
      };
    } else {
      // Text-only (legacy mode)
      contents = [{
        parts: [{ text: prompt }]
      }];
      generationConfig = {
        maxOutputTokens: 1000,
        temperature: 0.7
      };
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig })
      }
    );

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error('Gemini API returned error:', geminiResponse.status, errBody);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 502, headers: jsonHeaders }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (isMediaReview) {
      // Parse structured feedback JSON
      try {
        const feedback = JSON.parse(text);
        return new Response(
          JSON.stringify({ feedback }),
          { status: 200, headers: jsonHeaders }
        );
      } catch {
        // Gemini returned text instead of JSON — wrap it
        return new Response(
          JSON.stringify({ feedback: { summary: text, scores: null, strengths: [], improvements: [], example: '' } }),
          { status: 200, headers: jsonHeaders }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ text }),
        { status: 200, headers: jsonHeaders }
      );
    }

  } catch (err) {
    console.error('Gemini API error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to get AI feedback' }),
      { status: 500, headers: jsonHeaders }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

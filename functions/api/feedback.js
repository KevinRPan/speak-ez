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

Listen to the recording carefully. Provide constructive, specific feedback to help them improve their answer. Be encouraging but honest.

Return your response as JSON with exactly this structure:
{
  "summary": "2-3 sentence summary of what the speaker said",
  "scores": {
    "relevance": <1-5, how well the answer addressed the question>,
    "clarity": <1-5, how clearly ideas were expressed>,
    "structure": <1-5, how well-organized the response was>
  },
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["actionable improvement 1", "actionable improvement 2"],
  "example": "A concise example of a stronger way to answer this prompt (2-3 sentences)"
}

Important: scores must be integers 1-5. Keep strengths and improvements to 2-3 items each. The example should be a brief model answer, not a full script.`;

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
    const { prompt, media, mimeType } = body;

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
      const systemText = REVIEW_SYSTEM_PROMPT.replace('{{PROMPT}}', prompt);
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

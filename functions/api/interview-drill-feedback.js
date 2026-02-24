/**
 * Cloudflare Pages Function — Interview Drill Feedback
 *
 * Route: POST /api/interview-drill-feedback
 *
 * Takes a question, rubric, field/level context, and the candidate's transcript.
 * Returns structured feedback via Gemini with per-criterion scores.
 */

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
    const { field, level, roundLabel, rubric, question, transcript } = body;

    if (!question || !transcript) {
      return new Response(
        JSON.stringify({ error: 'Missing question or transcript' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const rubricList = (rubric || []).join(', ');

    const systemPrompt = `You are an expert interview coach specializing in ${field || 'technical'} interviews at the ${level || 'Senior'} level. You are reviewing a candidate's answer to a ${roundLabel || 'interview'} question.

Evaluate the response on these criteria: ${rubricList || 'clarity, structure, depth'}.

Return ONLY valid JSON with no markdown fences or preamble. Use this exact structure:
{
  "overall_score": <number 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "scores": [
    {"criterion": "<criterion name>", "score": <1-10>, "comment": "<1-2 sentence specific feedback>"}
  ],
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific actionable improvement 1>", "<specific actionable improvement 2>"],
  "example_reframe": "<optional: a stronger way to phrase one part of their answer>"
}

Important:
- scores array must have one entry per evaluation criterion
- Be specific and actionable in your feedback
- Reference the actual content of their answer
- Calibrate expectations to the ${level || 'Senior'} level`;

    const userPrompt = `Interview Question: "${question}"

Candidate's Response:
"${transcript}"

Provide your evaluation as JSON only.`;

    const contents = [{
      parts: [
        { text: systemPrompt },
        { text: userPrompt },
      ]
    }];

    const generationConfig = {
      maxOutputTokens: 1200,
      temperature: 0.7,
      responseMimeType: 'application/json',
    };

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig }),
      }
    );

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errBody);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 502, headers: jsonHeaders }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const feedback = JSON.parse(text);
      return new Response(
        JSON.stringify({ feedback }),
        { status: 200, headers: jsonHeaders }
      );
    } catch {
      // Gemini returned non-JSON — wrap it
      return new Response(
        JSON.stringify({
          feedback: {
            overall_score: 5,
            summary: text || 'Unable to parse structured feedback.',
            scores: [],
            strengths: [],
            improvements: [],
            example_reframe: '',
          }
        }),
        { status: 200, headers: jsonHeaders }
      );
    }
  } catch (err) {
    console.error('Interview drill feedback error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to generate feedback' }),
      { status: 500, headers: jsonHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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

import { geminiAnswerText, geminiErrorDetail, geminiGenerateUrl, geminiRequestBody } from './_gemini.js';

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
    "pace": <1-10, speaking speed — 10=ideal 120-160 WPM, penalize if clearly too fast or too slow>,
    "directness": <1-10, did the opening answer what was asked and state the point or recommendation — 10=the first sentence is the answer, 4=they get there after caveats or background, 1=they never answer. Fluent, filler-free speech does not raise this score when the point is buried>
  },
  "message": {
    "answered": "yes" | "partial" | "no",
    "answered_note": "one sentence: did they answer the question that was asked, and if not, what they answered instead",
    "recommendation": "led" | "buried" | "missing" | "not_asked",
    "recommendation_note": "one sentence: where the recommendation or main point landed",
    "caveats": "tight" | "one" | "stacked",
    "caveat_note": "one sentence naming the hedges, or saying the caveat earned its place"
  },
  "filler_count": <integer count of filler words detected>,
  "estimated_wpm": <estimated words per minute, or null if unclear>,
  "session_reaction": <"great" if all scores>=7, "tough" if 2+ scores<=4, otherwise "solid">,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["actionable improvement 1", "actionable improvement 2"],
  "example": "A concise example of a stronger way to answer this prompt (2-3 sentences). Lead with the answer or the recommendation, then at most one necessary caveat."
}

Judge what they said, not only how fluently they said it.
- answered is "no" when they never address the question, "partial" when they circle it, and "yes" when a listener could repeat the answer from the opening.
- recommendation is "led" when the call is in the first sentence, "buried" when it arrives after context or caveats, "missing" when a decision was needed and none was stated, and "not_asked" when the prompt does not call for a recommendation.
- caveats is "stacked" when two or more hedges or caveats arrive before the point. "one" means a single caveat after the point. "tight" means no caveat, or the caveat is the point.
- If they bury the recommendation, stack caveats, or miss the question, say that in improvements in those words, with a short quote when you can.
- On acting, comedy, story, vocal, or physical drills, set recommendation to "not_asked", caveats to "tight", and answered to "yes" unless the drill context says to judge a recommendation. Do not tell those speakers to open with a business recommendation.

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
    const { prompt, media, mimeType, interviewContext, coachContext } = body;

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
      if (typeof coachContext === 'string' && coachContext.trim()) {
        systemText += `\n\nDrill context: ${coachContext.slice(0, 1500)}\n\nJudge the recording as a coach for this specific drill, following the drill context above — including how to interpret the score dimensions. Keep the JSON structure and score keys exactly the same, including message and directness, but make the strengths, improvements, and example specific to this drill rather than generic public-speaking advice. If this drill is not a question, a recommendation, or a briefing, mark recommendation "not_asked" and do not force an executive frame.`;
      } else if (interviewContext?.position) {
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
        maxOutputTokens: 1600,
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

    const geminiResponse = await fetch(geminiGenerateUrl(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequestBody(contents, generationConfig)),
    });

    // Follow-up: the Gemini project behind GEMINI_API_KEY is out of prepay
    // credits, so review calls fail with HTTP 402 ("Your prepayment credits
    // are depleted") until someone buys credits at https://ai.studio/projects.
    // The rating screen takes a written transcript until that balance is positive.
    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error('Gemini API returned error:', geminiResponse.status, errBody);
      return new Response(
        JSON.stringify({ error: 'AI service error', detail: geminiErrorDetail(errBody) }),
        { status: 502, headers: jsonHeaders }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiAnswerText(geminiData);

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

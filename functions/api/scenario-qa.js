/**
 * Cloudflare Pages Function — Scenario Q&A
 *
 * Route: POST /api/scenario-qa
 *
 * Accepts a recording (base64 audio/video) plus scenario context.
 * Gemini role-plays as the other person in the scenario and either:
 * - Asks a contextual follow-up question, or
 * - Provides final summary feedback when isComplete is true
 */

const QA_SYSTEM_PROMPT = `You are role-playing in a communication practice scenario. Here is the situation:

SCENARIO: "{{SCENARIO_CONTEXT}}"

YOUR ROLE: {{AI_ROLE}}

The user just recorded their response. Listen carefully to their recording and respond IN CHARACTER.

{{ROUND_INSTRUCTION}}

Return your response as JSON with exactly this structure:
{
  "question": "<your in-character follow-up question or response, 1-3 sentences>",
  "feedbackOnPrevious": "<brief internal note on how the user did, 1 sentence>",
  "isComplete": {{IS_COMPLETE}}{{SUMMARY_FIELD}}
}

Important: Stay in character. Be natural and realistic. React to what the user actually said in their recording.`;

const SUMMARY_TEMPLATE = `,
  "summary": {
    "summary": "<2-3 sentence overall assessment of how the user handled the scenario>",
    "scores": {
      "confidence": <1-5>,
      "relevance": <1-5>,
      "clarity": <1-5>,
      "engagement": <1-5>
    },
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["actionable improvement 1", "actionable improvement 2"]
  }`;

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
    const {
      media,
      mimeType,
      scenarioContext,
      aiRole,
      scenarioName,
      conversationHistory = [],
      round = 1,
      totalRounds = 3,
    } = body;

    if (!media || !mimeType || !scenarioContext) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const isLastRound = round >= totalRounds;

    // Build round-specific instructions
    let roundInstruction;
    if (round <= 1) {
      roundInstruction = 'This is the user\'s initial response to the scenario. React naturally and ask a relevant follow-up question that the other person in this situation would genuinely ask.';
    } else if (isLastRound) {
      roundInstruction = 'This is the final round. React to what they said, give a brief closing response in character, and then provide a complete performance summary.';
    } else {
      roundInstruction = `This is round ${round} of ${totalRounds}. Continue the conversation naturally. React to their previous answer AND ask a new follow-up question.`;
    }

    // Build the system prompt
    const systemText = QA_SYSTEM_PROMPT
      .replace('{{SCENARIO_CONTEXT}}', scenarioContext)
      .replace('{{AI_ROLE}}', aiRole || 'Respond naturally as the other person in the scenario.')
      .replace('{{ROUND_INSTRUCTION}}', roundInstruction)
      .replace('{{IS_COMPLETE}}', isLastRound ? 'true' : 'false')
      .replace('{{SUMMARY_FIELD}}', isLastRound ? SUMMARY_TEMPLATE : '');

    // Build conversation context for multi-round
    let contextParts = [{ text: systemText }];

    // Add conversation history as context
    if (conversationHistory.length > 0) {
      const historyText = conversationHistory
        .map(m => `${m.role === 'assistant' ? 'You' : 'User'}: ${m.text}`)
        .join('\n');
      contextParts.push({ text: `Previous conversation:\n${historyText}\n\nNow listen to the user's latest response:` });
    }

    // Add the audio/video recording
    contextParts.push({ inline_data: { mime_type: mimeType, data: media } });

    const contents = [{ parts: contextParts }];

    const generationConfig = {
      maxOutputTokens: isLastRound ? 1500 : 800,
      temperature: 0.8,
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
      const parsed = JSON.parse(text);
      return new Response(
        JSON.stringify(parsed),
        { status: 200, headers: jsonHeaders }
      );
    } catch {
      // Fallback if Gemini returns non-JSON
      return new Response(
        JSON.stringify({
          question: text || 'That was interesting. Can you tell me more about your approach?',
          isComplete: isLastRound,
          summary: isLastRound ? {
            summary: 'Good practice session overall.',
            scores: { confidence: 3, relevance: 3, clarity: 3, engagement: 3 },
            strengths: ['Completed the scenario'],
            improvements: ['Continue practicing for more natural delivery'],
          } : undefined,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

  } catch (err) {
    console.error('Scenario Q&A error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to process scenario Q&A' }),
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
    },
  });
}

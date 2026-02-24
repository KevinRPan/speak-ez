/**
 * Cloudflare Pages Function — Interview Q&A
 *
 * Route: POST /api/interview-qa
 *
 * Accepts a recording (base64 audio/video) and/or text transcript,
 * plus job description and company context.
 * Gemini role-plays as a tough, constructive interviewer.
 */

const QA_SYSTEM_PROMPT = `You are an expert interviewer conducting a job interview. Here is the context:

JOB DESCRIPTION:
"{{JOB_DESCRIPTION}}"

COMPANY CONTEXT:
"{{COMPANY_CONTEXT}}"

Your goal is to assess the candidate's skills, experience, and cultural fit for this specific role and company.
Be professional, challenging, and constructive.

{{ROUND_INSTRUCTION}}

Return your response as JSON with exactly this structure:
{
  "question": "<your in-character follow-up question or response, typically 1 to 3 sentences>",
  "feedbackOnPrevious": "<brief internal note on how the candidate did, 1 sentence>",
  "isComplete": {{IS_COMPLETE}}{{SUMMARY_FIELD}}
}

Important:
- Stay in character as the interviewer.
- DO NOT just ask generic questions; reference their ACTUAL previous answers or the specific company/job details.
- When they answer, DIG DEEPER. Ask follow ups based on what they just said.
- Do NOT provide the JSON structure inside markdown code blocks (e.g. no \`\`\`json). Just the raw JSON.`;

const SUMMARY_TEMPLATE = `,
  "summary": {
    "summary": "<2-3 sentence overall assessment of how the candidate did in the interview>",
    "scores": {
      "confidence": <integer 1-5>,
      "technicalDepth": <integer 1-5>,
      "communication": <integer 1-5>
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
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: jsonHeaders });
    }

    const body = await request.json();
    const {
      media,
      mimeType,
      textFallback,
      jobDescription,
      companyContext,
      conversationHistory = [],
      round = 1,
      totalRounds = 4,
    } = body;

    if (!jobDescription) {
      return new Response(JSON.stringify({ error: 'Missing jobDescription' }), { status: 400, headers: jsonHeaders });
    }

    const isLastRound = round >= totalRounds;

    // Build round-specific instructions
    let roundInstruction;
    if (round <= 1) {
      roundInstruction = 'This is the START of the interview. Ask a targeted, challenging opening question based on the job description.';
    } else if (isLastRound) {
      roundInstruction = 'This is the final round. React to their last answer, give a brief closing response in character saying you will be in touch, and then provide a complete performance summary.';
    } else {
      roundInstruction = `This is round ${round} of ${totalRounds}. Continue the interview naturally. React to their previous answer AND ask a challenging follow-up question that digs deeper into their response.`;
    }

    const systemText = QA_SYSTEM_PROMPT
      .replace('{{JOB_DESCRIPTION}}', jobDescription)
      .replace('{{COMPANY_CONTEXT}}', companyContext || 'No specific company context provided.')
      .replace('{{ROUND_INSTRUCTION}}', roundInstruction)
      .replace('{{IS_COMPLETE}}', isLastRound ? 'true' : 'false')
      .replace('{{SUMMARY_FIELD}}', isLastRound ? SUMMARY_TEMPLATE : '');

    let contextParts = [{ text: systemText }];

    if (conversationHistory.length > 0) {
      const historyText = conversationHistory
        .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
        .join('\\n');
      
      contextParts.push({ text: `Previous conversation:\\n${historyText}\\n\\nNow listen/read the candidate's latest response:` });
    }

    if (textFallback && (!media || conversationHistory.length > 0)) {
      contextParts.push({ text: `Candidate's transcript: "${textFallback}"` });
    }

    if (media && mimeType) {
      contextParts.push({ inline_data: { mime_type: mimeType, data: media } });
    }

    const contents = [{ parts: contextParts }];

    const generationConfig = {
      maxOutputTokens: isLastRound ? 1500 : 800,
      temperature: 0.7, // slightly lower for more focused interview questions
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
      throw new Error('AI service error');
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const parsed = JSON.parse(text);
      return new Response(JSON.stringify(parsed), { status: 200, headers: jsonHeaders });
    } catch {
      // Fallback
      return new Response(
        JSON.stringify({
          question: text || 'That is a very interesting perspective. Can you elaborate further?',
          isComplete: isLastRound,
          summary: isLastRound ? {
            summary: 'Good interview overall.',
            scores: { confidence: 3, technicalDepth: 3, communication: 3 },
            strengths: ['Answered the questions'],
            improvements: ['Provide more concrete examples']
          } : undefined,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }
  } catch (err) {
    console.error('Interview Q&A error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to process interview Q&A' }), { status: 500, headers: jsonHeaders });
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

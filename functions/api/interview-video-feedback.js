/**
 * Cloudflare Pages Function - Interview Video Feedback
 *
 * Route: POST /api/interview-video-feedback
 *
 * Flow:
 * 1) Transcribe uploaded audio/video to text
 * 2) Evaluate transcript with interview-type-weighted rubric
 * 3) Generate a dynamic next follow-up question for multi-turn practice
 */

const TRANSCRIBE_PROMPT = `You are a precise transcription engine.

Transcribe the spoken content from the provided media file.

Return ONLY valid JSON using this exact shape:
{
  "transcript": "<full transcript text>",
  "notes": {
    "hesitations": "<short note about notable pauses/hesitations if detectable>",
    "deliverySignals": "<short note about pace/tonality signals if detectable from audio>"
  }
}

Rules:
- Do not summarize; transcribe the actual words spoken.
- Keep filler words if they were spoken (um, uh, like, you know, etc.).
- If a segment is unclear, mark it as [inaudible].
- Keep output as raw JSON only.`;

const EVALUATION_PROMPT = `You are role-playing as this interviewer:
"{{INTERVIEW_ROLE}}"

Context:
- Interview type: {{INTERVIEW_TYPE}}
- Interview scenario: {{INTERVIEW_SCENARIO}}
- Job description / role brief: {{JOB_DESCRIPTION}}
- Job notes / company context: {{JOB_NOTES}}
- Question/topic being answered: {{QUESTION_CONTEXT}}
- Current round: {{CURRENT_ROUND}} / {{TARGET_ROUNDS}}

Weighted rubric priorities for this interview type:
{{WEIGHT_GUIDANCE}}

You are given a candidate transcript and optional delivery notes from transcription.
Evaluate the candidate as this interviewer would.

Return ONLY valid JSON with this exact structure:
{
  "overallScore": <integer 1-10>,
  "scores": {
    "pausing": <integer 1-10>,
    "language": <integer 1-10>,
    "tonality": <integer 1-10>,
    "pace": <integer 1-10>,
    "structure": <integer 1-10>,
    "interviewerFit": <integer 1-10>
  },
  "summary": "<2-4 sentence evaluation>",
  "strengths": ["<specific strength>", "<specific strength>"],
  "improvements": ["<specific improvement>", "<specific improvement>"],
  "rewriteExample": "<a stronger 3-5 sentence example answer in the same context>",
  "followUpQuestions": ["<one likely interviewer follow-up>", "<one likely interviewer follow-up>"]
}

Scoring guidance:
- Be strict but fair for senior/staff-level expectations.
- If tonality/pace cannot be strongly inferred from text-only signals, still score based on available evidence and note uncertainty in summary.
- Keep strengths and improvements actionable and concrete.
- Return raw JSON only.`;

const NEXT_QUESTION_PROMPT = `You are the interviewer continuing a live interview.

Context:
- Interview type: {{INTERVIEW_TYPE}}
- Interview role: {{INTERVIEW_ROLE}}
- Interview scenario: {{INTERVIEW_SCENARIO}}
- Job description: {{JOB_DESCRIPTION}}
- Job notes: {{JOB_NOTES}}
- Current round: {{CURRENT_ROUND}} / {{TARGET_ROUNDS}}

Task:
- Read the conversation history and latest candidate answer.
- Ask one specific, grounded follow-up question that references a concrete claim/decision/metric/tradeoff from the latest answer.
- Do not ask generic questions.
- If this interview is complete (current round >= target rounds), return shouldContinue=false and nextQuestion="".

Return raw JSON only in this format:
{
  "shouldContinue": <true|false>,
  "nextQuestion": "<one interviewer follow-up question if shouldContinue=true, else empty string>",
  "reason": "<short explanation>"
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
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const body = await request.json();
    const {
      media,
      mimeType,
      interviewType,
      interviewRole,
      interviewScenario,
      jobDescription,
      jobNotes,
      questionContext,
      conversationHistory = [],
      currentRound = 1,
      targetRounds = 4,
    } = body;

    if (!media || !mimeType) {
      return new Response(JSON.stringify({ error: 'Missing media or mimeType' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const role = interviewRole || 'Senior Staff Data Science interviewer at Anthropic';
    const typeKey = interviewType || 'hiring-manager';
    const type = formatInterviewType(typeKey);
    const scenario = interviewScenario || 'Behavioral and technical interview';
    const jd = jobDescription || 'No job description provided.';
    const notes = jobNotes || 'No additional notes provided.';
    const question = questionContext || 'General interview response';

    const weights = getInterviewWeights(typeKey);
    const weightGuidance = weightGuidanceText(weights);

    const transcriptData = await callGemini({
      apiKey,
      contents: [{
        parts: [
          { text: TRANSCRIBE_PROMPT },
          { inline_data: { mime_type: mimeType, data: media } },
        ],
      }],
      generationConfig: {
        maxOutputTokens: 2500,
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
      jsonHeaders,
    });

    if (transcriptData.errorResponse) {
      return transcriptData.errorResponse;
    }

    const transcriptText = transcriptData.parsed?.transcript || '';
    const transcriptionNotes = transcriptData.parsed?.notes || {};

    if (!transcriptText.trim()) {
      return new Response(JSON.stringify({ error: 'Could not transcribe media' }), {
        status: 422,
        headers: jsonHeaders,
      });
    }

    const evaluationSystemPrompt = EVALUATION_PROMPT
      .replace('{{INTERVIEW_ROLE}}', role)
      .replace('{{INTERVIEW_TYPE}}', type)
      .replace('{{INTERVIEW_SCENARIO}}', scenario)
      .replace('{{JOB_DESCRIPTION}}', jd)
      .replace('{{JOB_NOTES}}', notes)
      .replace('{{QUESTION_CONTEXT}}', question)
      .replace('{{CURRENT_ROUND}}', String(currentRound))
      .replace('{{TARGET_ROUNDS}}', String(targetRounds))
      .replace('{{WEIGHT_GUIDANCE}}', weightGuidance);

    const evaluationData = await callGemini({
      apiKey,
      contents: [{
        parts: [
          { text: evaluationSystemPrompt },
          { text: buildEvaluationContext(conversationHistory, transcriptText, transcriptionNotes) },
        ],
      }],
      generationConfig: {
        maxOutputTokens: 1800,
        temperature: 0.45,
        responseMimeType: 'application/json',
      },
      jsonHeaders,
    });

    if (evaluationData.errorResponse) {
      return evaluationData.errorResponse;
    }

    const normalizedFeedback = normalizeFeedback(evaluationData.parsed, weights);

    const nextQuestionData = await generateNextQuestion({
      apiKey,
      jsonHeaders,
      role,
      type,
      scenario,
      jd,
      notes,
      currentRound,
      targetRounds,
      questionContext: question,
      transcriptText,
      conversationHistory,
    });

    if (nextQuestionData.errorResponse) {
      return nextQuestionData.errorResponse;
    }

    return new Response(
      JSON.stringify({
        transcript: transcriptText,
        transcriptionNotes,
        feedback: normalizedFeedback,
        rubricWeights: weights,
        nextQuestion: nextQuestionData.parsed?.shouldContinue ? nextQuestionData.parsed?.nextQuestion || '' : '',
        shouldContinue: Boolean(nextQuestionData.parsed?.shouldContinue),
        round: Number(currentRound) || 1,
        targetRounds: Number(targetRounds) || 4,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error('Interview video feedback error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process interview video' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}

async function generateNextQuestion({
  apiKey,
  jsonHeaders,
  role,
  type,
  scenario,
  jd,
  notes,
  currentRound,
  targetRounds,
  questionContext,
  transcriptText,
  conversationHistory,
}) {
  const prompt = NEXT_QUESTION_PROMPT
    .replace('{{INTERVIEW_TYPE}}', type)
    .replace('{{INTERVIEW_ROLE}}', role)
    .replace('{{INTERVIEW_SCENARIO}}', scenario)
    .replace('{{JOB_DESCRIPTION}}', jd)
    .replace('{{JOB_NOTES}}', notes)
    .replace('{{CURRENT_ROUND}}', String(currentRound))
    .replace('{{TARGET_ROUNDS}}', String(targetRounds));

  return callGemini({
    apiKey,
    contents: [{
      parts: [
        { text: prompt },
        {
          text: `Current question/topic: ${questionContext}\n\nConversation history:\n${formatConversationHistory(conversationHistory)}\n\nLatest candidate answer:\n"""${transcriptText}"""`,
        },
      ],
    }],
    generationConfig: {
      maxOutputTokens: 450,
      temperature: 0.55,
      responseMimeType: 'application/json',
    },
    jsonHeaders,
  });
}

function normalizeFeedback(rawFeedback, weights) {
  const feedback = rawFeedback && typeof rawFeedback === 'object' ? rawFeedback : {};
  const scores = {
    pausing: clampScore(feedback?.scores?.pausing),
    language: clampScore(feedback?.scores?.language),
    tonality: clampScore(feedback?.scores?.tonality),
    pace: clampScore(feedback?.scores?.pace),
    structure: clampScore(feedback?.scores?.structure),
    interviewerFit: clampScore(feedback?.scores?.interviewerFit),
  };

  const weightedScore = Math.round(
    scores.pausing * weights.pausing +
    scores.language * weights.language +
    scores.tonality * weights.tonality +
    scores.pace * weights.pace +
    scores.structure * weights.structure +
    scores.interviewerFit * weights.interviewerFit
  );

  return {
    overallScore: clampScore(weightedScore || feedback.overallScore),
    weightedOverallScore: clampScore(weightedScore),
    scores,
    summary: feedback.summary || 'Solid response with room to improve.',
    strengths: Array.isArray(feedback.strengths) ? feedback.strengths.slice(0, 4) : [],
    improvements: Array.isArray(feedback.improvements) ? feedback.improvements.slice(0, 4) : [],
    rewriteExample: feedback.rewriteExample || '',
    followUpQuestions: Array.isArray(feedback.followUpQuestions) ? feedback.followUpQuestions.slice(0, 3) : [],
  };
}

function clampScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 5;
  return Math.max(1, Math.min(10, Math.round(num)));
}

function buildEvaluationContext(conversationHistory, transcriptText, transcriptionNotes) {
  return `Conversation history:\n${formatConversationHistory(conversationHistory)}\n\nLatest transcript:\n"""${transcriptText}"""\n\nTranscription notes:\n${JSON.stringify(transcriptionNotes)}`;
}

function formatConversationHistory(conversationHistory) {
  if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
    return '(No previous turns)';
  }
  return conversationHistory
    .slice(-8)
    .map((turn, idx) => {
      const q = String(turn?.question || '').trim() || '(No question)';
      const a = String(turn?.transcript || '').trim() || '(No answer)';
      return `Turn ${idx + 1} - Q: ${q}\nTurn ${idx + 1} - A: ${a}`;
    })
    .join('\n');
}

function getInterviewWeights(interviewType) {
  const map = {
    'recruiter-screen': {
      pausing: 0.12,
      language: 0.24,
      tonality: 0.2,
      pace: 0.16,
      structure: 0.12,
      interviewerFit: 0.16,
    },
    'hiring-manager': {
      pausing: 0.12,
      language: 0.2,
      tonality: 0.14,
      pace: 0.12,
      structure: 0.2,
      interviewerFit: 0.22,
    },
    'behavioral': {
      pausing: 0.12,
      language: 0.2,
      tonality: 0.16,
      pace: 0.12,
      structure: 0.22,
      interviewerFit: 0.18,
    },
    'coding': {
      pausing: 0.1,
      language: 0.14,
      tonality: 0.1,
      pace: 0.1,
      structure: 0.24,
      interviewerFit: 0.32,
    },
    'system-design': {
      pausing: 0.08,
      language: 0.14,
      tonality: 0.1,
      pace: 0.1,
      structure: 0.3,
      interviewerFit: 0.28,
    },
    'final-onsite': {
      pausing: 0.12,
      language: 0.18,
      tonality: 0.14,
      pace: 0.12,
      structure: 0.22,
      interviewerFit: 0.22,
    },
  };

  return map[interviewType] || map['hiring-manager'];
}

function weightGuidanceText(weights) {
  return [
    `pausing=${Math.round(weights.pausing * 100)}%`,
    `language=${Math.round(weights.language * 100)}%`,
    `tonality=${Math.round(weights.tonality * 100)}%`,
    `pace=${Math.round(weights.pace * 100)}%`,
    `structure=${Math.round(weights.structure * 100)}%`,
    `interviewerFit=${Math.round(weights.interviewerFit * 100)}%`,
  ].join(', ');
}

async function callGemini({ apiKey, contents, generationConfig, jsonHeaders }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Gemini API error:', response.status, errBody);
    return {
      errorResponse: new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: jsonHeaders,
      }),
    };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    return { parsed: JSON.parse(text) };
  } catch {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'AI returned invalid JSON' }), {
        status: 502,
        headers: jsonHeaders,
      }),
    };
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

function formatInterviewType(interviewType) {
  const map = {
    'recruiter-screen': 'Recruiter Screen',
    'hiring-manager': 'Hiring Manager',
    'behavioral': 'Behavioral',
    'coding': 'Coding / Technical',
    'system-design': 'System Design',
    'final-onsite': 'Final Onsite',
  };
  return map[interviewType] || interviewType || 'Interview';
}

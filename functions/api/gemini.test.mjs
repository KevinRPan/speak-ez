import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestPost as feedback } from './feedback.js';
import { onRequestPost as drillFeedback } from './interview-drill-feedback.js';
import { onRequestPost as interviewQa } from './interview-qa.js';
import { onRequestPost as videoFeedback } from './interview-video-feedback.js';
import { onRequestPost as scenarioQa } from './scenario-qa.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(payload) {
  return new Response(JSON.stringify({
    candidates: [{
      content: {
        parts: [
          { thought: true, text: 'internal reasoning that must not be parsed' },
          { text: JSON.stringify(payload) },
        ],
      },
    }],
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function post(path, body) {
  return new Request(`https://speak-ez.test${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function captureFetch(payloads) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    const payload = payloads[calls.length - 1] ?? payloads[payloads.length - 1];
    return jsonResponse(payload);
  };
  return calls;
}

function assertListeningCall(call, { mimeType, media }) {
  assert.match(call.url, /\/models\/gemini-3\.8-flash:generateContent\?key=test$/);
  assert.equal(call.body.generationConfig.thinkingConfig.thinkingLevel, 'LOW');
  assert.equal(call.body.generationConfig.temperature, undefined);
  assert.ok(call.body.generationConfig.maxOutputTokens >= 16384);
  assert.equal(call.body.generationConfig.responseMimeType, 'application/json');
  const audio = call.body.contents[0].parts.find((part) => part.inline_data);
  assert.equal(audio.inline_data.mime_type, mimeType);
  assert.equal(audio.inline_data.data, media);
}

test('workout review sends the recording to gemini-3.8-flash and ignores thought text', async () => {
  const calls = captureFetch([{
    summary: 'Clear introduction.',
    transcript: 'I led the launch.',
    scores: { clarity: 8 },
  }]);

  const response = await feedback({
    request: post('/api/feedback', {
      prompt: 'Tell me about a launch you led',
      media: 'audio-bytes',
      mimeType: 'audio/webm',
      coachContext: 'Judge this as a story landing.',
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.feedback.transcript, 'I led the launch.');
  assert.equal(calls.length, 1);
  assertListeningCall(calls[0], { mimeType: 'audio/webm', media: 'audio-bytes' });
  const prompt = calls[0].body.contents[0].parts[0].text;
  assert.match(prompt, /Listen to the recording carefully/);
  assert.match(prompt, /story landing/);
  assert.match(prompt, /bury the recommendation/);
  assert.match(prompt, /stack caveats/);
  assert.match(prompt, /never answer/);
  assert.match(prompt, /"directness"/);
  assert.match(prompt, /not_asked/);
});

test('interview drill feedback asks for a buried recommendation and a missed question', async () => {
  const calls = captureFetch([{ overall_score: 6, summary: 'Circled the question.' }]);

  const response = await drillFeedback({
    request: post('/api/interview-drill-feedback', {
      question: 'Should we ship?',
      transcript: 'There are a few caveats worth walking through first.',
      field: 'data-science',
      level: 'Staff',
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 200);
  const prompt = calls[0].body.contents[0].parts.map((part) => part.text).join('\n');
  assert.match(prompt, /bury the recommendation/);
  assert.match(prompt, /unnecessary caveat/);
  assert.match(prompt, /fail to answer the question/);
});

test('final scenario round asks whether the recommendation was buried', async () => {
  const calls = captureFetch([{
    question: 'What do you want me to do?',
    feedbackOnPrevious: 'No call yet.',
    isComplete: true,
    summary: { summary: 'No recommendation.', message: { recommendation: 'missing' } },
  }]);

  const response = await scenarioQa({
    request: post('/api/scenario-qa', {
      media: 'scene-audio',
      mimeType: 'audio/webm',
      scenarioContext: 'The CEO wants a decision.',
      aiRole: 'You are the CEO.',
      round: 3,
      totalRounds: 3,
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 200);
  const prompt = calls[0].body.contents[0].parts[0].text;
  assert.match(prompt, /buried/);
  assert.match(prompt, /stacked caveats/);
  assert.match(prompt, /"recommendation": "led"/);
});

test('scenario Q&A sends the recording for the model to answer in character', async () => {
  const calls = captureFetch([{ question: 'What happened next?', isComplete: false }]);

  const response = await scenarioQa({
    request: post('/api/scenario-qa', {
      media: 'scene-audio',
      mimeType: 'audio/webm',
      scenarioContext: 'A teammate missed a deadline.',
      aiRole: 'You are the teammate.',
      round: 1,
      totalRounds: 3,
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.question, 'What happened next?');
  assertListeningCall(calls[0], { mimeType: 'audio/webm', media: 'scene-audio' });
  assert.match(calls[0].body.contents[0].parts[0].text, /Listen carefully to their recording/);
});

test('interview Q&A sends both the recording and the transcript fallback', async () => {
  const calls = captureFetch([{
    question: 'Which metric moved?',
    feedbackOnPrevious: 'You named the project.',
    isComplete: false,
  }]);

  const response = await interviewQa({
    request: post('/api/interview-qa', {
      media: 'answer-audio',
      mimeType: 'audio/webm',
      textFallback: 'I shipped the billing rewrite.',
      jobDescription: 'Staff engineer, payments.',
      conversationHistory: [{ role: 'assistant', text: 'Tell me about a project.' }],
      round: 2,
      totalRounds: 4,
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.question, 'Which metric moved?');
  assertListeningCall(calls[0], { mimeType: 'audio/webm', media: 'answer-audio' });
  const texts = calls[0].body.contents[0].parts.map((part) => part.text).filter(Boolean);
  assert.ok(texts.some((text) => text.includes('I shipped the billing rewrite.')));
});

test('interview video feedback transcribes the media before scoring it', async () => {
  const calls = captureFetch([
    { transcript: 'I cut checkout latency in half.', notes: { pace: 'steady' } },
    { summary: 'Specific result.', scores: { structure: 8 } },
    { shouldContinue: true, nextQuestion: 'How did you measure it?' },
  ]);

  const response = await videoFeedback({
    request: post('/api/interview-video-feedback', {
      media: 'video-bytes',
      mimeType: 'video/webm',
      interviewType: 'hiring-manager',
      questionContext: 'Tell me about a launch.',
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.transcript, 'I cut checkout latency in half.');
  assert.equal(data.nextQuestion, 'How did you measure it?');
  assert.equal(calls.length, 3);
  assertListeningCall(calls[0], { mimeType: 'video/webm', media: 'video-bytes' });
  assert.match(calls[0].body.contents[0].parts[0].text, /Transcribe the spoken content/);
  for (const call of calls.slice(1)) {
    assert.match(call.url, /gemini-3\.8-flash/);
    assert.equal(call.body.generationConfig.thinkingConfig.thinkingLevel, 'LOW');
    assert.equal(call.body.generationConfig.temperature, undefined);
    assert.equal(call.body.contents[0].parts.find((part) => part.inline_data), undefined);
  }
});

test('a rejected Gemini call returns the upstream reason without the API key', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: {
      status: 'INVALID_ARGUMENT',
      message: 'Thinking level MINIMAL is not supported. Request URL had key=secret-value',
    },
  }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const response = await feedback({
    request: post('/api/feedback', {
      prompt: 'Say hello',
      media: 'audio-bytes',
      mimeType: 'audio/webm',
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 502);
  const data = await response.json();
  assert.equal(data.error, 'AI service error');
  assert.match(data.detail, /MINIMAL is not supported/);
  assert.doesNotMatch(data.detail, /secret-value/);
});

test('text-only drill feedback uses the same live model', async () => {
  const calls = captureFetch([{ overall_score: 7, summary: 'Solid answer.' }]);

  const response = await drillFeedback({
    request: post('/api/interview-drill-feedback', {
      question: 'Tell me about a conflict.',
      transcript: 'I wrote down both goals and proposed a trial.',
    }),
    env: { GEMINI_API_KEY: 'test' },
  });

  assert.equal(response.status, 200);
  assert.match(calls[0].url, /gemini-3\.8-flash/);
  assert.equal(calls[0].body.generationConfig.thinkingConfig.thinkingLevel, 'LOW');
  assert.equal(calls[0].body.generationConfig.temperature, undefined);
  assert.equal(calls[0].body.contents[0].parts.find((part) => part.inline_data), undefined);
});

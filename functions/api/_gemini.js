/**
 * Shared Gemini client settings for Pages Functions.
 *
 * gemini-2.0-flash shut down on 2026-06-01. gemini-3.8-flash is the current
 * Flash model that still accepts audio and video. It rejects thinkingLevel
 * MINIMAL, and thinking tokens count against maxOutputTokens, so listening
 * calls use LOW and a budget large enough for the transcript to finish.
 */

export const GEMINI_MODEL = 'gemini-3.8-flash';

const OMITTED_SAMPLING_KEYS = ['temperature', 'topP', 'topK'];
const MIN_OUTPUT_TOKENS = 16384;

export function geminiGenerateUrl(apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

export function geminiRequestBody(contents, generationConfig = {}) {
  const config = { ...generationConfig };
  for (const key of OMITTED_SAMPLING_KEYS) delete config[key];

  return {
    contents,
    generationConfig: {
      ...config,
      maxOutputTokens: Math.max(config.maxOutputTokens || 0, MIN_OUTPUT_TOKENS),
      thinkingConfig: {
        ...config.thinkingConfig,
        thinkingLevel: 'LOW',
      },
    },
  };
}

export function geminiAnswerText(geminiData) {
  const parts = geminiData?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part) => part?.text && !part.thought)
    .map((part) => part.text)
    .join('');
}

export function geminiErrorDetail(errBody) {
  let message = '';
  try {
    const parsed = JSON.parse(errBody);
    message = parsed?.error?.message || parsed?.error?.status || '';
  } catch {
    message = String(errBody || '');
  }
  return String(message).replace(/key=[^&\s"]+/gi, 'key=redacted').slice(0, 300);
}

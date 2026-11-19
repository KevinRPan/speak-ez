/**
 * Shared Gemini client settings for Pages Functions.
 *
 * gemini-2.0-flash was shut down on 2026-06-01. gemini-3.6-flash is the
 * replacement that still accepts audio and video. It thinks by default, and
 * thinking tokens count against maxOutputTokens, so listening calls use the
 * near-off level. Otherwise a short transcript budget comes back empty.
 */

export const GEMINI_MODEL = 'gemini-3.6-flash';

export function geminiGenerateUrl(apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

export function geminiRequestBody(contents, generationConfig = {}) {
  return {
    contents,
    generationConfig: {
      ...generationConfig,
      thinkingConfig: {
        thinkingLevel: 'MINIMAL',
        ...generationConfig.thinkingConfig,
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

/**
 * Transcript Analysis — client-side filler word, pace, and hedge detection
 *
 * Pure utility: no side effects, no imports.
 * Call after any speech-to-text transcription to get spoken language metrics.
 */

// Filler words to detect (order matters for multi-word phrases — check longer first)
const FILLER_WORDS = [
  'you know', 'i mean', 'sort of', 'kind of', 'you know what i mean',
  'um', 'uh', 'er', 'ah',
  'basically', 'literally', 'actually', 'honestly', 'obviously',
  'like', 'right', 'okay', 'so',
  'anyway', 'just',
];

// Hedging language (signals lack of confidence)
const HEDGE_PHRASES = [
  'i think', 'i guess', 'i suppose', 'i feel like', 'i believe',
  'maybe', 'perhaps', 'probably', 'possibly',
  'a little', 'a bit', 'somewhat', 'kind of', 'sort of',
  'might be', 'could be', 'seems like', 'not sure',
];

/**
 * Analyze a transcript string for speaking quality metrics.
 *
 * @param {string} text — raw transcript text
 * @param {number} durationSeconds — recording duration; 0 = unknown
 * @returns {object|null} analysis result or null if no text
 */
export function analyzeTranscript(text, durationSeconds = 0) {
  if (!text || !text.trim()) return null;

  const normalizedText = text.trim();
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const durationMinutes = durationSeconds > 0 ? durationSeconds / 60 : null;

  // --- Filler detection ---
  const fillerCounts = {};
  let workingText = ' ' + normalizedText.toLowerCase() + ' ';

  // Process multi-word fillers first (longer phrases before sub-phrases)
  const sortedFillers = [...FILLER_WORDS].sort((a, b) => b.split(' ').length - a.split(' ').length);
  sortedFillers.forEach(filler => {
    const pattern = '\\b' + filler.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\s+/g, '\\s+') + '\\b';
    const regex = new RegExp(pattern, 'gi');
    const matches = workingText.match(regex);
    if (matches?.length) {
      fillerCounts[filler] = matches.length;
    }
  });

  const fillerCount = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
  const fillersPerMinute = durationMinutes ? Math.round((fillerCount / durationMinutes) * 10) / 10 : null;

  // --- Hedge detection ---
  const hedgeCounts = {};
  HEDGE_PHRASES.forEach(phrase => {
    const pattern = '\\b' + phrase.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\s+/g, '\\s+') + '\\b';
    const regex = new RegExp(pattern, 'gi');
    const matches = normalizedText.match(regex);
    if (matches?.length) {
      hedgeCounts[phrase] = matches.length;
    }
  });

  const hedgeCount = Object.values(hedgeCounts).reduce((a, b) => a + b, 0);
  const hedgeWords = Object.keys(hedgeCounts).sort((a, b) => hedgeCounts[b] - hedgeCounts[a]);

  // --- Pace (WPM) ---
  const wpm = durationMinutes && durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : null;

  // --- Build highlighted HTML ---
  const highlightedHtml = buildHighlightedHtml(normalizedText);

  // --- Filler word summary list ---
  const fillerWords = Object.entries(fillerCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  return {
    wordCount,
    fillerCount,
    fillersPerMinute,
    fillerWords,
    wpm,
    hedgeCount,
    hedgeWords,
    highlightedHtml,
  };
}

function buildHighlightedHtml(text) {
  // Escape HTML first, then wrap fillers in marks
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply multi-word fillers first
  const sortedFillers = [...FILLER_WORDS].sort((a, b) => b.split(' ').length - a.split(' ').length);
  sortedFillers.forEach(filler => {
    const pattern = '\\b(' + filler.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\s+/g, '\\s+') + ')\\b';
    const regex = new RegExp(pattern, 'gi');
    escaped = escaped.replace(regex, '<mark class="filler-mark">$1</mark>');
  });

  return escaped;
}

/**
 * Convert filler rate (fillers/min) to a 1–10 score.
 * Ideal: < 1/min = 10. > 6/min = 1.
 */
export function getFillerRateScore(fillersPerMinute) {
  if (fillersPerMinute === null || fillersPerMinute === undefined) return null;
  if (fillersPerMinute <= 0.5) return 10;
  if (fillersPerMinute <= 1) return 9;
  if (fillersPerMinute <= 2) return 7;
  if (fillersPerMinute <= 3) return 5;
  if (fillersPerMinute <= 5) return 3;
  return 1;
}

/**
 * Convert WPM to a 1–10 pace score.
 * Ideal range: 120–160 WPM.
 */
export function getPaceScore(wpm) {
  if (wpm === null || wpm === undefined) return null;
  if (wpm >= 120 && wpm <= 160) return 10;
  if ((wpm >= 110 && wpm < 120) || (wpm > 160 && wpm <= 170)) return 8;
  if ((wpm >= 95 && wpm < 110) || (wpm > 170 && wpm <= 185)) return 6;
  if ((wpm >= 80 && wpm < 95) || (wpm > 185 && wpm <= 200)) return 4;
  return 2;
}

/**
 * Returns a human-readable label for a WPM value.
 */
export function getPaceLabel(wpm) {
  if (!wpm) return '';
  if (wpm < 100) return 'Too slow';
  if (wpm < 120) return 'Slightly slow';
  if (wpm <= 160) return 'Great pace';
  if (wpm <= 185) return 'Slightly fast';
  return 'Too fast';
}

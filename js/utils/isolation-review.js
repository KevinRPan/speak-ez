/**
 * Turn a timed transcript into three review passes.
 * Ears get specific moments to replay. Eyes get checkpoints.
 * Words get slices of the take and questions about structure.
 *
 * Pure: no DOM, no clock.
 */

import { analyzeTranscript } from './transcript-analysis.js';
import { AUDIO_CHECKS, VISUAL_CHECKS, STRUCTURE_CHECKS } from '../data/isolation.js';

const ALWAYS_PHRASES = ['you know', 'i mean', 'kind of', 'sort of', 'um', 'uh', 'er', 'ah'];
const CLUSTER_WORDS = ['like', 'actually', 'basically', 'literally', 'honestly', 'right', 'so', 'okay', 'just'];
const RESTART_RE = /^(sorry|wait|hold on|let me (re)?start|let me try|what i mean|i mean|no no|actually[, ]+wait)\b/i;
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'the', 'a', 'an', 'and', 'or', 'but',
  'to', 'of', 'in', 'on', 'for', 'it', 'that', 'this', 'was', 'is', 'are', 'were',
  'be', 'so', 'just', 'with', 'as', 'at', 'from', 'if', 'not', 'do', 'did',
]);

const WORDS_PER_SECOND = 2.4;
const DEDUPE_SECONDS = 4;
const MAX_AUDIO_SPOTS = 5;

/**
 * @param {{ segments?: { t: number, text: string }[], durationSeconds?: number }} input
 * `t` is seconds from the start of the take when that phrase finished.
 */
export function buildIsolationReview({ segments = [], durationSeconds = 0 } = {}) {
  const clean = normalizeSegments(segments, durationSeconds);
  const transcript = clean.map(segment => segment.text).join(' ').replace(/\s+/g, ' ').trim();
  const duration = durationSeconds > 0
    ? durationSeconds
    : (clean.length ? clean[clean.length - 1].t : 0);
  const raw = analyzeTranscript(transcript, duration);

  const analysis = {
    wordCount: raw?.wordCount || 0,
    fillerCount: raw?.fillerCount || 0,
    fillersPerMinute: raw?.fillersPerMinute ?? null,
    wpm: raw?.wpm ?? null,
    hedgeCount: raw?.hedgeCount || 0,
    hedgeWords: raw?.hedgeWords || [],
  };

  return {
    transcript,
    duration,
    analysis,
    audio: {
      checks: AUDIO_CHECKS,
      spots: audioSpots(clean),
    },
    visual: {
      checks: VISUAL_CHECKS,
      spots: visualSpots(duration),
    },
    structure: {
      checks: STRUCTURE_CHECKS,
      spots: structureSpots(clean, transcript, analysis, duration),
    },
  };
}

export function formatClock(seconds) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const remain = safe % 60;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}

function normalizeSegments(segments, durationSeconds) {
  const cap = durationSeconds > 0 ? durationSeconds + 5 : Infinity;
  return (Array.isArray(segments) ? segments : [])
    .map(segment => {
      const text = typeof segment?.text === 'string'
        ? segment.text.replace(/\s+/g, ' ').trim()
        : '';
      const t = Number(segment?.t);
      if (!text || !Number.isFinite(t)) return null;
      return { text, t: Math.min(Math.max(0, t), cap) };
    })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t);
}

function estimateDuration(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(0.4, words / WORDS_PER_SECOND);
}

function segmentStart(segment) {
  return Math.max(0, segment.t - estimateDuration(segment.text));
}

function countPhrase(text, phrase) {
  const pattern = `\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}\\b`;
  const matches = text.toLowerCase().match(new RegExp(pattern, 'g'));
  return matches ? matches.length : 0;
}

function audioSpots(segments) {
  const raw = [];

  segments.forEach((segment, index) => {
    const always = ALWAYS_PHRASES.filter(phrase => countPhrase(segment.text, phrase) > 0);
    const clustered = CLUSTER_WORDS.filter(word => countPhrase(segment.text, word) >= 2);
    const words = [...always, ...clustered];
    if (words.length) {
      const heavy = clustered.length > 0 || always.length >= 2;
      raw.push({
        t: segmentStart(segment),
        kind: 'filler',
        priority: heavy ? 4 : 3,
        title: heavy ? 'Filler cluster' : 'Filler words',
        detail: `You said ${quoteList(words)} in "${clip(segment.text, 160)}".`,
        question: fillerQuestion(always, clustered),
      });
    }

    if (RESTART_RE.test(segment.text)) {
      raw.push({
        t: segmentStart(segment),
        kind: 'restart',
        priority: 5,
        title: 'Abandoned line',
        detail: `You left this unfinished: "${clip(segment.text, 160)}".`,
        question: 'The restart is the tic. What was the finished sentence, and how much time did the false start cost?',
      });
    }

    const gap = silenceBefore(segments, index);
    if (gap >= 3.5) {
      const at = index === 0 ? 0 : segmentStart(segment) - gap;
      raw.push({
        t: Math.max(0, at),
        kind: 'pause',
        priority: gap >= 6 ? 3 : 2,
        title: 'A held pause',
        detail: index === 0
          ? `About ${Math.round(gap)} seconds before the first words.`
          : `About ${Math.round(gap)} seconds of space before "${clip(segment.text, 120)}".`,
        question: 'Is that space quiet, or is it a breath, a click, or a lip smack? Those sounds will not be in the transcript.',
      });
    }
  });

  CLUSTER_WORDS.forEach(word => {
    const hits = [];
    segments.forEach(segment => {
      const count = countPhrase(segment.text, word);
      if (count > 0) hits.push({ segment, count });
    });
    const total = hits.reduce((sum, hit) => sum + hit.count, 0);
    const piledInOneLine = hits.some(hit => hit.count >= 2);
    if (total >= 3 && !piledInOneLine) {
      const second = hits[Math.min(1, hits.length - 1)];
      raw.push({
        t: segmentStart(second.segment),
        kind: 'filler',
        priority: 3,
        title: 'A word that keeps returning',
        detail: `'${word}' shows up ${total} times. The second time is in "${clip(second.segment.text, 140)}".`,
        question: `Play that second '${word}'. Cross out every one in the stretch. Which were doing a job, and which were holding the sentence up?`,
      });
    }
  });

  return capSpots(raw);
}

function fillerQuestion(always, clustered) {
  if (always.length && clustered.length === 0) {
    return 'Those sounds are not the point. Play it and listen for the gap they were covering.';
  }
  if (always.length) {
    return 'Some of these are noise and some might be real words. Which ones could you delete and lose nothing?';
  }
  return 'Cross out every one of these in the line. Which were doing a job, and which were standing in for the next word?';
}

function silenceBefore(segments, index) {
  const current = segments[index];
  const start = segmentStart(current);
  if (index === 0) return start;
  return start - segments[index - 1].t;
}

function capSpots(raw) {
  const ranked = [...raw].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (a.kind !== b.kind) return kindRank(b.kind) - kindRank(a.kind);
    return a.t - b.t;
  });
  const kept = [];
  ranked.forEach(spot => {
    if (kept.length >= MAX_AUDIO_SPOTS) return;
    if (kept.some(other => Math.abs(other.t - spot.t) < DEDUPE_SECONDS)) return;
    kept.push(spot);
  });
  kept.sort((a, b) => a.t - b.t);
  return kept.map((spot, index) => ({
    id: `audio-${index}`,
    t: round1(spot.t),
    clock: formatClock(spot.t),
    title: spot.title,
    detail: spot.detail,
    question: spot.question,
  }));
}

function kindRank(kind) {
  if (kind === 'restart') return 3;
  if (kind === 'filler') return 2;
  return 1;
}

function visualSpots(durationSeconds) {
  const duration = Math.max(durationSeconds, 1);
  const closeAt = duration <= 30 ? duration * 0.8 : Math.max(duration * 0.66, duration - 20);
  const openWindow = duration < 20 ? 'From the start' : 'First 20 seconds';
  const closeWindow = duration > 40 ? 'Last 20 seconds' : 'The ending';
  return [
    {
      id: 'visual-open',
      t: 0,
      clock: formatClock(0),
      title: 'The open',
      window: openWindow,
      detail: 'Sound stays off. Watch how you enter, before the idea can explain you.',
      question: 'Are you planted, or already moving (sway, hands, a glance off the lens) before the first point arrives?',
    },
    {
      id: 'visual-middle',
      t: round1(duration / 2),
      clock: formatClock(duration / 2),
      title: 'The middle',
      window: 'Pause here',
      detail: 'Freeze the frame. Ignore the words you remember saying.',
      question: 'Where are your hands, and where are your eyes? If a hand is moving, is it drawing the point or discharging nerves?',
    },
    {
      id: 'visual-close',
      t: round1(closeAt),
      clock: formatClock(closeAt),
      title: 'The close',
      window: closeWindow,
      detail: 'Compare this frame with the open.',
      question: 'Did your shoulders drop, your gaze leave, or your body shrink once you knew you were almost done?',
    },
  ];
}

function structureSpots(segments, transcript, analysis, duration) {
  if (!transcript) {
    return [{
      id: 'structure-missing',
      title: 'No transcript on this take',
      quote: '',
      detail: 'Captions did not come back. Answer from the take you just heard, one question at a time.',
      question: 'What was the single point, where did you say it, and what was the actual last line?',
    }];
  }

  const spots = [];
  const opening = openingText(segments, duration, transcript);
  spots.push({
    id: 'structure-open',
    title: 'The opening',
    quote: clip(opening, 360),
    detail: 'This is the part a listener uses to decide whether to stay.',
    question: 'Does this tell them the point and why it matters, or is it still warming up?',
  });

  const last = lastSentence(transcript);
  spots.push({
    id: 'structure-close',
    title: 'The last line',
    quote: clip(last, 280),
    detail: 'Cover everything above it. Read only this.',
    question: 'Does it land a change, an ask, or a so-what, or does it fade out?',
  });

  const repeats = repeatedStems(transcript);
  if (repeats.length) {
    const top = repeats[0];
    spots.push({
      id: 'structure-repeat',
      title: 'A line you used twice',
      quote: top.examples.slice(0, 2).map(example => clip(example, 180)).join('\n'),
      detail: `"${top.stem}" shows up ${top.count} times.`,
      question: 'Which copy is the one you meant? Cut the other. What gets clearer?',
    });
  }

  const concrete = concreteAnchors(transcript);
  spots.push({
    id: 'structure-concrete',
    title: concrete.count ? 'Concrete anchors' : 'No concrete anchor',
    quote: concrete.snippets.slice(0, 2).join('\n'),
    detail: concrete.count
      ? `${concrete.count} concrete anchor${concrete.count === 1 ? '' : 's'} (a time, a number, or an example) in the whole take.`
      : 'No time, number, or "for example" turned up.',
    question: concrete.count >= 2
      ? 'Are these anchors doing work for the point, or are they decoration around an abstract claim?'
      : 'Where would one scene (a time, a name, a number) make the point visible?',
  });

  if (analysis.hedgeCount > 0) {
    const sample = analysis.hedgeWords.slice(0, 3).map(word => `'${word}'`).join(', ');
    spots.push({
      id: 'structure-hedge',
      title: 'Hedges in front of the point',
      quote: sample,
      detail: `${analysis.hedgeCount} hedge${analysis.hedgeCount === 1 ? '' : 's'}.`,
      question: 'Which of these is real uncertainty, and which is a tic you put in front of a point you already believe?',
    });
  }

  if (duration >= 90 && analysis.wordCount > 0) {
    if (analysis.wordCount < duration * 1.1) {
      spots.push({
        id: 'structure-thin',
        title: 'A thin take',
        quote: '',
        detail: `About ${analysis.wordCount} words across ${formatClock(duration)}.`,
        question: 'If you were talking the whole time, the sentences are thin. Where is the point, and where is one concrete scene?',
      });
    } else if (analysis.wpm && analysis.wpm > 190) {
      spots.push({
        id: 'structure-dense',
        title: 'No room between ideas',
        quote: '',
        detail: `About ${analysis.wordCount} words in ${formatClock(duration)}.`,
        question: 'This is a lot of words for the time. Where is a second pass over a point you already made?',
      });
    }
  }

  return spots;
}

function openingText(segments, duration, transcript) {
  const cutoff = Math.min(45, Math.max(15, duration * 0.3));
  const parts = segments.filter(segment => segmentStart(segment) < cutoff);
  const text = parts.map(segment => segment.text).join(' ').trim();
  if (text) return text;
  return transcript.split(/\s+/).slice(0, 40).join(' ');
}

function lastSentence(text) {
  const parts = text.split(/(?<=[.!?])\s+/).map(part => part.trim()).filter(Boolean);
  if (parts.length) return parts[parts.length - 1];
  return text.split(/\s+/).slice(-18).join(' ');
}

function repeatedStems(text) {
  const found = new Map();
  sentences(text).forEach(sentence => {
    const stem = contentStem(sentence);
    if (!stem) return;
    const entry = found.get(stem) || { stem, count: 0, examples: [] };
    entry.count += 1;
    if (entry.examples.length < 2) entry.examples.push(sentence);
    found.set(stem, entry);
  });
  return [...found.values()]
    .filter(entry => entry.count >= 2)
    .sort((a, b) => b.count - a.count);
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.split(/\s+/).filter(Boolean).length >= 4);
}

function contentStem(sentence) {
  const words = sentence.toLowerCase().replace(/[^a-z0-9'\s]/g, '').split(/\s+/).filter(Boolean);
  const picked = [];
  words.forEach(word => {
    if (picked.length >= 3) return;
    if (!STOP_WORDS.has(word)) picked.push(word);
  });
  if (picked.length < 2) return '';
  return picked.join(' ');
}

function concreteAnchors(text) {
  const patterns = [
    /\b\d{1,4}\b/g,
    /\b(?:yesterday|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|night|percent)\b/gi,
    /\b(?:for example|for instance|last week|last year|last month|when i)\b/gi,
    /\$\d+/g,
  ];
  const snippets = [];
  patterns.forEach(pattern => {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const regex = new RegExp(pattern.source, flags);
    let match = regex.exec(text);
    while (match && snippets.length < 4) {
      const start = Math.max(0, match.index - 28);
      const end = Math.min(text.length, match.index + match[0].length + 28);
      const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
      if (!snippets.includes(snippet)) snippets.push(snippet);
      match = regex.exec(text);
    }
  });
  return { count: snippets.length, snippets };
}

function quoteList(words) {
  return [...new Set(words)].map(word => `'${word}'`).join(', ');
}

function clip(text, max) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 40 ? cut.slice(0, space) : cut).trim()}…`;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

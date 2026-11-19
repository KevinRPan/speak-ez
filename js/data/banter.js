/**
 * Banter topics — built from the speaker's workplace, offline.
 * A topic is something that might actually come up in their room.
 * The rep is to answer with a funny story or a joke, quickly.
 */

const UNIVERSAL_SPARKS = [
  'how the weekend actually went',
  'the meeting that should have been a message',
  'the coffee situation',
  "someone's \"quick question\"",
  'plans that keep getting rescheduled',
  'the tool everyone pretends to understand',
  "a new person's first week",
  'the calendar that ate the afternoon',
  'lunch plans that died in the group chat',
  'the status update nobody read',
  'the mute button that was not on mute',
  'a "quick sync" that was not quick',
  'the snack that disappeared from the shared drawer',
  'what everyone is pretending to work on',
  'the reply-all that should not have happened',
];

const FRAMES = [
  (w, spark) => `Topic that might come up${whereClause(w)}: ${cap(spark)}. Funny story or a joke — quickly.`,
  (w, spark) => `${w.place ? cap(w.place) : 'Work'}. ${w.role ? `You're ${roleAsNoun(w.role)}. ` : ''}Someone brings up ${spark}. A few seconds — funny story or a joke.`,
  (w, spark) => `${w.role ? `Someone asks ${roleAsNoun(w.role)}` : 'Someone asks you'}${w.place ? ` at ${w.place}` : ''} about ${spark}. Skip the status update. Funny story or a joke.`,
  (w, spark) => `The conversation${w.place ? ` at ${w.place}` : ''} turns to ${spark}. One breath, then a short funny story or a joke.`,
  (w, spark) => `${w.role ? `You're ${roleAsNoun(w.role)}` : "You're"} mid-chat${w.place ? ` at ${w.place}` : ''}, and someone mentions ${spark}. Funny story or a joke before the silence does.`,
];

export function normalizeWorkplace(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    place: clip(src.place, 120),
    role: clip(src.role, 80),
    details: clip(src.details, 240),
  };
}

/**
 * Pull short, speakable bits out of the free-text details field.
 */
export function detailSparks(details) {
  if (!details) return [];
  const parts = String(details)
    .split(/[,;\n•|/]+|\s+\band\b\s+|[.?!]+/i)
    .map(s => s.replace(/^[\s"'“”‘’\-–]+|[\s"'“”‘’\-–]+$/g, '').trim())
    .filter(s => s.length >= 3 && s.length <= 80);

  const seen = new Set();
  const out = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * @returns {{ spark: string, text: string }}
 */
export function buildBanterPrompt(workplace, options = {}) {
  const random = typeof options.random === 'function' ? options.random : Math.random;
  const avoid = new Set((options.avoidSparks || []).map(s => String(s).toLowerCase()));
  const w = normalizeWorkplace(workplace);
  const own = detailSparks(w.details);
  const wantOwn = own.length > 0 && random() < 0.7;
  const pools = wantOwn ? [own, UNIVERSAL_SPARKS] : [UNIVERSAL_SPARKS, own];

  for (const pool of pools) {
    const available = pool.filter(s => !avoid.has(s.toLowerCase()));
    if (!available.length) continue;
    return speak(w, available, random);
  }

  const fallback = own.length ? own : UNIVERSAL_SPARKS;
  return speak(w, fallback, random);
}

function speak(w, pool, random) {
  const spark = pool[Math.floor(random() * pool.length)];
  const frame = FRAMES[Math.floor(random() * FRAMES.length)];
  return { spark, text: frame(w, spark) };
}

function whereClause(w) {
  if (w.place && w.role) return ` at ${w.place} (you're ${roleAsNoun(w.role)})`;
  if (w.place) return ` at ${w.place}`;
  if (w.role) return ` for ${roleAsNoun(w.role)}`;
  return '';
}

function roleAsNoun(role) {
  if (!role) return '';
  if (/^(a|an|the)\s/i.test(role)) return role;
  return `the ${role}`;
}

function cap(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clip(value, max) {
  return String(value || '').trim().slice(0, max);
}

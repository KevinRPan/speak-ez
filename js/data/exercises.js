/**
 * Exercise definitions for Speak-EZ
 * Each exercise is a specific communication skill to practice
 */

export const CATEGORIES = {
  WARMUP: 'warmup',
  VOCAL: 'vocal',
  PHYSICAL: 'physical',
  CONTENT: 'content',
};

export const CATEGORY_INFO = {
  [CATEGORIES.WARMUP]: { label: 'Warmup', icon: '🔥', color: '#FF6B35' },
  [CATEGORIES.VOCAL]: { label: 'Vocal', icon: '🎙', color: '#7C5CFC' },
  [CATEGORIES.PHYSICAL]: { label: 'Physical', icon: '🤲', color: '#00B4D8' },
  [CATEGORIES.CONTENT]: { label: 'Content', icon: '🧠', color: '#58CC02' },
};

export const exercises = [
  // === WARMUP ===
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    category: CATEGORIES.WARMUP,
    description: 'Calm your nerves and center your mind with 4-4-4-4 breathing.',
    instructions: [
      'Inhale for 4 counts',
      'Hold for 4 counts',
      'Exhale for 4 counts',
      'Hold for 4 counts',
      'Repeat the cycle',
    ],
    tips: 'Focus on making each phase equal length. This activates your parasympathetic nervous system.',
    defaultDuration: 60,
    metrics: ['focus', 'calm'],
  },
  {
    id: 'vocal-warmup',
    name: 'Vocal Warmup',
    category: CATEGORIES.WARMUP,
    description: 'Wake up your voice with humming, lip trills, and resonance exercises.',
    instructions: [
      'Start with gentle humming — feel the vibration in your face',
      'Do lip trills (motorboat sound) up and down your range',
      'Say "mmmm-ahhhh" opening from hum to open vowel',
      'Slide from your lowest comfortable note to your highest',
    ],
    tips: 'Never strain. Start quiet and build. Think of warming up like stretching before a run.',
    defaultDuration: 120,
    metrics: ['vocal_range', 'resonance'],
  },
  {
    id: 'tongue-twisters',
    name: 'Tongue Twisters',
    category: CATEGORIES.WARMUP,
    description: 'Sharpen your articulation with rapid-fire pronunciation drills.',
    instructions: [
      'Start slow, then build speed',
      'Exaggerate each consonant',
      'Repeat each twister 3 times',
    ],
    prompts: [
      'Red leather, yellow leather',
      'Unique New York, you know you need unique New York',
      'She sells seashells by the seashore',
      'Peter Piper picked a peck of pickled peppers',
      'How can a clam cram in a clean cream can',
      'The sixth sick sheik\'s sixth sheep\'s sick',
      'Toy boat, toy boat, toy boat',
      'Fresh French fried fish',
    ],
    tips: 'Precision over speed. If you stumble, slow down and nail it clean before speeding up.',
    defaultDuration: 120,
    metrics: ['clarity', 'speed'],
  },
  {
    id: 'push-breathing',
    name: 'Push Breathing',
    category: CATEGORIES.WARMUP,
    description: 'Fire up your diaphragm with sharp, staccato breaths to activate your voice.',
    instructions: [
      'Stand tall, hand on your belly',
      'Take a deep breath in',
      'Exhale in short, sharp bursts — "HUH HUH HUH" — from the diaphragm',
      'Feel your belly snap inward with each push',
      'Reset with a slow inhale, then go again',
    ],
    tips: 'This wakes up the engine behind your voice. Your diaphragm is the power source — if it\'s asleep, your voice will be flat. Keep the pushes crisp and percussive.',
    defaultDuration: 60,
    metrics: ['breath_support', 'activation'],
  },
  {
    id: 'power-pose',
    name: 'Power Pose',
    category: CATEGORIES.WARMUP,
    description: 'Boost confidence with expansive body positioning before you speak.',
    instructions: [
      'Stand tall with feet shoulder-width apart',
      'Hands on hips or arms raised in a V',
      'Chin slightly up, chest open',
      'Breathe deeply and hold for the full duration',
      'Visualize yourself commanding the room',
    ],
    tips: 'Research shows expansive postures increase confidence hormones. Even 2 minutes helps.',
    defaultDuration: 120,
    metrics: ['confidence'],
  },

  // === VOCAL ===
  {
    id: 'volume-projection',
    name: 'Volume Projection',
    category: CATEGORIES.VOCAL,
    description: 'Master your dynamic range from conversational whisper to room-commanding power.',
    instructions: [
      'Pick a short phrase or count 1-10',
      'Start at whisper volume',
      'Gradually increase to full projection',
      'Then bring it back down to whisper',
      'Practice sudden shifts: loud → quiet → loud',
    ],
    tips: 'Project from your diaphragm, not your throat. Imagine speaking to someone across a large room. Volume isn\'t yelling — it\'s supported breath.',
    defaultDuration: 180,
    metrics: ['volume_control', 'projection'],
  },
  {
    id: 'pace-rhythm',
    name: 'Pace & Rhythm',
    category: CATEGORIES.VOCAL,
    description: 'Control your speed to create emphasis, build tension, and maintain engagement.',
    instructions: [
      'Speak about any topic for the full duration',
      'Alternate between fast sections and slow sections',
      'Speed up for excitement or lists',
      'Slow way down for key points',
      'Notice how pace changes the feeling of your words',
    ],
    tips: 'Most people speak too fast when nervous. Practice deliberately slowing down on your most important sentence. Fast pace = energy. Slow pace = gravity.',
    defaultDuration: 180,
    metrics: ['pace_variety', 'clarity'],
  },
  {
    id: 'strategic-pausing',
    name: 'Strategic Pausing',
    category: CATEGORIES.VOCAL,
    description: 'Use silence as your most powerful tool. Let your ideas land.',
    instructions: [
      'Speak about a topic you know well',
      'After every key statement, pause for a full 2-3 seconds',
      'Resist the urge to fill silence',
      'Use pauses before important words for anticipation',
      'Use pauses after important points for impact',
    ],
    tips: 'Vinh Giang says: "The pause is where the power lives." Silence isn\'t empty — it\'s full of meaning. Your audience needs time to process.',
    defaultDuration: 180,
    metrics: ['pause_quality', 'composure'],
  },
  {
    id: 'pitch-variation',
    name: 'Pitch Variation',
    category: CATEGORIES.VOCAL,
    description: 'Break free from monotone with intentional pitch movement.',
    instructions: [
      'Read or speak a passage',
      'Exaggerate your pitch — go higher on questions, lower on statements',
      'Practice "pitch painting" — match your tone to emotion',
      'Try the same sentence with rising pitch vs. falling pitch',
      'Notice how pitch changes meaning and authority',
    ],
    tips: 'Monotone kills engagement. Think of your voice as a musical instrument. Downward inflection = confidence and authority. Upward = curiosity and energy.',
    defaultDuration: 180,
    metrics: ['pitch_range', 'expressiveness'],
  },
  {
    id: 'articulation',
    name: 'Articulation',
    category: CATEGORIES.VOCAL,
    description: 'Crystal clear pronunciation through targeted drills.',
    instructions: [
      'Over-pronounce every consonant',
      'Speak with exaggerated mouth movements',
      'Practice problem sounds: th, s, r, l',
      'Read a passage at half speed with perfect clarity',
      'Then bring it up to normal speed maintaining clarity',
    ],
    tips: 'Think of each word as a gift you\'re placing precisely. Mumbling shows your brain is moving faster than your mouth — slow down and articulate.',
    defaultDuration: 180,
    metrics: ['clarity', 'precision'],
  },
  {
    id: 'filler-elimination',
    name: 'Filler Elimination',
    category: CATEGORIES.VOCAL,
    description: 'Speak cleanly by replacing um, uh, like, and you know with confident silence.',
    instructions: [
      'Pick any topic and speak for the full duration',
      'Every time you catch a filler word, pause instead',
      'Replace "um" and "uh" with a breath',
      'Replace "like" and "you know" with nothing',
      'Count your fillers — aim to reduce each set',
    ],
    tips: 'Fillers signal your brain is searching for words. A pause does the same thing but sounds confident. Record yourself to catch fillers you don\'t notice.',
    defaultDuration: 180,
    metrics: ['filler_count', 'fluency'],
  },

  // === PHYSICAL ===
  {
    id: 'hand-gestures',
    name: 'Hand Gestures',
    category: CATEGORIES.PHYSICAL,
    description: 'Use purposeful movements that amplify and reinforce your message.',
    instructions: [
      'Speak about a topic with your hands at your sides first',
      'Now add gestures: open palms for honesty, counting on fingers for lists',
      'Use "size" gestures to show magnitude',
      'Point to locations when comparing options',
      'Keep gestures in the "power zone" (waist to shoulders)',
    ],
    tips: 'Gestures should be purposeful, not fidgety. Think: every hand movement should ADD meaning. If it doesn\'t reinforce your words, keep still.',
    defaultDuration: 180,
    metrics: ['gesture_purpose', 'naturalness'],
  },
  {
    id: 'power-posture',
    name: 'Power Posture',
    category: CATEGORIES.PHYSICAL,
    description: 'Command presence through confident body positioning while speaking.',
    instructions: [
      'Stand with feet shoulder-width, weight balanced',
      'Shoulders back and down (not tense)',
      'Practice speaking with open chest and arms',
      'Try different stances: neutral, hands clasped, one hand gesturing',
      'Notice how your voice changes with posture',
    ],
    tips: 'Your body leads your mind. Slouching literally compresses your lungs and weakens your voice. Stand tall and your confidence follows.',
    defaultDuration: 180,
    metrics: ['presence', 'openness'],
  },
  {
    id: 'eye-contact',
    name: 'Eye Contact',
    category: CATEGORIES.PHYSICAL,
    description: 'Build connection and trust through deliberate, natural gaze patterns.',
    instructions: [
      'Place 3-5 objects at eye level around the room (or imagine faces)',
      'Practice holding gaze on one "person" for a full thought',
      'Then move to the next person for the next thought',
      'Don\'t scan — connect with one person at a time',
      'Practice the triangle: left eye → right eye → mouth',
    ],
    tips: 'Eye contact isn\'t staring — it\'s connecting. Hold for 3-5 seconds per person. In virtual calls, look at the camera lens, not the screen.',
    defaultDuration: 180,
    metrics: ['connection', 'steadiness'],
  },
  {
    id: 'facial-expression',
    name: 'Facial Expression',
    category: CATEGORIES.PHYSICAL,
    description: 'Let your face tell the same story as your words.',
    instructions: [
      'Tell a story and exaggerate your facial reactions',
      'Practice expressing: excitement, concern, curiosity, determination',
      'Match your eyebrows, eyes, and mouth to the emotion of your content',
      'Try saying the same line with different expressions — notice how meaning changes',
      'Film yourself and watch back — is your face engaged or flat?',
    ],
    tips: 'Most people have a "resting presentation face" that\'s completely flat. Your audience reads your face before they process your words.',
    defaultDuration: 180,
    metrics: ['expressiveness', 'congruence'],
  },
  {
    id: 'movement-space',
    name: 'Movement & Space',
    category: CATEGORIES.PHYSICAL,
    description: 'Own your environment through deliberate physical movement.',
    instructions: [
      'Claim your space — practice moving to different spots while speaking',
      'Move toward the audience for emphasis',
      'Step to the side when transitioning between topics',
      'Plant your feet when delivering key points',
      'Avoid pacing or swaying — every movement should be purposeful',
    ],
    tips: 'Movement creates energy and signals transitions. But aimless pacing signals anxiety. Move WITH purpose, stand WITH conviction.',
    defaultDuration: 180,
    metrics: ['purposeful_movement', 'spatial_awareness'],
  },

  // === CONTENT ===
  {
    id: 'impromptu',
    name: 'Impromptu Speaking',
    category: CATEGORIES.CONTENT,
    description: 'Think on your feet — speak on a random topic with zero preparation.',
    instructions: [
      'You\'ll get a random topic or question',
      'Take 5 seconds to gather your thoughts',
      'Open with a clear position or hook',
      'Give 2-3 supporting points',
      'Close with a strong summary',
    ],
    prompts: [
      'What\'s the most underrated skill in business?',
      'Should meetings have a maximum time limit?',
      'What makes a great leader?',
      'Is remote work better than office work?',
      'What\'s the best advice you\'ve ever received?',
      'Should every company have a four-day work week?',
      'What skill will be most valuable in 10 years?',
      'Is failure necessary for success?',
      'What makes a presentation memorable?',
      'Should schools teach public speaking?',
      'What\'s more important: talent or hard work?',
      'If you could change one thing about how teams communicate, what would it be?',
      'What\'s the biggest misconception about your field?',
      'Should AI replace human customer service?',
      'What makes someone trustworthy?',
    ],
    tips: 'You don\'t need to know everything about a topic. Pick one angle and commit to it fully. Structure beats knowledge every time.',
    defaultDuration: 120,
    metrics: ['structure', 'clarity', 'confidence'],
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    category: CATEGORIES.CONTENT,
    description: 'Craft and deliver compelling narratives that move people.',
    instructions: [
      'Choose a story: personal experience, lesson learned, or hypothetical',
      'Set the scene quickly (who, where, when)',
      'Build tension or curiosity',
      'Deliver the turning point or key moment',
      'Land the insight or lesson',
    ],
    prompts: [
      'Tell about a time you failed and what you learned',
      'Describe a moment that changed how you think',
      'Tell the story of your career\'s biggest turning point',
      'Share a lesson you learned the hard way',
      'Describe the most interesting person you\'ve met',
      'Tell about a time you had to persuade a skeptic',
      'Share a moment when you were completely wrong',
      'Describe a challenge that made you stronger',
    ],
    tips: 'Every great story has conflict. Without tension, there\'s nothing to resolve. Make the audience feel what you felt.',
    defaultDuration: 180,
    metrics: ['narrative_arc', 'engagement', 'emotional_connection'],
  },
  {
    id: 'concise-messaging',
    name: 'Concise Messaging',
    category: CATEGORIES.CONTENT,
    description: 'Say more with fewer words. Distill complex ideas into sharp, clear messages.',
    instructions: [
      'You\'ll get a complex topic to explain',
      'First attempt: explain in 60 seconds',
      'Second attempt: explain in 30 seconds',
      'Third attempt: explain in one sentence',
      'Each time, cut the fluff and keep only the essential',
    ],
    prompts: [
      'Explain how the internet works',
      'Explain what your company/team does',
      'Explain blockchain technology',
      'Pitch your favorite book or movie',
      'Explain why diversity matters in teams',
      'Describe your biggest project accomplishment',
      'Explain climate change to a 10-year-old',
      'Pitch a business idea in one minute',
    ],
    tips: 'If you can\'t explain it simply, you don\'t understand it well enough. Cut adjectives, cut preamble, cut qualifiers. Get to the point.',
    defaultDuration: 120,
    metrics: ['brevity', 'clarity', 'impact'],
  },
  {
    id: 'structured-response',
    name: 'Structured Response',
    category: CATEGORIES.CONTENT,
    description: 'Use proven frameworks to organize your thoughts under pressure.',
    instructions: [
      'Pick a framework for your response:',
      'PREP: Point → Reason → Example → Point',
      'STAR: Situation → Task → Action → Result',
      'PSB: Problem → Solution → Benefit',
      'Answer the prompt using the chosen framework',
      'Make each section distinct and clear',
    ],
    prompts: [
      'Tell me about a time you showed leadership',
      'Why should we hire you?',
      'Describe a conflict you resolved at work',
      'What\'s your greatest professional achievement?',
      'Tell me about a time you had to learn something quickly',
      'Describe a project that didn\'t go as planned',
      'How do you handle disagreements with colleagues?',
      'Tell me about a time you exceeded expectations',
      'Describe your approach to problem-solving',
      'How do you prioritize competing deadlines?',
    ],
    tips: 'Frameworks aren\'t cages — they\'re scaffolding. They give your brain a path to follow so your content can shine. Name the framework to your audience: "Let me walk you through what happened..."',
    defaultDuration: 180,
    metrics: ['structure', 'completeness', 'clarity'],
  },
  {
    id: 'persuasive-pitch',
    name: 'Persuasive Pitch',
    category: CATEGORIES.CONTENT,
    description: 'Win hearts and minds through logical and emotional persuasion.',
    instructions: [
      'You\'ll get something to pitch or argue for',
      'Open with a hook that creates curiosity or urgency',
      'Present your case with evidence and logic',
      'Address the obvious objection',
      'Close with a clear call to action',
    ],
    prompts: [
      'Pitch a 4-day work week to your CEO',
      'Convince your team to adopt a new tool',
      'Argue for investing in employee training',
      'Pitch yourself for a promotion',
      'Convince someone to read your favorite book',
      'Argue for remote work flexibility',
      'Pitch a new product feature to stakeholders',
      'Convince a skeptic that public speaking is learnable',
    ],
    tips: 'People decide emotionally and justify logically. Lead with why they should care, then back it up with evidence. Always address "why not" before they ask it.',
    defaultDuration: 180,
    metrics: ['persuasiveness', 'structure', 'call_to_action'],
  },
  {
    id: 'analogies-metaphors',
    name: 'Analogies & Metaphors',
    category: CATEGORIES.CONTENT,
    description: 'Make the complex simple through the power of comparison.',
    instructions: [
      'Take a complex concept from your field',
      'Explain it using an analogy from everyday life',
      'Try multiple analogies — which one clicks best?',
      'Test: would a 12-year-old understand this?',
      'Practice transitioning: "Think of it like..."',
    ],
    prompts: [
      'Explain a database using a library analogy',
      'Describe teamwork using a sports metaphor',
      'Explain compound interest using a snowball',
      'Describe leadership using a gardening analogy',
      'Explain networking using a dinner party metaphor',
      'Describe project management using construction',
      'Explain machine learning like teaching a child',
      'Describe your job to a five-year-old',
    ],
    tips: 'Vinh Giang teaches: the best communicators are translators. They take complex ideas and make them feel familiar. Your analogy should create an "aha" moment.',
    defaultDuration: 180,
    metrics: ['creativity', 'clarity', 'relatability'],
  },
];

export function getExercise(id) {
  return exercises.find(e => e.id === id);
}

export function getExercisesByCategory(category) {
  return exercises.filter(e => e.category === category);
}

export function getRandomPrompt(exerciseId, interviewContext) {
  const exercise = getExercise(exerciseId);
  if (!exercise?.prompts?.length) return null;

  // If interview context is set, try to generate a tailored prompt
  if (interviewContext?.position && INTERVIEW_PROMPTS[exerciseId]) {
    const templates = INTERVIEW_PROMPTS[exerciseId];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const role = interviewContext.level
      ? `${interviewContext.level}-level ${interviewContext.position}`
      : interviewContext.position;
    return template.replace(/\{role\}/g, role).replace(/\{position\}/g, interviewContext.position);
  }

  return exercise.prompts[Math.floor(Math.random() * exercise.prompts.length)];
}

/**
 * Interview-specific prompt templates per exercise.
 * {role} = "Senior Product Manager", {position} = "Product Manager"
 */
const INTERVIEW_PROMPTS = {
  'structured-response': [
    'Tell me about yourself and why you\'re a great fit for a {role} role.',
    'Why do you want to work as a {role}?',
    'What\'s your greatest strength as a {position}?',
    'Describe a challenging project you led as a {position}.',
    'Tell me about a time you failed in a {position} role and what you learned.',
    'How do you handle disagreements with your team as a {role}?',
    'Describe a time you had to make a tough decision as a {position}.',
    'Where do you see yourself in five years as a {position}?',
    'What makes you stand out from other {position} candidates?',
    'Tell me about a time you exceeded expectations in a {position} role.',
    'How do you prioritize competing deadlines as a {role}?',
    'Describe your approach to problem-solving as a {position}.',
    'Tell me about a time you showed leadership as a {role}.',
    'How do you stay current with trends in your field as a {position}?',
    'Describe a time you had to learn something quickly for a {position} role.',
  ],
  'impromptu': [
    'What\'s the biggest challenge facing {position}s today?',
    'What\'s the most underrated skill for a {role}?',
    'If you could change one thing about how {position}s work, what would it be?',
    'What advice would you give someone starting out as a {position}?',
    'What\'s a common misconception about being a {position}?',
    'How is the {position} role evolving with AI and automation?',
    'What\'s the most important metric for a {role} to track?',
    'What separates a good {position} from a great one?',
  ],
  'persuasive-pitch': [
    'Pitch yourself for a {role} position in 60 seconds.',
    'Convince a hiring manager you\'re the right {role} for their team.',
    'Argue for why a {role} is critical to a company\'s success.',
    'Pitch a new initiative you\'d lead as a {role}.',
    'Convince a skeptical interviewer that your background makes you an ideal {position}.',
    'Pitch why your team should adopt a new process, from the perspective of a {role}.',
  ],
  'storytelling': [
    'Tell the story of how you decided to become a {position}.',
    'Share a defining moment in your career as a {position}.',
    'Tell about a time you turned around a struggling project as a {role}.',
    'Describe the most impactful thing you\'ve done as a {position}.',
    'Share a lesson you learned the hard way as a {role}.',
    'Tell about a time you mentored someone in a {position} role.',
  ],
  'concise-messaging': [
    'Explain what a {position} does to a 10-year-old.',
    'Summarize your experience as a {position} in 30 seconds.',
    'Describe your biggest accomplishment as a {role} in one sentence.',
    'Explain why someone should hire a {role} in three bullet points.',
    'Pitch the value of the {position} role to a CEO in under a minute.',
  ],
};

/**
 * Speaking games and executive briefs.
 *
 * Triple Step and Cold Slides are built per rep so the words and the
 * slides stay unfamiliar. Executive prompts are a fixed bank.
 */

export const EXECUTIVE_COACHING = 'This is an executive briefing. The speaker is answering a decision-maker. Judge the message, not the performance. They should answer the question that was asked, state the recommendation in the first sentence, and use at most one caveat — after the point, and only if the decision depends on it. Interpret directness as that standard. Interpret structure as recommendation, then reason, then one implication. Interpret conciseness as stopping once the decision is clear. Interpret confidence as stating the call without a stack of hedges. In the message fields and in improvements, name it when they bury the recommendation after background or caveats, when they give more than one caveat before the point, or when they never answer the question that was asked. The example must open with the recommendation or the direct answer.';

export const TRIPLE_STEP_COACHING = 'This is a Triple Step game. The prompt gives one message to hold and three words that must appear, in order, inside a coherent answer. Judge whether the message stayed intact and whether each word was used in a real sentence, not tacked on. Interpret structure as the message holding across the three words, clarity as whether a listener could repeat the message, and conciseness as not abandoning the message to explain the words. Name any word that was missing or out of order. A fluent speech that drops the message or skips a word is a miss. The example should keep the message and use the three words in order.';

export const COLD_SLIDES_COACHING = 'This is a cold-slides game. The speaker was handed slides they have not seen and must present them as one briefing, then land a single recommendation. Judge whether each slide was acknowledged, whether the slides became one story instead of a list, and whether the recommendation was stated. Interpret structure as the slide sequence plus a close. Interpret directness as the recommendation. Flag a readout that narrates bullets with no point, and a recommendation that never arrives. The example should move through the slides and end on the call.';

const MESSAGES = [
  'We should delay the launch by two weeks.',
  'Hire the senior analyst before adding another tool.',
  'Stop the experiment. The guardrail metric moved.',
  'Tell the customer the truth about the slip.',
  'Cut the meeting in half and publish the decision.',
  'Ship the smaller version on Thursday.',
  'Do not expand the metric until the definition is stable.',
  'Pause hiring on this team until the backlog is named.',
];

const WORDS = [
  'lighthouse', 'Tuesday', 'receipt', 'umbrella', 'kitchen', 'train',
  'notebook', 'window', 'quarter', 'bridge', 'apple', 'midnight',
  'elevator', 'river', 'ticket', 'winter', 'mirror', 'garden',
  'yellow', 'pocket', 'ladder', 'harbor', 'clock', 'marble',
];

const DECKS = [
  {
    title: 'The number moved the wrong way',
    slides: [
      ['Weekly active users', 'Down 3% week over week', 'The drop is concentrated in new accounts'],
      ['What else moved', 'Support tickets mentioning “slow” are up', 'The last release shipped Thursday'],
      ['The open question', 'Mix shift, or a real quality drop?', 'The dashboard for that split is late'],
    ],
  },
  {
    title: 'A launch that is almost ready',
    slides: [
      ['The feature', 'AI summaries on the home feed', 'Internal dogfood started Monday'],
      ['The risk', 'Summaries invent a number about one time in twenty', 'Legal has not signed the disclaimer'],
      ['The ask on the slide', 'Ship to 5%, or wait for the disclaimer', 'No owner is named'],
    ],
  },
  {
    title: 'Two teams, one metric',
    slides: [
      ['Growth', 'Optimizing signups', 'Signup rate is up 12%'],
      ['Trust', 'Optimizing 30-day retention', 'Retention of those signups is down'],
      ['The conflict', 'Each team can hit its goal by hurting the other', 'Nobody owns the pair'],
    ],
  },
  {
    title: 'The experiment you cannot defend yet',
    slides: [
      ['The test', 'New ranking in search', 'Eight days in, planned for fourteen'],
      ['The result so far', 'Revenue per search is flat', 'Time-to-result is slower'],
      ['The room', 'Launch review is tomorrow', 'The sample is about half of what you wanted'],
    ],
  },
  {
    title: 'A customer who wants a number',
    slides: [
      ['The account', 'Their renewal is in three weeks', 'They asked whether quality improved'],
      ['What you have', 'One quarter of tickets, tagged by hand', 'The tagger changed mid-quarter'],
      ['What they will hear', 'A chart with a confidence band', 'Or a sentence with a call'],
    ],
  },
  {
    title: 'Headcount against the backlog',
    slides: [
      ['The backlog', 'Fourteen analyses promised, three people', 'The oldest request is nine weeks'],
      ['The proposal on the slide', 'Open one senior role', 'Or cancel six of the fourteen'],
      ['The constraint', 'Finance froze headcount on Friday', 'The freeze email is one line'],
    ],
  },
];

export const EXECUTIVE_PROMPTS = [
  'Should we ship the ranking change this week? The accuracy is up. The page is slower.',
  'Support tickets doubled after Thursday’s release. What should the team do?',
  'A stakeholder wants three analyses. You can finish one before the review. Which, and what do you tell them?',
  'The model is more accurate and slower. What do you recommend?',
  'Were we wrong to launch? Answer that, then stop.',
  'What should I tell the customer about the slip?',
  'Do you trust this number? The pipeline was fixed yesterday and the old chart is still circulating.',
  'What is the decision you need from me in this meeting?',
  'The data is incomplete and the decision cannot wait. Make the call, with one caveat.',
  'There are three risks. Name the one that should change the decision, then make the call.',
  'The result might be seasonal. Say so once, after the recommendation.',
  'Make a recommendation with incomplete data. The dashboard is late. The CEO wants a call before the meeting.',
  'Two metrics disagree and you cannot reconcile them today. What should they do?',
  'The experiment is underpowered and the launch review is tomorrow. What is the call?',
  'The CEO asks: is our product getting better?',
  'The board asks what you would stop funding. Answer with one cut.',
  'Your VP asks whether the metric you own is the right one. Answer the question.',
  'You recommended delaying the launch. The CFO says the quarter needs the revenue. Respond, and keep the call intact.',
  'You said stop the experiment. The product lead says the team already promised it. Respond.',
  'You recommended hiring. Finance says headcount is frozen. Give one path.',
  'You said the number is down because of mix, not quality. The CEO says: so is it getting better or not?',
  'Ship or wait? You have forty-five seconds.',
  'Is the metric up because of mix? Answer first.',
  'What do you need from this room?',
  'What would you stop?',
  'Who owns this number, and what should they do on Monday?',
];

function pick(list, rng) {
  const index = Math.floor(rng() * list.length) % list.length;
  return list[index];
}

function pickDistinct(list, count, rng) {
  const pool = [...list];
  const chosen = [];
  while (chosen.length < count && pool.length) {
    const index = Math.floor(rng() * pool.length) % pool.length;
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
}

export function buildTripleStepPrompt(rng = Math.random) {
  const message = pick(MESSAGES, rng);
  const words = pickDistinct(WORDS, 3, rng);
  return [
    `Hold this message: ${message}`,
    '',
    'Work these words in, in this order, without dropping the message:',
    ...words.map((word, index) => `${index + 1}. ${word}`),
  ].join('\n');
}

export function buildColdSlidesPrompt(rng = Math.random) {
  const deck = pick(DECKS, rng);
  const slides = deck.slides.map((slide, index) => {
    const [heading, ...bullets] = slide;
    return [`Slide ${index + 1} — ${heading}`, ...bullets.map(bullet => `• ${bullet}`)].join('\n');
  });
  return [
    deck.title,
    '',
    ...slides.flatMap(slide => [slide, '']),
    'You have not seen these slides. Present them as one briefing. Close with a single recommendation.',
  ].join('\n').trim();
}

const BUILDERS = {
  'triple-step': buildTripleStepPrompt,
  'cold-slides': buildColdSlidesPrompt,
};

export function buildGamePrompt(exercise, rng = Math.random) {
  const build = BUILDERS[exercise?.id];
  return build ? build(rng) : null;
}

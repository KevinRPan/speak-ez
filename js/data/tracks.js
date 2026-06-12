/**
 * Learning Tracks — Toastmasters-style structured programs
 *
 * Each track is a path of levels, each level a set of projects.
 * A project is completed by logging a number of practice reps.
 * Each rep runs through the normal workout engine (timer, recording,
 * AI review), then gets self-evaluated against the project checklist —
 * like a Toastmasters evaluation form.
 *
 * Levels unlock sequentially: finish every project in a level to
 * unlock the next one.
 */

export const TRACKS = [
  {
    id: 'foundations',
    name: 'Foundations of Public Speaking',
    tagline: 'The classic path — from first speech to moving an audience',
    icon: '🏛',
    color: '#7C5CFC',
    levels: [
      {
        name: 'Find Your Voice',
        projects: [
          {
            id: 'ice-breaker',
            name: 'Ice Breaker',
            icon: '🧊',
            objective: 'Deliver your first prepared talk: introduce yourself with confidence and a clear beginning, middle, and end.',
            exerciseId: 'storytelling',
            repsRequired: 2,
            duration: 240,
            durationLabel: '4 min',
            prompts: [
              'Introduce yourself: who you are, what shaped you, and what you hope to achieve.',
              'Tell the story of a moment that made you who you are today.',
              'Share three things about yourself that most people would never guess.',
            ],
            checklist: [
              'Opened with a hook, not your name',
              'Shared 2–3 concrete personal stories or details',
              'Had a clear beginning, middle, and end',
              'Closed with what you want to achieve',
            ],
            watchFor: [
              'Rushing through the personal parts',
              'Filler words when switching topics',
            ],
          },
          {
            id: 'organize-your-speech',
            name: 'Organize Your Speech',
            icon: '🗂',
            objective: 'Arrange ideas in a logical sequence so the audience can follow effortlessly: opening, 2–3 points, conclusion.',
            exerciseId: 'structured-response',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Stated the topic and roadmap up front',
              'Made 2–3 distinct points, clearly separated',
              'Used transitions between points',
              'Conclusion echoed the opening',
            ],
            watchFor: [
              'Points blending into each other',
              'Trailing off instead of concluding',
            ],
          },
          {
            id: 'get-to-the-point',
            name: 'Get to the Point',
            icon: '🎯',
            objective: 'Pick one clear message and make every sentence serve it. No padding, no detours.',
            exerciseId: 'concise-messaging',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            checklist: [
              'Stated the core message in the first 15 seconds',
              'Every point supported the core message',
              'Cut qualifiers and preamble',
              'Finished early rather than padding',
            ],
            watchFor: [
              'Restating the same idea in different words',
              'Hedging language ("sort of", "I guess", "maybe")',
            ],
          },
        ],
      },
      {
        name: 'Say It With Style',
        projects: [
          {
            id: 'how-you-say-it',
            name: 'How You Say It',
            icon: '🔤',
            objective: 'Deliver crisp, precise words. Articulation and word choice that make your message effortless to hear.',
            exerciseId: 'articulation',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Pronounced every word ending cleanly',
              'Kept clarity at full speaking speed',
              'Chose simple words over jargon',
              'No mumbled or swallowed phrases',
            ],
            watchFor: [
              'Clarity dropping as speed rises',
              'Trailing volume at the end of sentences',
            ],
          },
          {
            id: 'your-body-speaks',
            name: 'Your Body Speaks',
            icon: '🧍',
            objective: 'Use gestures, posture, and movement that reinforce your words instead of distracting from them.',
            exerciseId: 'hand-gestures',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Gestures matched and amplified the message',
              'Kept hands in the power zone (waist to shoulders)',
              'Stood balanced — no swaying or pacing',
              'Stayed still when stillness served the point',
            ],
            watchFor: [
              'Fidgeting or repetitive gestures',
              'Hands hiding in pockets or behind back',
            ],
          },
          {
            id: 'vocal-variety',
            name: 'Vocal Variety',
            icon: '🎵',
            objective: 'Use pitch, pace, and volume changes to add color and meaning. Kill the monotone.',
            exerciseId: 'pitch-variation',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Varied pitch to match the emotion of the content',
              'Changed pace at least twice for effect',
              'Used volume shifts to create emphasis',
              'Ended statements with downward inflection',
            ],
            watchFor: [
              'Sliding back into monotone mid-speech',
              'Upward inflection on statements',
            ],
          },
        ],
      },
      {
        name: 'Move Your Audience',
        projects: [
          {
            id: 'persuade-with-power',
            name: 'Persuade With Power',
            icon: '⚖️',
            objective: 'Build a case with logic and emotion, address the obvious objection, and ask for action.',
            exerciseId: 'persuasive-pitch',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Opened with why the audience should care',
              'Backed the case with evidence or examples',
              'Addressed the strongest objection head-on',
              'Closed with a specific call to action',
            ],
            watchFor: [
              'All logic, no emotional stakes',
              'Vague asks ("think about it") instead of clear ones',
            ],
          },
          {
            id: 'inspire-your-audience',
            name: 'Inspire Your Audience',
            icon: '🌅',
            objective: 'Deliver a talk that lifts people: a story with stakes, a turning point, and a message they carry home.',
            exerciseId: 'storytelling',
            repsRequired: 2,
            duration: 300,
            durationLabel: '5 min',
            prompts: [
              'Tell a story about overcoming a setback — and the belief it left you with.',
              'Share a moment when someone believed in you, and what it changed.',
              'Tell a story that proves an ordinary person can make a difference.',
            ],
            checklist: [
              'Story had real stakes and tension',
              'Built to a clear turning point',
              'Connected the story to a universal message',
              'Final line landed with conviction',
            ],
            watchFor: [
              'Summarizing the story instead of reliving it',
              'Moralizing too early — let the story breathe',
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'table-topics',
    name: 'Table Topics Mastery',
    tagline: 'Think on your feet — confident answers with zero preparation',
    icon: '⚡',
    color: '#00B4D8',
    levels: [
      {
        name: 'First Words',
        projects: [
          {
            id: 'confident-start',
            name: 'The Confident Start',
            icon: '🚀',
            objective: 'Beat the panic of the first sentence. Take a breath, plant a position, and start strong.',
            exerciseId: 'impromptu',
            repsRequired: 3,
            duration: 90,
            durationLabel: '90 sec',
            checklist: [
              'Paused to think instead of starting with "um"',
              'First sentence stated a clear position',
              'Voice sounded committed, not tentative',
              'No apologies or disclaimers',
            ],
            watchFor: [
              'Opening with "that\'s a good question..." as a stall',
              'Restarting the first sentence',
            ],
          },
          {
            id: 'one-point-well-made',
            name: 'One Point, Well Made',
            icon: '☝️',
            objective: 'Resist the urge to say everything. One point, one example, one clean restatement.',
            exerciseId: 'impromptu',
            repsRequired: 3,
            duration: 60,
            durationLabel: '60 sec',
            checklist: [
              'Committed to a single point',
              'Backed it with one concrete example',
              'Restated the point to close',
              'Stopped on time without rambling',
            ],
            watchFor: [
              'Adding a second point when the first was enough',
              'Examples that wander off-topic',
            ],
          },
        ],
      },
      {
        name: 'Structure Under Pressure',
        projects: [
          {
            id: 'prep-on-demand',
            name: 'PREP on Demand',
            icon: '🏗',
            objective: 'Make PREP (Point → Reason → Example → Point) automatic, so structure shows up even when nerves do.',
            exerciseId: 'structured-response',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            checklist: [
              'Opened with the Point in one sentence',
              'Gave a Reason that actually supports it',
              'Example was specific, not hypothetical',
              'Returned to the Point at the end',
            ],
            watchFor: [
              'Skipping the reason and jumping to the story',
              'Forgetting to close the loop',
            ],
          },
          {
            id: 'bridge-and-pivot',
            name: 'Bridge & Pivot',
            icon: '🌉',
            objective: 'Handle questions you don\'t know — acknowledge, bridge to what you do know, and answer with value.',
            exerciseId: 'impromptu',
            repsRequired: 3,
            duration: 90,
            durationLabel: '90 sec',
            prompts: [
              'What will the global economy look like in 50 years?',
              'How would you redesign the education system from scratch?',
              'What\'s the solution to misinformation online?',
              'How should cities prepare for the next century?',
              'What would you do as CEO of a failing company in an industry you know nothing about?',
            ],
            checklist: [
              'Acknowledged the question honestly',
              'Bridged to an angle I could speak to',
              'Delivered real substance on that angle',
              'Never pretended to know what I didn\'t',
            ],
            watchFor: [
              'Bluffing instead of bridging',
              'Long disclaimers before the pivot',
            ],
          },
        ],
      },
      {
        name: 'Rapid Fire',
        projects: [
          {
            id: 'rapid-fire-rounds',
            name: 'Rapid Fire Rounds',
            icon: '🔥',
            objective: 'Build volume: five short answers back to back. Consistency under fatigue is the goal.',
            exerciseId: 'impromptu',
            repsRequired: 5,
            duration: 60,
            durationLabel: '60 sec',
            checklist: [
              'Started within 5 seconds of reading the prompt',
              'Kept structure even in a short answer',
              'Energy stayed up for the whole rep',
              'Clean ending, not a fade-out',
            ],
            watchFor: [
              'Quality dropping on later reps',
              'Recycling the same opening formula',
            ],
          },
          {
            id: 'unexpected-question',
            name: 'The Unexpected Question',
            icon: '🎲',
            objective: 'Stay composed when the prompt is absurd. Commit to an angle and have fun with it.',
            exerciseId: 'impromptu',
            repsRequired: 3,
            duration: 90,
            durationLabel: '90 sec',
            prompts: [
              'If animals could talk, which species would be the rudest?',
              'You must replace handshakes with a new greeting. What is it and why?',
              'Argue that breakfast is a conspiracy.',
              'You\'re elected mayor of the moon. What\'s your first act?',
              'Defend the opinion that Mondays are the best day of the week.',
              'If you had to teach a class on something useless, what would it be?',
            ],
            checklist: [
              'Embraced the premise instead of fighting it',
              'Committed fully to one angle',
              'Used humor or imagery deliberately',
              'Stayed structured despite the absurdity',
            ],
            watchFor: [
              'Breaking character to comment on the question',
              'Laughing through instead of delivering',
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'presentation-mastery',
    name: 'Presentation Mastery',
    tagline: 'Command the room — openings, presence, and closes that stick',
    icon: '🎤',
    color: '#FF6B35',
    levels: [
      {
        name: 'Command the Room',
        projects: [
          {
            id: 'strong-opening',
            name: 'The Strong Opening',
            icon: '🎬',
            objective: 'Win the first 30 seconds. Hook with a question, story, or bold claim — never with throat-clearing.',
            exerciseId: 'impromptu',
            repsRequired: 3,
            duration: 60,
            durationLabel: '60 sec',
            prompts: [
              'Open a talk about why most meetings fail.',
              'Open a presentation pitching your dream project.',
              'Open a talk about a lesson your industry refuses to learn.',
              'Open a presentation about the future of your field.',
              'Open a talk convincing people to learn public speaking.',
            ],
            checklist: [
              'First sentence was a hook (question, story, or bold claim)',
              'No "today I\'m going to talk about..." preamble',
              'Made the audience\'s stake clear within 30 seconds',
              'Energy was high from the very first word',
            ],
            watchFor: [
              'Warming up during the opening instead of before it',
              'Apologetic body language in the first seconds',
            ],
          },
          {
            id: 'project-your-voice',
            name: 'Project Your Voice',
            icon: '📢',
            objective: 'Fill the room without shouting — supported breath, full projection, controlled dynamics.',
            exerciseId: 'volume-projection',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Projected from the diaphragm, not the throat',
              'Held full volume without strain',
              'Dropped to quiet deliberately for contrast',
              'Volume stayed strong through sentence endings',
            ],
            watchFor: [
              'Throat tension at high volume',
              'Volume fading as the rep goes on',
            ],
          },
        ],
      },
      {
        name: 'Own the Stage',
        projects: [
          {
            id: 'power-of-the-pause',
            name: 'The Power of the Pause',
            icon: '⏸',
            objective: 'Hold silence for 2–3 full seconds after key points. Let ideas land instead of rushing past them.',
            exerciseId: 'strategic-pausing',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Paused a full 2–3 seconds after key statements',
              'Paused before the most important word for tension',
              'Stayed composed in the silence — no fillers',
              'Pace felt unhurried and in control',
            ],
            watchFor: [
              'Cutting pauses short out of discomfort',
              'Filling silence with "so" or "um"',
            ],
          },
          {
            id: 'stage-presence',
            name: 'Stage Presence',
            icon: '🕴',
            objective: 'Move with purpose: claim the space, anchor on key points, and make movement mean something.',
            exerciseId: 'movement-space',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Every movement had a purpose (transition, emphasis)',
              'Planted feet when delivering key points',
              'No pacing, swaying, or drifting',
              'Posture stayed open and tall throughout',
            ],
            watchFor: [
              'Wandering during important lines',
              'Shrinking posture as energy dips',
            ],
          },
        ],
      },
      {
        name: 'Leave a Mark',
        projects: [
          {
            id: 'make-it-stick',
            name: 'Make It Stick',
            icon: '🧲',
            objective: 'Translate your most complex idea into an analogy a 12-year-old would get — and remember.',
            exerciseId: 'analogies-metaphors',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            checklist: [
              'Analogy came from everyday life',
              'Mapped cleanly onto the real concept',
              'Created a genuine "aha" moment',
              'Kept it short — didn\'t over-extend the metaphor',
            ],
            watchFor: [
              'Analogies that need their own explanation',
              'Stretching the metaphor past its breaking point',
            ],
          },
          {
            id: 'memorable-close',
            name: 'The Memorable Close',
            icon: '🏁',
            objective: 'End on purpose: a closing that circles back, lands the message, and tells the audience exactly what to do.',
            exerciseId: 'persuasive-pitch',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            prompts: [
              'Close a talk persuading your company to invest in training.',
              'Close a pitch for your dream project — ask for the green light.',
              'Close a talk inspiring students to take more risks.',
              'Close a presentation asking leadership for more team resources.',
              'Close a keynote about the future of communication.',
            ],
            checklist: [
              'Signaled the close ("here\'s what I want to leave you with")',
              'Callback to the opening hook',
              'One clear call to action',
              'Final sentence delivered slowly, with conviction',
            ],
            watchFor: [
              'Multiple fake endings',
              'Trailing off with "...so yeah, that\'s it"',
            ],
          },
        ],
      },
    ],
  },
];

export function getTrack(id) {
  return TRACKS.find(t => t.id === id);
}

/**
 * Find a project anywhere in a track.
 * Returns { track, level, levelIndex, project } or null.
 */
export function getTrackProject(trackId, projectId) {
  const track = getTrack(trackId);
  if (!track) return null;
  for (let i = 0; i < track.levels.length; i++) {
    const project = track.levels[i].projects.find(p => p.id === projectId);
    if (project) return { track, level: track.levels[i], levelIndex: i, project };
  }
  return null;
}

export function getTrackProjectCount(track) {
  return track.levels.reduce((sum, l) => sum + l.projects.length, 0);
}

/**
 * Build an ad-hoc workout for a single project rep,
 * runnable by the standard active-workout engine.
 */
export function buildProjectWorkout(track, project) {
  return {
    id: `track-${project.id}`,
    name: project.name,
    description: project.objective,
    icon: project.icon,
    color: track.color,
    duration: Math.ceil(project.duration / 60),
    exercises: [
      { exerciseId: project.exerciseId, sets: 1, duration: project.duration, rest: 0 },
    ],
  };
}

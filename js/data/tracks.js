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
  {
    id: 'acting-foundations',
    name: 'Acting Foundations',
    tagline: 'Free your instrument, build characters, and play real scenes',
    icon: '🎭',
    color: '#F72585',
    levels: [
      {
        name: 'Free the Instrument',
        projects: [
          {
            id: 'emotional-palette',
            name: 'The Emotional Palette',
            icon: '🎨',
            objective: 'Deliver one neutral line through five sharply different emotions. Prove the words are only 10% of the message.',
            exerciseId: 'emotion-switch',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            coaching: 'This is an acting drill: the speaker delivers the same neutral line repeatedly through different emotions (joy, grief, rage, fear, awe, etc.). Judge emotional range, believability, and contrast between versions — NOT speech structure or conciseness. Interpret "clarity" as how readable each emotion was, "structure" as how distinct the versions were from each other, and "confidence" as commitment to each emotion. Call out versions that sounded the same, emotions that arrived late (after the line started), and moments of genuine believability.',
            checklist: [
              'Performed at least 5 clearly different emotions',
              'Each emotion changed voice AND face AND body',
              'Emotion was alive before the first word, not added mid-line',
              'At least one version felt genuinely believable, not indicated',
            ],
            watchFor: [
              'Versions blurring into "loud" vs "quiet" instead of distinct emotions',
              'Smiling or breaking between takes',
            ],
          },
          {
            id: 'expressive-instrument',
            name: 'The Expressive Instrument',
            icon: '😮',
            objective: 'Let your face and body tell the story on their own. Exaggerate past comfortable — camera acting reads smaller than it feels.',
            exerciseId: 'facial-expression',
            repsRequired: 3,
            duration: 180,
            durationLabel: '3 min',
            coaching: 'This is an acting drill focused on facial expressiveness and physical storytelling. The speaker tells a story while deliberately exaggerating facial reactions and matching their body to the emotion of the content. Judge expressiveness, congruence between face and words, and range — NOT filler words or speech structure. Interpret "confidence" as physical commitment and "clarity" as how well the emotions read. Flag flat stretches ("resting presentation face") and moments where the face contradicted the words.',
            checklist: [
              'Face visibly changed with every story beat',
              'Eyebrows, eyes, and mouth all participated',
              'Expressions matched the emotional content of the words',
              'Held expressive reactions instead of snapping back to neutral',
            ],
            watchFor: [
              'Face going flat during "narration" stretches',
              'One default expression doing all the work',
            ],
          },
        ],
      },
      {
        name: 'Become Someone Else',
        projects: [
          {
            id: 'character-hot-seat',
            name: 'Character Hot Seat',
            icon: '🪑',
            objective: 'Build a character from scratch — voice, body, worldview — and stay inside them for the full rep.',
            exerciseId: 'character-embodiment',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            coaching: 'This is a character acting drill: the speaker embodies a fictional character (given in the prompt) and speaks as them. Judge transformation (how different from a neutral person), consistency (did the voice/physicality hold for the whole rep), and specificity (concrete details of the character\'s life and worldview). Do NOT penalize absurd content — it\'s the point. Interpret "structure" as character coherence and "confidence" as commitment without breaking. Flag drops out of character, drifting accents, and generic answers a "default person" would give.',
            checklist: [
              'Voice was clearly different from my natural voice',
              'Body and posture changed to match the character',
              'Invented specific details (names, history, opinions)',
              'Never broke character or narrated from outside',
            ],
            watchFor: [
              'Accent or voice drifting back to normal mid-rep',
              'Describing the character instead of BEING them',
            ],
          },
          {
            id: 'the-monologue',
            name: 'The Monologue',
            icon: '🎬',
            objective: 'Perform a dramatic monologue with real stakes and an emotional journey — end somewhere different than you began.',
            exerciseId: 'monologue-delivery',
            repsRequired: 2,
            duration: 180,
            durationLabel: '3 min',
            coaching: 'This is a dramatic monologue performance. The speaker plays a character in a high-stakes moment, speaking to an imaginary person. Judge stakes (did it feel like something real was at risk), emotional journey (did the performance move somewhere), and presence — NOT conciseness, filler counts, or presentation structure. Pauses, broken sentences, and hesitation may be deliberate acting choices; only flag them if they read as the performer losing the thread rather than the character struggling. Interpret "structure" as the shape of the emotional arc. Note whether they pursued an objective from the listener or just displayed emotion.',
            checklist: [
              'Knew who I was talking to and what I needed from them',
              'Stakes were felt, not announced',
              'Emotional state at the end differed from the start',
              'Held the final moment before breaking',
            ],
            watchFor: [
              'Performing the emotion instead of pursuing the objective',
              'Starting at 10/10 intensity with nowhere to go',
            ],
          },
        ],
      },
      {
        name: 'Play the Scene',
        projects: [
          {
            id: 'play-the-objective',
            name: 'Tactics & Objectives',
            icon: '♟️',
            objective: 'Pursue one goal against one obstacle using at least three different tactics. Acting is doing, not feeling.',
            exerciseId: 'objective-playing',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            coaching: 'This is a scene-work drill: the speaker pursues a stated objective against an obstacle, talking to an imaginary scene partner, switching tactics (charm, guilt, logic, threat, vulnerability...) when one fails. Judge objective clarity, tactic variety, and the visibility of tactic switches — NOT speech organization or filler words. Interpret "structure" as the tactical progression and "confidence" as commitment to the imaginary partner (eyeline, reactions, listening). Flag reps that used a single tactic throughout or forgot the obstacle.',
            checklist: [
              'The objective drove every line',
              'Used at least 3 distinct tactics',
              'Visibly registered the partner\'s (imagined) resistance before switching',
              'Never dropped the objective, even in pauses',
            ],
            watchFor: [
              'Explaining the situation instead of pursuing the want',
              'Tactics that are all the same energy (all pleading, all pushing)',
            ],
          },
          {
            id: 'full-transformation',
            name: 'The Full Transformation',
            icon: '🦋',
            objective: 'The capstone: sustain a character through a complete story with a beginning, turning point, and end — without breaking once.',
            exerciseId: 'character-embodiment',
            repsRequired: 2,
            duration: 240,
            durationLabel: '4 min',
            prompts: [
              'As your character, tell the story of the day everything changed for you.',
              'As your character, confess the thing you\'ve never told anyone.',
              'As your character, give a toast at a wedding where you have complicated history with the couple.',
              'As your character, explain to a young relative what you wish you\'d known at their age.',
            ],
            coaching: 'This is a capstone acting drill: the speaker invents a character AND performs a complete emotional story as that character for several minutes. Judge sustained transformation, narrative arc within the performance, and emotional truth. Do NOT judge it as a presentation — no points for "getting to the point." Interpret "structure" as story arc, "confidence" as unbroken commitment, "clarity" as how readable the character and their journey were. Flag character breaks, energy sags in the middle, and endings that trail off rather than land.',
            checklist: [
              'Character stayed fully intact for the entire rep',
              'Story had a beginning, turning point, and ending',
              'Character\'s emotions shifted believably across the story',
              'Final moment landed in character, with intention',
            ],
            watchFor: [
              'Transformation thinning as the story takes attention',
              'Rushing the emotional beats to get to plot',
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'improv-comedy',
    name: 'Improv & Comedy',
    tagline: 'Say yes, commit hard, and find the funny',
    icon: '🤣',
    color: '#FFD60A',
    levels: [
      {
        name: 'Say Yes',
        projects: [
          {
            id: 'yes-and-fundamentals',
            name: 'Yes, And',
            icon: '🙌',
            objective: 'Accept every premise completely and add new information every time you speak. The foundation of all improv.',
            exerciseId: 'yes-and',
            repsRequired: 3,
            duration: 90,
            durationLabel: '90 sec',
            coaching: 'This is a "Yes, And" improv drill: the speaker receives an absurd opening line and must accept its reality completely and keep adding new specific information, building a scene solo. Judge acceptance (never denying or dodging the premise), contribution (new concrete details each beat), and commitment. Absurdity is required, not a flaw. Interpret "structure" as scene-building (establishing who/where/what and advancing it) and "confidence" as playing it truthfully rather than commenting on the silliness. Flag blocks, denials, questions that dodge contributing, and stretches where no new information arrived.',
            checklist: [
              'Accepted the opening premise 100% — no denial, no "actually"',
              'Added new specific information with every beat',
              'Established who, where, and what mattered',
              'Played it truthfully instead of commenting on the absurdity',
            ],
            watchFor: [
              'Asking questions instead of adding statements',
              'Wrapping up the scene instead of building it',
            ],
          },
          {
            id: 'commit-to-the-bit',
            name: 'Commit to the Bit',
            icon: '🧠',
            objective: 'Play an absurd expert at the top of your intelligence. Total sincerity, invented specifics, zero winking.',
            exerciseId: 'expert-interview',
            repsRequired: 3,
            duration: 90,
            durationLabel: '90 sec',
            coaching: 'This is an "Instant Expert" improv drill: the speaker plays the world\'s leading authority on an absurd subject with complete sincerity. Judge commitment (never breaking or winking), invention (specific fabricated credentials, terminology, rivals, discoveries), and internal logic (absurd premise treated rigorously). Laughing at their own material or hedging is the main failure mode. Interpret "confidence" as sincerity of the expert persona, "structure" as the coherence of the invented expertise, and "clarity" as how vivid the fabricated details were.',
            checklist: [
              'Never broke character or laughed at the premise',
              'Invented at least 3 specific details (terms, dates, names, rivalries)',
              'Treated the absurd field with complete academic seriousness',
              'Answered as someone with 30 years of expertise would',
            ],
            watchFor: [
              'Grinning or winking at the camera',
              'Vague generalities instead of invented specifics',
            ],
          },
        ],
      },
      {
        name: 'Find the Game',
        projects: [
          {
            id: 'new-choice-rounds',
            name: 'New Choice',
            icon: '🔀',
            objective: 'Release your first idea instantly and generate a wildly different one. Train the muscle that beats writer\'s block on stage.',
            exerciseId: 'new-choice',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            coaching: 'This is the "New Choice" improv drill: the speaker tells a story, and periodically calls "new choice!" on themselves, instantly replacing the last detail with a completely different kind of idea, then continuing the story. Judge generation speed (no stalling after calling new choice), variety (replacements are different in KIND, not synonyms), and story momentum (the narrative keeps moving with each new choice). Interpret "structure" as story continuity across swaps and "confidence" as decisiveness. Flag synonyms-as-choices, long stalls, and abandoning the story.',
            checklist: [
              'Called at least 6 new choices',
              'Replacements were different in kind, not synonyms',
              'New ideas arrived within ~2 seconds',
              'Story kept moving forward through every swap',
            ],
            watchFor: [
              'Choices getting safer as the rep goes on',
              'Losing the story thread after a swap',
            ],
          },
          {
            id: 'heighten-everything',
            name: 'Heighten the Game',
            icon: '📈',
            objective: 'Find the one funny thing and escalate it in three beats to its logical extreme. The core move of sketch comedy.',
            exerciseId: 'heightening',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            coaching: 'This is a heightening drill from sketch/longform improv: the speaker takes one absurd premise ("the game") and escalates it across three announced beats to its logical extreme, asking "if this is true, what else is true?" Judge game focus (ONE game, not new weird ideas bolted on), escalation (each beat genuinely bigger), and logic (the extreme follows from the premise). Interpret "structure" as the beat progression, "confidence" as commitment to each beat, and "clarity" as how identifiable the game was. Flag second unrelated games, flat beats that repeat rather than heighten, and skipped establishment.',
            checklist: [
              'Established the game straight before escalating',
              'Each beat was clearly bigger than the last',
              'Escalation followed the premise\'s own logic',
              'Never added a second unrelated weird thing',
            ],
            watchFor: [
              'Beat 2 and 3 being the same size',
              'Escalating randomness instead of the original game',
            ],
          },
        ],
      },
      {
        name: 'Comedy Chops',
        projects: [
          {
            id: 'the-rant',
            name: 'The Rant',
            icon: '🌋',
            objective: 'Operatic outrage about something tiny. Escalate from irritated to unhinged with laser-specific detail.',
            exerciseId: 'comedy-rant',
            repsRequired: 3,
            duration: 90,
            durationLabel: '90 sec',
            coaching: 'This is a comedic rant drill in the stand-up tradition: passionate escalating outrage about a trivial annoyance. Judge escalation (irritated → operatic by the end), specificity (brands, times, exact sounds — the details ARE the jokes), and energy. The disproportion between fury and stakes is the point — do not advise the speaker to calm down or be more balanced. Interpret "structure" as the escalation arc and rule-of-three usage, "confidence" as committed fury, "pace" as comic rhythm. Flag generic complaints, flat energy, and endings that fizzle instead of peaking.',
            checklist: [
              'Started annoyed, ended operatic',
              'Used hyper-specific details, not generic complaints',
              'Landed at least one rule-of-three',
              'Ended on the biggest point — no fade-out',
            ],
            watchFor: [
              'Volume replacing escalation (louder ≠ funnier)',
              'Apologizing for or softening the take',
            ],
          },
          {
            id: 'sell-me-this',
            name: 'Sell Me This',
            icon: '📺',
            objective: 'The capstone: a full infomercial pitch for a ridiculous product — problem, demo, testimonial, offer, tagline.',
            exerciseId: 'absurd-sales-pitch',
            repsRequired: 3,
            duration: 120,
            durationLabel: '2 min',
            coaching: 'This is an absurd infomercial pitch drill — a comedy capstone combining commitment, structure, and showmanship. The speaker sells a ridiculous product with total late-night-TV sincerity. Judge commitment (believing in the product completely), comedic structure (manufactured problem → miracle solution → escalating bonuses → close), and showmanship. Interpret "structure" as the infomercial arc, "confidence" as salesperson conviction, "clarity" as how vivid the product and offer were. Flag breaks in sincerity, missing pitch beats, and taglines that don\'t land.',
            checklist: [
              'Opened with a dramatic manufactured problem',
              'Hit the beats: demo, testimonial, limited-time offer',
              'Handled the skeptical caller without breaking',
              'Closed with price, discount, and a tagline',
            ],
            watchFor: [
              'Sincerity cracking when the product gets silly',
              'Forgetting to actually ask for the sale',
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

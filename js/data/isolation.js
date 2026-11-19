/**
 * Isolation drill — one five-minute take, then three reviews.
 * Ears, then eyes, then the words. Each pass has a list of things
 * to notice and a question to answer about them.
 */

export const ISOLATION_SECONDS = 5 * 60;

export const ISOLATION_TOPICS = [
  {
    id: 'belief-changed',
    title: 'A belief you changed',
    prompt: 'Pick a belief you held a year ago and do not hold now. What you used to think, the moment it cracked, and what you think instead.',
  },
  {
    id: 'teach-a-skill',
    title: 'Teach a useful skill',
    prompt: 'Teach something you can actually do, as if the listener has five minutes before they have to try it themselves.',
  },
  {
    id: 'decision-cost',
    title: 'A decision and its cost',
    prompt: 'A decision you would make again. Spend real time on what it cost you, not only on why it was right.',
  },
  {
    id: 'what-people-get-wrong',
    title: 'What people get wrong',
    prompt: 'Something people in your work get wrong. Name the wrong version, the better version, and one story that shows the difference.',
  },
  {
    id: 'hard-idea',
    title: 'A hard idea, simply',
    prompt: 'Explain an idea you understand and most people do not. Talk to a smart twelve-year-old. Unpack any jargon you use.',
  },
  {
    id: 'stayed-quiet',
    title: 'A time you stayed quiet',
    prompt: 'A moment you stayed quiet and should not have. What you wish you had said, and what it would have changed.',
  },
  {
    id: 'redesign',
    title: 'Redesign a process',
    prompt: 'A process you would rebuild from scratch: a meeting, a handoff, a morning. What you would keep, what you would throw out, and what the new version feels like.',
  },
  {
    id: 'known-for',
    title: 'What you want to be known for',
    prompt: 'What you want people to trust you for. The evidence you have so far, and the evidence you still owe.',
  },
];

export const AUDIO_CHECKS = [
  {
    id: 'fillers',
    title: 'Filler words',
    question: 'Where do um, uh, like, so, you know, or right stand in for the next word?',
    ask: 'Which one word keeps coming back? That one is the tic. Leave the rest for another rep.',
  },
  {
    id: 'noises',
    title: 'Sounds that are not words',
    question: 'Lip smacks, throat clears, tongue clicks, or a gasp of air right before a sentence.',
    ask: 'Does it happen once, or does it fire every time you start a line? The transcript will not show these.',
  },
  {
    id: 'melody',
    title: 'Melody that does not mean anything',
    question: 'Every line rising at the end, or one flat note for a long stretch.',
    ask: 'Does your pitch move because the idea changed, or does it move on a habit?',
  },
  {
    id: 'pace',
    title: 'Speed as a tic',
    question: 'Rushing the line that matters, or speeding up the moment you feel unsure.',
    ask: 'Where did you get faster because you wanted the sentence to be over?',
  },
  {
    id: 'restarts',
    title: 'Abandoned lines',
    question: 'A "wait", a "what I mean is", or a sentence you start and drop.',
    ask: 'Which line did you leave unfinished? Say the finished version once, out loud, then move on.',
  },
];

export const VISUAL_CHECKS = [
  {
    id: 'eyes',
    title: 'Eyes',
    question: 'Do you hold the lens, or look away at the end of a line, up when you search, down when the point lands?',
    ask: 'Where does your gaze break, and was that break doing a job?',
  },
  {
    id: 'hands',
    title: 'Hands',
    question: 'Pockets, clasped hands, hair, collar, face, a pen, or a point at nothing.',
    ask: 'Which movement did not illustrate the sentence? That one is the tic.',
  },
  {
    id: 'stillness',
    title: 'Stillness',
    question: 'Weight shift, sway, rock, a step back, a shrug on every clause.',
    ask: 'What does your body repeat the way a filler repeats in your voice?',
  },
  {
    id: 'face',
    title: 'Face',
    question: 'A frozen face, or a nod, eyebrow, or smile that runs on a loop.',
    ask: 'Is your face reacting to this idea, or running a habit from the last idea?',
  },
  {
    id: 'posture',
    title: 'Posture over the take',
    question: 'Compare how you stand at the open with how you stand at the close.',
    ask: 'Did you shrink, lean out, or fold as the minutes went on?',
  },
];

export const STRUCTURE_CHECKS = [
  {
    id: 'point',
    title: 'The point',
    question: 'In one sentence, what should the listener leave with?',
    ask: 'Is that sentence inside the opening, or did you bury it later?',
  },
  {
    id: 'open',
    title: 'The opening',
    question: 'Read only the opening.',
    ask: 'Does a listener know why this matters, or are they still waiting for you to start?',
  },
  {
    id: 'sequence',
    title: 'The sequence',
    question: 'Is the middle a line of beats (claim, example, meaning) or a pile of related thoughts?',
    ask: 'Can you label each chunk in three words? If you cannot, it is not a beat yet.',
  },
  {
    id: 'specifics',
    title: 'Specifics',
    question: 'Where is the concrete scene (a time, a name, a number) and where did you stay abstract?',
    ask: 'If you removed every abstract sentence, would the point still be there?',
  },
  {
    id: 'repeats',
    title: 'Repeats',
    question: 'Which sentence says something you already said?',
    ask: 'Cut the second copy. What gets clearer?',
  },
  {
    id: 'close',
    title: 'The close',
    question: 'Read only the last line.',
    ask: 'Does it land a change, an ask, or a so-what, or does it trail off?',
  },
];

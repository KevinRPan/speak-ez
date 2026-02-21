/**
 * Scenario definitions for Speak-EZ Scenario Practice
 * Professional interaction scenarios with context for AI-driven Q&A
 */

export const SCENARIO_CATEGORIES = {
  PROFESSIONAL: 'professional',
  PRESENTATIONS: 'presentations',
  DIFFICULT: 'difficult',
  SOCIAL: 'social',
};

export const SCENARIO_CATEGORY_INFO = {
  [SCENARIO_CATEGORIES.PROFESSIONAL]: {
    label: 'Professional Interactions',
    icon: '💼',
    color: '#7C5CFC',
    description: 'Nail interviews, networking, and workplace conversations',
  },
  [SCENARIO_CATEGORIES.PRESENTATIONS]: {
    label: 'Presentations',
    icon: '🎤',
    color: '#FF6B35',
    description: 'Command attention from stage or screen',
  },
  [SCENARIO_CATEGORIES.DIFFICULT]: {
    label: 'Difficult Conversations',
    icon: '🤝',
    color: '#00B4D8',
    description: 'Navigate conflict, feedback, and tough talks',
  },
  [SCENARIO_CATEGORIES.SOCIAL]: {
    label: 'Social Situations',
    icon: '🎉',
    color: '#58CC02',
    description: 'Be memorable in casual and social settings',
  },
};

export const scenarios = [
  // === PROFESSIONAL INTERACTIONS ===
  {
    id: 'job-interview-greeting',
    category: SCENARIO_CATEGORIES.PROFESSIONAL,
    name: 'Job Interview Greeting',
    description: 'Make a great first impression with confident small talk before the interview begins.',
    context: 'You\'ve just walked into the interview room. The hiring manager stands up, shakes your hand, and says "Thanks for coming in today! How was your commute?" This is your chance to set a positive, confident tone before the formal questions begin.',
    duration: 90,
    difficulty: 'beginner',
    tips: 'Keep it warm and brief. Smile, make eye contact, and transition naturally into showing enthusiasm for the role. Don\'t ramble about traffic.',
    aiRole: 'You are the hiring manager conducting a job interview. You just greeted the candidate. Respond naturally and then transition into the interview.',
    unlocked: true,
    order: 1,
  },
  {
    id: 'conference-networking',
    category: SCENARIO_CATEGORIES.PROFESSIONAL,
    name: 'Conference Networking',
    description: 'Make a professional connection and naturally exchange contact information.',
    context: 'You\'re at an industry conference during a coffee break. You notice someone wearing a badge from a company you\'d love to connect with. You approach them. Start the conversation, find common ground, and aim to exchange contact info naturally.',
    duration: 120,
    difficulty: 'intermediate',
    tips: 'Lead with curiosity, not a pitch. Ask about their talk or session experience. Find a genuine reason to stay in touch.',
    aiRole: 'You are a professional at an industry conference during a coffee break. You\'re open to conversation but not looking to be pitched. Respond naturally and share about your own work when asked.',
    unlocked: false,
    order: 2,
  },
  {
    id: 'elevator-pitch',
    category: SCENARIO_CATEGORIES.PROFESSIONAL,
    name: 'Elevator Pitch',
    description: 'Deliver a compelling self-introduction before the elevator ride ends.',
    context: 'You step into an elevator and recognize a senior leader from a company you admire. You have about 60 seconds. Introduce yourself, explain what you do, and make them want to continue the conversation.',
    duration: 60,
    difficulty: 'intermediate',
    tips: 'Hook them in the first 10 seconds. Focus on the problem you solve, not your job title. End with a clear ask or next step.',
    aiRole: 'You are a senior executive. You\'re polite but busy. If the pitch is compelling, show interest and ask a follow-up. If it\'s generic, be politely dismissive.',
    unlocked: false,
    order: 3,
  },
  {
    id: 'first-video-call',
    category: SCENARIO_CATEGORIES.PROFESSIONAL,
    name: 'First Video Call',
    description: 'Create a warm professional presence despite the digital format.',
    context: 'You\'re joining a video call with a new client or collaborator for the first time. They\'ve only seen your email. Start the call, build rapport quickly, and set the agenda for the meeting.',
    duration: 120,
    difficulty: 'beginner',
    tips: 'Look at the camera, not the screen. Smile first, talk second. Acknowledge the virtual format naturally.',
    aiRole: 'You are a new client joining a video call for the first time. You\'re somewhat reserved initially but warm up when the other person is genuine.',
    unlocked: false,
    order: 4,
  },

  // === PRESENTATIONS ===
  {
    id: 'project-update',
    category: SCENARIO_CATEGORIES.PRESENTATIONS,
    name: 'Project Status Update',
    description: 'Deliver a clear, concise project update to stakeholders.',
    context: 'You\'re in a weekly standup with your team and leadership. You have 2 minutes to update everyone on your project\'s progress, any blockers, and next steps. Be clear, concise, and confident.',
    duration: 120,
    difficulty: 'beginner',
    tips: 'Use the framework: Progress → Blockers → Next Steps. Lead with the headline, not the backstory. Quantify when possible.',
    aiRole: 'You are a stakeholder in a meeting. Ask clarifying questions about timelines, risks, or resource needs based on what the presenter says.',
    unlocked: true,
    order: 1,
  },
  {
    id: 'product-demo',
    category: SCENARIO_CATEGORIES.PRESENTATIONS,
    name: 'Product Demo',
    description: 'Showcase a product or feature with enthusiasm and clarity.',
    context: 'You\'re presenting a new product feature to potential customers. Walk them through the key benefits, show how it works (describe what you\'d show on screen), and handle their interest with confidence.',
    duration: 180,
    difficulty: 'intermediate',
    tips: 'Start with the problem it solves, not the feature itself. Paint a before/after picture. End with a clear call to action.',
    aiRole: 'You are a potential customer evaluating the product. Ask practical questions about pricing, integration, and how it compares to alternatives.',
    unlocked: false,
    order: 2,
  },
  {
    id: 'team-kickoff',
    category: SCENARIO_CATEGORIES.PRESENTATIONS,
    name: 'Team Kickoff Speech',
    description: 'Rally your team at the start of a new project or quarter.',
    context: 'Your team is starting a challenging new project. As the team lead, deliver an inspiring kickoff that covers the vision, why it matters, and what success looks like. Make people feel energized and aligned.',
    duration: 180,
    difficulty: 'intermediate',
    tips: 'Connect the work to something meaningful. Acknowledge the challenge honestly. Show confidence in the team\'s ability.',
    aiRole: 'You are a team member at the kickoff. Ask questions about priorities, timeline expectations, and how success will be measured.',
    unlocked: false,
    order: 3,
  },
  {
    id: 'lightning-talk',
    category: SCENARIO_CATEGORIES.PRESENTATIONS,
    name: 'Lightning Talk',
    description: 'Deliver a high-impact 3-minute talk on a topic you\'re passionate about.',
    context: 'You\'ve been given a 3-minute slot at a meetup or all-hands meeting to talk about something you care about professionally. Pick a topic, hook the audience fast, deliver your insight, and end strong.',
    duration: 180,
    difficulty: 'advanced',
    tips: 'One idea, not three. Start with a surprising fact or question. End with a memorable takeaway. Practice ruthless editing.',
    aiRole: 'You are an audience member at a meetup. Ask thought-provoking follow-up questions about the topic presented.',
    unlocked: false,
    order: 4,
  },

  // === DIFFICULT CONVERSATIONS ===
  {
    id: 'giving-feedback',
    category: SCENARIO_CATEGORIES.DIFFICULT,
    name: 'Giving Constructive Feedback',
    description: 'Share honest, helpful feedback that motivates improvement.',
    context: 'A colleague delivered a presentation that had some real issues — disorganized structure, too many filler words, and went over time. You want to help them improve without damaging the relationship. Start the conversation.',
    duration: 120,
    difficulty: 'intermediate',
    tips: 'Use the SBI model: Situation → Behavior → Impact. Be specific, not vague. Ask permission to share feedback first.',
    aiRole: 'You are a colleague who just gave a presentation. You\'re somewhat defensive but open to genuine help. Respond emotionally at first but warm up to specific, actionable feedback.',
    unlocked: true,
    order: 1,
  },
  {
    id: 'salary-negotiation',
    category: SCENARIO_CATEGORIES.DIFFICULT,
    name: 'Salary Negotiation',
    description: 'Advocate for fair compensation with confidence and evidence.',
    context: 'You\'ve received a job offer (or it\'s review time) and the compensation is below what you believe you\'re worth. You have data and accomplishments to back your ask. Begin the negotiation conversation.',
    duration: 150,
    difficulty: 'advanced',
    tips: 'Lead with gratitude and enthusiasm for the role. Present market data matter-of-factly. Use silence after stating your number — don\'t immediately justify.',
    aiRole: 'You are a hiring manager or boss. You have some budget flexibility but need to be convinced. Push back on the first ask but be open to negotiation.',
    unlocked: false,
    order: 2,
  },
  {
    id: 'disagreeing-with-boss',
    category: SCENARIO_CATEGORIES.DIFFICULT,
    name: 'Disagreeing with Your Boss',
    description: 'Push back on a decision respectfully while maintaining the relationship.',
    context: 'Your manager just proposed a project direction you believe is wrong. You have valid reasons and an alternative approach. Express your disagreement constructively without undermining their authority.',
    duration: 120,
    difficulty: 'advanced',
    tips: 'Start by acknowledging their perspective. Use "I noticed" and "I\'m concerned about" instead of "You\'re wrong." Propose an alternative, don\'t just criticize.',
    aiRole: 'You are a manager who just proposed a direction. You believe in your approach but respect team input. If the pushback is well-reasoned, consider it. If it\'s just disagreement without substance, hold firm.',
    unlocked: false,
    order: 3,
  },
  {
    id: 'apologizing-professionally',
    category: SCENARIO_CATEGORIES.DIFFICULT,
    name: 'Professional Apology',
    description: 'Own a mistake and restore trust with sincerity.',
    context: 'You missed an important deadline that affected your team. You need to address it directly with your manager. Take full ownership, explain what happened (without making excuses), and share your plan to prevent it from happening again.',
    duration: 120,
    difficulty: 'intermediate',
    tips: 'Don\'t minimize or deflect. State what happened, take responsibility, express impact awareness, and commit to a specific fix. Brief is better than lengthy.',
    aiRole: 'You are the manager who was affected by the missed deadline. You\'re frustrated but fair. Respond to the apology based on how genuine and solution-oriented it is.',
    unlocked: false,
    order: 4,
  },

  // === SOCIAL SITUATIONS ===
  {
    id: 'party-introduction',
    category: SCENARIO_CATEGORIES.SOCIAL,
    name: 'Party Introduction',
    description: 'Introduce yourself in a casual social setting and keep the conversation flowing.',
    context: 'You arrive at a friend\'s house party where you only know the host. Someone approaches you and asks "So, how do you know [host name]?" Use this as a jumping-off point for an engaging conversation.',
    duration: 90,
    difficulty: 'beginner',
    tips: 'Be curious about THEM. After answering their question, pivot to asking about their connection. Find common interests quickly.',
    aiRole: 'You are a friendly person at a party. You\'re social and curious. Match the other person\'s energy and share about yourself when asked.',
    unlocked: true,
    order: 1,
  },
  {
    id: 'toast-speech',
    category: SCENARIO_CATEGORIES.SOCIAL,
    name: 'Giving a Toast',
    description: 'Deliver a heartfelt, memorable toast at a celebration.',
    context: 'You\'ve been asked to give a toast at a friend\'s birthday, wedding, or achievement celebration. You have about 90 seconds. Make it personal, funny, and end with a genuine moment.',
    duration: 90,
    difficulty: 'intermediate',
    tips: 'One story, one theme. Start with a moment that captures who they are. End with the room feeling something genuine. Don\'t just list nice adjectives.',
    aiRole: 'You are a guest at the celebration. After the toast, comment on what resonated and ask about the relationship or story shared.',
    unlocked: false,
    order: 2,
  },
  {
    id: 'awkward-silence',
    category: SCENARIO_CATEGORIES.SOCIAL,
    name: 'Breaking Awkward Silence',
    description: 'Rescue a dying conversation with genuine curiosity.',
    context: 'You\'re sitting at a dinner table and the conversation has completely stalled. Everyone is looking at their phone. Be the person who restarts the conversation with something genuinely interesting.',
    duration: 90,
    difficulty: 'intermediate',
    tips: 'Ask an unexpected question. Avoid yes/no questions. Share something vulnerable or surprising about yourself to invite others to open up.',
    aiRole: 'You are someone at a dinner table where conversation has stalled. You\'re slightly bored. Engage if the topic is genuinely interesting, give short answers if it feels forced.',
    unlocked: false,
    order: 3,
  },
  {
    id: 'telling-a-joke',
    category: SCENARIO_CATEGORIES.SOCIAL,
    name: 'Telling a Great Story',
    description: 'Captivate a group with a funny or fascinating story from your life.',
    context: 'Someone in your friend group just said "No way, tell them that story!" All eyes are on you. Deliver the story with great pacing, build-up, and a satisfying payoff.',
    duration: 120,
    difficulty: 'advanced',
    tips: 'Set the scene fast. Build tension slowly. Don\'t give away the punchline early. Use pauses for dramatic effect. Commit fully to the delivery.',
    aiRole: 'You are an engaged listener hearing the story for the first time. React naturally — laugh, gasp, or ask "wait, then what happened?" at appropriate moments.',
    unlocked: false,
    order: 4,
  },
];

export function getScenario(id) {
  return scenarios.find(s => s.id === id);
}

export function getScenariosByCategory(category) {
  return scenarios
    .filter(s => s.category === category)
    .sort((a, b) => a.order - b.order);
}

export function getCategories() {
  return Object.entries(SCENARIO_CATEGORY_INFO).map(([key, info]) => ({
    id: key,
    ...info,
  }));
}

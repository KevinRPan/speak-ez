/**
 * Interview drill question bank
 *
 * Organized by field -> round -> level.
 * Each question has a prompt (q) and a coaching hint.
 */

export const FIELDS = {
  'data-science': {
    label: 'Data Science',
    icon: '\u{1F4CA}',
    levels: ['Senior', 'Staff', 'Principal'],
    rounds: {
      behavioral: {
        label: 'Behavioral & Leadership',
        icon: '\u{1F3AF}',
        timeGuide: '2-4 min per answer',
        description: 'STAR-format answers about impact, collaboration, and leadership',
        rubric: ['Structure (STAR)', 'Specificity & metrics', 'Leadership signal', 'Self-awareness'],
        questions: {
          Senior: [
            { q: 'Tell me about a time you had to influence a cross-functional team to adopt a new metric or measurement approach.', hint: 'Focus on the stakeholder dynamics and how you built alignment.' },
            { q: 'Describe a project where your initial analysis led you in the wrong direction. How did you course-correct?', hint: 'Show intellectual honesty and structured problem-solving.' },
            { q: 'Tell me about a time you had to push back on a product or engineering partner\'s request for analysis.', hint: 'Emphasize communication skills and maintaining relationships.' },
            { q: 'Describe a situation where you had to make a recommendation with incomplete data.', hint: 'Show how you quantified uncertainty and communicated risk.' },
            { q: 'Tell me about the most impactful analysis you\'ve delivered. What made it impactful?', hint: 'Connect analytical work to measurable business outcomes.' },
          ],
          Staff: [
            { q: 'Tell me about a time you set the technical direction for a data science team or organization.', hint: 'Show strategic thinking beyond individual contribution.' },
            { q: 'Describe a situation where you had to align multiple teams with conflicting priorities around a shared data initiative.', hint: 'Focus on your approach to navigating organizational complexity.' },
            { q: 'Tell me about a time you mentored a data scientist through a significant growth challenge.', hint: 'Show investment in others\' development and your coaching approach.' },
            { q: 'Describe a project where you had to balance technical rigor with speed of delivery for a critical business need.', hint: 'Show judgment and ability to make pragmatic tradeoffs.' },
            { q: 'Tell me about a time you identified a systemic problem in how your organization used data and drove a solution.', hint: 'Demonstrate organizational-level impact and initiative.' },
          ],
        },
      },
      'product-sense': {
        label: 'Product Sense & Metrics',
        icon: '\u{1F4A1}',
        timeGuide: '5-8 min structured walkthrough',
        description: 'Define metrics, diagnose changes, and design measurement frameworks',
        rubric: ['Metric framework clarity', 'Tradeoff awareness', 'Business intuition', 'Structured communication'],
        questions: {
          Senior: [
            { q: 'You\'re the DS for Instagram Reels. Engagement is up 15% but time spent per session is down 10%. Diagnose what might be happening and what you\'d investigate.', hint: 'Build a hypothesis tree. Consider composition effects, user segmentation, and product changes.' },
            { q: 'Design the success metrics for a new \'AI-generated post summaries\' feature on a social platform.', hint: 'Think about guardrail metrics, proxy vs. true north metrics, and how you\'d validate the metric framework.' },
            { q: 'Daily active users dropped 3% week-over-week. Walk me through your investigation.', hint: 'Start broad (data quality, seasonality, product changes) then systematically narrow.' },
            { q: 'How would you measure the success of a recommendation algorithm change for an e-commerce platform?', hint: 'Consider short-term vs. long-term metrics, ecosystem effects, and experiment design.' },
          ],
          Staff: [
            { q: 'You\'re asked to build the metrics framework for a new business line that doesn\'t exist yet. How do you approach this?', hint: 'Show how you think about leading vs lagging indicators and metric evolution over time.' },
            { q: 'Two product teams are optimizing for metrics that are in tension with each other. How do you resolve this?', hint: 'Demonstrate organizational thinking and ability to align incentives.' },
            { q: 'The CEO asks: \'Is our product getting better?\' How do you build a framework to answer this ongoing question?', hint: 'Think about composite metrics, quality indices, and executive communication.' },
          ],
        },
      },
      'ml-system-design': {
        label: 'ML System Design',
        icon: '\u{1F9E0}',
        timeGuide: '25-35 min end-to-end',
        description: 'Design ML systems from problem framing through deployment and monitoring',
        rubric: ['Problem framing', 'Data & feature engineering', 'Model selection rationale', 'System architecture', 'Monitoring & iteration'],
        questions: {
          Senior: [
            { q: 'Design a content recommendation system for a short-form video platform.', hint: 'Cover candidate generation, ranking, real-time signals, cold start, and feedback loops.' },
            { q: 'Design an ML system to detect fraudulent transactions in real-time for a payment platform.', hint: 'Think about latency requirements, feature stores, model serving, and the cost of false positives vs. false negatives.' },
            { q: 'Design a search ranking system for a job marketplace.', hint: 'Consider two-sided marketplace dynamics, relevance vs. fairness, and personalization.' },
          ],
          Staff: [
            { q: 'Design the ML infrastructure platform that would support 50+ data scientists shipping models across different product areas.', hint: 'Think about standardization vs. flexibility, feature stores, experiment platforms, and model governance.' },
            { q: 'Design an ML system for optimizing ad delivery across multiple surfaces (feed, stories, search) with a unified budget.', hint: 'Consider cross-surface optimization, pacing, auction theory, and organizational ownership.' },
            { q: 'Your company wants to integrate LLMs into core product experiences. Design the evaluation and deployment framework.', hint: 'Think about eval methodology, safety, cost management, latency, and when LLMs are/aren\'t the right tool.' },
          ],
        },
      },
      'technical-sql': {
        label: 'Technical SQL & Analytics',
        icon: '\u{1F527}',
        timeGuide: '15-20 min per problem',
        description: 'Write queries, reason about data modeling, and solve analytical problems',
        rubric: ['Query correctness', 'Edge case handling', 'Efficiency awareness', 'Communication of approach'],
        questions: {
          Senior: [
            { q: 'Given a table of user_sessions (user_id, session_start, session_end, platform), write a query to find users whose average session length increased month-over-month for 3 consecutive months.', hint: 'Think about window functions, date truncation, and how to define \'consecutive increase\'.' },
            { q: 'You have tables: posts(id, user_id, created_at), likes(post_id, user_id, created_at), follows(follower_id, followee_id). Find the top 10 users whose posts get the highest like rate from non-followers.', hint: 'This tests JOIN logic, filtering, and metric definition.' },
          ],
          Staff: [
            { q: 'Design the data model for an experimentation platform that needs to support multiple concurrent A/B tests with mutual exclusion groups.', hint: 'Think about the entity relationships, how to handle assignment logic, and metric aggregation.' },
            { q: 'You discover that a critical daily metrics pipeline has been double-counting users for the past 2 weeks due to a JOIN issue. Walk me through how you\'d investigate, quantify impact, and communicate this.', hint: 'This is as much about communication and process as it is about SQL.' },
          ],
        },
      },
      statistics: {
        label: 'Statistics & Experimentation',
        icon: '\u{1F4D0}',
        timeGuide: '10-15 min per problem',
        description: 'Experiment design, causal inference, and statistical reasoning',
        rubric: ['Statistical rigor', 'Practical tradeoffs', 'Assumption awareness', 'Clear explanation'],
        questions: {
          Senior: [
            { q: 'You\'re running an A/B test for a new checkout flow. After 2 weeks, your p-value is 0.06 with a 2% lift. Your PM wants to ship it. What do you do?', hint: 'Discuss power, practical significance, peeking, and how to communicate with stakeholders.' },
            { q: 'How would you design an experiment to test a new ranking algorithm when you can\'t randomize at the user level because of network effects?', hint: 'Consider cluster randomization, switchback designs, and synthetic control methods.' },
            { q: 'Explain the difference between correlation and causation to a non-technical stakeholder, using a real product example.', hint: 'Use a concrete scenario. Show you can translate complex concepts.' },
          ],
          Staff: [
            { q: 'Your experimentation platform shows that 80% of experiments are underpowered. How do you fix this organizationally and technically?', hint: 'Think about variance reduction, metric sensitivity, MDE education, and cultural factors.' },
            { q: 'A team wants to measure the long-term effect of a feature that only shows short-term metric movement in experiments. Design an approach.', hint: 'Consider holdback experiments, surrogate metrics, and causal chain modeling.' },
          ],
        },
      },
    },
  },
  'software-engineering': {
    label: 'Software Engineering',
    icon: '\u{1F4BB}',
    levels: ['Senior', 'Staff', 'Principal'],
    rounds: {
      behavioral: {
        label: 'Behavioral & Leadership',
        icon: '\u{1F3AF}',
        timeGuide: '2-4 min per answer',
        description: 'Stories about technical leadership, conflict resolution, and impact',
        rubric: ['Structure (STAR)', 'Technical depth', 'Leadership signal', 'Self-awareness'],
        questions: {
          Senior: [
            { q: 'Tell me about a time you had to make a significant technical decision with limited information.', hint: 'Show your decision-making framework and how you managed risk.' },
            { q: 'Describe a time you improved the development process or culture on your team.', hint: 'Focus on identifying the problem, driving change, and measuring results.' },
          ],
          Staff: [
            { q: 'Tell me about a time you had to drive alignment across multiple engineering teams on a technical approach.', hint: 'Show organizational influence beyond your direct team.' },
            { q: 'Describe a technical investment you championed that had significant long-term impact.', hint: 'Demonstrate strategic thinking and ability to sell a technical vision.' },
          ],
        },
      },
      'system-design': {
        label: 'System Design',
        icon: '\u{1F3D7}\uFE0F',
        timeGuide: '35-45 min end-to-end',
        description: 'Design scalable systems with clear requirements, tradeoffs, and architecture',
        rubric: ['Requirements gathering', 'High-level architecture', 'Deep dive capability', 'Scalability & tradeoffs'],
        questions: {
          Senior: [
            { q: 'Design a URL shortening service like bit.ly.', hint: 'Cover API design, storage, redirection, analytics, and scale considerations.' },
            { q: 'Design a real-time collaborative document editor.', hint: 'Think about conflict resolution (OT/CRDT), websockets, persistence, and offline support.' },
          ],
          Staff: [
            { q: 'Design the architecture for a multi-region deployment of a latency-sensitive application.', hint: 'Consider data replication, consistency models, failover, and cost tradeoffs.' },
            { q: 'Design an event-driven architecture for a large e-commerce platform.', hint: 'Cover event sourcing, schema evolution, exactly-once processing, and observability.' },
          ],
        },
      },
      coding: {
        label: 'Coding & Algorithms',
        icon: '\u{2328}\uFE0F',
        timeGuide: '30-45 min per problem',
        description: 'Solve algorithmic problems with clean, efficient code',
        rubric: ['Problem decomposition', 'Code quality', 'Time/space complexity', 'Edge cases & testing'],
        questions: {
          Senior: [
            { q: 'Given a stream of events with timestamps and event types, design and implement a sliding window counter that can answer \'how many events of type X occurred in the last N minutes\' efficiently.', hint: 'Think about data structure choices and the tradeoff between memory and query speed.' },
          ],
          Staff: [
            { q: 'Design and implement a rate limiter that supports multiple rate limiting strategies (fixed window, sliding window, token bucket) behind a common interface.', hint: 'Focus on clean abstraction, extensibility, and correctness under concurrency.' },
          ],
        },
      },
    },
  },
  'product-management': {
    label: 'Product Management',
    icon: '\u{1F680}',
    levels: ['Senior', 'Staff/GPM'],
    rounds: {
      behavioral: {
        label: 'Behavioral & Leadership',
        icon: '\u{1F3AF}',
        timeGuide: '2-4 min per answer',
        description: 'Stories demonstrating product leadership and stakeholder management',
        rubric: ['Structure', 'Strategic thinking', 'User empathy', 'Cross-functional leadership'],
        questions: {
          Senior: [
            { q: 'Tell me about a time you had to kill a feature or project that the team was excited about.', hint: 'Show data-driven decision making and empathetic leadership.' },
            { q: 'Describe a time you had to ship a product with significant tradeoffs. How did you decide what to cut?', hint: 'Demonstrate prioritization frameworks and stakeholder communication.' },
          ],
          'Staff/GPM': [
            { q: 'Tell me about a time you set the product strategy for a new area or significant pivot.', hint: 'Show market analysis, vision-setting, and organizational alignment.' },
          ],
        },
      },
      'product-design': {
        label: 'Product Sense & Design',
        icon: '\u{1F3A8}',
        timeGuide: '15-25 min structured walkthrough',
        description: 'Design products, define strategy, and reason about user needs',
        rubric: ['User understanding', 'Creativity', 'Structured thinking', 'Metric awareness'],
        questions: {
          Senior: [
            { q: 'Design a feature to help remote teams build stronger relationships.', hint: 'Start with user research, define the problem space, then iterate on solutions.' },
          ],
          'Staff/GPM': [
            { q: 'You\'re the PM for Google Maps. The CEO asks you to present a 3-year product strategy. Walk me through it.', hint: 'Think about market trends, competitive landscape, and platform evolution.' },
          ],
        },
      },
    },
  },
};

/**
 * Get questions for a specific field/round/level combination.
 */
export function getQuestions(fieldKey, roundKey, level) {
  return FIELDS[fieldKey]?.rounds?.[roundKey]?.questions?.[level] || [];
}

/**
 * Get a random question from a specific configuration.
 */
export function getRandomQuestion(fieldKey, roundKey, level) {
  const questions = getQuestions(fieldKey, roundKey, level);
  if (!questions.length) return null;
  return questions[Math.floor(Math.random() * questions.length)];
}

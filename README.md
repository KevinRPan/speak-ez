# Speak-EZ

**Track your speaking practice like you track your workouts.**

Speak-EZ is a communication training app that applies the proven workout-logging model to speaking skills. Log drills, track scores, hit personal records, and build consistency through streaks — all with AI-powered feedback.

## The Idea

HEVY made logging workouts simple and satisfying. Speak-EZ does the same for communication:

- **Pick a drill** — impromptu prompts, interview questions, presentation scenarios, advocacy practice
- **Do the rep** — record yourself speaking, get live transcription
- **Log it** — duration, filler words, self-ratings on structure/clarity/confidence
- **Get feedback** — AI analyzes your response for structure, conciseness, and framework usage
- **Track progress** — personal records, streak counter, session history, score trends

## Tech Stack

- **Frontend:** Rebuilding (currently vanilla HTML/CSS/JS)
- **Hosting:** Cloudflare Pages
- **API:** Cloudflare Pages Functions (serverless edge)
- **AI:** Google Gemini API (proxied server-side)
- **Storage:** LocalStorage (migrating to Cloudflare D1/KV for sync)
- **PWA:** Installable on mobile

## Getting Started

### Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Gemini API key

### Local Development

```bash
# Clone the repo
git clone https://github.com/KevinRPan/speak-ez.git
cd speak-ez

# Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your GEMINI_API_KEY

# Run locally
npx wrangler pages dev .
# App available at http://localhost:8788
```

### Deployment

The app auto-deploys to Cloudflare Pages on push. For manual deployment:

```bash
npx wrangler pages deploy . --project-name=speak-sharp
```

Set `GEMINI_API_KEY` in your Cloudflare Pages dashboard under Settings > Environment Variables.

## Project Structure

```
speak-ez/
├── index.html              # Legacy monolith (being rebuilt)
├── functions/
│   └── api/
│       └── feedback.js     # Gemini API proxy
├── manifest.json           # PWA config
├── wrangler.toml           # Cloudflare Pages config
├── .dev.vars.example       # Env var template
├── CLAUDE.md               # AI assistant context
├── ARCHITECTURE.md         # Technical design
├── ROADMAP.md              # Vision and milestones
└── agents.md               # Agent workflow docs
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and design decisions |
| [ROADMAP.md](ROADMAP.md) | Product vision, phases, and milestones |
| [CLAUDE.md](CLAUDE.md) | Context for AI coding assistants |
| [agents.md](agents.md) | Agent roles and development workflows |

## License

Private — not open source.

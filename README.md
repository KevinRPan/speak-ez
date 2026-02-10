# Speak-EZ

**A workout app for your communication skills.**

Speak-EZ is HEVY, but for speaking. Track your speaking exercises, follow structured routines, record your sets, get AI feedback, and watch yourself improve over time.

## The Idea

Most people want to be better communicators but have no structured way to practice. Gyms have programs, sets, reps, and progress tracking — why doesn't speaking practice?

Speak-EZ brings the **workout metaphor** to communication training:

- **Exercises** — Individual speaking drills (impromptu topics, storytelling, vocal warm-ups, pitch practice)
- **Workouts** — A session of exercises you do in one sitting
- **Routines** — Saved workout templates you repeat regularly
- **Sets & Reps** — Each attempt at an exercise is a set; record audio/video to review
- **Progress Tracking** — See your history, streaks, personal records, and trends
- **AI Coaching** — Get feedback on clarity, filler words, pacing, structure, and delivery

## Who It's For

- People preparing for presentations, interviews, or public speaking
- Professionals who want to communicate more clearly and confidently
- Anyone who treats self-improvement like training — with reps, consistency, and measurable progress

## Current Status

**Early development / rework.** The original prototype was a single-file PWA with inline exercises and AI feedback. We're rebuilding with a proper architecture to support the full workout-tracker vision.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Hosting | Cloudflare Pages | Free, global CDN, edge functions, auto-deploys from Git |
| API | Cloudflare Pages Functions | Serverless at the edge, file-based routing |
| AI | Gemini API (via edge proxy) | Feedback on speaking exercises, kept server-side |
| App | PWA | Installable, works offline, mobile-first |

## Getting Started

```bash
# Clone
git clone https://github.com/KevinRPan/speak-ez.git
cd speak-ez

# Set up local env
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add your GEMINI_API_KEY

# Run locally
npx wrangler pages dev .
# Open http://localhost:8788
```

## Deployment

Hosted on Cloudflare Pages. See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

**Quick deploy:**
```bash
npx wrangler pages deploy . --project-name=speak-sharp
```

Set `GEMINI_API_KEY` in Cloudflare dashboard → Workers & Pages → Settings → Environment variables.

## Project Docs

| File | Purpose |
|------|---------|
| [CLAUDE.md](./CLAUDE.md) | Project context for AI coding agents |
| [AGENTS.md](./AGENTS.md) | Guidelines for AI agents working on this repo |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design, data models, and planned architecture |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Cloudflare deployment guide |

## License

Private — not yet open source.

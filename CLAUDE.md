# CLAUDE.md — Speak-EZ

## What is this project?

Speak-EZ is a **communication training app** — think HEVY (the workout tracker) but for improving how you speak, present, and communicate. Users build speaking skills through structured exercises, track progress over time, and level up their communication abilities.

## Current State

The project is in an **early rework phase**. The prior prototype was a single-file PWA for AI-powered speaking feedback. We are rebuilding from scratch with a proper app architecture. All legacy code (the monolithic `index.html`) is expected to be replaced.

## Hosting & Deployment

- **Platform:** Cloudflare Pages + Functions (Edge)
- **Domain/Project:** `speak-sharp` on Cloudflare (name may change)
- **Secrets:** `GEMINI_API_KEY` set via Cloudflare dashboard, never in code
- **Local dev:** `wrangler pages dev .` on port 8788
- **Local secrets:** `.dev.vars` file (gitignored)

## Tech Decisions (Current / Planned)

- Cloudflare Pages for hosting (free tier, global CDN, edge functions)
- Cloudflare Pages Functions for serverless API (file-based routing under `/functions`)
- PWA-capable (manifest.json, standalone display)
- AI feedback via Gemini API (proxied through edge function to keep key secret)
- No build step yet — may introduce one as complexity grows

## Project Structure

```
speak-ez/
├── CLAUDE.md              # You are here — project context for AI agents
├── AGENTS.md              # Guidelines for AI agents working on this repo
├── README.md              # Project overview, setup, and vision
├── ARCHITECTURE.md        # Technical design and data models
├── index.html             # Legacy single-file app (to be replaced)
├── manifest.json          # PWA manifest
├── wrangler.toml          # Cloudflare Pages config
├── .dev.vars.example      # Template for local env vars
├── .gitignore
├── functions/
│   └── api/
│       └── feedback.js    # Gemini API proxy edge function
└── DEPLOYMENT.md          # Cloudflare deployment guide
```

## Conventions

- **No premature abstraction** — keep things simple until complexity demands structure
- **Edge-first** — leverage Cloudflare's edge runtime; avoid heavy server dependencies
- **Mobile-first UI** — this is a phone-in-hand app like HEVY
- **Progressive enhancement** — core features work without JS frameworks; add tooling only when needed
- **Secrets stay server-side** — API keys only in Cloudflare env vars or `.dev.vars`

## Key Commands

```bash
# Local development
wrangler pages dev .

# Deploy
wrangler pages deploy . --project-name=speak-sharp

# Create local secrets file
cp .dev.vars.example .dev.vars
# Then edit .dev.vars with your actual API key
```

## Domain Concepts

| Concept | Description |
|---------|-------------|
| **Exercise** | A single speaking drill (e.g., "1-min impromptu on a random topic") |
| **Workout** | A collection of exercises done in one session |
| **Routine** | A saved workout template the user can repeat |
| **Set** | One attempt/rep of an exercise (recorded audio/video) |
| **PR (Personal Record)** | Best performance on an exercise (by score, duration, etc.) |
| **Program** | A multi-week training plan with scheduled workouts |

## Important Notes

- The app name in code is currently "Speak Sharp" / `speak-sharp` in some places and "speak-ez" in the repo — this will be unified
- The single `index.html` is ~160KB of inline everything — it will be decomposed
- No package.json or build pipeline yet — introducing one is a near-term task

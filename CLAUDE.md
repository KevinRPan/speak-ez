# CLAUDE.md

Project context for AI assistants working on Speak-EZ.

## What is Speak-EZ?

A communication training app — think **HEVY, but for speaking skills**. Users log practice sessions, track progress, hit PRs on clarity/confidence/structure scores, and build streaks. The core loop is: pick a drill, do the rep, log it, get feedback, improve.

## Current State

The app exists as a monolithic single-file (`index.html`, ~3500 lines) called "Speak Sharp" with vanilla HTML/CSS/JS. It has a 12-week curriculum, audio recording, speech-to-text, AI feedback via Gemini, gamification (XP, levels, streaks, achievements), and localStorage persistence.

**We are rebuilding from the ground up.** The existing code is reference material, not the foundation. The new architecture should be modular, testable, and designed around the HEVY-style workout logging paradigm.

## Hosting & Infrastructure

- **Hosted on Cloudflare Pages** with Pages Functions for serverless API
- **AI feedback** proxied through `/api/feedback` → Google Gemini API
- **No build step currently** — this will change with the rebuild
- **PWA-capable** via manifest.json

## Key Files

| File | Role |
|------|------|
| `index.html` | Legacy monolith (reference only) |
| `functions/api/feedback.js` | Gemini API proxy (keep this pattern) |
| `wrangler.toml` | Cloudflare Pages config |
| `manifest.json` | PWA manifest |
| `.dev.vars` | Local env secrets (gitignored) |

## Development

```bash
# Local dev (requires wrangler)
npx wrangler pages dev .

# Deploy (auto-deploys on git push if connected)
npx wrangler pages deploy . --project-name=speak-sharp
```

Environment variables needed:
- `GEMINI_API_KEY` — set in Cloudflare dashboard or `.dev.vars` locally

## Conventions

- **Keep it simple.** Don't over-abstract. Three similar lines > premature abstraction.
- **Cloudflare-first.** Use Cloudflare primitives (Pages, Functions, KV, D1, Durable Objects) before reaching for external services.
- **Mobile-first design.** This is primarily a phone app used during practice.
- **Offline-capable.** Core features must work without network. Sync when online.
- **No unnecessary dependencies.** Every package added must justify its weight.

## The HEVY Model (What We're Emulating)

HEVY's core UX for workouts, translated to speaking:

| HEVY Concept | Speak-EZ Equivalent |
|---|---|
| Workout | Practice Session |
| Exercise | Drill (impromptu, interview, presentation, etc.) |
| Set/Rep | Individual attempt at a prompt |
| Weight/Reps logged | Duration, filler count, self-ratings, AI scores |
| Personal Record | Best scores per drill type |
| Routine/Template | Practice templates (warmup + core + cooldown) |
| Workout History | Session history with full transcripts & scores |
| Streak | Daily practice streak |
| Body measurements | Periodic self-assessment benchmarks |

## Testing

No tests exist yet. When we rebuild:
- Unit tests for business logic (scoring, streaks, XP calculations)
- Component tests for UI
- Integration tests for API proxy
- Use Vitest or similar lightweight runner

## Common Mistakes to Avoid

- Don't put everything in one file again
- Don't store secrets client-side — always proxy through Functions
- Don't assume SpeechRecognition API works everywhere (Chrome-only mostly)
- Don't break offline functionality when adding network features
- LocalStorage has a ~5MB limit — plan for this with recording data

# AGENTS.md — Guidelines for AI Agents

This file tells AI coding agents how to work effectively on the Speak-EZ codebase.

## Project Context

Read [CLAUDE.md](./CLAUDE.md) first for project overview, conventions, and domain concepts. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical design and data models.

## Core Principles

1. **This is a rework** — the existing `index.html` is legacy. Don't try to preserve or extend it. Build new things properly.
2. **HEVY is the UX north star** — if you're unsure how a feature should work, think "how would HEVY do this, but for speaking exercises instead of weightlifting?"
3. **Mobile-first, always** — every UI decision should start with a phone screen. Desktop is secondary.
4. **Keep it simple** — no frameworks or abstractions until the complexity demands them. A plain function is better than a class. A static file is better than a build step. Add tooling only when the pain of not having it is real.
5. **Edge-native** — we run on Cloudflare. Use their primitives (KV, D1, R2, Durable Objects) before reaching for external services.

## When Making Changes

### Do
- Read existing code before modifying it
- Keep functions small and focused
- Use the domain language from CLAUDE.md (Exercise, Workout, Routine, Set, PR, Program)
- Test on mobile viewport sizes
- Keep API keys and secrets server-side (edge functions only)
- Preserve PWA capability (offline support, installability)

### Don't
- Add npm packages without a clear reason
- Introduce a build step without discussing it first
- Create abstractions for things that are only used once
- Add TypeScript, linting, or formatting configs speculatively
- Store user data in localStorage as a permanent solution (it's fine for prototyping)
- Expose API keys to the client

## File Organization

When building new features, follow this structure:

```
speak-ez/
├── src/                    # App source (when we add a build step)
│   ├── components/         # UI components
│   ├── models/             # Data models and types
│   ├── services/           # Business logic, API clients
│   └── utils/              # Shared utilities
├── functions/              # Cloudflare Pages Functions (API routes)
│   └── api/
│       ├── feedback.js     # AI feedback endpoint
│       ├── workouts.js     # Workout CRUD (future)
│       └── exercises.js    # Exercise library (future)
├── public/                 # Static assets (when we add a build step)
│   ├── icons/
│   └── sounds/
└── ...docs and config
```

Until a build step is introduced, app code lives directly in the root or in clearly named files.

## Data & Storage Strategy

For now, client-side storage (localStorage / IndexedDB) is acceptable for prototyping. The planned migration path is:

1. **Prototype:** localStorage for workout history, exercise data
2. **Next:** Cloudflare D1 (SQLite at the edge) for persistent storage
3. **Later:** User auth + synced data across devices

See [ARCHITECTURE.md](./ARCHITECTURE.md) for data models.

## Working with the AI Feedback System

The Gemini API is proxied through `functions/api/feedback.js`. When modifying AI interactions:

- Keep prompts in the edge function, not the client
- Return structured feedback (scores, categories, actionable tips)
- Consider latency — users are waiting after a speaking exercise, so keep responses focused

## Deployment Notes

- Cloudflare Pages auto-deploys from the `main` branch
- Edge functions live in `/functions` — the file path IS the URL route
- Environment variables are set in Cloudflare dashboard, not in code
- Local dev uses `wrangler pages dev .` with `.dev.vars` for secrets

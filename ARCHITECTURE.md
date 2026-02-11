# Architecture

Technical architecture for the Speak-EZ rebuild.

## Design Principles

1. **HEVY-style UX** — The app should feel like logging a workout. Start session, do drills, log results, done. No tutorials blocking the flow.
2. **Offline-first** — Record, transcribe, and self-rate without network. AI feedback syncs when online.
3. **Mobile-first** — Primary use case is practicing on your phone. Desktop is secondary.
4. **Cloudflare-native** — Use the platform we're on. Pages, Functions, KV, D1 — before reaching for anything external.
5. **Progressive complexity** — Simple to start (pick a prompt, record, rate yourself). Power features unlock as you use the app.

## System Overview

```
┌─────────────────────────────────────────────┐
│                   Client                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Practice │ │ History  │ │   Profile/   │ │
│  │  Screen  │ │  Feed    │ │   Stats      │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │             │              │         │
│  ┌────┴─────────────┴──────────────┴───────┐ │
│  │           Local State / Cache            │ │
│  │        (IndexedDB + localStorage)        │ │
│  └────────────────┬────────────────────────┘ │
└───────────────────┼──────────────────────────┘
                    │ sync
┌───────────────────┼──────────────────────────┐
│            Cloudflare Edge                    │
│  ┌────────────────┴────────────────────────┐ │
│  │         Pages Functions API              │ │
│  │  /api/feedback  → Gemini AI             │ │
│  │  /api/sync      → D1 database           │ │
│  │  /api/auth      → Auth (future)         │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ D1 (SQL) │  │ KV Store │  │  R2 Bucket │ │
│  │ sessions │  │ settings │  │  audio      │ │
│  │ users    │  │ cache    │  │  recordings │ │
│  └──────────┘  └──────────┘  └────────────┘ │
└───────────────────────────────────────────────┘
```

## Hosting & Infrastructure

### Current State

| Component | What's in place | Notes |
|-----------|----------------|-------|
| **Static hosting** | Cloudflare Pages (`speak-ez.pages.dev`) | Serves HTML/CSS/JS from repo root, no build step |
| **API** | 1 Pages Function: `functions/api/feedback.js` | Proxies to Gemini, keeps API key server-side |
| **Database** | None — `localStorage` only | ~5MB limit, single device, no sync |
| **Auth** | None | All data is anonymous and local |
| **Domain** | Cloudflare-assigned `*.pages.dev` | Custom domain can be added via Cloudflare DNS |
| **CI/CD** | Git push auto-deploys to Cloudflare Pages | No build pipeline yet |

### Do We Need Separate Frontend & Backend?

**Not separate services** — Cloudflare Pages bundles both:

- **Frontend:** Static files served from the repo root (`index.html`, `js/`, `css/`)
- **Backend:** Pages Functions in `functions/` directory — deployed as serverless workers at the edge

This is the right model for the app's scale. No need for a separate API server, container, or additional hosting provider. Everything lives in one repo, one deploy.

### Services Needed (Phased)

```
Phase 1 (Now)          Phase 2 (Accounts)       Phase 3 (Audio backup)
─────────────────      ──────────────────────    ─────────────────────
Cloudflare Pages       + Cloudflare D1           + Cloudflare R2
  └─ Static assets       └─ User/session data      └─ Audio recordings
  └─ Pages Functions   + Cloudflare KV
      └─ /api/feedback   └─ Settings cache
localStorage           + Auth (see below)
  └─ All user data       └─ Magic link or
                            Cloudflare Access
```

### Auth Options (When Ready)

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Cloudflare Access** | Zero code, identity via Google/GitHub/email OTP | Less customizable, requires Cloudflare Zero Trust setup | Good for beta/internal |
| **Magic link (custom)** | Full control, simple UX (enter email, click link) | Need transactional email (Resend/Mailgun free tier), more code to write | Best for public launch |
| **Passkeys / WebAuthn** | Passwordless, modern, phishing-resistant | Browser support still uneven, complex implementation | Future consideration |
| **Firebase Auth / Auth0** | Battle-tested, many providers | External dependency, doesn't align with Cloudflare-first | Avoid unless necessary |

**Recommendation:** Start with **magic link auth** via Pages Functions. Flow:

```
1. User enters email → POST /api/auth/login
2. Function generates token, stores in D1, sends email via Resend
3. User clicks link → GET /api/auth/verify?token=xxx
4. Function validates, sets HttpOnly cookie (or returns JWT)
5. Subsequent API calls include cookie/token for auth
```

### Cloudflare Services Summary

| Service | Free Tier | When to Add | Purpose |
|---------|-----------|-------------|---------|
| **Pages** | Unlimited sites, 500 builds/mo | Now (already active) | Static hosting + Functions |
| **D1** | 5M reads/day, 100K writes/day, 5GB storage | Phase 5 (accounts) | User data, sessions, PRs |
| **KV** | 100K reads/day, 1K writes/day | Phase 5 (accounts) | Fast cached reads (settings, stats) |
| **R2** | 10GB storage, 10M reads/mo | Phase 5+ (optional) | Audio recording cloud backup |
| **Workers AI** | 10K neurons/day | Optional | Whisper transcription fallback |
| **Queues** | 1M operations/mo | Optional | Async AI feedback processing |

All free tiers are generous for an early-stage app. No payment required until significant scale.

### Why Cloudflare Over Alternatives

| Alternative | Why Not |
|-------------|---------|
| **Vercel/Netlify** | Good for frontend, but backend would need a separate service for D1/KV/R2. Cloudflare is all-in-one. |
| **AWS (Amplify, Lambda, etc.)** | Overkill complexity. Dozens of services to configure. Expensive at low scale. |
| **Firebase** | Could work (Firestore, Auth, Storage maps well) but locks into Google ecosystem and conflicts with Cloudflare-first principle. |
| **Supabase** | Strong Postgres + Auth offering, but adds an external dependency and a second bill. |
| **Railway/Fly.io** | Container-based hosting is unnecessary — this app has no long-running processes. |

**Cloudflare's edge:** Everything runs at the edge (300+ PoPs globally), the free tier covers early growth, and all services (Pages, Functions, D1, KV, R2) are integrated in one platform with one CLI (`wrangler`).

### Infrastructure TODO

- [ ] Verify Cloudflare Pages project is connected to this GitHub repo for auto-deploy
- [ ] Confirm `GEMINI_API_KEY` is set in Cloudflare Pages dashboard (production + preview)
- [ ] Add custom domain when ready (Cloudflare DNS → Pages)
- [ ] Create D1 database when starting Phase 5: `npx wrangler d1 create speak-ez-db`
- [ ] Create KV namespace when starting Phase 5: `npx wrangler kv namespace create SETTINGS_CACHE`
- [ ] Create R2 bucket if adding audio backup: `npx wrangler r2 bucket create speak-ez-audio`
- [ ] Set up transactional email (Resend free tier) when adding auth
- [ ] Add `wrangler.toml` bindings for D1/KV/R2 as each service is provisioned

## Data Model

### Core Entities

```
User
├── id
├── created_at
├── settings (JSON)
└── stats_cache (JSON: xp, level, streak, longest_streak)

DrillType (static/config)
├── id (e.g., "impromptu", "interview", "presentation", "advocacy")
├── name
├── description
└── default_prompts[]

Session
├── id
├── user_id
├── started_at
├── finished_at
├── type ("quick" | "routine")
└── routine_template_id (nullable)

SessionDrill (one per drill attempt within a session)
├── id
├── session_id
├── drill_type_id
├── prompt_text
├── duration_seconds
├── transcript (text)
├── filler_counts (JSON: {um, uh, like, so, you_know})
├── self_ratings (JSON: {structure, clarity, confidence, vocal_variety})
├── ai_feedback (JSON, nullable — backfilled async)
├── ai_scores (JSON, nullable: {structure, clarity, conciseness})
├── notes (text)
└── created_at

PersonalRecord
├── user_id
├── drill_type_id
├── metric ("ai_structure" | "ai_clarity" | "duration" | "zero_fillers" | ...)
├── value
├── session_drill_id (FK to the drill that set the record)
└── achieved_at

RoutineTemplate
├── id
├── user_id
├── name (e.g., "Morning Warmup", "Interview Prep")
├── drills (JSON: [{drill_type_id, prompt_category, duration_target}])
└── created_at
```

### HEVY Parallel

| HEVY | Speak-EZ | Notes |
|------|----------|-------|
| Workout | Session | A practice session containing multiple drills |
| Exercise | DrillType | Category of speaking exercise |
| Set | SessionDrill | One attempt at one prompt |
| Weight x Reps | Duration, scores, filler count | The measurables |
| PR | PersonalRecord | Best performance per metric per drill type |
| Routine | RoutineTemplate | Saved session templates |

## Storage Strategy

### Phase 1: Local Only (Current)
- **LocalStorage** for settings and lightweight state
- **IndexedDB** for sessions, transcripts, audio blobs
- Export/import as JSON backup

### Phase 2: Cloud Sync
- **Cloudflare D1** (SQLite at edge) for structured data
- **Cloudflare R2** for audio recordings (optional)
- **Cloudflare KV** for fast reads (settings, cached stats)
- Conflict resolution: last-write-wins with device timestamps

## API Routes

All under `functions/api/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/feedback` | POST | Get AI feedback on a transcript (exists today) |
| `/api/sync` | POST | Push local sessions to cloud (future) |
| `/api/sync` | GET | Pull sessions from cloud (future) |
| `/api/prompts` | GET | Fetch drill prompts (future, currently hardcoded) |

## Frontend Architecture (Rebuild)

**Decision needed:** Framework vs. vanilla. Options:

1. **Vanilla + Web Components** — No build step, Cloudflare-friendly, but harder to manage state
2. **Preact/HTM** — React-like DX at 3KB, no build step possible with HTM
3. **SvelteKit** — Great DX, small bundles, but adds build complexity
4. **React/Next** — Familiar but heavy for this use case

Recommendation: **Start with vanilla JS organized into ES modules**, add a framework only if complexity demands it. The app has few screens and straightforward state.

### Screen Map

```
Tab Bar: [Practice] [History] [Stats] [Library]

Practice (home)
├── Start Quick Drill → pick type → record → rate → done
├── Start Routine → load template → drill 1 → drill 2 → ... → done
└── Today's summary (drills done, streak status)

History
├── Session list (reverse chronological)
├── Session detail → list of drills with scores
└── Drill detail → transcript, audio, AI feedback, self-ratings

Stats
├── Current streak + longest streak
├── Total sessions / drills
├── XP + level
├── PR board (best scores by drill type)
├── Trends (weekly chart of avg scores)
└── Achievements

Library
├── Drill types with descriptions
├── Speaking frameworks (PREP, STAR, WSW, PSB)
├── Warmup exercises
└── Prompt browser (by category)
```

## Audio & Transcription

- **MediaRecorder API** for audio capture (webm/opus)
- **Web Speech API** for live transcription (Chrome/Edge — fallback to manual transcript entry)
- **Whisper API** as future fallback for transcription (server-side, via Cloudflare Workers AI or external)
- Store audio as blobs in IndexedDB locally, optionally sync to R2

## AI Feedback Pipeline

```
User finishes drill
    → transcript + drill context sent to /api/feedback
    → Pages Function builds Gemini prompt
    → Gemini returns structured JSON:
        { scores: {structure, clarity, conciseness},
          strengths: [...],
          improvements: [...],
          filler_analysis: {...},
          focus_item: "..." }
    → Response stored with SessionDrill
    → UI displays feedback card
```

Feedback is **non-blocking** — user can finish a session and get feedback async. This keeps the app fast and offline-friendly.

## Gamification

Carried over and refined from the existing app:

| Mechanic | Details |
|----------|---------|
| **XP** | Earned per drill (30-100 based on type). Bonus for daily goal, streaks |
| **Levels** | 13 levels with exponential XP thresholds |
| **Streaks** | Consecutive days with at least 1 drill completed |
| **PRs** | Automatically tracked per drill type per metric |
| **Achievements** | Milestone badges (first drill, 7-day streak, 100 drills, etc.) |

## Security

- API keys never sent to client — always proxied through Pages Functions
- No auth in Phase 1 (local-only data)
- Phase 2 auth options: Cloudflare Access, or simple email magic link via Workers
- Input sanitization on all API endpoints
- CORS configured per environment

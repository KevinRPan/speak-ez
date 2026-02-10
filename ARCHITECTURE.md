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

# ARCHITECTURE.md — Technical Design

## Vision

Speak-EZ = HEVY for communication skills. The architecture should support:

- Browsing and selecting speaking exercises
- Running a timed workout session with multiple exercises
- Recording audio/video of each set
- Getting AI feedback on recordings
- Tracking history, streaks, and personal records
- Creating and sharing custom routines

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (PWA)                            │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ Exercise  │  │ Workout  │  │ History  │  │   Profile    │  │
│   │ Library   │  │ Session  │  │ & Stats  │  │  & Settings  │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
│         │              │             │              │           │
│         └──────────────┴─────────────┴──────────────┘           │
│                          │                                      │
│                   [Local Storage / IndexedDB]                   │
│                   (offline-first cache)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ fetch()
┌─────────────────────────┴───────────────────────────────────────┐
│                 Cloudflare Pages Functions (Edge)                │
│                                                                 │
│   /api/feedback     → AI analysis of recordings                 │
│   /api/exercises    → Exercise library CRUD                     │
│   /api/workouts     → Workout history & logging                 │
│   /api/routines     → Routine templates                         │
│   /api/auth         → Authentication (future)                   │
│                                                                 │
│         ┌────────────┐  ┌─────┐  ┌─────┐  ┌──────┐            │
│         │ Gemini API │  │ D1  │  │ KV  │  │  R2  │            │
│         │ (AI)       │  │(SQL)│  │     │  │(Blob)│            │
│         └────────────┘  └─────┘  └─────┘  └──────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### Exercise

An exercise is a type of speaking drill. These are the "movements" in the gym analogy.

```
Exercise {
  id: string
  name: string                    // "1-Minute Impromptu"
  description: string             // What to do and why
  category: ExerciseCategory      // warmup | drill | challenge | cooldown
  skillTargets: SkillTag[]        // clarity | pacing | structure | storytelling | vocal_variety | filler_words | confidence | persuasion
  defaultDurationSec: number      // Suggested time per set
  instructions: string            // Step-by-step guide
  difficulty: 1 | 2 | 3           // Beginner / Intermediate / Advanced
  promptGenerator?: string        // How to generate random prompts for this exercise
  isCustom: boolean               // User-created vs built-in
}
```

### Workout

A completed workout session. Analogous to a logged workout in HEVY.

```
Workout {
  id: string
  startedAt: timestamp
  finishedAt: timestamp
  routineId?: string              // If based on a routine template
  title: string                   // "Morning Warm-up" or auto-generated
  sets: WorkoutSet[]
  notes?: string
}
```

### WorkoutSet

One attempt at an exercise within a workout.

```
WorkoutSet {
  id: string
  exerciseId: string
  order: number                   // Position in workout
  durationSec: number             // Actual time spent
  recordingUrl?: string           // Audio/video blob URL or R2 path
  feedback?: AIFeedback           // AI analysis results
  selfRating?: 1-5                // User's own assessment
  notes?: string
}
```

### Routine

A reusable workout template. Like a saved workout plan in HEVY.

```
Routine {
  id: string
  name: string                    // "Daily Speaking Warm-up"
  description?: string
  exercises: RoutineExercise[]    // Ordered list
  estimatedMinutes: number
  isPublic: boolean               // Shareable with others
  createdBy: string
}

RoutineExercise {
  exerciseId: string
  sets: number                    // How many sets to do
  targetDurationSec: number       // Per set
  restSec?: number                // Rest between sets
  notes?: string
}
```

### AIFeedback

Structured output from the AI coaching system.

```
AIFeedback {
  overallScore: number            // 1-100
  scores: {
    clarity: number
    pacing: number
    structure: number
    fillerWords: number           // Lower is better (count)
    vocalVariety: number
    confidence: number
  }
  strengths: string[]             // "Good use of pauses"
  improvements: string[]          // "Try varying your pitch more"
  summary: string                 // 2-3 sentence overview
}
```

## Key Screens (HEVY-Inspired)

| Screen | HEVY Equivalent | Purpose |
|--------|----------------|---------|
| **Home / Feed** | Workout feed | Recent workouts, streaks, quick-start |
| **Exercise Library** | Exercise list | Browse all exercises by category/skill |
| **Start Workout** | Active workout | Timer, current exercise, record button |
| **Workout Summary** | Post-workout | Review sets, AI feedback, self-ratings |
| **History** | History tab | Calendar view, past workouts, trends |
| **Routines** | Routines tab | Saved templates, create new |
| **Profile** | Profile tab | Stats, PRs, streaks, settings |
| **Exercise Detail** | Exercise detail | Description, history, personal bests |

## Cloudflare Services Mapping

| Need | Cloudflare Service | Notes |
|------|-------------------|-------|
| Static hosting | Pages | HTML/CSS/JS on CDN |
| API routes | Pages Functions | Serverless edge functions |
| Structured data | D1 | SQLite at the edge — exercises, workouts, users |
| Session/cache | KV | Fast key-value for sessions, feature flags |
| Media storage | R2 | Audio/video recordings (S3-compatible) |
| Auth | (TBD) | Cloudflare Access, or custom JWT |

## Migration Path

### Phase 1: Rebuild Core (Current)
- [ ] Set up proper project structure (package.json, build if needed)
- [ ] Exercise library UI (browse, search, filter)
- [ ] Start a workout, run through exercises with timer
- [ ] Record audio for each set
- [ ] Basic AI feedback via existing Gemini proxy
- [ ] localStorage for all data

### Phase 2: Persistence & Polish
- [ ] Introduce Cloudflare D1 for server-side storage
- [ ] Workout history and calendar view
- [ ] Personal records and streak tracking
- [ ] Routine creation and management
- [ ] Better AI feedback (structured scores, trends)

### Phase 3: Social & Growth
- [ ] User authentication
- [ ] Cloud sync across devices
- [ ] Share routines with others
- [ ] R2 for audio/video storage
- [ ] Leaderboards or community features

## Open Questions

- **Framework?** Stay vanilla JS, or adopt something like Preact/Svelte for components? Decision deferred until Phase 1 complexity is clear.
- **Naming?** "Speak Sharp" vs "Speak-EZ" — needs to be unified.
- **Monetization?** Free tier vs premium exercises/AI feedback — not urgent but worth considering in data model.
- **Video?** Audio recording is simpler and smaller; video adds value for body language feedback but increases storage/complexity.

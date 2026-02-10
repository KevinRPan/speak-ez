# Roadmap

Product vision and milestones for the Speak-EZ rebuild.

## Vision

**Speak-EZ is the HEVY of communication training.** Users open the app, pick a drill (or follow a routine), practice speaking, log their results, and track improvement over time. AI feedback makes every rep count. Streaks and PRs keep them coming back.

The goal is not a course or curriculum — it's a **training tool**. Like HEVY doesn't tell you which workout program to follow, Speak-EZ gives you the tools to practice however you want, with enough structure to make progress visible.

## Phase 0: Foundation (Current)

**Goal:** Documentation, architecture decisions, project scaffolding.

- [x] Document project vision and architecture
- [x] Define data model (HEVY-parallel)
- [x] Map screen structure
- [ ] Choose frontend approach (vanilla modules vs. framework)
- [ ] Set up project scaffolding (folder structure, build tooling if needed)
- [ ] Set up testing infrastructure
- [ ] Create component/module skeleton

## Phase 1: Core Loop (MVP)

**Goal:** A user can open the app, do a drill, and see their history. This is the "log a workout" equivalent.

### Practice Screen
- [ ] Quick drill flow: pick type → get prompt → record → transcribe → self-rate → save
- [ ] Timer display during recording
- [ ] Filler word counter (manual tap buttons)
- [ ] Self-rating inputs (structure, clarity, confidence — 1-5 scale)
- [ ] Notes field

### History Feed
- [ ] Reverse-chronological list of sessions
- [ ] Session detail view showing all drills
- [ ] Drill detail with transcript, ratings, notes

### Data Layer
- [ ] IndexedDB storage for sessions and drills
- [ ] LocalStorage for lightweight state (settings, streak cache)
- [ ] Export/import JSON backup

### Audio
- [ ] MediaRecorder integration for audio capture
- [ ] Speech-to-text via Web Speech API
- [ ] Audio playback on drill detail

### AI Feedback
- [ ] Keep existing Gemini proxy (`/api/feedback`)
- [ ] Non-blocking feedback — request after drill, display when ready
- [ ] Feedback card on drill detail (scores, strengths, improvements)

## Phase 2: Gamification & Engagement

**Goal:** Make daily practice sticky. This is the "streaks and PRs" layer.

### Streaks
- [ ] Daily streak tracking (1+ drill = active day)
- [ ] Streak display on home screen
- [ ] Streak recovery grace period (optional)

### XP & Levels
- [ ] XP earned per drill (varies by type/duration)
- [ ] Level progression with thresholds
- [ ] Level-up celebration moment

### Personal Records
- [ ] Auto-detect PRs per drill type per metric
- [ ] PR notification/celebration when achieved
- [ ] PR board in stats screen

### Achievements
- [ ] Milestone badges (first drill, streaks, volume milestones)
- [ ] Achievement display in profile/stats

## Phase 3: Routines & Structure

**Goal:** Let users build and follow practice routines, like HEVY workout templates.

### Routine Templates
- [ ] Create routine: name + ordered list of drill types with targets
- [ ] Pre-built templates (Morning Warmup, Interview Prep, Presentation Practice)
- [ ] Start routine → guided flow through each drill
- [ ] Routine history — track which routines done when

### Smart Prompts
- [ ] Prompt rotation (don't repeat recent prompts)
- [ ] Difficulty progression within drill types
- [ ] Custom prompt creation
- [ ] Prompt favorites/bookmarks

## Phase 4: Stats & Insights

**Goal:** Show progress over time. Make improvement visible and motivating.

### Charts & Trends
- [ ] Weekly/monthly score averages by drill type
- [ ] Filler word trends over time
- [ ] Session volume chart (drills per week)
- [ ] Duration trends

### Benchmarks
- [ ] Periodic self-assessment checkpoints
- [ ] Before/after comparison at milestones
- [ ] "Your speaking stats" summary card (shareable?)

## Phase 5: Cloud Sync & Accounts

**Goal:** Data persists across devices. Users don't lose their history.

- [ ] Authentication (Cloudflare Access or magic link)
- [ ] Cloudflare D1 for session/drill storage
- [ ] Sync engine: local ↔ cloud with conflict resolution
- [ ] Cloudflare R2 for audio recording storage (optional)
- [ ] Cloudflare KV for fast settings/cache reads

## Phase 6: Social & Community (Stretch)

**Goal:** Optional social layer for accountability and motivation.

- [ ] Share session summaries
- [ ] Practice groups / accountability partners
- [ ] Leaderboards (opt-in)
- [ ] Coach review of recordings

---

## Non-Goals (For Now)

These are explicitly out of scope to keep focus:

- **Video recording** — audio-only keeps it simple and low-friction
- **Live coaching / real-time feedback** — async AI feedback is sufficient
- **Course/curriculum system** — this is a training tool, not a course platform
- **Monetization features** — focus on the product first
- **Multi-language support** — English only initially
- **Desktop-optimized layout** — mobile-first, desktop works but isn't primary

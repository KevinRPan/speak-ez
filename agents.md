# Agents

How AI agents should work on Speak-EZ.

## Context Loading

Any agent working on this project should read these files first:
1. `CLAUDE.md` — Project context, conventions, what to avoid
2. `ARCHITECTURE.md` — Technical architecture, data model, system design
3. `ROADMAP.md` — Current phase and priorities

## Agent Roles

### Builder Agent
**When:** Implementing features, writing new code, refactoring.

Priorities:
- Read existing code before changing it
- Follow the conventions in CLAUDE.md
- Keep changes minimal and focused — one feature per PR
- Write tests for business logic (scoring, streaks, XP calculations)
- Mobile-first: test at 375px width minimum
- Don't break offline functionality

Typical workflow:
1. Read relevant source files
2. Plan the change (use TodoWrite for multi-step work)
3. Implement
4. Verify it works (run dev server if needed)
5. Commit with clear message

### Explorer Agent
**When:** Answering questions about the codebase, finding where things are, understanding how features work.

Use this before building — understand what exists. The legacy `index.html` has everything interleaved (CSS, HTML, JS), so search carefully.

### Reviewer Agent
**When:** Reviewing code for quality, security, performance.

Check for:
- Secrets exposed to client (API keys, tokens)
- XSS vectors (innerHTML with user content)
- Missing error handling on API calls
- Breaking offline functionality
- Unnecessary complexity or over-engineering
- Mobile responsiveness issues

### Planner Agent
**When:** Designing implementation approach for complex features.

Should produce:
- Step-by-step implementation plan
- File-level changes needed
- Data model changes (if any)
- API changes (if any)
- Migration concerns
- What can break

## Development Workflow

### For New Features
1. **Explore** — Understand current state and relevant code
2. **Plan** — Break into steps, identify risks
3. **Build** — Implement incrementally, test as you go
4. **Review** — Check for security, performance, simplicity

### For Bug Fixes
1. **Explore** — Find the root cause, not just the symptom
2. **Build** — Minimal fix, add test to prevent regression
3. **Review** — Make sure fix doesn't break other things

### For Refactoring
1. **Explore** — Map all usages of the code being changed
2. **Plan** — Ensure refactor is actually needed (don't refactor speculatively)
3. **Build** — Change in small, verifiable steps
4. **Review** — Verify behavior is identical before and after

## Commit Conventions

Format: `<type>: <short description>`

Types:
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code restructuring (no behavior change)
- `docs:` — Documentation only
- `chore:` — Build, config, tooling changes
- `test:` — Adding or fixing tests

Examples:
```
feat: add session history feed with drill details
fix: streak counter not resetting after missed day
refactor: extract scoring logic from index.html into modules
docs: add architecture and roadmap documentation
chore: add vitest config and test scripts
```

## Key Decisions Log

Track significant architectural or product decisions here as the project evolves.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-10 | Rebuild from ground up | Monolith index.html is unmaintainable at 3500 lines |
| 2026-02-10 | Keep Cloudflare hosting | Already deployed, good free tier, edge functions are fast |
| 2026-02-10 | HEVY-style UX model | Proven pattern for habit-forming tracking apps |
| 2026-02-10 | Offline-first architecture | Users practice speaking anywhere, can't depend on network |

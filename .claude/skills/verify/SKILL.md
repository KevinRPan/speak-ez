---
name: verify
description: How to run and verify Speak-EZ changes end-to-end in a headless environment
---

# Verifying Speak-EZ

Speak-EZ is a no-build static app (ES modules) + one Cloudflare Pages Function (`functions/api/feedback.js`).

## Serve the app

`npx wrangler pages dev .` needs a GEMINI_API_KEY and network. For UI verification, a plain static server is enough — plus a stub for `POST /api/feedback` that logs the request body and returns a canned feedback JSON (shape: `{ feedback: { summary, transcript, scores: {clarity,structure,confidence,conciseness,filler_rate,pace}, filler_count, estimated_wpm, session_reaction, strengths, improvements, example } }`). Logging the body lets you assert what the client actually sends (e.g. `coachContext`, `interviewContext`).

## Drive it

Playwright is global at `/opt/node22/lib/node_modules/playwright/index.mjs` (import by absolute path; NODE_PATH doesn't work for ESM). Chromium: `executablePath: '/opt/pw-browsers/chromium'`. For recording flows launch with:

```
args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--no-sandbox']
```

Key selectors:
- Bottom nav: `.nav-item[data-tab="tracks"|"home"|"performance"|"scenarios"|"interview-setup"|"profile"]`
- Tracks list: `[data-track="<trackId>"]`; track detail: `[data-project="<projectId>"]` (locked levels have no data-project attr)
- Project screen: `#start-rep-btn`
- Active workout: `[data-action="toggle-recording"]` → `[data-action="start-timer"]` → `[data-action="stop-timer"]` → rating screen → `[data-action="request-review"]` → `.ai-feedback-card`
- Exercise library (no nav tab): `import('/js/lib/router.js').then(r => r.navigateTo('exercises'))` in page context

## Verify the Pages Function

Without a real GEMINI_API_KEY the function can still be exercised at its handler boundary: import `onRequestPost`, stub `globalThis.fetch` to capture the outbound Gemini payload, and call it with a real `Request` + `env: { GEMINI_API_KEY: 'test' }`. Assert on `captured.contents[0].parts[0].text` (the system prompt).

## Data sanity

`node --input-type=module` can import `js/data/*.js` directly (pure data). Check: unique exercise/project ids, every track project's `exerciseId` resolves via `getExercise()`, projects have `checklist`/`watchFor`/`repsRequired`/`duration`/`durationLabel`.

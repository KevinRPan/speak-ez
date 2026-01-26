# Deploying Speak Sharp to Cloudflare

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Static Assets (CDN)          Pages Functions (Edge)       │
│   ┌─────────────────┐          ┌─────────────────────┐     │
│   │  index.html     │          │  /functions/api/    │     │
│   │  manifest.json  │          │    feedback.js      │     │
│   └─────────────────┘          └──────────┬──────────┘     │
│          │                                │                 │
└──────────┼────────────────────────────────┼─────────────────┘
           │                                │
           ▼                                ▼
      [Browser]  ◄──── fetch('/api/feedback') ────►  [Gemini API]
```

**Why this setup?**

- **Pages** hosts static files (HTML/CSS/JS) on a global CDN — fast, free, auto-deploys from Git
- **Pages Functions** run serverless code at the edge — perfect for API proxying
- **API key stays secret** — the function adds the Gemini API key server-side; it never reaches the browser

---

## Deployment Steps

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### 2. Deploy to Cloudflare Pages

**Option A: Via Cloudflare Dashboard (Easiest)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Click **Create** → **Pages** → **Connect to Git**
3. Select your repository (`speak-ez`)
4. Configure build settings:
   - **Build command:** (leave empty — no build needed)
   - **Build output directory:** `/` (root)
5. Click **Save and Deploy**

**Option B: Via Wrangler CLI**

```bash
# Install wrangler if needed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy . --project-name=speak-sharp
```

### 3. Add Environment Variable (Critical!)

The API key must be set in Cloudflare, not in code:

1. Go to **Workers & Pages** → **speak-sharp** → **Settings**
2. Click **Environment variables**
3. Add variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIza...` (your key)
4. Click **Save**
5. **Redeploy** for changes to take effect (Settings → Deployments → Retry)

---

## Project Structure Explained

```
speak-ez/
├── index.html          # The entire app (single-file PWA)
├── manifest.json       # PWA manifest (app name, icons, theme)
├── wrangler.toml       # Cloudflare config
├── functions/          # Pages Functions (serverless)
│   └── api/
│       └── feedback.js # Gemini API proxy → maps to POST /api/feedback
└── DEPLOYMENT.md       # This file
```

### How Pages Functions Routing Works

The file path determines the URL route:

| File                           | Route               |
|--------------------------------|---------------------|
| `functions/api/feedback.js`    | `/api/feedback`     |
| `functions/hello.js`           | `/hello`            |
| `functions/users/[id].js`      | `/users/:id`        |

Each file exports handlers for HTTP methods:
- `onRequestGet` → GET
- `onRequestPost` → POST
- `onRequestOptions` → OPTIONS (CORS preflight)

---

## Local Development

```bash
# Install wrangler
npm install -g wrangler

# Run locally with functions
wrangler pages dev .

# For local testing, create a .dev.vars file (gitignored):
echo "GEMINI_API_KEY=your-key-here" > .dev.vars
```

The app will be available at `http://localhost:8788`

---

## Troubleshooting

### "API key not configured" error
→ Add `GEMINI_API_KEY` in Cloudflare dashboard and redeploy

### Function not found (404 on /api/feedback)
→ Make sure `functions/api/feedback.js` exists and redeploy

### CORS errors
→ The function includes CORS headers; if issues persist, check browser console

### PWA not installing
→ Serve over HTTPS (Cloudflare Pages does this automatically)

---

## Costs

**Cloudflare Pages (Free tier):**
- Unlimited static requests
- 100,000 function invocations/month
- Unlimited bandwidth

**Gemini API:**
- Free tier: 15 requests/minute, 1M tokens/month
- Check [pricing](https://ai.google.dev/pricing) for current limits

For a personal practice app, the free tiers should be plenty.

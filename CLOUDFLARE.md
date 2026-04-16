# Cloudflare Deployment Guide — Grudge Studios Platform

This project has two deployable components:
1. **Frontend (React SPA)** — Deploy to **Cloudflare Pages**
2. **Backend (Express/Discord API)** — Deploy to **Cloudflare Workers** or keep on a separate host (Replit, VPS, etc.)

---

## 1. Frontend — Cloudflare Pages

The frontend is a standard Vite React SPA. Cloudflare Pages serves the built static files from `dist/`.

### Prerequisites
- Cloudflare account at https://dash.cloudflare.com
- Project pushed to a Git repository (GitHub or GitLab)
- Node.js 20+ (Cloudflare Pages build environment)

### Option A: Git Integration (Recommended)

1. Go to **Cloudflare Dashboard > Workers & Pages > Create > Pages**
2. Connect your GitHub/GitLab repository
3. Configure build settings:

| Setting | Value |
|---------|-------|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (project root) |
| Node.js version | `20` |

4. Add environment variable in the Pages settings:
   - `NODE_VERSION` = `20`

5. Click **Save and Deploy**

### Option B: Direct Upload (Wrangler CLI)

```bash
npm install -D wrangler@latest

npm run build

npx wrangler pages deploy dist --project-name grudge-studios
```

On first run, Wrangler will prompt you to authenticate and create the project.

### SPA Routing (Required)

Since this is a single-page app with client-side routing, you need a `_redirects` file so all paths resolve to `index.html`:

Create `public/_redirects`:
```
/*  /index.html  200
```

This file gets copied into `dist/` during build and tells Cloudflare Pages to serve `index.html` for all routes (e.g., `/shadow-ops`, `/grudge-footsies`, `/play`).

### Custom Domain

1. Go to **Pages project > Custom domains**
2. Add your domain (e.g., `grudgewarlords.com`)
3. Cloudflare will auto-configure DNS if the domain is on Cloudflare
4. SSL/TLS is automatic

### Environment Variables for Pages

Pages builds don't need runtime env vars since the frontend has no server-side secrets. All API calls go through `/api/*` which must be proxied to the backend (see Section 3).

---

## 2. Backend — Deployment Options

The Express backend (`server.js`, port 3001) handles Discord OAuth, bot interactions, GBuX wallet API, and slash commands. It requires persistent Node.js runtime and environment variables.

### Option A: Keep Backend on Replit (Simplest)

Leave the Express server running on Replit. Update the frontend to point API calls to the Replit backend URL instead of relative `/api/` paths.

In `vite.config.js`, for production builds, you'd set the API base URL:
```js
define: {
  'import.meta.env.VITE_API_URL': JSON.stringify(
    process.env.NODE_ENV === 'production'
      ? 'https://your-replit-app.replit.app'
      : ''
  ),
},
```

### Option B: Cloudflare Workers (Advanced)

The Express backend can be adapted to run on Cloudflare Workers, but this requires significant refactoring:
- Replace Express with Workers-compatible request handling (Hono or itty-router)
- Replace `discord.js` (uses Node.js APIs not available in Workers) with raw Discord REST API calls
- Move any file system operations to KV or R2
- Store secrets in Workers Secrets (`wrangler secret put`)

This is a non-trivial migration. Only pursue if you need edge deployment for the API layer.

### Option C: VPS / Railway / Fly.io

Deploy `server.js` as a standard Node.js app:
```bash
npm install --production
node server.js
```

Required environment variables:
```
DISCORD_PUBLIC_KEY=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_BOT_TOKEN=...
DISCORD_CHANNEL_ID=...
DISCORD_BOT_CHANNEL_ID=...
DISCORD_APP_ID=...
DISCORD_GUILD_ID=...
XAI_API_KEY=...
```

---

## 3. Connecting Frontend to Backend

In development, Vite proxies `/api/*` to `localhost:3001`. In production on Cloudflare Pages, you need one of these approaches:

### Option A: Cloudflare Pages Functions (Proxy)

Create `functions/api/[[path]].js` to proxy API requests to your backend:

```js
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const backendUrl = context.env.BACKEND_URL || 'https://your-backend.replit.app';
  const targetUrl = backendUrl + url.pathname + url.search;

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.method !== 'GET' ? context.request.body : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
```

Then set `BACKEND_URL` as a Pages environment variable pointing to your backend host.

### Option B: CORS + Direct API Calls

Update `server.js` ALLOWED_ORIGINS to include your Cloudflare Pages domain:
```js
const ALLOWED_ORIGINS = [
  'https://grudgewarlords.com',
  'https://grudge-studios.pages.dev',
  // ...
];
```

Update frontend API calls to use the full backend URL in production.

---

## 4. Cloudflare Pages Configuration Reference

### `wrangler.jsonc` (Optional — for Pages Functions)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "grudge-studios",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2026-04-01",
  "vars": {
    "BACKEND_URL": "https://your-backend-url.com"
  }
}
```

### Build Caching

Cloudflare Pages caches `node_modules` between builds. If you hit stale dependency issues:
1. Go to **Pages project > Settings > Build & deployments**
2. Clear build cache
3. Trigger a new deployment

### Preview Deployments

Every push to a non-production branch creates a preview deployment at:
```
https://<commit-hash>.grudge-studios.pages.dev
```

Use this for testing before merging to production.

---

## 5. Performance Optimizations for Cloudflare

### Asset Caching
Cloudflare Pages automatically applies aggressive caching to hashed assets (`/assets/index-abc123.js`). Static files in `public/` (sprites, audio, images) are also cached at the edge.

### Large Asset Considerations
This project has significant static assets (sprite sheets, audio files, video). Cloudflare Pages has a 25MB per-file limit. If any single asset exceeds this:
- Split large sprite sheets into smaller files
- Use Cloudflare R2 for oversized assets and reference them via R2 public URLs

### Headers
Create `public/_headers` for custom cache control:
```
/sprites/*
  Cache-Control: public, max-age=31536000, immutable

/audio/*
  Cache-Control: public, max-age=31536000, immutable

/effects/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 6. Quick Deploy Checklist

- [ ] Create `public/_redirects` file with `/*  /index.html  200`
- [ ] Create `public/_headers` file for asset caching (optional)
- [ ] Push code to GitHub/GitLab
- [ ] Create Cloudflare Pages project, connect repo
- [ ] Set build command: `npm run build`, output: `dist`
- [ ] Set `NODE_VERSION=20` environment variable
- [ ] Deploy and verify all routes work (especially `/shadow-ops`, `/grudge-footsies`, `/play`)
- [ ] Set up backend hosting (Replit, VPS, or Workers)
- [ ] Configure API proxy (Pages Functions or CORS)
- [ ] Add custom domain if needed
- [ ] Update Discord OAuth redirect URLs to new domain
- [ ] Verify Discord bot webhook/interaction endpoint points to backend URL

---

## 7. Troubleshooting

| Issue | Solution |
|-------|----------|
| Routes return 404 | Add `public/_redirects` with `/*  /index.html  200` |
| API calls fail | Set up proxy function or update CORS origins in `server.js` |
| Build fails on Node version | Set `NODE_VERSION=20` in Pages environment variables |
| Assets not loading | Check file paths are relative, verify `public/` files are in `dist/` after build |
| Discord OAuth broken | Update redirect URIs in Discord Developer Portal to new domain |
| Large file rejected | Cloudflare Pages 25MB limit — use R2 for oversized assets |
| Stale assets after deploy | Clear Cloudflare cache or add cache-busting query params |

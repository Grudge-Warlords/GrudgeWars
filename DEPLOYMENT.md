
# Grudge Warlords — Deployment Guide

## Overview

Grudge Warlords deploys across three services: **Vercel** (frontend + serverless API), **Railway** (backend auth + game API), and **Cloudflare** (DNS, Workers, R2 assets).

## Deploy Frontend (Vercel)

```bash
# Option A: Push to GitHub (auto-deploys if connected)
git push origin main

# Option B: Vercel CLI
npx vercel deploy --prod --yes
```

The Vercel project is `grudgenexus/grudge-wars`. Domain: `grudgewarlords.com`.

## Deploy Auth Worker (Cloudflare)

The `grudge-identity-api` Worker proxies auth requests to Railway.

```bash
npx wrangler deploy --config D:\temp\grudge-identity-api\wrangler.toml
```

Route: `id.grudge-studio.com/*` → Railway (`the-engine.up.railway.app`)

## Deploy Backend (Railway)

The-ENGINE auto-deploys from `MolochDaGod/The-ENGINE` on GitHub.
Manual redeploy: push to `main` branch.

## Environment Variables

### Vercel (`grudge-wars`)
| Variable | Purpose |
|----------|--------|
| `GRUDGE_ACCOUNT_DB` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Session token signing |
| `DISCORD_CLIENT_ID` | Discord OAuth |
| `DISCORD_BOT_TOKEN` | Discord bot |
| `GAME_API_GRUDA` | Admin token |
| `OBJECTSTORE_BASE` | ObjectStore CDN URL |

### Cloudflare Worker (`grudge-identity-api`)
| Variable | Purpose |
|----------|--------|
| `BACKEND_URL` | `https://the-engine.up.railway.app` |
| `ALLOWED_ORIGINS` | CORS allowlist |

### Railway (`The-ENGINE`)
| Variable | Purpose |
|----------|--------|
| `JWT_SECRET` | Must match Vercel |
| `DATABASE_URL` | Railway PostgreSQL |
| `SESSION_SECRET` | Cookie signing |
| `DISCORD_CLIENT_ID` | Discord OAuth |

## Local Development

```bash
npm install
cp .env.example .env
npm run dev          # Vite dev server on port 5000
```

## Troubleshooting

### Auth returns HTML instead of JSON
- The CF Worker may be routing to a stale backend
- Redeploy: `npx wrangler deploy --config wrangler.toml`

### Stale browser cache
- Hard refresh: Ctrl+Shift+R
- Check asset hashes match between HTML and served files

### Discord OAuth redirect mismatch
- Registered URI: `https://grudgewarlords.com/discordauth`
- Ensure `DISCORD_CLIENT_ID` matches the Discord Developer Portal app

---

*May your grudges be eternal.*


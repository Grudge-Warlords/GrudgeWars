# Grudge Warlords — Architecture

## System Overview

```
┌───────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                       │
└───────────────────────────────────────────────────────────────┘

Player Browser
      │
      ▼
┌───────────────────┐
│ Cloudflare DNS/CDN  │  SSL termination, DDoS protection, edge caching
└───────┬────┬──────┘
        │    │
        ▼    └──────────────────────────────┐
┌───────────────────┐                               ▼
│ Vercel (Frontend)   │                     ┌───────────────────┐
│ ├─ React/Vite SPA   │                     │ CF Workers          │
│ ├─ Serverless API   │                     │ ├─ grudge-identity  │
│ └─ Static Assets    │                     │ ├─ grudge-asset-cdn │
└───────┬───────────┘                     │ └─ grudgeassets     │
        │                                     └─────┬─────────────┘
        ▼                                           │
┌───────────────────┐                               ▼
│ Neon PostgreSQL     │                     ┌───────────────────┐
│ ├─ Accounts        │                     │ Railway (Backend)   │
│ ├─ Characters      │                     │ ├─ The-ENGINE (auth)│
│ ├─ Arena Teams     │                     │ ├─ game-api         │
│ └─ Inventory       │                     │ └─ GBUX economy     │
└───────────────────┘                     └───────────────────┘

┌───────────────────┐      ┌───────────────────┐
│ Cloudflare R2       │      │ GitHub Pages        │
│ (Asset CDN)         │      │ (ObjectStore CDN)   │
│ assets.grudge-      │      │ 3,400+ items        │
│ studio.com          │      │ 590+ icons          │
└───────────────────┘      └───────────────────┘
```

## Live Services

| Domain | Service | Backend |
|--------|---------|---------|
| `grudgewarlords.com` | Frontend + serverless API | Vercel |
| `id.grudge-studio.com` | Identity / Auth | CF Worker → Railway |
| `api.grudge-studio.com` | Game API | CF Tunnel → Railway |
| `assets.grudge-studio.com` | Asset CDN | CF Worker → R2 |
| `objectstore.grudge-studio.com` | ObjectStore API | CF Worker → D1 + R2 |

## Data Flow

```
Auth:    Browser → id.grudge-studio.com → CF Worker → Railway (The-ENGINE) → DB
Game:    Browser → api.grudge-studio.com → CF Tunnel → Railway (game-api) → DB
Arena:   Browser → grudgewarlords.com/api/* → Vercel serverless → Neon PostgreSQL
Assets:  Browser → assets.grudge-studio.com → CF Worker → R2 bucket
Sync:    Browser → Puter KV (auto-push every 30s on state change)
```

## Security

- **Cloudflare**: SSL/TLS termination, DDoS protection, WAF
- **Auth**: JWT tokens signed with shared secret across Railway + Vercel
- **CORS**: Dynamic allowlist (grudge subdomains, Vercel previews, Puter)
- **Rate limiting**: Per-IP on auth endpoints (10/min), general API (200/min)
- **Secrets**: Environment variables via Vercel/Railway, never in source

## Game State Persistence

- **Local**: Zustand + `persist` middleware → `localStorage` (grudge-warlords-save)
- **Cloud**: Auto-sync to Puter KV on meaningful state changes (debounced 30s)
- **Server**: Arena teams/battles in Neon PostgreSQL, characters in Railway DB
- **Island state**: Persisted locally + cloud synced (buildings, heroes, resources)

---

For deployment guide, see [DEPLOYMENT.md](DEPLOYMENT.md)

# Grudge Warlords — grudgewarlords.com

**Dark fantasy turn-based RPG with 6 races, 4 classes, 15 weapon types, and cross-platform Grudge Studio integration.**

Live at **https://grudgewarlords.com** · Created by **Racalvin The Pirate King** at Grudge Studio.

## Architecture

```
Browser (grudgewarlords.com)
   │
   ├── Static assets ──── Vercel CDN
   ├── /api/* ─────────── Vercel Serverless Function (api/index.js)
   │                        ├── Arena, sync, webhooks → Neon PostgreSQL
   │                        └── ObjectStore data → GitHub Pages CDN
   │
   ├── Auth calls ─────── id.grudge-studio.com
   │                        └── CF Worker → the-engine.up.railway.app
   │
   └── Game API ───────── api.grudge-studio.com
                            └── CF Tunnel → Railway game-api
```

| Layer | Service | Purpose |
|-------|---------|--------|
| **CDN / DNS** | Cloudflare | DNS, Workers, R2 asset storage, edge caching |
| **Identity** | `id.grudge-studio.com` | Auth (Puter, Discord, Google, GitHub, Phantom, phone, username/password) |
| **Game API** | `api.grudge-studio.com` | Characters, factions, economy, missions, combat |
| **Assets** | `assets.grudge-studio.com` | R2 CDN for game assets |
| **ObjectStore** | `objectstore.grudge-studio.com` | D1 metadata + R2 files for item database |
| **Frontend** | Vercel (`grudgewarlords.com`) | React/Vite SPA + serverless API function |
| **Database** | Neon PostgreSQL | Arena, accounts, characters, inventory, islands |
| **Backend** | Railway (`the-engine`) | Full-stack auth + game portal + GBUX economy |

## Quick Start

```bash
npm install
cp .env.example .env   # configure DB, auth, Discord keys
npm run dev            # local Vite dev server on port 5000
```

## Project Structure

```
src/                        # React client (Vite)
  components/               # 80+ components: TitleScreen, BattleScreen, WorldMap, HomeIsland…
  stores/gameStore.js        # Zustand store — 4500+ line combat engine + island + economy
  data/                      # Canonical game data (races, classes, equipment, skills, enemies)
  services/                  # Cloud sync, crafting API, grudge API client
  utils/                     # Auth gateway, API base, studio URLs
api/
  index.js                   # Vercel serverless Express app
  lib/                       # ObjectStore, S3, Puter, AI agents, UUID service
vercel.json                  # Rewrites: /api/auth/* → id.grudge-studio.com, /api/* → api.grudge-studio.com
```

## Game Systems

- **6 Races**: Human, Barbarian, Dwarf, Elf, Orc, Undead
- **4 Classes**: Warrior, Mage Priest, Worge, Ranger
- **3 Factions**: Crusade, Fabled, Legion (24 race×class combinations)
- **15 Weapon Types** with per-weapon skill trees
- **8 Attributes**: Strength, Vitality, Endurance, Dexterity, Agility, Intellect, Wisdom, Tactics
- **8 Equipment Tiers** (1.0x → 45.0x stat scaling)
- **5 Professions**: Miner, Forester, Mystic, Chef, Engineer
- **Turn-based Combat**: Row/column positioning, Grudge meter, companions, totems, transformations
- **Home Island**: Procedural terrain, building placement, hero deployment, passive resource generation
- **Arena PvP**: Submit teams, fight ranked opponents, leaderboard
- **Crafting Suite**: In-app with 5 professions, AFK harvesting, 3,400+ items
- **World Map**: 30+ zones, roaming dragons, airship encounters, random events
- **8 Scene Types**: Camp, Dungeon, Trading Post, Open Field, Portal, Boss Walkup, Airship, Home Island

## Auth Flow

All authentication routes through `id.grudge-studio.com` (Cloudflare Worker → Railway).
Client utility: `src/utils/grudgeGateway.js`

## Environment Variables

| Variable | Purpose |
|----------|--------|
| `GRUDGE_ACCOUNT_DB` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Session token signing (shared with Railway) |
| `DISCORD_CLIENT_ID` | Discord OAuth app client ID |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `GAME_API_GRUDA` | Admin API token |
| `OBJECTSTORE_BASE` | `https://molochdagod.github.io/ObjectStore` |

## Deployment

```bash
git push origin main              # push to GitHub
npx vercel deploy --prod --yes    # deploy via Vercel CLI
```

## Cross-Platform Integration

| App | URL | Purpose |
|-----|-----|--------|
| Grudge Studio | `grudge-studio.com` | Main platform portal |
| Warlord Crafting Suite | `warlord-crafting-suite.vercel.app` | Crafting editor |
| GrudgeBuilder | `grudge-builder.vercel.app` | Character builder + game modes |
| ObjectStore | `molochdagod.github.io/ObjectStore` | Game data CDN |

All apps share auth via `id.grudge-studio.com`.

See [ARCHITECTURE.md](ARCHITECTURE.md), [DEPLOYMENT.md](DEPLOYMENT.md), [AGENTS.md](AGENTS.md) for details.

---

*May your grudges be eternal.*

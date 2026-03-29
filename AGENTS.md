# Grudge Warlords — Project Rules & System Reference

## Project
- **Repo**: `MolochDaGod/GrudgeWars`
- **Live URL**: `https://grudgewarlords.com` (custom domain) / `https://grudge-warlords-game.vercel.app`
- **Deploy**: Vercel (auto from `main` branch), `vercel --prod --yes`
- **Stack**: React 18 + Vite, Node.js (Vercel serverless), Neon PostgreSQL

---

## ⚠️ SINGLE BACKEND — Always Use These

### Auth Gateway (Primary — all apps use this)
```
URL:  https://id.grudge-studio.com
SSO:  https://id.grudge-studio.com/auth/sso-check?return=<app_url>
Auth: https://id.grudge-studio.com/device
Flow: redirect to /auth/sso-check?return=<app_url> → checks SSO cookie → redirects back with token or sso_required=true

NOTE: The old auth-gateway-otb8qmmyd-grudgenexus.vercel.app is RETIRED. Do NOT use it.
```
**localStorage keys set by auth:**
| Key | Description |
|-----|-------------|
| `grudge_auth_token` | JWT — use as `Authorization: Bearer {token}` |
| `grudge_user_id` | Numeric account ID |
| `grudge_id` | Grudge UUID |
| `grudge_username` | Display name |

**Client utility**: `src/utils/grudgeGateway.js`
- `checkGatewayOnBoot()` — check token on app load, hydrate session
- `redirectToGateway(returnUrl)` — redirect to id.grudge-studio.com SSO
- `gatewaySignOut()` — clears all auth keys + server-side logout

**NEVER create new standalone auth flows.** Always route through `id.grudge-studio.com`.

---

### VPS Backend Services (all via Cloudflare + Traefik)

| Service | URL | Purpose |
|---------|-----|---------|
| **Grudge ID (Auth)** | `https://id.grudge-studio.com` | SSO, JWT, OAuth (Discord/Google/GitHub/Phantom/Puter/Phone) |
| **Game API** | `https://api.grudge-studio.com` | Game logic, AI agents, combat, economy, factions |
| **Account API** | `https://account.grudge-studio.com` | Profiles, social, achievements |
| **Asset Service** | `https://assets-api.grudge-studio.com` | Asset upload, metadata, UUID-keyed files |
| **WebSocket** | `https://ws.grudge-studio.com` | Real-time: `/game`, `/crew`, `/global` namespaces |
| **Launcher API** | `https://launcher.grudge-studio.com` | App registry & launch tokens |
| **Wallet Service** | (internal Docker only) | Solana wallet management |
| **AI Agent** | (internal Docker only) | AI query routing |

**VPS**: `74.208.155.229` — managed via Coolify at port 8000 — **do not expose raw ports**

---

### Vercel Serverless API (this repo)

| Route | File | Purpose |
|-------|------|---------|
| `/api/auth/login` | `api/index.js` | Proxies to `id.grudge-studio.com/auth/login` |
| `/api/auth/register` | `api/index.js` | Proxies to `id.grudge-studio.com/auth/register` |
| `/api/auth/puter` | `api/index.js` | Proxies to `id.grudge-studio.com/auth/puter` |
| `/api/auth/wallet` | `api/index.js` | Creates/upserts wallet account → Neon DB |
| `/api/auth/verify` | `api/index.js` | Validates JWT |
| `/api/discord/login` | `api/index.js` | Discord OAuth initiation |
| `/api/discord/callback` | `api/index.js` | Discord OAuth callback (POST) |
| `/api/discord/webhook/*` | `api/index.js` | Discord webhook senders |
| `/api/health` | `api/index.js` | Health check |

**DB**: Neon PostgreSQL (`GRUDGE_ACCOUNT_DB` env) — stores game accounts, characters, inventory, arena, islands

---

## Grudge UUID System

**NEVER use `uuidv4()` or random strings for game entity IDs.**

**Format**: `PREFIX-YYYYMMDDHHMMSS-XXXXXX-YYYYYYYY`
**Example**: `USER-20260319233113-000001-1404462B`

**Client** (ESM): `api/lib/uuid-service.js`
```js
import * as UUID from './lib/uuid-service.js';
const id = UUID.generate('asset', 'sword-image');  // ASST-...
UUID.isValid(id);  // true
UUID.parse(id);    // { prefix, timestamp, entityType, ... }
```

**VPS** (CommonJS): `services/shared/uuid.js`
```js
const { generate, isValid } = require('../../shared/uuid');
const id = generate('asset', filename);
```

**Prefixes**:
`USER` `HERO` `ITEM` `EQIP` `ABIL` `MATL` `RECP` `NODE` `MOBS` `BOSS` `MISS` `INFU` `LOOT` `CONS` `QUST` `ZONE` `SAVE` `ASST` `SYNC` `ACCT` `OBJS` `SPRT` `MODL` `AUDI` `TXTR` `BNDL` `AVTR` `ICON` `WEAP` `ARMR`

---

## Object Storage / Asset URLs

**CDN (primary)**: `https://assets.grudge-studio.com` (Cloudflare R2)
**Static fallback**: `https://molochdagod.github.io/ObjectStore`

**URL pattern**: `{CDN_BASE}/{category}/{GRUDGE-UUID}.{ext}`
**Example**: `https://assets.grudge-studio.com/weapons/WEAP-20260319233113-000001-A1B2C3D4.glb`

**Client helper**: `src/data/objectStoreIcons.js`
```js
import { getWeaponIcon, getArmorIcon, OBJECTSTORE_BASE } from '../data/objectStoreIcons.js';
```

**VPS helper**: `services/shared/objectStore.js`
```js
const { resolveAssetUrl, objectStoreUrl, storageKey } = require('../../shared/objectStore');
```

**Do NOT hardcode asset URLs.** Always use the helper functions.

---

## Authentication Component

**Primary auth UI**: `src/components/GrudgeAuthModal.jsx`
- Used in `StudioPortal.jsx` (portal at `/`)
- Buttons: Gateway redirect, Wallet, Discord, Grudge ID form, Puter, Guest

**Session bridge**: `src/utils/grudgeGateway.js`
```js
import { checkGatewayOnBoot, hydrateSessionFromGateway, gatewaySignOut } from '../utils/grudgeGateway.js';
```

**Local session shape** (`localStorage['grudge-session']`):
```json
{ "type": "gateway|discord|grudge|puter|wallet|guest",
  "username": "string", "grudgeId": "USER-...", "accountId": "123", "loginTime": 1234567890 }
```

---

## Env Vars (Vercel Production)

| Var | Value |
|-----|-------|
| `GRUDGE_ACCOUNT_DB` | Neon PostgreSQL connection string |
| `DATABASE_URL` | Same as above |
| `JWT_SECRET` | Shared with VPS |
| `GAME_API_GRUDA` | Admin token (same as JWT_SECRET) |
| `SSO_SECRET` | Session secret |
| `VPS_AUTH_URL` | `https://id.grudge-studio.com` |
| `DISCORD_CLIENT_ID` | `1471046591220678677` |
| `DISCORD_BOT_TOKEN` | (set in Vercel) |
| `DISCORD_GUILD_ID` | `960983121019437076` |
| `OBJECTSTORE_BASE` | `https://molochdagod.github.io/ObjectStore` |
| `CRAFTING_SUITE_URL` | `https://warlord-crafting-suite.vercel.app` |

---

## Code Standards

- **Runtime**: Node.js (prefer LTS), ESM (`import`/`export`) in `src/`, CJS in `api/`
- **Frontend**: React functional components with hooks only — no class components
- **Styling**: Inline styles only (no CSS files) — use gold/dark WCS theme (`#FAAC47`, `#DB6331`, `#0a0a12`)
- **Font**: `'Cinzel'` for headings, `'Jost'` for body
- **No Replit** — use Vercel for deployments
- **No Neon directly for new features** — use the VPS backend or Vercel API proxy
- Always commit with `Co-Authored-By: Oz <oz-agent@warp.dev>`

---

## Discord OAuth Redirect URI
`https://grudgewarlords.com/discordauth` — **registered in Discord Developer Portal, do not change**

## Key Game Entities
- **Races**: 6 (Human, Elf, Orc, Dwarf, Undead, Worge)
- **Classes**: Warrior, Mage, Ranger, Worge
- **Factions**: Crusade, Fabled, Legion
- **Warlords**: 24 (6 races × 4 classes)
- **Profession types**: Miner, Forester, Mystic, Chef, Engineer

# Grudge Wars — Language Rules & Coding Conventions

These rules apply to all code in this repository. They establish the single truths for auth, APIs, CORS, and architecture.

---

## 1. Auth — Single Token, Single Key

**The canonical auth token is `grudge_auth_token` stored in `localStorage`.**

- Never read or write `grudge_session_token`, `grudge_sync_token`, `X-Session-Token`, or any other legacy key
- `grudge_auth_token` is set by `grudgeGateway.js::checkGatewayOnBoot()` or the external Discord callback
- The backing identity service is `https://id.grudge-studio.com`

Persistent keys and what they hold:
| Key | Purpose |
|---|---|
| `grudge_auth_token` | Bearer JWT — the only auth token |
| `grudge_id` | Grudge ID (e.g. `GRUDGE_XXXXX_YYYYY`) |
| `grudge_username` | Display name |
| `grudge_user_id` | Numeric account ID |
| `grudge-session` | Cached session metadata (type, grudgeId, loginTime) |

**On sign-out**, clear all of the above plus any legacy keys via `gatewaySignOut()`.
**Never pass tokens in URL query parameters.**

---

## 2. API Client — `src/services/grudgeApi.js` Is the Truth

All backend API calls in the frontend go through `grudgeApi.js`.
It is the single file that knows about endpoints, auth headers, and error normalization.

```js
// ✅ Correct
import grudgeApi from '../services/grudgeApi.js';
const chars = await grudgeApi.characters.list();

// ❌ Wrong — raw fetch in a component
fetch('/api/characters', { headers: { Authorization: 'Bearer ' + token } });
```

Adding a new endpoint: add it as a named method on the appropriate namespace object inside `grudgeApi.js`. Never add new `fetch()` calls directly in components or stores.

---

## 3. Backend Server (`server.js`) — Proxy Pattern Only

`server.js` is the Grudge Engine backend. It handles:
- Auth routes (Discord OAuth, JWT issuance via `createJWT`)
- Game session state (battle sessions, arena, lobby — in-memory)
- Proxied character/inventory/economy routes to `api.grudge-studio.com`

**No direct database access** from `server.js` for character/inventory/economy data.
All data operations proxy to `api.grudge-studio.com` via `proxyToBackend()` from `src/server/backendProxy.js`.

```js
// ✅ Correct — proxy pattern
app.get('/api/characters', requireUserAuth, (req, res) =>
  proxyToBackend('/api/characters', req, res));

// ❌ Wrong — direct SQL in server.js
const rows = await query('SELECT * FROM characters WHERE grudge_id = $1', [id]);
```

---

## 4. CORS — Single Allowlist

**Single source of truth: `src/server/backendProxy.js::ALLOWED_ORIGINS`**

`server.js` spreads this list into its own `ALLOWED_ORIGINS` array.
Never add a new origin in only one place — update `backendProxy.js`.

Rule: wildcard `*` is never used in authenticated routes.

---

## 5. JWT Secrets

`server.js` requires `JWT_SECRET` or `GAME_API_GRUDA` env var.
If neither is set, the server throws on boot.
**No hardcoded fallback secrets.**

---

## 6. State — Zustand Is a Runtime Cache, Not the Database

`src/stores/gameStore.js` manages local game state.
Zustand `persist` is for offline play and fast boot.
The backend (`api.grudge-studio.com`) is the authoritative store for characters, inventory, economy, and progression.

On auth:
1. `loadAccountData()` hydrates heroRoster from backend characters
2. Backend characters are merged (not overwritten) into local roster
3. `saveHeroToBackend(heroId)` should be called after level-up, skill allocation, equipment changes
4. New heroes created via `addHeroToRoster()` are automatically persisted via `createHeroOnBackend()`

---

## 7. File Conventions

| Layer | Location | Pattern |
|---|---|---|
| Frontend components | `src/components/` | JSX + inline styles |
| Data / static definitions | `src/data/` | Named exports, no side effects |
| Frontend utilities | `src/utils/` | Pure functions |
| Frontend stores | `src/stores/` | Zustand `create` + `persist` |
| Frontend services | `src/services/` | API clients + sync helpers |
| Server routes | `server.js` | Express app routes |
| Server helpers | `src/server/` | Node.js ESM modules |
| Vercel API routes | `api/` | Vercel serverless (CommonJS) |

---

## 8. Git & Commits

- Branch: `main` is production for grudge-wars
- Commit prefixes: `feat:`, `fix:`, `security:`, `refactor:`, `docs:`, `chore:`
- Never commit `.env` files or `node_modules/`

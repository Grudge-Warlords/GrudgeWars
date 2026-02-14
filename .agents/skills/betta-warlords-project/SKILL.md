---
name: betta-warlords-project
description: Core project knowledge for Betta Warlords RPG by Grudge Studios. Use when working on any game feature, UI, battle system, lore, character system, deployment, or Grudge Studios ecosystem integration. Covers architecture, systems, lore, breeds, classes, Grudge Studios relationship, and technical patterns.
---

# Betta Warlords — Project Knowledge

## Grudge Studios Relationship

Betta Warlords is the **first and flagship title** of Grudge Studios. Key facts:

- **Grudge Studios** is the game studio/publisher. Betta Warlords is made FOR the Betta community and runs on Grudge Studios infrastructure.
- **Betta Community Focus:** The game is made for the real-world Betta fish enthusiast community. Breeds are based on IBC (International Betta Congress) show standards. Lore incorporates real betta splendens biology and behavior.
- **GBuX:** Universal currency across ALL Grudge Studios titles and AI tools. Players earn GBuX through gameplay (battles, quests, cNFT breeding, exploration). Betta Warlords is the ONLY entry point to early-stage GBuX.
- **Free AI:** Grudge Studios provides free AI via Puter.js — powers hero dialogue, battle narration, lore generation, NPC personalities, and player-initiated chat. No API key costs to players.
- **cNFT Breeding:** Compressed NFT system where Warlords become on-chain assets. 8 breeds x 4 classes = 32 base cNFT types with breeding for hybrid traits and rare mutations.
- **Exclusive Gateway:** Betta Warlords is the ONLY entry point to GBuX, cNFT breeding, and the entire Grudge Studios ecosystem. Founding players get permanent benefits across all future titles.
- **Grudge Logo:** Pirate skull with gold horned frame, `public/images/grudge_logo.png`. Gold/orange color scheme on dark ocean blue background.

## Auth / Login — Grudge Studios Identity System

The game uses Grudge Studios login systems. Three auth methods, all producing a `grudge-session` in localStorage:

### 1. Discord OAuth (Server-Side)
- **Flow:** Frontend calls `GET /api/discord/login` → server generates state token + Discord authorize URL → user authenticates on Discord → redirect to `/discordauth` with code → frontend calls `POST /api/discord/callback` with code+state → server exchanges for access token → fetches user from `GET discord.com/api/users/@me` → returns user data + beta invite link
- **Scopes:** `identify email guilds.join`
- **User Data Returned:** `id, username, discriminator, avatar, email, globalName`
- **Beta Invite:** On successful login, server auto-creates a unique 1-use 24h invite to the beta Discord channel (ID: `1381760000946470987`) using bot token
- **Session Storage:** `localStorage.setItem('grudge-session', JSON.stringify({ type: 'discord', username, loginTime }))`
- **Secrets Required:** `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `GAME_API_GRUDA` (bot token)

### 2. Puter.js Auth (Client-Side)
- **Flow:** `puterAuth.signIn()` → Puter SDK handles auth popup → `puterAuth.getUser()` returns username → session stored
- **Session Storage:** `localStorage.setItem('grudge-session', JSON.stringify({ type: 'puter', username: user.username, loginTime }))`
- **Service File:** `src/utils/puterService.js`
- **Puter Services Used:**
  - `puter.auth` — Sign in, sign out, get user, check signed in status
  - `puter.ai.chat` — Free AI for dialogue, narration, lore generation (model: `gpt-5-nano`)
  - `puter.kv` — Cloud key-value storage for saves, conversation history, player data
- **Availability Check:** `isPuterAvailable()` — checks if `window.puter` exists. UI conditionally shows Puter buttons.

### 3. Guest Login (No Auth)
- **Flow:** Direct entry, no external auth. Username defaults to "Adventurer".
- **Session Storage:** `localStorage.setItem('grudge-session', JSON.stringify({ type: 'guest', username: 'Adventurer', loginTime }))`

### Session Management
- **Read Session:** `JSON.parse(localStorage.getItem('grudge-session') || '{}')`
- **Logout:** `localStorage.removeItem('grudge-session')` + `puterAuth.signOut()` if Puter
- **Login Component:** `src/components/TitleScreen.jsx` — handles all three login flows
- **Session Consumer:** `src/components/LobbyScreen.jsx` — reads session, shows user info, handles logout

### Future: Grudge ID & Server-Side Wallet
- **Not yet implemented.** Current auth gives Discord ID or Puter username as player identity.
- **Planned:** Unified Grudge ID that links Discord + Puter + wallet address into one cross-game identity
- **Planned:** Server-side wallet for GBuX balance, cNFT ownership, cross-title asset transfers
- **When implementing:** The `grudge-session` should be extended with `grudgeId` and `walletAddress` fields. Server should issue a session token (JWT or similar) that validates the Grudge ID.

## Server Architecture

### Development (`server.js` — port 3001)
- Express server for Discord OAuth routes and webhook broadcasting
- Separate workflow: "Discord API Server"
- Frontend calls it via Vite proxy or direct URL

### Production (`server.prod.js` — port 5000)
- Express server serving BOTH API routes AND static build from `dist/`
- Single process, single port. Deployment target: autoscale
- Build: `npm run build` → Run: `node server.prod.js`
- Express 5: wildcard routes use `'/{*splat}'` syntax

### API Routes (both servers)
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/discord/login` | GET | None | Generate Discord OAuth URL + state |
| `/api/discord/callback` | POST | None | Exchange code for token, return user data |
| `/api/discord/invite` | GET | None | Create 1-use beta Discord invite |
| `/api/discord/webhook/verify` | GET | Admin | Verify admin token for webhook access |
| `/api/discord/webhook/update` | POST | Admin | Broadcast game update to Discord |
| `/api/discord/webhook/patch` | POST | Admin | Broadcast patch notes to Discord |
| `/api/discord/webhook/challenge` | POST | Admin | Broadcast community challenge |
| `/api/discord/webhook/event` | POST | Admin | Broadcast game event |
| `/api/discord/webhook/lore` | POST | Admin | Broadcast lore reveal |
| `/api/discord/webhook/tip` | POST | Admin | Broadcast gameplay tip |
| `/api/discord/webhook/custom` | POST | Admin | Custom webhook message |

### Admin Auth for Webhooks
- Header: `x-admin-token` must match `GAME_API_GRUDA` env var
- UI in LobbyScreen.jsx — "OG Channel Broadcaster" panel for authorized users

### Environment Secrets
| Secret | Purpose |
|--------|---------|
| `DISCORD_CLIENT_ID` | Discord OAuth app client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth app client secret |
| `GAME_API_GRUDA` | Discord bot token + admin auth token |
| `DISCORD_GRUDGE_WEBHOOK` | Discord webhook URL for OG channel |
| `SESSION_SECRET` | Express session secret (for future use) |
| `DATABASE_URL` | PostgreSQL connection (for future leaderboard/server-side data) |

## Frontend Architecture

### Stack
- **React 19 + Vite** — dev on port 5000 (`npx vite --host 0.0.0.0 --port 5000`)
- **State:** Single Zustand store (`src/stores/gameStore.js`) — all game state
- **Styling:** Inline styles + CSS variables. No CSS framework.
- **Fonts:** Cinzel (headings, serif) + Jost (body, sans-serif) via Google Fonts
- **Colors:** Deep blue (#050a18), Teal (#06b6d4), Cyan (#22d3ee), Purple (#a855f7), Gold (#f59e0b), Red (#ef4444)
- **Mobile:** Fully responsive from 360px+. Use `clamp()` for fluid typography. Touch targets 44px+.
- **PWA:** `public/manifest.json` + `public/sw.js` — installable on all platforms

### Key Directories
```
src/components/     — React components (TitleScreen, BattleScreen, WorldMap, LobbyScreen, etc.)
src/stores/         — Zustand game store (gameStore.js)
src/data/           — Game data (spriteMap, lore, chapters, skills, heroBestItems, classDefinitions)
src/utils/          — Utilities (puterService, aiDialogueService, audio)
src/hooks/          — Custom hooks (usePuterAI)
public/images/      — All game art assets
  /races/           — 8 betta breed sprites
  /enemies/         — 30+ enemy sprites
  /buildings/       — Kingdom structure sprites
  /cards/           — TCG-style location card art
  /attributes/      — 8 attribute icons
  /spell_icons/     — Painterly skill/spell icons
  /skills/          — Skill tree icons
public/backgrounds/ — Battle background images (12+)
public/game-index.html — Standalone promotional landing page (NOT React)
```

### Screen Flow
Title Screen → Intro Cinematic → Game Lobby → Character Creation → World Map → Location Views → Battle Screens. Farewell screen on logout.

### Key Components
| Component | File | Purpose |
|-----------|------|---------|
| TitleScreen | `src/components/TitleScreen.jsx` | Login (Discord/Puter/Guest), branding |
| LobbyScreen | `src/components/LobbyScreen.jsx` | Main hub, session info, Discord community, webhook broadcaster |
| BattleScreen | `src/components/BattleScreen.jsx` | Combat UI, initiative, positioning |
| WorldMap | `src/components/WorldMap.jsx` | 2D map with zoom/pan, A* pathfinding |
| SpriteAnimation | `src/components/SpriteAnimation.jsx` | Pixel art renderer with equipment overlays |
| BackgroundsPage | `src/components/BackgroundsPage.jsx` | Dev reference for battle backgrounds |
| ChapterTracker | `src/components/ChapterTracker.jsx` | Story progression UI |

### Important Patterns
- **Sprite System:** `image-rendering: pixelated`, equipment overlays, transformation effects, swimming bobbing
- **Sprite Map:** `src/data/spriteMap.js` maps names to sprite sheet paths and frame data
- **Bubble Animations:** CSS custom properties `--wx` for randomized wobble motion
- **Sprite Sheets:** Vertical strips need Python extraction to horizontal format for SpriteAnimation
- **Background Map:** `BattleScreen.jsx` has `locationBackgrounds` mapping locations to background images
- **Scroll Animations:** IntersectionObserver with `.reveal` / `.reveal-left` / `.reveal-right` / `.reveal-scale`

## Game Systems

### Character System (32 Warlord Combinations)
**8 Betta Breeds** (real IBC-inspired):
| Breed | Color | Sprite File | Trait | Stats |
|-------|-------|-------------|-------|-------|
| Halfmoon | Blue/Cyan | `blue_betta.png` | Tidal Flow | +1 All |
| Plakat | Red | `red_betta.png` | Blood Frenzy | +4 STR, +2 VIT |
| Doubletail | Purple | `purple_betta.png` | Arcane Depths | +3 INT, +2 DEX |
| Cambodian | White/Silver | `white_betta.png` | Phantom Scales | +3 VIT, +2 END |
| Giant | Green | `green_betta.png` | Reef Fury | +3 STR, +2 AGI |
| Crowntail | Gold | `gold_betta.png` | Royal Guard | +3 END, +2 VIT |
| Dragonscale | Orange | `orange_betta.png` | Thermal Dash | +3 AGI, +2 STR |
| Butterfly | Pink | `pink_betta.png` | Healing Tide | +3 WIS, +2 INT |

**4 Classes:**
| Class | Role | Transform | Scale |
|-------|------|-----------|-------|
| Warrior | Frontline tank/DPS | Leviathan Form (Bear) | 1.5x |
| Mage Priest | Caster/Healer | Bubble Shield | N/A |
| Worge | Shapeshifter | Shark Form (Demon) | 1.4x |
| Ranger | Precision striker | Elite Form | 1.35x |

**8 Attributes:** STR, VIT, END, DEX, AGI, INT, WIS, TAC. Levels 0-20.

### Battle System
- Turn-based with speed-based initiative
- 4-Row Positioning: Front / Mid-Front / Mid-Back / Back
- Guardian Passive: Front-row units intercept attacks on back-row allies
- Forward/Back tactical movement during combat
- Skill Effects: Bleed/Burn/Poison DOTs, Stun/Sleep/Confuse CC, Lower Defense/Attack debuffs, Execute threshold, Armor piercing, Cleanse, Passive procs from skill trees
- Big-hit VFX: Secondary effects for crits and >30 damage
- BubbleEmitter ambient particles during combat

### Lore — Three Vessels of Magic
1. **Betta (Fire of Will)** — Active. Player-controlled Warlords. The last conscious magic.
2. **Gorgons (Weight of Law)** — Corrupted. Three Siren bosses driven mad by the Silence.
3. **Plankton (Light of Unity)** — Silent. The central mystery of the game.

**Gorgon Siren Bosses:**
- Scylla (Shallows, Lv9) — Former gentle protector, now strikes with riptide speed
- Medusa (Mid-Waters, Lv17) — Border keeper, lashes at shadows, wept abyssal pearls
- Charybdis (Abyss, Lv20) — The Devourer, only witness to the Silence moment

**The Catalyst:** Plankton Magic went silent → Coral Crown shattered → Gorgons went mad → Betta Warlords must restore balance.

**Lore Data:** `src/data/lore.js` — location entries with vessel connections, quotes, descriptions.

### World Map
- 32 locations across 5 terrain regions (Coral Reefs, Kelp Forests, Volcanic Vents, Frozen Depths, Abyss)
- RTS-style 2D map with zoom/pan
- A* pathfinding, auto-generated wander areas, curved road paths
- Location popups use TCG card art style with vessel connection badges
- Card art assets in `public/images/cards/`

### AI Dialogue System (Puter.js Free AI)
- **Service:** `src/utils/aiDialogueService.js`
- **AI Model:** `gpt-5-nano` via `puter.ai.chat()`
- **Features:**
  - Per-hero personality via UUID/SHA identity
  - Conversation history logged to Puter KV
  - Player style tracking (battles, exploration, trades, healing, boss attempts)
  - 40% chance terse 6-7 word responses
  - Per-hero 90s cooldown, 2-per-3min rate limit
  - Response deduplication (never repeats same sentence)
  - Best-item preference system (`src/data/heroBestItems.js`) — weapon/ring/relic with happiness dialogue + stat bonus
  - Player-initiated chat via Party Log input → message sent to random party hero
  - Enriched with real betta splendens wiki knowledge
  - Fallback to template dialogue when AI unavailable
- **AI Functions in puterService.js:**
  - `puterAI.chat(prompt, options)` — General AI chat
  - `puterAI.generateLore(context)` — Atmospheric lore snippets
  - `puterAI.battleNarration(attacker, defender, ability, damage)` — Combat narration
  - `puterAI.npcDialogue(npcName, context)` — NPC conversation

### Save System
- **Local:** `localStorage` for game state persistence
- **Cloud:** Puter KV (`puter.kv.set/get/del/list`) for cloud saves
- **State:** Single Zustand store handles all game state, auto-saves on changes

### Economy
- **Pearls:** Primary currency from battles
- **Harvest Resources:** Coral, shells, algae, crystals
- **Reef Hunt Mini-game:** Canvas-based collecting/harvesting mini-game

### Chapter System
- 8 chapters following Three Vessels narrative arc
- Objectives: create heroes, explore zones, defeat bosses, unlock skills
- Progress tracking with pearl/XP rewards and lore reveals
- Vessel-focused color theming per chapter
- Data: `src/data/chapters.js`, Component: `src/components/ChapterTracker.jsx`

### Leaderboards (Planned)
- Currently shown as placeholder in LobbyScreen ("Compete with other Warlords")
- PostgreSQL database is provisioned and available (`DATABASE_URL`)
- When implementing: store player stats server-side, query for rankings
- Consider: battle wins, boss kills, cNFT collection size, GBuX earned, chapter progress

### Discord Community Integration
- **Webhook Broadcaster:** Admin UI in LobbyScreen for posting to OG Discord channel
- **Message Types:** Updates, patches, challenges, events, lore reveals, tips, custom
- **Embed Colors:** Update=green, Patch=purple, Challenge=gold, Event=red, Milestone=blue, Lore=violet, Tip=emerald
- **Beta Invites:** Auto-generated 1-use invites on Discord login

## Landing Page (`public/game-index.html`)
- Standalone HTML5 page (not React) — serves as promotional website
- Accessible at `/game-index.html`
- Features: Fixed nav, exclusive gateway banner, Web2/Web3/PWA badges, hero section with floating logo, full-width battle scene images, breed cards (80px sprites), class cards, Gorgon boss profiles, world locations grid, enemy gallery (96px thumbnails), building tiles, TCG card display, attribute icons, cNFT breeding section, Grudge Gameplay section, GBuX ecosystem grid, PWA install section, mystery lore clues
- Scroll animations via IntersectionObserver
- PWA install via `beforeinstallprompt` event
- Service worker registration
- Rising bubble particle effects

## Best Practices & Lessons Learned

### Deployment
- Production server MUST bind to port 5000
- Express 5 wildcard: `'/{*splat}'` not `'*'`
- Vite config must have `allowedHosts: true` for Replit proxy
- `server.prod.js` serves both API + static from `dist/`

### Styling
- Always inline styles + CSS variables, no CSS framework
- Use `clamp()` for responsive typography
- `image-rendering: pixelated` for all pixel art
- Color palette: stick to the 6 core colors defined in CSS variables

### Assets
- All images in `public/images/` subdirectories
- Backgrounds in `public/backgrounds/`
- Sprite sheets: vertical strips → convert to horizontal for SpriteAnimation
- Card art: `public/images/cards/` with vessel-aligned color variants (blue/green/red)

### Auth Best Practices
- Always check `isPuterAvailable()` before showing Puter buttons
- Handle all three auth paths (Discord/Puter/Guest) gracefully
- `grudge-session` is the single source of truth for current user
- Clean up session on logout from both localStorage and Puter

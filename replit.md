# Grudge Studios Gaming Platform

## Overview
Grudge Studios is a multi-game browser gaming platform built with React 19, Vite, and Zustand. The flagship title is **Betta Warlords**, a turn-based RPG set in an underwater freshwater world with tactical battles featuring multi-hero teams of unique Betta fish. The project serves as the exclusive entry point to Grudge Studios' universal currency (GBuX), compressed NFT (cNFT) breeding, and underlying infrastructure. It also includes the "Game Factory," an AI-powered RPG generator. The platform hosts 6 playable mini-games, a social hub, avatar designer, and an integrated Discord bot.

## User Preferences
- Clear and concise language. Iterative development with small, testable changes.
- Ask before significant architectural changes or adding new external dependencies.
- Modern React practices, consistent styling. Do NOT use `public/logo.png` — use `/grudge-logo.png`.
- Colors: #050a18, #06b6d4, #22d3ee, #a855f7, #f59e0b, #ef4444. Fonts: Cinzel/Jost/MedievalSharp.

## Project Structure
```
/
├── src/
│   ├── App.jsx                    # Root router (path-based, no react-router)
│   ├── main.jsx                   # React DOM entry
│   ├── index.css                  # Global styles + CSS variables
│   ├── components/
│   │   ├── games/                 # 6 standalone game components
│   │   │   ├── ShadowOps.jsx      # Top-down survival shooter
│   │   │   ├── GrudgeFootsies.jsx # 1v1 fighting game
│   │   │   ├── GrudgeBox.jsx      # GKO Boxing
│   │   │   ├── DungeonCrawler.jsx # Crypt Crawlers
│   │   │   ├── PlatformRunner.jsx # Warlord's Gauntlet
│   │   │   └── ReefHuntMiniGame.jsx # Grove Hunt
│   │   ├── landing/               # Landing page, title screen, video, cinematic
│   │   ├── battle/                # RPG battle system
│   │   ├── character/             # Character creation, sheets, skill trees
│   │   ├── map/                   # World map, locations, scenes
│   │   ├── social/                # Social hub, Discord auth, arena, account
│   │   ├── avatar/                # Avatar designer (pixel art engine)
│   │   ├── crafting/              # Crafting, training
│   │   ├── ui/                    # Shared UI (header, tooltips, error boundary, settings)
│   │   ├── admin/                 # Admin tools (sprite viewer, map, battle debug)
│   │   ├── sprites/               # Sprite animation components
│   │   └── lore/                  # Lore & dialogue system
│   ├── data/                      # Game data, effect sprites, UI sprites
│   │   └── effectSprites.js       # Shared sprite effect system (40+ effect types)
│   ├── engine/                    # PixiJS rendering engine
│   ├── factory/                   # Game Factory (AI RPG generator)
│   ├── hooks/                     # Custom React hooks (useRouteSync, etc.)
│   ├── providers/                 # Context providers
│   ├── services/                  # Backend services (gbuxService, etc.)
│   ├── stores/                    # Zustand stores (gameStore)
│   └── utils/                     # Asset manager, helpers
├── server.js                      # Express backend (Discord bot, GBuX API, port 3001)
├── public/                        # Static assets
│   ├── sprites/                   # RPG sprites (characters, emblems, enemies)
│   │   └── shadow-ops/            # Shadow Ops player/enemy sprite sheets
│   ├── effects/                   # VFX sprite frames (500+ PNGs)
│   ├── footsies/                  # Grudge Footsies sprite sheets
│   ├── dungeon-crawler/           # Crypt Crawlers assets (sprites, sounds, tilesets)
│   ├── platformer/                # Warlord's Gauntlet assets (heroes, enemies, fx)
│   ├── audio/                     # Music and sound effects
│   ├── backgrounds/               # Background images
│   ├── images/                    # UI images, loading screens
│   ├── icons/                     # UI icons
│   ├── videos/                    # Intro/cinematic videos
│   ├── ui/                        # UI sprite sheets
│   └── grudge-logo.png            # Primary logo (use this, not logo.png)
├── vite.config.js                 # Vite config (SPA, proxy /api to :3001)
├── vite.config.puter.js           # Alternate Vite config for Puter deployment
└── package.json                   # Dependencies and scripts
```

## Routes
| Path | Component | Type |
|------|-----------|------|
| `/` | LandingPage | Landing |
| `/play` | GameApp (RPG) | Fullscreen |
| `/shadow-ops` | ShadowOps | Fullscreen game |
| `/grudge-footsies` | GrudgeFootsies | Fullscreen game |
| `/gko-boxing` or `/grudge-box` | GrudgeBox | Fullscreen game |
| `/dungeon-crawler` | DungeonCrawler | Fullscreen game |
| `/warlords-gauntlet` | PlatformRunner | Fullscreen game |
| `/avatar` | AvatarDesigner | Fullscreen |
| `/social` | SocialHub | Standard |
| `/arena` | ArenaPage | Standard |
| `/crafting` | CraftingPage | Standard |
| `/factory` | FactoryWizard | Standard |
| `/gbux` | GBuxPage | Standard |
| `/demo/shadow-knights` | DemoGame | Standard |
| `/demo/starbound-corsairs` | DemoGame | Standard |
| `/discordauth` | DiscordAuth | No header |
| `/admin*` | Admin tools | No header |

## System Architecture
**Frontend:** React 19 + Vite (SPA, client-side routing via `window.location.pathname`). Zustand for state management. Inline styles + CSS variables. Games are lazy-loaded with `React.lazy()` + `Suspense`.

**Backend:** Express server on port 3001. Handles Discord OAuth, Discord bot interactions, GBuX wallet API (Crossmint/Solana), and slash commands. Frontend proxies `/api/*` requests to the backend via Vite dev server config.

**Rendering:** Canvas-based 2D games (no WebGL required for mini-games). PixiJS used for the RPG battle system. All mini-games render to `<canvas>` with `requestAnimationFrame` loops.

**Persistence:** `localStorage` for game saves (gun configs, coins, unlocked parts, high scores). Puter KV for cloud saves. Zustand for runtime state.

## Mini-Games

### Shadow Ops (`/shadow-ops`)
Top-down survival shooter. WASD movement, mouse aim, wave-based combat.
- **Canvas:** 960x640 viewport, 2400x1600 arena, 64px tiles
- **Player:** 9-tier sprite progression (Swordsman lvl1-3, lvl4-9), 64px frames, 1.5x scale
- **Weapons:** 5 base types (Pistol, Shotgun, Rifle, SMG, Plasma) + Gun Constructor (custom weapons from 200 parts across 5 categories x 10 variants x 4 color tiers)
- **Enemies:** 11 types (skeleton, slime, orc, goblin, gnoll, beholder, golem, predator-plant, skeleton-archer, dark-mage, fire-imp) with directional sprite sheets. AI raycasting line-of-sight — ranged enemies strafe to find LOS instead of shooting through walls.
- **Abilities (7):** Shockwave [E], Poison Cloud [F], Fire Ring [R], Teleport [X], Blade Storm [C], Armor Mode [V], Super Flash [Z]
- **Combat:** Dash melee (Space into enemies = impact damage + knockback + stun), grenades (right-click), dual gun loadout (1/2/Q swap)
- **Progression:** Upgrade cards on level-up, coin economy, boss waves every 5 rounds
- **Allies:** Combat Drone, Auto-Turret, Heal Bot
- **Save key:** `shadowops_gunconfig` (localStorage)

### Grudge Footsies (`/grudge-footsies`)
1v1 fighting game with skeleton-based avatar rendering.
- **Canvas:** 960x540, CHAR_SCALE=1.05, GROUND_Y=430
- **Rendering:** Skeleton keyframe system (14 joints), `drawSegment()` tapered limbs with joint balls. Avatar parts drawn at skeleton positions. Footsies sprite sheet as optional semi-transparent reference layer (T toggle, `[`/`]` opacity).
- **Combat:** No health bar — one Special hit ends the round. Guard bar (3 blocks). Normal-to-special cancel on hit. Hold+release for specials.
- **Controls:** A/D move, J attack (hold for special), back to guard
- **AI:** 3 randomized CPU opponents with unique styles

### G.K.O. Boxing (`/gko-boxing`)
1v1 cyberpunk boxing with matter.js ragdoll physics, 8 fighters, multi-bar HP, knockdown system.

### Crypt Crawlers (`/dungeon-crawler`)
Top-down dungeon crawler with BSP procedural generation, 10 enemy types, 2 playable characters, mega boss system, equipment/skills.

### Warlord's Gauntlet (`/warlords-gauntlet`)
2D side-scrolling action platformer with 3 heroes, combo attacks, procedural level generation, parallax backgrounds.

### Grove Hunt
Canvas-based resource harvesting mini-game (accessed within RPG flow).

## Development

### Running Locally
```bash
npm install
npm run dev          # Vite dev server on port 5000
npm run start        # Express/Discord server on port 3001
```

### Build
```bash
npm run build        # Outputs to dist/
npm run preview      # Preview production build
```

### Environment Variables (Backend)
- `DISCORD_PUBLIC_KEY` — Discord app public key
- `DISCORD_CLIENT_ID` — Discord OAuth client ID
- `DISCORD_CLIENT_SECRET` — Discord OAuth client secret
- `DISCORD_BOT_TOKEN` / `GAME_API_GRUDA` — Discord bot token
- `DISCORD_CHANNEL_ID` — Beta channel ID
- `DISCORD_BOT_CHANNEL_ID` — Bot channel ID
- `DISCORD_APP_ID` — Discord application ID
- `DISCORD_GUILD_ID` — Discord guild ID
- `XAI_API_KEY` — xAI/Grok API key

### Workflows (Replit)
| Workflow | Command | Port |
|----------|---------|------|
| Start application | `npx --yes vite --host 0.0.0.0 --port 5000` | 5000 |
| Discord API Server | `node server.js` | 3001 |

## External Dependencies
- **React 19** — Frontend library
- **Vite 7** — Dev server and build tool
- **Zustand** — State management
- **Express 5** — Backend server
- **discord.js** — Discord bot/API client
- **matter-js** — 2D physics (GKO Boxing)
- **PixiJS** — WebGL 2D rendering (RPG battles)
- **three.js** — 3D rendering (future use)
- **framer-motion** — React animations
- **@solana/web3.js + spl-token + wallet-adapter** — Solana/GBuX wallet integration
- **openai SDK** — xAI Grok API client
- **jszip** — ZIP file extraction
- **Puter.js** — Free AI, cloud saves, authentication (loaded via CDN)
- **Google Fonts** — Cinzel, Jost, MedievalSharp typography
- **Web Audio API** — Synthesized combat sounds and adaptive music

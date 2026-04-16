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
src/stores/         — Zustand game store (gameStore.js ~2873 lines)
src/data/           — Game data (spriteMap, lore, chapters, skills, heroBestItems, classDefinitions, spriteConstants.js, spriteRegistry.js)
src/utils/          — Utilities (puterService, aiDialogueService, audio, battleLogic.js)
src/hooks/          — Custom hooks (usePuterAI)
src/factory/data/   — Factory game data (factoryBattleSprites.js, objectStoreService.js)
public/images/      — All game art assets
  /races/           — 8 betta breed sprites
  /enemies/         — 30+ enemy sprites
  /buildings/       — Kingdom structure sprites
  /cards/           — TCG-style location card art
  /attributes/      — 8 attribute icons
  /spell_icons/     — Painterly skill/spell icons
  /skills/          — Skill tree icons
public/sprites/     — 147 sprite directories + loose resource sprites (trees, rocks, wheat, etc. used by WorldMap.jsx)
public/backgrounds/ — Battle background images (12+)
public/game-index.html — Standalone promotional landing page (NOT React)
```

### Battle Logic Module (`src/utils/battleLogic.js`)
Extracted from gameStore.js for maintainability and testability. Contains all pure battle computation helpers:
- `createHeroBattleUnit(hero)` — Builds a battle-ready unit from hero data with stats, abilities, passive procs
- `calculateAttackDamage(attacker, defender, ability)` — Full damage pipeline (evasion, defense, crits, blocks, drain, row modifiers)
- `applyEffectToTarget(target, effect, sourceName, log)` — Applies status effects (DOTs, stun, sleep, confuse, debuffs)
- `applyPassiveProcs(attacker, target, result, log, ability)` — Triggers passive skill procs (extra attacks, random debuffs, multi-DOTs)
- `chooseAIAction(unit, allUnits)` — AI decision-making for auto-fight (heals, buffs, transforms, attacks, row movement)
- `getFormationPositions(count, side)` — Formation layout positions for player/enemy teams
- `assignRowsAndPositions(playerTeam, enemyUnits)` — Assigns tactical rows and visual positions
- `recalcRowPositions(units)` — Recalculates positions after unit deaths
- `getHeroStatsWithBonuses(hero)` — Computes hero stats with skill/equipment/enchant/best-item bonuses
- `getHeroSkillBonuses(hero)` — Extracts stat bonuses from unlocked skill tree nodes
- `getSkillTreeAbilities(hero)` — Gets granted abilities from skill tree progression
- `floorTo2(n)` — Utility for 2-decimal floor

### Shared Sprite Constants (`src/data/spriteConstants.js`)
Single source of truth for sprite paths and frame dimensions used by both `spriteRegistry.js` and `factoryBattleSprites.js`:
- `SPRITE_BASE_PATH` — Base path `/sprites`
- `FRAME_SIZES` — Standard dimensions (STANDARD 100x100, SMALL 48x48, MEDIUM 72x72, LARGE 96x96, HERO 128x96, etc.)
- `SPRITE_CATEGORIES`, `SPRITE_GENRES`, `SPRITE_TYPES` — Enum constants
- `HERO_FOLDERS`, `FANTASY_ENEMY_FOLDERS`, `SCIFI_ENEMY_FOLDERS`, etc. — Folder name lists
- `STAGE_BACKGROUNDS`, `GRUDGE_BOX_PORTRAIT_PATH`, `GRUDGE_BOX_FIGHTER_PATH` — Grudge Box asset paths
- `spritePath(folder)`, `spriteAnimPath(folder, animFile)` — Path builder utilities

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

### Crypt Crawlers (`/dungeon-crawler`)
- **Component:** `src/components/DungeonCrawler.jsx` — single-file canvas game
- **Map Generation:** BSP-based room placement on 70×70 grid, room sizes 5-14 tiles, 2-3 tile wide corridors with extra connectivity links
- **Equipment System:** 3 slots (Body, Lower, Weapon), each providing 2 skills to the hotbar
  - Body (skills 1-2): Tattered Vest / Chain Mail / Plate Armor
  - Lower (skills 3-4): Worn Boots / Greaves / Shadow Treads
  - Weapon (skills 5-6): Dagger / Broadsword / War Axe / Arcane Staff / Longbow / Shadow Cannon
  - Each weapon also has a right-click Special ability
- **Hotkeys:** 1-6 skills, 7 items, 8/Tab equipment panel, 9/Esc pause, LMB primary attack (skill 5), RMB weapon special
- **Skill Types:** melee, melee_arc, ranged, ranged_multi, ranged_burst, aoe, ground_aoe, aoe_proj, dash, dash_atk, teleport, heal, buff, shield, speed, dot, spin
- **Equipment Drops:** Enemies drop equipment (12% chance) and potions (20% chance) on death, tier scales with floor
- **Enemies:** 6 types (Slime, Skeleton, Goblin, Demon, Wraith, Dragon) with HP scaling per floor, poison/stun support
- **Traps:** Spikes (periodic), Lightning (periodic), Barrels (proximity-triggered AOE, damages enemies too)
- **Buffs:** Speed, Defense, Damage multiplier, Shield (absorb HP)
- **Assets:** `public/dungeon-crawler/` — hero, enemies, tiles (40), weapons (9), projectiles (22), traps, effects, XP items, portals
- **GUI Assets:** CraftPix cyberpunk pack at `gui/cyberpunk/` (82 frames, 20 skill icons, 8 health + 8 energy bars, 4 cursors, number sprites, 10 button sets, pixel font)
- **GUI Assets:** RPG UI4 pack at `gui/rpg/` (action bar, unit frames, tooltips, windows)
- **UI Data:** `src/data/uiPacks.js` — registry of GUI packs for AI builder reference
- **Custom Assets:** `gui/crypt-logo.png` (horned helmet logo), `gui/crosshair.png` (custom cursor)
- **Visual Effects:** Projectile trails, AOE zone rendering, slash/smoke VFX, enemy poison/stun tinting, shield glow, trap indicators, loot glow, damage numbers

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

### Game Factory Sprite System (`public/sprites/`)
147 sprite directories organized by category. Managed via `src/factory/data/factoryBattleSprites.js` (imports `SPRITE_BASE_PATH` from `src/data/spriteConstants.js`).

**Sprite Resolution Flow:** Enemy name → keyword matching → sprite category → game-specific pool → resolved sprite data with frame dimensions and animation sources.

**Helper Functions:**
- `make(folder, opts)` — Standard lowercase filenames (idle.png, attack1.png, etc.)
- `makeCP(folder, opts)` — CraftPix capitalized filenames (Idle.png, Attack.png, etc.)
- `makeBoss72(folder, prefix, opts)` — 72px fantasy boss format (Prefix_idle.png)
- `makeMine48(folder, prefix, opts)` — 48px mine enemy format (Prefix_attack.png)
- `makeCP48/makeCP96` — CraftPix shortcuts at specific frame sizes

**Shadow Knights (Fantasy) Enemy Sprites:**
- Defaults: skeleton, skeleton-archer, armored-skeleton, greatsword-skeleton, evil-wizard, werewolf, slime
- Mine creatures (48px): wisp, mimic, bear, spider, toadman, toadman-voodoo
- Demon invasion (48px): event-boss (Summoner), minions (Demon1)
- Ruin bosses (72px): ancient, wild-boar, viking
- Desert bosses (72px): anubis, manticore, revived-statue
- Snow bosses (72px): ancient-mech, frost-ooze, magic-bear
- Original boss: boss-demon (288x160px)

**Starbound Corsairs (Sci-fi) Enemy Sprites:**
- Defaults: orc, arcane-archer, armored-orc, crystal-mauler, barbarian-mage, slime
- Cyber police (48px): officer, sergeant, chef, patrol, drone, cannon
- Gang members (48px): brigand, shooter, wallbreaker, shockbot, battledrone, stepper-cannon
- Battle mechas (96px): scout, assault, heavy
- Street bosses (96px): brawler, pyro, bomber (use Attack1.png)
- Lab bosses (72px): mutant, cyborg, mech (use Capitalized filenames)
- Original boss: frost-guardian (192x128px)

**Underwater Sprites (Betta Warlords future use):**
- Sea creatures (48px): eel, crab, archer, jellyfish, anglerfish, shark
- Sea bosses (96px): kraken, leviathan

**VFX Sprites:** slash, fire, fire_anim, flame_small, ice, poison, lightning, heal, shield, magic, explosion, bomb, blood, spark

**Keyword Mapping:** enemyNameKeywords maps ~60+ keywords to sprite categories. bossKeywords provides game-specific boss sprite selection.

**Cyberpunk Skill Icons:** 560 icons at `public/sprites/ui/cyber-icons/` (32x32, Skillicon{1-14}_{01-40}.png), 15 frames at `public/sprites/ui/cyber-frames/`

### Auth Best Practices
- Always check `isPuterAvailable()` before showing Puter buttons
- Handle all three auth paths (Discord/Puter/Guest) gracefully
- `grudge-session` is the single source of truth for current user
- Clean up session on logout from both localStorage and Puter

## 3D Motion Reference Repo (3dmotion)

Cloned at `/tmp/3dmotion` from `github.com/MolochDaGod/3dmotion.git`. A pnpm monorepo containing:

### Artifacts
- **zombie-shooter** — React Three Fiber (R3F) + Rapier physics survival shooter. Full 3D game with TPS/FPS/action camera modes, 7 weapon types (pistol/rifle/sword/axe/staff/bow/shield), 4 skills per weapon, magic spell system, A* navmesh zombie AI, combo melee, dodge/roll, crouch, terrain heightfield, graveyard environment with 21 ruin props, post-processing (Bloom/Vignette/DOF/ChromaticAberration).
- **grudge-pipeline** — Meshy AI Studio for 3D character generation pipeline.
- **mockup-sandbox** — Component mockup previews.
- **api-server** — Shared Express 5 backend with PostgreSQL + Drizzle ORM.

### Key 3D Assets (in zombie-shooter/public/models/)
- `mutant.gltf` + `mutant.bin` + `mutant.jpg` — Mutant enemy model with animations: idle, running, punch, punchStart, punchEnd, fist, jumpAttack, jumpAttackStart, jumpAttackEnd, dash, hit, knockDown, jump
- `character/corsair-king.fbx` — Player character mesh (Mixamo-compatible rig)
- `environment/boss.glb` + `boss.png` — Boss creature model
- `animations/` — FBX animation packs: pistol (15 clips), rifle (12), melee (14 + combos), staff (12), bow (16), shield-sword (12), shared (dodge/react/fall)
- `props/weapons/` — FBX weapon meshes: sword, axe, pistol, rifle, bow, shield, staff variants
- `graveyard/fbx/` — 21 ruin prop models + texture atlas
- `rifle8way/` — 8-directional rifle animations

### Architecture Patterns (for future 3D game work)
1. **R3F + Rapier stack**: `@react-three/fiber`, `@react-three/rapier`, `@react-three/drei`, `@react-three/postprocessing`
2. **Collision layers**: Bitmask groups (WORLD=0x1, PLAYER=0x2, ZOMBIE=0x4, PROJECTILE=0x8) with `interactionGroups(membership, filter)` helper
3. **Capsule collider**: `CapsuleCollider` + `KinematicPositionBased` for player controller
4. **Zombie AI**: Rapier sensor sphere for aggro detection (no physics push), A* navmesh pathfinding via Web Worker, state machine (idle→wander→run→attack→hit→dead)
5. **fadeToAction pattern**: `prev.fadeOut(fadeIn); action.reset().setEffectiveTimeScale(ts).setEffectiveWeight(1).fadeIn(fadeIn).play()`
6. **Animation finish → FSM**: `mixer.addEventListener('finished', onFinished)` drives state transitions
7. **Weapon bone tracking**: Attach Object3D to weapon-tip bone, `getWorldPosition`/`getWorldQuaternion` every frame for hitbox sync
8. **Zustand stores**: useGameStore (game state, camera, weapons, spells), useCharacterStore (stats/progression), useEditorStore (debug), useSettingsStore (quality presets)
9. **Weapon config registry**: Centralized `WEAPON_CONFIGS` record with damage, attackSpeed, range, hitArc, knockback, combo, projectile, trail, camera shake per weapon
10. **Skill system**: 4 skills per weapon, each with animation, cooldown, manaCost, damage, range, arcDeg, hitShape (capsule/sphere/ray), effect type
11. **Asset manifest**: Single `manifest.ts` centralizes all public-folder asset paths

## Dungeon Generator Reference (Adrian104/Dungeon-Generator)

Cloned at `/tmp/dungeon-generator` from `github.com/Adrian104/Dungeon-Generator.git`. A C++17 BSP-based procedural 2D dungeon generator library, MIT licensed.

### Algorithm Pipeline
1. **BSP Tree** — Recursively divides map space into binary cells. Splits along longest axis with configurable randomness (`m_spaceSizeRandomness`). Produces `Tag` objects at cell corners.
2. **Room Placement** — Places rooms within leaf cells. Supports double rooms (L-shaped/T-shaped) via `m_doubleRoomProb`. Sparse areas reduce room density (`m_sparseAreaDens/Prob/Depth`).
3. **Vertex Graph** — Combines `Tag` objects into `Vertex` nodes with 4-directional links (N/E/S/W). Uses radix sort on tag positions for efficient merge.
4. **A* Pathfinding** — Traverses BSP tree postorder, connecting rooms in sibling cells via A* on the vertex graph. Extra paths via `m_extraPathCount/Depth`. Heuristic: Euclidean distance × `m_heuristicFactor`. Path cost reduction via `m_pathCostFactor`.
5. **Vertex Optimization** — Removes unused vertices, merges pass-through vertices (straight E-W or N-S paths) to reduce output size.
6. **Output** — `rooms[]` (Rect: x,y,w,h), `entrances[]` (Point: x,y), `paths[]` (start Point + shift Vec).

### Key Input Parameters
- `m_seed` — xoshiro256+ PRNG (seeded via SplitMix64)
- `m_width/height` — Map dimensions (e.g. 800×800)
- `m_minDepth/maxDepth` — BSP recursion depth (e.g. 7-8 → ~128-256 leaf cells)
- `m_minRoomSize/maxRoomSize` — Room size as fraction of cell (0.45-0.75)
- `m_doubleRoomProb` — Probability of L/T-shaped composite rooms (0.35)
- `m_sparseAreaDepth/Dens/Prob` — Room density reduction in certain BSP branches
- `m_heuristicFactor/pathCostFactor` — A* tuning for path generation
- `m_extraPathCount/Depth` — Additional cross-branch connections
- `m_generateFewerPaths` — Optimize away redundant corridors
- `m_spaceInterdistance` — Corridor width spacing

### Relevance to Crypt Crawlers
Our Crypt Crawlers game already uses BSP dungeon generation. This reference provides a more sophisticated implementation with:
- Double/composite rooms (L-shaped structures)
- Sparse area density control
- A* pathfinding between rooms (vs our simpler corridor carving)
- Vertex graph optimization to minimize corridor geometry
- Seed-based deterministic generation
- Configurable heuristic and path cost factors for varied dungeon layouts

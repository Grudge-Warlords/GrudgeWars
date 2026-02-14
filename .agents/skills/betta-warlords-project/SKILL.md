---
name: betta-warlords-project
description: Core project knowledge for Betta Warlords RPG by Grudge Studios. Use when working on any game feature, UI, battle system, lore, character system, deployment, or Grudge Studios ecosystem integration. Covers architecture, systems, lore, breeds, classes, Grudge Studios relationship, and technical patterns.
---

# Betta Warlords — Project Knowledge

## Grudge Studios Relationship

Betta Warlords is the **first and flagship title** of Grudge Studios. Key facts:

- **Grudge Studios** is the game studio/publisher. Betta Warlords is made FOR the Betta community and runs on Grudge Studios infrastructure.
- **Login/Auth:** Uses Grudge Studios login systems. Currently Discord OAuth (via server.js/server.prod.js) and Puter.js authentication. All auth flows go through Grudge Studios systems.
- **GBuX:** The universal currency across all Grudge Studios titles and AI tools. Players earn GBuX through gameplay (battles, quests, cNFT breeding, exploration).
- **Free AI:** Grudge Studios provides free AI via Puter.js — powers hero dialogue, battle narration, lore generation, NPC personalities, and player-initiated chat. No API key costs to players.
- **cNFT Breeding:** Compressed NFT system where Warlords become on-chain assets. 8 breeds x 4 classes = 32 base cNFT types with breeding for hybrid traits and rare mutations.
- **Exclusive Gateway:** Betta Warlords is the ONLY entry point to early-stage GBuX, cNFT breeding, and Grudge Studios systems. Founding players get permanent benefits.
- **Grudge Logo:** Pirate skull with gold horned frame, located at `public/images/grudge_logo.png`. Gold/orange color scheme.
- **Betta Community Focus:** The game is made for the real-world Betta fish enthusiast community. Breeds are based on IBC (International Betta Congress) show standards. Lore incorporates real betta splendens biology and behavior.

## Architecture

### Stack
- **Frontend:** React 19 + Vite (dev on port 5000, `npx vite --host 0.0.0.0 --port 5000`)
- **State:** Single Zustand store (`src/stores/gameStore.js`)
- **Backend:** Express server — `server.js` (dev, port 3001) and `server.prod.js` (production, port 5000)
- **Deployment:** Autoscale. Build: `npm run build`. Run: `node server.prod.js`. Express 5 requires `'/{*splat}'` wildcard syntax.
- **PWA:** `public/manifest.json` + `public/sw.js` for installable app experience.
- **Landing Page:** `public/game-index.html` — standalone promotional website (not React).

### Key Directories
```
src/components/     — React components (TitleScreen, BattleScreen, WorldMap, etc.)
src/stores/         — Zustand game store
src/data/           — Game data (spriteMap, lore, chapters, skills, heroBestItems)
src/utils/          — Utilities (aiDialogueService, audio)
public/images/      — All game art assets
  /races/           — 8 betta breed sprites (blue, red, purple, white, green, gold, orange, pink)
  /enemies/         — 30+ enemy sprites
  /buildings/       — Kingdom structure sprites
  /cards/           — TCG-style location card art
  /attributes/      — 8 attribute icons
  /spell_icons/     — Painterly skill/spell icons
  /skills/          — Skill tree icons
public/backgrounds/ — Battle background images
```

### Important Patterns
- **Sprite System:** `SpriteAnimation` component handles pixel art with `image-rendering: pixelated`, equipment overlays, transformation effects, and swimming bobbing animation.
- **Sprite Map:** `src/data/spriteMap.js` maps character/enemy names to sprite sheet paths and frame data.
- **Inline Styles:** Primary styling approach is inline styles + CSS variables. No external CSS framework.
- **Font Stack:** Cinzel (headings, serif) + Jost (body, sans-serif) via Google Fonts.
- **Color Palette:** Deep blue (#050a18), Teal (#06b6d4), Cyan (#22d3ee), Purple (#a855f7), Gold (#f59e0b), Red (#ef4444).
- **Mobile:** Fully responsive from 360px+. Use `clamp()` for fluid typography.

## Game Systems

### Character System (32 Warlord Combinations)
**8 Betta Breeds** (real IBC-inspired):
| Breed | Color | Trait | Stats |
|-------|-------|-------|-------|
| Halfmoon | Blue/Cyan | Tidal Flow | +1 All |
| Plakat | Red | Blood Frenzy | +4 STR, +2 VIT |
| Doubletail | Purple | Arcane Depths | +3 INT, +2 DEX |
| Cambodian | White/Silver | Phantom Scales | +3 VIT, +2 END |
| Giant | Green | Reef Fury | +3 STR, +2 AGI |
| Crowntail | Gold | Royal Guard | +3 END, +2 VIT |
| Dragonscale | Orange | Thermal Dash | +3 AGI, +2 STR |
| Butterfly | Pink | Healing Tide | +3 WIS, +2 INT |

**4 Classes:**
| Class | Role | Transform |
|-------|------|-----------|
| Warrior | Frontline tank/DPS | Leviathan Form (1.5x) |
| Mage Priest | Caster/Healer | N/A (Bubble Shield) |
| Worge | Shapeshifter | Shark Form (1.4x) |
| Ranger | Precision striker | Elite Form (1.35x) |

**8 Attributes:** STR, VIT, END, DEX, AGI, INT, WIS, TAC. Levels 0-20.

### Battle System
- **Turn-based** with speed-based initiative
- **4-Row Positioning:** Front / Mid-Front / Mid-Back / Back
- **Guardian Passive:** Front-row units intercept attacks on back-row allies
- **Forward/Back Movement:** Tactical repositioning during combat
- **Skill Effects:** Bleed/Burn/Poison DOTs, Stun/Sleep/Confuse CC, Lower Defense/Attack debuffs, Execute threshold, Armor piercing, Cleanse, Passive procs
- **Big-hit VFX:** Secondary effects for crits and >30 damage hits
- **Transformation Scaling:** Bear 1.5x, Demon 1.4x, Elite 1.35x sprite scale

### Lore — Three Vessels of Magic
1. **Betta (Fire of Will)** — Active. Player-controlled Warlords. The last conscious magic.
2. **Gorgons (Weight of Law)** — Corrupted. Three Siren bosses driven mad.
3. **Plankton (Light of Unity)** — Silent. The central mystery. Why did they go quiet?

**Gorgon Sirens (Bosses):**
- Scylla (Shallows, Lv9) — Gentlest, now strikes with riptide speed
- Medusa (Mid-Waters, Lv17) — Border keeper, lashes at shadows
- Charybdis (Abyss, Lv20) — Devourer, witnessed the Silence

**The Catalyst:** Plankton Magic went silent → Coral Crown shattered → Gorgons went mad → Betta Warlords must restore balance.

### World Map
- **32 locations** across 5 terrain regions (Coral Reefs, Kelp Forests, Volcanic Vents, Frozen Depths, Abyss)
- RTS-style 2D map with zoom/pan
- A* pathfinding, wander areas, curved road paths
- Location popups use TCG card art style
- Each location has vessel connection (Betta/Gorgon/Plankton) and lore quotes

### AI Dialogue (Puter.js)
- Service: `src/utils/aiDialogueService.js`
- Per-hero personality via UUID/SHA identity
- Conversation history logged to Puter KV
- Player style tracking (battles, exploration, trades, healing, boss attempts)
- 40% chance terse 6-7 word responses
- Per-hero 90s cooldown, 2-per-3min rate limit
- Response deduplication (never repeats same sentence)
- Best-item preference system (`src/data/heroBestItems.js`)
- Player-initiated chat via Party Log input
- Fallback to template dialogue when AI unavailable

### Save System
- **Local:** `localStorage` for game state persistence
- **Cloud:** Puter KV for cloud saves
- **State:** Single Zustand store handles all game state

### Economy
- **Pearls:** Primary currency from battles
- **Harvest Resources:** Coral, shells, algae, crystals
- **Reef Hunt Mini-game:** Canvas-based collecting/harvesting

### Chapter System
- 8 chapters following Three Vessels narrative arc
- Objectives: create heroes, explore zones, defeat bosses, unlock skills
- Progress tracking with pearl/XP rewards and lore reveals
- Data: `src/data/chapters.js`, Component: `src/components/ChapterTracker.jsx`

## Technical Notes

- **Express 5 Wildcards:** Use `'/{*splat}'` not `'*'` for catch-all routes in production server
- **Vite Config:** Must set `allowedHosts: true` for Replit proxy compatibility
- **Port 5000:** ONLY the frontend (dev) or production server binds to 5000
- **Discord Server:** Runs on port 3001 in development (separate workflow)
- **Bubble Animations:** CSS custom properties `--wx` for randomized wobble, used on both TitleScreen and game-index.html
- **Sprite Sheets:** Vertical strips need Python extraction to horizontal format for SpriteAnimation compatibility
- **Background Images:** Located in `public/backgrounds/`, mapped to locations in BattleScreen.jsx `locationBackgrounds`
- **Scroll Animations:** IntersectionObserver with `.reveal` / `.reveal-left` / `.reveal-right` / `.reveal-scale` classes

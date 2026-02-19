# Betta Warlords

## Overview
Betta Warlords is an underwater freshwater adventure turn-based RPG built using React, Vite, and Zustand. It features multi-hero tactical battles with betta fish species, allowing players to create and manage a roster of heroes from 8 betta fish species and 4 classes, offering 32 unique Warlord combinations. The game is set in a vast underwater freshwater world with root groves, deep trenches, volcanic vents, and frozen depths. The project aims to provide a rich, immersive gaming experience with a unique aquatic theme and strategic combat. Bettas are freshwater fish — all world-building uses lake/river/freshwater terminology, never ocean/saltwater.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, with an Express backend (server.js) for Discord OAuth and API routes. State management uses a single Zustand store. Styling primarily utilizes inline styles and CSS variables, with a responsive design system supporting multiple breakpoints for mobile playability. Deployment uses autoscale with `server.prod.js` serving both API and static build from `dist/`.

**UI/UX Decisions:**
- **Theme:** Underwater freshwater world with betta fish characters, using a color palette of Teal, Cyan, Purple, and Deep Blue.
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Features pixel art sprites with smooth bobbing animations, particle and beam effects, a 2D world map with zoom/pan, parallax backgrounds in mini-games, and painterly spell icons. UI elements include an ornate game frame, custom RPG bottom bar, and class-specific buff overlays.
- **Screen Flow:** Landing Page (`/` — Game Factory engine showcase with Grudge Studios branding, "Create Your Game" and "Play Betta Warlords" CTAs) → Game Factory (`/factory` — 6-step wizard) OR Betta Warlords (`/play` — Title Screen → Intro Cinematic → Game Lobby → Character Creation → World Map → Location Views → Battle Screens). A farewell screen is displayed on logout.
- **Mobile Responsiveness:** Fully playable on mobile dimensions (360px-480px+) with optimized components and touch targets.

**Technical Implementations:**
- **Character System:** 32 unique Warlord combinations from 8 betta species and 4 classes, each with 8 attributes and 0-20 level progression. Includes IBC-inspired lore for breeds and skill trees re-themed with freshwater/underwater names.
- **Battle System:** Multi-unit tactical combat with speed-based initiative and 4-row positioning (front/mid-front/mid-back/back). Features Forward/Back tactical movement, Guardian passive intercepts, animated class buff overlays, big-hit secondary VFX for crits and high damage (>30), BubbleEmitter ambient effects, and transformation scaling (Bear 3.0x, Demon 2.8x, Elite 2.7x), pixel art explosion impact VFX (11 types: fire, circle, blue, nuclear, gas, etc.) from individual frame PNGs in `public/images/effects/explosions/`. Comprehensive skill effect handling: bleed/burn/poison DOTs, stun/sleep/confuse CC, lower_defense/lower_attack debuffs, execute threshold damage, armor piercing, secondary effects, cleanse, and passive proc system from skill trees.
- **Sprite System:** `SpriteAnimation` component handles pixel art animations with equipment overlays, special transformation effects, and smooth swimming bobbing. Includes a wide array of animated sprites for heroes, bosses (e.g., Gorgon Sirens), and various aquatic creatures.
- **World Map:** RTS-style 2D underwater map with zoom/pan, featuring 32 unlockable locations across 5 freshwater terrain regions. Utilizes A* pathfinding, auto-generated wander areas for hero idle animations, and auto-generated curved road paths between connected nodes. Location popups use TCG card art style with pixel art card backgrounds, vessel connection badges, and lore quotes.
- **Deep Lore System:** Three Vessels of Magic — Betta (Fire of Will), Gorgons (Weight of Law), Plankton (Light of Unity). Game catalyst: the Plankton Magic went silent, shattering the Root Crown and driving the three Gorgon Sirens (Scylla, Medusa, Charybdis) mad. Each location has lore entries with quotes and vessel connections. Data: `src/data/lore.js`. TCG card art assets in `public/images/cards/`.
- **Mini-games:** Includes a "Grove Hunt" canvas-based mini-game with collecting, predators, and resource harvesting, integrating directly into the game's economy.
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music.
- **Economy:** Pearl gain from battles, and a harvest system for resources like root, shells, algae, and crystals.
- **AI Dialogue System:** Real AI-powered hero dialogue via Puter.js free AI. Each hero has unique personality (UUID/SHA identity), conversation history logged to Puter KV, player style tracking (battles, exploration, trades, healing, boss attempts). AI generates contextual dialogue based on game state, zone, triggers, and ally conversations. Enriched with real betta splendens wiki knowledge for authentic fish personalities. Features: response deduplication (never repeats same sentence), 40% chance of terse 6-7 word responses, per-hero 90s cooldown with 2-per-3min rate limiting, best-item preference system per hero (weapon/ring/relic with happiness dialogue and +1 all stats bonus). **Player-initiated chat** via Party Log input sends messages to random party hero for AI response. Fallback to template dialogue when AI unavailable. Service: `src/utils/aiDialogueService.js`, item prefs: `src/data/heroBestItems.js`.
- **Chapter/Story Progression:** 8-chapter story system following the Three Vessels narrative arc. Each chapter has objectives (create heroes, explore zones, defeat bosses, unlock skills) with progress tracking, pearl/XP rewards, and lore reveals. Vessel-focused color theming. Data: `src/data/chapters.js`. Component: `src/components/ChapterTracker.jsx`.
- **Intro Video:** Fullscreen intro cinematic plays on first load with assets loading in background. Skip button appears once assets are ready. Tap-to-play fallback for mobile autoplay restrictions.
- **Discord Integration:** Backend server handles Discord login and webhook broadcasting for in-game events.
- **Save System:** Uses `localStorage` for game state persistence, with cloud save via Puter KV.

## Grudge Studios
Betta Warlords is the first and flagship title of **Grudge Studios**. The game is made FOR the Betta community and runs on Grudge Studios infrastructure.
- **Auth:** Uses Grudge Studios login systems (Discord OAuth + Puter.js authentication)
- **GBuX:** Universal currency (Solana SPL token) across all Grudge Studios titles and AI tools. Token-gated access system with 3 pricing tiers ($10/1000, $25/3000, $50/7500 GBuX). Feature costs: AI generation (100), deployment (200), AI editor (50), image generation (75), custom theme (150). Backend service: `src/services/gbuxService.js`. Frontend: `src/services/gbuxClient.js`, `src/factory/components/GBuxAccess.jsx`, `src/factory/components/GBuxPage.jsx` (`/gbux` route). Server-side Crossmint wallets, GRENCH admin wallet for SPL transfers. Auth: Discord userId verification on sensitive routes.
- **Free AI:** Grudge Studios provides free AI via Puter.js for hero dialogue, battle narration, lore generation, NPC personalities
- **cNFT Breeding:** Compressed NFT system for on-chain Warlord assets (8 breeds x 4 classes = 32 base types)
- **Exclusive Gateway:** Betta Warlords is the ONLY entry point to early-stage GBuX, cNFT breeding, and Grudge Studios systems
- **Grudge Logo:** `public/images/grudge_logo.png` — pirate skull with gold horned frame, gold/orange scheme
- **Promotional Website:** `public/game-index.html` — standalone landing page with PWA install, Web2/Web3 positioning, cNFT/GBuX/Grudge sections
- **PWA:** `public/manifest.json` + `public/sw.js` for installable app experience across all platforms

## Game Factory System (NEW)
The Game Factory is an AI-powered RPG generator that lives alongside Betta Warlords at `/factory`. It abstracts the game's systems into a universal template and lets anyone generate a completely new RPG with a different theme.

**Architecture:**
- **Schema:** `src/factory/schema/gameTemplate.js` — Universal GameTemplate JSON schema defining races, classes, enemies, equipment, skills, lore, chapters, world map, assets
- **Reference Spec:** `src/factory/schema/bettaWarlordSpec.js` — Betta Warlords mapped to the template schema as a reference implementation
- **Form Wizard:** `src/factory/components/FactoryWizard.jsx` — 6-step wizard (Theme, Races, Classes, World/Lore, Art/Style, Generate)
- **AI Content Generator:** `src/factory/generators/specGenerator.js` — Uses Puter.js free AI (gpt-4o-mini) to generate all game content from form inputs
- **Game Preview:** `src/factory/components/GamePreview.jsx` — 12-tab preview of generated game data (Overview, Races, Classes, Enemies, Bosses, Lore, Chapters, World Map, Equipment, Play Battle, Sprite Worker, Raw JSON)
- **Sprite AI Worker:** `src/factory/components/SpriteAIWorker.jsx` — ZIP upload + AI-powered sprite sheet analyzer. Uses JSZip for extraction, Puter.js AI for animation classification, auto-detects frame counts from image dimensions. Features: Groups view (sidebar + detail), Preview viewport (animation playback with controls), Export view (spriteMap-compatible JSON). Accessible from FactoryWizard header button and GamePreview tab.
- **AI Editor:** `src/factory/components/AIEditor.jsx` — Chat-based interface to modify generated game via natural language prompts
- **Puter Deploy:** `src/factory/utils/puterDeploy.js` — One-click deployment of generated game to Puter.com with built-in AI editor

**Features:**
- 8 preset themes (Medieval Knights, Space Pirates, Samurai Cats, Cyberpunk, Mushroom Kingdom, Dinosaur Tribes, Pirate Seas, Steampunk)
- AI generates: races with stat bonuses, classes with abilities, enemies with tiered difficulty, bosses with lore, world map with regions/locations, chapters with objectives, equipment system, skill trees, dialogue templates
- Real-time color palette customization
- Download spec as JSON, save to Puter cloud, deploy to Puter site
- AI editor supports commands like "add a race", "make bosses harder", "change color palette"

## Agent Skills
Comprehensive project knowledge is stored in `.agents/skills/betta-warlords-project/SKILL.md`. This covers architecture, game systems, lore, breeds, classes, Grudge Studios relationship, and all technical patterns.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Express:** Backend server.
- **discord.js:** Discord API client library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game audio.
- **Puter.js:** Free AI, cloud saves (KV), and authentication.
- **JSZip:** ZIP file extraction for Sprite AI Worker.
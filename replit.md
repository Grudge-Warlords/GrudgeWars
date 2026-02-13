# Betta Warlords

## Overview
Betta Warlords is an underwater ocean adventure turn-based RPG built using React, Vite, and Zustand. It features multi-hero tactical battles with betta fish species, allowing players to create and manage a roster of heroes from 8 betta fish species and 4 classes, offering 32 unique Warlord combinations. The game is set in a vast underwater world with coral reefs, deep trenches, volcanic vents, and frozen depths. The project aims to provide a rich, immersive gaming experience with a unique aquatic theme and strategic combat.

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, with an Express backend (server.js) for Discord OAuth and API routes. State management uses a single Zustand store. Styling primarily utilizes inline styles and CSS variables, with a responsive design system supporting multiple breakpoints for mobile playability. Deployment uses autoscale with `server.prod.js` serving both API and static build from `dist/`.

**UI/UX Decisions:**
- **Theme:** Underwater ocean world with betta fish characters, using a color palette of Teal, Cyan, Purple, and Deep Blue.
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Features pixel art sprites with smooth bobbing animations, particle and beam effects, a 2D world map with zoom/pan, parallax backgrounds in mini-games, and painterly spell icons. UI elements include an ornate game frame, custom RPG bottom bar, and class-specific buff overlays.
- **Screen Flow:** Title Screen (ocean background, "BETTA WARLORDS" branding, Dive In/Discord login) → Intro Cinematic → Game Lobby (coral reef city background) → Character Creation → World Map → Location Views → Battle Screens. A farewell screen is displayed on logout.
- **Mobile Responsiveness:** Fully playable on mobile dimensions (360px-480px+) with optimized components and touch targets.

**Technical Implementations:**
- **Character System:** 32 unique Warlord combinations from 8 betta species and 4 classes, each with 8 attributes and 0-20 level progression. Includes IBC-inspired lore for breeds and skill trees re-themed with ocean/underwater names.
- **Battle System:** Multi-unit tactical combat with speed-based initiative and 4-row positioning (front/mid-front/mid-back/back). Features Forward/Back tactical movement, Guardian passive intercepts, animated class buff overlays, big-hit secondary VFX for crits and high damage (>30), BubbleEmitter ambient effects, and transformation scaling (Bear 1.5x, Demon 1.4x, Elite 1.35x). Comprehensive skill effect handling: bleed/burn/poison DOTs, stun/sleep/confuse CC, lower_defense/lower_attack debuffs, execute threshold damage, armor piercing, secondary effects, cleanse, and passive proc system from skill trees.
- **Sprite System:** `SpriteAnimation` component handles pixel art animations with equipment overlays, special transformation effects, and smooth swimming bobbing. Includes a wide array of animated sprites for heroes, bosses (e.g., Gorgon Sirens), and various sea creatures.
- **World Map:** RTS-style 2D underwater map with zoom/pan, featuring 32 unlockable locations across 5 ocean terrain regions. Utilizes A* pathfinding, auto-generated wander areas for hero idle animations, and auto-generated curved road paths between connected nodes. Location popups use TCG card art style with pixel art card backgrounds, vessel connection badges, and lore quotes.
- **Deep Lore System:** Three Vessels of Magic — Betta (Fire of Will), Gorgons (Weight of Law), Plankton (Light of Unity). Game catalyst: the Plankton Magic went silent, shattering the Coral Crown and driving the three Gorgon Sirens (Scylla, Medusa, Charybdis) mad. Each location has lore entries with quotes and vessel connections. Data: `src/data/lore.js`. TCG card art assets in `public/images/cards/`.
- **Mini-games:** Includes a "Reef Hunt" canvas-based mini-game with collecting, predators, and resource harvesting, integrating directly into the game's economy.
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music.
- **Economy:** Pearl gain from battles, and a harvest system for resources like coral, shells, algae, and crystals.
- **AI Dialogue System:** Real AI-powered hero dialogue via Puter.js free AI. Each hero has unique personality (UUID/SHA identity), conversation history logged to Puter KV, player style tracking (battles, exploration, trades, healing, boss attempts). AI generates contextual dialogue based on game state, zone, triggers, and ally conversations. Enriched with real betta splendens wiki knowledge for authentic fish personalities. Features: response deduplication (never repeats same sentence), 40% chance of terse 6-7 word responses, per-hero 90s cooldown with 2-per-3min rate limiting, best-item preference system per hero (weapon/ring/relic with happiness dialogue and +1 all stats bonus). **Player-initiated chat** via Party Log input sends messages to random party hero for AI response. Fallback to template dialogue when AI unavailable. Service: `src/utils/aiDialogueService.js`, item prefs: `src/data/heroBestItems.js`.
- **Chapter/Story Progression:** 8-chapter story system following the Three Vessels narrative arc. Each chapter has objectives (create heroes, explore zones, defeat bosses, unlock skills) with progress tracking, pearl/XP rewards, and lore reveals. Vessel-focused color theming. Data: `src/data/chapters.js`. Component: `src/components/ChapterTracker.jsx`.
- **Intro Video:** Fullscreen intro cinematic plays on first load with assets loading in background. Skip button appears once assets are ready. Tap-to-play fallback for mobile autoplay restrictions.
- **Discord Integration:** Backend server handles Discord login and webhook broadcasting for in-game events.
- **Save System:** Uses `localStorage` for game state persistence, with cloud save via Puter KV.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Express:** Backend server.
- **discord.js:** Discord API client library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game audio.
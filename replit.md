# Grudge Warlords

## Overview
Grudge Warlords is a Final Fantasy 7-inspired turn-based RPG with a dark fantasy aesthetic. It features multi-hero tactical battles, allowing players to create and manage a roster of heroes from 6 races and 4 classes, offering 24 unique Warlord combinations (+ 2 secret heroes). The project aims to deliver a rich RPG experience with deep character customization, tactical combat, and a compelling progression system, including a comprehensive ranked PvP system (GRUDA Arena), God fights, roaming dragon world bosses, and themed dungeons.

## User Preferences
- Clear and concise language. Iterative development with small, testable changes.
- Ask for approval before significant architectural changes or adding new external dependencies.
- All code adheres to modern React practices and maintains a consistent styling approach.
- Use the Grudge attribute system (8 attributes: Strength, Vitality, Endurance, Dexterity, Agility, Intellect, Wisdom, Tactics) — no other stat naming conventions.

## System Architecture
The application features a React 19 frontend built with Vite and an Express backend (`server.js`) handling Discord OAuth, API routes, and static file serving. State management is centralized using a single Zustand store (`src/stores/gameStore.js`). Styling relies on inline styles and CSS variables. The system uses a `vm` target for deployment to support the persistent Discord bot process. The `server.js` dynamically switches between development (port 3001 proxied via Vite on 5000) and production (port 5000 serving built assets from `dist/`) based on `NODE_ENV`.

**Attribute System:**
The game utilizes 8 core Grudge Attributes: Strength, Vitality, Endurance, Dexterity, Agility, Intellect, Wisdom, and Tactics. These attributes, defined in `src/data/attributes.js`, influence over 35 derived battle stats with diminishing returns. A build classification system (Normal to Legendary) is shared from `src/data/classes.js`.

**UI/UX Decisions:**
- **Typography & Visuals:** Employs Cinzel, Jost, and LifeCraft fonts, combined with pixel art sprites, particle/beam effects, a 2D world map with clickable nodes, and animated hero movement. Character cards feature race-specific backgrounds.
- **Screen Flow:** Standard RPG progression from Title to Battle.
- **Game Frame:** Content is wrapped in a full-width/height `.game-frame` container.
- **Z-Index Layering:** A two-context architecture separates content (z-index 10501) from overlays.
- **Game UI Overlay:** A full-screen transparent overlay (`#game-ui-overlay`) for interactive panels, including bottom-aligned chat, hotbar, and war party panels with image-based backgrounds.
- **Custom Cursor:** A Dwarven gauntlet pixel art cursor.

**Technical Implementations:**
- **Character System:** Offers 24 Warlord combinations (6 races × 4 classes) plus 2 secret heroes, each with 8 attributes progressing from levels 0-20.
- **Battle System:** Multi-unit tactical combat on a 2D plane with speed-based initiative, supporting up to 3 heroes against AI enemies. Features context-aware damage numbers, screen shake, AoE abilities, and a row-based positioning system (`src/data/battleRows.js`).
- **Sprite & VFX Systems:** Utilizes a `SpriteAnimation` component for dynamic sprite sheet animations and over 20 custom effect sprite sheets, including class-specific VFX overrides.
- **Game Systems:** Includes an 8-tier equipment upgrade system across 7 slots with a pixel art paper-doll UI, skill trees with node graph layouts, progression systems (training, auto-harvesting, status effects), customizable 5-slot ability loadouts, tier-based loot, 6 potion types, and merchant trading systems.
- **Scene System:** Features 5 interactive scene views (Camp, Dungeon, Trading Post, Open Field, Portal/Void Nexus) with WASD movement and proximity-based interaction prompts.
- **Audio System:** Web Audio API for synthesized combat sounds, file-based SFX, and 7 background music tracks.
- **World Map:** An RTS-style 2D map with zoom/pan, 32 unlockable locations across 5 regions, a dynamic day/night cycle, BFS pathfinding, portal fast travel, and god fights.
- **Roaming Dragon World Boss System:** Two red dragons (Ignaroth, Vyraxes) roam volcanic zones, moving every 30 seconds, triggering encounters. Defeating both unlocks the Mother's Den boss.
- **Cutscene Systems:** Region walk-in cutscenes for first-time region entry and zone cutscenes for all 32 zones, featuring typewriter effects and cinematic fades.
- **Enemy System:** `createRaceClassEnemy` for dynamic enemy generation, unique boss abilities, and themed enemy packs.
- **Economy:** Battle gold and a harvest system, with a Wandering Merchant offering rare items.
- **Hero Roster:** Allows multiple heroes with independent progression.
- **Zone Conquer/Quest System:** 29 zones each with 4 optional quests.
- **Gruda Arena:** A standalone challenge mode for simplified turn-based battles.
- **Discord Integration:** Discord OAuth and a Discord bot (`src/server/discordBot.js`) with 7 slash commands, webhook broadcasting, and a session token system.
- **GRUDA PvP Arena:** Ranked PvP with team snapshots, AI-controlled opponents, PostgreSQL persistence, and a leaderboard UI.
- **Rank Badge System:** `RankBadge.jsx` component for 6 tiers of SVG star badges.
- **Named Hero System:** Specific named heroes like Racalvin the Pirate King (secret unlock) with cinematic unlock videos and rare title screen appearances.
- **Admin Dashboard:** A unified Admin Hub at `/admin` with tabs for Overview, Heroes, World, Systems, and 7 editors (Map, Battle, Sprite, UI Layout, Icon Manager, PvP Placement, Sprite Forge). Includes an Admin Backgrounds editor and an in-game Gizmo for DOM inspection.
- **Game Compendium & Hero Codex:** Static HTML pages providing detailed game data and hero references.
- **Grudge Online Compendium:** In-game component (`GrudgeOnlinePage.jsx`) with 6 tabs covering game mechanics and lore.
- **Viewport & Container System:** A reference resolution of 1280x720 is defined. `GameContainer` (`src/components/GameContainer.jsx`) dynamically injects CSS variables for scaling (`--game-scale`, `--ui-scale`, etc.) via a ResizeObserver. A `useGameViewport()` hook provides viewport dimensions and scale to components.

## External Dependencies
- **React 19**
- **Vite**
- **Zustand**
- **Express**
- **discord.js v14**
- **pg** (for PostgreSQL via Neon DB)
- **Google Fonts** (Cinzel, Jost)
- **CDNFonts CDN** (LifeCraft)
- **Web Audio API**
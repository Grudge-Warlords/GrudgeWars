# Betta Warlords

## Overview
Betta Warlords (formerly Grudge Warlords) is an underwater ocean adventure turn-based RPG built using React, Vite, and Zustand. It features multi-hero tactical battles with betta fish species, allowing players to create and manage a roster of heroes from 8 betta fish species and 4 classes, offering 32 unique Warlord combinations. The game is set in a vast underwater world with coral reefs, deep trenches, volcanic vents, and frozen depths.

## Theme
- **Setting:** Underwater ocean world with betta fish characters
- **Color Palette:** Teal (#22d3ee), Cyan (#06b6d4), Purple (#a855f7), Deep Blue (#041225)
- **Breeds:** Halfmoon (blue_betta), Plakat (red_betta), Doubletail (purple_betta), Cambodian (white_betta), Giant (green_betta), Crowntail (gold_betta), Dragonscale (orange_betta), Butterfly (pink_betta)
- **Currency:** Pearls (formerly gold)
- **Resources:** Coral (wood), Shells (ore), Algae (herbs), Crystals, Pearls
- **Enemies:** Sea creatures (Reef Bandit, Mantis Shrimp, Ink Sorcerer, Hammerhead Brute, Kraken Lich, Sea Drake, Leviathan, etc.)
- **Locations:** 32 underwater zones (Coral Shallows, Kelp Forest, Sunken Citadel, Hadal Trench, Volcanic Hearth, Leviathan's Wake, etc.)
- **Cities:** Reef Camp, Shell Fortress, Ink Haven, Vent City, Crystal Spire
- **Final Boss:** The Abyss King (formerly The Void King)
- **Gods:** Poseidon (Lord of Tides), Charybdis (The Devourer), The Leviathan (Weaver of Currents)

## Recent Changes
- **2026-02-12:** Game Index wiki page comprehensive update
  - Rewrote `public/game-index.html` with all 32 zones (added 11 missing zones), node images from `/map_nodes/`
  - Added Buildings section (16 structures with images from `/images/buildings/`)
  - Added Attributes section (8 hero stats with images from `/images/attributes/`)
  - City cards now show banner images from `/backgrounds/`
  - Updated class ability icons to use painterly spell icons from `/icons/spells/`
  - Fixed all remaining medieval references ("Grudge Wars" → "First Tide War", etc.)
  - Updated navigation with Buildings and Attributes links
  - Fixed god zone naming (Leviathan Sanctum with subtitle)
- **2026-02-12:** Mobile responsiveness + painterly spell icons
  - Made game fully playable on phone dimensions (360px-480px+)
  - Added 358 painterly spell icons (256x256 PNG) to `public/icons/spells/`
  - Filled all 24+ null ability icon entries in `abilityIcons.js` with mapped painterly icons
  - Fixed icon cutoff: AbilityIcon uses `objectFit: 'contain'` instead of `cover`
  - Created `src/hooks/useIsMobile.js` with `useIsMobile()` and `useViewport()` hooks
  - Added CSS responsive system with variables (--ui-scale, --btn-min, --font-base, etc.)
  - 5 responsive breakpoints: 900px, 768px, 640px, 480px, max-height 500px
  - Mobile-optimized 13 components: BattleScreen, WorldMap, MapBottomBar, GameUIOverlay, LobbyScreen, AccountPage, LocationView, CampScene, CharacterCreate, CharacterSheet, HeroCreate, TitleScreen, LootPopup
  - Touch targets: minimum 36-44px on all interactive elements
  - Responsive panel widths: `maxWidth: calc(100vw - 16px)` on mobile
  - Stacking layouts on narrow screens, horizontal scrolling for tabs
  - Updated viewport meta for mobile (no zoom, viewport-fit=cover)
- **2026-02-12:** Gorgon Siren zone boss sprites
  - Extracted 3 Gorgon Siren sprite sets from craftpix pack (128x128 frames)
  - Gorgon_1 (purple/original), Gorgon_2 (red variant), Gorgon_3 (teal hue-shifted from Gorgon_1)
  - 10 animations per siren: idle (7f), idle2 (5f), walk (13f), run (7f), attack1 (16f), attack2 (7f), attack3 (10f), hurt (3f), death (3f), special (5f)
  - Mapped to 3 god-tier bosses: Poseidon (gorgon_siren_1), Charybdis (gorgon_siren_2), Leviathan (gorgon_siren_3)
  - Custom CSS boss aura effects per siren: purple pulse, red/orange rotate, teal shimmer with hue cycling
  - Floating crown icon above gorgon bosses in battle
  - Battle system uses `special` animation for buff abilities when available
  - Random attack animation selection (attack1/2/3) for visual variety in combat
- **2026-02-12:** Reef Hunt parallax + surface leap mechanics
  - Added 3-layer parallax background: far mountains (0.2x scroll), mid reef tiles (0.5x), foreground (1.0x)
  - Procedural mountain silhouettes with ocean depth gradient in far layer
  - Surface jump "dolphin leap" mechanic: Space bar near surface launches fish into air
  - Air physics: gravity pulls fish back, reduced horizontal control, max 3s air time
  - Air collectibles above surface: air bubbles (+20 energy), seagull drops (+3 pearls), flying fish (+100 score)
  - Splash particles on surface crossing, leap trail particles while airborne, fish tilts with velocity
  - Sky gradient with cloud wisps above surface, animated wave line at water surface
  - "SPACE to Leap!" prompt near surface, "Returning to water!" warning when air time low
  - Updated reef_hunt_bg.png with new coral platform art
- **2026-02-12:** Reef Hunt mini-game, Character Power fix
  - Added Odell Down Under-inspired "Reef Hunt" mini-game accessible from Camp Scene
  - Canvas-based mini-game with requestAnimationFrame loop: fish follows mouse cursor, click to collect food/resources
  - 8 collectible types (pearls, algae, coral, shells, crystals, plankton, shrimp, starfish) with weighted spawning
  - 3 predator types (shark, eel, jellyfish) with wander/chase AI that drain energy on contact
  - Energy timer system (45s + energy drain), combo multiplier, size-up progression (collect 15 items = bigger fish)
  - Starfish grants temporary "Lucky Catch" buff (+20% rare drops for 3 battles)
  - Resources earned feed directly into existing harvest/economy system via `addForageRewards` store action
  - Reef Hunt node added to CampScene at position (55, 35)
  - Fixed Character Power panel (GameUIOverlay + MapBottomBar) to use correct 8 attributes and calculateCombatPower
- **2026-02-12:** Main menu background, farewell screen, equip panel alignment
  - Updated TitleScreen to use new "A Betta Coinmunity" promotional art as background (`/backgrounds/main_menu_bg.png`)
  - Added farewell screen overlay on logout showing main menu art with "Until Next Tide..." message for 2.5s before returning to title
  - Updated equip_panel_small slot positions in AccountPage and BattleScreen to match updated 67x79px panel artwork
  - Added Rest node (sleeping bag) and Inventory chest to CampScene with full UI panels
  - Rest node heals entire party via `restAtCamp()` store action; shows individual hero health bars
  - Inventory chest opens side panel with Equipment/Consumables tabs, equip-to-hero, sell, and drop actions
- **2026-02-12:** IBC breed system, class buff overlays, new enemy sprites, motion tuning
  - Renamed "Race" → "Breed" across all UI (CharacterCreate, HeroCreate, LobbyScreen, AccountPage, AdminSprite, TitleScreen)
  - Updated 8 breeds with IBC betta terminology: Halfmoon, Plakat, Doubletail, Cambodian, Giant, Crowntail, Dragonscale, Butterfly
  - Added IBC-inspired lore (tail types, fault system, genetic rarity) to all breed descriptions
  - Created 24 animated class buff overlays (4 classes × 6 hue variants) with pulse/shimmer/ring CSS animations
  - Added `getClassBuffClass()` utility for applying class-colored aura overlays to hero sprites in battle
  - Added 6 underwater boss sprites (48x48): angler, seahorse, pufferfish_boss, jellyfish_boss, crab_boss, turtle_boss
  - Added 8 GIF character sprites (128x128 converted to strips): green_fish, pink_fish, jellyfish, starfish, tadpole, worm, egg, boot
  - Remapped all 36+ enemy types to use expanded sprite library with boss/character/fish tiers
  - Slowed NPC fish movement by 20% and increased wander area for more realistic swimming
  - Increased hero wander jitter range on world map for wider fish-like movement
  - NpcSprite now accepts `onPositionUpdate` callback for chat bubble anchoring
- **2026-02-12:** AI pathfinding, auto-generated node areas, deployment prep
  - Replaced BFS pathfinding with A* (distance-weighted) for optimal route calculation between map nodes
  - Created `src/utils/mapPathfinding.js` utility module with A* algorithm, wander area generator, and road path generator
  - Auto-generated walking areas (wander polygons) for all 32 locations + 5 cities so heroes always have areas to roam
  - Auto-generated curved road paths between all connected nodes (rendered as subtle teal SVG lines on the map)
  - Walking areas and roads serve as defaults; custom localStorage data takes priority when available
  - Route network now uses auto-generated roads as fallback for hero walk-along-path animations
  - Updated Combat Power/Build Rating layout to match original (space-between positioning)
  - Configured autoscale deployment: `npm run build` → `node server.prod.js` serving dist/ + API
- **2026-02-12:** Major update - fish sprite improvements, new world map, complete lore overhaul
  - Fixed fish sprite bottom cutoff by adding overflow:visible and swim padding to SpriteAnimation
  - Added smooth swimming bobbing animation (fishBob/fishSwim CSS keyframes) for all fish sprites
  - Slowed fish idle/walk animation speed for natural swimming feel
  - Added `swimming: true` flag to all fish sprite definitions for automatic animation behavior
  - Replaced world map background with new underwater crystal/coral temple scene
  - Repositioned all 32 location nodes and 5 cities for new map layout
  - Updated terrain regions to match new map geography
  - Complete lore overhaul: "The Sunken Kingdom of Abyssia" story framework
  - Rewrote all 32 location descriptions with underwater atmosphere and Coral Crown narrative
  - Renamed locations to fit underwater theme (Sunken Citadel, Leviathan's Wake, Hadal Trench, etc.)
  - Updated all enemy display names to sea creatures (Reef Bandit, Mantis Shrimp, Hammerhead Brute, etc.)
  - Rewrote all mission and arena templates with underwater lore
  - Expanded from 6 to 8 betta species with dedicated fish sprites
  - Added Ember Scale (orange_betta) and Coral Dancer (pink_betta) races
  - Updated all UI text to reflect "8 Species / 32 Warlord Combinations"
- **2026-02-11:** Complete re-theme from medieval fantasy to underwater betta fish ocean adventure
  - Generated 30+ AI ocean backgrounds and 20+ underwater map node images
  - Re-themed all 6 races to betta fish species with new portraits
  - Re-themed 32 locations to underwater zones
  - Re-themed 31+ enemy types to sea creatures
  - Updated CSS color palette to aquatic teal/cyan/purple
  - Updated all UI branding from "Grudge Warlords" to "Betta Warlords"
  - Updated title screen, loading screen, lobby, and world map
  - Updated Discord webhook branding

## User Preferences
I want the agent to use clear and concise language. I prefer iterative development with small, testable changes. Before making any significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all code adheres to modern React practices and maintains a consistent styling approach.

## System Architecture
The application is a React 19 frontend developed with Vite, with an Express backend (server.js) for Discord OAuth and API routes. State management uses a single Zustand store. Styling utilizes inline styles and CSS variables. Deployment uses autoscale with `server.prod.js` serving both API and static build from `dist/`.

**UI/UX Decisions:**
- **Typography & Visuals:** Uses Cinzel (headings) and Jost (body) fonts. Visuals include pixel art sprites, particle and beam effects, a 2D world map with clickable nodes, and animated hero movement. War Council tabs feature unique ocean backgrounds, and hero card sprites are scaled for visual impact.
- **Screen Flow:** Title Screen (ocean background, "BETTA WARLORDS" branding, Dive In/Discord login) → Intro Cinematic → Game Lobby (coral reef city background) → Character Creation → World Map → Location Views → Battle Screens.
- **Game Frame & Layout:** The application is wrapped in a `.game-frame` class with an ornate border frame overlay at z-index 10500.
- **Map Bottom Bar (MapBottomBar.jsx):** Custom RPG bottom bar with Party Log, icon buttons, and War Party display.

**Technical Implementations:**
- **Character System:** 32 unique Warlord combinations across 8 betta species and 4 classes, with 8 attributes and 0-20 level progression.
- **Battle System:** Multi-unit tactical combat with speed-based initiative, up to 3 active heroes against AI enemies.
- **Sprite System:** SpriteAnimation component for pixel art animations with equipment overlays and special transformation effects.
- **World Map:** RTS-style 2D underwater map with zoom/pan, 32 unlockable locations across 5 ocean terrain regions. Features A* pathfinding (`src/utils/mapPathfinding.js`), auto-generated wander areas for hero idle animations, and auto-generated curved road paths between connected nodes.
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music.
- **Economy:** Pearl gain from battles, harvest system for resource nodes (coral, shells, algae, crystals, pearls).
- **Discord OAuth & Webhooks:** Backend server handles Discord login and webhook broadcasting.
- **Save System:** localStorage key: `grudge-warlords-save` (kept for backward compatibility).

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool, with proxy to backend in dev.
- **Zustand:** State management library.
- **Express:** Backend server for Discord OAuth API routes.
- **discord.js:** Discord API client library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game sound effects and music.

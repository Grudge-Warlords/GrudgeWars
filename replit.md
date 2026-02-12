# Betta Warlords

## Overview
Betta Warlords (formerly Grudge Warlords) is an underwater ocean adventure turn-based RPG built using React, Vite, and Zustand. It features multi-hero tactical battles with betta fish species, allowing players to create and manage a roster of heroes from 8 betta fish species and 4 classes, offering 32 unique Warlord combinations. The game is set in a vast underwater world with coral reefs, deep trenches, volcanic vents, and frozen depths.

## Theme
- **Setting:** Underwater ocean world with betta fish characters
- **Color Palette:** Teal (#22d3ee), Cyan (#06b6d4), Purple (#a855f7), Deep Blue (#041225)
- **Races:** Blue Veil (blue_betta), Crimson Fang (red_betta), Mystic Fin (purple_betta), Ghost Tide (white_betta), Reef Striker (green_betta), Crown Tail (gold_betta), Ember Scale (orange_betta), Coral Dancer (pink_betta)
- **Currency:** Pearls (formerly gold)
- **Resources:** Coral (wood), Shells (ore), Algae (herbs), Crystals, Pearls
- **Enemies:** Sea creatures (Reef Bandit, Mantis Shrimp, Ink Sorcerer, Hammerhead Brute, Kraken Lich, Sea Drake, Leviathan, etc.)
- **Locations:** 32 underwater zones (Coral Shallows, Kelp Forest, Sunken Citadel, Hadal Trench, Volcanic Hearth, Leviathan's Wake, etc.)
- **Cities:** Reef Camp, Shell Fortress, Ink Haven, Vent City, Crystal Spire
- **Final Boss:** The Abyss King (formerly The Void King)
- **Gods:** Poseidon (Lord of Tides), Charybdis (The Devourer), The Leviathan (Weaver of Currents)

## Recent Changes
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

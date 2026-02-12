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
- **Battle System:** Multi-unit tactical combat with speed-based initiative, supporting up to 3 active heroes against AI enemies. Features animated class buff overlays and varied enemy sprite animations.
- **Sprite System:** `SpriteAnimation` component handles pixel art animations with equipment overlays, special transformation effects, and smooth swimming bobbing. Includes a wide array of animated sprites for heroes, bosses (e.g., Gorgon Sirens), and various sea creatures.
- **World Map:** RTS-style 2D underwater map with zoom/pan, featuring 32 unlockable locations across 5 ocean terrain regions. Utilizes A* pathfinding, auto-generated wander areas for hero idle animations, and auto-generated curved road paths between connected nodes.
- **Mini-games:** Includes a "Reef Hunt" canvas-based mini-game with collecting, predators, and resource harvesting, integrating directly into the game's economy.
- **Audio System:** Web Audio API for synthesized combat sounds and adaptive background music.
- **Economy:** Pearl gain from battles, and a harvest system for resources like coral, shells, algae, and crystals.
- **Discord Integration:** Backend server handles Discord login and webhook broadcasting for in-game events.
- **Save System:** Uses `localStorage` for game state persistence.

## External Dependencies
- **React:** Frontend library.
- **Vite:** Development server and build tool.
- **Zustand:** State management library.
- **Express:** Backend server.
- **discord.js:** Discord API client library.
- **Google Fonts:** For Cinzel and Jost fonts.
- **Web Audio API:** For in-game audio.
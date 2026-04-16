export const SPRITE_BASE_PATH = '/sprites';

export const FRAME_SIZES = {
  STANDARD: { w: 100, h: 100 },
  SMALL: { w: 48, h: 48 },
  MEDIUM: { w: 72, h: 72 },
  LARGE: { w: 96, h: 96 },
  HERO: { w: 128, h: 96 },
  BOSS_DEMON: { w: 288, h: 160 },
  MEGA_BOSS: { w: 256, h: 256 },
  GRUDGE_BOX: { w: 64, h: 64 },
  SHIP: { w: 64, h: 64 },
};

export const ANIM_NAMES = {
  IDLE: 'idle',
  WALK: 'walk',
  ATTACK1: 'attack1',
  ATTACK2: 'attack2',
  HURT: 'hurt',
  DEATH: 'death',
  CAST: 'cast',
  RUN: 'run',
  SHOT: 'shot',
};

export const SPRITE_CATEGORIES = {
  HEROES: 'heroes',
  ENEMIES: 'enemies',
  BOSSES: 'bosses',
  SEA_CREATURES: 'sea-creatures',
  SHIPS: 'ships',
  EFFECTS: 'effects',
  GRUDGE_BOX_FIGHTERS: 'grudge-box-fighters',
  UI: 'ui',
};

export const SPRITE_GENRES = {
  FANTASY: 'fantasy',
  SCIFI: 'scifi',
  UNDERWATER: 'underwater',
  CYBERPUNK: 'cyberpunk',
  SPACE: 'space',
};

export const SPRITE_TYPES = {
  HERO: 'hero',
  ENEMY: 'enemy',
  BOSS: 'boss',
  VFX: 'vfx',
  SHIP: 'ship',
  FIGHTER: 'fighter',
  NPC: 'npc',
};

export const HERO_FOLDERS = [
  'dark-knight', 'fire-knight', 'wizard', 'necromancer', 'knight',
  'knight-templar', 'priest', 'lancer', 'martial-hero', 'medieval-warrior-3',
  'fantasy-warrior', 'swordsman', 'soldier', 'shadow-warrior', 'wind-hashashin',
  'leaf-ranger', 'elf-ranger', 'human-ranger', 'dwarf-ranger', 'barbarian-ranger',
  'barbarian-warrior', 'nightborne', 'loreon-knight', 'forest-guardian', 'nature-elemental',
  'water-elementinal', 'water-priestess', 'werebear', 'demon-sword',
];

export const FANTASY_ENEMY_FOLDERS = [
  'skeleton', 'skeleton-archer', 'armored-skeleton', 'greatsword-skeleton',
  'evil-wizard', 'evil-wizard-2', 'werewolf', 'slime', 'arcane-archer',
  'orc', 'elite-orc', 'armored-orc', 'orc-rider', 'crystal-mauler',
  'barbarian-mage', 'armored-axeman',
];

export const SCIFI_ENEMY_FOLDERS = [
  'cyber-police-officer', 'cyber-police-sergeant', 'cyber-police-chef',
  'cyber-police-patrol', 'cyber-police-drone', 'cyber-police-cannon',
  'gang-brigand', 'gang-shooter', 'gang-wallbreaker', 'gang-shockbot',
  'gang-battledrone', 'gang-stepper-cannon',
  'mecha-scout', 'mecha-assault', 'mecha-heavy',
];

export const SEA_CREATURE_FOLDERS = [
  'sea-eel', 'sea-crab', 'sea-archer', 'sea-jellyfish', 'sea-anglerfish', 'sea-shark',
];

export const SEA_BOSS_FOLDERS = [
  'sea-boss-kraken', 'sea-boss-leviathan', 'sea-boss-serpent',
];

export const SHIP_FOLDERS = [
  'alien_ship1', 'alien_ship2', 'alien_ship3', 'alien_ship4', 'alien_ship5', 'alien_ship6',
  'pirate_ship1', 'pirate_ship2', 'pirate_ship3', 'pirate_ship4', 'pirate_ship5', 'pirate_ship6',
];

export const STAGE_BACKGROUNDS = {
  UNDERGROUND: '/sprites-attacks/grudge-box/stages/underground.png',
  ROOFTOP: '/sprites-attacks/grudge-box/stages/rooftop.png',
  STREET: '/sprites-attacks/grudge-box/stages/street.png',
  ARENA: '/sprites-attacks/grudge-box/stages/arena.png',
  FACTORY: '/sprites-attacks/grudge-box/stages/factory.png',
};

export const GRUDGE_BOX_PORTRAIT_PATH = '/sprites-attacks/grudge-box/portraits';
export const GRUDGE_BOX_FIGHTER_PATH = '/sprites/grudge-box/fighters';

export function spritePath(folder) {
  return `${SPRITE_BASE_PATH}/${folder}`;
}

export function spriteAnimPath(folder, animFile) {
  return `${SPRITE_BASE_PATH}/${folder}/${animFile}`;
}

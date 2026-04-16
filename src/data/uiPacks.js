export const UI_PACKS = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Craftpix',
    description: 'Neon-styled cyberpunk GUI with bars, frames, skill icons, buttons, cursors, and number sprites',
    basePath: '/dungeon-crawler/gui/cyberpunk',
    font: 'CyberpunkCraftpixPixel.otf',
    assets: {
      bars: {
        health: Array.from({ length: 8 }, (_, i) => `bars/HealthBar${i + 1}.png`),
        energy: Array.from({ length: 8 }, (_, i) => `bars/EnergyBar${i + 1}.png`),
        scrolling: Array.from({ length: 4 }, (_, i) => `bars/Scrolling${i + 1}.png`),
      },
      frames: Array.from({ length: 82 }, (_, i) => `frames/Frame_${String(i + 1).padStart(2, '0')}.png`),
      skillIcons: Array.from({ length: 20 }, (_, i) => `skill-icons/Skillicon7_${String(i + 1).padStart(2, '0')}.png`),
      cursors: Array.from({ length: 4 }, (_, i) => `cursors/${i + 1}.png`),
      numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'dot', 'comma', 'plus', 'B', 'K', 'M'].map(n => `numbers/${n}.png`),
      buttons: {
        sets: 10,
        path: (set, variant) => `buttons/${set}/${variant}.png`,
      },
      decor: 'decor/',
    },
    usage: {
      hotbar: 'Use frames/Frame_01-10 as slot backgrounds, skill-icons as slot content',
      healthBar: 'Layer: HealthBar1 (frame) + HealthBar2-8 (fill states) for animated HP bar',
      energyBar: 'Layer: EnergyBar1 (frame) + EnergyBar2-8 (fill states) for mana/energy bar',
      damageNumbers: 'Render numbers/0-9.png as sprite-based damage popups',
      cursor: 'Use cursors/1-4.png as custom cursor (CSS cursor property)',
      skillSlots: 'Combine Frame_01 background + Skillicon7_XX.png overlay for skill hotbar slots',
      panels: 'Use Frame_60+ for larger panel backgrounds (equipment, inventory, pause menu)',
    },
  },
  rpg: {
    id: 'rpg',
    name: 'RPG MMO UI4',
    description: 'Traditional RPG/MMO styled UI with action bars, unit frames, tooltips, and windows',
    basePath: '/dungeon-crawler/gui/rpg',
    assets: {
      actionBar: {
        background: 'action-bar/ActionBar_Background.png',
        slots: 'action-bar/',
        globes: 'action-bar/',
        buttons: 'action-bar/',
        arrows: 'action-bar/',
      },
      unitFrames: {
        base: 'unit-frames/',
        avatar: 'unit-frames/',
        bars: 'unit-frames/',
        level: 'unit-frames/',
        orbs: 'unit-frames/',
        roles: 'unit-frames/',
      },
      character: {
        example: 'character/Character_Example.png',
        slotIcons: 'character/',
      },
      castBar: 'cast-bar/',
      xpBar: 'xp-bar/',
      tooltip: 'tooltip/',
      window: 'window/',
    },
    usage: {
      actionBar: 'Bottom HUD with slot backgrounds for skill/item hotbar',
      unitFrame: 'Player/enemy health/mana display with portrait and level',
      tooltip: 'Hover info panels for items, skills, and equipment',
      window: 'Reusable panel backgrounds for menus, inventory, and dialogs',
    },
  },
};

export const CRYPT_CRAWLERS_UI = {
  hotbar: {
    slots: 7,
    layout: [
      { index: 0, type: 'skill', source: 'body', label: '1' },
      { index: 1, type: 'skill', source: 'body', label: '2' },
      { index: 2, type: 'skill', source: 'lower', label: '3' },
      { index: 3, type: 'skill', source: 'lower', label: '4' },
      { index: 4, type: 'skill', source: 'weapon', label: '5' },
      { index: 5, type: 'skill', source: 'weapon', label: '6' },
      { index: 6, type: 'item', label: '7' },
    ],
  },
  equipmentSlots: ['body', 'lower', 'weapon'],
  specialInput: {
    rightClick: 'weapon_special',
    tab: 'toggle_equipment',
    escape: 'pause',
  },
  colorScheme: {
    primary: '#06b6d4',
    secondary: '#fbbf24',
    accent: '#a855f7',
    danger: '#ef4444',
    success: '#22c55e',
    background: '#050a18',
    panel: '#0f172a',
  },
};

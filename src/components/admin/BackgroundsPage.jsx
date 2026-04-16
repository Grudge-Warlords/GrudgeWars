import React, { useState } from 'react';

const battleBackgrounds = [
  {
    file: 'ocean_battle_new.png',
    name: 'Shallow Waters Battle',
    description: 'Bright root grove waters — the default shallow zone battlefield.',
    overlay: null,
    locations: [
      { id: 'coral_shallows', name: 'Root Shallows', enemies: ['Grove Bandit', 'Barnacle Warrior', 'Mantis Shrimp'] },
      { id: 'anemone_garden', name: 'Anemone Garden', enemies: ['Grove Bandit', 'Barnacle Warrior'] },
      { id: 'tide_stream', name: 'Current Stream', enemies: ['Grove Bandit', 'Mantis Shrimp'] },
      { id: 'clam_beds', name: 'Clam Beds', enemies: ['Barnacle Warrior'] },
      { id: 'verdant_plains', name: 'Verdant Plains', enemies: ['Grove Bandit', 'Mantis Shrimp'] },
    ],
    context: 'training',
  },
  {
    file: 'kelp_battle.png',
    name: 'Kelp Forest Battle',
    description: 'Dense underwater kelp canopy — mid-tier exploration zones.',
    overlay: null,
    locations: [
      { id: 'kelp_forest', name: 'Kelp Forest', enemies: ['Shadow Eel', 'Ink Sorcerer'] },
      { id: 'sargasso_maze', name: 'Sargasso Maze', enemies: ['Shadow Eel', 'Kelp Giant'] },
      { id: 'shadow_forest', name: 'Shadow Forest', enemies: ['Shadow Eel', 'Shadow Manta'] },
      { id: 'dark_forest', name: 'Dark Forest', enemies: ['Shadow Eel', 'Ink Sorcerer'] },
      { id: 'thornwood_pass', name: 'Thornwood Pass', enemies: ['Shadow Eel'] },
      { id: 'mystic_grove', name: 'Mystic Grove', enemies: ['Ink Sorcerer', 'Root Priestess'] },
    ],
  },
  {
    file: 'biolume_battle.png',
    name: 'Bioluminescent Battle',
    description: 'Glowing deepwater caves illuminated by living light.',
    overlay: null,
    locations: [
      { id: 'jellyfish_drift', name: 'Jellyfish Drift', enemies: ['Jellyfish', 'Water Elemental'] },
      { id: 'biolume_caves', name: 'Biolume Caves', enemies: ['Water Elemental', 'Jellyfish'] },
      { id: 'crystal_grotto', name: 'Crystal Grotto', enemies: ['Nature Elemental', 'Stone Guardian'] },
      { id: 'blight_hollow', name: 'Blight Hollow', enemies: ['Shadow Manta', 'Ink Sorcerer'] },
      { id: 'crystal_caves', name: 'Crystal Caves', enemies: ['Stone Guardian', 'Nature Elemental'] },
      { id: 'whispering_caverns', name: 'Whispering Caverns', enemies: ['Ink Sorcerer', 'Water Elemental'] },
    ],
  },
  {
    file: 'shipwreck_battle.png',
    name: 'Shipwreck Battle',
    description: 'Rusted hulls and rotting timbers — haunted wreckage zones.',
    overlay: null,
    locations: [
      { id: 'sunken_wreck', name: 'Sunken Wreck', enemies: ['Barnacle Warrior', 'Abyssal Knight'] },
      { id: 'shipwreck_graveyard', name: 'Shipwreck Graveyard', enemies: ['Abyssal Knight', 'Shadow Eel'] },
      { id: 'haunted_marsh', name: 'Haunted Marsh', enemies: ['Shadow Eel', 'Ink Sorcerer'] },
    ],
  },
  {
    file: 'sunken_temple_battle.png',
    name: 'Sunken Temple Battle',
    description: 'Ancient submerged temple ruins with mystical energy.',
    overlay: null,
    locations: [
      { id: 'pearl_gate', name: 'Pearl Gate', enemies: ['Stone Guardian', 'Root Priestess'] },
      { id: 'sunken_temple', name: 'Sunken Temple', enemies: ['Stone Guardian', 'Water Priestess'] },
      { id: 'ancient_ruins', name: 'Ancient Ruins', enemies: ['Stone Guardian', 'Abyssal Knight'] },
      { id: 'cursed_ruins', name: 'Cursed Ruins', enemies: ['Abyssal Knight', 'Ink Sorcerer'] },
      { id: 'ruins_of_ashenmoor', name: 'Ruins of Ashenmoor', enemies: ['Abyssal Knight', 'Shadow Eel'] },
      { id: 'hall_of_odin', name: 'Hall of Odin', enemies: ['Stone Guardian', 'Frost Titan'] },
    ],
    context: 'dungeon-boss-default',
  },
  {
    file: 'deep_trench_battle.png',
    name: 'Deep Trench Battle',
    description: 'Crushing abyssal depths — the darkest zones of the waters.',
    overlay: null,
    locations: [
      { id: 'abyssal_trench', name: 'Abyssal Trench', enemies: ['Water Serpent', 'Shadow Manta'] },
      { id: 'leviathan_lair', name: 'Leviathan Lair', enemies: ['Leviathan', 'Water Serpent'] },
      { id: 'void_threshold', name: 'Void Threshold', enemies: ['Void Sentinel', 'Shadow Manta'] },
      { id: 'corrupted_spire', name: 'Corrupted Spire', enemies: ['Void Sentinel', 'Ink Sorcerer'] },
      { id: 'abyssal_depths', name: 'Abyssal Depths', enemies: ['Water Serpent', 'Void Sentinel'] },
      { id: 'shadow_citadel', name: 'Shadow Citadel', enemies: ['Shadow Manta', 'Abyssal Knight'] },
      { id: 'dreadmaw_canyon', name: 'Dreadmaw Canyon', enemies: ['Water Serpent', 'Shadow Eel'] },
      { id: 'maw_of_madra', name: 'Maw of Madra', enemies: ['Void Sentinel', 'Shadow Manta'] },
    ],
    context: 'dungeon-void',
  },
  {
    file: 'volcanic_battle.png',
    name: 'Volcanic Battle',
    description: 'Scorching thermal vents and molten rock — fire-themed zones.',
    overlay: 'volcanic_battle_overlay.png',
    clean: 'volcanic_battle_clean.png',
    locations: [
      { id: 'thermal_vent', name: 'Thermal Vent', enemies: ['Lobster Warlord', 'Swordfish Knight'] },
      { id: 'molten_core', name: 'Molten Core', enemies: ['Lobster Warlord', 'Demon Lord'] },
      { id: 'blood_canyon', name: 'Blood Canyon', enemies: ['Swordfish Knight', 'Lobster Warlord'] },
      { id: 'obsidian_wastes', name: 'Obsidian Wastes', enemies: ['Demon Lord', 'Lobster Warlord'] },
      { id: 'ashen_battlefield', name: 'Ashen Battlefield', enemies: ['Swordfish Knight', 'Demon Lord'] },
    ],
    context: 'dungeon-lava',
  },
  {
    file: 'frozen_battle.png',
    name: 'Frozen Battle',
    description: 'Ice-locked waters and glacial caverns at the frozen edge.',
    overlay: null,
    locations: [
      { id: 'frozen_depths', name: 'Frozen Depths', enemies: ['Frost Titan', 'Frost Wyrm'] },
      { id: 'dragon_peaks', name: 'Dragon Peaks', enemies: ['Frost Wyrm', 'Frost Titan'] },
      { id: 'iron_peaks', name: 'Iron Peaks', enemies: ['Frost Titan', 'Stone Guardian'] },
      { id: 'frozen_tundra', name: 'Frozen Tundra', enemies: ['Frost Wyrm', 'Frost Titan'] },
    ],
  },
  {
    file: 'maelstrom_battle.png',
    name: 'Maelstrom Battle',
    description: 'Swirling vortex of aquatic fury — storm and chaos zones.',
    overlay: null,
    locations: [
      { id: 'maelstrom', name: 'Maelstrom', enemies: ['Kraken Lich', 'Water Serpent'] },
      { id: 'demon_gate', name: 'Demon Gate', enemies: ['Demon Lord', 'Void Sentinel'] },
      { id: 'stormspire_peak', name: 'Stormspire Peak', enemies: ['Kraken Lich', 'Water Elemental'] },
      { id: 'windswept_ridge', name: 'Windswept Ridge', enemies: ['Water Serpent', 'Shadow Manta'] },
    ],
  },
  {
    file: 'abyss_throne_battle.png',
    name: 'Abyss Throne Battle',
    description: 'The seat of ultimate darkness — endgame boss arenas.',
    overlay: null,
    locations: [
      { id: 'abyssal_throne', name: 'Abyssal Throne', enemies: ['Abyss King'] },
      { id: 'void_throne', name: 'Void Throne', enemies: ['Cacodaemon'] },
      { id: 'sanctum_of_omni', name: 'Sanctum of Omni', enemies: ['Grand Shaman', 'Poseidon'] },
    ],
    context: 'dungeon-void-boss',
  },
  {
    file: 'portal_ocean.png',
    name: 'Portal Arena',
    description: 'Mystical portal battleground used for Arena PvP and special encounters.',
    overlay: null,
    locations: [],
    context: 'arena',
  },
  {
    file: 'scene_dungeon_ocean.png',
    name: 'Depths Dungeon',
    description: 'Default dungeon encounter background for non-themed dungeons.',
    overlay: null,
    locations: [],
    context: 'dungeon-default',
  },
];

const missingAssignments = [
  {
    location: 'Abyssal Trench — Boss Encounters',
    issue: 'no-unique-bg',
    note: 'Uses deep_trench_battle.png — may need a unique boss variant background.',
  },
  {
    location: 'Void Maw (Cacodaemon Lair)',
    issue: 'shares-bg',
    note: 'Final boss location shares abyss_throne_battle.png with Abyss King. Could benefit from a unique "consumed void" background.',
  },
  {
    location: 'Gorgon Siren Lairs (Scylla, Medusa, Charybdis)',
    issue: 'no-unique-bg',
    note: 'The three Gorgon boss fights use generic zone backgrounds. Unique Gorgon lair backgrounds would elevate these encounters.',
  },
  {
    location: 'Grove Hunt Mini-game',
    issue: 'different-system',
    note: 'Uses reef_hunt_bg.png — canvas-based mini-game, not the standard battle system.',
  },
  {
    location: 'Portal Arena Variants',
    issue: 'no-unique-bg',
    note: 'Arena battles always use portal_ocean.png. Could add seasonal or rank-based arena variants (winter_arena.png, infernal_arena.png exist but are unused).',
  },
  {
    location: 'Unused Arena Backgrounds',
    issue: 'unused',
    note: 'arena_battle.png, arena.png, winter_arena.png, infernal_arena.png exist in /backgrounds/ but are not currently assigned to any battle.',
  },
  {
    location: 'Boss Walk-up Scenes',
    issue: 'different-system',
    note: 'boss_walkup_ocean.png and lava_boss_walkup.png are used for boss approach cinematics, not as battle backgrounds.',
  },
];

const overlayExplanation = `Each battle background has two layers: the FULL image (with terrain features) and a CLEAN image (with sprite standing areas erased to transparency). The clean version sits on top — sprites render between the layers. When stacked, the clean overlay is invisible because it matches the full image exactly, but it lets you place sprites precisely on the erased positions without clipping issues.`;

export default function BackgroundsPage() {
  const [selectedBg, setSelectedBg] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? battleBackgrounds
    : filter === 'has-overlay'
      ? battleBackgrounds.filter(b => b.overlay)
      : filter === 'no-overlay'
        ? battleBackgrounds.filter(b => !b.overlay)
        : battleBackgrounds;

  const tagColor = (ctx) => {
    if (!ctx) return '#22d3ee';
    if (ctx.includes('dungeon')) return '#a855f7';
    if (ctx === 'arena') return '#f59e0b';
    if (ctx === 'training') return '#22c55e';
    return '#22d3ee';
  };

  const tagLabel = (ctx) => {
    if (!ctx) return null;
    if (ctx === 'training') return 'Training Default';
    if (ctx === 'arena') return 'Arena';
    if (ctx === 'dungeon-lava') return 'Dungeon: Lava Theme';
    if (ctx === 'dungeon-void') return 'Dungeon: Void Theme';
    if (ctx === 'dungeon-void-boss') return 'Dungeon: Void Boss';
    if (ctx === 'dungeon-boss-default') return 'Dungeon: Default Boss';
    if (ctx === 'dungeon-default') return 'Dungeon: Default';
    return ctx;
  };

  const issueColor = (issue) => {
    if (issue === 'no-unique-bg') return '#f59e0b';
    if (issue === 'shares-bg') return '#f97316';
    if (issue === 'unused') return '#ef4444';
    if (issue === 'different-system') return '#8b5cf6';
    return '#94a3b8';
  };

  const issueLabel = (issue) => {
    if (issue === 'no-unique-bg') return 'NEEDS UNIQUE BG';
    if (issue === 'shares-bg') return 'SHARED BACKGROUND';
    if (issue === 'unused') return 'UNUSED ASSET';
    if (issue === 'different-system') return 'NON-BATTLE SYSTEM';
    return issue;
  };

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: '#050a18', color: '#e2e8f0', minHeight: '100vh' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,10,24,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ color: '#22d3ee', textDecoration: 'none', fontSize: '0.85rem' }}>Back to Game</a>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1rem, 3vw, 1.5rem)', margin: 0,
            background: 'linear-gradient(135deg, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Battle Backgrounds
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'has-overlay', 'no-overlay'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid',
              borderColor: filter === f ? '#22d3ee' : 'rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.03)',
              color: filter === f ? '#22d3ee' : '#94a3b8',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
            }}>
              {f === 'all' ? 'All' : f === 'has-overlay' ? 'Has Overlay' : 'Needs Overlay'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          background: 'rgba(14,22,48,0.6)', border: '1px solid rgba(34,211,238,0.15)',
          borderRadius: 12, padding: '20px 24px', marginBottom: 32,
        }}>
          <h3 style={{ fontFamily: "'Cinzel', serif", color: '#22d3ee', fontSize: '1rem', margin: '0 0 8px' }}>
            Overlay System
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{overlayExplanation}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
              HAS OVERLAY
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>= Clean + Full versions available for sprite alignment</span>
            <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', marginLeft: 12 }}>
              NEEDS OVERLAY
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>= Only full image exists, needs clean version created</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 24 }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginRight: 8 }}>
            {filtered.length} backgrounds &bull; {battleBackgrounds.reduce((a, b) => a + b.locations.length, 0)} location assignments &bull; {missingAssignments.length} items needing attention
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map(bg => (
            <div key={bg.file} onClick={() => setSelectedBg(bg)}
              style={{
                background: 'rgba(14,22,48,0.7)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
                <img src={`/backgrounds/${bg.file}`} alt={bg.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                  background: 'linear-gradient(transparent, rgba(14,22,48,0.95))' }} />
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  {bg.overlay ? (
                    <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700,
                      background: 'rgba(34,197,94,0.9)', color: '#fff' }}>OVERLAY</span>
                  ) : (
                    <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700,
                      background: 'rgba(245,158,11,0.9)', color: '#fff' }}>NEEDS OVERLAY</span>
                  )}
                </div>
                {bg.context && (
                  <div style={{ position: 'absolute', top: 8, left: 8 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 600,
                      background: 'rgba(0,0,0,0.7)', color: tagColor(bg.context), border: `1px solid ${tagColor(bg.context)}40` }}>
                      {tagLabel(bg.context)}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', margin: '0 0 4px', color: '#e2e8f0' }}>{bg.name}</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.4 }}>{bg.description}</p>
                <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px' }}>
                  /backgrounds/{bg.file}
                </div>
                {bg.locations.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {bg.locations.map(loc => (
                      <span key={loc.id} style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem',
                        background: 'rgba(34,211,238,0.1)', color: '#22d3ee',
                        border: '1px solid rgba(34,211,238,0.2)',
                      }}>{loc.name}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>System/special use — no direct location</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48 }}>
          <h2 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: 8,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Needs Attention</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 }}>
            Battles and locations that need unique backgrounds, have shared backgrounds, or unused assets.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {missingAssignments.map((item, i) => (
              <div key={i} style={{
                background: 'rgba(14,22,48,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '16px 20px',
                borderLeft: `3px solid ${issueColor(item.issue)}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700,
                    background: `${issueColor(item.issue)}20`, color: issueColor(item.issue),
                    border: `1px solid ${issueColor(item.issue)}40`,
                    letterSpacing: '0.5px',
                  }}>{issueLabel(item.issue)}</span>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.9rem', color: '#e2e8f0' }}>{item.location}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 48 }}>
          <h2 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: 8,
            background: 'linear-gradient(135deg, #22d3ee, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>All Background Files</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 20 }}>
            Complete inventory of every image in /backgrounds/ — battle backgrounds, scene backgrounds, boss walk-ups, and more.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              'abyssal_depths.png', 'abyss_throne_battle.png', 'arena_battle.png', 'arena.png',
              'bg_elf.png', 'bg_undead.png', 'bg_warrior.png',
              'biolume_battle.png', 'blight_hollow.png', 'blood_canyon.png',
              'boss_autumn.png', 'boss_blue.png', 'boss_green.png', 'boss_mountain.png', 'boss_red.png', 'boss_walkup_ocean.png',
              'camp_shop.png', 'card_beach.png',
              'card_blue_betta.png', 'card_dark.png', 'card_divine.png',
              'card_gold_betta.png', 'card_green_betta.png', 'card_green_hills.png',
              'card_orange_betta.png', 'card_pink_betta.png', 'card_purple_betta.png',
              'card_red_betta.png', 'card_white_betta.png',
              'character_create_ocean.png', 'character_create.png', 'coral_reef_city.png',
              'corrupted_spire.png', 'crystal_caves.png', 'cursed_ruins.png',
              'dark_forest.png', 'deep_trench_battle.png', 'deep_trench.png', 'demon_gate.png', 'dragon_peaks.png',
              'frozen_battle.png', 'frozen_depths.png',
              'hall_of_odin.png', 'haunted_marsh.png', 'hero_creation_bg.png', 'hero_creation_ocean.png',
              'infernal_arena.png', 'kelp_battle.png', 'kelp_forest.png',
              'lava_boss_walkup.png', 'lava_dungeon_path.png', 'lava_texture.png',
              'maelstrom_battle.png', 'main_menu_bg.png', 'maw_of_madra.png', 'mystic_grove.png',
              'ocean_battle_new.png', 'ocean_battle.png', 'ocean_palace.png', 'ocean_title_bg.png', 'ocean_world_map.png',
              'portal_arena.png', 'portal_ocean.png', 'purple_dungeon.png',
              'reef_hunt_bg.png', 'sanctum_of_omni.png',
              'scene_camp_ocean.png', 'scene_camp.png', 'scene_dungeon_ocean.png', 'scene_dungeon.png',
              'scene_field_ocean.png', 'scene_field.png', 'scene_trading_ocean.png', 'scene_trading.png',
              'shadow_citadel.png', 'shadow_forest.png', 'shipwreck_battle.png', 'shipwreck_graveyard.png',
              'storm_ruins.png', 'sunken_temple_battle.png', 'sunken_temple.png',
              'tab_abilities_ocean.png', 'tab_abilities.png', 'tab_attributes_ocean.png', 'tab_attributes.png',
              'tab_gear_ocean.png', 'tab_gear.png', 'tab_skills_ocean.png', 'tab_skills.png',
              'tab_stats_ocean.png', 'tab_stats.png',
              'tavern_bg.png', 'tavern_ocean.png', 'thornwood_pass.png',
              'trade_day.png', 'trade_night.png', 'training_ocean.png',
              'verdant_plains.png', 'void_threshold.png', 'void_throne.png',
              'volcanic_battle.png', 'volcanic_battle_clean.png', 'volcanic_battle_overlay.png',
              'volcanic_field.png', 'volcanic_vent.png',
              'wc_blue_ocean.png', 'wc_blue.png', 'wc_gold_ocean.png', 'wc_gold.png',
              'wc_green_ocean.png', 'wc_green.png', 'wc_purple_ocean.png', 'wc_purple.png',
              'wc_red_ocean.png', 'wc_red.png',
              'whispering_caverns.png', 'winter_arena.png', 'world_map.png',
            ].map(f => {
              const isBattle = battleBackgrounds.some(b => b.file === f);
              return (
                <div key={f} style={{
                  background: 'rgba(14,22,48,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 8, overflow: 'hidden',
                }}>
                  <img src={`/backgrounds/${f}`} alt={f}
                    style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                  <div style={{ padding: '6px 10px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', wordBreak: 'break-all' }}>{f}</div>
                    {isBattle && (
                      <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>BATTLE BG</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedBg && (
        <div onClick={() => setSelectedBg(null)} style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0a1128', borderRadius: 16, maxWidth: 900, width: '100%',
            maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={`/backgrounds/${selectedBg.file}`} alt={selectedBg.name}
                  style={{ width: '100%', display: 'block' }} />
                {selectedBg.overlay && showOverlay && (
                  <img src={`/backgrounds/${selectedBg.overlay}`} alt="Overlay"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <button onClick={() => setSelectedBg(null)} style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem',
              }}>Close</button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.3rem', margin: 0 }}>{selectedBg.name}</h2>
                {selectedBg.overlay ? (
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                    background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                    HAS OVERLAY
                  </span>
                ) : (
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                    background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                    NEEDS OVERLAY
                  </span>
                )}
                {selectedBg.context && (
                  <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600,
                    background: `${tagColor(selectedBg.context)}15`, color: tagColor(selectedBg.context),
                    border: `1px solid ${tagColor(selectedBg.context)}30` }}>
                    {tagLabel(selectedBg.context)}
                  </span>
                )}
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 6 }}>{selectedBg.description}</p>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 16 }}>
                Path: /backgrounds/{selectedBg.file}
                {selectedBg.clean && <> &bull; Clean: /backgrounds/{selectedBg.clean}</>}
                {selectedBg.overlay && <> &bull; Overlay: /backgrounds/{selectedBg.overlay}</>}
              </p>

              {selectedBg.overlay && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => setShowOverlay(!showOverlay)} style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: showOverlay ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    border: `1px solid ${showOverlay ? '#22c55e' : '#ef4444'}`,
                    color: showOverlay ? '#22c55e' : '#ef4444',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    {showOverlay ? 'Overlay ON — Hide Sprite Positions' : 'Overlay OFF — Show Sprite Positions'}
                  </button>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Toggle to see where sprites should be placed
                  </span>
                </div>
              )}

              {selectedBg.locations.length > 0 && (
                <>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.95rem', color: '#22d3ee', marginBottom: 10 }}>
                    Assigned Locations ({selectedBg.locations.length})
                  </h3>
                  <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                    {selectedBg.locations.map(loc => (
                      <div key={loc.id} style={{
                        background: 'rgba(14,22,48,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 8, padding: '10px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{loc.name}</span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: 8 }}>{loc.id}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {loc.enemies.map(e => (
                            <span key={e} style={{
                              padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem',
                              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.2)',
                            }}>{e}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selectedBg.overlay && (
                <>
                  <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '0.95rem', color: '#a855f7', marginBottom: 10 }}>
                    Layer Files
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'rgba(14,22,48,0.5)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={`/backgrounds/${selectedBg.clean || selectedBg.file}`} alt="Clean Layer"
                        style={{ width: '100%', display: 'block' }} />
                      <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                        Clean (sprite areas erased)
                      </div>
                    </div>
                    <div style={{ background: 'rgba(14,22,48,0.5)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={`/backgrounds/${selectedBg.overlay}`} alt="Overlay Layer"
                        style={{ width: '100%', display: 'block' }} />
                      <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                        Overlay (with position markers)
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

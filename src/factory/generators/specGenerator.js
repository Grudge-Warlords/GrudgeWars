import {
  GAME_TEMPLATE_SCHEMA,
  ATTRIBUTE_NAMES,
  EQUIPMENT_SLOTS,
  ABILITY_TYPES,
  EFFECT_TYPES,
  SCENE_TYPES,
} from '../schema/gameTemplate.js';

async function aiChat(prompt, onProgress) {
  if (typeof window !== 'undefined' && window.puter) {
    try {
      const resp = await puter.ai.chat(prompt, { model: 'gpt-4o-mini' });
      return typeof resp === 'string' ? resp : resp?.message?.content || resp?.toString() || '';
    } catch(e) {
      console.warn('Puter AI failed, using fallback:', e);
    }
  }
  return null;
}

function parseJSONFromAI(text) {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    const braceMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (braceMatch) return JSON.parse(braceMatch[0]);
    return JSON.parse(text);
  } catch(e) {
    console.warn('JSON parse failed:', e, text?.substring(0, 200));
    return null;
  }
}

function makeId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function splitCommaSafe(str) {
  return str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
}

function randomColor() {
  const colors = ['#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6','#6366f1','#d946ef','#84cc16'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function distributeStats(total, count) {
  const stats = {};
  const keys = ATTRIBUTE_NAMES.slice(0, count || 8);
  let remaining = total;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) { stats[k] = remaining; }
    else {
      const val = Math.floor(Math.random() * Math.min(5, remaining));
      stats[k] = val;
      remaining -= val;
    }
  });
  return stats;
}

export async function generateGameSpec(form, onProgress) {
  const spec = JSON.parse(JSON.stringify(GAME_TEMPLATE_SCHEMA));

  onProgress('Setting up game metadata...');
  spec.meta.gameName = form.gameName || 'Untitled RPG';
  spec.meta.studioName = form.studioName || 'Game Factory';
  spec.meta.tagline = form.tagline || 'An Epic Adventure Awaits';
  spec.meta.theme = form.theme;
  spec.meta.setting = form.setting;
  spec.meta.artStyle = form.artStyle;
  spec.meta.colorPalette = {
    primary: form.primaryColor,
    secondary: form.secondaryColor,
    accent: form.accentColor,
    danger: form.dangerColor,
    background: form.bgColor,
    text: '#e2e8f0',
  };
  spec.meta.fonts = { heading: form.headingFont, body: form.bodyFont };
  spec.meta.currency = { name: form.currencyName, icon: 'coin', plural: form.currencyName };

  spec.attributes = [...ATTRIBUTE_NAMES];

  onProgress('Generating races with AI...');
  spec.races = await generateRaces(form, onProgress);

  onProgress('Generating classes with AI...');
  spec.classes = await generateClasses(form, onProgress);

  onProgress('Generating world lore with AI...');
  spec.lore = await generateLore(form, onProgress);

  onProgress('Generating enemies...');
  spec.enemies = await generateEnemies(form, spec.lore, onProgress);

  onProgress('Generating bosses...');
  spec.bosses = await generateBosses(form, spec.lore, onProgress);

  onProgress('Generating equipment...');
  spec.equipment = generateEquipment(form, spec.classes);

  onProgress('Generating skill trees...');
  spec.skillTrees = generateSkillTrees(form, spec.classes);

  onProgress('Generating chapters...');
  spec.chapters = await generateChapters(form, spec.lore, onProgress);

  onProgress('Generating world map...');
  spec.worldMap = await generateWorldMap(form, spec.lore, onProgress);

  onProgress('Generating dialogue templates...');
  spec.dialogue = generateDialogue(form);

  onProgress('Building asset manifest...');
  spec.assets = buildAssetManifest(spec);

  onProgress('Game specification complete!');
  return spec;
}

async function generateRaces(form, onProgress) {
  const raceNames = splitCommaSafe(form.raceNames);
  const count = form.raceCount;

  const prompt = `You are a game designer. Create ${count} playable races for an RPG with theme "${form.theme}" set in "${form.setting}".
${raceNames.length > 0 ? `Use these names: ${raceNames.join(', ')}. Add more if needed to reach ${count}.` : `Invent ${count} unique race names.`}
${form.raceStyle ? `Style inspiration: ${form.raceStyle}` : ''}

For each race, return a JSON array with objects having these fields:
- name (string)
- color (hex color string like #ff0000)
- description (1 sentence, 20 words max)
- lore (2-3 sentences of rich backstory)
- trait (unique racial trait name)
- traitDescription (1 sentence describing the trait's effect)
- role (one of: Generalist, Berserker, Mage, Tank, Bruiser, Defender, Speed DPS, Healer, Support, Assassin)
- statFocus (which 1-2 stats they excel at, from: Strength, Vitality, Endurance, Dexterity, Agility, Intellect, Wisdom, Tactics)

Return ONLY a valid JSON array, no other text.`;

  const aiResult = await aiChat(prompt, onProgress);
  let races = parseJSONFromAI(aiResult);

  if (!races || !Array.isArray(races) || races.length < 2) {
    races = Array.from({ length: count }, (_, i) => ({
      name: raceNames[i] || `Race ${i + 1}`,
      color: randomColor(),
      description: `A unique race from the ${form.theme} world.`,
      lore: `These beings have existed since the dawn of ${form.worldName || 'the realm'}.`,
      trait: `Trait ${i + 1}`,
      traitDescription: 'A special ability unique to this race.',
      role: ['Generalist','Berserker','Mage','Tank','Bruiser','Defender','Speed DPS','Healer'][i % 8],
      statFocus: ATTRIBUTE_NAMES[i % 8],
    }));
  }

  return races.slice(0, count).map((r, i) => {
    const id = makeId(r.name);
    const bonuses = {};
    ATTRIBUTE_NAMES.forEach(a => { bonuses[a] = 0; });
    if (r.role === 'Generalist') {
      ATTRIBUTE_NAMES.forEach(a => { bonuses[a] = 1; });
    } else {
      const focuses = Array.isArray(r.statFocus) ? r.statFocus : [r.statFocus || ATTRIBUTE_NAMES[i % 8]];
      focuses.forEach(f => { if (bonuses[f] !== undefined) bonuses[f] = 3; });
      bonuses[ATTRIBUTE_NAMES[(i * 3 + 1) % 8]] = Math.max(bonuses[ATTRIBUTE_NAMES[(i * 3 + 1) % 8]], 2);
    }
    const totalBonus = Object.values(bonuses).reduce((a, b) => a + b, 0);
    const passive = Object.entries(bonuses).filter(([,v]) => v > 0).map(([k,v]) => `+${v} ${k}`).join(', ');

    return {
      id,
      name: r.name,
      icon: `/images/races/${id}.png`,
      color: r.color || randomColor(),
      description: r.description,
      lore: r.lore,
      bonuses,
      passive: passive || '+1 All',
      trait: r.trait,
      traitDescription: r.traitDescription,
    };
  });
}

async function generateClasses(form, onProgress) {
  const classNames = splitCommaSafe(form.classNames);
  const count = form.classCount;

  const prompt = `You are a game designer. Create ${count} character classes for an RPG with theme "${form.theme}" set in "${form.setting}".
${classNames.length > 0 ? `Use these names: ${classNames.join(', ')}. Add more if needed to reach ${count}.` : `Invent ${count} unique class names.`}
Combat style: ${form.combatStyle}.

For each class, return a JSON array with objects having:
- name (string)
- role (e.g. "Frontline Tank", "Ranged DPS", "Healer/Support", "Shapeshifter")
- description (1 sentence)
- lore (2-3 sentences)
- color (hex color)
- transformName (name of their ultimate transformation ability)
- primaryResource ("Stamina", "Mana", or "Both")
- abilities: array of 4 abilities, each with:
  - name, description (short), type (physical/magical/heal/buff/debuff), damageMultiplier (0.8-2.5)

Return ONLY a valid JSON array.`;

  const aiResult = await aiChat(prompt, onProgress);
  let classes = parseJSONFromAI(aiResult);

  if (!classes || !Array.isArray(classes) || classes.length < 2) {
    classes = Array.from({ length: count }, (_, i) => ({
      name: classNames[i] || ['Warrior','Mage','Rogue','Cleric','Ranger','Berserker','Necromancer','Paladin'][i % 8],
      role: ['Frontline Tank/DPS','Caster/Healer','Shapeshifter','Precision Striker'][i % 4],
      description: `A formidable ${form.theme} combatant.`,
      lore: `Masters of their craft in the world of ${form.worldName || 'the realm'}.`,
      color: randomColor(),
      transformName: `Ultimate Form ${i + 1}`,
      primaryResource: ['Stamina','Mana','Both','Stamina'][i % 4],
      abilities: [
        { name: 'Basic Strike', description: 'A standard attack', type: 'physical', damageMultiplier: 1.0 },
        { name: 'Power Move', description: 'A powerful attack', type: 'physical', damageMultiplier: 2.0 },
        { name: 'Special', description: 'A special ability', type: 'magical', damageMultiplier: 1.5 },
        { name: 'Defense', description: 'A defensive ability', type: 'buff', damageMultiplier: 0 },
      ],
    }));
  }

  const iconMap = ['crossed_swords', 'crystal', 'wolf', 'bow', 'shield', 'fire', 'skull', 'heart'];
  const abilityIcons = ['sword', 'bomb', 'sparkle', 'shield', 'fire', 'lightning', 'ice', 'nature', 'skull', 'heart', 'target', 'crystal'];

  return classes.slice(0, count).map((c, i) => {
    const id = makeId(c.name);
    const isMana = c.primaryResource === 'Mana' || c.primaryResource === 'Both';
    const isStamina = c.primaryResource === 'Stamina' || c.primaryResource === 'Both';

    const startAttrs = {};
    ATTRIBUTE_NAMES.forEach(a => { startAttrs[a] = 1; });
    if (c.role?.includes('Tank') || c.role?.includes('Frontline')) { startAttrs.Strength = 5; startAttrs.Vitality = 3; startAttrs.Endurance = 2; }
    else if (c.role?.includes('Caster') || c.role?.includes('Healer') || c.role?.includes('Mage')) { startAttrs.Intellect = 5; startAttrs.Wisdom = 4; }
    else if (c.role?.includes('Shape') || c.role?.includes('Hybrid')) { startAttrs.Strength = 2; startAttrs.Agility = 2; startAttrs.Intellect = 2; startAttrs.Dexterity = 2; }
    else { startAttrs.Dexterity = 4; startAttrs.Agility = 3; startAttrs.Strength = 2; }

    const abilities = (c.abilities || []).map((ab, j) => ({
      id: makeId(c.name + '_' + ab.name),
      name: ab.name,
      icon: abilityIcons[(i * 4 + j) % abilityIcons.length],
      description: ab.description,
      type: ab.type || 'physical',
      damage: ab.damageMultiplier || 1.0,
      manaCost: (ab.type === 'magical' || ab.type === 'heal') ? (j === 0 ? 0 : 20 + j * 10) : 0,
      staminaCost: ab.type === 'physical' ? (j === 0 ? 0 : 15 + j * 5) : 0,
      cooldown: j === 0 ? 0 : j + 1,
      target: ab.type === 'heal' || ab.type === 'buff' ? 'self' : 'enemy',
      ...(j === 0 ? { manaGain: isMana ? 8 : 5, staminaGain: isStamina ? 8 : 5 } : {}),
      ...(ab.type === 'heal' ? { healPercent: 0.3 } : {}),
      ...(ab.type === 'buff' ? { effect: { stat: 'damage', multiplier: 1.3, duration: 3 } } : {}),
    }));

    return {
      id,
      name: c.name,
      icon: iconMap[i % iconMap.length],
      color: c.color || randomColor(),
      description: c.description,
      lore: c.lore,
      role: c.role,
      startingAttributes: startAttrs,
      abilities,
      signatureAbility: {
        id: makeId(c.name + '_signature'),
        name: c.transformName || 'Ultimate',
        icon: 'shield',
        description: `Activate ${c.transformName || 'ultimate form'}`,
        type: 'buff',
        damage: 0,
        manaCost: isMana ? 50 : 0,
        staminaCost: isStamina ? 35 : 0,
        cooldown: 8,
        target: 'self',
        effect: { stat: 'defense', flat: 25, duration: 3 },
      },
    };
  });
}

async function generateLore(form, onProgress) {
  const factionNames = splitCommaSafe(form.factionNames);

  const prompt = `You are a fantasy writer. Create rich world lore for an RPG called "${form.gameName || 'Untitled'}" with theme "${form.theme}" set in "${form.setting}".
${form.centralConflict ? `Central conflict: ${form.centralConflict}` : ''}
${form.lorePremise ? `Premise: ${form.lorePremise}` : ''}
${form.worldName ? `World name: ${form.worldName}` : ''}
${factionNames.length > 0 ? `Factions: ${factionNames.join(', ')}` : `Create ${form.factionCount} factions.`}

Return a JSON object with:
- title (string, the world's name/title)
- subtitle (string, a poetic subtitle)
- prologue (string, 3-4 paragraphs of rich opening lore, 200-300 words)
- worldHistory (string, 2 paragraphs of ancient history)
- factions: array of ${form.factionCount} objects with:
  - name, icon (single emoji), color (hex), description (2-3 sentences), status (current state)

Return ONLY valid JSON.`;

  const aiResult = await aiChat(prompt, onProgress);
  let lore = parseJSONFromAI(aiResult);

  if (!lore || !lore.title) {
    lore = {
      title: form.worldName || `The World of ${form.theme}`,
      subtitle: form.tagline || 'An Epic Adventure Awaits',
      prologue: form.lorePremise || `In the realm of ${form.worldName || form.theme}, an ancient conflict stirs. The balance of power is shifting, and heroes must rise to meet the coming darkness. Your journey begins now.`,
      worldHistory: `Long ago, the world was forged by ancient powers. Now those powers stir once more, and the fate of all hangs in the balance.`,
      factions: Array.from({ length: form.factionCount }, (_, i) => ({
        name: factionNames[i] || `Faction ${i + 1}`,
        icon: ['⚔️','🛡️','🔮','🌿','💀','🔥'][i % 6],
        color: randomColor(),
        description: `A powerful faction in the ${form.theme} world.`,
        status: ['Active','Corrupted','Silent','Rising','Fallen','Awakening'][i % 6],
      })),
    };
  }

  return lore;
}

async function generateEnemies(form, lore, onProgress) {
  const enemyCount = 20;

  const prompt = `Create ${enemyCount} enemies for an RPG with theme "${form.theme}" in world "${lore?.title || form.worldName}".
Setting: ${form.setting}

Return a JSON array of ${enemyCount} enemies. Each has:
- name (themed to the setting)
- icon (one of: sword, skull, wolf, shield, crystal, fire, nature, lightning)
- color (hex)
- tier (1-4, where 1=weak, 4=elite)
- description (10 words max)
- abilities: array of 2 abilities, each with name, type (physical/magical/buff), damageMultiplier (0.8-2.0)

Return ONLY valid JSON array.`;

  const aiResult = await aiChat(prompt, onProgress);
  let enemies = parseJSONFromAI(aiResult);

  if (!enemies || !Array.isArray(enemies) || enemies.length < 3) {
    enemies = Array.from({ length: enemyCount }, (_, i) => ({
      name: `${form.theme} Creature ${i + 1}`,
      icon: ['sword','skull','wolf','shield','crystal'][i % 5],
      color: randomColor(),
      tier: Math.ceil((i + 1) / 5),
      description: `A dangerous enemy of the ${form.theme} world.`,
      abilities: [
        { name: 'Strike', type: 'physical', damageMultiplier: 1.0 },
        { name: 'Special', type: 'physical', damageMultiplier: 1.5 },
      ],
    }));
  }

  return enemies.slice(0, enemyCount).map((e, i) => {
    const id = makeId(e.name);
    const tier = e.tier || Math.ceil((i + 1) / 5);
    const mult = [1, 1.5, 2.2, 3.5][tier - 1] || 1;

    return {
      id,
      name: e.name,
      icon: e.icon || 'sword',
      color: e.color || randomColor(),
      portrait: `/images/enemies/${id}.png`,
      baseHealth: Math.round(80 * mult),
      baseDamage: Math.round(12 * mult),
      baseDefense: Math.round(5 * mult),
      baseMana: tier > 2 ? 50 * tier : 0,
      xpReward: Math.round(15 * mult),
      goldReward: Math.round(8 * mult),
      speed: 8 + Math.floor(Math.random() * 12),
      isBoss: false,
      description: e.description,
      abilities: (e.abilities || []).map((ab, j) => ({
        id: makeId(e.name + '_' + (ab.name || `ability${j}`)),
        name: ab.name || `Attack ${j + 1}`,
        icon: e.icon || 'sword',
        type: ab.type || 'physical',
        damage: ab.damageMultiplier || 1.0,
        description: `${ab.name || 'An attack'} from ${e.name}`,
        ...(j > 0 ? { cooldown: 3 } : {}),
      })),
    };
  });
}

async function generateBosses(form, lore, onProgress) {
  const count = form.bossCount;

  const prompt = `Create ${count} epic boss enemies for an RPG with theme "${form.theme}".
${form.bossTheme ? `Boss theme: ${form.bossTheme}` : ''}
World: ${lore?.title || form.worldName || 'the realm'}
${lore?.factions ? `Factions: ${lore.factions.map(f => f.name).join(', ')}` : ''}

For each boss, return a JSON array with:
- name (epic, memorable name with title)
- title (their title/epithet)
- color (hex)
- level (boss difficulty 1-20, spread across range)
- description (2-3 sentences of backstory)
- lore (1-2 sentences of atmospheric lore)
- abilities: array of 4 abilities with name, type (physical/magical/buff/debuff), damageMultiplier (1.0-3.0)

Return ONLY valid JSON array.`;

  const aiResult = await aiChat(prompt, onProgress);
  let bosses = parseJSONFromAI(aiResult);

  if (!bosses || !Array.isArray(bosses) || bosses.length < 1) {
    bosses = Array.from({ length: count }, (_, i) => ({
      name: `Boss ${i + 1}`,
      title: `The ${['Guardian','Corrupted','Ancient'][i % 3]} One`,
      color: randomColor(),
      level: Math.round(5 + (i / (count - 1 || 1)) * 15),
      description: `A fearsome boss of the ${form.theme} world.`,
      lore: 'An ancient power corrupted beyond recognition.',
      abilities: [
        { name: 'Boss Strike', type: 'physical', damageMultiplier: 1.5 },
        { name: 'Boss Blast', type: 'magical', damageMultiplier: 2.0 },
        { name: 'Enrage', type: 'buff', damageMultiplier: 0 },
        { name: 'Devastation', type: 'physical', damageMultiplier: 2.5 },
      ],
    }));
  }

  return bosses.slice(0, count).map((b, i) => {
    const id = makeId(b.name);
    const lvl = b.level || (5 + i * 6);
    const mult = 3 + lvl * 0.5;

    return {
      id,
      name: b.name,
      title: b.title,
      icon: 'skull',
      color: b.color || randomColor(),
      portrait: `/images/bosses/${id}.png`,
      baseHealth: Math.round(300 * mult),
      baseDamage: Math.round(25 * mult / 3),
      baseDefense: Math.round(20 * mult / 3),
      baseMana: 200,
      xpReward: Math.round(100 * mult / 2),
      goldReward: Math.round(50 * mult / 2),
      speed: 12,
      isBoss: true,
      level: lvl,
      description: b.description,
      lore: b.lore,
      abilities: (b.abilities || []).map((ab, j) => ({
        id: makeId(b.name + '_' + (ab.name || `ability${j}`)),
        name: ab.name,
        icon: ['skull','fire','shield','lightning'][j % 4],
        type: ab.type || 'physical',
        damage: ab.damageMultiplier || 1.5,
        description: `${ab.name} from ${b.name}`,
        cooldown: j === 0 ? 0 : j + 2,
        ...(ab.type === 'buff' ? { effect: { stat: 'damage', multiplier: 1.5, duration: 3 } } : {}),
      })),
    };
  });
}

function generateEquipment(form, classes) {
  const tiers = Array.from({ length: 8 }, (_, i) => ({
    tier: i + 1,
    name: `Tier ${i + 1}`,
    color: ['#9ca3af','#22c55e','#3b82f6','#a855f7','#f59e0b','#ef4444','#06b6d4','#f472b6'][i],
    multiplier: [1.0, 1.3, 1.65, 2.1, 2.7, 3.4, 4.3, 5.5][i],
  }));

  const weaponTypes = [
    { id: 'sword', name: 'Sword', icon: 'sword', hand: '1h' },
    { id: 'axe', name: 'Axe', icon: 'axe', hand: '1h' },
    { id: 'greatsword', name: 'Greatsword', icon: 'crossed_swords', hand: '2h' },
    { id: 'staff', name: 'Staff', icon: 'wand', hand: '2h' },
    { id: 'bow', name: 'Bow', icon: 'bow', hand: '2h' },
    { id: 'dagger', name: 'Dagger', icon: 'sword', hand: '1h' },
    { id: 'hammer', name: 'Hammer', icon: 'hammer', hand: '2h' },
    { id: 'shield', name: 'Shield', icon: 'shield', hand: '1h' },
  ];

  return {
    slots: [...EQUIPMENT_SLOTS],
    tiers,
    weaponTypes,
    armorSets: [],
    items: [],
  };
}

function generateSkillTrees(form, classes) {
  const trees = {};

  classes.forEach(cls => {
    const tierNames = [
      `Tier 1 - Initiate`,
      `Tier 5 - Adept`,
      `Tier 10 - Expert`,
      `Tier 15 - Master`,
    ];

    trees[cls.id] = {
      className: cls.name,
      color: cls.color,
      tiers: tierNames.map((tn, ti) => ({
        name: tn,
        requiredLevel: [1, 5, 10, 15][ti],
        skills: Array.from({ length: 3 }, (_, si) => ({
          id: `${cls.id}_t${ti}_s${si}`,
          name: `${cls.name} Skill ${ti * 3 + si + 1}`,
          icon: `skill_${cls.id}_${ti}_${si}`,
          description: `A powerful ${cls.name} technique`,
          effect: `+${10 + ti * 5}% effectiveness`,
          maxPoints: 3,
          requires: ti > 0 ? `${cls.id}_t${ti - 1}_s${Math.min(si, 2)}` : null,
          bonuses: { [si === 0 ? 'defense' : si === 1 ? 'damage' : 'attackSpeed']: 3 + ti * 2 },
          passive: si === 2,
        })),
      })),
    };
  });

  return trees;
}

async function generateChapters(form, lore, onProgress) {
  const count = 8;

  const prompt = `Create ${count} story chapters for an RPG called "${form.gameName}" with theme "${form.theme}".
World: ${lore?.title || form.worldName}
Conflict: ${form.centralConflict || 'An ancient evil threatens the realm'}
${lore?.factions ? `Factions: ${lore.factions.map(f => f.name).join(', ')}` : ''}

Return a JSON array of ${count} chapters, each with:
- title (chapter name)
- subtitle (short tagline)
- description (2-3 sentences)
- loreReveal (1 sentence of lore unlocked)

Return ONLY valid JSON array.`;

  const aiResult = await aiChat(prompt, onProgress);
  let chapters = parseJSONFromAI(aiResult);

  if (!chapters || !Array.isArray(chapters) || chapters.length < 3) {
    chapters = Array.from({ length: count }, (_, i) => ({
      title: `Chapter ${i + 1}`,
      subtitle: ['The Awakening','Into the Unknown','Rising Tide','Dark Revelations','Alliance Forged','The Siege','Final Stand','Dawn of Victory'][i] || `Part ${i + 1}`,
      description: `The ${i + 1}${['st','nd','rd'][i] || 'th'} chapter of the ${form.theme} saga.`,
      loreReveal: `A piece of the puzzle falls into place.`,
    }));
  }

  const chapterColors = ['#06b6d4','#22c55e','#f59e0b','#ef4444','#a855f7','#3b82f6','#ec4899','#f97316'];

  return chapters.slice(0, count).map((ch, i) => ({
    id: `chapter_${i + 1}`,
    number: i + 1,
    title: ch.title,
    subtitle: ch.subtitle,
    description: ch.description,
    color: chapterColors[i % chapterColors.length],
    objectives: [
      { id: `ch${i+1}_obj1`, text: i === 0 ? 'Create your first hero' : `Complete a quest in region ${Math.min(i + 1, form.regionCount)}`, type: 'quest' },
      { id: `ch${i+1}_obj2`, text: `Defeat ${3 + i * 2} enemies`, type: 'combat', target: 3 + i * 2 },
      { id: `ch${i+1}_obj3`, text: i >= form.bossCount ? 'Explore a new area' : `Defeat Boss ${i + 1}`, type: i < form.bossCount ? 'boss' : 'explore' },
    ],
    rewards: { xp: 100 * (i + 1), currency: 50 * (i + 1) },
    loreReveal: ch.loreReveal,
  }));
}

async function generateWorldMap(form, lore, onProgress) {
  const regionNames = splitCommaSafe(form.regionNames);
  const regionCount = form.regionCount;

  const prompt = `Create ${regionCount} world regions and ${regionCount * 4} locations for an RPG map with theme "${form.theme}".
World: ${lore?.title || form.worldName || 'the realm'}
Setting: ${form.setting}
${regionNames.length > 0 ? `Region names: ${regionNames.join(', ')}` : ''}

Return a JSON object with:
- regions: array of ${regionCount} objects with name, terrainType, color (hex), description (1 sentence)
- locations: array of ${regionCount * 4} objects with name, region (matching region name), type (one of: field, dungeon, camp, trading, boss, city, arena), description (10 words max), levelMin, levelMax

Return ONLY valid JSON.`;

  const aiResult = await aiChat(prompt, onProgress);
  let mapData = parseJSONFromAI(aiResult);

  if (!mapData || !mapData.regions) {
    mapData = {
      regions: Array.from({ length: regionCount }, (_, i) => ({
        name: regionNames[i] || `Region ${i + 1}`,
        terrainType: ['plains','forest','mountains','desert','swamp','tundra','volcanic','caves'][i % 8],
        color: randomColor(),
        description: `A region of the ${form.theme} world.`,
      })),
      locations: [],
    };
    mapData.regions.forEach((r, ri) => {
      for (let j = 0; j < 4; j++) {
        mapData.locations.push({
          name: `${r.name} Location ${j + 1}`,
          region: r.name,
          type: ['field','dungeon','camp','trading','boss','city','arena'][j % 7],
          description: `A location in ${r.name}`,
          levelMin: ri * 4 + 1,
          levelMax: ri * 4 + 5,
        });
      }
    });
  }

  const regions = (mapData.regions || []).map((r, i) => ({
    id: makeId(r.name),
    name: r.name,
    color: r.color || randomColor(),
    description: r.description,
    terrainType: r.terrainType || 'plains',
    levelRange: [i * 4 + 1, (i + 1) * 4 + 4],
  }));

  const locationsPerRow = Math.ceil(Math.sqrt((mapData.locations || []).length));
  const locations = (mapData.locations || []).map((loc, i) => {
    const regionObj = regions.find(r => r.name === loc.region) || regions[i % regions.length];
    return {
      id: makeId(loc.name),
      name: loc.name,
      region: regionObj?.id || 'default',
      x: 100 + (i % locationsPerRow) * 200 + Math.random() * 80,
      y: 100 + Math.floor(i / locationsPerRow) * 200 + Math.random() * 80,
      description: loc.description,
      lore: '',
      enemyPool: [],
      levelRange: [loc.levelMin || 1, loc.levelMax || 5],
      type: loc.type || 'field',
      background: '',
      unlockRequirement: i === 0 ? null : makeId((mapData.locations[i - 1] || {}).name || 'start'),
    };
  });

  const connections = locations.slice(1).map((loc, i) => ({
    from: locations[i].id,
    to: loc.id,
  }));

  return {
    name: lore?.title || form.worldName || `The ${form.theme} World`,
    regions,
    locations,
    connections,
  };
}

function generateDialogue(form) {
  return {
    greetings: [
      `Welcome, warrior of ${form.worldName || 'the realm'}.`,
      `Another challenger approaches...`,
      `The ${form.theme} awaits your command.`,
      `Ready for battle?`,
      `Fortune favors the bold.`,
    ],
    battleCries: [
      `For glory!`, `No mercy!`, `Stand and fight!`,
      `You face a true warrior!`, `This ends now!`,
    ],
    victory: [
      `Victory is ours!`, `Well fought!`, `Another foe vanquished.`,
      `Onwards to glory!`, `The enemy falls!`,
    ],
    defeat: [
      `We shall return stronger...`, `This isn't over.`,
      `A temporary setback.`, `Next time will be different.`,
    ],
    idle: [
      `The road ahead is long.`, `I sense something on the wind.`,
      `We should keep moving.`, `What secrets does this place hold?`,
    ],
  };
}

function buildAssetManifest(spec) {
  const backgrounds = [
    { id: 'title_bg', usage: 'title_screen', path: '/backgrounds/title_bg.png' },
    { id: 'battle_bg', usage: 'battle_default', path: '/backgrounds/battle_bg.png' },
    { id: 'world_map_bg', usage: 'world_map', path: '/backgrounds/world_map.png' },
    { id: 'char_create_bg', usage: 'character_create', path: '/backgrounds/char_create_bg.png' },
    { id: 'camp_bg', usage: 'camp_scene', path: '/backgrounds/camp_bg.png' },
  ];

  spec.worldMap?.regions?.forEach(r => {
    backgrounds.push({ id: `bg_${r.id}`, usage: `region_${r.id}`, path: `/backgrounds/${r.id}.png` });
  });

  const raceSprites = spec.races?.map(r => ({
    id: r.id,
    name: r.name,
    path: r.icon,
    type: 'race_sprite',
  })) || [];

  const enemySprites = [
    ...(spec.enemies || []).map(e => ({ id: e.id, name: e.name, path: e.portrait, type: 'enemy_sprite' })),
    ...(spec.bosses || []).map(b => ({ id: b.id, name: b.name, path: b.portrait, type: 'boss_sprite' })),
  ];

  return {
    backgrounds,
    raceSprites,
    enemySprites,
    icons: [],
    effects: [],
    uiElements: [],
  };
}

import { SPRITE_BASE_PATH } from '../../data/spriteConstants';

const spriteBase = SPRITE_BASE_PATH;

const make = (folder, opts = {}) => {
  const fw = opts.frameWidth || 100;
  const fh = opts.frameHeight || 100;
  const base = `${spriteBase}/${folder}`;
  const result = {
    folder,
    frameWidth: fw,
    frameHeight: fh,
    filter: opts.filter || '',
    facesLeft: opts.facesLeft || false,
  };
  const anims = opts.anims || {};
  result.idle = { src: anims.idle || `${base}/idle.png`, frames: opts.idleFrames || 6 };
  result.walk = { src: anims.walk || `${base}/walk.png`, frames: opts.walkFrames || 8 };
  result.attack1 = { src: anims.attack1 || `${base}/attack1.png`, frames: opts.attack1Frames || 6 };
  if (opts.attack2Frames) result.attack2 = { src: anims.attack2 || `${base}/attack2.png`, frames: opts.attack2Frames };
  result.hurt = { src: anims.hurt || `${base}/hurt.png`, frames: opts.hurtFrames || 4 };
  result.death = { src: anims.death || `${base}/death.png`, frames: opts.deathFrames || 4 };
  if (opts.castFrames) result.cast = { src: anims.cast || `${base}/cast.png`, frames: opts.castFrames };
  return result;
};

const makeCP = (folder, opts = {}) => {
  const base = `${spriteBase}/${folder}`;
  const prefix = opts.prefix || '';
  return make(folder, {
    ...opts,
    anims: {
      idle: `${base}/${prefix}Idle.png`,
      walk: `${base}/${prefix}Walk.png`,
      attack1: `${base}/${prefix}Attack.png`,
      hurt: `${base}/${prefix}Hurt.png`,
      death: `${base}/${prefix}Death.png`,
      ...(opts.anims || {}),
    },
  });
};

const makeBoss72 = (folder, prefix, opts = {}) => {
  const base = `${spriteBase}/${folder}`;
  return make(folder, {
    frameWidth: 72, frameHeight: 72,
    idleFrames: 4, attack1Frames: opts.atkFrames || 4, hurtFrames: 2, deathFrames: opts.deathFrames || 4, walkFrames: 4,
    ...opts,
    anims: {
      idle: `${base}/${prefix}_idle.png`,
      walk: `${base}/${prefix}_walk.png`,
      attack1: `${base}/${prefix}_attack1.png`,
      hurt: `${base}/${prefix}_hurt.png`,
      death: `${base}/${prefix}_death.png`,
      ...(opts.anims || {}),
    },
  });
};

const makeMine48 = (folder, prefix, opts = {}) => {
  const base = `${spriteBase}/${folder}`;
  return make(folder, {
    frameWidth: 48, frameHeight: 48,
    idleFrames: 4, attack1Frames: opts.atkFrames || 4, hurtFrames: 2, deathFrames: opts.deathFrames || 4, walkFrames: 4,
    ...opts,
    anims: {
      idle: `${base}/${prefix}_idle.png`,
      walk: `${base}/${prefix}_walk.png`,
      attack1: `${base}/${prefix}_attack.png`,
      hurt: `${base}/${prefix}_hurt.png`,
      death: `${base}/${prefix}_death.png`,
      ...(opts.anims || {}),
    },
  });
};

const makeCP48 = (folder, opts = {}) => makeCP(folder, { frameWidth: 48, frameHeight: 48, idleFrames: 4, attack1Frames: opts.atkFrames || 4, hurtFrames: 2, deathFrames: opts.deathFrames || 4, walkFrames: 4, ...opts });
const makeCP96 = (folder, opts = {}) => makeCP(folder, { frameWidth: 96, frameHeight: 96, idleFrames: 4, attack1Frames: opts.atkFrames || 6, hurtFrames: 2, deathFrames: opts.deathFrames || 6, walkFrames: 4, ...opts });
const makeLabBoss = (folder, opts = {}) => make(folder, {
  frameWidth: 72, frameHeight: 72,
  idleFrames: 4, attack1Frames: 6, hurtFrames: 2, deathFrames: 6, walkFrames: 4,
  ...opts,
  anims: {
    idle: `${spriteBase}/${folder}/Idle.png`,
    walk: `${spriteBase}/${folder}/Walk.png`,
    attack1: `${spriteBase}/${folder}/Attack1.png`,
    hurt: `${spriteBase}/${folder}/Hurt.png`,
    death: `${spriteBase}/${folder}/Death.png`,
    ...(opts.anims || {}),
  },
});

export const HERO_SPRITES = {
  'shadow-knights': {
    shadowblade: make('dark-knight', { frameWidth: 128, frameHeight: 96, idleFrames: 4, attack1Frames: 8, hurtFrames: 3, deathFrames: 4, walkFrames: 6, filter: 'hue-rotate(190deg) saturate(1.3) brightness(1.05)' }),
    emberknight: make('fire-knight', { frameWidth: 288, frameHeight: 128, idleFrames: 8, attack1Frames: 11, attack2Frames: 19, hurtFrames: 6, deathFrames: 13, walkFrames: 8, filter: 'hue-rotate(200deg) saturate(1.3) brightness(1.1)', anims: { walk: `${spriteBase}/fire-knight/run.png`, hurt: `${spriteBase}/fire-knight/hurt.png` } }),
    veilweaver: make('evil-wizard-2', { frameWidth: 250, frameHeight: 250, idleFrames: 8, attack1Frames: 8, attack2Frames: 8, hurtFrames: 3, deathFrames: 7, walkFrames: 8, filter: 'hue-rotate(200deg) saturate(1.3) brightness(1.1)' }),
    doomcaller: make('necromancer', { frameWidth: 160, frameHeight: 128, idleFrames: 8, attack1Frames: 13, attack2Frames: 13, castFrames: 17, hurtFrames: 9, deathFrames: 5, walkFrames: 8, filter: 'hue-rotate(180deg) saturate(1.2) brightness(1.1)' }),
  },
  'starbound-corsairs': {
    gunslinger: make('human-ranger', { frameWidth: 100, frameHeight: 100, idleFrames: 8, attack1Frames: 20, attack2Frames: 28, hurtFrames: 14, deathFrames: 24, walkFrames: 8, filter: 'hue-rotate(140deg) saturate(1.3) brightness(1.1)' }),
    vanguard: make('fantasy-warrior', { frameWidth: 162, frameHeight: 162, idleFrames: 10, attack1Frames: 7, attack2Frames: 7, hurtFrames: 3, deathFrames: 7, walkFrames: 8, filter: 'hue-rotate(190deg) saturate(1.3) brightness(1.1)', anims: { walk: `${spriteBase}/fantasy-warrior/Run.png`, idle: `${spriteBase}/fantasy-warrior/Idle.png`, attack1: `${spriteBase}/fantasy-warrior/Attack1.png`, attack2: `${spriteBase}/fantasy-warrior/Attack2.png`, hurt: `${spriteBase}/fantasy-warrior/TakeHit.png`, death: `${spriteBase}/fantasy-warrior/Death.png` } }),
    technomancer: make('wizard', { frameWidth: 100, frameHeight: 100, idleFrames: 6, attack1Frames: 6, attack2Frames: 6, hurtFrames: 4, deathFrames: 4, walkFrames: 8, filter: 'hue-rotate(200deg) saturate(1.3) brightness(1.1)' }),
    riftwalker: make('wind-hashashin', { frameWidth: 288, frameHeight: 128, idleFrames: 8, attack1Frames: 8, attack2Frames: 18, castFrames: 30, hurtFrames: 6, deathFrames: 19, walkFrames: 8, filter: 'hue-rotate(150deg) saturate(1.3) brightness(1.1)', anims: { walk: `${spriteBase}/wind-hashashin/run.png`, hurt: `${spriteBase}/wind-hashashin/take_hit.png` } }),
  },
};

const SK_SPRITES = {
  skeleton: make('skeleton', { idleFrames: 6, attack1Frames: 6, hurtFrames: 4, deathFrames: 4, walkFrames: 8 }),
  skeleton_archer: make('skeleton-archer', { idleFrames: 6, attack1Frames: 9, hurtFrames: 4, deathFrames: 4, walkFrames: 8 }),
  armored_skeleton: make('armored-skeleton', { idleFrames: 6, attack1Frames: 8, hurtFrames: 4, deathFrames: 4, walkFrames: 8 }),
  greatsword_skeleton: make('greatsword-skeleton', { idleFrames: 6, attack1Frames: 9, hurtFrames: 4, deathFrames: 4, walkFrames: 9 }),
  evil_wizard: make('evil-wizard', { frameWidth: 150, frameHeight: 150, idleFrames: 8, attack1Frames: 8, hurtFrames: 4, deathFrames: 5, walkFrames: 8 }),
  werewolf: make('werewolf', { idleFrames: 6, attack1Frames: 9, hurtFrames: 4, deathFrames: 4, walkFrames: 8 }),
  slime: make('slime', { idleFrames: 6, attack1Frames: 6, hurtFrames: 4, deathFrames: 4, walkFrames: 6 }),
  werebear: make('werebear', { idleFrames: 6, attack1Frames: 9, hurtFrames: 4, deathFrames: 4, walkFrames: 8 }),

  mine_wisp: makeMine48('mine-wisp', 'Wisp', { atkFrames: 4, deathFrames: 6 }),
  mine_mimic: makeMine48('mine-mimic', 'Mimic', { anims: { idle: `${spriteBase}/mine-mimic/Mimic_idle.png`, walk: `${spriteBase}/mine-mimic/Mimic_Walk.png`, attack1: `${spriteBase}/mine-mimic/Mimic_Attack.png`, hurt: `${spriteBase}/mine-mimic/Mimic_hurt.png`, death: `${spriteBase}/mine-mimic/Mimic_death.png` } }),
  mine_bear: makeMine48('mine-bear', 'Bear'),
  mine_spider: makeMine48('mine-spider', 'Spider'),
  mine_toadman: makeMine48('mine-toadman', 'Toadman', { atkFrames: 6 }),
  mine_voodoo: makeMine48('mine-toadman-voodoo', 'voodoo', { anims: { walk: `${spriteBase}/mine-toadman-voodoo/Voodoo_walk.png` } }),

  demon_summoner: makeMine48('demon-event-boss', 'Summoner', { atkFrames: 6, deathFrames: 6, anims: { idle: `${spriteBase}/demon-event-boss/Summoner_idle.png`, walk: `${spriteBase}/demon-event-boss/Summoner_walk.png`, attack1: `${spriteBase}/demon-event-boss/Summoner_attack1.png`, hurt: `${spriteBase}/demon-event-boss/Summoner_hurt.png`, death: `${spriteBase}/demon-event-boss/Summoner_death.png` } }),
  demon_minion: makeMine48('demon-minions', 'Demon1', { atkFrames: 6, anims: { idle: `${spriteBase}/demon-minions/Demon1_idle.png`, walk: `${spriteBase}/demon-minions/Demon1_walk.png`, attack1: `${spriteBase}/demon-minions/Demon1_attack.png`, hurt: `${spriteBase}/demon-minions/Demon1_hurt.png`, death: `${spriteBase}/demon-minions/Demon1_death.png` } }),

  ruin_ancient: makeBoss72('ruin-boss-ancient', 'Ancient'),
  ruin_boar: makeBoss72('ruin-boss-wild-boar', 'Wild_boar'),
  ruin_viking: makeBoss72('ruin-boss-viking', 'Viking', { atkFrames: 6 }),
  desert_anubis: makeBoss72('desert-boss-anubis', 'Anubis', { atkFrames: 6, deathFrames: 6 }),
  desert_manticore: makeBoss72('desert-boss-manticore', 'Manticore'),
  desert_statue: makeBoss72('desert-boss-revived-statue', 'Revived_statue'),
  snow_mech: makeBoss72('snow-boss-ancient-mech', 'Ancient_mech', { atkFrames: 6, deathFrames: 6 }),
  snow_ooze: makeBoss72('snow-boss-frost-ooze', 'Frost_ooze', { atkFrames: 6 }),
  snow_bear: makeBoss72('snow-boss-magic-bear', 'Magic_bear', { atkFrames: 6 }),

  boss_demon: make('boss-demon', { frameWidth: 288, frameHeight: 160, idleFrames: 6, attack1Frames: 15, hurtFrames: 5, deathFrames: 22, walkFrames: 12, anims: { attack1: `${spriteBase}/boss-demon/cleave.png`, hurt: `${spriteBase}/boss-demon/take_hit.png` } }),
};

const SC_SPRITES = {
  orc: make('orc', { idleFrames: 6, attack1Frames: 6, hurtFrames: 4, deathFrames: 4, walkFrames: 8 }),
  arcane_archer: make('arcane-archer', { frameWidth: 64, frameHeight: 64, idleFrames: 8, attack1Frames: 8, attack2Frames: 8, hurtFrames: 8, deathFrames: 8, walkFrames: 8 }),
  armored_orc: make('armored-orc', { idleFrames: 6, attack1Frames: 7, hurtFrames: 4, deathFrames: 4, walkFrames: 8 }),
  crystal_mauler: make('crystal-mauler', { frameWidth: 288, frameHeight: 128, idleFrames: 8, attack1Frames: 7, hurtFrames: 6, deathFrames: 15, walkFrames: 8, anims: { walk: `${spriteBase}/crystal-mauler/run.png`, hurt: `${spriteBase}/crystal-mauler/take_hit.png` } }),
  barbarian_mage: make('barbarian-mage', { frameWidth: 231, frameHeight: 190, idleFrames: 6, attack1Frames: 8, hurtFrames: 4, deathFrames: 7, walkFrames: 8, anims: { idle: `${spriteBase}/barbarian-mage/Wizard Pack/Idle.png`, attack1: `${spriteBase}/barbarian-mage/Wizard Pack/Attack1.png`, hurt: `${spriteBase}/barbarian-mage/Wizard Pack/Hit.png`, death: `${spriteBase}/barbarian-mage/Wizard Pack/Death.png`, walk: `${spriteBase}/barbarian-mage/Wizard Pack/Run.png` } }),
  slime: make('slime', { idleFrames: 6, attack1Frames: 6, hurtFrames: 4, deathFrames: 4, walkFrames: 6 }),

  cyber_officer: makeCP48('cyber-police-officer', { atkFrames: 6 }),
  cyber_sergeant: makeCP48('cyber-police-sergeant', { anims: { attack1: `${spriteBase}/cyber-police-sergeant/Attack1.png` } }),
  cyber_chef: makeCP48('cyber-police-chef', { atkFrames: 6 }),
  cyber_patrol: makeCP48('cyber-police-patrol', { deathFrames: 6 }),
  cyber_drone: makeCP48('cyber-police-drone'),
  cyber_cannon: makeCP48('cyber-police-cannon'),

  gang_brigand: makeCP48('gang-brigand', { idleFrames: 6, deathFrames: 6 }),
  gang_shooter: makeCP48('gang-shooter', { anims: { attack1: `${spriteBase}/gang-shooter/Attack1.png` } }),
  gang_wallbreaker: makeCP48('gang-wallbreaker', { atkFrames: 8 }),
  gang_shockbot: makeCP48('gang-shockbot', { atkFrames: 6 }),
  gang_battledrone: makeCP48('gang-battledrone', { anims: { attack1: `${spriteBase}/gang-battledrone/Attack1.png` } }),
  gang_stepper: makeCP48('gang-stepper-cannon'),

  mecha_scout: makeCP96('mecha-scout'),
  mecha_assault: makeCP96('mecha-assault'),
  mecha_heavy: makeCP96('mecha-heavy'),

  street_brawler: makeCP96('street-boss-brawler', { anims: { attack1: `${spriteBase}/street-boss-brawler/Attack1.png` } }),
  street_pyro: makeCP96('street-boss-pyro', { anims: { attack1: `${spriteBase}/street-boss-pyro/Attack1.png` } }),
  street_bomber: makeCP96('street-boss-bomber', { idleFrames: 6, anims: { attack1: `${spriteBase}/street-boss-bomber/Attack1.png` } }),

  lab_mutant: makeLabBoss('lab-boss-mutant'),
  lab_cyborg: makeLabBoss('lab-boss-cyborg'),
  lab_mech: makeLabBoss('lab-boss-mech', { deathFrames: 5 }),

  frost_guardian: make('frost-guardian', { frameWidth: 192, frameHeight: 128, idleFrames: 6, attack1Frames: 14, hurtFrames: 7, deathFrames: 16, walkFrames: 10, anims: { hurt: `${spriteBase}/frost-guardian/take_hit.png` } }),

  alien_ship1: make('alien_ship1', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 4, hurtFrames: 4, deathFrames: 9, walkFrames: 4, facesLeft: true }),
  alien_ship2: make('alien_ship2', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 4, hurtFrames: 4, deathFrames: 9, walkFrames: 4, facesLeft: true }),
  alien_ship3: make('alien_ship3', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 4, hurtFrames: 4, deathFrames: 9, walkFrames: 4, facesLeft: true }),
  alien_ship4: make('alien_ship4', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 4, hurtFrames: 4, deathFrames: 9, walkFrames: 4, facesLeft: true }),
  alien_ship5: make('alien_ship5', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 4, hurtFrames: 4, deathFrames: 9, walkFrames: 4, facesLeft: true }),
  alien_ship6: make('alien_ship6', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 4, hurtFrames: 4, deathFrames: 9, walkFrames: 4, facesLeft: true }),

  pirate_ship1: make('pirate_ship1', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 4, hurtFrames: 4, deathFrames: 10, walkFrames: 4, facesLeft: true }),
  pirate_ship2: make('pirate_ship2', { frameWidth: 64, frameHeight: 64, idleFrames: 8, attack1Frames: 4, hurtFrames: 4, deathFrames: 11, walkFrames: 8, facesLeft: true }),
  pirate_ship3: make('pirate_ship3', { frameWidth: 64, frameHeight: 64, idleFrames: 8, attack1Frames: 6, hurtFrames: 4, deathFrames: 11, walkFrames: 8, facesLeft: true }),
  pirate_ship4: make('pirate_ship4', { frameWidth: 64, frameHeight: 64, idleFrames: 8, attack1Frames: 8, hurtFrames: 4, deathFrames: 11, walkFrames: 8, facesLeft: true }),
  pirate_ship5: make('pirate_ship5', { frameWidth: 64, frameHeight: 64, idleFrames: 4, attack1Frames: 16, hurtFrames: 4, deathFrames: 11, walkFrames: 4, facesLeft: true }),
  pirate_ship6: make('pirate_ship6', { frameWidth: 64, frameHeight: 64, idleFrames: 16, attack1Frames: 16, hurtFrames: 4, deathFrames: 11, walkFrames: 16, facesLeft: true }),
};

export const UNDERWATER_SPRITES = {
  sea_eel: makeCP48('sea-eel', { atkFrames: 6, deathFrames: 6 }),
  sea_crab: makeCP48('sea-crab', { atkFrames: 6, deathFrames: 6 }),
  sea_archer: makeCP48('sea-archer', { atkFrames: 6, deathFrames: 6 }),
  sea_jellyfish: makeCP48('sea-jellyfish', { atkFrames: 6, deathFrames: 6 }),
  sea_anglerfish: makeCP48('sea-anglerfish', { atkFrames: 6, deathFrames: 6 }),
  sea_shark: makeCP48('sea-shark', { atkFrames: 6, deathFrames: 6 }),
  boss_kraken: makeCP96('sea-boss-kraken', { atkFrames: 6, deathFrames: 6, anims: { attack1: `${spriteBase}/sea-boss-kraken/Attack1.png` } }),
  boss_leviathan: makeCP96('sea-boss-leviathan', { atkFrames: 6, deathFrames: 6, anims: { attack1: `${spriteBase}/sea-boss-leviathan/Attack1.png` } }),
};

const SK_ENEMY_MAP = {
  'shadow-wisp': 'mine_wisp',
  'ember-imp': 'demon_minion',
  'veil-stalker': 'mine_spider',
  'crystal-golem': 'desert_statue',
  'dusk-hound': 'werewolf',
  'plagued-knight': 'armored_skeleton',
  'ash-wraith': 'evil_wizard',
  'void-spider': 'mine_spider',
  'corrupted-treant': 'ruin_boar',
  'veil-assassin': 'skeleton_archer',
  'flame-revenant': 'greatsword_skeleton',
  'shadow-drake': 'desert_manticore',
  'obsidian-sentinel': 'desert_statue',
  'mind-flayer': 'mine_voodoo',
  'bone-legion': 'skeleton',
  'ember-elemental': 'mine_wisp',
  'nightcrawler': 'mine_spider',
  'doom-priest': 'demon_summoner',
  'storm-gargoyle': 'ruin_viking',
  'blood-knight': 'ruin_ancient',
  'rift-horror': 'snow_mech',
  'iron-juggernaut': 'snow_mech',
  'veil-serpent': 'snow_ooze',
  'doom-herald': 'mine_toadman',
};

const SK_BOSS_MAP = {
  'lord-umbral': 'boss_demon',
  'queen-cinder': 'desert_anubis',
  'the-hollow': 'snow_bear',
  'the-duskfall': 'ruin_ancient',
  'duskfall': 'ruin_ancient',
};

const SC_ENEMY_MAP = {
  'scrap-drone': 'cyber_drone',
  'void-rat': 'slime',
  'pirate-grunt': 'gang_brigand',
  'rogue-ai': 'gang_shockbot',
  'rift-crawler': 'slime',
  'bounty-hunter': 'cyber_officer',
  'mech-sentry': 'mecha_scout',
  'void-leech': 'cyber_drone',
  'plasma-beast': 'mecha_assault',
  'corsair-captain': 'street_brawler',
  'synth-assassin': 'cyber_sergeant',
  'nebula-wraith': 'barbarian_mage',
  'warp-spider': 'gang_shockbot',
  'war-frigate': 'mecha_heavy',
  'xeno-warrior': 'gang_wallbreaker',
  'gravity-titan': 'mecha_heavy',
  'data-phantom': 'barbarian_mage',
  'star-wyrm': 'crystal_mauler',
  'rift-guardian': 'lab_mech',
  'shadow-fleet': 'gang_shooter',
  'quantum-horror': 'lab_mutant',
  'tech-priest': 'cyber_cannon',
  'solar-knight': 'street_pyro',
  'void-herald': 'lab_cyborg',
  'alien-fighter': 'alien_ship1',
  'alien-interceptor': 'alien_ship2',
  'alien-bomber': 'alien_ship3',
  'alien-cruiser': 'alien_ship4',
  'alien-destroyer': 'alien_ship5',
  'alien-dreadnought': 'alien_ship6',
  'pirate-skiff': 'pirate_ship1',
  'pirate-raider': 'pirate_ship2',
  'pirate-corsair-ship': 'pirate_ship3',
  'pirate-gunship': 'pirate_ship4',
  'pirate-frigate': 'pirate_ship5',
  'pirate-galleon': 'pirate_ship6',
};

const SC_BOSS_MAP = {
  'iron-admiral': 'mecha_heavy',
  'queen-nexus': 'lab_mech',
  'dread-corsair': 'street_brawler',
  'blackstar': 'street_brawler',
  'the-rift': 'frost_guardian',
  'rift entity': 'frost_guardian',
};

const GENERIC_KEYWORDS = {
  wisp: 'mine_wisp',
  imp: 'demon_minion',
  spider: 'mine_spider',
  golem: 'desert_statue',
  hound: 'werewolf',
  knight: 'armored_skeleton',
  wraith: 'evil_wizard',
  treant: 'ruin_boar',
  assassin: 'skeleton_archer',
  drake: 'desert_manticore',
  sentinel: 'desert_statue',
  flayer: 'mine_voodoo',
  legionnaire: 'skeleton',
  elemental: 'mine_wisp',
  crawler: 'mine_spider',
  priest: 'demon_summoner',
  gargoyle: 'ruin_viking',
  revenant: 'greatsword_skeleton',
  horror: 'snow_mech',
  juggernaut: 'snow_mech',
  serpent: 'snow_ooze',
  herald: 'mine_toadman',
  bear: 'mine_bear',
  mimic: 'mine_mimic',
  toad: 'mine_toadman',
  wolf: 'werewolf',
  beast: 'werewolf',
  stalker: 'mine_spider',
  soldier: 'skeleton',
  guard: 'armored_skeleton',
  fighter: 'skeleton',
  warrior: 'greatsword_skeleton',

  drone: 'cyber_drone',
  rat: 'slime',
  grunt: 'gang_brigand',
  pirate: 'gang_brigand',
  hunter: 'cyber_officer',
  mech: 'mecha_scout',
  sentry: 'mecha_scout',
  leech: 'cyber_drone',
  captain: 'street_brawler',
  corsair: 'street_brawler',
  sniper: 'gang_shooter',
  shooter: 'gang_shooter',
  titan: 'mecha_heavy',
  phantom: 'barbarian_mage',
  mage: 'barbarian_mage',
  sorcerer: 'barbarian_mage',
  robot: 'gang_shockbot',
  cyborg: 'lab_cyborg',
  mutant: 'lab_mutant',
  officer: 'cyber_officer',
  sergeant: 'cyber_sergeant',
  cannon: 'cyber_cannon',
  patrol: 'cyber_patrol',
  frigate: 'pirate_ship5',
  ship: 'alien_ship1',
  fighter: 'alien_ship2',
  interceptor: 'alien_ship3',
  bomber: 'alien_ship3',
  cruiser: 'alien_ship4',
  dreadnought: 'alien_ship6',
  skiff: 'pirate_ship1',
  raider: 'pirate_ship2',
  gunship: 'pirate_ship4',
  galleon: 'pirate_ship6',
  wyrm: 'crystal_mauler',
  brute: 'armored_orc',
  enforcer: 'armored_orc',
  warden: 'armored_orc',
  berserker: 'orc',
  destroyer: 'orc',
  ravager: 'orc',
  archer: 'arcane_archer',
  scout: 'arcane_archer',
  gunner: 'gang_shooter',
  marksman: 'gang_shooter',
  caster: 'barbarian_mage',
  specter: 'barbarian_mage',
};

export function resolveHeroSprite(gameId, classId) {
  const classKey = classId?.toLowerCase().replace(/\s+/g, '_');
  return HERO_SPRITES[gameId]?.[classKey] || null;
}

export function resolveEnemySprite(gameId, enemy) {
  const name = (enemy.name || '').toLowerCase();
  const id = (enemy.id || '').toLowerCase();
  const pool = gameId === 'starbound-corsairs' ? SC_SPRITES : SK_SPRITES;
  const directMap = gameId === 'starbound-corsairs' ? SC_ENEMY_MAP : SK_ENEMY_MAP;
  const bossMap = gameId === 'starbound-corsairs' ? SC_BOSS_MAP : SK_BOSS_MAP;

  if (enemy.isBoss) {
    for (const [bossId, spriteKey] of Object.entries(bossMap)) {
      if (id.includes(bossId) || name.includes(bossId.replace(/-/g, ' '))) {
        if (pool[spriteKey]) return pool[spriteKey];
      }
    }
    const bossKeys = Object.keys(pool).filter(k => k.includes('boss') || k.includes('mech') || k.includes('ancient') || k.includes('guardian'));
    if (bossKeys.length > 0) {
      const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return pool[bossKeys[hash % bossKeys.length]];
    }
    return Object.values(pool)[0];
  }

  for (const [enemyId, spriteKey] of Object.entries(directMap)) {
    if (id.includes(enemyId) || name.includes(enemyId.replace(/-/g, ' '))) {
      if (pool[spriteKey]) return pool[spriteKey];
    }
  }

  for (const [keyword, spriteKey] of Object.entries(GENERIC_KEYWORDS)) {
    if (name.includes(keyword)) {
      if (pool[spriteKey]) return pool[spriteKey];
    }
  }

  const keys = Object.keys(pool);
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[keys[hash % keys.length]];
}

function makeFrameEffect(basePath, frameCount, size, opts = {}) {
  return {
    type: 'frames',
    frames: Array.from({ length: frameCount }, (_, i) => `${basePath}/${i + 1}.png`),
    size: size || 96,
    speed: opts.speed || 80,
    filter: opts.filter || '',
    ...opts,
  };
}

export const VFX_SPRITES = {
  slash: makeFrameEffect('/sprites/effects/slashes/type1', 10, 96),
  slash2: makeFrameEffect('/sprites/effects/slashes/type2', 5, 96),
  slash3: makeFrameEffect('/sprites/effects/slashes/type3', 10, 96),
  slash_shadow: makeFrameEffect('/sprites/effects/slashes/type4', 8, 96, { filter: 'hue-rotate(270deg) brightness(0.8) saturate(2)' }),
  slash_ember: makeFrameEffect('/sprites/effects/slashes/type6', 10, 96, { filter: 'hue-rotate(340deg) saturate(1.5) brightness(1.2)' }),
  slash_veil: makeFrameEffect('/sprites/effects/slashes/type7', 10, 96, { filter: 'hue-rotate(180deg) saturate(1.8)' }),
  slash_doom: makeFrameEffect('/sprites/effects/slashes/type8', 10, 96, { filter: 'hue-rotate(300deg) saturate(2) brightness(0.7)' }),
  fire: makeFrameEffect('/sprites/effects/fire/type1', 7, 96),
  fire2: makeFrameEffect('/sprites/effects/fire/type3', 7, 96),
  fire_large: makeFrameEffect('/sprites/effects/fire/type5', 7, 120),
  fire_inferno: makeFrameEffect('/sprites/effects/fire/type8', 6, 140, { filter: 'saturate(1.5) brightness(1.3)' }),
  magic: makeFrameEffect('/sprites/effects/magic/type1', 8, 96),
  magic2: makeFrameEffect('/sprites/effects/magic/type3', 10, 96),
  magic_shadow: makeFrameEffect('/sprites/effects/magic/type4', 12, 120, { filter: 'hue-rotate(270deg) saturate(2)' }),
  magic_veil: makeFrameEffect('/sprites/effects/magic/type6', 10, 120, { filter: 'hue-rotate(180deg) brightness(1.2)' }),
  magic_doom: makeFrameEffect('/sprites/effects/magic/type7', 12, 120, { filter: 'hue-rotate(300deg) saturate(2) brightness(0.8)' }),
  magic_large: makeFrameEffect('/sprites/effects/magic/type10', 16, 140),
  explosion: makeFrameEffect('/sprites/effects/explosions/type1', 9, 120),
  explosion2: makeFrameEffect('/sprites/effects/explosions/type3', 8, 100),
  explosion_big: makeFrameEffect('/sprites/effects/explosions/type5', 9, 140),
  explosion_shadow: makeFrameEffect('/sprites/effects/explosions/type7', 9, 120, { filter: 'hue-rotate(270deg) saturate(1.8) brightness(0.8)' }),
  explosion_ember: makeFrameEffect('/sprites/effects/explosions/type8', 11, 130, { filter: 'hue-rotate(20deg) saturate(1.4)' }),
  ice: makeFrameEffect('/sprites/effects/magic/type5', 8, 96, { filter: 'hue-rotate(180deg) brightness(1.4) saturate(0.8)' }),
  poison: makeFrameEffect('/sprites/effects/magic/type2', 6, 96, { filter: 'hue-rotate(90deg) saturate(2)' }),
  lightning: makeFrameEffect('/sprites/effects/magic/type9', 11, 110, { filter: 'hue-rotate(60deg) brightness(1.5) saturate(0.7)' }),
  heal: makeFrameEffect('/sprites/effects/magic/type8', 7, 96, { filter: 'hue-rotate(120deg) brightness(1.3)' }),
  shield: makeFrameEffect('/sprites/effects/magic/type6', 10, 100, { filter: 'hue-rotate(200deg) brightness(1.4) saturate(0.6)' }),
  blood: makeFrameEffect('/sprites/effects/slashes/type9', 8, 80, { filter: 'hue-rotate(0deg) saturate(3) brightness(0.6)' }),
  spark: makeFrameEffect('/sprites/effects/explosions/type10', 7, 80, { filter: 'brightness(1.5) saturate(0.6)' }),
  bomb: makeFrameEffect('/sprites/effects/explosions/type4', 9, 130),
  plasma: { src: '/sprites/space_traps/plasma_cycle.png', frames: 8, frameWidth: 128, frameHeight: 128 },
  plasma_explode: { src: '/sprites/space_traps/plasma_explode.png', frames: 15, frameWidth: 128, frameHeight: 128 },
  bomb_space: { src: '/sprites/space_traps/bomb_explode.png', frames: 13, frameWidth: 256, frameHeight: 256 },
  meteor: { src: '/sprites/space_traps/meteor.png', frames: 6, frameWidth: 64, frameHeight: 64 },
  fire_anim: makeFrameEffect('/sprites/effects/fire/type2', 8, 96),
  flame_small: makeFrameEffect('/sprites/effects/fire/type7', 6, 64),
};

export function getVfxForAbility(ability, gameId) {
  if (!ability) return 'slash';
  const name = (ability.name || '').toLowerCase();
  const effect = (ability.effect || '').toLowerCase();
  const type = (ability.type || '').toLowerCase();
  const isSK = gameId === 'shadow-knights';

  if (isSK) {
    if (name.includes('umbral') || name.includes('shadow step') || name.includes('phantasm')) return 'slash_shadow';
    if (name.includes('flame') || name.includes('ember') || name.includes('inferno') || name.includes('ignite') || name.includes('cinder')) return isSK ? 'fire_inferno' : 'fire';
    if (name.includes('veil') || name.includes('thread') || name.includes('reality') || name.includes('weave')) return 'magic_veil';
    if (name.includes('doom') || name.includes('cataclysm') || name.includes('curse') || name.includes('entropy') || name.includes('wither')) return 'magic_doom';
    if (name.includes('fire') || name.includes('burn') || name.includes('blaze') || name.includes('molten')) return 'explosion_ember';
    if (name.includes('shadow') || name.includes('dark') || name.includes('night') || name.includes('void') || name.includes('shade')) return 'explosion_shadow';
  }

  if (effect === 'burn' || name.includes('fire') || name.includes('ember') || name.includes('flame') || name.includes('plasma') || name.includes('inferno')) return 'fire';
  if (effect === 'poison' || name.includes('poison') || name.includes('toxic') || name.includes('venom') || name.includes('plague') || name.includes('decay') || name.includes('acid')) return 'poison';
  if (name.includes('ice') || name.includes('frost') || name.includes('cryo') || name.includes('freeze') || name.includes('blizzard')) return 'ice';
  if (name.includes('lightning') || name.includes('thunder') || name.includes('shock') || name.includes('ion') || name.includes('emp') || name.includes('electric')) return 'lightning';
  if (effect === 'bleed' || name.includes('bleed') || name.includes('blood') || name.includes('savage') || name.includes('rend')) return 'blood';
  if (type === 'heal' || name.includes('heal') || name.includes('mend') || name.includes('nano') || name.includes('repair')) return 'heal';
  if (type === 'buff' || name.includes('shield') || name.includes('ward') || name.includes('barrier') || name.includes('fortify') || name.includes('rally')) return 'shield';
  if (name.includes('cannon') || name.includes('blast') || name.includes('bomb') || name.includes('explod') || name.includes('missile') || name.includes('rocket') || name.includes('ordnance') || name.includes('grenade')) return 'bomb';
  if (name.includes('spark') || name.includes('pulse') || name.includes('overload') || name.includes('surge')) return 'spark';
  if (type === 'magic' || type === 'magical' || name.includes('arcane') || name.includes('rift') || name.includes('void') || name.includes('shadow') || name.includes('doom') || name.includes('dark')) return 'magic';
  return 'slash';
}

export const SK_ATTACK_STYLES = {
  shadowblade: 'blink',
  emberknight: 'dash',
  veilweaver: 'cast',
  doomcaller: 'cast',
};

export function getAttackStyle(classId, gameId) {
  if (gameId !== 'shadow-knights') return 'melee';
  const id = (classId || '').toLowerCase().replace(/[\s-]+/g, '');
  return SK_ATTACK_STYLES[id] || 'melee';
}

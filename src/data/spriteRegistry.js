import { SPRITE_BASE_PATH } from './spriteConstants';

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const entry = (name, category, genre, type, folder, frameWidth, frameHeight, animations, opts = {}) => ({
  id: `spr-${category}-${slugify(name)}`,
  name,
  category,
  genre,
  type,
  folder,
  path: `${SPRITE_BASE_PATH}/${folder}`,
  frameWidth,
  frameHeight,
  animations,
  facesLeft: opts.facesLeft || false,
  filter: opts.filter || '',
  tags: opts.tags || [],
});

const anim = (name, file, frames, speed = 100) => ({ name, file, frames, speed });

export const SPRITE_REGISTRY = [

  entry('Shadowblade', 'heroes', 'fantasy', 'hero', 'dark-knight', 128, 96, [
    anim('idle', 'idle.png', 4, 120), anim('walk', 'walk.png', 6, 80), anim('attack1', 'attack1.png', 8, 60),
    anim('hurt', 'hurt.png', 3, 70), anim('death', 'death.png', 4, 80),
  ], { filter: 'hue-rotate(190deg) saturate(1.3) brightness(1.05)', tags: ['shadow-knights'] }),

  entry('Emberknight', 'heroes', 'fantasy', 'hero', 'fire-knight', 288, 128, [
    anim('idle', 'idle.png', 8, 120), anim('walk', 'run.png', 8, 80), anim('attack1', 'attack1.png', 11, 55),
    anim('attack2', 'attack2.png', 19, 50), anim('hurt', 'hurt.png', 6, 70), anim('death', 'death.png', 13, 60),
  ], { tags: ['shadow-knights'] }),

  entry('Veilweaver', 'heroes', 'fantasy', 'hero', 'evil-wizard-2', 250, 250, [
    anim('idle', 'idle.png', 8, 120), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 8, 60),
    anim('attack2', 'attack2.png', 8, 60), anim('hurt', 'hurt.png', 3, 70), anim('death', 'death.png', 7, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Doomcaller', 'heroes', 'fantasy', 'hero', 'necromancer', 160, 128, [
    anim('idle', 'idle.png', 8, 120), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 13, 55),
    anim('attack2', 'attack2.png', 13, 55), anim('cast', 'cast2.png', 17, 50),
    anim('hurt', 'hurt.png', 9, 70), anim('death', 'death.png', 5, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Gunslinger', 'heroes', 'scifi', 'hero', 'human-ranger', 100, 100, [
    anim('idle', 'idle.png', 8, 120), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 20, 45),
    anim('attack2', 'attack2.png', 28, 40), anim('hurt', 'hurt.png', 14, 55), anim('death', 'death.png', 24, 50),
  ], { tags: ['starbound-corsairs'] }),

  entry('Vanguard', 'heroes', 'scifi', 'hero', 'fantasy-warrior', 162, 162, [
    anim('idle', 'Idle.png', 10, 120), anim('walk', 'Run.png', 8, 80), anim('attack1', 'Attack1.png', 7, 60),
    anim('attack2', 'Attack2.png', 7, 60), anim('hurt', 'TakeHit.png', 3, 70), anim('death', 'Death.png', 7, 80),
  ], { tags: ['starbound-corsairs'] }),

  entry('Technomancer', 'heroes', 'scifi', 'hero', 'wizard', 100, 100, [
    anim('idle', 'idle.png', 6, 120), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 6, 60),
    anim('attack2', 'attack2.png', 6, 60), anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ], { tags: ['starbound-corsairs'] }),

  entry('Riftwalker', 'heroes', 'scifi', 'hero', 'wind-hashashin', 288, 128, [
    anim('idle', 'idle.png', 8, 120), anim('walk', 'run.png', 8, 80), anim('attack1', 'attack1.png', 8, 60),
    anim('attack2', 'attack2.png', 18, 45), anim('special', 'special.png', 30, 40),
    anim('hurt', 'take_hit.png', 6, 70), anim('death', 'death.png', 19, 55),
  ], { tags: ['starbound-corsairs'] }),

  entry('Skeleton', 'enemies', 'fantasy', 'enemy', 'skeleton', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 6, 60),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Skeleton Archer', 'enemies', 'fantasy', 'enemy', 'skeleton-archer', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 9, 55),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Armored Skeleton', 'enemies', 'fantasy', 'enemy', 'armored-skeleton', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 8, 60),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Greatsword Skeleton', 'enemies', 'fantasy', 'enemy', 'greatsword-skeleton', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 9, 80), anim('attack1', 'attack1.png', 9, 55),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Evil Wizard', 'enemies', 'fantasy', 'enemy', 'evil-wizard', 150, 150, [
    anim('idle', 'idle.png', 8), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 8, 60),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 5, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Werewolf', 'enemies', 'fantasy', 'enemy', 'werewolf', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 9, 55),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Slime', 'enemies', 'fantasy', 'enemy', 'slime', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 6, 80), anim('attack1', 'attack1.png', 6, 60),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ]),

  entry('Werebear', 'enemies', 'fantasy', 'enemy', 'werebear', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 9, 55),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ], { tags: ['shadow-knights'] }),

  entry('Orc', 'enemies', 'fantasy', 'enemy', 'orc', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 6, 60),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ]),

  entry('Armored Orc', 'enemies', 'fantasy', 'enemy', 'armored-orc', 100, 100, [
    anim('idle', 'idle.png', 6), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 7, 60),
    anim('hurt', 'hurt.png', 4, 70), anim('death', 'death.png', 4, 80),
  ]),

  entry('Arcane Archer', 'enemies', 'fantasy', 'enemy', 'arcane-archer', 64, 64, [
    anim('idle', 'idle.png', 8), anim('walk', 'walk.png', 8, 80), anim('attack1', 'attack1.png', 8, 60),
    anim('attack2', 'attack2.png', 8, 60), anim('hurt', 'hurt.png', 8, 55), anim('death', 'death.png', 8, 60),
  ]),

  entry('Crystal Mauler', 'enemies', 'fantasy', 'enemy', 'crystal-mauler', 288, 128, [
    anim('idle', 'idle.png', 8, 120), anim('run', 'run.png', 8, 80), anim('attack1', 'attack1.png', 7, 60),
    anim('hurt', 'take_hit.png', 6, 70), anim('death', 'death.png', 15, 55),
  ]),

  entry('Barbarian Mage', 'enemies', 'fantasy', 'enemy', 'barbarian-mage', 231, 190, [
    anim('idle', 'Wizard Pack/Idle.png', 6, 120), anim('run', 'Wizard Pack/Run.png', 8, 80),
    anim('attack1', 'Wizard Pack/Attack1.png', 8, 60), anim('hurt', 'Wizard Pack/Hit.png', 4, 70),
    anim('death', 'Wizard Pack/Death.png', 7, 80),
  ]),

  entry('Mine Wisp', 'enemies', 'fantasy', 'enemy', 'mine-wisp', 48, 48, [
    anim('idle', 'Wisp_idle.png', 4), anim('walk', 'Wisp_walk.png', 4, 80), anim('attack1', 'Wisp_attack.png', 4, 60),
    anim('hurt', 'Wisp_hurt.png', 2, 70), anim('death', 'Wisp_death.png', 6, 60),
  ]),

  entry('Mine Mimic', 'enemies', 'fantasy', 'enemy', 'mine-mimic', 48, 48, [
    anim('idle', 'Mimic_idle.png', 4), anim('walk', 'Mimic_Walk.png', 4, 80), anim('attack1', 'Mimic_Attack.png', 4, 60),
    anim('hurt', 'Mimic_hurt.png', 2, 70), anim('death', 'Mimic_death.png', 4, 60),
  ]),

  entry('Mine Bear', 'enemies', 'fantasy', 'enemy', 'mine-bear', 48, 48, [
    anim('idle', 'Bear_idle.png', 4), anim('walk', 'Bear_walk.png', 4, 80), anim('attack1', 'Bear_attack.png', 4, 60),
    anim('hurt', 'Bear_hurt.png', 2, 70), anim('death', 'Bear_death.png', 4, 60),
  ]),

  entry('Mine Spider', 'enemies', 'fantasy', 'enemy', 'mine-spider', 48, 48, [
    anim('idle', 'Spider_idle.png', 4), anim('walk', 'Spider_walk.png', 4, 80), anim('attack1', 'Spider_attack.png', 4, 60),
    anim('hurt', 'Spider_hurt.png', 2, 70), anim('death', 'Spider_death.png', 4, 60),
  ]),

  entry('Mine Toadman', 'enemies', 'fantasy', 'enemy', 'mine-toadman', 48, 48, [
    anim('idle', 'Toadman_idle.png', 4), anim('walk', 'Toadman_walk.png', 4, 80), anim('attack1', 'Toadman_attack.png', 6, 60),
    anim('hurt', 'Toadman_hurt.png', 2, 70), anim('death', 'Toadman_death.png', 4, 60),
  ]),

  entry('Voodoo Toadman', 'enemies', 'fantasy', 'enemy', 'mine-toadman-voodoo', 48, 48, [
    anim('idle', 'voodoo_idle.png', 4), anim('walk', 'Voodoo_walk.png', 4, 80), anim('attack1', 'voodoo_attack.png', 4, 60),
    anim('hurt', 'voodoo_hurt.png', 2, 70), anim('death', 'voodoo_death.png', 4, 60),
  ]),

  entry('Demon Summoner', 'bosses', 'fantasy', 'boss', 'demon-event-boss', 48, 48, [
    anim('idle', 'Summoner_idle.png', 4), anim('walk', 'Summoner_walk.png', 4, 80), anim('attack1', 'Summoner_attack1.png', 6, 55),
    anim('hurt', 'Summoner_hurt.png', 2, 70), anim('death', 'Summoner_death.png', 6, 60),
  ]),

  entry('Demon Minion', 'enemies', 'fantasy', 'enemy', 'demon-minions', 48, 48, [
    anim('idle', 'Demon1_idle.png', 4), anim('walk', 'Demon1_walk.png', 4, 80), anim('attack1', 'Demon1_attack.png', 6, 60),
    anim('hurt', 'Demon1_hurt.png', 2, 70), anim('death', 'Demon1_death.png', 4, 60),
  ]),

  entry('Ancient Boss', 'bosses', 'fantasy', 'boss', 'ruin-boss-ancient', 72, 72, [
    anim('idle', 'Ancient_idle.png', 4), anim('walk', 'Ancient_walk.png', 4, 80), anim('attack1', 'Ancient_attack1.png', 4, 60),
    anim('hurt', 'Ancient_hurt.png', 2, 70), anim('death', 'Ancient_death.png', 4, 60),
  ]),

  entry('Wild Boar Boss', 'bosses', 'fantasy', 'boss', 'ruin-boss-wild-boar', 72, 72, [
    anim('idle', 'Wild_boar_idle.png', 4), anim('walk', 'Wild_boar_walk.png', 4, 80), anim('attack1', 'Wild_boar_attack1.png', 4, 60),
    anim('hurt', 'Wild_boar_hurt.png', 2, 70), anim('death', 'Wild_boar_death.png', 4, 60),
  ]),

  entry('Viking Boss', 'bosses', 'fantasy', 'boss', 'ruin-boss-viking', 72, 72, [
    anim('idle', 'Viking_idle.png', 4), anim('walk', 'Viking_walk.png', 4, 80), anim('attack1', 'Viking_attack1.png', 6, 55),
    anim('hurt', 'Viking_hurt.png', 2, 70), anim('death', 'Viking_death.png', 4, 60),
  ]),

  entry('Anubis Boss', 'bosses', 'fantasy', 'boss', 'desert-boss-anubis', 72, 72, [
    anim('idle', 'Anubis_idle.png', 4), anim('walk', 'Anubis_walk.png', 4, 80), anim('attack1', 'Anubis_attack1.png', 6, 55),
    anim('hurt', 'Anubis_hurt.png', 2, 70), anim('death', 'Anubis_death.png', 6, 60),
  ]),

  entry('Manticore Boss', 'bosses', 'fantasy', 'boss', 'desert-boss-manticore', 72, 72, [
    anim('idle', 'Manticore_idle.png', 4), anim('walk', 'Manticore_walk.png', 4, 80), anim('attack1', 'Manticore_attack1.png', 4, 60),
    anim('hurt', 'Manticore_hurt.png', 2, 70), anim('death', 'Manticore_death.png', 4, 60),
  ]),

  entry('Revived Statue Boss', 'bosses', 'fantasy', 'boss', 'desert-boss-revived-statue', 72, 72, [
    anim('idle', 'Revived_statue_idle.png', 4), anim('walk', 'Revived_statue_walk.png', 4, 80),
    anim('attack1', 'Revived_statue_attack1.png', 4, 60), anim('hurt', 'Revived_statue_hurt.png', 2, 70),
    anim('death', 'Revived_statue_death.png', 4, 60),
  ]),

  entry('Ancient Mech Boss', 'bosses', 'fantasy', 'boss', 'snow-boss-ancient-mech', 72, 72, [
    anim('idle', 'Ancient_mech_idle.png', 4), anim('walk', 'Ancient_mech_walk.png', 4, 80),
    anim('attack1', 'Ancient_mech_attack1.png', 6, 55), anim('hurt', 'Ancient_mech_hurt.png', 2, 70),
    anim('death', 'Ancient_mech_death.png', 6, 60),
  ]),

  entry('Frost Ooze Boss', 'bosses', 'fantasy', 'boss', 'snow-boss-frost-ooze', 72, 72, [
    anim('idle', 'Frost_ooze_idle.png', 4), anim('walk', 'Frost_ooze_walk.png', 4, 80),
    anim('attack1', 'Frost_ooze_attack1.png', 6, 55), anim('hurt', 'Frost_ooze_hurt.png', 2, 70),
    anim('death', 'Frost_ooze_death.png', 4, 60),
  ]),

  entry('Magic Bear Boss', 'bosses', 'fantasy', 'boss', 'snow-boss-magic-bear', 72, 72, [
    anim('idle', 'Magic_bear_idle.png', 4), anim('walk', 'Magic_bear_walk.png', 4, 80),
    anim('attack1', 'Magic_bear_attack1.png', 6, 55), anim('hurt', 'Magic_bear_hurt.png', 2, 70),
    anim('death', 'Magic_bear_death.png', 4, 60),
  ]),

  entry('Demon Lord', 'bosses', 'fantasy', 'boss', 'boss-demon', 288, 160, [
    anim('idle', 'idle.png', 6, 120), anim('walk', 'walk.png', 12, 70), anim('attack1', 'cleave.png', 15, 50),
    anim('hurt', 'take_hit.png', 5, 70), anim('death', 'death.png', 22, 50),
  ]),

  entry('Frost Guardian', 'bosses', 'scifi', 'boss', 'frost-guardian', 192, 128, [
    anim('idle', 'idle.png', 6, 120), anim('walk', 'walk.png', 10, 70), anim('attack1', 'attack1.png', 14, 50),
    anim('hurt', 'take_hit.png', 7, 60), anim('death', 'death.png', 16, 50),
  ]),

  entry('Cyber Officer', 'enemies', 'scifi', 'enemy', 'cyber-police-officer', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Cyber Sergeant', 'enemies', 'scifi', 'enemy', 'cyber-police-sergeant', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Cyber Chef', 'enemies', 'scifi', 'enemy', 'cyber-police-chef', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Cyber Patrol', 'enemies', 'scifi', 'enemy', 'cyber-police-patrol', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Cyber Drone', 'enemies', 'scifi', 'enemy', 'cyber-police-drone', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Cyber Cannon', 'enemies', 'scifi', 'enemy', 'cyber-police-cannon', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Gang Brigand', 'enemies', 'scifi', 'enemy', 'gang-brigand', 48, 48, [
    anim('idle', 'Idle.png', 6), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Gang Shooter', 'enemies', 'scifi', 'enemy', 'gang-shooter', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Gang Wallbreaker', 'enemies', 'scifi', 'enemy', 'gang-wallbreaker', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 8, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Gang Shockbot', 'enemies', 'scifi', 'enemy', 'gang-shockbot', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Gang Battledrone', 'enemies', 'scifi', 'enemy', 'gang-battledrone', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Gang Stepper Cannon', 'enemies', 'scifi', 'enemy', 'gang-stepper-cannon', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 4, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 4, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Mecha Scout', 'enemies', 'scifi', 'enemy', 'mecha-scout', 96, 96, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Mecha Assault', 'enemies', 'scifi', 'enemy', 'mecha-assault', 96, 96, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Mecha Heavy', 'enemies', 'scifi', 'enemy', 'mecha-heavy', 96, 96, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Street Brawler', 'bosses', 'scifi', 'boss', 'street-boss-brawler', 96, 96, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Street Pyro', 'bosses', 'scifi', 'boss', 'street-boss-pyro', 96, 96, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Street Bomber', 'bosses', 'scifi', 'boss', 'street-boss-bomber', 96, 96, [
    anim('idle', 'Idle.png', 6), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Lab Mutant', 'bosses', 'scifi', 'boss', 'lab-boss-mutant', 72, 72, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Lab Cyborg', 'bosses', 'scifi', 'boss', 'lab-boss-cyborg', 72, 72, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Lab Mech', 'bosses', 'scifi', 'boss', 'lab-boss-mech', 72, 72, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 5, 60),
  ], { tags: ['starbound-corsairs'] }),

  entry('Sea Eel', 'sea-creatures', 'underwater', 'enemy', 'sea-eel', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  entry('Sea Crab', 'sea-creatures', 'underwater', 'enemy', 'sea-crab', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  entry('Sea Archer', 'sea-creatures', 'underwater', 'enemy', 'sea-archer', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  entry('Sea Jellyfish', 'sea-creatures', 'underwater', 'enemy', 'sea-jellyfish', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  entry('Sea Anglerfish', 'sea-creatures', 'underwater', 'enemy', 'sea-anglerfish', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  entry('Sea Shark', 'sea-creatures', 'underwater', 'enemy', 'sea-shark', 48, 48, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack.png', 6, 60),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  entry('Boss Kraken', 'sea-creatures', 'underwater', 'boss', 'sea-boss-kraken', 96, 96, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  entry('Boss Leviathan', 'sea-creatures', 'underwater', 'boss', 'sea-boss-leviathan', 96, 96, [
    anim('idle', 'Idle.png', 4), anim('walk', 'Walk.png', 4, 80), anim('attack1', 'Attack1.png', 6, 55),
    anim('hurt', 'Hurt.png', 2, 70), anim('death', 'Death.png', 6, 60),
  ]),

  ...['alien_ship1', 'alien_ship2', 'alien_ship3', 'alien_ship4', 'alien_ship5', 'alien_ship6'].map((f, i) =>
    entry(`Alien Ship ${i + 1}`, 'ships', 'scifi', 'ship', f, 64, 64, [
      anim('idle', 'idle.png', 4), anim('attack1', 'attack1.png', 4, 60),
      anim('shot', 'shot.png', 4, 60), anim('death', 'death.png', 9, 55),
    ], { facesLeft: true, tags: ['starbound-corsairs'] })
  ),

  ...['pirate_ship1', 'pirate_ship2', 'pirate_ship3', 'pirate_ship4', 'pirate_ship5', 'pirate_ship6'].map((f, i) => {
    const fc = [4, 8, 8, 8, 4, 16][i];
    const af = [4, 4, 6, 8, 16, 16][i];
    const df = [10, 11, 11, 11, 11, 11][i];
    return entry(`Pirate Ship ${i + 1}`, 'ships', 'scifi', 'ship', f, 64, 64, [
      anim('idle', 'idle.png', fc), anim('attack1', 'attack1.png', af, 60),
      anim('shot', 'shot.png', 4, 60), anim('death', 'death.png', df, 50),
    ], { facesLeft: true, tags: ['starbound-corsairs'] });
  }),

  ...['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Black', 'White', 'Violet'].map(color => {
    const names = { Red: 'Crimson Fist', Blue: 'Azure Storm', Green: 'Jade Viper', Purple: 'Amethyst Fury', Yellow: 'Golden Flash', Black: 'Shadow Boxer', White: 'Phantom Brawler', Violet: 'Neon Striker' };
    return entry(names[color], 'grudge-box-fighters', 'cyberpunk', 'fighter', `grudge-box/parsed/${color}`, 64, 64, [
      anim('idle', 'idle.png', 6, 120), anim('walk', 'walk.png', 4, 80), anim('jab', 'jab.png', 2, 55),
      anim('cross', 'cross.png', 4, 65), anim('lowkick', 'lowkick.png', 4, 55), anim('midkick', 'midkick.png', 4, 60),
      anim('uppercut', 'uppercut.png', 4, 60), anim('hook', 'hook.png', 4, 65), anim('block', 'block.png', 2, 100),
      anim('guard', 'guard.png', 2, 100), anim('hurt', 'hurt.png', 2, 55), anim('stun', 'stun.png', 2, 60),
      anim('highkick', 'highkick.png', 4, 55), anim('special', 'special.png', 4, 50),
      anim('death', 'death.png', 4, 80), anim('win', 'win.png', 4, 90),
    ], { tags: ['grudge-box', color.toLowerCase()] });
  }),

  ...[1, 2, 3, 4, 5, 6, 7, 8].map(n =>
    entry(`Grudge Enemy ${n}`, 'grudge-box-enemies', 'cyberpunk', 'enemy', `grudge-box/parsed/enemy_${n}`, 64, 64, [
      anim('idle', 'idle.png', 4, 120), anim('jab', 'jab.png', 3, 60), anim('cross', 'cross.png', 3, 65),
      anim('kick', 'kick.png', 3, 60), anim('block', 'block.png', 3, 100),
      anim('hurt', 'hurt.png', 3, 55), anim('death', 'death.png', 3, 80), anim('win', 'win.png', 3, 90),
    ], { tags: ['grudge-box'] })
  ),

  entry('Slash VFX', 'effects', 'fantasy', 'vfx', 'effects', 16, 16, [
    anim('slash', 'effects_row1_strip.png', 12, 40),
  ]),

  entry('Fire VFX', 'effects', 'fantasy', 'vfx', 'effects', 64, 64, [
    anim('fire', 'flame_orange.png', 1),
  ]),

  entry('Fire Animated', 'effects', 'fantasy', 'vfx', 'effects/fire-pack/1 Fire', 64, 64, [
    anim('idle', 'Idle.png', 6, 80),
  ]),

  entry('Flame Small', 'effects', 'fantasy', 'vfx', 'effects/fire-pack/3 Flame', 32, 32, [
    anim('idle', '1.png', 6, 80),
  ]),

  entry('Bomb Explosion', 'effects', 'fantasy', 'vfx', 'effects/bombs-explosions/2 Animation', 48, 48, [
    anim('idle', '1.png', 6, 50),
  ]),

  entry('Blood Splat', 'effects', 'fantasy', 'vfx', 'effects/platformer-effects/2 Blood', 48, 48, [
    anim('idle', '1.png', 4, 60),
  ]),

  entry('Spark VFX', 'effects', 'fantasy', 'vfx', 'effects/platformer-effects/3 Sparks', 48, 48, [
    anim('idle', '1.png', 4, 60),
  ]),

  entry('Plasma Cycle', 'effects', 'scifi', 'vfx', 'space_traps', 128, 128, [
    anim('cycle', 'plasma_cycle.png', 8, 80), anim('explode', 'plasma_explode.png', 15, 50),
  ]),

  entry('Space Bomb', 'effects', 'scifi', 'vfx', 'space_traps', 256, 256, [
    anim('explode', 'bomb_explode.png', 13, 50),
  ]),

  entry('Meteor', 'effects', 'scifi', 'vfx', 'space_traps', 64, 64, [
    anim('idle', 'meteor.png', 6, 70),
  ]),
];

if (import.meta.env.DEV) {
  const ids = SPRITE_REGISTRY.map(s => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    console.error('[SpriteRegistry] Duplicate IDs detected:', dupes);
  }
}

export const CATEGORIES = [...new Set(SPRITE_REGISTRY.map(s => s.category))];
export const GENRES = [...new Set(SPRITE_REGISTRY.map(s => s.genre))];
export const TYPES = [...new Set(SPRITE_REGISTRY.map(s => s.type))];

export function getSpritesByCategory(cat) { return SPRITE_REGISTRY.filter(s => s.category === cat); }
export function getSpritesByGenre(genre) { return SPRITE_REGISTRY.filter(s => s.genre === genre); }
export function getSpritesByType(type) { return SPRITE_REGISTRY.filter(s => s.type === type); }
export function getSpriteById(id) { return SPRITE_REGISTRY.find(s => s.id === id); }
export function searchSprites(q) {
  const lq = q.toLowerCase();
  return SPRITE_REGISTRY.filter(s =>
    s.name.toLowerCase().includes(lq) ||
    s.category.includes(lq) ||
    s.genre.includes(lq) ||
    s.type.includes(lq) ||
    s.folder.includes(lq) ||
    s.tags.some(t => t.includes(lq))
  );
}

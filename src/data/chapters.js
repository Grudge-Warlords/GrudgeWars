export const CHAPTERS = [
  {
    id: 'ch1',
    number: 1,
    title: 'The Darkening Current',
    subtitle: 'Awakening in Silence',
    description: 'The Plankton Magic has gone silent. The Root Crown lies shattered. You are a young Betta Warlord who must gather allies and discover why the waters have gone dark.',
    objectives: [
      { id: 'ch1_create', text: 'Create your first Warlord', type: 'create_hero', target: 1, icon: 'sword' },
      { id: 'ch1_train', text: 'Complete training in the shallows', type: 'complete_training', target: 1, icon: 'shield' },
      { id: 'ch1_explore', text: 'Explore the Root Shallows', type: 'visit_zone', zoneId: 'verdant_plains', icon: 'compass' },
      { id: 'ch1_battle', text: 'Win 3 battles', type: 'win_battles', target: 3, icon: 'battle' },
    ],
    reward: { pearls: 100, xp: 50, item: 'coral_shard' },
    requiredLevel: 1,
    loreReveal: 'The elders speak of three magics that once held the waters in balance. The Betta carried the Fire of Will. Now only Will remains.',
    vesselFocus: 'betta',
  },
  {
    id: 'ch2',
    number: 2,
    title: 'Gathering the School',
    subtitle: 'Allies in the Deep',
    description: 'No Warlord fights alone. Recruit heroes of different breeds and classes to form a war party capable of facing the dangers ahead.',
    objectives: [
      { id: 'ch2_recruit', text: 'Recruit 2 additional heroes', type: 'recruit_heroes', target: 2, icon: 'star' },
      { id: 'ch2_level5', text: 'Reach level 5 with any hero', type: 'reach_level', target: 5, icon: 'chart' },
      { id: 'ch2_kelp', text: 'Enter the Kelp Forest', type: 'visit_zone', zoneId: 'dark_forest', icon: 'compass' },
      { id: 'ch2_skill', text: 'Unlock a skill tree ability', type: 'unlock_skill', target: 1, icon: 'sparkle' },
    ],
    reward: { pearls: 200, xp: 100 },
    requiredLevel: 3,
    loreReveal: 'In the Kelp Forest, ancient fronds still hum with fading Plankton light. The web of unity once connected every creature here. Now only echoes remain.',
    vesselFocus: 'plankton',
  },
  {
    id: 'ch3',
    number: 3,
    title: 'Whispers of the Gorgons',
    subtitle: 'The Corrupted Guardians',
    description: 'The Gorgon Sirens, once protectors of the deep, have been driven mad by the Plankton Silence. Scylla lurks in the Shipwreck Hollow. You must face her.',
    objectives: [
      { id: 'ch3_caves', text: 'Explore the Biolume Caves', type: 'visit_zone', zoneId: 'whispering_caverns', icon: 'compass' },
      { id: 'ch3_conquer', text: 'Conquer 50% of a zone', type: 'zone_conquer', target: 50, icon: 'flag' },
      { id: 'ch3_battle10', text: 'Win 10 total battles', type: 'win_battles', target: 10, icon: 'battle' },
      { id: 'ch3_shipwreck', text: 'Reach Shipwreck Hollow', type: 'visit_zone', zoneId: 'sunken_temple', icon: 'skull' },
    ],
    reward: { pearls: 300, xp: 200 },
    requiredLevel: 6,
    loreReveal: 'The caves hold inscriptions from before the Silence. They speak of the Gorgons\' ancient duty — to maintain Law and Order. Without the Plankton web, they cannot tell friend from foe.',
    vesselFocus: 'gorgon',
  },
  {
    id: 'ch4',
    number: 4,
    title: 'The First Siren',
    subtitle: 'Scylla of the Shallows',
    description: 'Scylla, the gentlest of the three Gorgon Sirens, guards the Shipwreck Hollow. She was once merciful — perhaps that mercy can be reached again.',
    objectives: [
      { id: 'ch4_level9', text: 'Reach level 9 with your party', type: 'reach_level', target: 9, icon: 'chart' },
      { id: 'ch4_gear', text: 'Equip weapons on all party members', type: 'equip_all', target: 3, icon: 'sword' },
      { id: 'ch4_scylla', text: 'Defeat Scylla, Siren of the Shallows', type: 'defeat_boss', bossId: 'gorgon_siren_3', icon: 'skull' },
    ],
    reward: { pearls: 500, xp: 400, item: 'crown_fragment_1' },
    requiredLevel: 8,
    loreReveal: 'As Scylla falls, a flash of Plankton light erupts from her form — blinding, warm, and achingly familiar. The first fragment of the Root Crown materializes from the light. The Plankton are watching.',
    vesselFocus: 'gorgon',
  },
  {
    id: 'ch5',
    number: 5,
    title: 'Into the Twilight',
    subtitle: 'The Deepening Mystery',
    description: 'With one Crown fragment recovered, the truth draws closer. The mid-waters hold Medusa\'s domain and darker secrets about the Plankton Silence.',
    objectives: [
      { id: 'ch5_fortress', text: 'Reach the Root Fortress', type: 'visit_zone', zoneId: 'iron_peaks', icon: 'compass' },
      { id: 'ch5_vent', text: 'Explore the Thermal Vent', type: 'visit_zone', zoneId: 'blood_canyon', icon: 'fire' },
      { id: 'ch5_level13', text: 'Reach level 13', type: 'reach_level', target: 13, icon: 'chart' },
      { id: 'ch5_skills3', text: 'Unlock 5 skill tree abilities across party', type: 'unlock_skill', target: 5, icon: 'sparkle' },
    ],
    reward: { pearls: 500, xp: 500 },
    requiredLevel: 11,
    loreReveal: 'Deep in the Root Fortress, you find Gorgon carvings that predate the kingdom. They show four figures, not three. The inscriptions mention a "Fourth Vessel" — something that was never meant to awaken.',
    vesselFocus: 'plankton',
  },
  {
    id: 'ch6',
    number: 6,
    title: 'The Keeper of Twilight',
    subtitle: 'Medusa\'s Tears',
    description: 'Medusa dwells where light meets darkness. Legend says she wept when the Plankton fell silent, and her tears became abyssal pearls. Perhaps she knows more than the others.',
    objectives: [
      { id: 'ch6_shadow', text: 'Reach the Shadow Citadel', type: 'visit_zone', zoneId: 'shadow_citadel', icon: 'skull' },
      { id: 'ch6_level17', text: 'Reach level 17', type: 'reach_level', target: 17, icon: 'chart' },
      { id: 'ch6_medusa', text: 'Defeat Medusa, Siren of the Mid-Waters', type: 'defeat_boss', bossId: 'gorgon_siren_1', icon: 'skull' },
    ],
    reward: { pearls: 800, xp: 700, item: 'crown_fragment_2' },
    requiredLevel: 15,
    loreReveal: 'Medusa\'s dying words are a warning: "The Plankton didn\'t die... they chose to withdraw. They saw what was coming from below — from the Fourth Vessel. They chose silence over annihilation." The second Crown fragment appears in a cascade of ancient light.',
    vesselFocus: 'gorgon',
  },
  {
    id: 'ch7',
    number: 7,
    title: 'The Abyss Awaits',
    subtitle: 'Descent into Darkness',
    description: 'Two Crown fragments recovered. Two Gorgons faced. Only Charybdis remains — the most fearsome of all, and the only witness to the moment the Plankton went silent.',
    objectives: [
      { id: 'ch7_hadal', text: 'Reach the Hadal Trench', type: 'visit_zone', zoneId: 'hadal_trench', icon: 'compass' },
      { id: 'ch7_level19', text: 'Reach level 19', type: 'reach_level', target: 19, icon: 'chart' },
      { id: 'ch7_conquer3', text: 'Conquer 3 different zones to 100%', type: 'zones_conquered', target: 3, icon: 'flag' },
    ],
    reward: { pearls: 1000, xp: 900 },
    requiredLevel: 18,
    loreReveal: 'In the Hadal Trench, impossible deep, Plankton still glow. But they don\'t drift randomly — they form patterns, letters, a single word written in light older than the waters themselves. The word is: "REMEMBER."',
    vesselFocus: 'plankton',
  },
  {
    id: 'ch8',
    number: 8,
    title: 'The Devourer',
    subtitle: 'Charybdis and the Truth',
    description: 'The final Gorgon Siren. Charybdis was present when the Plankton went silent. What she saw drove her mad. Defeat her, and the final Crown fragment — and the truth — will be revealed.',
    objectives: [
      { id: 'ch8_maw', text: "Enter the Devourer's Maw", type: 'visit_zone', zoneId: 'devourer_maw', icon: 'skull' },
      { id: 'ch8_level20', text: 'Reach level 20', type: 'reach_level', target: 20, icon: 'star' },
      { id: 'ch8_charybdis', text: 'Defeat Charybdis, Siren of the Abyss', type: 'defeat_boss', bossId: 'gorgon_siren_2', icon: 'skull' },
    ],
    reward: { pearls: 2000, xp: 1500, item: 'crown_fragment_3' },
    requiredLevel: 20,
    loreReveal: 'The Root Crown is whole again. As the three fragments unite, the waters fill with blinding Plankton light. A voice speaks — not from any creature, but from the water itself: "We withdrew because We felt the Fourth Vessel stir. We are the Light of Unity. If We had stayed, the Fourth would have consumed Us to fuel its awakening. We chose silence so that you — the Fire of Will — could grow strong enough to face what comes. The time is near. The Abyss King rises. Remember what you fight for."',
    vesselFocus: 'all',
  },
];

export function getChapterProgress(chapter, gameState) {
  const { heroRoster, activeHeroIds, level, battleStats, zoneConquer, defeatedBosses, inventory } = gameState;
  const results = {};

  for (const obj of chapter.objectives) {
    let current = 0;
    let target = obj.target || 1;
    let complete = false;

    switch (obj.type) {
      case 'create_hero':
        current = heroRoster?.length || 0;
        complete = current >= target;
        break;
      case 'complete_training':
        current = gameState.trainingComplete ? 1 : 0;
        complete = current >= target;
        break;
      case 'visit_zone':
        current = (gameState.visitedZones || []).includes(obj.zoneId) ? 1 : 0;
        target = 1;
        complete = current >= 1;
        break;
      case 'win_battles':
        current = battleStats?.totalWins || 0;
        complete = current >= target;
        break;
      case 'recruit_heroes':
        current = Math.max(0, (heroRoster?.length || 1) - 1);
        complete = current >= target;
        break;
      case 'reach_level':
        current = Math.max(...(heroRoster || []).map(h => h.level || 1), level || 1);
        complete = current >= target;
        break;
      case 'unlock_skill': {
        let totalSkills = 0;
        (heroRoster || []).forEach(h => {
          const skills = h.unlockedSkills || {};
          totalSkills += Object.values(skills).filter(v => v > 0).length;
        });
        current = totalSkills;
        complete = current >= target;
        break;
      }
      case 'zone_conquer': {
        const maxConquer = Math.max(0, ...Object.values(zoneConquer || {}).map(v => v || 0));
        current = maxConquer;
        complete = current >= target;
        break;
      }
      case 'defeat_boss':
        current = (defeatedBosses || []).includes(obj.bossId) ? 1 : 0;
        target = 1;
        complete = current >= 1;
        break;
      case 'equip_all': {
        let equipped = 0;
        (heroRoster || []).filter(h => activeHeroIds?.includes(h.id)).forEach(h => {
          if (h.equipment?.weapon) equipped++;
        });
        current = equipped;
        complete = current >= target;
        break;
      }
      case 'zones_conquered': {
        const fullyConquered = Object.values(zoneConquer || {}).filter(v => v >= 100).length;
        current = fullyConquered;
        complete = current >= target;
        break;
      }
      default:
        complete = false;
    }

    results[obj.id] = { current: Math.min(current, target), target, complete };
  }

  return results;
}

export function getCurrentChapter(gameState) {
  const completed = gameState.completedChapters || [];
  for (const chapter of CHAPTERS) {
    if (!completed.includes(chapter.id)) {
      return chapter;
    }
  }
  return CHAPTERS[CHAPTERS.length - 1];
}

export function isChapterComplete(chapter, gameState) {
  const progress = getChapterProgress(chapter, gameState);
  return Object.values(progress).every(p => p.complete);
}

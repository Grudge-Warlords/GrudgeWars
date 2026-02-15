const IDLE_CHATTER = [
  { trigger: 'low_health', lines: [
    "{name}: My fins are torn... I need to rest in calmer waters.",
    "{name}: Anyone have a healing anemone? I'm barely swimming.",
    "{name}: We should find a grove shelter before the next fight.",
  ]},
  { trigger: 'high_gold', lines: [
    "{name}: Our pearl pouch is overflowing. Time to visit the traders!",
    "{name}: With these pearls we could buy something legendary from the Root Market.",
    "{name}: The shell merchants will be thrilled to see us.",
  ]},
  { trigger: 'low_gold', lines: [
    "{name}: We're running low on pearls... need more hunts.",
    "{name}: Can't afford a single root shard at this rate.",
    "{name}: Maybe we should trade some old shells.",
  ]},
  { trigger: 'boss_nearby', lines: [
    "{name}: The current feels different here... something powerful lurks below.",
    "{name}: Stay sharp. The predator of this zone is still hunting.",
    "{name}: We should prepare our formations before diving deeper.",
  ]},
  { trigger: 'boss_defeated', lines: [
    "{name}: That beast didn't stand a chance against our school!",
    "{name}: Another predator falls. These waters are safer now.",
    "{name}: Victory tastes like fresh plankton! What's next?",
  ]},
  { trigger: 'high_conquer', lines: [
    "{name}: We control this territory now. Time to push into deeper waters.",
    "{name}: The grove dwellers look relieved. Our work here is nearly done.",
    "{name}: This zone is almost fully ours. Onward to new depths!",
  ]},
  { trigger: 'new_zone', lines: [
    "{name}: Never swam these currents before. Keep your fins ready.",
    "{name}: New waters... I wonder what treasures the current has hidden.",
    "{name}: The bioluminescence is different here. Let's explore carefully.",
  ]},
];

const RESPONSES = [
  { trigger: 'low_health', lines: [
    "{name}: Agreed, let's find a warm vent to recover.",
    "{name}: I'll guard the flank. Hang in there.",
    "{name}: Here, use my last healing root.",
  ]},
  { trigger: 'high_gold', lines: [
    "{name}: I've had my eye on a sharktooth blade!",
    "{name}: Let's visit the Root Market then.",
    "{name}: Dibs on the first upgrade!",
  ]},
  { trigger: 'low_gold', lines: [
    "{name}: The grind never stops...",
    "{name}: More battles, more pearls. Simple as that.",
    "{name}: I know a good hunting grove nearby.",
  ]},
  { trigger: 'boss_nearby', lines: [
    "{name}: I'm ready. Let's take it down together.",
    "{name}: We might need better gear first.",
    "{name}: Our school can handle anything as one.",
  ]},
  { trigger: 'boss_defeated', lines: [
    "{name}: Let's celebrate at the thermal vents!",
    "{name}: I'll feast on that!",
    "{name}: We make an unstoppable school.",
  ]},
  { trigger: 'high_conquer', lines: [
    "{name}: The harvest yields here are incredible now.",
    "{name}: Let's leave scouts behind and swim on.",
    "{name}: New challenges await beyond these groves.",
  ]},
  { trigger: 'new_zone', lines: [
    "{name}: I've heard whispers about this place from passing currents...",
    "{name}: Keep your fins sharp and eyes wide.",
    "{name}: Exciting! New creatures, new treasures!",
  ]},
];

const GENERIC_CHATTER = [
  ["{a}: Think we'll ever find the Root Crown?", "{b}: Only if we're strong enough to survive the Abyss."],
  ["{a}: My tail fin is getting stronger every day.", "{b}: Just don't smack me showing off your flares."],
  ["{a}: Do you think we'll be remembered?", "{b}: Legends of the deep are made, not born. Keep swimming."],
  ["{a}: I miss resting in a warm anemone bed.", "{b}: After the next battle. Promise."],
  ["{a}: What drives you to keep fighting?", "{b}: Grudges don't settle themselves in these waters."],
  ["{a}: The bioluminescence looks different out here.", "{b}: That's the corruption spreading from the Abyss. We have to stop it."],
  ["{a}: Ever wonder what's beyond the Hadal Trench?", "{b}: Nothing good. But we'll face it fin to fin."],
  ["{a}: My gear could use an upgrade.", "{b}: Mine too. Let's find a city grove soon."],
  ["{a}: How many battles have we survived?", "{b}: Lost count. But each one made our scales tougher."],
  ["{a}: I heard the Volcanic Hearth hides ancient weapons.", "{b}: Then let's dive down and claim them!"],
  ["{a}: You swim well for someone your size.", "{b}: Size isn't everything. Speed and agility win fights."],
  ["{a}: These waters are cursed...", "{b}: Then we'll be the ones to cleanse them."],
  ["{a}: Ready for another round?", "{b}: Always. Let's go hunt."],
  ["{a}: I need to learn some new abilities.", "{b}: The skill grove has so much potential."],
  ["{a}: Remember that last boss fight?", "{b}: How could I forget? That kraken was intense!"],
  ["{a}: Our school is getting stronger.", "{b}: Strong enough to take on the Leviathan itself."],
  ["{a}: What should we do next?", "{b}: Push into deeper territory. We can handle the pressure."],
  ["{a}: I found a rare shell earlier!", "{b}: Nice! Equip it and let's test it in the current."],
  ["{a}: The surface world scares me.", "{b}: Stay deep, stay safe. That's the way."],
  ["{a}: Have you seen the crystal caves?", "{b}: Stunning... but dangerous. Electric eels nest there."],
];

const GOAL_CHATTER = [
  { lines: ["{a}: We need better gear. Let's find a shell merchant.", "{b}: Good idea. Our current equipment won't survive deeper waters."], trigger: 'suggest_trade' },
  { lines: ["{a}: That zone isn't conquered yet. Let's finish claiming it.", "{b}: More territory means better harvest yields too."], trigger: 'suggest_hunt' },
  { lines: ["{a}: We should challenge that predator soon.", "{b}: Agreed. Time to prove our fins."], trigger: 'boss_nearby' },
  { lines: ["{a}: Let's train in shallower waters before diving deeper.", "{b}: Smart. No point rushing to our doom."], trigger: 'suggest_hunt' },
  { lines: ["{a}: The deeper zones have the rarest pearls.", "{b}: Risk and reward... I'm in."], trigger: 'suggest_hunt' },
  { lines: ["{a}: We should recruit another fighter to our school.", "{b}: More allies means more firepower in the current!"], trigger: 'suggest_recruit' },
];

export const QUICK_RESPONSES = {
  low_health: [
    { label: 'Rest', icon: 'heart', action: 'rest' },
    { label: 'Use Root', icon: 'crystal', action: 'use_potion' },
  ],
  high_gold: [
    { label: 'Trade', icon: 'gold', action: 'open_trade' },
    { label: 'Upgrade', icon: 'hammer', action: 'open_upgrades' },
  ],
  low_gold: [
    { label: 'Hunt!', icon: 'crossed_swords', action: 'hunt' },
    { label: 'Sell Shells', icon: 'gold', action: 'open_trade' },
  ],
  boss_nearby: [
    { label: 'Fight Boss', icon: 'crown', action: 'fight_boss' },
    { label: 'Prepare', icon: 'shield', action: 'open_gear' },
  ],
  boss_defeated: [
    { label: 'Celebrate!', icon: 'sparkle', action: 'rest' },
    { label: 'Swim On', icon: 'scroll', action: 'dismiss' },
  ],
  high_conquer: [
    { label: 'Push Deeper', icon: 'energy', action: 'dismiss' },
    { label: 'Harvest', icon: 'hammer', action: 'open_harvest' },
  ],
  new_zone: [
    { label: 'Explore', icon: 'crystal', action: 'hunt' },
    { label: 'Be Careful', icon: 'shield', action: 'dismiss' },
  ],
  suggest_trade: [
    { label: "Let's Trade", icon: 'gold', action: 'open_trade' },
    { label: 'Later', icon: 'shield', action: 'dismiss' },
  ],
  suggest_hunt: [
    { label: 'Hunt!', icon: 'crossed_swords', action: 'hunt' },
    { label: 'Not Yet', icon: 'shield', action: 'dismiss' },
  ],
  suggest_recruit: [
    { label: 'Recruit', icon: 'sparkle', action: 'recruit' },
    { label: "We're Good", icon: 'shield', action: 'dismiss' },
  ],
};

const RACE_CHATTER = {
  blue_betta: [
    "{name}: *fans halfmoon fins majestically* These currents feel like home.",
    "{name}: A Halfmoon's spread is unmatched. Watch and learn.",
    "{name}: The current favors the graceful. Let us ride it.",
  ],
  red_betta: [
    "{name}: *snaps jaws* Plakats don't back down from any fight.",
    "{name}: Short fins, fast strikes. That's the Plakat way.",
    "{name}: I was born to brawl. Point me at the enemy.",
  ],
  purple_betta: [
    "{name}: Two tails means twice the elegance in battle.",
    "{name}: Doubletails see things others miss. Trust my instincts.",
    "{name}: The deep purple waters call to me...",
  ],
  white_betta: [
    "{name}: Cambodian clarity sees through any murky water.",
    "{name}: Pure scales, pure purpose. Let's move forward.",
    "{name}: In stillness, I find my strength.",
  ],
  green_betta: [
    "{name}: *flexes massive fins* Being a Giant has its advantages.",
    "{name}: I'll take point. Nothing gets past these scales.",
    "{name}: The bigger the fish, the bigger the fight!",
  ],
  gold_betta: [
    "{name}: *extends crown-like fins* A Crowntail commands respect.",
    "{name}: These ray extensions aren't just for show. They cut deep.",
    "{name}: The crown is earned through battle, not birthright.",
  ],
  orange_betta: [
    "{name}: *glimmers with metallic scales* Dragonscale armor is the finest.",
    "{name}: My thick scales can deflect anything the deep throws at us.",
    "{name}: Fire-colored scales for a fire-hearted warrior.",
  ],
  pink_betta: [
    "{name}: *displays butterfly pattern fins* Beauty and lethality in every fin.",
    "{name}: A Butterfly's banded fins confuse predators. It's tactical.",
    "{name}: The root gardens remind me of my spawning grove.",
  ],
};

const CLASS_CHATTER = {
  warrior: [
    "{name}: My fins are sharp and ready for battle.",
    "{name}: A true warrior never retreats from the current.",
    "{name}: Let me take the front of our formation.",
  ],
  mage: [
    "{name}: I sense arcane currents flowing nearby...",
    "{name}: Knowledge of the deep is the greatest weapon.",
    "{name}: My current magic is charged and ready.",
  ],
  rogue: [
    "{name}: *blends into the grove shadow* All clear... for now.",
    "{name}: The best fights end before the prey even sees you coming.",
    "{name}: I found a shortcut through the kelp. Follow me.",
  ],
  cleric: [
    "{name}: May Poseidon's blessing protect us all.",
    "{name}: I'll keep every fin healed, don't worry.",
    "{name}: Even in the darkest trench, the light of the Leviathan endures.",
  ],
};

export function generateDialogue(heroes, gameState) {
  if (!heroes || heroes.length < 2) return null;

  const { gold, level, currentZone, zoneConquer, bossesDefeated, locationsCleared, victories } = gameState;
  const hero1 = heroes[0];
  const hero2 = heroes[1 + Math.floor(Math.random() * (heroes.length - 1))];

  const currentConquer = (zoneConquer || {})[currentZone] || 0;
  const currentLoc = gameState.locations?.find(l => l.id === currentZone);
  const hasBoss = currentLoc?.boss && !bossesDefeated?.includes(currentLoc.boss);
  const bossJustDefeated = currentLoc?.boss && bossesDefeated?.includes(currentLoc.boss);

  let trigger = null;
  const healthRatio = hero1.currentHealth / (hero1.maxHealth || 100);

  if (healthRatio < 0.4) trigger = 'low_health';
  else if (gold > 500 && Math.random() > 0.5) trigger = 'high_gold';
  else if (gold < 30) trigger = 'low_gold';
  else if (hasBoss && Math.random() > 0.4) trigger = 'boss_nearby';
  else if (bossJustDefeated && Math.random() > 0.5) trigger = 'boss_defeated';
  else if (currentConquer > 70) trigger = 'high_conquer';
  else if (currentConquer < 10 && Math.random() > 0.6) trigger = 'new_zone';

  if (trigger) {
    const chatter = IDLE_CHATTER.find(c => c.trigger === trigger);
    const response = RESPONSES.find(r => r.trigger === trigger);
    if (chatter && response) {
      const line1 = chatter.lines[Math.floor(Math.random() * chatter.lines.length)].replace('{name}', hero1.name);
      const line2 = response.lines[Math.floor(Math.random() * response.lines.length)].replace('{name}', hero2.name);
      return { speaker1: hero1, speaker2: hero2, line1, line2, trigger };
    }
  }

  if (Math.random() > 0.3) {
    const roll = Math.random();
    if (roll < 0.25) {
      const raceLines1 = RACE_CHATTER[hero1.raceId] || [];
      const raceLines2 = RACE_CHATTER[hero2.raceId] || CLASS_CHATTER[hero2.classId] || [];
      if (raceLines1.length && raceLines2.length) {
        return {
          speaker1: hero1,
          speaker2: hero2,
          line1: raceLines1[Math.floor(Math.random() * raceLines1.length)].replace('{name}', hero1.name),
          line2: raceLines2[Math.floor(Math.random() * raceLines2.length)].replace('{name}', hero2.name),
        };
      }
    } else if (roll < 0.45) {
      const classLines1 = CLASS_CHATTER[hero1.classId] || [];
      const classLines2 = CLASS_CHATTER[hero2.classId] || RACE_CHATTER[hero2.raceId] || [];
      if (classLines1.length && classLines2.length) {
        return {
          speaker1: hero1,
          speaker2: hero2,
          line1: classLines1[Math.floor(Math.random() * classLines1.length)].replace('{name}', hero1.name),
          line2: classLines2[Math.floor(Math.random() * classLines2.length)].replace('{name}', hero2.name),
        };
      }
    }
    const useGoal = Math.random() > 0.5;
    if (useGoal) {
      const goal = GOAL_CHATTER[Math.floor(Math.random() * GOAL_CHATTER.length)];
      return {
        speaker1: hero1, speaker2: hero2,
        line1: goal.lines[0].replace('{a}', hero1.name).replace('{b}', hero2.name),
        line2: goal.lines[1].replace('{a}', hero1.name).replace('{b}', hero2.name),
        trigger: goal.trigger,
      };
    }
    const pair = GENERIC_CHATTER[Math.floor(Math.random() * GENERIC_CHATTER.length)];
    return {
      speaker1: hero1, speaker2: hero2,
      line1: pair[0].replace('{a}', hero1.name).replace('{b}', hero2.name),
      line2: pair[1].replace('{a}', hero1.name).replace('{b}', hero2.name),
      trigger: 'generic',
    };
  }

  const fallbackRace = RACE_CHATTER[hero1.raceId] || RACE_CHATTER[hero2.raceId];
  const fallbackClass = CLASS_CHATTER[hero2.classId] || CLASS_CHATTER[hero1.classId];
  if (fallbackRace && fallbackClass) {
    return {
      speaker1: hero1,
      speaker2: hero2,
      line1: fallbackRace[Math.floor(Math.random() * fallbackRace.length)].replace('{name}', hero1.name),
      line2: fallbackClass[Math.floor(Math.random() * fallbackClass.length)].replace('{name}', hero2.name),
    };
  }

  return null;
}

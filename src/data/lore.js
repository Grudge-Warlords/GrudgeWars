export const WORLD_LORE = {
  title: 'The Sunken Kingdom of Abyssia',
  subtitle: 'Where Magic Sleeps in Three Vessels',

  prologue: `In the age before memory, when the waters were young and currents still sang, three vessels of magic sustained all life beneath the currents. The Betta — fierce, beautiful, and proud — carried the Fire of Will, the spark that drives all creatures to fight, to love, to endure. The Gorgons — ancient serpents of root and stone — held the Weight of Law, the force that keeps the deep in order and the currents in rhythm. And the Plankton — countless, invisible, everywhere — bore the Light of Unity, the quiet magic that binds every living thing to every other.

For eons, the three magics held the waters in balance. The Betta Warlords built the kingdom of Abyssia atop the Root Crown, a living root throne that channeled all three magics into harmony. The Gorgon Sirens kept vigil at the borders of the deep, their petrifying gaze holding the Abyss at bay. And the Plankton drifted through every current, every cave, every drop of water — a living web of light connecting all things.

Then the Plankton Magic went silent.

No one knows why. No warning, no cataclysm, no final cry. One day the water simply... dimmed. The bioluminescent networks that connected every grove and trench flickered and died. The currents lost their song. Fish that had swum together for millennia scattered in confusion. And in the sudden darkness, something stirred in the Abyss.

The Root Crown shattered. The Gorgon Sirens, driven mad by the severed connection, turned hostile — their ancient duty corrupted into blind rage. The Betta Warlords, the last vessels of conscious magic, found themselves alone in the darkening waters, hunted by the very guardians who once protected them.

Now you must gather your Warlords, restore the fragments of the Root Crown, face the maddened Gorgons, and discover why the Plankton Magic fell silent — before the Abyss devours everything.`,

  threeVessels: [
    {
      name: 'The Betta — Fire of Will',
      icon: '🔥',
      color: '#ef4444',
      description: 'The Betta fish carry the oldest conscious magic in the waters. Each of the eight breeds channels a different aspect of Will — from the Halfmoon\'s protective resolve to the Crowntail\'s fierce ambition. When a Betta Warlord fights, they don\'t just swing a weapon; they burn with the accumulated determination of every ancestor who refused to yield. This is why Betta can learn magic, wield enchanted weapons, and grow stronger through battle — their very nature is to overcome.',
      status: 'Active — You are the last hope',
    },
    {
      name: 'The Gorgons — Weight of Law',
      icon: '🐍',
      color: '#a78bfa',
      description: 'Three Gorgon Sirens once maintained the natural order of the deep: Scylla of the Shallows, Medusa of the Mid-waters, and Charybdis of the Abyss. Their petrifying gaze was not cruelty but justice — they turned only those who threatened the balance to stone. But when the Plankton Magic severed their connection to the web of life, the Gorgons lost their ability to distinguish friend from foe. Now they strike at everything, their ancient duty twisted into mindless destruction.',
      status: 'Corrupted — Must be defeated or restored',
    },
    {
      name: 'The Plankton — Light of Unity',
      icon: '✨',
      color: '#22d3ee',
      description: 'The most mysterious and powerful of the three magics. Plankton are everywhere in the waters — in every drop of water, every breath, every current. Their magic was the connective tissue of all life, a living network of bioluminescent light that let every creature in the waters feel the heartbeat of every other. When the Plankton Magic went silent, it was as if the waters themselves went blind and deaf. The cause of the silence is the central mystery of the game.',
      status: 'Silent — The great mystery',
    },
  ],

  gorgonBosses: [
    {
      id: 'gorgon_siren_3',
      name: 'Scylla, Siren of the Shallows',
      title: 'The Winged Terror of the Groves',
      color: '#06b6d4',
      portrait: '/images/bosses/gorgon_siren_3_scylla.png',
      sprite: 'gorgon_siren_3',
      description: 'Once the gentlest of the three Gorgon Sirens, Scylla watched over the root groves and shallow waters where young water creatures took their first breaths. Her gaze would turn only poachers and grove-destroyers to stone, leaving graceful stone statues as warnings. Now maddened, she attacks anything that moves in the upper waters, her six serpentine heads striking with the speed of a rapids. Her enormous bat-like wings churn the water into blinding storms, and her dark-green scales have hardened into living armor.',
      lore: 'Scylla\'s petrification was always temporary — she would release her victims after they learned respect for the grove. This mercy is now gone. Her wings, once folded in peaceful rest, now beat ceaselessly as she patrols the shallows in blind fury.',
      location: 'Shipwreck Hollow',
      locationId: 'sunken_temple',
      level: 9,
      encounterScene: {
        title: 'The Guardian Awakens',
        intro: 'The water darkens as you approach the shattered hulls. A low rumble vibrates through your fins. Then you see her — rising from between the wrecks, wings unfurling like vast sails of shadow. Six serpentine heads weave around her body, each one fixing you with glowing yellow eyes. Scylla, once the gentlest protector of the shallows, now recognizes nothing but enemies.',
        taunt: '"You dare swim in MY waters? I am the grove. I am the current. And you... are STONE."',
        victory: 'As Scylla falls, her wings fold one last time. For a brief moment, her eyes clear — and in them you see not rage, but grief. A fragment of the Root Crown tumbles from her coils, pulsing with teal light. The grove around you brightens, just slightly, as if remembering what it once was.',
        defeat: 'Scylla\'s wings beat triumphantly as your vision turns to stone. The last thing you hear is a sound almost like weeping — or perhaps the grove itself, mourning what it has lost.',
      },
    },
    {
      id: 'gorgon_siren_1',
      name: 'Medusa, Siren of the Mid-Waters',
      title: 'The Weeping Blade of the Twilight',
      color: '#a78bfa',
      portrait: '/images/bosses/gorgon_siren_1_medusa.png',
      sprite: 'gorgon_siren_1',
      description: 'Medusa dwelt in the twilight zone between light and darkness, maintaining the delicate border that kept abyssal horrors from rising. Her coral-snake hair could sense disturbances in the water from miles away, and her blood-soaked blade has ended a thousand champions who dared cross the threshold. Her massive purple serpent coils crush anything they encircle, and her green eyes flash with a petrifying gaze that turns flesh to stone permanently. With the Plankton Magic gone, she can no longer feel the boundaries she once guarded, and lashes out at shadows.',
      lore: 'Legend says Medusa wept when the Plankton Magic fell silent, and her tears became the first abyssal pearls — worth a fortune but cursed with sorrow. She built her Shadow Citadel from the petrified bodies of those she once swore to protect.',
      location: 'Shadow Citadel',
      locationId: 'shadow_citadel',
      level: 17,
      encounterScene: {
        title: 'The Weeping Fortress',
        intro: 'The Shadow Citadel rises from the lakebed like a monument to madness. Its walls are not stone — they are fish, warriors, water creatures, all turned to stone by Medusa\'s gaze, frozen in their final moments of terror. At its heart, she waits on a throne of petrified champions, serpent hair writhing, green eyes burning. In one hand she holds a blade stained with the blood of centuries. In the other, a single abyssal pearl — her own crystallized tear.',
        taunt: '"I wept for these waters. I bled for their borders. And when the Light died... I was ALONE. Now you come to my citadel? Then join my walls. Become beautiful. Become FOREVER."',
        victory: 'Medusa\'s blade clatters to the stone floor. Her serpent hair goes still, one head at a time, like candles being extinguished. She looks at the abyssal pearl in her hand and whispers: "I remember the light. I remember when I could feel... everything." A Crown fragment materializes where her tear falls, glowing violet. The walls of the citadel tremble — and for the first time in ages, one of the petrified fish blinks.',
        defeat: 'Your body hardens under her gaze. As consciousness fades, you hear Medusa\'s voice, broken and ancient: "Another one for my walls. Another friend I couldn\'t save." She places an abyssal pearl where you stood — a memorial no one will ever see.',
      },
    },
    {
      id: 'gorgon_siren_2',
      name: 'Charybdis, Siren of the Abyss',
      title: 'The Devourer — She Who Saw the Silence',
      color: '#c084fc',
      portrait: '/images/bosses/gorgon_siren_2_charybdis.png',
      sprite: 'gorgon_siren_2',
      description: 'The most fearsome and mysterious of the three Gorgon Sirens. Charybdis rules the deepest trenches where reality itself grows thin, wielding a skull-crowned scepter that channels the Weight of Law in its most terrible form. Her golden-scaled serpent body coils through the purple darkness, and her gaze doesn\'t just petrify — it unmakes, dissolving matter back into raw water. She is the only being who was present at the moment the Plankton Magic went silent. What she witnessed in that instant shattered something inside her — and she has spoken only in fragments and riddles ever since.',
      lore: 'Charybdis was always the wisest of the three sisters, the one who understood the Balance most deeply. When the Plankton Magic went silent, she felt every thread of the web snap at once — billions of connections severed in a single heartbeat. The pain drove her to the brink. She built the Devourer\'s Maw around herself, a whirlpool fortress of consumed souls, and waits for someone strong enough to hear what she cannot bring herself to speak aloud.',
      location: "The Devourer's Maw",
      locationId: 'maw_of_madra',
      level: 20,
      encounterScene: {
        title: 'The Truth in the Abyss',
        intro: 'The descent into the Devourer\'s Maw is a journey through memory. Purple currents show flashes of what was — the waters alive with Plankton light, three sisters standing guard at the borders of the world. Then the visions darken, and you see it: the moment the Light went out. A ripple of nothing spreading through the water. And at its center, Charybdis, her skull-topped scepter raised, her eyes wide with horror. She turns to face you now, ancient and terrible, her golden scales scarred by centuries of self-inflicted grief.',
        taunt: '"You want to know why the Light died? I SAW it. I felt every connection break. Every bond. Every thread of life that held these waters together — GONE in a heartbeat. And do you know what was left? ME. Alone in the dark. So I devoured. I consumed. Because if I couldn\'t feel the Unity... I would feel NOTHING."',
        victory: 'Charybdis drops her scepter. The skull atop it screams — then goes silent. She sinks to the lakebed, her massive coils going slack, and for the first time in centuries she speaks clearly: "The Plankton didn\'t die. They chose to withdraw. Something was coming — something that feeds on Unity itself. They severed the web to starve it. But it found another way to feed... through us. Through our rage. Through our grief." She looks at you with eyes that have seen the end of the world. "The Cacodaemon. It is here. It has always been here. And it is so, so hungry." The final Crown fragment rises from the Maw, blazing with purple and gold light.',
        defeat: 'The whirlpool closes around you. Charybdis\'s voice echoes as darkness takes you: "You were not ready for the truth. No one ever is. Sleep now. Sleep, and forget what the silence means."',
      },
    },
  ],

  gorgonSistersGroupArt: '/images/bosses/gorgon_sisters_all.png',

  gorgonStoryArc: {
    title: 'The Maddened Guardians',
    description: 'The three Gorgon Sirens once maintained the natural order of the deep — Scylla guarding the shallows, Medusa the twilight borders, and Charybdis the abyss. When the Plankton Magic went silent, the sisters lost their connection to the web of life and to each other. Each was driven mad in her own way: Scylla by fury, Medusa by grief, Charybdis by the terrible truth she witnessed. To restore the Root Crown and face the Cacodaemon, you must defeat all three — but perhaps, in doing so, you can also set them free.',
    progression: [
      { phase: 'The Shallows Darken', level: '7-9', boss: 'Scylla', location: 'Shipwreck Hollow', description: 'Scylla\'s fury has turned the once-peaceful shallows into a killing ground. Stone statues of her victims line the lakebed. You must face her winged wrath to claim the first Crown fragment and prove yourself worthy of the deeper waters.' },
      { phase: 'The Twilight Weeps', level: '14-17', boss: 'Medusa', location: 'Shadow Citadel', description: 'Medusa\'s grief has built a fortress of the petrified dead. Her tears are cursed pearls. Her blade has ended champions for centuries. To reach the second Crown fragment, you must survive her gaze and perhaps remind her of the guardian she once was.' },
      { phase: 'The Abyss Speaks', level: '20', boss: 'Charybdis', location: "The Devourer's Maw", description: 'Charybdis holds the final truth — why the Plankton Magic went silent. But she has hidden it behind madness, grief, and the consuming fury of the Maw. Defeating her doesn\'t just earn a Crown fragment — it reveals the real enemy: the Cacodaemon, the creature that feeds on severed connections, the reason the Plankton withdrew.' },
    ],
  },

  planktonMystery: {
    name: 'The Silence of the Plankton',
    description: 'The central mystery of Betta Warlords. Why did the Plankton Magic — the Light of Unity that connected every living thing in the waters — suddenly go silent? Throughout the game, players discover fragments of the truth: ancient inscriptions on the Root Crown, whispered memories from the Gorgon Sirens, and strange bioluminescent echoes in the deepest trenches that suggest the Plankton didn\'t die — they chose to withdraw.',
    clues: [
      'The Root Crown\'s inscriptions speak of a "Fourth Vessel" that was never meant to awaken.',
      'Charybdis\'s mad ravings mention "the light that ate itself."',
      'In the deepest part of the Hadal Trench, Plankton still glow — but they spell out a single word in an ancient script.',
      'The Abyss King isn\'t conquering the waters — he\'s filling a vacuum the Plankton left behind.',
      'Each Root Crown fragment restored causes a brief, blinding flash of Plankton light — as if they\'re watching.',
    ],
  },
};

export const LOCATION_LORE = {
  verdant_plains: {
    loreName: 'Root Shallows',
    loreQuote: '"Where the first Betta drew breath, the Crown\'s light still lingers."',
    loreTag: 'Birthplace of the Warlords',
    cardArt: 'mission',
    vesselConnection: 'betta',
  },
  dark_forest: {
    loreName: 'Kelp Forest',
    loreQuote: '"The kelp remembers when the Plankton sang through every frond."',
    loreTag: 'The Whispering Canopy',
    cardArt: 'exploration',
    vesselConnection: 'plankton',
  },
  mystic_grove: {
    loreName: 'Anemone Garden',
    loreQuote: '"Ancient magic pulses here — older than the Crown itself."',
    loreTag: 'Garden of the First Spells',
    cardArt: 'mission',
    vesselConnection: 'plankton',
  },
  whispering_caverns: {
    loreName: 'Biolume Caves',
    loreQuote: '"Even in silence, the caves glow with the memory of unity."',
    loreTag: 'Echoes of the Lost Light',
    cardArt: 'exploration',
    vesselConnection: 'plankton',
  },
  haunted_marsh: {
    loreName: 'Sargasso Maze',
    loreQuote: '"The drowned drift here, caught between the living and the void."',
    loreTag: 'Labyrinth of the Fallen',
    cardArt: 'combat',
    vesselConnection: 'gorgon',
  },
  cursed_ruins: {
    loreName: 'Sunken Citadel',
    loreQuote: '"Once the jewel of Abyssia, now a tomb for forgotten kings."',
    loreTag: 'Ruins of the Old Kingdom',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  crystal_caves: {
    loreName: 'Crystal Grotto',
    loreQuote: '"The crystals hum with Crown resonance — a fragment is near."',
    loreTag: 'The Singing Crystals',
    cardArt: 'exploration',
    vesselConnection: 'betta',
  },
  thornwood_pass: {
    loreName: 'Current Stream',
    loreQuote: '"Powerful currents sweep the unwary into ambushes and glory alike."',
    loreTag: 'The Razor Current',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  sunken_temple: {
    loreName: 'Shipwreck Hollow',
    loreQuote: '"Scylla\'s shadow falls across these timbers. The first Gorgon awaits."',
    loreTag: 'Lair of the First Siren',
    cardArt: 'boss',
    vesselConnection: 'gorgon',
  },
  iron_peaks: {
    loreName: 'Root Fortress',
    loreQuote: '"The Abyss King\'s armies harden root into weapons of war."',
    loreTag: 'Stronghold of the Deep',
    cardArt: 'combat',
    vesselConnection: 'gorgon',
  },
  blood_canyon: {
    loreName: 'Thermal Vent',
    loreQuote: '"In scalding fury, the Warlord forges instruments of destruction."',
    loreTag: 'The Burning Forge',
    cardArt: 'boss',
    vesselConnection: 'betta',
  },
  frozen_tundra: {
    loreName: 'Frozen Depths',
    loreQuote: '"This cold predates the Crown. Something older sleeps beneath the ice."',
    loreTag: 'The Ancient Cold',
    cardArt: 'boss',
    vesselConnection: 'plankton',
  },
  dragon_peaks: {
    loreName: "Leviathan's Wake",
    loreQuote: '"Where ancient titans passed, the stone still trembles."',
    loreTag: 'Path of the Titans',
    cardArt: 'boss',
    vesselConnection: 'gorgon',
  },
  ashen_battlefield: {
    loreName: 'Sandy Wastes',
    loreQuote: '"The bones of the First Current War lie scattered across the sand."',
    loreTag: 'Graveyard of Heroes',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  windswept_ridge: {
    loreName: 'Rapids Shelf',
    loreQuote: '"Violent currents test the worthy and destroy the weak."',
    loreTag: 'Trial of the Currents',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  molten_core: {
    loreName: 'Volcanic Hearth',
    loreQuote: '"Magma rivers snake beneath the floor, hungry and restless."',
    loreTag: 'Heart of Fire',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  shadow_forest: {
    loreName: 'Mushroom Forest',
    loreQuote: '"Corruption blooms where the Plankton\'s light once purified."',
    loreTag: 'The Corrupted Garden',
    cardArt: 'boss',
    vesselConnection: 'plankton',
  },
  obsidian_wastes: {
    loreName: 'Obsidian Flats',
    loreQuote: '"Nothing survives here but spite and volcanic glass."',
    loreTag: 'The Blasted Wastes',
    cardArt: 'combat',
    vesselConnection: 'gorgon',
  },
  ruins_of_ashenmoor: {
    loreName: 'Ruins of the Deep',
    loreQuote: '"Abyssia\'s greatest city fell when the Crown shattered."',
    loreTag: 'Memory of Abyssia',
    cardArt: 'exploration',
    vesselConnection: 'betta',
  },
  blight_hollow: {
    loreName: 'Blight Hollow',
    loreQuote: '"The water itself is poisoned — the Abyss bleeds through."',
    loreTag: 'The Festering Wound',
    cardArt: 'combat',
    vesselConnection: 'gorgon',
  },
  shadow_citadel: {
    loreName: 'Shadow Citadel',
    loreQuote: '"Medusa\'s tears became abyssal pearls. Her rage became this fortress."',
    loreTag: 'Fortress of the Second Siren',
    cardArt: 'boss',
    vesselConnection: 'gorgon',
  },
  stormspire_peak: {
    loreName: 'Maelstrom Peak',
    loreQuote: '"The vortex masks the approach to the King\'s inner sanctum."',
    loreTag: 'Eye of the Storm',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  demon_gate: {
    loreName: 'Abyssal Gate',
    loreQuote: '"The barrier between the waters and the Abyss grows thin and cracks."',
    loreTag: 'The Thinning Veil',
    cardArt: 'boss',
    vesselConnection: 'gorgon',
  },
  abyssal_depths: {
    loreName: 'Hadal Trench',
    loreQuote: '"In the deepest dark, Plankton still glow. They spell a single word."',
    loreTag: 'Where the Light Hides',
    cardArt: 'exploration',
    vesselConnection: 'plankton',
  },
  infernal_forge: {
    loreName: 'Magma Forge',
    loreQuote: '"Weapons tempered in magma, quenched in cursed waters."',
    loreTag: 'The Dark Armory',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  dreadmaw_canyon: {
    loreName: 'Dreadmaw Rift',
    loreQuote: '"The rift pulses like a living maw, hungry for souls."',
    loreTag: 'The Hungry Dark',
    cardArt: 'combat',
    vesselConnection: 'gorgon',
  },
  void_threshold: {
    loreName: 'Void Threshold',
    loreQuote: '"Where light ends, the Abyss begins. A Sentinel stands watch."',
    loreTag: 'Edge of the Known',
    cardArt: 'boss',
    vesselConnection: 'plankton',
  },
  corrupted_spire: {
    loreName: 'Corrupted Spire',
    loreQuote: '"The last Crown fragment pulses faintly, calling out for rescue."',
    loreTag: 'The Final Fragment',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  void_throne: {
    loreName: 'The Abyss Throne',
    loreQuote: '"In crushing darkness, the King sits upon a throne of devoured light."',
    loreTag: 'Seat of the Abyss King',
    cardArt: 'boss',
    vesselConnection: 'gorgon',
  },
  hall_of_odin: {
    loreName: 'Temple of Currents',
    loreQuote: '"Only true champions may challenge the Lord of Currents."',
    loreTag: 'Divine Trial — Crusade',
    cardArt: 'boss',
    vesselConnection: 'betta',
  },
  maw_of_madra: {
    loreName: "The Devourer's Maw",
    loreQuote: '"Charybdis saw the moment the Plankton Magic died. It broke her."',
    loreTag: 'Lair of the Third Siren',
    cardArt: 'boss',
    vesselConnection: 'gorgon',
  },
  sanctum_of_omni: {
    loreName: 'Leviathan Sanctum',
    loreQuote: '"Beyond mortal comprehension, the Weaver reshapes destiny."',
    loreTag: 'Divine Trial — Fabled',
    cardArt: 'boss',
    vesselConnection: 'plankton',
  },
  void_maw: {
    loreName: 'The Void Maw',
    loreQuote: '"It consumed the Light of Unity whole — and still it hungers. The silence of the Plankton is its roar."',
    loreTag: 'Lair of the Consumer — Final Trial',
    cardArt: 'boss',
    vesselConnection: 'plankton',
  },
};

export const CARD_ART_CONFIG = {
  colorByTerrain: {
    green: 'green',
    blue: 'blue',
    red: 'red',
    purple: 'blue',
    gold: 'red',
  },
  versionByType: {
    mission: 'v1',
    exploration: 'v2',
    combat: 'v3',
    boss: 'v1',
  },
  getCardImage: (locationId, terrain) => {
    const lore = LOCATION_LORE[locationId];
    if (!lore) return '/images/cards/card_v1_blue.png';
    const color = CARD_ART_CONFIG.colorByTerrain[terrain] || 'blue';
    const version = CARD_ART_CONFIG.versionByType[lore.cardArt] || 'v1';
    return `/images/cards/card_${version}_${color}.png`;
  },
  getCardBack: (terrain) => {
    const color = CARD_ART_CONFIG.colorByTerrain[terrain] || 'blue';
    return `/images/cards/card_back_${color}.png`;
  },
  vesselColors: {
    betta: '#ef4444',
    gorgon: '#a78bfa',
    plankton: '#22d3ee',
  },
  vesselIcons: {
    betta: '🔥',
    gorgon: '🐍',
    plankton: '✨',
  },
  vesselLabels: {
    betta: 'Fire of Will',
    gorgon: 'Weight of Law',
    plankton: 'Light of Unity',
  },
};

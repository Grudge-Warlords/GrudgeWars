export const WORLD_LORE = {
  title: 'The Sunken Kingdom of Abyssia',
  subtitle: 'Where Magic Sleeps in Three Vessels',

  prologue: `In the age before memory, when the ocean was young and currents still sang, three vessels of magic sustained all life beneath the waves. The Betta — fierce, beautiful, and proud — carried the Fire of Will, the spark that drives all creatures to fight, to love, to endure. The Gorgons — ancient serpents of coral and stone — held the Weight of Law, the force that keeps the deep in order and the tides in rhythm. And the Plankton — countless, invisible, everywhere — bore the Light of Unity, the quiet magic that binds every living thing to every other.

For eons, the three magics held the ocean in balance. The Betta Warlords built the kingdom of Abyssia atop the Coral Crown, a living reef throne that channeled all three magics into harmony. The Gorgon Sirens kept vigil at the borders of the deep, their petrifying gaze holding the Abyss at bay. And the Plankton drifted through every current, every cave, every drop of water — a living web of light connecting all things.

Then the Plankton Magic went silent.

No one knows why. No warning, no cataclysm, no final cry. One day the water simply... dimmed. The bioluminescent networks that connected every reef and trench flickered and died. The currents lost their song. Fish that had swum together for millennia scattered in confusion. And in the sudden darkness, something stirred in the Abyss.

The Coral Crown shattered. The Gorgon Sirens, driven mad by the severed connection, turned hostile — their ancient duty corrupted into blind rage. The Betta Warlords, the last vessels of conscious magic, found themselves alone in a darkening ocean, hunted by the very guardians who once protected them.

Now you must gather your Warlords, restore the fragments of the Coral Crown, face the maddened Gorgons, and discover why the Plankton Magic fell silent — before the Abyss devours everything.`,

  threeVessels: [
    {
      name: 'The Betta — Fire of Will',
      icon: '🔥',
      color: '#ef4444',
      description: 'The Betta fish carry the oldest conscious magic in the ocean. Each of the eight breeds channels a different aspect of Will — from the Halfmoon\'s protective resolve to the Crowntail\'s fierce ambition. When a Betta Warlord fights, they don\'t just swing a weapon; they burn with the accumulated determination of every ancestor who refused to yield. This is why Betta can learn magic, wield enchanted weapons, and grow stronger through battle — their very nature is to overcome.',
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
      description: 'The most mysterious and powerful of the three magics. Plankton are everywhere in the ocean — in every drop of water, every breath, every current. Their magic was the connective tissue of all life, a living network of bioluminescent light that let every creature in the sea feel the heartbeat of every other. When the Plankton Magic went silent, it was as if the ocean itself went blind and deaf. The cause of the silence is the central mystery of the game.',
      status: 'Silent — The great mystery',
    },
  ],

  gorgonBosses: [
    {
      id: 'gorgon_scylla',
      name: 'Scylla, Siren of the Shallows',
      title: 'Guardian of the Sunlit Waters',
      color: '#06b6d4',
      description: 'Once the gentlest of the three Gorgon Sirens, Scylla watched over the coral reefs and shallow waters where young sea creatures took their first breaths. Her gaze would turn only poachers and reef-destroyers to stone, leaving graceful coral statues as warnings. Now maddened, she attacks anything that moves in the upper waters, her six serpentine heads striking with the speed of a riptide.',
      lore: 'Scylla\'s petrification was always temporary — she would release her victims after they learned respect for the reef. This mercy is now gone.',
      location: 'Shipwreck Hollow',
      level: 9,
    },
    {
      id: 'gorgon_medusa',
      name: 'Medusa, Siren of the Mid-Waters',
      title: 'Keeper of the Twilight Depths',
      color: '#a78bfa',
      description: 'Medusa dwelt in the twilight zone between light and darkness, maintaining the delicate border that kept abyssal horrors from rising. Her coral-snake hair could sense disturbances in the water from miles away, and her gaze created permanent stone barriers to seal breaches in the deep. With the Plankton Magic gone, she can no longer feel the boundaries she once guarded, and lashes out at shadows.',
      lore: 'Legend says Medusa wept when the Plankton Magic fell silent, and her tears became the first abyssal pearls — worth a fortune but cursed with sorrow.',
      location: 'Shadow Citadel',
      level: 17,
    },
    {
      id: 'gorgon_charybdis',
      name: 'Charybdis, Siren of the Abyss',
      title: 'The Devourer of the Deep',
      color: '#ef4444',
      description: 'The most fearsome of the three, Charybdis kept watch over the deepest trenches where reality itself grew thin. She could create whirlpools that swallowed entire armies, and her gaze didn\'t just petrify — it unmade, dissolving matter back into raw ocean. She is the final Gorgon boss, and defeating her may reveal what truly happened to the Plankton Magic.',
      lore: 'Charybdis is the only being who was present at the moment the Plankton Magic went silent. What she saw in that instant drove her to the edge of madness.',
      location: "The Devourer's Maw",
      level: 20,
    },
  ],

  planktonMystery: {
    name: 'The Silence of the Plankton',
    description: 'The central mystery of Betta Warlords. Why did the Plankton Magic — the Light of Unity that connected every living thing in the ocean — suddenly go silent? Throughout the game, players discover fragments of the truth: ancient inscriptions on the Coral Crown, whispered memories from the Gorgon Sirens, and strange bioluminescent echoes in the deepest trenches that suggest the Plankton didn\'t die — they chose to withdraw.',
    clues: [
      'The Coral Crown\'s inscriptions speak of a "Fourth Vessel" that was never meant to awaken.',
      'Charybdis\'s mad ravings mention "the light that ate itself."',
      'In the deepest part of the Hadal Trench, Plankton still glow — but they spell out a single word in an ancient script.',
      'The Abyss King isn\'t conquering the ocean — he\'s filling a vacuum the Plankton left behind.',
      'Each Coral Crown fragment restored causes a brief, blinding flash of Plankton light — as if they\'re watching.',
    ],
  },
};

export const LOCATION_LORE = {
  verdant_plains: {
    loreName: 'Coral Shallows',
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
    loreName: 'Tide Stream',
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
    loreName: 'Coral Fortress',
    loreQuote: '"The Abyss King\'s armies harden coral into weapons of war."',
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
    loreQuote: '"The bones of the First Tide War lie scattered across the sand."',
    loreTag: 'Graveyard of Heroes',
    cardArt: 'combat',
    vesselConnection: 'betta',
  },
  windswept_ridge: {
    loreName: 'Riptide Shelf',
    loreQuote: '"Violent currents test the worthy and destroy the weak."',
    loreTag: 'Trial of the Tides',
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
    loreQuote: '"The barrier between ocean and Abyss grows thin and cracks."',
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
    loreQuote: '"Weapons tempered in magma, quenched in cursed brine."',
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
    loreName: 'Temple of Tides',
    loreQuote: '"Only true champions may challenge the Lord of Tides."',
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

export const skillTrees = {
  warrior: {
    className: 'Bruiser',
    color: '#ef4444',
    tiers: [
      {
        name: 'Current 1 - Deep Combat',
        requiredLevel: 1,
        skills: [
          { id: 'w_taunt', name: 'Threatening Display', icon: 'skill_taunt', description: 'Flare your fins to force enemies to target you', effect: '+15% Threat', maxPoints: 3, bonuses: { defense: 5 } },
          { id: 'w_quick_strike', name: 'Quick Current', icon: 'skill_quick_strike', description: 'Fast strike riding the current', effect: '+15% Attack Speed', maxPoints: 3, bonuses: { attackSpeed: 5 } },
          { id: 'w_rending_strikes', name: 'Razor Scales', icon: 'skill_rending_strikes', description: 'Attacks rake with hardened scales causing bleeding', effect: '+10% Bleed Proc', maxPoints: 3, bonuses: { procChance: 3 }, passive: true, procEffect: { type: 'bleed', damage: 0.08, duration: 3 } }
        ]
      },
      {
        name: 'Current 5 - Grove Guardian',
        requiredLevel: 5,
        skills: [
          { id: 'w_damage_surge', name: 'Current Surge', icon: 'skill_damage_surge', description: 'Ride a surge of current for temporary damage boost', effect: '+25% Damage for 3 turns', maxPoints: 3, requires: 'w_quick_strike', bonuses: { damage: 3 } },
          { id: 'w_guardian_aura', name: "Shell Guard Aura", icon: 'shield', description: 'Harden your shell, boosting defense', effect: '+15% Party Defense', maxPoints: 3, requires: 'w_taunt', bonuses: { defense: 8 },
            grantedAbility: { id: 'guardian_aura', name: "Shell Guard Aura", icon: 'shield', description: 'Reinforce your shell, gaining +20 defense for 3 turns', type: 'buff', damage: 0, manaCost: 0, staminaCost: 20, cooldown: 5, target: 'self', effect: { stat: 'defense', flat: 20, duration: 3 } }
          },
          { id: 'w_demoralizing_shout', name: 'Predator Roar', icon: 'skill_demoralizing_shout', description: 'A deepwater bellow that weakens enemy attacks', effect: '-20% Enemy Attack', maxPoints: 3, requires: 'w_taunt', bonuses: { defense: 3 },
            grantedAbility: { id: 'demoralizing_shout', name: 'Predator Roar', icon: 'battle', description: 'Roar from the deep, reducing enemy attack by 20% for 3 turns', type: 'debuff', damage: 0, manaCost: 0, staminaCost: 15, cooldown: 5, target: 'enemy', effect: { type: 'lower_attack', percent: 0.20, duration: 3 } }
          }
        ]
      },
      {
        name: 'Current 10 - Abyssal Arts',
        requiredLevel: 10,
        skills: [
          { id: 'w_dual_wield', name: 'Twin Fins', icon: 'skill_dual_wield', description: 'Attack with both fins in rapid succession', effect: '+30% Attack Speed', maxPoints: 1, requires: 'w_damage_surge', bonuses: { attackSpeed: 15 } },
          { id: 'w_shield_spec', name: 'Nautilus Shell', icon: 'skill_shield_specialist', description: 'Master the spiral shell defense technique', effect: '+20% Block Chance', maxPoints: 3, requires: 'w_guardian_aura', bonuses: { block: 7 } },
          { id: 'w_life_drain', name: 'Vampire Squid Drain', icon: 'skill_life_drain', description: 'Draining strikes that siphon enemy life force', effect: 'Heal 10% of Damage', maxPoints: 2, requires: 'w_quick_strike', bonuses: { drainHealth: 5 },
            grantedAbility: { id: 'life_drain_strike', name: 'Vampire Drain', icon: 'heart', description: 'A draining strike that heals you for 20% of damage dealt', type: 'physical', damage: 1.4, manaCost: 0, staminaCost: 20, cooldown: 3, target: 'enemy', drainPercent: 0.2 }
          },
          { id: 'w_concussive_blow', name: 'Depth Charge', icon: 'skill_concussive_blow', description: 'A pressurized blow that stuns the target', effect: 'Stun 1 Turn', maxPoints: 2, requires: 'w_damage_surge', bonuses: { damage: 4 },
            grantedAbility: { id: 'concussive_blow', name: 'Depth Charge', icon: 'sparkle', description: 'A concussive pressure wave that stuns the enemy for 1 turn', type: 'physical', damage: 1.2, manaCost: 0, staminaCost: 22, cooldown: 4, target: 'enemy', effect: { type: 'stun', duration: 1 } }
          },
          { id: 'w_sunder_armor', name: 'Shell Breaker', icon: 'skill_sunder_armor', description: 'Shatter enemy shells and scales', effect: '-25% Enemy Defense', maxPoints: 2, requires: 'w_rending_strikes', bonuses: { damage: 3 },
            grantedAbility: { id: 'sunder_armor', name: 'Shell Breaker', icon: 'hammer', description: 'Smash through shells, lowering enemy defense by 25% for 3 turns', type: 'physical', damage: 0.8, manaCost: 0, staminaCost: 18, cooldown: 4, target: 'enemy', effect: { type: 'lower_defense', percent: 0.25, duration: 3 } }
          }
        ]
      },
      {
        name: 'Current 15 - Warlord',
        requiredLevel: 15,
        skills: [
          { id: 'w_execute', name: 'Finishing Bite', icon: 'skill_execute', description: 'Devastating bite against weakened prey', effect: '+50% Damage below 30% HP', maxPoints: 1, requires: 'w_dual_wield', bonuses: { damage: 10 },
            grantedAbility: { id: 'execute', name: 'Finishing Bite', icon: 'skull', description: 'Deal 3x damage to targets below 30% health', type: 'physical', damage: 1.5, manaCost: 0, staminaCost: 30, cooldown: 4, target: 'enemy', executeDamage: 3.0, executeThreshold: 0.3 }
          },
          { id: 'w_double_strike', name: 'Barracuda Rush', icon: 'skill_double_strike', description: 'Two lightning-fast consecutive strikes', effect: 'Double Hit Combo', maxPoints: 2, requires: 'w_life_drain', bonuses: { criticalChance: 5 } },
          { id: 'w_ignite_weapon', name: 'Hydrothermal Edge', icon: 'skill_ignite_weapon', description: 'Superheated vent water coats your strikes, scalding enemies', effect: 'Burn on Hit', maxPoints: 2, requires: 'w_concussive_blow', bonuses: { damage: 5 }, passive: true, procEffect: { type: 'burn', damage: 0.12, duration: 3 } },
          { id: 'w_bloodlust', name: 'Feeding Frenzy', icon: 'skill_bloodlust', description: 'Each bleed on target increases your damage as the frenzy builds', effect: '+8% Damage per Bleed', maxPoints: 2, requires: 'w_rending_strikes', bonuses: { damage: 4, attackSpeed: 5 }, passive: true }
        ]
      },
      {
        name: 'Current 20 - Leviathan',
        requiredLevel: 20,
        skills: [
          { id: 'w_avatar', name: 'Leviathan Ascension', icon: 'skill_avatar', description: 'Channel the ancient Leviathan, boosting all combat stats', effect: 'Ultimate Transformation', maxPoints: 1, requires: 'w_execute', bonuses: { damage: 15, defense: 15, health: 50 },
            grantedAbility: { id: 'avatar_form', name: 'Leviathan Ascension', icon: 'star', description: 'Transform into an avatar of the Leviathan, boosting all stats for 4 turns', type: 'buff', damage: 0, manaCost: 0, staminaCost: 50, cooldown: 10, target: 'self', effect: { stat: 'damage', multiplier: 1.5, duration: 4 }, defenseBoost: { stat: 'defense', flat: 25, duration: 4 } }
          },
          { id: 'w_relentless', name: 'Apex Predator', icon: 'skill_relentless', description: 'Killing blows restore stamina and reset cooldowns like a true apex hunter', effect: 'Kill Reset', maxPoints: 1, requires: 'w_double_strike', bonuses: { staminaRegen: 10, attackSpeed: 8 }, passive: true }
        ]
      }
    ]
  },
  mage: {
    className: 'Mystic',
    color: '#8b5cf6',
    tiers: [
      {
        name: 'Current 1 - Root Arts',
        requiredLevel: 1,
        skills: [
          { id: 'm_mana_flow', name: 'Ley Current', icon: 'skill_mana_flow', description: 'Tap into the root ley lines for faster mana recovery', effect: '+20% Mana Regen', maxPoints: 3, bonuses: { manaRegen: 0.5 } },
          { id: 'm_arcane_focus', name: 'Current Focus', icon: 'skill_arcane_focus', description: 'Channel current energy for increased spell damage', effect: '+10% Spell Damage', maxPoints: 3, bonuses: { damage: 3 } },
          { id: 'm_enfeeble', name: 'Ink Cloud', icon: 'skill_enfeeble', description: 'Spells leave an ink residue that saps enemy strength', effect: '-8% Enemy Attack on Hit', maxPoints: 3, bonuses: { defense: 2 }, passive: true, procEffect: { type: 'lower_attack', percent: 0.08, duration: 2 } }
        ]
      },
      {
        name: 'Current 5 - Elemental Depths',
        requiredLevel: 5,
        skills: [
          { id: 'm_fire_mastery', name: 'Vent Mastery', icon: 'skill_fire_mastery', description: 'Command hydrothermal vent energy', effect: '+25% Thermal Damage', maxPoints: 3, requires: 'm_arcane_focus', bonuses: { damage: 5 } },
          { id: 'm_ice_mastery', name: 'Frost Depth Mastery', icon: 'skill_ice_mastery', description: 'Harness the frozen depths below the thermocline', effect: '+15% Slow Effect', maxPoints: 3, requires: 'm_mana_flow', bonuses: { defense: 4 } },
          { id: 'm_flame_brand', name: 'Vent Sear', icon: 'skill_flame_brand', description: 'Brand the target with superheated vent water', effect: 'Burn DOT', maxPoints: 3, requires: 'm_arcane_focus', bonuses: { damage: 3 },
            grantedAbility: { id: 'flame_brand', name: 'Vent Sear', icon: 'fire', description: 'Scald the target with vent heat, burning for 15% spell damage over 4 turns', type: 'magical', damage: 0.6, manaCost: 20, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { type: 'burn', damage: 0.15, duration: 4 } }
          },
          { id: 'm_blessing', name: 'Root Blessing', icon: 'skill_blessing', description: 'Sacred root light heals over time', effect: 'Heal Over Time', maxPoints: 3, requires: 'm_mana_flow', bonuses: { health: 10 },
            grantedAbility: { id: 'blessing', name: 'Root Blessing', icon: 'sparkle', description: 'Bless yourself with root radiance, healing 8% HP per turn for 4 turns', type: 'heal_over_time', damage: 0, manaCost: 22, staminaCost: 0, cooldown: 5, target: 'self', healPercent: 0.08, duration: 4 }
          }
        ]
      },
      {
        name: 'Current 10 - Deep Channeling',
        requiredLevel: 10,
        skills: [
          { id: 'm_meteor', name: 'Depth Bomb', icon: 'skill_meteor_strike', description: 'Compress water pressure into a devastating explosion', effect: 'Massive Damage', maxPoints: 1, requires: 'm_fire_mastery', bonuses: { damage: 12 },
            grantedAbility: { id: 'meteor_strike', name: 'Depth Bomb', icon: 'bomb', description: 'Detonate compressed deepwater pressure for massive damage', type: 'magical', damage: 3.0, manaCost: 50, staminaCost: 0, cooldown: 5, target: 'enemy', effect: { type: 'burn', damage: 0.15, duration: 2 } }
          },
          { id: 'm_divine_shield', name: 'Pressure Barrier', icon: 'skill_divine_shield', description: 'A shield of compressed deepwater pressure', effect: 'Absorb Damage', maxPoints: 3, requires: 'm_ice_mastery', bonuses: { defense: 6, resistance: 3 } },
          { id: 'm_chain_lightning', name: 'Bio-Electric Surge', icon: 'skill_chain_lightning', description: 'Bioelectric energy arcs between foes like an electric eel', effect: 'Hit Multiple Targets', maxPoints: 2, requires: 'm_arcane_focus', bonuses: { damage: 6, criticalChance: 3 },
            grantedAbility: { id: 'chain_lightning', name: 'Bio-Electric Surge', icon: 'lightning', description: 'Launch arcing bioelectric energy that chains between enemies', type: 'magical', damage: 2.2, manaCost: 35, staminaCost: 0, cooldown: 3, target: 'enemy', effect: { type: 'dot', damage: 0.08, duration: 2 } }
          },
          { id: 'm_sleep', name: 'Lullaby Current', icon: 'skill_slumber', description: 'A soothing current that lulls the target to sleep', effect: 'Sleep 2 Turns', maxPoints: 2, requires: 'm_ice_mastery', bonuses: { mana: 15 },
            grantedAbility: { id: 'slumber', name: 'Lullaby Current', icon: 'moon', description: 'Lull the enemy into deep sleep for 2 turns. Damage wakes them.', type: 'magical', damage: 0, manaCost: 30, staminaCost: 0, cooldown: 6, target: 'enemy', effect: { type: 'sleep', duration: 2 } }
          },
          { id: 'm_mind_break', name: 'Abyssal Gaze', icon: 'skill_mind_break', description: 'Pierce the mind with the unknowable void of the abyss', effect: '-20% Enemy Defense', maxPoints: 2, requires: 'm_enfeeble', bonuses: { damage: 4 },
            grantedAbility: { id: 'mind_break', name: 'Abyssal Gaze', icon: 'mind', description: 'Shatter the enemy mind with abyssal terror, lowering defense by 20% for 3 turns', type: 'magical', damage: 0.5, manaCost: 25, staminaCost: 0, cooldown: 4, target: 'enemy', effect: { type: 'lower_defense', percent: 0.20, duration: 3 } }
          }
        ]
      },
      {
        name: 'Current 15 - Grand Currentcaller',
        requiredLevel: 15,
        skills: [
          { id: 'm_spell_echo', name: 'Current Echo', icon: 'skill_spell_echo', description: 'Spells reverberate through the water, chance to double cast', effect: '20% Echo Chance', maxPoints: 2, requires: 'm_meteor', bonuses: { damage: 8, mana: 20 } },
          { id: 'm_holy_nova', name: 'Bioluminescent Burst', icon: 'skill_holy_nova', description: 'Release a burst of bioluminescent healing energy', effect: 'Burst Heal + Damage', maxPoints: 2, requires: 'm_divine_shield', bonuses: { health: 30, damage: 5 },
            grantedAbility: { id: 'holy_nova', name: 'Bioluminescent Burst', icon: 'sparkle', description: 'Release bioluminescent energy, healing yourself for 25% HP', type: 'heal', damage: 0, manaCost: 45, staminaCost: 0, cooldown: 5, target: 'self', healPercent: 0.25 }
          },
          { id: 'm_confuse', name: 'Ink Hex', icon: 'skill_bewilderment', description: 'Toxic ink clouds befuddle the target mind', effect: 'Confuse 2 Turns', maxPoints: 2, requires: 'm_sleep', bonuses: { mana: 15 },
            grantedAbility: { id: 'bewilderment', name: 'Ink Hex', icon: 'chaos', description: 'Cloud the enemy mind with toxic ink for 2 turns. They may attack allies.', type: 'magical', damage: 0, manaCost: 35, staminaCost: 0, cooldown: 6, target: 'enemy', effect: { type: 'confuse', duration: 2 } }
          },
          { id: 'm_purify', name: 'Purifying Current', icon: 'skill_purify', description: 'Cleanse all toxins with pure freshwater', effect: 'Remove Debuffs', maxPoints: 1, requires: 'm_blessing', bonuses: { health: 20 },
            grantedAbility: { id: 'purify', name: 'Purifying Current', icon: 'sparkle', description: 'Cleanse all debuffs from yourself with purifying water and heal 15% HP', type: 'heal', damage: 0, manaCost: 30, staminaCost: 0, cooldown: 6, target: 'self', healPercent: 0.15, cleanse: true }
          }
        ]
      },
      {
        name: 'Current 20 - Abyssal Oracle',
        requiredLevel: 20,
        skills: [
          { id: 'm_arcane_cataclysm', name: 'Maelstrom', icon: 'skill_arcane_cataclysm', description: 'Summon a devastating underwater maelstrom of pure current energy', effect: 'Ultimate: Current Storm', maxPoints: 1, requires: 'm_spell_echo', bonuses: { damage: 20, mana: 50, criticalChance: 10 },
            grantedAbility: { id: 'arcane_cataclysm', name: 'Maelstrom', icon: 'star', description: 'Unleash a devastating maelstrom of crushing current forces', type: 'magical', damage: 4.0, manaCost: 70, staminaCost: 0, cooldown: 8, target: 'enemy' }
          },
          { id: 'm_spellweave', name: 'Currentcaller Mastery', icon: 'skill_spellweave', description: 'Spells carry random water afflictions (scald, sleep, confuse, corrode)', effect: 'Random Debuff Proc', maxPoints: 1, requires: 'm_confuse', bonuses: { damage: 10, mana: 25 }, passive: true, procEffect: { type: 'random_debuff', options: ['burn', 'sleep', 'confuse', 'lower_defense'], chance: 0.20 } }
        ]
      }
    ]
  },
  worge: {
    className: 'Vesselist',
    color: '#d97706',
    tiers: [
      {
        name: 'Current 1 - Primal Current',
        requiredLevel: 1,
        skills: [
          { id: 'wr_storm_touch', name: 'Storm Current', icon: 'skill_storm_touch', description: 'Channel bioelectric currents for stronger strikes', effect: '+15% Storm Damage', maxPoints: 3, bonuses: { damage: 3 } },
          { id: 'wr_bark_skin', name: 'Root Plating', icon: 'skill_bark_skin', description: 'Grow protective root armor over your scales', effect: '+10% Defense', maxPoints: 3, bonuses: { defense: 4, health: 10 } },
          { id: 'wr_feral_instinct', name: 'Predator Instinct', icon: 'skill_feral_instinct', description: 'Chance for a bonus follow-up strike driven by hunting instinct', effect: '+8% Proc Chance', maxPoints: 3, bonuses: { procChance: 3, attackSpeed: 2 }, passive: true, procEffect: { type: 'extra_attack', damage: 0.5 } }
        ]
      },
      {
        name: 'Current 5 - Dual Nature',
        requiredLevel: 5,
        skills: [
          { id: 'wr_weapon_mastery', name: 'Conch & Spine Mastery', icon: 'skill_weapon_mastery', description: 'Master the conch and venomous spine', effect: '+20% Weapon Damage', maxPoints: 3, requires: 'wr_storm_touch', bonuses: { damage: 4, criticalChance: 3 } },
          { id: 'wr_wild_growth', name: 'Kelp Renewal', icon: 'skill_wild_growth', description: 'Nature heals strengthen through kelp magic', effect: '+25% Heal Power', maxPoints: 3, requires: 'wr_bark_skin', bonuses: { health: 15 } },
          { id: 'wr_lacerate', name: 'Grove Shred', icon: 'skill_lacerate', description: 'Rake with root-edged claws causing deep wounds', effect: 'Bleed DOT', maxPoints: 3, requires: 'wr_feral_instinct', bonuses: { damage: 3 },
            grantedAbility: { id: 'lacerate', name: 'Grove Shred', icon: 'target', description: 'Shred the target with root claws, causing bleed for 10% damage over 4 turns', type: 'physical', damage: 1.0, manaCost: 0, staminaCost: 14, cooldown: 3, target: 'enemy', effect: { type: 'bleed', damage: 0.10, duration: 4 } }
          },
          { id: 'wr_soothing_rain', name: 'Healing Current', icon: 'skill_soothing_rain', description: 'Call a gentle current that mends wounds over time', effect: 'Heal Over Time', maxPoints: 3, requires: 'wr_bark_skin', bonuses: { health: 10 },
            grantedAbility: { id: 'soothing_rain', name: 'Healing Current', icon: 'nature', description: 'Call a healing current that restores 6% HP per turn for 5 turns', type: 'heal_over_time', damage: 0, manaCost: 18, staminaCost: 0, cooldown: 5, target: 'self', healPercent: 0.06, duration: 5 }
          }
        ]
      },
      {
        name: 'Current 10 - Shapeshifter',
        requiredLevel: 10,
        skills: [
          { id: 'wr_thunderclap', name: 'Electric Shockwave', icon: 'skill_thunderclap', description: 'Release a shockwave of bioelectric energy', effect: 'Spell Stun Chance', maxPoints: 1, requires: 'wr_weapon_mastery', bonuses: { damage: 10 },
            grantedAbility: { id: 'thunderclap', name: 'Electric Shockwave', icon: 'lightning', description: 'Release a bioelectric shockwave, dealing damage and stunning for 1 turn', type: 'magical', damage: 1.6, manaCost: 30, staminaCost: 0, cooldown: 4, target: 'enemy', effect: { type: 'stun', duration: 1 } }
          },
          { id: 'wr_iron_hide', name: 'Armored Scales', icon: 'skill_iron_hide', description: 'Shark form grows thicker, armor-like scales', effect: '+30% Shark Defense', maxPoints: 3, requires: 'wr_wild_growth', bonuses: { defense: 6, health: 15 } },
          { id: 'wr_venom_edge', name: 'Lionfish Venom', icon: 'skill_venom_edge', description: 'Coat your spines with potent lionfish toxin', effect: '+20% Poison Damage', maxPoints: 2, requires: 'wr_storm_touch', bonuses: { damage: 5 },
            grantedAbility: { id: 'venom_strike', name: 'Lionfish Sting', icon: 'sword', description: 'A venomous spine strike that poisons for 4 turns', type: 'physical', damage: 1.1, manaCost: 0, staminaCost: 18, cooldown: 3, target: 'enemy', effect: { type: 'poison', damage: 0.18, duration: 4 } }
          },
          { id: 'wr_entangle', name: 'Kelp Snare', icon: 'skill_entangle', description: 'Summon kelp tendrils that bind and damage', effect: 'Root + DOT', maxPoints: 2, requires: 'wr_wild_growth', bonuses: { defense: 4 },
            grantedAbility: { id: 'entangle', name: 'Kelp Snare', icon: 'nature', description: 'Summon kelp that stuns for 1 turn and deals damage over 3 turns', type: 'magical', damage: 0.5, manaCost: 22, staminaCost: 0, cooldown: 5, target: 'enemy', effect: { type: 'stun', duration: 1 }, secondaryEffect: { type: 'dot', damage: 0.10, duration: 3 } }
          }
        ]
      },
      {
        name: 'Current 15 - Waters Warden',
        requiredLevel: 15,
        skills: [
          { id: 'wr_tempest', name: 'Rapids Tempest', icon: 'skill_tempest', description: 'Unleash the fury of storm and water as one', effect: '+40% Storm Power', maxPoints: 1, requires: 'wr_thunderclap', bonuses: { damage: 8, attackSpeed: 10 },
            grantedAbility: { id: 'tempest', name: 'Rapids Tempest', icon: 'chaos', description: 'Summon a raging rapids dealing heavy storm damage', type: 'magical', damage: 2.5, manaCost: 40, staminaCost: 0, cooldown: 4, target: 'enemy', effect: { type: 'lower_attack', percent: 0.15, duration: 2 } }
          },
          { id: 'wr_rejuvenate', name: 'Current Regeneration', icon: 'skill_rejuvenate', description: 'The water itself mends your wounds passively', effect: 'Passive Regen', maxPoints: 2, requires: 'wr_iron_hide', bonuses: { drainHealth: 5, health: 20 } },
          { id: 'wr_primal_roar', name: 'Abyssal Howl', icon: 'skill_primal_roar', description: 'A terrifying deepwater howl that disorients and weakens', effect: 'Confuse + Lower Attack', maxPoints: 2, requires: 'wr_iron_hide', bonuses: { defense: 5 },
            grantedAbility: { id: 'primal_roar', name: 'Abyssal Howl', icon: 'wolf', description: 'Unleash an abyssal howl that confuses the enemy for 2 turns and lowers attack by 15%', type: 'debuff', damage: 0, manaCost: 0, staminaCost: 25, cooldown: 6, target: 'enemy', effect: { type: 'confuse', duration: 2 }, secondaryEffect: { type: 'lower_attack', percent: 0.15, duration: 2 } }
          },
          { id: 'wr_savage_bleed', name: 'Shark Frenzy Rend', icon: 'skill_savage_rend', description: 'Shark form attacks cause deep, bleeding wounds', effect: 'Shark Bleed Proc', maxPoints: 2, requires: 'wr_lacerate', bonuses: { damage: 6 }, passive: true, procEffect: { type: 'bleed', damage: 0.12, duration: 3 } }
        ]
      },
      {
        name: 'Current 20 - Primal Leviathan',
        requiredLevel: 20,
        skills: [
          { id: 'wr_natures_wrath', name: "Waters' Wrath", icon: 'star', description: 'Command storm, water, and beast as one devastating force', effect: 'Ultimate: Primal Tsunami', maxPoints: 1, requires: 'wr_tempest', bonuses: { damage: 15, attackSpeed: 15, health: 40 },
            grantedAbility: { id: 'natures_wrath', name: "Waters' Wrath", icon: 'star', description: 'Unleash the full wrath of the waters in a devastating current assault', type: 'magical', damage: 3.5, manaCost: 50, staminaCost: 20, cooldown: 8, target: 'enemy', effect: { type: 'dot', damage: 0.2, duration: 3 } }
          },
          { id: 'wr_alpha_predator', name: 'Alpha Shark', icon: 'skill_alpha_predator', description: 'Each kill in shark form extends duration and heals like the apex of the deep', effect: 'Kill Sustain', maxPoints: 1, requires: 'wr_primal_roar', bonuses: { damage: 10, health: 30, drainHealth: 8 }, passive: true }
        ]
      }
    ]
  },
  ranger: {
    className: 'Scraper',
    color: '#22c55e',
    tiers: [
      {
        name: 'Current 1 - Spine Mastery',
        requiredLevel: 1,
        skills: [
          { id: 'r_precision', name: 'Precision', icon: 'skill_precision', description: 'Sharpen your aim for deadly accuracy', effect: '+15% Accuracy', maxPoints: 3, bonuses: { accuracy: 5, criticalChance: 2 } },
          { id: 'r_swift_draw', name: 'Quick Quill', icon: 'skill_swift_draw', description: 'Faster spine loading and firing', effect: '+10% Attack Speed', maxPoints: 3, bonuses: { attackSpeed: 4 } },
          { id: 'r_crippling_shot', name: 'Corroding Barb', icon: 'skill_crippling_shot', description: 'Spines carry a corrosive coating that weakens defenses', effect: '-8% Enemy Defense on Hit', maxPoints: 3, bonuses: { damage: 2 }, passive: true, procEffect: { type: 'lower_defense', percent: 0.08, duration: 2 } }
        ]
      },
      {
        name: 'Current 5 - Hunter of the Deep',
        requiredLevel: 5,
        skills: [
          { id: 'r_headshot', name: 'Weak Point Strike', icon: 'skill_headshot', description: 'Target vulnerable gill and eye spots for critical damage', effect: '+50% Crit Damage', maxPoints: 3, requires: 'r_precision', bonuses: { criticalDamage: 15 } },
          { id: 'r_evasion', name: 'Current Rider', icon: 'nature', description: 'Ride the currents to dodge attacks', effect: '+15% Evasion', maxPoints: 3, requires: 'r_swift_draw', bonuses: { evasion: 5 } },
          { id: 'r_venom_arrow', name: 'Venom Spine', icon: 'skill_venom_arrow', description: 'Tip spines with potent water snake venom', effect: 'Poison DOT', maxPoints: 3, requires: 'r_precision', bonuses: { damage: 3 },
            grantedAbility: { id: 'venom_arrow', name: 'Venom Spine', icon: 'skull', description: 'Fire a venom-tipped spine that poisons for damage over 4 turns', type: 'physical', damage: 0.7, manaCost: 0, staminaCost: 14, cooldown: 3, target: 'enemy', effect: { type: 'poison', damage: 0.12, duration: 4 } }
          },
          { id: 'r_hunters_mark', name: "Predator's Mark", icon: 'target', description: 'Mark prey, exposing weaknesses to the hunting party', effect: '-15% Enemy Defense', maxPoints: 3, requires: 'r_crippling_shot', bonuses: { damage: 2, criticalChance: 2 },
            grantedAbility: { id: 'hunters_mark', name: "Predator's Mark", icon: 'target', description: 'Mark the enemy, reducing their defense by 20% for 4 turns', type: 'debuff', damage: 0, manaCost: 0, staminaCost: 12, cooldown: 5, target: 'enemy', effect: { type: 'lower_defense', percent: 0.20, duration: 4 } }
          }
        ]
      },
      {
        name: 'Current 10 - Sharpshooter',
        requiredLevel: 10,
        skills: [
          { id: 'r_piercing', name: 'Piercing Harpoon', icon: 'skill_piercing_shot', description: 'Harpoon spines that pierce through shell and scale', effect: '25% Armor Pen', maxPoints: 1, requires: 'r_headshot', bonuses: { armorPenetration: 10, damage: 5 },
            grantedAbility: { id: 'piercing_shot', name: 'Piercing Harpoon', icon: 'bow', description: 'Fire an armor-piercing harpoon that ignores defense', type: 'physical', damage: 2.2, manaCost: 0, staminaCost: 22, cooldown: 3, target: 'enemy', armorPiercing: true }
          },
          { id: 'r_multishot', name: 'Spine Barrage', icon: 'skill_multishot', description: 'Fire a spread of spines in rapid succession', effect: '3 Spine Spread', maxPoints: 3, requires: 'r_swift_draw', bonuses: { damage: 4 },
            grantedAbility: { id: 'multishot', name: 'Spine Barrage', icon: 'chaos', description: 'Fire a spread of spines dealing moderate damage', type: 'physical', damage: 1.8, manaCost: 0, staminaCost: 20, cooldown: 3, target: 'enemy' }
          },
          { id: 'r_trap', name: 'Anemone Trap', icon: 'skill_bear_trap', description: 'Place a stinging anemone that stuns prey', effect: '1 Turn Stun', maxPoints: 2, requires: 'r_evasion', bonuses: { defense: 5 },
            grantedAbility: { id: 'bear_trap', name: 'Anemone Trap', icon: 'bomb', description: 'Deploy a stinging anemone that stuns the enemy for 1 turn', type: 'physical', damage: 0.6, manaCost: 0, staminaCost: 15, cooldown: 4, target: 'enemy', effect: { type: 'stun', duration: 1 } }
          },
          { id: 'r_bleed_arrow', name: 'Barbed Spine', icon: 'skill_barbed_arrow', description: 'Barbed spines with backward hooks that tear flesh', effect: 'Bleed DOT', maxPoints: 2, requires: 'r_venom_arrow', bonuses: { damage: 4 },
            grantedAbility: { id: 'barbed_arrow', name: 'Barbed Spine', icon: 'target', description: 'Fire a barbed spine that causes bleeding for 12% damage over 4 turns', type: 'physical', damage: 0.9, manaCost: 0, staminaCost: 16, cooldown: 3, target: 'enemy', effect: { type: 'bleed', damage: 0.12, duration: 4 } }
          }
        ]
      },
      {
        name: 'Current 15 - Shadow Hunter',
        requiredLevel: 15,
        skills: [
          { id: 'r_sniper', name: 'Abyssal Sniper', icon: 'skill_sniper', description: 'Strike from the deepest shadows with perfect precision', effect: '+100% Range Damage', maxPoints: 1, requires: 'r_piercing', bonuses: { damage: 12, criticalChance: 8 },
            grantedAbility: { id: 'sniper_shot', name: 'Abyssal Shot', icon: 'bow', description: 'A perfectly aimed shot from the deep that always critically strikes', type: 'physical', damage: 2.8, manaCost: 0, staminaCost: 30, cooldown: 5, target: 'enemy', guaranteedCrit: true }
          },
          { id: 'r_wind_walk', name: 'Ink Cloak', icon: 'skill_wind_walk', description: 'Vanish into a cloud of ink, becoming impossible to hit', effect: 'Stealth + Speed', maxPoints: 2, requires: 'r_trap', bonuses: { evasion: 8, movementSpeed: 5 },
            grantedAbility: { id: 'wind_walk', name: 'Ink Cloak', icon: 'energy', description: 'Vanish into ink, boosting evasion by 60% for 2 turns', type: 'buff', damage: 0, manaCost: 0, staminaCost: 18, cooldown: 5, target: 'self', effect: { stat: 'evasion', flat: 60, duration: 2 } }
          },
          { id: 'r_sleep_dart', name: 'Pufferfish Dart', icon: 'skill_sleep_dart', description: 'A dart tipped with pufferfish toxin that induces sleep', effect: 'Sleep 2 Turns', maxPoints: 2, requires: 'r_venom_arrow', bonuses: { damage: 3 },
            grantedAbility: { id: 'sleep_dart', name: 'Pufferfish Dart', icon: 'moon', description: 'Fire a pufferfish toxin dart, putting the enemy to sleep for 2 turns', type: 'physical', damage: 0, manaCost: 0, staminaCost: 20, cooldown: 6, target: 'enemy', effect: { type: 'sleep', duration: 2 } }
          },
          { id: 'r_expose_weakness', name: 'Expose Gills', icon: 'skill_expose_weakness', description: 'Critical hits reveal enemy weak points, reducing their attack', effect: 'Crit Debuff', maxPoints: 2, requires: 'r_hunters_mark', bonuses: { criticalChance: 5, damage: 3 }, passive: true, procEffect: { type: 'lower_attack', percent: 0.12, duration: 2, onCrit: true } }
        ]
      },
      {
        name: 'Current 20 - Phantom of the Deep',
        requiredLevel: 20,
        skills: [
          { id: 'r_arrow_storm', name: 'Spine Tempest', icon: 'skill_arrow_storm', description: 'Rain a devastating storm of razor spines from the depths', effect: 'Ultimate: Spine Rain', maxPoints: 1, requires: 'r_sniper', bonuses: { damage: 18, criticalChance: 10, attackSpeed: 10 },
            grantedAbility: { id: 'arrow_storm', name: 'Spine Tempest', icon: 'star', description: 'Rain a devastating storm of razor spines from above', type: 'physical', damage: 3.5, manaCost: 0, staminaCost: 40, cooldown: 7, target: 'enemy' }
          },
          { id: 'r_death_blossom', name: 'Water Urchin Cascade', icon: 'skill_death_blossom', description: 'Every attack deploys a cascade of toxins — poison, bleed, and corrosion all at once', effect: 'Multi-DOT Proc', maxPoints: 1, requires: 'r_bleed_arrow', bonuses: { damage: 12, criticalChance: 8 }, passive: true, procEffect: { type: 'multi_dot', effects: ['poison', 'bleed', 'lower_defense'], chance: 0.25 } }
        ]
      }
    ]
  }
};

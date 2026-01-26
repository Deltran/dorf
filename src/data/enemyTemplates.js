import { EffectType } from './statusEffects.js'

export const enemyTemplates = {
  // Forest enemies (early game)
  goblin_scout: {
    id: 'goblin_scout',
    name: 'Goblin Scout',
    stats: { hp: 50, atk: 15, def: 5, spd: 12 },
    skill: {
      name: 'Quick Stab',
      description: 'Deal 120% ATK damage',
      cooldown: 2
    }
  },
  goblin_warrior: {
    id: 'goblin_warrior',
    name: 'Goblin Warrior',
    stats: { hp: 70, atk: 18, def: 10, spd: 9 },
    skill: {
      name: 'Savage Swing',
      description: 'Deal 130% ATK damage',
      cooldown: 3
    }
  },
  goblin_thrower: {
    id: 'goblin_thrower',
    name: 'Goblin Thrower',
    stats: { hp: 55, atk: 16, def: 7, spd: 20 },
    skill: {
      name: 'Rock Toss',
      description: 'Deal 110% ATK damage',
      cooldown: 2
    }
  },
  goblin_shaman: {
    id: 'goblin_shaman',
    name: 'Goblin Shaman',
    stats: { hp: 60, atk: 12, def: 6, spd: 11 },
    skill: {
      name: 'War Chant',
      description: 'Increase all allies ATK by 25% for 3 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 3, value: 25 }
      ]
    }
  },
  goblin_trapper: {
    id: 'goblin_trapper',
    name: 'Goblin Trapper',
    stats: { hp: 65, atk: 14, def: 12, spd: 10 },
    skill: {
      name: 'Spike Trap',
      description: 'Set up traps that deal 100% ATK damage to attackers for 3 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.THORNS, target: 'self', duration: 3, value: 100 }
      ]
    }
  },
  goblin_bulwark: {
    id: 'goblin_bulwark',
    name: 'Goblin Bulwark',
    stats: { hp: 80, atk: 10, def: 8, spd: 7 },
    skill: {
      name: 'Shield Wall',
      description: 'Increase all other allies DEF by 50% for 3 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 3, value: 50, excludeSelf: true }
      ]
    }
  },
  goblin_commander: {
    id: 'goblin_commander',
    name: 'Goblin Commander',
    stats: { hp: 220, atk: 32, def: 18, spd: 12 },
    imageSize: 140,
    skills: [
      {
        name: 'Rally Troops',
        description: 'Deal 25% ATK damage to all heroes and increase all allies ATK by 30% for 3 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 3, value: 30 }
        ]
      },
      {
        name: 'Commanding Strike',
        description: 'Deal 150% ATK damage and reduce target DEF by 25% for 2 turns',
        cooldown: 3,
        effects: [
          { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 25 }
        ]
      }
    ]
  },
  forest_wolf: {
    id: 'forest_wolf',
    name: 'Forest Wolf',
    stats: { hp: 60, atk: 20, def: 8, spd: 14 },
    skill: {
      name: 'Pounce',
      description: 'Deal 140% ATK damage to the lowest HP hero',
      cooldown: 3
    }
  },
  dire_wolf: {
    id: 'dire_wolf',
    name: 'Dire Wolf',
    stats: { hp: 90, atk: 25, def: 12, spd: 13 },
    skill: {
      name: 'Rending Bite',
      description: 'Deal 150% ATK damage and reduce target DEF by 20% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 20 }
      ]
    }
  },
  forest_spider: {
    id: 'forest_spider',
    name: 'Forest Spider',
    stats: { hp: 40, atk: 22, def: 5, spd: 16 },
    skill: {
      name: 'Venomous Bite',
      description: 'Deal 100% ATK damage and deal 10 damage at end of turn for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, value: 10 }
      ]
    }
  },

  // Lake enemies (branching area)
  giant_frog: {
    id: 'giant_frog',
    name: 'Giant Frog',
    stats: { hp: 70, atk: 18, def: 8, spd: 11 },
    skill: {
      name: 'Tongue Lash',
      description: 'Deal 130% ATK damage and pull target to front position',
      cooldown: 3
    }
  },
  lake_serpent: {
    id: 'lake_serpent',
    name: 'Lake Serpent',
    stats: { hp: 85, atk: 24, def: 10, spd: 15 },
    skill: {
      name: 'Constrict',
      description: 'Deal 110% ATK damage and reduce target SPD by 30% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  marsh_hag: {
    id: 'marsh_hag',
    name: 'Marsh Hag',
    stats: { hp: 180, atk: 30, def: 14, spd: 10 },
    imageSize: 130,
    skills: [
      {
        name: 'Murky Curse',
        description: 'Deal 100% ATK damage to all heroes and reduce their ATK by 25% for 2 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.ATK_DOWN, target: 'all_heroes', duration: 2, value: 25 }
        ]
      },
      {
        name: 'Draining Touch',
        description: 'Deal 140% ATK damage and heal self for 50% of damage dealt',
        cooldown: 3,
        lifesteal: 50
      }
    ]
  },

  // Cave enemies (mid game)
  cave_bat: {
    id: 'cave_bat',
    name: 'Cave Bat',
    stats: { hp: 35, atk: 18, def: 3, spd: 20 },
    skill: {
      name: 'Sonic Screech',
      description: 'Deal 80% ATK damage to all heroes',
      cooldown: 4
    }
  },
  rock_golem: {
    id: 'rock_golem',
    name: 'Rock Golem',
    stats: { hp: 150, atk: 30, def: 35, spd: 4 },
    skill: {
      name: 'Boulder Smash',
      description: 'Deal 180% ATK damage',
      cooldown: 4
    }
  },
  dark_cultist: {
    id: 'dark_cultist',
    name: 'Dark Cultist',
    stats: { hp: 65, atk: 28, def: 10, spd: 11 },
    skill: {
      name: 'Shadow Bolt',
      description: 'Deal 120% ATK damage and poison for 40% ATK per turn for 2 turns',
      cooldown: 2,
      damagePercent: 120,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, atkPercent: 40 }
      ]
    }
  },
  dark_caster: {
    id: 'dark_caster',
    name: 'Dark Caster',
    stats: { hp: 55, atk: 32, def: 8, spd: 12 },
    skill: {
      name: 'Curse of Weakness',
      description: 'Deal 140% ATK damage and reduce ATK by 40% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 40 }
      ]
    }
  },
  cave_troll: {
    id: 'cave_troll',
    name: 'Cave Troll',
    stats: { hp: 200, atk: 35, def: 20, spd: 5 },
    skill: {
      name: 'Crushing Blow',
      description: 'Deal 160% ATK damage and stun target for 1 turn',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  cultist_ritualist: {
    id: 'cultist_ritualist',
    name: 'Cultist Ritualist',
    stats: { hp: 75, atk: 20, def: 12, spd: 10 },
    skill: {
      name: 'Dark Blessing',
      description: 'Heal all allies for 30% of max HP and increase ATK by 20% for 2 turns',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 30,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 20 }
      ]
    }
  },
  corrupted_golem: {
    id: 'corrupted_golem',
    name: 'Corrupted Golem',
    stats: { hp: 180, atk: 35, def: 30, spd: 5 },
    skill: {
      name: 'Shadow Slam',
      description: 'Deal 160% ATK damage and reduce target DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },

  // Mountain enemies (late game)
  harpy: {
    id: 'harpy',
    name: 'Harpy',
    stats: { hp: 80, atk: 32, def: 12, spd: 18 },
    skill: {
      name: 'Diving Talon',
      description: 'Deal 150% ATK damage, +50% if target HP is below 50%',
      cooldown: 3
    }
  },
  frost_elemental: {
    id: 'frost_elemental',
    name: 'Frost Elemental',
    stats: { hp: 100, atk: 35, def: 25, spd: 10 },
    skill: {
      name: 'Freezing Blast',
      description: 'Deal 120% ATK damage to all heroes and reduce SPD by 30% for 2 turns',
      cooldown: 5,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  storm_elemental: {
    id: 'storm_elemental',
    name: 'Storm Elemental',
    stats: { hp: 90, atk: 38, def: 18, spd: 16 },
    skill: {
      name: 'Chain Lightning',
      description: 'Deal 100% ATK damage to all heroes',
      cooldown: 3,
      targetType: 'all_heroes'
    }
  },
  thunder_hawk: {
    id: 'thunder_hawk',
    name: 'Thunder Hawk',
    stats: { hp: 70, atk: 35, def: 10, spd: 22 },
    skill: {
      name: 'Lightning Dive',
      description: 'Deal 180% ATK damage and reduce target SPD by 40% for 1 turn',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 1, value: 40 }
      ]
    }
  },
  mountain_giant: {
    id: 'mountain_giant',
    name: 'Mountain Giant',
    stats: { hp: 300, atk: 45, def: 30, spd: 3 },
    skill: {
      name: 'Earthquake',
      description: 'Deal 100% ATK damage to all heroes',
      cooldown: 6
    }
  },

  // Boss enemies
  goblin_chieftain: {
    id: 'goblin_chieftain',
    name: 'Goblin Chieftain',
    imageSize: 150,
    stats: { hp: 180, atk: 28, def: 18, spd: 10 },
    skills: [
      {
        name: 'War Cry',
        description: 'Deal 100% ATK damage to all heroes and increase own ATK by 25% for 3 turns',
        cooldown: 4,
        effects: [
          { type: EffectType.ATK_UP, target: 'self', duration: 3, value: 25 }
        ]
      },
      {
        name: 'Dominion',
        description: 'Deal 120% ATK damage to one hero and remove all their buffs',
        cooldown: 3,
        cleanse: 'buffs'
      }
    ]
  },
  spider_queen: {
    id: 'spider_queen',
    name: 'Spider Queen',
    stats: { hp: 220, atk: 38, def: 15, spd: 14 },
    skill: {
      name: 'Web Trap',
      description: 'Deal 130% ATK damage and reduce target SPD by 50% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 50 }
      ]
    }
  },
  shadow_dragon: {
    id: 'shadow_dragon',
    name: 'Shadow Dragon',
    stats: { hp: 500, atk: 55, def: 40, spd: 12 },
    skill: {
      name: 'Shadow Breath',
      description: 'Deal 150% ATK damage to all heroes',
      cooldown: 4
    }
  },

  // The Summit enemies (ancient wind temple)
  wind_spirit: {
    id: 'wind_spirit',
    name: 'Wind Spirit',
    stats: { hp: 85, atk: 40, def: 15, spd: 24 },
    skill: {
      name: 'Gale Force',
      description: 'Deal 130% ATK damage and reduce target SPD by 25% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 25 }
      ]
    }
  },
  ice_wraith: {
    id: 'ice_wraith',
    name: 'Ice Wraith',
    stats: { hp: 95, atk: 42, def: 18, spd: 17 },
    skill: {
      name: 'Frozen Touch',
      description: 'Deal 140% ATK damage and reduce target ATK by 30% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  ancient_guardian: {
    id: 'ancient_guardian',
    name: 'Ancient Guardian',
    stats: { hp: 200, atk: 38, def: 40, spd: 6 },
    skill: {
      name: 'Sentinel Strike',
      description: 'Deal 150% ATK damage and increase own DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 30 }
      ]
    }
  },
  summit_giant: {
    id: 'summit_giant',
    name: 'Summit Giant',
    stats: { hp: 350, atk: 50, def: 35, spd: 4 },
    skill: {
      name: 'Avalanche',
      description: 'Deal 120% ATK damage to all heroes and reduce SPD by 20% for 2 turns',
      cooldown: 5,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 20 }
      ]
    }
  },
  ancient_titan: {
    id: 'ancient_titan',
    name: 'Ancient Titan',
    stats: { hp: 600, atk: 58, def: 45, spd: 8 },
    imageSize: 160,
    skills: [
      {
        name: 'Primordial Storm',
        description: 'Deal 130% ATK damage to all heroes and reduce ATK by 25% for 2 turns',
        cooldown: 5,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.ATK_DOWN, target: 'all_heroes', duration: 2, value: 25 }
        ]
      },
      {
        name: 'Titan\'s Wrath',
        description: 'Deal 200% ATK damage to lowest HP hero',
        cooldown: 4
      }
    ]
  },

  // Blistering Cliffsides enemies (volcanic)
  fire_elemental: {
    id: 'fire_elemental',
    name: 'Fire Elemental',
    stats: { hp: 110, atk: 45, def: 20, spd: 14 },
    skill: {
      name: 'Flame Burst',
      description: 'Deal 140% ATK damage and deal 15 damage at end of turn for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, value: 15 }
      ]
    }
  },
  magma_golem: {
    id: 'magma_golem',
    name: 'Magma Golem',
    stats: { hp: 220, atk: 42, def: 35, spd: 5 },
    skill: {
      name: 'Molten Slam',
      description: 'Deal 160% ATK damage and reduce target DEF by 25% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 25 }
      ]
    }
  },
  ash_crawler: {
    id: 'ash_crawler',
    name: 'Ash Crawler',
    stats: { hp: 70, atk: 35, def: 12, spd: 20 },
    skill: {
      name: 'Ember Swarm',
      description: 'Deal 100% ATK damage to all heroes',
      cooldown: 4,
      targetType: 'all_heroes'
    }
  },
  flame_salamander: {
    id: 'flame_salamander',
    name: 'Flame Salamander',
    stats: { hp: 130, atk: 48, def: 22, spd: 13 },
    skill: {
      name: 'Searing Breath',
      description: 'Deal 150% ATK damage and deal 20 damage at end of turn for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.POISON, target: 'hero', duration: 2, value: 20 }
      ]
    }
  },
  volcanic_drake: {
    id: 'volcanic_drake',
    name: 'Volcanic Drake',
    stats: { hp: 280, atk: 52, def: 28, spd: 11 },
    skill: {
      name: 'Lava Breath',
      description: 'Deal 130% ATK damage to all heroes',
      cooldown: 5,
      targetType: 'all_heroes'
    }
  },

  // Janxier Floodplain enemies (flooded plains)
  swamp_lurker: {
    id: 'swamp_lurker',
    name: 'Swamp Lurker',
    stats: { hp: 120, atk: 46, def: 18, spd: 16 },
    skill: {
      name: 'Ambush Strike',
      description: 'Deal 180% ATK damage to lowest HP hero',
      cooldown: 4
    }
  },
  mud_elemental: {
    id: 'mud_elemental',
    name: 'Mud Elemental',
    stats: { hp: 180, atk: 38, def: 32, spd: 7 },
    skill: {
      name: 'Mire Grasp',
      description: 'Deal 120% ATK damage and reduce target SPD by 40% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 40 }
      ]
    }
  },
  water_naga: {
    id: 'water_naga',
    name: 'Water Naga',
    stats: { hp: 140, atk: 50, def: 20, spd: 15 },
    skill: {
      name: 'Tidal Curse',
      description: 'Deal 130% ATK damage and reduce target ATK by 35% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 35 }
      ]
    }
  },
  giant_crocodile: {
    id: 'giant_crocodile',
    name: 'Giant Crocodile',
    stats: { hp: 200, atk: 55, def: 25, spd: 9 },
    skill: {
      name: 'Death Roll',
      description: 'Deal 170% ATK damage and stun target for 1 turn',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  hydra: {
    id: 'hydra',
    name: 'Hydra',
    stats: { hp: 650, atk: 55, def: 38, spd: 10 },
    imageSize: 160,
    skills: [
      {
        name: 'Multi-Head Strike',
        description: 'Deal 80% ATK damage to all heroes',
        cooldown: 3,
        targetType: 'all_heroes'
      },
      {
        name: 'Regeneration',
        description: 'Heal self for 15% of max HP and increase ATK by 20% for 2 turns',
        cooldown: 4,
        noDamage: true,
        healSelf: 15,
        effects: [
          { type: EffectType.ATK_UP, target: 'self', duration: 2, value: 20 }
        ]
      }
    ]
  },

  // Old Fort Calindash enemies (ruined fort)
  bandit_scout: {
    id: 'bandit_scout',
    name: 'Bandit Scout',
    stats: { hp: 100, atk: 42, def: 16, spd: 18 },
    skill: {
      name: 'Cheap Shot',
      description: 'Deal 150% ATK damage to lowest HP hero',
      cooldown: 3
    }
  },
  bandit_brute: {
    id: 'bandit_brute',
    name: 'Bandit Brute',
    stats: { hp: 160, atk: 52, def: 24, spd: 8 },
    skill: {
      name: 'Crushing Blow',
      description: 'Deal 170% ATK damage and reduce target DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  skeletal_soldier: {
    id: 'skeletal_soldier',
    name: 'Skeletal Soldier',
    stats: { hp: 110, atk: 40, def: 22, spd: 12 },
    skill: {
      name: 'Bone Slash',
      description: 'Deal 140% ATK damage',
      cooldown: 3
    }
  },
  ghostly_knight: {
    id: 'ghostly_knight',
    name: 'Ghostly Knight',
    stats: { hp: 150, atk: 48, def: 30, spd: 11 },
    skill: {
      name: 'Spectral Strike',
      description: 'Deal 140% ATK damage and reduce target ATK by 25% for 2 turns',
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 25 }
      ]
    }
  },
  deserter_captain: {
    id: 'deserter_captain',
    name: 'Deserter Captain',
    stats: { hp: 200, atk: 50, def: 28, spd: 13 },
    skills: [
      {
        name: 'Rally Bandits',
        description: 'Increase all allies ATK by 30% for 2 turns',
        cooldown: 4,
        noDamage: true,
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 30 }
        ]
      },
      {
        name: 'Execution',
        description: 'Deal 200% ATK damage to lowest HP hero',
        cooldown: 4
      }
    ]
  },
  fort_specter: {
    id: 'fort_specter',
    name: 'Fort Specter',
    stats: { hp: 130, atk: 45, def: 18, spd: 16 },
    skill: {
      name: 'Haunting Wail',
      description: 'Deal 100% ATK damage to all heroes and reduce SPD by 20% for 2 turns',
      cooldown: 4,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 20 }
      ]
    }
  },

  // Ancient Catacombs enemies (undead tombs)
  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    stats: { hp: 120, atk: 44, def: 24, spd: 11 },
    skill: {
      name: 'Bone Cleave',
      description: 'Deal 150% ATK damage',
      cooldown: 3
    }
  },
  mummy: {
    id: 'mummy',
    name: 'Mummy',
    stats: { hp: 180, atk: 40, def: 30, spd: 6 },
    skill: {
      name: 'Cursed Wrappings',
      description: 'Deal 120% ATK damage and reduce target ATK and DEF by 20% for 3 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 3, value: 20 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 3, value: 20 }
      ]
    }
  },
  tomb_guardian: {
    id: 'tomb_guardian',
    name: 'Tomb Guardian',
    stats: { hp: 240, atk: 45, def: 38, spd: 7 },
    skill: {
      name: 'Ancient Defense',
      description: 'Deal 130% ATK damage and increase all allies DEF by 25% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  tomb_wraith: {
    id: 'tomb_wraith',
    name: 'Tomb Wraith',
    stats: { hp: 140, atk: 52, def: 16, spd: 18 },
    skill: {
      name: 'Soul Drain',
      description: 'Deal 140% ATK damage and heal self for 50% of damage dealt',
      cooldown: 3,
      lifesteal: 50
    }
  },
  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    stats: { hp: 130, atk: 48, def: 18, spd: 14 },
    skill: {
      name: 'Dark Ritual',
      description: 'Heal all allies for 25% of max HP and increase ATK by 25% for 2 turns',
      cooldown: 5,
      noDamage: true,
      healAllAllies: 25,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  lich_king: {
    id: 'lich_king',
    name: 'Lich King',
    stats: { hp: 700, atk: 60, def: 40, spd: 12 },
    imageSize: 160,
    skills: [
      {
        name: 'Death Nova',
        description: 'Deal 120% ATK damage to all heroes and deal 25 damage at end of turn for 2 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.POISON, target: 'all_heroes', duration: 2, value: 25 }
        ]
      },
      {
        name: 'Soul Harvest',
        description: 'Deal 180% ATK damage and heal self for 100% of damage dealt',
        cooldown: 5,
        lifesteal: 100
      }
    ]
  },

  // Underground Morass enemies (underground swamp)
  cave_leech: {
    id: 'cave_leech',
    name: 'Cave Leech',
    stats: { hp: 90, atk: 38, def: 14, spd: 15 },
    skill: {
      name: 'Blood Drain',
      description: 'Deal 130% ATK damage and heal self for 75% of damage dealt',
      cooldown: 3,
      lifesteal: 75
    }
  },
  fungal_zombie: {
    id: 'fungal_zombie',
    name: 'Fungal Zombie',
    stats: { hp: 160, atk: 42, def: 20, spd: 5 },
    skill: {
      name: 'Spore Cloud',
      description: 'Deal 100% ATK damage to all heroes and deal 12 damage at end of turn for 3 turns',
      cooldown: 5,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.POISON, target: 'all_heroes', duration: 3, value: 12 }
      ]
    }
  },
  gloom_stalker: {
    id: 'gloom_stalker',
    name: 'Gloom Stalker',
    stats: { hp: 110, atk: 50, def: 16, spd: 22 },
    skill: {
      name: 'Shadow Pounce',
      description: 'Deal 170% ATK damage to lowest HP hero',
      cooldown: 3
    }
  },
  blind_horror: {
    id: 'blind_horror',
    name: 'Blind Horror',
    stats: { hp: 220, atk: 55, def: 28, spd: 8 },
    skill: {
      name: 'Tremor Sense',
      description: 'Deal 140% ATK damage and reduce target SPD by 50% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 50 }
      ]
    }
  },
  swamp_hag: {
    id: 'swamp_hag',
    name: 'Swamp Hag',
    stats: { hp: 150, atk: 48, def: 20, spd: 12 },
    skill: {
      name: 'Bog Curse',
      description: 'Deal 120% ATK damage to all heroes and reduce ATK by 20% for 2 turns',
      cooldown: 4,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.ATK_DOWN, target: 'all_heroes', duration: 2, value: 20 }
      ]
    }
  },

  // Gate to Aquaria enemies (underwater realm)
  merfolk_warrior: {
    id: 'merfolk_warrior',
    name: 'Merfolk Warrior',
    stats: { hp: 140, atk: 48, def: 24, spd: 14 },
    skill: {
      name: 'Trident Thrust',
      description: 'Deal 160% ATK damage',
      cooldown: 3
    }
  },
  merfolk_mage: {
    id: 'merfolk_mage',
    name: 'Merfolk Mage',
    stats: { hp: 120, atk: 52, def: 18, spd: 16 },
    skill: {
      name: 'Tidal Wave',
      description: 'Deal 110% ATK damage to all heroes and reduce SPD by 25% for 2 turns',
      cooldown: 4,
      targetType: 'all_heroes',
      effects: [
        { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 25 }
      ]
    }
  },
  coral_golem: {
    id: 'coral_golem',
    name: 'Coral Golem',
    stats: { hp: 260, atk: 45, def: 40, spd: 6 },
    skill: {
      name: 'Reef Crush',
      description: 'Deal 150% ATK damage and reduce target DEF by 30% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 30 }
      ]
    }
  },
  abyssal_lurker: {
    id: 'abyssal_lurker',
    name: 'Abyssal Lurker',
    stats: { hp: 170, atk: 55, def: 22, spd: 13 },
    skill: {
      name: 'Deep Terror',
      description: 'Deal 150% ATK damage and reduce target ATK by 40% for 2 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 40 }
      ]
    }
  },
  sea_serpent: {
    id: 'sea_serpent',
    name: 'Sea Serpent',
    stats: { hp: 200, atk: 50, def: 26, spd: 15 },
    skill: {
      name: 'Crushing Coil',
      description: 'Deal 160% ATK damage and stun target for 1 turn',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  tide_priest: {
    id: 'tide_priest',
    name: 'Tide Priest',
    stats: { hp: 140, atk: 46, def: 20, spd: 14 },
    skill: {
      name: 'Ocean\'s Blessing',
      description: 'Heal all allies for 20% of max HP and increase DEF by 25% for 2 turns',
      cooldown: 4,
      noDamage: true,
      healAllAllies: 20,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 25 }
      ]
    }
  },
  kraken: {
    id: 'kraken',
    name: 'Kraken',
    stats: { hp: 800, atk: 62, def: 42, spd: 10 },
    imageSize: 180,
    skills: [
      {
        name: 'Tentacle Swarm',
        description: 'Deal 90% ATK damage to all heroes and reduce SPD by 30% for 2 turns',
        cooldown: 4,
        targetType: 'all_heroes',
        effects: [
          { type: EffectType.SPD_DOWN, target: 'all_heroes', duration: 2, value: 30 }
        ]
      },
      {
        name: 'Crushing Depths',
        description: 'Deal 220% ATK damage to one hero and stun for 1 turn',
        cooldown: 5,
        effects: [
          { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
        ]
      }
    ]
  },
  // Coral Depths enemies (Aquarias)
  cave_crab: {
    id: 'cave_crab',
    name: 'Cave Crab',
    stats: { hp: 280, atk: 42, def: 45, spd: 5 },
    skill: {
      name: 'Shell Slam',
      description: 'Deal 140% ATK damage and stun target for 1 turn',
      cooldown: 4,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  moray_eel: {
    id: 'moray_eel',
    name: 'Moray Eel',
    stats: { hp: 160, atk: 58, def: 16, spd: 20 },
    skill: {
      name: 'Lunge',
      description: 'Deal 170% ATK damage to one target',
      cooldown: 3
    }
  },
  barnacle_cluster: {
    id: 'barnacle_cluster',
    name: 'Barnacle Cluster',
    stats: { hp: 140, atk: 40, def: 30, spd: 8 },
    skill: {
      name: 'Encrust',
      description: 'Reduce all heroes DEF by 35% for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'all_heroes', duration: 2, value: 35 }
      ]
    }
  },
  reef_warden: {
    id: 'reef_warden',
    name: 'Reef Warden',
    stats: { hp: 200, atk: 44, def: 28, spd: 12 },
    skill: {
      name: 'Coral Armor',
      description: 'Increase one ally DEF by 40% for 2 turns',
      cooldown: 4,
      noDamage: true,
      effects: [
        { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 40 }
      ]
    }
  }
}

export function getEnemyTemplate(templateId) {
  return enemyTemplates[templateId] || null
}

export function getAllEnemyTemplates() {
  return Object.values(enemyTemplates)
}

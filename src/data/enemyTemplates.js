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
      description: 'Deal 140% ATK damage',
      cooldown: 2
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
    stats: { hp: 180, atk: 28, def: 18, spd: 10 },
    skill: {
      name: 'War Cry',
      description: 'Deal 100% ATK damage to all heroes and increase own ATK by 25% for 3 turns',
      cooldown: 4,
      effects: [
        { type: EffectType.ATK_UP, target: 'self', duration: 3, value: 25 }
      ]
    }
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
  }
}

export function getEnemyTemplate(templateId) {
  return enemyTemplates[templateId] || null
}

export function getAllEnemyTemplates() {
  return Object.values(enemyTemplates)
}

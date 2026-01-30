import { EffectType } from '../statusEffects.js'

export const enemies = {
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
  }
}

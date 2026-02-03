import { EffectType } from '../statusEffects.js'

export const enemies = {
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
      targetType: 'all_heroes',
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
      cooldown: 6,
      targetType: 'all_heroes'
    }
  }
}

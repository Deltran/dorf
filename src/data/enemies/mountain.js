import { EffectType } from '../statusEffects.js'

export const enemies = {
  harpy: {
    id: 'harpy',
    name: 'Harpy',
    stats: { hp: 80, atk: 28, def: 12, spd: 18 },
    skill: {
      name: 'Diving Talon',
      description: 'Deal 150% ATK damage, +50% if target HP is below 50%. Gain 40% Evasion for 1 turn.',
      cooldown: 3,
      effects: [
        { type: EffectType.EVASION, target: 'self', duration: 1, value: 40 }
      ]
    }
  },
  frost_elemental: {
    id: 'frost_elemental',
    name: 'Frost Elemental',
    stats: { hp: 100, atk: 35, def: 25, spd: 10 },
    skill: {
      name: 'Glacial Grip',
      description: 'Deal 130% ATK damage. Reduce SPD by 30% and DEF by 20% for 2 turns.',
      cooldown: 4,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'hero', duration: 2, value: 30 },
        { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 20 }
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
      name: 'Landslide',
      description: 'Deal 200% ATK damage and stun target for 1 turn.',
      cooldown: 5,
      effects: [
        { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
      ]
    }
  },
  harpy_chick: {
    id: 'harpy_chick',
    name: 'Harpy Chick',
    stats: { hp: 30, atk: 15, def: 3, spd: 16 }
  },
  nesting_roc: {
    id: 'nesting_roc',
    name: 'Nesting Roc',
    stats: { hp: 120, atk: 15, def: 20, spd: 8 },
    skill: {
      name: 'Brood Call',
      description: 'Summon a Harpy Chick and gain +20% DEF for 2 turns.',
      cooldown: 3,
      noDamage: true,
      summon: { templateId: 'harpy_chick', count: 1 },
      effects: [
        { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 20 }
      ],
      fallbackSkill: {
        name: 'Protective Roost',
        description: 'Hunker down. Gain +20% DEF for 2 turns.',
        noDamage: true,
        effects: [
          { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 20 }
        ]
      }
    }
  }
}

import { EffectType } from '../../statusEffects.js'

export const bones_mccready = {
  id: 'bones_mccready',
  name: 'Bones McCready',
  rarity: 3,
  classId: 'druid',
  baseStats: { hp: 85, atk: 22, def: 22, spd: 11, mp: 60 },
  skills: [
    {
      name: 'Roll the Bones',
      description: 'Heal ally. Roll 1d6: (1-2) 50%, (3-4) 100%, (5-6) 150% ATK + Regen',
      skillUnlockLevel: 1,
      mpCost: 12,
      targetType: 'ally',
      noDamage: true,
      isDiceHeal: true,
      diceCount: 1,
      diceSides: 6,
      diceTiers: [
        { min: 1, max: 2, healPercent: 50 },
        { min: 3, max: 4, healPercent: 100 },
        { min: 5, max: 6, healPercent: 150, applyRegen: true }
      ]
    },
    {
      name: 'Snake Eyes',
      description: 'Poison enemy (35%, 2 turns). Roll 2d6: doubles = +2 turn duration',
      skillUnlockLevel: 1,
      mpCost: 14,
      targetType: 'enemy',
      noDamage: true,
      isDiceEffect: true,
      diceCount: 2,
      diceSides: 6,
      effects: [
        { type: EffectType.POISON, target: 'enemy', duration: 2, value: 35 }
      ],
      onDoubles: { extendDuration: 2 }
    },
    {
      name: 'Fortune Teller',
      description: 'For 3 turns, roll 1d6 at turn start: (1-2) +10% DEF, (3-4) +10% ATK, (5-6) +10% SPD',
      skillUnlockLevel: 3,
      mpCost: 18,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: 'fortune_teller', target: 'self', duration: 3 }
      ]
    },
    {
      name: 'Loaded Bones',
      description: 'Heal ally 80% ATK. Next "Roll the Bones" on this ally guarantees roll of 6',
      skillUnlockLevel: 6,
      mpCost: 16,
      targetType: 'ally',
      noDamage: true,
      healPercent: 80,
      effects: [
        { type: EffectType.LOADED_DICE, target: 'ally', duration: 99 }
      ]
    },
    {
      name: 'Bones Never Lie',
      description: 'Roll 3d6, heal all allies. (3-8) 40%, (9-14) 80%, (15-18) 120% ATK + Regen',
      skillUnlockLevel: 12,
      mpCost: 28,
      targetType: 'all_allies',
      noDamage: true,
      isDiceHeal: true,
      diceCount: 3,
      diceSides: 6,
      diceTiers: [
        { min: 3, max: 8, healPercent: 40 },
        { min: 9, max: 14, healPercent: 80 },
        { min: 15, max: 18, healPercent: 120, applyRegen: true }
      ]
    }
  ]
}

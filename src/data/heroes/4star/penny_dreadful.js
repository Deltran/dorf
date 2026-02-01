import { EffectType } from '../../statusEffects.js'

export const penny_dreadful = {
  id: 'penny_dreadful',
  name: 'Penny Dreadful',
  rarity: 4,
  classId: 'alchemist',
  baseStats: { hp: 78, atk: 36, def: 16, spd: 15, mp: 65 },

  skills: [
    {
      name: 'A Spot of Tea',
      description: 'Deal 80% ATK damage. Apply Poison for 2 turns. Damage scales with Volatility.',
      skillUnlockLevel: 1,
      essenceCost: 12,
      targetType: 'enemy',
      damagePercent: 80,
      usesVolatility: true,
      effects: [
        { type: EffectType.POISON, target: 'enemy', duration: 2, atkPercent: 25 }
      ]
    },
    {
      name: 'The Good Silver',
      description: 'Deal 70% ATK damage. Apply SPD Down (-20%) and ATK Down (-15%) for 2 turns.',
      skillUnlockLevel: 1,
      essenceCost: 15,
      targetType: 'enemy',
      damagePercent: 70,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 20 },
        { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Poison Cocktail',
      description: 'Deal 100% ATK damage. At 2+ debuffs: Mark target. At 3+: stronger Mark. At 4+: refresh all debuffs.',
      skillUnlockLevel: 3,
      essenceCost: 20,
      targetType: 'enemy',
      damagePercent: 100,
      debuffThresholds: {
        at2: { type: EffectType.MARKED, duration: 2, value: 25 },
        at3: { type: EffectType.MARKED, duration: 2, value: 35 },
        at4: { refreshAllDebuffs: 1 }
      }
    },
    {
      name: 'Spring Cleaning',
      description: 'Cleanse 1 debuff from all allies. If a debuff was cleansed, grant DEF Up (+15%) for 2 turns.',
      skillUnlockLevel: 6,
      essenceCost: 18,
      targetType: 'all_allies',
      noDamage: true,
      cleanseDebuffs: 1,
      ifCleansed: { type: EffectType.DEF_UP, duration: 2, value: 15 }
    },
    {
      name: 'Tidy Up',
      description: 'Deal 70% ATK damage to all enemies. +20% damage per debuff on each target (max +100%).',
      skillUnlockLevel: 12,
      essenceCost: 28,
      targetType: 'all_enemies',
      damagePercent: 70,
      bonusDamagePerDebuff: 20,
      maxBonusDamage: 100
    }
  ]
}

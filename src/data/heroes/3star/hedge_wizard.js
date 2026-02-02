import { EffectType } from '../../statusEffects.js'

export const hedge_wizard = {
  id: 'hedge_wizard',
  name: 'Knarly Zeek',
  rarity: 3,
  classId: 'mage',
  baseStats: { hp: 70, atk: 35, def: 15, spd: 12, mp: 60 },
  skills: [
    {
      name: 'Crumble Curse',
      description: 'Deal 100% ATK damage and reduce enemy DEF by 10% for 4 turns',
      mpCost: 14,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      effects: [
        {
          type: EffectType.DEF_DOWN,
          target: 'enemy',
          duration: 4,
          value: 10
        }
      ]
    },
    {
      name: 'Prickly Protection',
      description: 'Gain a barrier that deals 50% ATK damage to attackers for 4 turns',
      mpCost: 16,
      skillUnlockLevel: 1,
      targetType: 'self',
      noDamage: true,
      effects: [
        {
          type: EffectType.THORNS,
          target: 'self',
          duration: 4,
          value: 50
        }
      ]
    },
    {
      name: 'Fumblefingers',
      description: '90% ATK damage. 50% chance to stun for 1 turn.',
      mpCost: 12,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damageMultiplier: 0.9,
      effects: [
        {
          type: EffectType.STUN,
          target: 'enemy',
          duration: 1,
          chance: 50
        }
      ]
    },
    {
      name: 'The Ickies',
      description: 'Apply -3 SPD and Poison (20% ATK) for 3 turns',
      mpCost: 14,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.SPD_DOWN,
          target: 'enemy',
          duration: 3,
          value: 3
        },
        {
          type: EffectType.POISON,
          target: 'enemy',
          duration: 3,
          atkPercent: 20
        }
      ]
    },
    {
      name: "Knarly's Special",
      description: 'Deal 120% ATK + 30% per debuff on target. Removes all debuffs.',
      mpCost: 22,
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damageMultiplier: 1.2,
      bonusDamagePerDebuff: 30,
      consumeDebuffs: true
    }
  ],
  epithet: 'The Thorn Conjurer',
  introQuote: 'Proper wizards use wands. I use what works.'
}

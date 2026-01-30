import { EffectType } from '../../statusEffects.js'

export const apprentice_mage = {
  id: 'apprentice_mage',
  name: 'Calisus',
  rarity: 2,
  classId: 'mage',
  baseStats: { hp: 55, atk: 28, def: 10, spd: 11, mp: 50 },
  skills: [
    {
      name: 'Spark',
      description: 'Deal 120% ATK damage to one enemy',
      mpCost: 10,
      skillUnlockLevel: 1,
      targetType: 'enemy'
    },
    {
      name: 'Chain Lightning',
      description: 'Deal 70% ATK damage to target, then bounce to up to 2 additional enemies for 50% ATK each',
      mpCost: 16,
      skillUnlockLevel: 3,
      targetType: 'enemy',
      chainBounce: {
        maxBounces: 2,
        bounceMultiplier: 50
      }
    },
    {
      name: 'Jolt',
      description: 'Deal 70% ATK damage and stun the target for 1 turn',
      mpCost: 18,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      effects: [
        { type: EffectType.STUN, target: 'enemy', duration: 1 }
      ]
    },
    {
      name: 'Tempest',
      description: 'Deal 130% ATK damage to all enemies',
      mpCost: 26,
      skillUnlockLevel: 12,
      targetType: 'all_enemies'
    }
  ]
}

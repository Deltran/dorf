import { EffectType } from '../../statusEffects.js'

export const farm_hand = {
  id: 'farm_hand',
  name: 'Darl',
  rarity: 1,
  classId: 'berserker',
  baseStats: { hp: 70, atk: 25, def: 12, spd: 8 },
  skills: [
    {
      name: 'Pitchfork Jabs',
      description: 'Deal 40% ATK damage to three random targets',
      skillUnlockLevel: 1,
      rageCost: 25,
      targetType: 'random_enemies',
      hits: 3
    },
    {
      name: 'Twine and Prayer',
      description: 'Heal 10% HP and gain +10% ATK for 2 turns',
      skillUnlockLevel: 3,
      rageCost: 10,
      targetType: 'self',
      noDamage: true,
      selfHealPercent: 10,
      effects: [
        { type: EffectType.ATK_UP, target: 'self', duration: 2, value: 10 }
      ]
    },
    {
      name: 'Toad Strangler',
      description: 'Deal 4 attacks of 30% ATK damage to one enemy',
      skillUnlockLevel: 6,
      rageCost: 35,
      targetType: 'enemy',
      multiHit: 4
    },
    {
      name: 'Burndown',
      description: 'Deal 110% ATK damage to all enemies and poison them for 10% damage for 1 turn',
      skillUnlockLevel: 12,
      rageCost: 65,
      targetType: 'all_enemies',
      effects: [
        { type: EffectType.POISON, target: 'enemy', duration: 1, atkPercent: 10 }
      ]
    }
  ]
}

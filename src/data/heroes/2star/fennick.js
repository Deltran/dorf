import { EffectType } from '../../statusEffects.js'

export const fennick = {
  id: 'fennick',
  name: 'Fennick',
  rarity: 2,
  classId: 'ranger',
  role: 'tank',
  baseStats: { hp: 80, atk: 16, def: 8, spd: 16, mp: 30 },
  skills: [
    {
      name: 'Come and Get Me',
      description: 'Taunt all enemies for 2 turns and gain 30% evasion for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: 2 },
        { type: EffectType.EVASION, target: 'self', duration: 2, value: 30 }
      ]
    },
    {
      name: 'Counter-shot',
      description: 'Deal 90% ATK damage to an enemy. Gain thorns for 2 turns, reflecting 30% damage to attackers.',
      skillUnlockLevel: 3,
      damagePercent: 90,
      targetType: 'enemy',
      effects: [
        { type: EffectType.THORNS, target: 'self', duration: 2, value: 30 }
      ]
    },
    {
      name: "Fox's Cunning",
      description: 'Gain 20% evasion and +3 SPD for 3 turns. Evasion stacks with other sources.',
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.EVASION, target: 'self', duration: 3, value: 20 },
        { type: EffectType.SPD_UP, target: 'self', duration: 3, value: 3 }
      ]
    },
    {
      name: 'Pin Down',
      description: 'Deal 100% ATK damage to an enemy and stun them for 1 turn.',
      skillUnlockLevel: 12,
      damagePercent: 100,
      targetType: 'enemy',
      effects: [
        { type: EffectType.STUN, target: 'enemy', duration: 1 }
      ]
    }
  ]
}

import { EffectType } from '../../statusEffects.js'

export const street_busker = {
  id: 'street_busker',
  name: 'Penny Whistler',
  rarity: 1,
  classId: 'bard',
  baseStats: { hp: 65, atk: 15, def: 18, spd: 14, mp: 55 },
  finale: {
    name: 'Discordant Shriek',
    description: 'A piercing wave of sound that damages and weakens all enemies.',
    target: 'all_enemies',
    effects: [
      { type: 'damage', damagePercent: 80 },
      { type: EffectType.ATK_DOWN, duration: 2, value: 15 }
    ]
  },
  skills: [
    {
      name: 'Jarring Whistle',
      description: 'A piercing off-key note that makes enemies flinch',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'enemy', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Distracting Jingle',
      description: 'An annoying tune that throws off enemy timing',
      skillUnlockLevel: 6,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Street Racket',
      description: 'A cacophony of noise that hits harder against weakened foes. 90% ATK + 25% per debuff.',
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damageMultiplier: 0.9,
      bonusDamagePerDebuff: 25
    },
    {
      name: 'Ear-Splitting Crescendo',
      description: "A piercing note that's unbearable to those already off-balance",
      skillUnlockLevel: 12,
      targetType: 'enemy',
      noDamage: true,
      stunIfDebuffed: true,
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 20 }
      ]
    }
  ],
  epithet: 'The Off-Key Nuisance',
  introQuote: "They don't pay me to stop. They pay me to leave."
}

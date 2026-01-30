import { EffectType } from '../../statusEffects.js'

export const militia_soldier = {
  id: 'militia_soldier',
  name: 'Sorju, Gate Guard',
  rarity: 2,
  classId: 'knight',
  baseStats: { hp: 90, atk: 18, def: 28, spd: 13 },
  skills: [
    {
      name: 'High Initiative',
      description: 'Deal 70% ATK damage and buff own SPD by 2 for 2 turns. Scales with Valor.',
      valorRequired: 0,
      targetType: 'enemy',
      skillUnlockLevel: 1,
      damage: { base: 70, at50: 85, at100: 100 },
      effects: [
        { type: EffectType.SPD_UP, target: 'self', duration: 2, value: { base: 2, at25: 3, at75: 4, at100: 5 } }
      ]
    },
    {
      name: 'Blitz Strike',
      description: 'Deal 100% ATK damage to all enemies that have not acted yet this round. Scales with Valor.',
      valorRequired: 25,
      targetType: 'all_enemies',
      skillUnlockLevel: 3,
      targetFilter: 'not_acted',
      damage: { base: 100, at50: 105, at75: 110, at100: 115 }
    },
    {
      name: 'Pinning Advance',
      description: 'Deal 100% ATK damage and reduce target SPD by 5 for 2 turns. Scales with Valor.',
      valorRequired: 50,
      targetType: 'enemy',
      skillUnlockLevel: 6,
      damage: { base: 100, at75: 115 },
      effects: [
        { type: EffectType.SPD_DOWN, target: 'enemy', duration: { base: 2, at100: 3 }, value: { base: 5, at100: 6 } }
      ]
    }
  ]
}

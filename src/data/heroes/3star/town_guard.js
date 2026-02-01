import { EffectType } from '../../statusEffects.js'

export const town_guard = {
  id: 'town_guard',
  name: 'Kensin',
  rarity: 3,
  classId: 'knight',
  epithet: 'Keeper of the Gate',
  introQuote: 'Halt! State your business.',
  baseStats: { hp: 110, atk: 22, def: 35, spd: 8 },
  skills: [
    {
      name: 'Stand and Fight',
      description: 'Taunt all enemies for 2 turns. At 50 Valor: 3 turns. At 75 Valor: also gain 15% damage reduction.',
      valorRequired: 25,
      targetType: 'self',
      skillUnlockLevel: 1,
      noDamage: true,
      defensive: true,
      effects: [
        { type: EffectType.TAUNT, target: 'self', duration: { base: 2, at50: 3 } },
        { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: { base: 2, at50: 3 }, value: 15, valorThreshold: 75 }
      ]
    },
    {
      name: 'Retribution',
      description: 'Deal damage to one enemy. Damage scales with Valor: 100% ATK base, up to 180% at max Valor.',
      valorRequired: 0,
      targetType: 'enemy',
      skillUnlockLevel: 1,
      damage: { base: 100, at25: 120, at50: 140, at75: 160, at100: 180 }
    },
    {
      name: 'Reinforce',
      description: 'Remove ATK/DEF debuffs from ally and heal 10% of your DEF as HP. At 75 Valor: 15% heal. At 100 Valor: also removes SPD debuffs.',
      valorRequired: 50,
      targetType: 'ally',
      skillUnlockLevel: 3,
      noDamage: true,
      defensive: true,
      cleanse: { types: ['atk', 'def'], at100Types: ['atk', 'def', 'spd'] },
      healFromStat: { stat: 'def', percent: { base: 10, at75: 15 } }
    },
    {
      name: 'Riposte',
      description: 'Gain Riposte for 2 turns: counter-attack for 80% ATK when hit. No DEF requirement. At 50 Valor: 100% ATK. At 75 Valor: 3 turns.',
      valorRequired: 0,
      targetType: 'self',
      skillUnlockLevel: 6,
      noDamage: true,
      defensive: true,
      effects: [
        { type: EffectType.RIPOSTE, target: 'self', duration: { base: 2, at75: 3 }, value: { base: 80, at50: 100 }, noDefCheck: true }
      ]
    },
    {
      name: 'Judgment of Steel',
      description: 'Consume ALL Valor. Deal 50% ATK + 2% per Valor consumed to one enemy. Apply 20% DEF debuff for 2 turns.',
      valorCost: 'all',
      valorRequired: 50,
      targetType: 'enemy',
      skillUnlockLevel: 12,
      baseDamage: 50,
      damagePerValor: 2,
      effects: [
        { type: EffectType.DEF_DOWN, target: 'enemy', duration: 2, value: 20 }
      ]
    }
  ]
}

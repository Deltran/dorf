import { EffectType } from '../../statusEffects.js'

export const chroma = {
  id: 'chroma',
  name: 'Chroma, the Curious',
  rarity: 4,
  classId: 'bard',
  baseStats: { hp: 82, atk: 22, def: 18, spd: 17, mp: 60 },
  finale: {
    name: 'The Dazzling',
    description: 'Apply Blind (30% miss chance) to all enemies for 1 turn.',
    target: 'all_enemies',
    effects: [
      { type: EffectType.BLIND, target: 'all_enemies', duration: 1, value: 30 }
    ]
  },
  skills: [
    {
      name: 'Ink Flare',
      description: 'Apply Blind (50% miss chance) to an enemy for 1 turn.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.BLIND, target: 'enemy', duration: 1, value: 50 }
      ]
    },
    {
      name: 'Resonance',
      description: 'Restore 20 MP/Focus/Valor/Rage to an ally.',
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      resourceRestore: 20
    },
    {
      name: 'Fixation Pattern',
      description: 'Apply Taunt to an ally for 1 turn. Enemies must target them.',
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.TAUNT, target: 'ally', duration: 1 }
      ]
    },
    {
      name: 'Chromatic Fade',
      description: 'Gain 75% Evasion for 2 turns.',
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.EVASION, target: 'self', duration: 2, value: 75 }
      ]
    },
    {
      name: 'Refraction',
      description: 'Grant an ally 50% Evasion for 2 turns.',
      skillUnlockLevel: 12,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.EVASION, target: 'ally', duration: 2, value: 50 }
      ]
    }
  ]
}

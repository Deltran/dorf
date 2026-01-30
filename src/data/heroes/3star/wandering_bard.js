import { EffectType } from '../../statusEffects.js'

export const wandering_bard = {
  id: 'wandering_bard',
  name: 'Harl the Handsom',
  rarity: 3,
  classId: 'bard',
  baseStats: { hp: 75, atk: 20, def: 20, spd: 15, mp: 70 },
  finale: {
    name: 'Standing Ovation',
    description: 'Provide MP, Valor, or Focus to all allies and heal for 15% ATK.',
    target: 'all_allies',
    effects: [
      { type: 'resource_grant', focusGrant: true, valorAmount: 10, mpAmount: 15, verseAmount: 1 },
      { type: 'heal', value: 15 }
    ]
  },
  skills: [
    {
      name: 'Inspiring Song',
      description: 'Increase all allies ATK by 15% for 2 turns',
      targetType: 'all_allies',
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Mana Melody',
      description: 'Restore 10 MP to all allies',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      mpRestore: 10
    },
    {
      name: 'Soothing Serenade',
      description: 'Heal all allies for 20% of ATK',
      skillUnlockLevel: 3,
      targetType: 'all_allies',
      healFromStat: { stat: 'atk', percent: 20 }
    },
    {
      name: 'Ballad of Blackwall',
      description: 'Grant all allies DEF +20% for 2 turns',
      skillUnlockLevel: 6,
      targetType: 'all_allies',
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 20 }
      ]
    },
    {
      name: 'Ballad of Echoes',
      description: 'Extend all buff durations on all allies by 1 turn.',
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      noDamage: true,
      extendBuffs: 1
    }
  ]
}

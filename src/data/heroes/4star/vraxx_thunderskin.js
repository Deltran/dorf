import { EffectType } from '../../statusEffects.js'

export const vraxx_thunderskin = {
  id: 'vraxx_thunderskin',
  name: 'Vraxx the Thunderskin',
  rarity: 4,
  classId: 'bard',
  baseStats: { hp: 85, atk: 28, def: 24, spd: 18 },
  finale: {
    name: 'Thunderclap Crescendo',
    description: 'Consume excess Rage (above 50) from all Berserker allies. Deal 3% ATK damage per Rage consumed to all enemies. If no Rage consumed, grant all allies +25% ATK for 2 turns.',
    target: 'dynamic',
    effects: [
      {
        type: 'consume_excess_rage',
        rageThreshold: 50,
        damagePerRagePercent: 3,
        fallbackBuff: { type: 'atk_up', value: 25, duration: 2 }
      }
    ]
  },
  skills: [
    {
      name: 'Battle Cadence',
      description: 'Grant all allies +15% ATK for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 15 }
      ]
    },
    {
      name: 'Fury Beat',
      description: 'Grant 15 Rage to all Berserker allies. Non-Berserker allies gain +15% ATK for 2 turns instead.',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        {
          type: 'conditional_resource_or_buff',
          rageGrant: { classCondition: 'berserker', amount: 15 },
          fallbackBuff: { type: EffectType.ATK_UP, duration: 2, value: 15 }
        }
      ]
    },
    {
      name: 'Warsong Strike',
      description: 'Deal 80% ATK damage to one enemy.',
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damagePercent: 80
    },
    {
      name: 'Unbreaking Tempo',
      description: 'Grant all allies +20% DEF for 2 turns. Allies below 50% HP also gain Regen for 15% ATK per turn for 2 turns.',
      skillUnlockLevel: 6,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 20 },
        {
          type: EffectType.REGEN,
          target: 'all_allies',
          duration: 2,
          atkPercent: 15,
          condition: { hpBelow: 50 }
        }
      ]
    },
    {
      name: 'Drums of the Old Blood',
      description: 'All allies gain +25% ATK for 3 turns. Berserker allies also gain 25 Rage.',
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'all_allies', duration: 3, value: 25 },
        { type: 'rage_grant', classCondition: 'berserker', amount: 25 }
      ]
    }
  ]
}

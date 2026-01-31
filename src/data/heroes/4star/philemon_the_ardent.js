import { EffectType } from '../../statusEffects.js'

export const philemon_the_ardent = {
  id: 'philemon_the_ardent',
  name: 'Philemon the Ardent',
  rarity: 4,
  classId: 'knight',
  baseStats: { hp: 120, atk: 32, def: 38, spd: 12, mp: 100 },

  skills: [
    {
      name: 'Devoted Strike',
      description: 'Deal 100% ATK damage. Build 10 Valor (+5 bonus if guarding an ally).',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 100,
      valorGain: 10,
      valorGainBonusIfGuarding: 5
    },
    {
      name: "Heart's Shield",
      description: 'Guard an ally for 2 turns, redirecting all damage to Philemon. Gain +20% DEF while guarding.',
      skillUnlockLevel: 5,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      valorCost: 20,
      cooldown: 3,
      effects: [
        { type: EffectType.GUARDING, target: 'ally', duration: 2 }
      ],
      selfBuffWhileGuarding: {
        type: EffectType.DEF_UP,
        value: 20,
        duration: 2
      }
    },
    {
      name: 'Stolen Glance',
      description: 'Grant an ally +20% ATK and +10% SPD for 2 turns. Philemon gains +10 Valor.',
      skillUnlockLevel: 15,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      valorCost: 30,
      cooldown: 3,
      effects: [
        { type: EffectType.ATK_UP, target: 'ally', duration: 2, value: 20 },
        { type: EffectType.SPD_UP, target: 'ally', duration: 2, value: 10 }
      ],
      valorGainOnUse: 10
    },
    {
      name: 'Undying Devotion',
      description: 'Grant an ally Death Prevention for 3 turns. If triggered, Philemon takes 25% of his max HP as damage.',
      skillUnlockLevel: 25,
      targetType: 'ally',
      excludeSelf: true,
      noDamage: true,
      valorCost: 50,
      cooldown: 5,
      effects: [
        {
          type: EffectType.DEATH_PREVENTION,
          target: 'ally',
          duration: 3,
          damageToSourceOnTrigger: 25
        }
      ]
    },
    {
      name: 'Heartsworn Bulwark',
      description: "Grant all allies a shield equal to 15% of Philemon's max HP for 2 turns. While any ally has this shield, Philemon gains +25% DEF.",
      skillUnlockLevel: 40,
      targetType: 'all_allies',
      noDamage: true,
      valorCost: 70,
      cooldown: 4,
      effects: [
        {
          type: EffectType.SHIELD,
          target: 'all_allies',
          duration: 2,
          shieldPercentCasterMaxHp: 15
        }
      ],
      selfBuffWhileShieldsActive: {
        type: EffectType.DEF_UP,
        value: 25
      }
    }
  ]
}

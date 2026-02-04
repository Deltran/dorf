import { EffectType } from '../../statusEffects.js'

export const street_urchin = {
  id: 'street_urchin',
  name: 'Salia',
  rarity: 1,
  classId: 'ranger',
  baseStats: { hp: 50, atk: 23, def: 8, spd: 14, mp: 30 },
  skills: [
    {
      name: 'Quick Throw',
      description: 'Deal 80% ATK damage to one enemy. Get an extra turn.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 80,
      grantsExtraTurn: true
    },
    {
      name: 'Desperation',
      description: 'Deal 150% ATK damage to one enemy. Receive a -15% DEF debuff.',
      skillUnlockLevel: 3,
      targetType: 'enemy',
      damagePercent: 150,
      effects: [
        {
          type: EffectType.DEF_DOWN,
          target: 'self',
          duration: 2,
          value: 15
        }
      ]
    },
    {
      name: 'But Not Out',
      description: 'Gain a 20% ATK buff for 2 turns. If below 50% health, instead gain a 30% ATK buff for 3 turns.',
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      conditionalSelfBuff: {
        default: { type: 'atk_up', duration: 2, value: 20 },
        conditional: {
          condition: { stat: 'hpPercent', below: 50 },
          effect: { type: 'atk_up', duration: 3, value: 30 }
        }
      }
    },
    {
      name: 'In The Crowd',
      description: 'Deal 120% ATK damage to target enemy. Become untargetable until the end of next round.',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damagePercent: 120,
      effects: [
        {
          type: EffectType.UNTARGETABLE,
          target: 'self',
          duration: 2,
          value: 0
        }
      ]
    }
  ],
  epithet: 'Street Urchin',
  introQuote: 'Rather take what\'s mine than let you hurt me.',
  lore: 'Salia has survived on the streets since she was six, picking pockets and outrunning city guards twice her size. She doesn\'t fight fair because no one ever fought fair with her. Every coin she steals and every blow she lands is proof that the world can\'t keep her down.'
}

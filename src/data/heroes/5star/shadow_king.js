import { EffectType } from '../../statusEffects.js'

export const shadow_king = {
  id: 'shadow_king',
  name: 'The Shadow King',
  rarity: 5,
  classId: 'berserker',
  baseStats: { hp: 110, atk: 55, def: 25, spd: 18 },
  skills: [
    {
      name: 'Void Strike',
      description: 'Deal 200% ATK damage to one enemy, ignoring 50% of their DEF',
      rageCost: 50,
      targetType: 'enemy',
      skillUnlockLevel: 1,
      damagePercent: 200,
      ignoreDef: 50
    },
    {
      name: 'Mantle of Empty Hate',
      description: 'Raise own ATK by 30% for 3 turns. Poison self for 3 turns at 15% ATK.',
      rageCost: 30,
      targetType: 'self',
      skillUnlockLevel: 1,
      effects: [
        {
          type: EffectType.ATK_UP,
          target: 'self',
          duration: 3,
          value: 30
        },
        {
          type: EffectType.POISON,
          target: 'self',
          duration: 3,
          atkPercent: 15
        }
      ]
    },
    {
      name: 'Consume Shadow',
      description: 'Devour your own afflictions. Remove all debuffs. For each debuff removed, gain 15 rage and deal 40% ATK damage to a random enemy.',
      rageCost: 0,
      targetType: 'self',
      skillUnlockLevel: 3,
      useCondition: 'has_debuffs',
      consumeDebuffs: { ragePerDebuff: 15, damagePercentPerDebuff: 40 }
    },
    {
      name: 'Stares Back',
      description: 'Gain Thorns of 100% for 3 turns.',
      rageCost: 30,
      targetType: 'self',
      skillUnlockLevel: 6,
      effects: [
        {
          type: EffectType.THORNS,
          target: 'self',
          duration: 3,
          value: 100
        }
      ]
    },
    {
      name: 'Crushing Eternity',
      description: 'Consume ALL rage. Three attacks to one target equal to 50% ATK + 1% per rage consumed.',
      rageCost: 'all',
      targetType: 'enemy',
      skillUnlockLevel: 12,
      multiHit: 3,
      baseDamage: 50,
      damagePerRage: 1
    }
  ],
  leaderSkill: {
    name: 'Lord of Shadows',
    description: 'On round 1, all allies gain +25% ATK for 2 turns',
    effects: [
      {
        type: 'timed',
        triggerRound: 1,
        target: 'all_allies',
        apply: { effectType: 'atk_up', duration: 2, value: 25 }
      }
    ]
  },
  epithet: 'Avatar of the Endless Night',
  introQuote: 'Kneel before the darkness, mortal.',
  lore: 'Before the void claimed him, he was a king of a forgotten realm whose name no tongue can speak. He fed his own shadow to a dying god and was devoured in return \u2014 yet what crawled out of that abyss wore a crown and remembered everything.'
}

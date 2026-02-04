import { EffectType } from '../../statusEffects.js'

export const cacophon = {
  id: 'cacophon',
  name: 'Cacophon',
  rarity: 5,
  classId: 'bard',
  baseStats: { hp: 95, atk: 25, def: 22, spd: 16, mp: 60 },
  skills: [
    {
      name: 'Discordant Anthem',
      description: 'All allies take 5% max HP damage. Grant +25% ATK for 2 turns.',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      allyHpCostPercent: 5,
      noDamage: true,
      effects: [
        {
          type: EffectType.ATK_UP,
          target: 'all_allies',
          duration: 2,
          value: 25
        }
      ]
    },
    {
      name: 'Vicious Verse',
      description: 'Target ally takes 5% max HP damage. Grant Vicious for 2 turns: +30% damage vs debuffed enemies.',
      skillUnlockLevel: 1,
      targetType: 'ally',
      allyHpCostPercent: 5,
      noDamage: true,
      effects: [
        {
          type: EffectType.VICIOUS,
          target: 'ally',
          duration: 2,
          bonusDamagePercent: 30
        }
      ]
    },
    {
      name: 'Tempo Shatter',
      description: 'Target ally takes 6% max HP damage. Grant Shattered Tempo: act in top 2 of turn order next round.',
      skillUnlockLevel: 3,
      targetType: 'ally',
      allyHpCostPercent: 6,
      noDamage: true,
      effects: [
        {
          type: EffectType.SHATTERED_TEMPO,
          target: 'ally',
          duration: 1,
          turnOrderPriority: 2
        }
      ]
    },
    {
      name: 'Screaming Echo',
      description: 'Target ally takes 6% max HP damage. Grant Echoing: next single-hit skill hits all enemies at 50% effectiveness.',
      skillUnlockLevel: 6,
      targetType: 'ally',
      allyHpCostPercent: 6,
      noDamage: true,
      effects: [
        {
          type: EffectType.ECHOING,
          target: 'ally',
          duration: 1,
          splashPercent: 50
        }
      ]
    },
    {
      name: 'Warding Noise',
      description: 'Target ally takes 5% max HP damage. Grant shield equal to 25% of their max HP for 2 turns.',
      skillUnlockLevel: 12,
      targetType: 'ally',
      allyHpCostPercent: 5,
      noDamage: true,
      effects: [
        {
          type: EffectType.SHIELD,
          target: 'ally',
          duration: 2,
          shieldPercentMaxHp: 25
        }
      ]
    }
  ],
  leaderSkill: {
    name: 'Harmonic Bleeding',
    description: 'All allies deal +15% damage but receive -30% healing. (Counts as debuff — can be cleansed.)',
    effects: [
      {
        type: 'battle_start_debuff',
        target: 'all_allies',
        apply: { effectType: 'discordant_resonance', damageBonus: 15, healingPenalty: 30 }
      }
    ]
  },
  finale: {
    name: "Suffering's Crescendo",
    description: 'Convert accumulated ally suffering into power. +10% ATK/DEF to all allies, +1% per 150 HP lost (max +25% bonus).',
    target: 'all_allies',
    effects: [
      { type: 'suffering_crescendo', baseBuff: 10, hpPerPercent: 150, maxBonus: 25, duration: 3 }
    ]
  },
  epithet: 'Beautiful Disaster',
  introQuote: 'My genius is just misunderstood! Do you see it? DO YOU SEE IT?!',
  lore: 'Expelled from three conservatories and banned from performing in eleven cities, Cacophon discovered that true power lies not in harmony but in discord. His compositions shatter eardrums and morale alike \u2014 and he considers the screaming a standing ovation.'
}

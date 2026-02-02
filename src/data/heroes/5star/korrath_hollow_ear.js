import { EffectType } from '../../statusEffects.js'

export const korrath_hollow_ear = {
  id: 'korrath_hollow_ear',
  name: 'Korrath of the Hollow Ear',
  rarity: 5,
  classId: 'ranger',
  baseStats: { hp: 95, atk: 48, def: 20, spd: 22 },
  skills: [
    {
      name: 'Whisper Shot',
      description: 'Deal 110% ATK damage to one enemy. If target is below 30% HP, deal 150% instead.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 110,
      executeBonus: { threshold: 30, damagePercent: 150 }
    },
    {
      name: 'Spirit Mark',
      description: 'Mark an enemy for 3 turns. Marked enemies take 25% increased damage from all sources.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.MARKED,
          target: 'enemy',
          duration: 3,
          value: 25
        }
      ]
    },
    {
      name: 'Deathecho Volley',
      description: 'Deal 60% ATK damage to all enemies. Deal bonus damage equal to 15% per enemy that has died this battle (max 60%).',
      skillUnlockLevel: 3,
      targetType: 'all_enemies',
      damagePercent: 60,
      bonusDamagePerDeath: { perDeath: 15, maxBonus: 60 }
    },
    {
      name: 'Spirit Volley',
      description: 'Deal 50% ATK damage five times to random enemies. Marked enemies are targeted first.',
      skillUnlockLevel: 6,
      targetType: 'random_enemies',
      multiHit: 5,
      damagePercent: 50,
      prioritizeMarked: true
    },
    {
      name: 'The Last Drumbeat',
      description: 'Deal 200% ATK damage to one enemy, ignoring 75% DEF. If this kills the target, reset Korrath to the top of the turn order.',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damagePercent: 200,
      ignoreDef: 75,
      onKill: { resetTurnOrder: true }
    }
  ],
  leaderSkill: {
    name: 'Blood Remembers',
    description: 'On round 2, all allies gain +20% ATK and +15% SPD for 3 turns',
    effects: [
      {
        type: 'timed',
        triggerRound: 2,
        target: 'all_allies',
        apply: [
          { effectType: 'atk_up', duration: 3, value: 20 },
          { effectType: 'spd_up', duration: 3, value: 15 }
        ]
      }
    ]
  },
  epithet: 'Eyes of the Stormwind Peaks',
  introQuote: 'The wardrums of the spirits still lingers here.'
}

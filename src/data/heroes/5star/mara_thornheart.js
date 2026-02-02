import { EffectType } from '../../statusEffects.js'

export const mara_thornheart = {
  id: 'mara_thornheart',
  name: 'Mara Thornheart',
  rarity: 5,
  classId: 'berserker',
  baseStats: { hp: 105, atk: 52, def: 28, spd: 20 },
  skills: [
    {
      name: 'Thorn Lash',
      description: 'Deal 110% ATK damage. Heals based on Heartbreak lifesteal.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 110,
      rageGain: 10,
      usesHeartbreakLifesteal: true
    },
    {
      name: 'Bitter Embrace',
      description: 'Deal 150% ATK damage. Apply Bleeding for 3 turns. At 3+ Heartbreak stacks, also apply Weakened.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 150,
      rageCost: 25,
      effects: [
        {
          type: EffectType.POISON,
          target: 'enemy',
          duration: 3,
          atkPercent: 8,
          displayName: 'Bleeding'
        }
      ],
      conditionalEffects: {
        heartbreakThreshold: 3,
        effects: [
          { type: 'atk_down', target: 'enemy', duration: 2, value: 15, displayName: 'Weakened' }
        ]
      }
    },
    {
      name: 'Scorned',
      description: 'For 2 turns, reflect 30% of damage taken back to attackers. Gain +1 Heartbreak stack.',
      skillUnlockLevel: 3,
      targetType: 'self',
      noDamage: true,
      rageCost: 40,
      cooldown: 4,
      effects: [
        {
          type: EffectType.REFLECT,
          target: 'self',
          duration: 2,
          value: 30
        }
      ],
      grantHeartbreakStacks: 1
    },
    {
      name: 'Vengeance Garden',
      description: 'Deal 90% ATK damage to all enemies (+15% per Heartbreak stack). Heal for 5% of damage dealt.',
      skillUnlockLevel: 6,
      targetType: 'all_enemies',
      damagePercent: 90,
      damagePerHeartbreakStack: 15,
      rageCost: 60,
      cooldown: 3,
      healSelfPercent: 5
    },
    {
      name: "Love's Final Thorn",
      description: 'Deal 200% ATK damage (+25% per Heartbreak stack consumed). Consume all stacks. Take 10% max HP self-damage. If kill, gain 2 stacks.',
      skillUnlockLevel: 12,
      targetType: 'enemy',
      damagePercent: 200,
      damagePerHeartbreakStackConsumed: 25,
      consumeAllHeartbreakStacks: true,
      rageCost: 80,
      cooldown: 5,
      selfDamagePercentMaxHp: 10,
      onKillGrantHeartbreakStacks: 2
    }
  ],
  leaderSkill: {
    name: "What Doesn't Kill Us",
    description: 'All allies gain +5% lifesteal. When any ally first drops below 50% HP, they gain +15% ATK for 3 turns.',
    effects: [
      { type: 'passive_lifesteal', value: 5, target: 'all_allies' },
      {
        type: 'hp_threshold_triggered',
        threshold: 50,
        triggerOnce: true,
        apply: { effectType: 'atk_up', duration: 3, value: 15 }
      }
    ]
  },
  heartbreakPassive: {
    maxStacks: 5,
    atkPerStack: 4,
    lifestealPerStack: 3,
    triggers: { allyBelowHalfHp: true, allyDeath: true, heavyDamagePercent: 15 }
  },
  epithet: 'Seething Fury',
  introQuote: 'Scorned, exposed... but I will not die forgotten.'
}

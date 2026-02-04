import { EffectType } from '../../statusEffects.js'

export const rosara_the_unmoved = {
  id: 'rosara_the_unmoved',
  name: 'Rosara',
  rarity: 5,
  classId: 'knight',
  baseStats: { hp: 130, atk: 25, def: 38, spd: 8 },
  skills: [
    {
      name: 'Quiet Defiance',
      description: 'Passive: Basic attacks deal 80% damage. If attacked last round, deal 120% instead.',
      skillUnlockLevel: 1,
      isPassive: true,
      passiveType: 'basicAttackModifier'
    },
    {
      name: 'Seat of Power',
      description: 'Enter Bulwark stance: Taunt + DEF buff. Cannot use skills while in Bulwark. Scales with Valor.',
      skillUnlockLevel: 1,
      valorRequired: 0,
      targetType: 'self',
      noDamage: true,
      defensive: true,
      effects: [
        {
          type: EffectType.SEATED,
          target: 'self',
          duration: { base: 2, at50: 3 }
        },
        {
          type: EffectType.TAUNT,
          target: 'self',
          duration: { base: 2, at50: 3 }
        },
        {
          type: EffectType.DEF_UP,
          target: 'self',
          duration: { base: 2, at50: 3 },
          value: { base: 20, at25: 30, at75: 40, at100: 50 }
        }
      ]
    },
    {
      name: 'Weight of History',
      description: 'Mark an enemy. Marked enemies take increased damage from all sources. Scales with Valor.',
      skillUnlockLevel: 3,
      valorRequired: 25,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.MARKED,
          target: 'enemy',
          duration: { base: 2, at100: 3 },
          value: { base: 30, at50: 40, at75: 50 }
        }
      ]
    },
    {
      name: 'Unwavering',
      description: 'Passive: Immune to stun and sleep. When immunity triggers, gain 10 Valor.',
      skillUnlockLevel: 6,
      isPassive: true,
      passiveType: 'controlImmunity',
      immuneTo: [
        'stun',
        'sleep'
      ],
      onImmunityTrigger: { valorGain: 10 }
    },
    {
      name: 'Monument to Defiance',
      description: 'Reflect damage back to attackers. If Rosara dies during this, allies gain ATK/DEF buff. Consumes all Valor.',
      skillUnlockLevel: 12,
      valorRequired: 50,
      valorCost: 'all',
      targetType: 'self',
      noDamage: true,
      defensive: true,
      effects: [
        {
          type: EffectType.REFLECT,
          target: 'self',
          duration: { base: 1, at75: 2, at100: 3 },
          value: { base: 50, at75: 75, at100: 100 },
          cap: { base: 100, at75: 125, at100: 150 }
        }
      ],
      onDeathDuringEffect: {
        target: 'all_allies',
        effects: [
          {
            type: 'atk_up',
            duration: 3,
            value: { base: 20, at75: 25, at100: 30 }
          },
          {
            type: 'def_up',
            duration: 3,
            value: { base: 20, at75: 25, at100: 30 }
          }
        ]
      }
    }
  ],
  leaderSkill: {
    name: 'The First to Stand',
    description: 'At battle start, the lowest HP% ally gains Taunt and +25% DEF for turn 1. Rosara takes 30% of damage dealt to that ally during round 1.',
    effects: [
      {
        type: 'battle_start_protect_lowest',
        protectLowestHp: true,
        grantTaunt: true,
        grantDefUp: 25,
        duration: 1,
        damageSharePercent: 30,
        damageShareDuration: 1
      }
    ]
  },
  basicAttackModifier: { name: 'Quiet Defiance', description: 'Basic attacks deal 80% damage. If attacked last round, deal 120% instead.', skillUnlockLevel: 1, baseDamagePercent: 80, ifAttackedDamagePercent: 120 },
  epithet: 'Unmoved and Unbroken',
  introQuote: 'Resistance requires steadfast dedication and courage.',
  lore: 'Rosara has not left her throne in forty years. When invaders razed her kingdom, she refused to flee, and the earth itself rose to fortify her seat. Armies have broken against her silence. She does not fight \u2014 she simply does not move.'
}

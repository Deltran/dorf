import { EffectType } from '../../statusEffects.js'

export const matsuda = {
  id: 'matsuda',
  name: 'Matsuda the Masterless',
  rarity: 3,
  classId: 'berserker',
  baseStats: { hp: 95, atk: 38, def: 18, spd: 14 },

  passive: {
    name: 'Bushido',
    description: 'Gain 1% ATK per 2% HP missing (max +50%). When healed, gain Reluctance stack (-10% healing, max 5 stacks).',
    atkPerMissingHpPercent: 0.5, // 1% ATK per 2% missing = 0.5% per 1% missing
    maxAtkBonus: 50,
    onHealed: { type: EffectType.RELUCTANCE, stacks: 1 }
  },

  skills: [
    {
      name: 'Desperate Strike',
      description: 'Deal 90% ATK damage.',
      rageCost: 0,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 90
    },
    {
      name: 'Last Sake',
      description: 'Deal 80% ATK damage. Take 5% max HP recoil. Gain 15 Rage.',
      rageCost: 0,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 80,
      selfDamagePercentMaxHp: 5,
      rageGrant: 15
    },
    {
      name: "Ronin's Pride",
      description: 'Gain +25% ATK for 2 turns.',
      rageCost: 20,
      skillUnlockLevel: 3,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.ATK_UP, target: 'self', duration: 2, value: 25 }
      ]
    },
    {
      name: 'Death Before Dishonor',
      description: 'Below 50% HP: deal 180% ATK. Below 25% HP: deal 220% ATK and gain 30% Evasion for 2 turns.',
      rageCost: 40,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      conditionalDamage: {
        hpBelow50: 180,
        hpBelow25: 220
      },
      conditionalEvasion: {
        hpBelow25: 30
      }
    },
    {
      name: 'Glorious End',
      description: 'Deal 180% ATK to all enemies, +1% per 1% HP missing. On kill: heal 20% (bypasses Reluctance).',
      rageCost: 60,
      cooldown: 4,
      skillUnlockLevel: 12,
      targetType: 'all_enemies',
      damagePercent: 180,
      bonusDamagePerMissingHpPercent: 1,
      onKill: {
        healPercent: 20,
        bypassReluctance: true
      }
    }
  ]
}

import { EffectType } from '../../statusEffects.js'

export const yggra_world_root = {
  id: 'yggra_world_root',
  name: 'Yggra, the World Root',
  rarity: 5,
  classId: 'druid',
  epithet: 'The World Root',
  introQuote: 'All things return to the earth.',
  baseStats: { hp: 120, atk: 28, def: 35, spd: 10, mp: 75 },
  skills: [
    {
      name: 'Blessing of the World Root',
      description: 'Channel the life force of the world tree to restore all allies for 55% ATK',
      mpCost: 22,
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      healPercent: 55
    },
    {
      name: 'Grasping Roots',
      description: 'Poison an enemy for 50% ATK for 2 turns.',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.POISON, target: 'enemy', duration: 2, atkPercent: 50 }
      ]
    },
    {
      name: 'Bark Shield',
      description: 'Heal one ally for 50% ATK and grant 50% thorns for 3 turns',
      mpCost: 18,
      skillUnlockLevel: 3,
      targetType: 'ally',
      effects: [
        { type: EffectType.THORNS, target: 'ally', duration: 3, value: 50 }
      ]
    },
    {
      name: "Nature's Reclamation",
      description: 'Deal 150% ATK damage to one enemy; heal all allies for 25% of damage dealt',
      mpCost: 28,
      skillUnlockLevel: 6,
      targetType: 'enemy',
      damagePercent: 150,
      healAlliesPercent: 25
    },
    {
      name: "World Root's Embrace",
      description: 'Grant all allies death prevention for 2 turns; when triggered, heal saved ally for 50% ATK',
      mpCost: 35,
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      noDamage: true,
      effects: [
        { type: EffectType.DEATH_PREVENTION, target: 'all_allies', duration: 2, healOnTrigger: 50 }
      ]
    }
  ],
  leaderSkill: {
    name: 'Ancient Awakening',
    description: 'All allies regenerate 3% of their max HP at the start of each round',
    effects: [
      {
        type: 'passive_regen',
        target: 'all_allies',
        percentMaxHp: 3
      }
    ]
  }
}

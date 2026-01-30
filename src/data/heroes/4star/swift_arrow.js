import { EffectType } from '../../statusEffects.js'

export const swift_arrow = {
  id: 'swift_arrow',
  name: 'Swift Arrow',
  rarity: 4,
  classId: 'ranger',
  baseStats: { hp: 90, atk: 42, def: 22, spd: 20, mp: 55 },
  skills: [
    {
      name: 'Volley',
      description: 'Deal 70% ATK damage three times to random enemies.',
      skillUnlockLevel: 1,
      targetType: 'random_enemies',
      multiHit: 3
    },
    {
      name: "Hunter's Mark",
      description: 'Mark an enemy for 3 turns. Marked enemies take 20% increased damage from all sources.',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        { type: EffectType.MARKED, target: 'enemy', duration: 3, value: 20 }
      ]
    },
    {
      name: 'Barrage',
      description: 'Deal 60% ATK damage to all enemies.',
      skillUnlockLevel: 3,
      targetType: 'all_enemies'
    },
    {
      name: 'Piercing Shot',
      description: 'Deal 180% ATK damage to one enemy. Ignores 50% of target DEF.',
      skillUnlockLevel: 6,
      targetType: 'enemy',
      ignoreDef: 50
    },
    {
      name: 'Arrow Storm',
      description: 'Deal 50% ATK damage five times to random enemies. Marked enemies are targeted first.',
      skillUnlockLevel: 12,
      targetType: 'random_enemies',
      multiHit: 5,
      prioritizeMarked: true
    }
  ]
}

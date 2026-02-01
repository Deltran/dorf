import { EffectType } from '../../statusEffects.js'

export const grandmother_rot = {
  id: 'grandmother_rot',
  name: 'Grandmother Rot',
  rarity: 5,
  classId: 'druid',
  baseStats: { hp: 115, atk: 30, def: 32, spd: 11, mp: 80 },
  skills: [
    {
      name: 'Mulching Strike',
      description: 'Strike an enemy for 90% ATK and heal self for 20% of damage dealt.',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 90,
      healSelfPercent: 20
    },
    {
      name: 'Decomposition',
      description: 'Apply Decomposition to an ally for 3 turns. Each turn, grants a shield equal to 10% of your ATK. When effect expires or is removed, heal for 25% of your ATK.',
      mpCost: 20,
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        {
          type: EffectType.DECOMPOSITION,
          target: 'ally',
          duration: 3,
          shieldAtkPercent: 10,
          healAtkPercent: 25
        }
      ]
    },
    {
      name: 'Blight Bloom',
      description: 'Deal 60% ATK damage to all enemies. If any enemy is poisoned, deal 90% ATK instead.',
      mpCost: 25,
      skillUnlockLevel: 3,
      targetType: 'all_enemies',
      damagePercent: 60,
      ifPoisoned: { damagePercent: 90 }
    },
    {
      name: 'Fungal Network',
      description: 'Heal all allies for 15% ATK. If any ally is poisoned, heal for 35% ATK instead and remove all poison from allies.',
      mpCost: 32,
      skillUnlockLevel: 6,
      targetType: 'all_allies',
      healPercent: 15,
      ifPoisoned: { healPercent: 35, removePoisonFromAllies: true }
    },
    {
      name: 'The Great Composting',
      description: 'Consume all poison effects from enemies. Grant all allies Regen based on poison consumed. Baseline: 5% ATK for 2 turns.',
      mpCost: 45,
      skillUnlockLevel: 12,
      targetType: 'all_allies',
      noDamage: true,
      consumesPoisonFromEnemies: true,
      baselineRegen: { type: 'regen', target: 'all_allies', duration: 2, atkPercent: 5 }
    }
  ],
  leaderSkill: {
    name: 'The Circle Continues',
    description: "At the start of each round, if any enemy has poison, all allies heal for 5% of Grandmother Rot's ATK and extend all poison effects by 1 turn.",
    effects: [
      {
        type: 'passive_round_start',
        condition: { hasEffect: 'poison' },
        heal: { atkPercent: 5 },
        extendEffect: { type: 'poison', duration: 1 }
      }
    ]
  },
  epithet: 'The Compost Mother',
  introQuote: 'Come now, dear. Everything blooms eventually... even you.'
}

import { EffectType } from '../../statusEffects.js'

export const aurora_the_dawn = {
  id: 'aurora_the_dawn',
  name: 'Aurora the Dawn',
  rarity: 5,
  classId: 'paladin',
  baseStats: { hp: 140, atk: 28, def: 30, spd: 12, mp: 60 },
  skills: [
    {
      name: 'Holy Strike',
      description: 'Deal 120% ATK damage to one enemy. Heal self for 50% of damage dealt.',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 120,
      healSelfPercent: 50
    },
    {
      name: 'Guardian Link',
      description: 'Link to one ally for 3 turns. Aurora takes 40% of damage dealt to them.',
      mpCost: 20,
      skillUnlockLevel: 1,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.GUARDIAN_LINK, target: 'ally', duration: 3, redirectPercent: 40 }
      ]
    },
    {
      name: 'Consecrated Ground',
      description: 'Grant one ally 25% damage reduction for 3 turns.',
      mpCost: 18,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      effects: [
        { type: EffectType.DAMAGE_REDUCTION, target: 'ally', duration: 3, value: 25 }
      ]
    },
    {
      name: "Judgment's Echo",
      description: 'For 2 turns, store all damage Aurora takes. Then deal stored damage as holy damage to all enemies.',
      mpCost: 25,
      skillUnlockLevel: 6,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.DAMAGE_STORE, target: 'self', duration: 2 }
      ]
    },
    {
      name: 'Divine Sacrifice',
      description: 'For 2 turns, Aurora takes ALL damage meant for allies. Gain 50% damage reduction and heal 15% max HP per turn.',
      mpCost: 35,
      skillUnlockLevel: 12,
      targetType: 'self',
      noDamage: true,
      effects: [
        { type: EffectType.DIVINE_SACRIFICE, target: 'self', duration: 2, damageReduction: 50, healPerTurn: 15 }
      ]
    }
  ],
  leaderSkill: {
    name: "Dawn's Protection",
    description: 'Non-knight allies gain +15% DEF',
    effects: [
      {
        type: 'passive',
        stat: 'def',
        value: 15,
        condition: { classId: { not: 'knight' } }
      }
    ]
  }
}

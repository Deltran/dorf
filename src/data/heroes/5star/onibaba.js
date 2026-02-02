import { EffectType } from '../../statusEffects.js'

export const onibaba = {
  id: 'onibaba',
  name: 'Onibaba, the Mountain Crone',
  rarity: 5,
  classId: 'druid',
  baseStats: { hp: 115, atk: 30, def: 28, spd: 11, mp: 70 },
  skills: [
    {
      name: 'Soul Siphon',
      description: 'Deal 60% ATK damage to an enemy. Heal lowest HP ally for 100% of damage dealt.',
      mpCost: 0,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 60,
      healLowestAllyPercent: 100
    },
    {
      name: 'Grudge Hex',
      description: 'Poison an enemy for 40% ATK for 3 turns. Damage doubled if the enemy attacks Onibaba.',
      mpCost: 15,
      skillUnlockLevel: 1,
      targetType: 'enemy',
      noDamage: true,
      effects: [
        {
          type: EffectType.POISON,
          target: 'enemy',
          duration: 3,
          atkPercent: 40,
          doubleIfAttacksCaster: true
        }
      ]
    },
    {
      name: 'Spirit Ward',
      description: "Grant an ally a shield equal to 20% of Onibaba's max HP. Ally is immune to debuffs while shielded.",
      mpCost: 25,
      skillUnlockLevel: 3,
      targetType: 'ally',
      noDamage: true,
      effects: [
        {
          type: EffectType.SHIELD,
          target: 'ally',
          duration: 3,
          casterMaxHpPercent: 20
        },
        {
          type: EffectType.DEBUFF_IMMUNE,
          target: 'ally',
          duration: 3
        }
      ]
    },
    {
      name: 'Wailing Mask',
      description: 'Sacrifice 20% of current HP to deal that amount as true damage to all enemies (ignores DEF). Heal all allies for 50% of damage dealt.',
      mpCost: 32,
      skillUnlockLevel: 6,
      targetType: 'all_enemies',
      selfHpCostPercent: 20,
      dealHpCostAsDamage: true,
      ignoresDef: true,
      healAlliesPercent: 50
    },
    {
      name: "The Crone's Gift",
      description: 'Sacrifice 30% of current HP to grant an ally +25% ATK and 20% lifesteal for 3 turns.',
      mpCost: 40,
      skillUnlockLevel: 12,
      targetType: 'ally',
      noDamage: true,
      selfHpCostPercent: 30,
      effects: [
        {
          type: EffectType.ATK_UP,
          target: 'ally',
          duration: 3,
          value: 25
        }
      ],
      grantLifesteal: { value: 20, duration: 3 }
    }
  ],
  leaderSkill: {
    name: "Grandmother's Vigil",
    description: 'When an ally drops below 30% HP, Onibaba automatically uses Soul Siphon on the lowest HP enemy (once per ally per battle).',
    effects: [
      { type: 'ally_low_hp_auto_attack', hpThreshold: 30, autoSkill: 'Soul Siphon', oncePerAlly: true }
    ]
  },
  passive: { name: 'Hungry Ghost', description: 'When Onibaba deals damage, heal for 15% of damage dealt', lifestealOnDamage: 15 },
  epithet: 'The Hungry Grandmother',
  introQuote: "Eat, child. You'll need your strength... for what comes next."
}

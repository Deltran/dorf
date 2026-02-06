import { EffectType } from '../../statusEffects.js'

export const zina_the_desperate = {
  id: 'zina_the_desperate',
  name: 'Zina',
  rarity: 4,
  classId: 'alchemist',
  baseStats: { hp: 75, atk: 38, def: 15, spd: 16, mp: 60 },
  skills: [
    {
      name: 'Tainted Tonic',
      description: 'Deal 90% ATK damage. Apply Poison for 2 turns. Damage scales with Volatility.',
      skillUnlockLevel: 1,
      essenceCost: 10,
      targetType: 'enemy',
      damagePercent: 90,
      usesVolatility: true,
      effects: [
        {
          type: EffectType.POISON,
          target: 'enemy',
          duration: 2,
          atkPercent: 35
        }
      ]
    },
    {
      name: 'Tainted Feast',
      description: 'Poison ALL enemies for 3 turns. Zina takes 15% max HP self-damage. Damage scales with Volatility.',
      skillUnlockLevel: 1,
      essenceCost: 20,
      targetType: 'all_enemies',
      noDamage: true,
      usesVolatility: true,
      selfDamagePercentMaxHp: 15,
      effects: [
        {
          type: EffectType.POISON,
          target: 'all_enemies',
          duration: 3,
          atkPercent: 45
        }
      ]
    },
    {
      name: 'Cornered Animal',
      description: 'Passive: When Zina drops below 30% HP, gain +40% ATK and +30% SPD for 2 turns. Once per battle.',
      skillUnlockLevel: 3,
      isPassive: true,
      passiveType: 'lowHpTrigger',
      triggerBelowHpPercent: 30,
      oncePerBattle: true,
      triggerEffects: [
        { type: 'atk_up', target: 'self', duration: 2, value: 40 },
        { type: 'spd_up', target: 'self', duration: 2, value: 30 }
      ]
    },
    {
      name: "Death's Needle",
      description: 'Deal 130% ATK damage. +60% if target is Poisoned. Below 30% HP: ignores DEF and cannot miss. Damage scales with Volatility.',
      skillUnlockLevel: 6,
      essenceCost: 25,
      targetType: 'enemy',
      damagePercent: 130,
      usesVolatility: true,
      bonusIfTargetHas: [
        { effectType: 'poison', damagePercent: 190 }
      ],
      conditionalAtLowHp: { hpThreshold: 30, ignoresDef: true, cannotMiss: true }
    },
    {
      name: 'Last Breath',
      description: 'Passive: On death, deal 175% ATK damage to random enemy and Poison all enemies for 3 turns.',
      skillUnlockLevel: 12,
      isPassive: true,
      passiveType: 'onDeath',
      onDeath: {
        damage: { damagePercent: 175, targetType: 'random_enemy' },
        effects: [
          { type: 'poison', target: 'all_enemies', duration: 3, atkPercent: 50 }
        ]
      }
    }
  ],
  epithet: 'Desperate Saboteur ',
  introQuote: 'And THIS one is practically tasteless mixed into a stew...',
  lore: 'Zina was a court alchemist who poisoned the wrong noble and has been running ever since. She brews her concoctions from whatever she can scavenge \u2014 gutter water, cave moss, her own blood when supplies run thin. Desperation, it turns out, is an excellent catalyst.'
}

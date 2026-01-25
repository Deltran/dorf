// Skill target types:
// 'enemy' - single enemy target
// 'ally' - single ally target
// 'self' - targets self only (no selection needed)
// 'all_enemies' - all enemies (no selection needed)
// 'all_allies' - all allies (no selection needed)

// Effect target types for skill effects:
// 'enemy' - applies to targeted enemy
// 'ally' - applies to targeted ally
// 'self' - applies to the caster
// 'all_allies' - applies to all allies (for AoE buffs)

import { EffectType } from './statusEffects.js'

export const heroTemplates = {
  // 5-star (Legendary)
  aurora_the_dawn: {
    id: 'aurora_the_dawn',
    name: 'Aurora the Dawn',
    rarity: 5,
    classId: 'paladin',
    baseStats: { hp: 150, atk: 35, def: 50, spd: 12, mp: 60 },
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
  },
  shadow_king: {
    id: 'shadow_king',
    name: 'The Shadow King',
    rarity: 5,
    classId: 'berserker',
    baseStats: { hp: 110, atk: 55, def: 25, spd: 18 },
    skills: [
      {
        name: 'Void Strike',
        description: 'Deal 200% ATK damage to one enemy, ignoring 50% of their DEF',
        rageCost: 50,
        targetType: 'enemy',
        skillUnlockLevel: 1,
        ignoreDef: 50
      },
      {
        name: 'Mantle of Empty Hate',
        description: 'Raise own ATK by 30% for 3 turns. Poison self for 3 turns at 15% ATK.',
        rageCost: 30,
        targetType: 'self',
        skillUnlockLevel: 1,
        effects: [
          { type: EffectType.ATK_UP, target: 'self', duration: 3, value: 30 },
          { type: EffectType.POISON, target: 'self', duration: 3, atkPercent: 15 }
        ]
      },
      {
        name: 'Despair',
        description: 'Gain a 10% ATK buff for 2 turns for each debuff on the target ally.',
        rageCost: 10,
        targetType: 'ally',
        skillUnlockLevel: 3,
        noDamage: true,
        buffPerDebuff: { type: EffectType.ATK_UP, target: 'self', duration: 2, valuePerDebuff: 10 }
      },
      {
        name: 'Stares Back',
        description: 'Gain Thorns of 100% for 3 turns.',
        rageCost: 30,
        targetType: 'self',
        skillUnlockLevel: 6,
        effects: [
          { type: EffectType.THORNS, target: 'self', duration: 3, value: 100 }
        ]
      },
      {
        name: 'Crushing Eternity',
        description: 'Consume ALL rage. Three attacks to one target equal to 50% ATK + 1% per rage consumed.',
        rageCost: 'all',
        targetType: 'enemy',
        skillUnlockLevel: 12,
        multiHit: 3,
        baseDamage: 50,
        damagePerRage: 1
      }
    ],
    leaderSkill: {
      name: 'Lord of Shadows',
      description: 'On round 1, all allies gain +25% ATK for 2 turns',
      effects: [
        {
          type: 'timed',
          triggerRound: 1,
          target: 'all_allies',
          apply: {
            effectType: 'atk_up',
            duration: 2,
            value: 25
          }
        }
      ]
    }
  },
  yggra_world_root: {
    id: 'yggra_world_root',
    name: 'Yggra, the World Root',
    rarity: 5,
    classId: 'druid',
    baseStats: { hp: 120, atk: 40, def: 35, spd: 10, mp: 75 },
    skills: [
      {
        name: 'Blessing of the World Root',
        description: 'Channel the life force of the world tree to restore all allies for 75% ATK',
        mpCost: 19,
        skillUnlockLevel: 1,
        targetType: 'all_allies'
      },
      {
        name: 'Grasping Roots',
        description: 'Poison one enemy (50% ATK per turn for 2 turns)',
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
        description: 'Deal 200% ATK damage to one enemy; heal all allies for 35% of damage dealt',
        mpCost: 28,
        skillUnlockLevel: 6,
        targetType: 'enemy',
        healAlliesPercent: 35
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
      description: "On round 1, all allies are healed for 10% of Yggra's ATK",
      effects: [
        {
          type: 'timed',
          triggerRound: 1,
          target: 'all_allies',
          apply: {
            effectType: 'heal',
            value: 10
          }
        }
      ]
    }
  },

  // 4-star (Epic)
  sir_gallan: {
    id: 'sir_gallan',
    name: 'Sir Gallan',
    rarity: 4,
    classId: 'knight',
    baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
    skills: [
      {
        name: 'Challenge',
        description: 'Force all enemies to target Sir Gallan until the end of his next turn. At 100 Valor, also gain +10% DEF.',
        skillUnlockLevel: 1,
        valorRequired: 0,
        targetType: 'self',
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.TAUNT, target: 'self', duration: 2 },
          { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 10, valorThreshold: 100 }
        ]
      },
      {
        name: 'Shield Bash',
        description: 'Deal 80% ATK damage and debuff enemy ATK. Debuff strength and duration scale with Valor.',
        skillUnlockLevel: 1,
        valorRequired: 25,
        targetType: 'enemy',
        effects: [
          {
            type: EffectType.ATK_DOWN,
            target: 'enemy',
            duration: { base: 2, at50: 3 },
            value: { base: 20, at25: 25 }
          }
        ]
      },
      {
        name: 'Oath of Protection',
        description: 'Link to an ally for 2 turns, taking 30% of damage dealt to them. Gain 5 Valor when damage is redirected. Redirect amount and duration scale with Valor.',
        skillUnlockLevel: 3,
        valorRequired: 25,
        targetType: 'ally',
        noDamage: true,
        defensive: true,
        effects: [
          {
            type: EffectType.GUARDIAN_LINK,
            target: 'ally',
            duration: { base: 2, at75: 3 },
            redirectPercent: { base: 30, at50: 40, at100: 50 },
            valorOnRedirect: 5
          }
        ]
      },
      {
        name: 'Defensive Footwork',
        description: 'Deal 100% DEF damage. If attacked since last turn, gain DEF buff first (scales with Valor).',
        skillUnlockLevel: 6,
        valorRequired: 25,
        targetType: 'enemy',
        useStat: 'def',
        conditionalPreBuff: {
          condition: 'wasAttacked',
          effect: {
            type: EffectType.DEF_UP,
            target: 'self',
            duration: 2,
            value: { base: 10, at50: 15, at75: 20, at100: 25 }
          }
        }
      },
      {
        name: 'Fortress Stance',
        description: 'Reduce damage taken by 50% and reflect 30% back to attackers for 2 turns. At 100 Valor: also immune to debuffs.',
        skillUnlockLevel: 12,
        valorRequired: 50,
        targetType: 'self',
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2, value: 50 },
          { type: EffectType.REFLECT, target: 'self', duration: 2, value: 30 },
          { type: EffectType.DEBUFF_IMMUNE, target: 'self', duration: 2, valorThreshold: 100 }
        ]
      }
    ]
  },
  ember_witch: {
    id: 'ember_witch',
    name: 'Shasha Ember Witch',
    rarity: 4,
    classId: 'mage',
    baseStats: { hp: 85, atk: 45, def: 20, spd: 14, mp: 70 },
    skills: [
      {
        name: 'Fireball',
        description: 'Deal 130% ATK damage to one enemy and 50% ATK damage to up to 2 other random enemies.',
        mpCost: 20,
        skillUnlockLevel: 1,
        targetType: 'enemy',
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      },
      {
        name: 'Flame Shield',
        description: 'Surround yourself with protective flames for 3 turns. Enemies who attack you are burned for 2 turns.',
        mpCost: 18,
        skillUnlockLevel: 1,
        targetType: 'self',
        noDamage: true,
        effects: [
          { type: EffectType.FLAME_SHIELD, target: 'self', duration: 3, burnDuration: 2 }
        ]
      },
      {
        name: 'Ignite',
        description: 'Set an enemy ablaze for 3 turns (burns for ATK×0.5 per turn).',
        mpCost: 15,
        skillUnlockLevel: 3,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.BURN, target: 'enemy', duration: 3, atkPercent: 50 }
        ]
      },
      {
        name: 'Spreading Flames',
        description: 'Deal 80% ATK damage to one enemy. If the target is burning, spread their burn to all other enemies.',
        mpCost: 22,
        skillUnlockLevel: 6,
        targetType: 'enemy',
        spreadBurn: true
      },
      {
        name: 'Conflagration',
        description: 'Consume all burns on all enemies. Deal instant damage equal to the remaining burn damage plus 10% ATK per burn consumed.',
        mpCost: 30,
        skillUnlockLevel: 12,
        targetType: 'all_enemies',
        noDamage: true,
        consumeBurns: true,
        consumeBurnAtkBonus: 10
      }
    ]
  },
  lady_moonwhisper: {
    id: 'lady_moonwhisper',
    name: 'Lady Moonwhisper',
    rarity: 4,
    classId: 'cleric',
    baseStats: { hp: 95, atk: 25, def: 30, spd: 11, mp: 80 },
    skills: [
      {
        name: 'Lunar Blessing',
        description: 'Heal one ally for 150% ATK and grant them 20% DEF boost for 2 turns',
        mpCost: 22,
        skillUnlockLevel: 1,
        targetType: 'ally',
        effects: [
          { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 20 }
        ]
      },
      {
        name: 'Moonveil',
        description: 'Shroud an ally in moonlight, making them untargetable for 2 turns',
        mpCost: 20,
        skillUnlockLevel: 1,
        targetType: 'ally',
        noDamage: true,
        effects: [
          { type: EffectType.UNTARGETABLE, target: 'ally', duration: 2 }
        ]
      },
      {
        name: 'Purifying Light',
        description: 'Remove all stat debuffs from one ally',
        mpCost: 18,
        skillUnlockLevel: 3,
        targetType: 'ally',
        noDamage: true,
        cleanse: 'debuffs'
      },
      {
        name: 'Silver Mist',
        description: 'Grant ally 40% evasion for 3 turns. Missed attacks restore 5 MP to Lady Moonwhisper.',
        mpCost: 18,
        skillUnlockLevel: 6,
        targetType: 'ally',
        noDamage: true,
        effects: [
          {
            type: EffectType.EVASION,
            target: 'ally',
            duration: 3,
            value: 40,
            onEvade: { restoreMp: 5, to: 'caster' }
          }
        ]
      },
      {
        name: "Full Moon's Embrace",
        description: 'Revive a fallen ally at 40% HP with untargetable for 1 turn.',
        mpCost: 35,
        skillUnlockLevel: 12,
        targetType: 'dead_ally',
        noDamage: true,
        revive: { hpPercent: 40 },
        effects: [
          { type: EffectType.UNTARGETABLE, target: 'ally', duration: 1 }
        ]
      }
    ]
  },
  swift_arrow: {
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
  },

  // 3-star (Rare)
  town_guard: {
    id: 'town_guard',
    name: 'Kensin, Squire',
    rarity: 3,
    classId: 'knight',
    baseStats: { hp: 110, atk: 22, def: 35, spd: 8 },
    skills: [
      {
        name: 'Defensive Stance',
        description: 'Increase own DEF by 50% for 2 turns. At 50 Valor: 3 turns. At 75 Valor: 65% DEF.',
        valorRequired: 25,
        targetType: 'self',
        skillUnlockLevel: 1,
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.DEF_UP, target: 'self', duration: { base: 2, at50: 3 }, value: { base: 50, at75: 65 } }
        ]
      },
      {
        name: 'Shield Allies',
        description: 'Increase ally DEF by 15% for 2 turns. At 50 Valor: 30% DEF. At 100 Valor: 3 turns.',
        valorRequired: 0,
        targetType: 'ally',
        skillUnlockLevel: 1,
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.DEF_UP, target: 'ally', duration: { base: 2, at100: 3 }, value: { base: 15, at50: 30 } }
        ]
      },
      {
        name: 'Reinforce',
        description: 'Remove ATK/DEF debuffs from ally and heal 10% of your DEF as HP. At 75 Valor: 15% heal. At 100 Valor: also removes SPD debuffs.',
        valorRequired: 50,
        targetType: 'ally',
        skillUnlockLevel: 3,
        noDamage: true,
        defensive: true,
        cleanse: { types: ['atk', 'def'], at100Types: ['atk', 'def', 'spd'] },
        healFromStat: { stat: 'def', percent: { base: 10, at75: 15 } }
      },
      {
        name: 'Riposte Strike',
        description: 'Gain Riposte for 3 turns: retaliate with 100% ATK when attacked by enemies with lower DEF. At 75 Valor: 4 turns. At 100 Valor: 5 turns.',
        valorRequired: 50,
        targetType: 'self',
        skillUnlockLevel: 6,
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.RIPOSTE, target: 'self', duration: { base: 3, at75: 4, at100: 5 }, value: 100 }
        ]
      },
      {
        name: "Guardian's Sacrifice",
        description: 'Redirect all damage from one ally to Kensin. Gain DEF buff while active. Duration and DEF scale with Valor.',
        valorRequired: 0,
        targetType: 'ally',
        skillUnlockLevel: 12,
        noDamage: true,
        defensive: true,
        effects: [
          { type: EffectType.DEF_UP, target: 'self', duration: { base: 2, at75: 3 }, value: { base: 20, at25: 25, at50: 30, at100: 35 } }
        ],
        redirect: {
          percent: 100,
          duration: { base: 2, at75: 3 }
        }
      }
    ]
  },
  hedge_wizard: {
    id: 'hedge_wizard',
    name: 'Knarly Zeek',
    rarity: 3,
    classId: 'mage',
    baseStats: { hp: 70, atk: 35, def: 15, spd: 12, mp: 60 },
    skills: [
      {
        name: 'Crumble Curse',
        description: 'Deal 100% ATK damage and reduce enemy DEF by 10% for 4 turns',
        mpCost: 14,
        skillUnlockLevel: 1,
        targetType: 'enemy',
        effects: [
          { type: EffectType.DEF_DOWN, target: 'enemy', duration: 4, value: 10 }
        ]
      },
      {
        name: 'Prickly Protection',
        description: 'Gain a barrier that deals 50% ATK damage to attackers for 4 turns',
        mpCost: 16,
        skillUnlockLevel: 1,
        targetType: 'self',
        noDamage: true,
        effects: [
          { type: EffectType.THORNS, target: 'self', duration: 4, value: 50 }
        ]
      },
      {
        name: 'Fumblefingers',
        description: '90% ATK damage. 50% chance to stun for 1 turn.',
        mpCost: 12,
        skillUnlockLevel: 3,
        targetType: 'enemy',
        damageMultiplier: 0.9,
        effects: [
          { type: EffectType.STUN, target: 'enemy', duration: 1, chance: 50 }
        ]
      },
      {
        name: 'The Ickies',
        description: 'Apply -3 SPD and Poison (20% ATK) for 3 turns',
        mpCost: 14,
        skillUnlockLevel: 6,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.SPD_DOWN, target: 'enemy', duration: 3, value: 3 },
          { type: EffectType.POISON, target: 'enemy', duration: 3, atkPercent: 20 }
        ]
      },
      {
        name: "Knarly's Special",
        description: 'Deal 120% ATK + 30% per debuff on target. Removes all debuffs.',
        mpCost: 22,
        skillUnlockLevel: 12,
        targetType: 'enemy',
        damageMultiplier: 1.2,
        bonusDamagePerDebuff: 30,
        consumeDebuffs: true
      }
    ]
  },
  village_healer: {
    id: 'village_healer',
    name: 'Grandma Helga',
    rarity: 3,
    classId: 'cleric',
    baseStats: { hp: 80, atk: 18, def: 25, spd: 9, mp: 65 },
    skills: [
      {
        name: 'Healing Touch',
        description: 'Heal one ally for 120% ATK',
        mpCost: 15,
        skillUnlockLevel: 1,
        targetType: 'ally'
      },
      {
        name: 'Cup of Tea',
        description: 'Grant an ally regeneration (25% ATK per turn for 3 turns)',
        mpCost: 12,
        skillUnlockLevel: 1,
        targetType: 'ally',
        noDamage: true,
        effects: [
          { type: EffectType.REGEN, target: 'ally', duration: 3, atkPercent: 25 }
        ]
      },
      {
        name: 'Mana Spring',
        description: 'Grant an ally MP regeneration (5 MP per turn for 3 turns)',
        mpCost: 10,
        skillUnlockLevel: 3,
        targetType: 'ally',
        noDamage: true,
        effects: [
          { type: EffectType.MP_REGEN, target: 'ally', duration: 3, value: 5 }
        ]
      },
      {
        name: 'There There, Dear',
        description: 'Heal ally for 90% ATK and grant +15% ATK for 2 turns',
        mpCost: 18,
        skillUnlockLevel: 6,
        targetType: 'ally',
        effects: [
          { type: EffectType.ATK_UP, target: 'ally', duration: 2, value: 15 }
        ]
      },
      {
        name: 'Second Helping',
        description: 'Heal all allies for 80% ATK. Grant "Well Fed" for 3 turns - auto-heals for 100% ATK if HP drops below 30%.',
        mpCost: 28,
        skillUnlockLevel: 12,
        targetType: 'all_allies',
        wellFedEffect: { duration: 3, atkPercent: 100, threshold: 30 }
      }
    ]
  },
  wandering_bard: {
    id: 'wandering_bard',
    name: 'Harl the Handsom',
    rarity: 3,
    classId: 'bard',
    baseStats: { hp: 75, atk: 20, def: 20, spd: 15, mp: 70 },
    skills: [
      {
        name: 'Inspiring Song',
        description: 'Increase all allies ATK by 15% for 2 turns',
        mpCost: 18,
        targetType: 'all_allies',
        effects: [
          { type: EffectType.ATK_UP, target: 'all_allies', duration: 2, value: 15 }
        ]
      },
      {
        name: 'Mana Melody',
        description: 'Restore 10 MP to all allies',
        mpCost: 20,
        skillUnlockLevel: 1,
        targetType: 'all_allies',
        mpRestore: 10
      },
      {
        name: 'Soothing Serenade',
        description: 'Heal all allies for 15% of ATK',
        mpCost: 22,
        skillUnlockLevel: 3,
        targetType: 'all_allies',
        healFromStat: { stat: 'atk', percent: 15 }
      },
      {
        name: 'Ballad of Blackwall',
        description: 'Grant all allies DEF +20% for 2 turns',
        mpCost: 20,
        skillUnlockLevel: 6,
        targetType: 'all_allies',
        effects: [
          { type: EffectType.DEF_UP, target: 'all_allies', duration: 2, value: 20 }
        ]
      },
      {
        name: 'Encore',
        description: 'Extend buff durations on ally by 2 turns. Grant +15 MP, +10 Rage, +10 Valor, +15% SPD for 1 turn.',
        mpCost: 30,
        skillUnlockLevel: 12,
        targetType: 'ally',
        extendBuffs: 2,
        grantMp: 15,
        grantRage: 10,
        grantValor: 10,
        effects: [
          { type: EffectType.SPD_UP, target: 'ally', duration: 1, value: 15 }
        ]
      }
    ]
  },

  // 2-star (Uncommon)
  militia_soldier: {
    id: 'militia_soldier',
    name: 'Sorju, Gate Guard',
    rarity: 2,
    classId: 'knight',
    baseStats: { hp: 90, atk: 18, def: 28, spd: 13 },
    skills: [
      {
        name: 'High Initiative',
        description: 'Deal 70% ATK damage and buff own SPD by 2 for 2 turns. Scales with Valor.',
        valorRequired: 0,
        targetType: 'enemy',
        skillUnlockLevel: 1,
        damage: { base: 70, at50: 85, at100: 100 },
        effects: [
          { type: EffectType.SPD_UP, target: 'self', duration: 2, value: { base: 2, at25: 3, at75: 4, at100: 5 } }
        ]
      },
      {
        name: 'Blitz Strike',
        description: 'Deal 100% ATK damage to all enemies that have not acted yet this round. Scales with Valor.',
        valorRequired: 25,
        targetType: 'all_enemies',
        skillUnlockLevel: 3,
        targetFilter: 'not_acted',
        damage: { base: 100, at50: 105, at75: 110, at100: 115 }
      },
      {
        name: 'Pinning Advance',
        description: 'Deal 100% ATK damage and reduce target SPD by 5 for 2 turns. Scales with Valor.',
        valorRequired: 50,
        targetType: 'enemy',
        skillUnlockLevel: 6,
        damage: { base: 100, at75: 115 },
        effects: [
          { type: EffectType.SPD_DOWN, target: 'enemy', duration: { base: 2, at100: 3 }, value: { base: 5, at100: 6 } }
        ]
      }
    ]
  },
  apprentice_mage: {
    id: 'apprentice_mage',
    name: 'Calisus',
    rarity: 2,
    classId: 'mage',
    baseStats: { hp: 55, atk: 28, def: 10, spd: 11, mp: 50 },
    skills: [
      {
        name: 'Spark',
        description: 'Deal 120% ATK damage to one enemy',
        mpCost: 10,
        skillUnlockLevel: 1,
        targetType: 'enemy'
      },
      {
        name: 'Chain Lightning',
        description: 'Deal 70% ATK damage to target, then bounce to up to 2 additional enemies for 50% ATK each',
        mpCost: 16,
        skillUnlockLevel: 3,
        targetType: 'enemy',
        chainBounce: {
          maxBounces: 2,
          bounceMultiplier: 50
        }
      },
      {
        name: 'Jolt',
        description: 'Deal 70% ATK damage and stun the target for 1 turn',
        mpCost: 18,
        skillUnlockLevel: 6,
        targetType: 'enemy',
        effects: [
          { type: EffectType.STUN, target: 'enemy', duration: 1 }
        ]
      },
      {
        name: 'Tempest',
        description: 'Deal 130% ATK damage to all enemies',
        mpCost: 26,
        skillUnlockLevel: 12,
        targetType: 'all_enemies'
      }
    ]
  },
  herb_gatherer: {
    id: 'herb_gatherer',
    name: 'Bertan the Gatherer',
    rarity: 2,
    classId: 'druid',
    baseStats: { hp: 65, atk: 15, def: 18, spd: 10, mp: 55 },
    skills: [
      {
        name: 'Herbal Remedy',
        description: 'Heal one ally for 120% ATK',
        mpCost: 12,
        skillUnlockLevel: 1,
        targetType: 'ally'
      },
      {
        name: 'Antidote',
        description: 'Remove poison, burn, and bleed from one ally',
        mpCost: 10,
        skillUnlockLevel: 3,
        targetType: 'ally',
        noDamage: true,
        cleanse: 'dots'
      },
      {
        name: 'Herbal Tonic',
        description: 'Apply regeneration to one ally (45% ATK heal per turn for 3 turns)',
        mpCost: 14,
        skillUnlockLevel: 6,
        targetType: 'ally',
        noDamage: true,
        effects: [
          { type: EffectType.REGEN, target: 'ally', duration: 3, atkPercent: 45 }
        ]
      },
      {
        name: "Nature's Bounty",
        description: 'Heal one ally for 150% ATK and restore 15 MP. Rangers regain Focus.',
        mpCost: 18,
        skillUnlockLevel: 12,
        targetType: 'ally',
        mpRestore: 15,
        grantsFocus: true
      }
    ]
  },

  // 1-star (Common)
  farm_hand: {
    id: 'farm_hand',
    name: 'Darl',
    rarity: 1,
    classId: 'berserker',
    baseStats: { hp: 70, atk: 25, def: 12, spd: 8 },
    skills: [
      {
        name: 'Pitchfork Jabs',
        description: 'Deal 40% ATK damage to three random targets',
        skillUnlockLevel: 1,
        rageCost: 25,
        targetType: 'random_enemies',
        hits: 3
      },
      {
        name: 'Twine and Prayer',
        description: 'Heal 10% HP and gain +10% ATK for 2 turns',
        skillUnlockLevel: 3,
        rageCost: 10,
        targetType: 'self',
        noDamage: true,
        selfHealPercent: 10,
        effects: [
          { type: EffectType.ATK_UP, target: 'self', duration: 2, value: 10 }
        ]
      },
      {
        name: 'Toad Strangler',
        description: 'Deal 4 attacks of 30% ATK damage to one enemy',
        skillUnlockLevel: 6,
        rageCost: 35,
        targetType: 'enemy',
        multiHit: 4
      },
      {
        name: 'Burndown',
        description: 'Deal 110% ATK damage to all enemies and poison them for 10% damage for 1 turn',
        skillUnlockLevel: 12,
        rageCost: 65,
        targetType: 'all_enemies',
        effects: [
          { type: EffectType.POISON, target: 'enemy', duration: 1, atkPercent: 10 }
        ]
      }
    ]
  },
  street_urchin: {
    id: 'street_urchin',
    name: 'Salia',
    rarity: 1,
    classId: 'ranger',
    baseStats: { hp: 50, atk: 18, def: 8, spd: 14, mp: 30 },
    skills: [
      {
        name: 'Quick Throw',
        description: 'Deal 80% ATK damage to one enemy. Get an extra turn.',
        skillUnlockLevel: 1,
        targetType: 'enemy',
        damageMultiplier: 0.8,
        grantsExtraTurn: true
      },
      {
        name: 'Desperation',
        description: 'Deal 150% ATK damage to one enemy. Receive a -15% DEF debuff.',
        skillUnlockLevel: 3,
        targetType: 'enemy',
        damageMultiplier: 1.5,
        effects: [
          { type: EffectType.DEF_DOWN, target: 'self', duration: 2, value: 15 }
        ]
      },
      {
        name: 'But Not Out',
        description: 'Gain a 20% ATK buff for 2 turns. If below 50% health, instead gain a 30% ATK buff for 3 turns.',
        skillUnlockLevel: 6,
        targetType: 'self',
        noDamage: true,
        conditionalSelfBuff: {
          default: { type: EffectType.ATK_UP, duration: 2, value: 20 },
          conditional: {
            condition: { stat: 'hpPercent', below: 50 },
            effect: { type: EffectType.ATK_UP, duration: 3, value: 30 }
          }
        }
      },
      {
        name: 'In The Crowd',
        description: 'Deal 120% ATK damage to target enemy. Become untargetable until the end of next round.',
        skillUnlockLevel: 12,
        targetType: 'enemy',
        damageMultiplier: 1.2,
        effects: [
          { type: EffectType.UNTARGETABLE, target: 'self', duration: 2, value: 0 }
        ]
      }
    ]
  },
  beggar_monk: {
    id: 'beggar_monk',
    name: 'Vagrant Bil',
    rarity: 1,
    classId: 'cleric',
    baseStats: { hp: 60, atk: 12, def: 15, spd: 9, mp: 45 },
    skills: [
      {
        name: 'Minor Heal',
        description: 'Heal one ally for 80% ATK',
        mpCost: 10,
        skillUnlockLevel: 1,
        targetType: 'ally'
      },
      {
        name: 'Worthless Words',
        description: 'Apply -10% ATK to one enemy for 2 turns',
        mpCost: 8,
        skillUnlockLevel: 3,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2, value: 10 }
        ]
      },
      {
        name: "Nobody's Curse",
        description: 'Apply -10% DEF to one enemy for 3 turns',
        mpCost: 8,
        skillUnlockLevel: 6,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.DEF_DOWN, target: 'enemy', duration: 3, value: 10 }
        ]
      },
      {
        name: "Beggar's Prayer",
        description: 'Heal all allies for 50% ATK. Apply -10% ATK to all enemies for 2 turns.',
        mpCost: 16,
        skillUnlockLevel: 12,
        targetType: 'all_allies',
        effects: [
          { type: EffectType.ATK_DOWN, target: 'all_enemies', duration: 2, value: 10 }
        ]
      }
    ]
  },
  street_busker: {
    id: 'street_busker',
    name: 'Penny Whistler',
    rarity: 1,
    classId: 'bard',
    baseStats: { hp: 65, atk: 15, def: 18, spd: 14, mp: 55 },
    skills: [
      {
        name: 'Jarring Whistle',
        description: 'A piercing off-key note that makes enemies flinch',
        mpCost: 8,
        skillUnlockLevel: 1,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.DEF_DOWN, target: 'enemy', duration: 2, value: 15 }
        ]
      },
      {
        name: 'Distracting Jingle',
        description: 'An annoying tune that throws off enemy timing',
        mpCost: 10,
        skillUnlockLevel: 3,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 15 }
        ]
      },
      {
        name: 'Street Racket',
        description: 'A cacophony of noise that disrupts all foes',
        mpCost: 18,
        skillUnlockLevel: 6,
        targetType: 'all_enemies',
        noDamage: true,
        effects: [
          { type: EffectType.ATK_DOWN, target: 'all_enemies', duration: 2, value: 10 },
          { type: EffectType.DEF_DOWN, target: 'all_enemies', duration: 2, value: 10 }
        ]
      },
      {
        name: 'Ear-Splitting Finale',
        description: "A piercing note that's unbearable to those already off-balance",
        mpCost: 20,
        skillUnlockLevel: 12,
        targetType: 'enemy',
        noDamage: true,
        stunIfDebuffed: true,
        effects: [
          { type: EffectType.SPD_DOWN, target: 'enemy', duration: 2, value: 20 }
        ]
      }
    ]
  },

  // 2-star (Uncommon) - Evasion tank
  fennick: {
    id: 'fennick',
    name: 'Fennick',
    rarity: 2,
    classId: 'ranger',
    role: 'tank',
    baseStats: { hp: 80, atk: 16, def: 8, spd: 16, mp: 30 },
    skills: [
      {
        name: 'Come and Get Me',
        description: 'Taunt all enemies for 2 turns and gain 30% evasion for 2 turns.',
        skillUnlockLevel: 1,
        targetType: 'self',
        noDamage: true,
        effects: [
          { type: EffectType.TAUNT, target: 'self', duration: 2 },
          { type: EffectType.EVASION, target: 'self', duration: 2, value: 30 }
        ]
      }
    ]
  }
}

export function getHeroTemplate(templateId) {
  return heroTemplates[templateId] || null
}

export function getHeroTemplatesByRarity(rarity) {
  return Object.values(heroTemplates).filter(h => h.rarity === rarity)
}

export function getAllHeroTemplates() {
  return Object.values(heroTemplates)
}

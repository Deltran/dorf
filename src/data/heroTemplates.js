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
    skill: {
      name: 'Divine Radiance',
      description: 'Deal 150% ATK damage to all enemies and heal all allies for 20% of damage dealt',
      mpCost: 30,
      targetType: 'all_enemies'
    }
  },
  shadow_king: {
    id: 'shadow_king',
    name: 'Shadow King',
    rarity: 5,
    classId: 'berserker',
    baseStats: { hp: 110, atk: 55, def: 25, spd: 18, mp: 50 },
    skill: {
      name: 'Void Strike',
      description: 'Deal 200% ATK damage to one enemy, ignoring 50% of their DEF',
      mpCost: 25,
      targetType: 'enemy'
    }
  },

  // 4-star (Epic)
  sir_gallan: {
    id: 'sir_gallan',
    name: 'Sir Gallan',
    rarity: 4,
    classId: 'knight',
    baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
    skill: {
      name: 'Shield Bash',
      description: 'Deal 80% ATK damage and reduce enemy ATK by 20% for 2 turns',
      mpCost: 15,
      targetType: 'enemy',
      effects: [
        { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2, value: 20 }
      ]
    }
  },
  ember_witch: {
    id: 'ember_witch',
    name: 'Ember Witch',
    rarity: 4,
    classId: 'mage',
    baseStats: { hp: 85, atk: 45, def: 20, spd: 14, mp: 70 },
    skills: [
      {
        name: 'Fireball',
        description: 'Deal 130% ATK damage to one enemy and 50% ATK damage to adjacent enemies',
        mpCost: 20,
        targetType: 'enemy'
      },
      {
        name: 'Ignite',
        description: 'Set an enemy ablaze for 3 turns (burns for ATK×0.5 per turn)',
        mpCost: 15,
        skillUnlockLevel: 3,
        targetType: 'enemy',
        noDamage: true,
        effects: [
          { type: EffectType.BURN, target: 'enemy', duration: 3, atkPercent: 50 }
        ]
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
        targetType: 'ally',
        effects: [
          { type: EffectType.DEF_UP, target: 'ally', duration: 2, value: 20 }
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
      }
    ]
  },
  swift_arrow: {
    id: 'swift_arrow',
    name: 'Swift Arrow',
    rarity: 4,
    classId: 'ranger',
    baseStats: { hp: 90, atk: 42, def: 22, spd: 20, mp: 55 },
    skill: {
      name: 'Triple Shot',
      description: 'Deal 70% ATK damage three times to random enemies',
      mpCost: 18,
      targetType: 'all_enemies'
    }
  },

  // 3-star (Rare)
  town_guard: {
    id: 'town_guard',
    name: 'Town Guard',
    rarity: 3,
    classId: 'knight',
    baseStats: { hp: 110, atk: 22, def: 35, spd: 8, mp: 40 },
    skill: {
      name: 'Defensive Stance',
      description: 'Increase own DEF by 50% for 2 turns',
      mpCost: 12,
      targetType: 'self',
      effects: [
        { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 50 }
      ]
    }
  },
  hedge_wizard: {
    id: 'hedge_wizard',
    name: 'Hedge Wizard',
    rarity: 3,
    classId: 'mage',
    baseStats: { hp: 70, atk: 35, def: 15, spd: 12, mp: 60 },
    skills: [
      {
        name: 'Destructive Charm',
        description: 'Deal 100% ATK damage and reduce enemy DEF by 10% for 4 turns',
        mpCost: 14,
        targetType: 'enemy',
        effects: [
          { type: EffectType.DEF_DOWN, target: 'enemy', duration: 4, value: 10 }
        ]
      },
      {
        name: 'Retaliatory Protection',
        description: 'Gain a barrier that deals 50% ATK damage to attackers for 4 turns',
        mpCost: 16,
        targetType: 'self',
        noDamage: true,
        effects: [
          { type: EffectType.THORNS, target: 'self', duration: 4, value: 50 }
        ]
      }
    ]
  },
  village_healer: {
    id: 'village_healer',
    name: 'Village Healer',
    rarity: 3,
    classId: 'cleric',
    baseStats: { hp: 80, atk: 18, def: 25, spd: 9, mp: 65 },
    skills: [
      {
        name: 'Healing Touch',
        description: 'Heal one ally for 120% ATK',
        mpCost: 15,
        targetType: 'ally'
      },
      {
        name: 'Mana Spring',
        description: 'Grant an ally MP regeneration (5 MP per turn for 3 turns)',
        mpCost: 10,
        skillUnlockLevel: 3,
        targetType: 'ally',
        effects: [
          { type: EffectType.MP_REGEN, target: 'ally', duration: 3, value: 5 }
        ]
      }
    ]
  },
  wandering_bard: {
    id: 'wandering_bard',
    name: 'Wandering Bard',
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
        name: 'Sing',
        description: 'Restore 2 MP to all allies',
        mpCost: 0,
        targetType: 'all_allies',
        mpRestore: 2
      },
      {
        name: 'Mana Melody',
        description: 'Restore 10 MP to all allies',
        mpCost: 20,
        skillUnlockLevel: 3,
        targetType: 'all_allies',
        mpRestore: 10
      }
    ]
  },

  // 2-star (Uncommon)
  militia_soldier: {
    id: 'militia_soldier',
    name: 'Militia Soldier',
    rarity: 2,
    classId: 'knight',
    baseStats: { hp: 90, atk: 18, def: 28, spd: 7, mp: 35 },
    skill: {
      name: 'Shield Block',
      description: 'Increase own DEF by 30% for 1 turn',
      mpCost: 10,
      targetType: 'self',
      effects: [
        { type: EffectType.DEF_UP, target: 'self', duration: 1, value: 30 }
      ]
    }
  },
  apprentice_mage: {
    id: 'apprentice_mage',
    name: 'Apprentice Mage',
    rarity: 2,
    classId: 'mage',
    baseStats: { hp: 55, atk: 28, def: 10, spd: 11, mp: 50 },
    skill: {
      name: 'Spark',
      description: 'Deal 100% ATK damage to one enemy',
      mpCost: 10,
      targetType: 'enemy'
    }
  },
  herb_gatherer: {
    id: 'herb_gatherer',
    name: 'Herb Gatherer',
    rarity: 2,
    classId: 'druid',
    baseStats: { hp: 65, atk: 15, def: 18, spd: 10, mp: 55 },
    skill: {
      name: 'Herbal Remedy',
      description: 'Heal one ally for 120% ATK',
      mpCost: 12,
      targetType: 'ally'
    }
  },

  // 1-star (Common)
  farm_hand: {
    id: 'farm_hand',
    name: 'Farm Hand',
    rarity: 1,
    classId: 'berserker',
    baseStats: { hp: 70, atk: 20, def: 12, spd: 8, mp: 30 },
    skill: {
      name: 'Pitchfork Jab',
      description: 'Deal 90% ATK damage to one enemy',
      mpCost: 8,
      targetType: 'enemy'
    }
  },
  street_urchin: {
    id: 'street_urchin',
    name: 'Street Urchin',
    rarity: 1,
    classId: 'ranger',
    baseStats: { hp: 50, atk: 18, def: 8, spd: 14, mp: 30 },
    skill: {
      name: 'Quick Throw',
      description: 'Deal 80% ATK damage to one enemy',
      mpCost: 7,
      targetType: 'enemy'
    }
  },
  beggar_monk: {
    id: 'beggar_monk',
    name: 'Beggar Monk',
    rarity: 1,
    classId: 'cleric',
    baseStats: { hp: 60, atk: 12, def: 15, spd: 9, mp: 45 },
    skill: {
      name: 'Minor Heal',
      description: 'Heal one ally for 60% ATK',
      mpCost: 10,
      targetType: 'ally'
    }
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

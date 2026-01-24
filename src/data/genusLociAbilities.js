// src/data/genusLociAbilities.js
// Ability definitions for Genus Loci bosses

import { EffectType } from './statusEffects.js'

// Valinar's abilities
export const valinarAbilities = {
  iron_guard: {
    id: 'iron_guard',
    name: 'Iron Guard',
    description: 'Increase DEF by 40% for 2 turns and grant a shield equal to 10% of max HP',
    cooldown: 3,
    noDamage: true,
    effects: [
      { type: EffectType.DEF_UP, target: 'self', duration: 2, value: 40 }
    ],
    shield: { percentMaxHp: 10 }
  },
  heavy_strike: {
    id: 'heavy_strike',
    name: 'Heavy Strike',
    description: 'Deal 180% ATK damage to one hero',
    cooldown: 2
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Deal 120% ATK damage and stun for 1 turn. Damage increased by 50% if DEF is buffed.',
    cooldown: 4,
    damagePercent: 120,
    bonusIfDefBuffed: 50,
    effects: [
      { type: EffectType.STUN, target: 'hero', duration: 1, value: 0 }
    ]
  },
  towers_wrath: {
    id: 'towers_wrath',
    name: "Tower's Wrath",
    description: 'When HP falls below 50%, deal 150% ATK damage to all heroes. Can only trigger once per battle.',
    isPassive: true,
    triggerCondition: 'hp_below_50',
    triggerOnce: true,
    targetType: 'all_heroes',
    damagePercent: 150
  },
  counterattack_stance: {
    id: 'counterattack_stance',
    name: 'Counterattack Stance',
    description: 'While DEF is buffed, retaliate for 60% ATK damage when attacked.',
    isPassive: true,
    triggerCondition: 'def_buffed',
    retaliatePercent: 60
  },
  judgment_of_ages: {
    id: 'judgment_of_ages',
    name: 'Judgment of Ages',
    description: 'Deal 200% ATK damage to all heroes and remove all their buffs.',
    cooldown: 5,
    targetType: 'all_heroes',
    damagePercent: 200,
    cleanse: 'buffs'
  }
}

// Great Troll's abilities
export const greatTrollAbilities = {
  crushing_blow: {
    id: 'crushing_blow',
    name: 'Crushing Blow',
    description: 'Deal 160% ATK damage to one hero',
    cooldown: 2,
    damagePercent: 160
  },
  hibernation: {
    id: 'hibernation',
    name: 'Hibernation',
    description: 'Enter a deep sleep for 2 turns. Only usable below 50% HP.',
    cooldown: 4,
    noDamage: true,
    targetType: 'self',
    useCondition: 'hp_below_50',
    effects: [
      { type: EffectType.SLEEP, target: 'self', duration: 2 }
    ]
  },
  regenerative_sleep: {
    id: 'regenerative_sleep',
    name: 'Regenerative Sleep',
    description: 'While sleeping, heal 10% of max HP at the start of each turn.',
    isPassive: true,
    healWhileSleeping: { percentMaxHp: 10 }
  },
  boulder_toss: {
    id: 'boulder_toss',
    name: 'Boulder Toss',
    description: 'Deal 120% ATK damage to all heroes',
    cooldown: 3,
    targetType: 'all_heroes',
    damagePercent: 120
  },
  thick_hide: {
    id: 'thick_hide',
    name: 'Thick Hide',
    description: 'Permanently reduce incoming damage by 15%.',
    isPassive: true,
    damageReduction: 15
  },
  rage_awakening: {
    id: 'rage_awakening',
    name: 'Rage Awakening',
    description: 'When woken by damage, immediately counterattack for 200% ATK.',
    isPassive: true,
    triggerCondition: 'woken_from_sleep',
    retaliatePercent: 200
  },
  unstoppable: {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Deal 250% ATK damage and remove all buffs from target.',
    cooldown: 5,
    damagePercent: 250,
    cleanse: 'buffs'
  }
}

// Map of boss ID to their abilities
export const genusLociAbilities = {
  valinar: valinarAbilities,
  great_troll: greatTrollAbilities
}

export function getGenusLociAbility(bossId, abilityId) {
  const bossAbilities = genusLociAbilities[bossId]
  if (!bossAbilities) return null
  return bossAbilities[abilityId] || null
}

export function getGenusLociAbilitiesForLevel(bossId, powerLevel, bossData) {
  const bossAbilities = genusLociAbilities[bossId]
  if (!bossAbilities || !bossData) return []

  // Filter abilities that are unlocked at this power level
  const unlockedAbilityIds = bossData.abilities
    .filter(a => a.unlocksAt <= powerLevel)
    .map(a => a.id)

  return unlockedAbilityIds
    .map(id => bossAbilities[id])
    .filter(Boolean)
}

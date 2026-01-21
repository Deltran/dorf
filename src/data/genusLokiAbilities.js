// src/data/genusLokiAbilities.js
// Ability definitions for Genus Loki bosses

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

// Map of boss ID to their abilities
export const genusLokiAbilities = {
  valinar: valinarAbilities
}

export function getGenusLokiAbility(bossId, abilityId) {
  const bossAbilities = genusLokiAbilities[bossId]
  if (!bossAbilities) return null
  return bossAbilities[abilityId] || null
}

export function getGenusLokiAbilitiesForLevel(bossId, powerLevel, bossData) {
  const bossAbilities = genusLokiAbilities[bossId]
  if (!bossAbilities || !bossData) return []

  // Filter abilities that are unlocked at this power level
  const unlockedAbilityIds = bossData.abilities
    .filter(a => a.unlocksAt <= powerLevel)
    .map(a => a.id)

  return unlockedAbilityIds
    .map(id => bossAbilities[id])
    .filter(Boolean)
}

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

// Pyroclast's abilities
export const pyroclastAbilities = {
  magma_surge: {
    id: 'magma_surge',
    name: 'Magma Surge',
    description: 'Deal 130% ATK damage to one hero and inflict burn for 2 turns.',
    cooldown: 2,
    damagePercent: 130,
    effects: [
      { type: EffectType.BURN, target: 'hero', duration: 2, value: 0 }
    ]
  },
  tectonic_charge: {
    id: 'tectonic_charge',
    name: 'Tectonic Charge',
    description: 'At the start of each turn, gain +15% ATK for 3 turns. Stacks with previous charges.',
    isPassive: true,
    startOfTurnBuff: { type: EffectType.ATK_UP, value: 15, duration: 3 }
  },
  eruption: {
    id: 'eruption',
    name: 'Eruption',
    description: 'Deal 150% ATK damage to all heroes. Reduces own DEF by 30% for 2 turns.',
    cooldown: 4,
    initialCooldown: 4,
    targetType: 'all_heroes',
    damagePercent: 150,
    effects: [
      { type: EffectType.DEF_DOWN, target: 'self', duration: 2, value: 30 }
    ]
  },
  molten_armor: {
    id: 'molten_armor',
    name: 'Molten Armor',
    description: 'Coat in molten rock, gaining 25% damage reduction and reflecting damage to attackers for 3 turns.',
    cooldown: 4,
    noDamage: true,
    targetType: 'self',
    effects: [
      { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 3, value: 25 },
      { type: EffectType.THORNS, target: 'self', duration: 3, value: 40 }
    ]
  },
  pyroclastic_flow: {
    id: 'pyroclastic_flow',
    name: 'Pyroclastic Flow',
    description: 'When HP falls below 50%, Tectonic Charge grants +25% ATK instead of +15%.',
    isPassive: true,
    modifies: 'tectonic_charge',
    triggerCondition: 'hp_below_50',
    modifiedValue: 25
  },
  magma_pool: {
    id: 'magma_pool',
    name: 'Magma Pool',
    description: 'Deal 120% ATK damage to all heroes and reduce their DEF by 20% for 2 turns.',
    cooldown: 5,
    targetType: 'all_heroes',
    damagePercent: 120,
    effects: [
      { type: EffectType.DEF_DOWN, target: 'hero', duration: 2, value: 20 }
    ]
  },
  cataclysm: {
    id: 'cataclysm',
    name: 'Cataclysm',
    description: 'When HP falls below 25%, erupt with devastating force, dealing 150% ATK damage to all heroes. Can only trigger once.',
    isPassive: true,
    triggerCondition: 'hp_below_25',
    triggerOnce: true,
    targetType: 'all_heroes',
    damagePercent: 150
  }
}

// Thalassion's abilities
export const thalassionAbilities = {
  psychic_crush: {
    id: 'psychic_crush',
    name: 'Psychic Crush',
    description: 'Deal 150% ATK damage and reduce target ATK by 15% for 2 turns',
    cooldown: 2,
    damagePercent: 150,
    effects: [
      { type: EffectType.ATK_DOWN, target: 'hero', duration: 2, value: 15 }
    ]
  },
  mind_flay: {
    id: 'mind_flay',
    name: 'Mind Flay',
    description: 'Deal 120% ATK to all heroes. 30% chance to Confuse each.',
    cooldown: 3,
    damagePercent: 120,
    targetType: 'all_heroes',
    effects: [
      { type: EffectType.STUN, target: 'all_heroes', duration: 1, chance: 30, isConfuse: true }
    ]
  },
  dominate: {
    id: 'dominate',
    name: 'Dominate',
    description: 'Control one hero for 2 turns. Hero uses strongest skill against allies.',
    cooldown: 5,
    noDamage: true,
    charm: { duration: 2, useStrongestSkill: true }
  },
  call_of_the_deep: {
    id: 'call_of_the_deep',
    name: 'Call of the Deep',
    description: 'Summon 2 Spawn of the Maw. If 3+ Spawns exist, all attack instead.',
    cooldown: 4,
    summon: { enemyId: 'spawn_of_the_maw', count: 2 },
    altIfSummonsOver: { count: 3, allSummonsAttack: true }
  },
  abyssal_reckoning: {
    id: 'abyssal_reckoning',
    name: 'Abyssal Reckoning',
    description: 'Deal 200% ATK to all. Heroes below 50% HP are Terrified 2 turns.',
    cooldown: 6,
    useCondition: 'hp_below_30',
    damagePercent: 200,
    targetType: 'all_heroes',
    effects: [
      { type: EffectType.ATK_DOWN, target: 'heroes_below_50', duration: 2, value: 40 },
      { type: EffectType.DEF_DOWN, target: 'heroes_below_50', duration: 2, value: 40 }
    ]
  },
  psychic_aura: {
    id: 'psychic_aura',
    name: 'Psychic Aura',
    description: 'All heroes have -10% ATK/SPD while Thalassion lives.',
    isPassive: true,
    aura: {
      effects: [
        { type: EffectType.ATK_DOWN, target: 'all_heroes', value: 10 },
        { type: EffectType.SPD_DOWN, target: 'all_heroes', value: 10 }
      ]
    }
  },
  endless_dreaming: {
    id: 'endless_dreaming',
    name: 'Endless Dreaming',
    description: 'Heal 5% max HP each round. 10% if any hero Dominated or Confused.',
    isPassive: true,
    startOfTurn: { healPercent: 5, bonusIfCharm: 5 }
  },
  the_mind_unshackled: {
    id: 'the_mind_unshackled',
    name: 'The Mind Unshackled',
    description: 'Below 30% HP: +30% ATK, +20% SPD, unlocks Abyssal Reckoning.',
    isPassive: true,
    triggerCondition: 'hp_below_30',
    enrage: { atkBonus: 30, spdBonus: 20 }
  }
}

// Map of boss ID to their abilities
export const genusLociAbilities = {
  valinar: valinarAbilities,
  great_troll: greatTrollAbilities,
  pyroclast: pyroclastAbilities,
  thalassion: thalassionAbilities
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

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getHeroTemplatesByRarity } from '../data/heroTemplates.js'
import { useHeroesStore } from './heroes.js'

// Rarity rates (base)
const BASE_RATES = {
  1: 0.40, // Common
  2: 0.30, // Uncommon
  3: 0.20, // Rare
  4: 0.08, // Epic
  5: 0.02  // Legendary
}

// Cost constants
const SINGLE_PULL_COST = 100
const TEN_PULL_COST = 900

// Pity constants
const FOUR_STAR_PITY = 10
const SOFT_PITY_START = 50
const HARD_PITY = 90
const SOFT_PITY_RATE_INCREASE = 0.02

export const useGachaStore = defineStore('gacha', () => {
  // State
  const gems = ref(1000) // Starting gems
  const gold = ref(10000) // Starting gold for merging
  const pullsSince4Star = ref(0)
  const pullsSince5Star = ref(0)
  const totalPulls = ref(0)

  // Getters
  const canSinglePull = computed(() => gems.value >= SINGLE_PULL_COST)
  const canTenPull = computed(() => gems.value >= TEN_PULL_COST)

  const current5StarRate = computed(() => {
    if (pullsSince5Star.value >= HARD_PITY - 1) {
      return 1.0 // Guaranteed
    }
    if (pullsSince5Star.value >= SOFT_PITY_START) {
      const extraPulls = pullsSince5Star.value - SOFT_PITY_START
      return Math.min(BASE_RATES[5] + (extraPulls * SOFT_PITY_RATE_INCREASE), 1.0)
    }
    return BASE_RATES[5]
  })

  // Internal: Calculate rates with pity
  function getRatesWithPity(guarantee4Star = false) {
    const rates = { ...BASE_RATES }

    // Adjust 5-star rate for soft/hard pity
    if (pullsSince5Star.value >= HARD_PITY - 1) {
      // Hard pity: guaranteed 5-star
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1.0 }
    }

    if (pullsSince5Star.value >= SOFT_PITY_START) {
      const extraPulls = pullsSince5Star.value - SOFT_PITY_START
      const bonus = extraPulls * SOFT_PITY_RATE_INCREASE
      rates[5] = Math.min(BASE_RATES[5] + bonus, 1.0)

      // Reduce lower rarities proportionally
      const totalReduction = rates[5] - BASE_RATES[5]
      const lowerTotal = rates[1] + rates[2] + rates[3]
      rates[1] -= totalReduction * (rates[1] / lowerTotal)
      rates[2] -= totalReduction * (rates[2] / lowerTotal)
      rates[3] -= totalReduction * (rates[3] / lowerTotal)
    }

    // 4-star pity: guarantee 4+ star
    if (guarantee4Star || pullsSince4Star.value >= FOUR_STAR_PITY - 1) {
      // Redistribute 1-3 star rates to 4-5
      const lowRates = rates[1] + rates[2] + rates[3]
      rates[4] += lowRates * 0.9 // Most goes to 4-star
      rates[5] += lowRates * 0.1 // Small bump to 5-star
      rates[1] = 0
      rates[2] = 0
      rates[3] = 0
    }

    return rates
  }

  // Internal: Roll for rarity
  function rollRarity(rates) {
    const roll = Math.random()
    let cumulative = 0
    let highestRarityWithRate = 1

    for (const [rarity, rate] of Object.entries(rates)) {
      if (rate > 0) {
        highestRarityWithRate = parseInt(rarity)
      }
      cumulative += rate
      if (roll < cumulative) {
        return parseInt(rarity)
      }
    }

    // Fallback to highest available rarity (handles floating point edge cases)
    return highestRarityWithRate
  }

  // Internal: Get random hero of rarity
  function getRandomHeroOfRarity(rarity) {
    const heroes = getHeroTemplatesByRarity(rarity)
    if (heroes.length === 0) {
      // Fallback to lower rarity if none exist
      return getRandomHeroOfRarity(Math.max(1, rarity - 1))
    }
    return heroes[Math.floor(Math.random() * heroes.length)]
  }

  // Internal: Perform single pull
  function performPull(guarantee4Star = false) {
    const rates = getRatesWithPity(guarantee4Star)
    const rarity = rollRarity(rates)
    const heroTemplate = getRandomHeroOfRarity(rarity)

    // Update pity counters
    pullsSince4Star.value++
    pullsSince5Star.value++
    totalPulls.value++

    if (rarity >= 4) {
      pullsSince4Star.value = 0
    }
    if (rarity >= 5) {
      pullsSince5Star.value = 0
    }

    return heroTemplate
  }

  // Actions
  function singlePull() {
    if (!canSinglePull.value) return null

    gems.value -= SINGLE_PULL_COST

    const heroTemplate = performPull()
    const heroesStore = useHeroesStore()
    const heroInstance = heroesStore.addHero(heroTemplate.id)

    return {
      template: heroTemplate,
      instance: heroInstance
    }
  }

  function tenPull() {
    if (!canTenPull.value) return null

    gems.value -= TEN_PULL_COST

    const results = []
    const heroesStore = useHeroesStore()

    for (let i = 0; i < 10; i++) {
      // 10th pull guarantees 4-star if none obtained
      const guarantee4Star = i === 9 && !results.some(r => r.template.rarity >= 4)
      const heroTemplate = performPull(guarantee4Star)
      const heroInstance = heroesStore.addHero(heroTemplate.id)

      results.push({
        template: heroTemplate,
        instance: heroInstance
      })
    }

    return results
  }

  function addGems(amount) {
    gems.value += amount
  }

  function spendGems(amount) {
    if (gems.value < amount) return false
    gems.value -= amount
    return true
  }

  function addGold(amount) {
    gold.value += amount
  }

  function spendGold(amount) {
    if (gold.value >= amount) {
      gold.value -= amount
      return true
    }
    return false
  }

  // Persistence
  function loadState(savedState) {
    if (savedState.gems !== undefined) gems.value = savedState.gems
    if (savedState.gold !== undefined) gold.value = savedState.gold
    if (savedState.pullsSince4Star !== undefined) pullsSince4Star.value = savedState.pullsSince4Star
    if (savedState.pullsSince5Star !== undefined) pullsSince5Star.value = savedState.pullsSince5Star
    if (savedState.totalPulls !== undefined) totalPulls.value = savedState.totalPulls
  }

  function saveState() {
    return {
      gems: gems.value,
      gold: gold.value,
      pullsSince4Star: pullsSince4Star.value,
      pullsSince5Star: pullsSince5Star.value,
      totalPulls: totalPulls.value
    }
  }

  return {
    // State
    gems,
    gold,
    pullsSince4Star,
    pullsSince5Star,
    totalPulls,
    // Getters
    canSinglePull,
    canTenPull,
    current5StarRate,
    // Actions
    singlePull,
    tenPull,
    addGems,
    spendGems,
    addGold,
    spendGold,
    // Persistence
    loadState,
    saveState,
    // Constants (for UI)
    SINGLE_PULL_COST,
    TEN_PULL_COST,
    FOUR_STAR_PITY,
    SOFT_PITY_START,
    HARD_PITY
  }
})

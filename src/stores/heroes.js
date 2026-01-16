import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'
import { getItem } from '../data/items.js'
import { useInventoryStore } from './inventory.js'
import { useGachaStore } from './gacha.js'

export const useHeroesStore = defineStore('heroes', () => {
  // State
  const collection = ref([]) // Array of hero instances
  const party = ref([null, null, null, null]) // 4 slots for party
  const partyLeader = ref(null) // instanceId of the party leader

  // Getters
  const heroCount = computed(() => collection.value.length)

  const partyHeroes = computed(() => {
    return party.value.map(instanceId => {
      if (!instanceId) return null
      return collection.value.find(h => h.instanceId === instanceId) || null
    })
  })

  const partyIsFull = computed(() => {
    return party.value.every(slot => slot !== null)
  })

  const availableForParty = computed(() => {
    const partyIds = new Set(party.value.filter(Boolean))
    return collection.value.filter(h => !partyIds.has(h.instanceId))
  })

  const leaderHero = computed(() => {
    if (!partyLeader.value) return null
    return collection.value.find(h => h.instanceId === partyLeader.value) || null
  })

  // Actions
  function addHero(templateId) {
    const template = getHeroTemplate(templateId)
    if (!template) {
      console.warn(`Unknown hero template: ${templateId}`)
      return null
    }

    const heroInstance = {
      instanceId: crypto.randomUUID(),
      templateId,
      level: 1,
      exp: 0,
      starLevel: template.rarity  // Starts at base rarity, upgradeable through merging
    }

    collection.value.push(heroInstance)
    return heroInstance
  }

  function removeHero(instanceId) {
    // Clear leader if this hero was leader
    if (instanceId === partyLeader.value) {
      partyLeader.value = null
    }
    // Remove from party if present
    party.value = party.value.map(id => id === instanceId ? null : id)
    // Remove from collection
    collection.value = collection.value.filter(h => h.instanceId !== instanceId)
  }

  function setPartySlot(slotIndex, instanceId) {
    if (slotIndex < 0 || slotIndex > 3) return false

    // If hero is already in another slot, swap or remove
    const existingSlot = party.value.findIndex(id => id === instanceId)
    if (existingSlot !== -1 && existingSlot !== slotIndex) {
      // Swap with current slot
      party.value[existingSlot] = party.value[slotIndex]
    }

    party.value[slotIndex] = instanceId
    return true
  }

  function clearPartySlot(slotIndex) {
    if (slotIndex < 0 || slotIndex > 3) return false
    const removedId = party.value[slotIndex]
    if (removedId === partyLeader.value) {
      partyLeader.value = null
    }
    party.value[slotIndex] = null
    return true
  }

  function setPartyLeader(instanceId) {
    // Allow null to clear leader, or valid party member
    if (instanceId && !party.value.includes(instanceId)) {
      return false
    }
    partyLeader.value = instanceId
    return true
  }

  function autoFillParty() {
    // Fill empty party slots with strongest available heroes
    const available = [...availableForParty.value]

    // Sort by rarity then level
    available.sort((a, b) => {
      const templateA = getHeroTemplate(a.templateId)
      const templateB = getHeroTemplate(b.templateId)
      if (templateB.rarity !== templateA.rarity) {
        return templateB.rarity - templateA.rarity
      }
      return b.level - a.level
    })

    for (let i = 0; i < 4; i++) {
      if (!party.value[i] && available.length > 0) {
        party.value[i] = available.shift().instanceId
      }
    }
  }

  const MAX_LEVEL = 250

  // Stat growth multiplier per star level (applied per level-up)
  const STAR_GROWTH_MULTIPLIERS = {
    1: 1.00,
    2: 1.10,
    3: 1.20,
    4: 1.35,
    5: 1.50
  }

  // Merge cost: targetStar * this value
  const MERGE_GOLD_COST_PER_STAR = 1000

  function addExp(instanceId, amount) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return

    // No XP gain at max level
    if (hero.level >= MAX_LEVEL) return

    hero.exp += amount

    // Level up logic: 100 exp per level
    const expPerLevel = 100
    while (hero.exp >= expPerLevel * hero.level && hero.level < MAX_LEVEL) {
      hero.exp -= expPerLevel * hero.level
      hero.level++
    }

    // Clear excess exp at max level
    if (hero.level >= MAX_LEVEL) {
      hero.exp = 0
    }
  }

  function addExpToParty(totalExp) {
    const activeParty = party.value.filter(Boolean)
    if (activeParty.length === 0) return []

    const expPerHero = Math.floor(totalExp / activeParty.length)
    const levelUps = []

    activeParty.forEach(instanceId => {
      const hero = collection.value.find(h => h.instanceId === instanceId)
      if (!hero) return

      const oldLevel = hero.level
      addExp(instanceId, expPerHero)
      const newLevel = hero.level

      if (newLevel > oldLevel) {
        levelUps.push({ instanceId, oldLevel, newLevel })
      }
    })

    return levelUps
  }

  // Get computed stats for a hero instance
  function getHeroStats(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return null

    const template = getHeroTemplate(hero.templateId)
    if (!template) return null

    const starLevel = hero.starLevel || template.rarity
    const starMultiplier = STAR_GROWTH_MULTIPLIERS[starLevel] || 1
    const starBonus = starLevel - template.rarity  // +1 base stats per star gained

    // Base level multiplier: 5% per level
    const baseLevelGrowth = 0.05
    // Star level increases growth rate
    const levelMultiplier = 1 + (baseLevelGrowth * starMultiplier) * (hero.level - 1)

    return {
      hp: Math.floor((template.baseStats.hp + starBonus) * levelMultiplier),
      atk: Math.floor((template.baseStats.atk + starBonus) * levelMultiplier),
      def: Math.floor((template.baseStats.def + starBonus) * levelMultiplier),
      spd: Math.floor((template.baseStats.spd + starBonus) * levelMultiplier),
      mp: Math.floor((template.baseStats.mp + starBonus) * levelMultiplier)
    }
  }

  // Get full hero data (instance + template + class)
  function getHeroFull(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return null

    const template = getHeroTemplate(hero.templateId)
    if (!template) return null

    const heroClass = getClass(template.classId)

    return {
      ...hero,
      template,
      class: heroClass,
      stats: getHeroStats(instanceId)
    }
  }

  // Persistence
  function loadState(savedState) {
    if (savedState.collection) {
      // Migration: add starLevel if missing (defaults to template rarity)
      collection.value = savedState.collection.map(hero => ({
        ...hero,
        starLevel: hero.starLevel || getHeroTemplate(hero.templateId)?.rarity || 1
      }))
    }
    if (savedState.party) party.value = savedState.party
    if (savedState.partyLeader !== undefined) partyLeader.value = savedState.partyLeader
  }

  function saveState() {
    return {
      collection: collection.value,
      party: party.value,
      partyLeader: partyLeader.value
    }
  }

  function useXpItem(instanceId, itemId) {
    const inventoryStore = useInventoryStore()

    const item = getItem(itemId)
    if (!item || item.type !== 'xp') return { success: false, reason: 'invalid_item' }
    if (!inventoryStore.removeItem(itemId)) return { success: false, reason: 'no_item' }

    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) {
      inventoryStore.addItem(itemId) // refund
      return { success: false, reason: 'hero_not_found' }
    }

    const oldLevel = hero.level
    addExp(instanceId, item.xpValue)
    const newLevel = hero.level

    return {
      success: true,
      xpGained: item.xpValue,
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel
    }
  }

  // Merge functions
  function canMergeHero(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return { canMerge: false, reason: 'Hero not found' }

    const template = getHeroTemplate(hero.templateId)
    const starLevel = hero.starLevel || template?.rarity || 1

    if (starLevel >= 5) {
      return { canMerge: false, reason: 'Already at max star level' }
    }

    // Find duplicates (same templateId, different instanceId)
    const duplicates = collection.value.filter(
      h => h.templateId === hero.templateId && h.instanceId !== instanceId
    )

    const copiesNeeded = starLevel
    if (duplicates.length < copiesNeeded) {
      return {
        canMerge: false,
        reason: `Need ${copiesNeeded} copies (have ${duplicates.length})`,
        copiesNeeded,
        copiesHave: duplicates.length
      }
    }

    const goldCost = (starLevel + 1) * MERGE_GOLD_COST_PER_STAR

    return {
      canMerge: true,
      copiesNeeded,
      copiesHave: duplicates.length,
      duplicates,
      goldCost,
      targetStarLevel: starLevel + 1
    }
  }

  function getMergeCandidates(instanceId, count) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return []

    // Get all duplicates sorted by level (ascending) - sacrifice lowest level first
    const duplicates = collection.value
      .filter(h => h.templateId === hero.templateId && h.instanceId !== instanceId)
      .sort((a, b) => a.level - b.level)

    return duplicates.slice(0, count)
  }

  function mergeHero(baseInstanceId, fodderInstanceIds) {
    const gachaStore = useGachaStore()

    const hero = collection.value.find(h => h.instanceId === baseInstanceId)
    if (!hero) return { success: false, error: 'Base hero not found' }

    const template = getHeroTemplate(hero.templateId)
    const currentStar = hero.starLevel || template?.rarity || 1

    if (currentStar >= 5) {
      return { success: false, error: 'Already at max star level' }
    }

    const copiesNeeded = currentStar
    if (fodderInstanceIds.length !== copiesNeeded) {
      return { success: false, error: `Need exactly ${copiesNeeded} copies` }
    }

    // Validate all fodder heroes exist and are same template
    const fodderHeroes = fodderInstanceIds.map(id =>
      collection.value.find(h => h.instanceId === id)
    )

    if (fodderHeroes.some(h => !h)) {
      return { success: false, error: 'One or more fodder heroes not found' }
    }

    if (fodderHeroes.some(h => h.templateId !== hero.templateId)) {
      return { success: false, error: 'All heroes must be the same type' }
    }

    // Check gold cost
    const goldCost = (currentStar + 1) * MERGE_GOLD_COST_PER_STAR
    if (gachaStore.gold < goldCost) {
      return { success: false, error: `Not enough gold (need ${goldCost})` }
    }

    // Find highest level among all heroes (base + fodder)
    const allHeroes = [hero, ...fodderHeroes]
    const highestLevel = Math.max(...allHeroes.map(h => h.level))
    const highestExp = allHeroes.find(h => h.level === highestLevel)?.exp || 0

    // Remove fodder from party if present
    fodderInstanceIds.forEach(id => {
      const slotIndex = party.value.indexOf(id)
      if (slotIndex !== -1) {
        party.value[slotIndex] = null
      }
      if (partyLeader.value === id) {
        partyLeader.value = null
      }
    })

    // Remove fodder heroes from collection
    collection.value = collection.value.filter(
      h => !fodderInstanceIds.includes(h.instanceId)
    )

    // Upgrade base hero
    hero.starLevel = currentStar + 1
    hero.level = highestLevel
    hero.exp = highestExp

    // Deduct gold
    gachaStore.spendGold(goldCost)

    return {
      success: true,
      newStarLevel: hero.starLevel,
      goldSpent: goldCost
    }
  }

  return {
    // State
    collection,
    party,
    partyLeader,
    // Getters
    heroCount,
    partyHeroes,
    partyIsFull,
    availableForParty,
    leaderHero,
    // Actions
    addHero,
    removeHero,
    setPartySlot,
    clearPartySlot,
    setPartyLeader,
    autoFillParty,
    addExp,
    addExpToParty,
    getHeroStats,
    getHeroFull,
    useXpItem,
    // Merge
    canMergeHero,
    getMergeCandidates,
    mergeHero,
    MERGE_GOLD_COST_PER_STAR,
    // Persistence
    loadState,
    saveState
  }
})

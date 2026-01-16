import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'
import { getItem } from '../data/items.js'
import { useInventoryStore } from './inventory.js'

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
    if (savedState.collection) collection.value = savedState.collection
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
    // Persistence
    loadState,
    saveState
  }
})

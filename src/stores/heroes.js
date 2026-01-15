import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'

export const useHeroesStore = defineStore('heroes', () => {
  // State
  const collection = ref([]) // Array of hero instances
  const party = ref([null, null, null, null]) // 4 slots for party

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
      exp: 0
    }

    collection.value.push(heroInstance)
    return heroInstance
  }

  function removeHero(instanceId) {
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
    party.value[slotIndex] = null
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

  function addExp(instanceId, amount) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return

    hero.exp += amount

    // Level up logic: 100 exp per level
    const expPerLevel = 100
    while (hero.exp >= expPerLevel * hero.level) {
      hero.exp -= expPerLevel * hero.level
      hero.level++
    }
  }

  function addExpToParty(totalExp) {
    const activeParty = party.value.filter(Boolean)
    if (activeParty.length === 0) return

    const expPerHero = Math.floor(totalExp / activeParty.length)
    activeParty.forEach(instanceId => addExp(instanceId, expPerHero))
  }

  // Get computed stats for a hero instance
  function getHeroStats(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return null

    const template = getHeroTemplate(hero.templateId)
    if (!template) return null

    const levelMultiplier = 1 + 0.05 * (hero.level - 1)

    return {
      hp: Math.floor(template.baseStats.hp * levelMultiplier),
      atk: Math.floor(template.baseStats.atk * levelMultiplier),
      def: Math.floor(template.baseStats.def * levelMultiplier),
      spd: Math.floor(template.baseStats.spd * levelMultiplier),
      mp: Math.floor(template.baseStats.mp * levelMultiplier)
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
  }

  function saveState() {
    return {
      collection: collection.value,
      party: party.value
    }
  }

  return {
    // State
    collection,
    party,
    // Getters
    heroCount,
    partyHeroes,
    partyIsFull,
    availableForParty,
    // Actions
    addHero,
    removeHero,
    setPartySlot,
    clearPartySlot,
    autoFillParty,
    addExp,
    addExpToParty,
    getHeroStats,
    getHeroFull,
    // Persistence
    loadState,
    saveState
  }
})

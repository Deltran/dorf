// src/stores/shards.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'

export const useShardsStore = defineStore('shards', () => {
  // State
  const huntingSlots = ref([null, null, null, null, null]) // templateId or null for random
  const unlocked = ref(false) // Set true when player reaches Aquaria

  // Getters
  const isUnlocked = computed(() => unlocked.value)

  // Actions
  function setHuntingSlot(index, templateId) {
    if (index < 0 || index > 4) return false
    huntingSlots.value[index] = templateId
    return true
  }

  function clearHuntingSlot(index) {
    if (index < 0 || index > 4) return false
    huntingSlots.value[index] = null
    return true
  }

  function unlock() {
    unlocked.value = true
  }

  // Roll for shard drop - returns { templateId, count } or null
  function rollShardDrop() {
    if (!unlocked.value) return null

    const heroesStore = useHeroesStore()
    const ownedTemplateIds = [...new Set(heroesStore.collection.map(h => h.templateId))]

    if (ownedTemplateIds.length === 0) return null

    // Pick a random slot
    const slotIndex = Math.floor(Math.random() * 5)
    const slotValue = huntingSlots.value[slotIndex]

    let targetTemplateId
    if (slotValue && ownedTemplateIds.includes(slotValue)) {
      // Slot has a valid hero assigned
      targetTemplateId = slotValue
    } else {
      // Empty slot or hero no longer owned - random from roster
      targetTemplateId = ownedTemplateIds[Math.floor(Math.random() * ownedTemplateIds.length)]
    }

    // Roll 3-7 shards
    const count = Math.floor(Math.random() * 5) + 3

    return { templateId: targetTemplateId, count }
  }

  // Add shards to a hero by templateId
  function addShards(templateId, count) {
    const heroesStore = useHeroesStore()
    // Find all heroes with this templateId and add shards to each
    // (In case player has multiple copies, all get shards)
    const matchingHeroes = heroesStore.collection.filter(h => h.templateId === templateId)
    for (const hero of matchingHeroes) {
      hero.shards = (hero.shards || 0) + count
    }
    return matchingHeroes.length > 0
  }

  // Persistence
  function saveState() {
    return {
      huntingSlots: huntingSlots.value,
      unlocked: unlocked.value
    }
  }

  function loadState(savedState) {
    if (savedState.huntingSlots) huntingSlots.value = savedState.huntingSlots
    if (savedState.unlocked !== undefined) unlocked.value = savedState.unlocked
  }

  return {
    // State
    huntingSlots,
    unlocked,
    // Getters
    isUnlocked,
    // Actions
    setHuntingSlot,
    clearHuntingSlot,
    unlock,
    rollShardDrop,
    addShards,
    // Persistence
    saveState,
    loadState
  }
})

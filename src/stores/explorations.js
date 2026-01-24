import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { questNodes } from '../data/questNodes.js'
import { useQuestsStore } from './quests.js'
import { useHeroesStore } from './heroes.js'

export const useExplorationsStore = defineStore('explorations', () => {
  // State
  const activeExplorations = ref({})
  const completedHistory = ref([])
  const pendingCompletions = ref([])

  // Get all exploration nodes from questNodes
  const allExplorationNodes = computed(() => {
    return Object.values(questNodes).filter(node => node.type === 'exploration')
  })

  // Get unlocked explorations (based on completed prerequisite nodes)
  const unlockedExplorations = computed(() => {
    const questsStore = useQuestsStore()
    return allExplorationNodes.value.filter(node =>
      questsStore.completedNodes.includes(node.unlockedBy)
    )
  })

  // Count of active explorations
  const activeExplorationCount = computed(() => {
    return Object.keys(activeExplorations.value).length
  })

  // Get exploration node by ID
  function getExplorationNode(nodeId) {
    const node = questNodes[nodeId]
    if (!node || node.type !== 'exploration') return null
    return node
  }

  // Start an exploration
  function startExploration(nodeId, heroInstanceIds) {
    const heroesStore = useHeroesStore()

    // Validate node exists and is exploration type
    const node = getExplorationNode(nodeId)
    if (!node) {
      return { success: false, error: 'Invalid exploration node' }
    }

    // Check not already active
    if (activeExplorations.value[nodeId]) {
      return { success: false, error: 'Exploration already active' }
    }

    // Validate 5 heroes
    if (heroInstanceIds.length !== 5) {
      return { success: false, error: 'Must assign exactly 5 heroes' }
    }

    // Check all heroes exist and are available
    for (const instanceId of heroInstanceIds) {
      if (heroesStore.isHeroLocked(instanceId)) {
        return { success: false, error: 'One or more heroes unavailable (already on exploration)' }
      }
      const hero = heroesStore.collection.find(h => h.instanceId === instanceId)
      if (!hero) {
        return { success: false, error: 'Hero not found' }
      }
    }

    // Lock all heroes
    for (const instanceId of heroInstanceIds) {
      heroesStore.lockHeroToExploration(instanceId, nodeId)
    }

    // Create active exploration
    activeExplorations.value[nodeId] = {
      nodeId,
      heroes: [...heroInstanceIds],
      startedAt: Date.now(),
      fightCount: 0,
      partyRequestMet: false // Will be calculated
    }

    return { success: true }
  }

  return {
    // State
    activeExplorations,
    completedHistory,
    pendingCompletions,
    // Getters
    allExplorationNodes,
    unlockedExplorations,
    activeExplorationCount,
    // Actions
    getExplorationNode,
    startExploration
  }
})

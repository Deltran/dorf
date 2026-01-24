import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { questNodes } from '../data/questNodes.js'
import { useQuestsStore } from './quests.js'

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
    getExplorationNode
  }
})

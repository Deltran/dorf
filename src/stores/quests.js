import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getQuestNode, getAllQuestNodes, regions } from '../data/questNodes.js'
import { useInventoryStore } from './inventory.js'

export const useQuestsStore = defineStore('quests', () => {
  // State
  const unlockedNodes = ref(['forest_01']) // Start with first node unlocked
  const completedNodes = ref([])
  const currentRun = ref(null) // { nodeId, battleIndex, partyState }
  const lastVisitedNode = ref(null) // Track last node for background display

  // Getters
  const isNodeUnlocked = computed(() => {
    return (nodeId) => unlockedNodes.value.includes(nodeId)
  })

  const isNodeCompleted = computed(() => {
    return (nodeId) => completedNodes.value.includes(nodeId)
  })

  const availableNodes = computed(() => {
    return getAllQuestNodes().filter(node => unlockedNodes.value.includes(node.id))
  })

  const completedNodeCount = computed(() => completedNodes.value.length)

  const isInRun = computed(() => currentRun.value !== null)

  const currentNode = computed(() => {
    if (!currentRun.value) return null
    return getQuestNode(currentRun.value.nodeId)
  })

  const currentBattleIndex = computed(() => {
    if (!currentRun.value) return -1
    return currentRun.value.battleIndex
  })

  const currentBattle = computed(() => {
    if (!currentNode.value) return null
    return currentNode.value.battles[currentRun.value.battleIndex] || null
  })

  const totalBattlesInCurrentNode = computed(() => {
    if (!currentNode.value) return 0
    return currentNode.value.battles.length
  })

  const regionProgress = computed(() => {
    const progress = {}
    for (const region of regions) {
      const regionNodes = getAllQuestNodes().filter(n => n.region === region.name)
      const completed = regionNodes.filter(n => completedNodes.value.includes(n.id))
      progress[region.id] = {
        name: region.name,
        completed: completed.length,
        total: regionNodes.length
      }
    }
    return progress
  })

  // Actions
  function startRun(nodeId, partyState) {
    const node = getQuestNode(nodeId)
    if (!node) {
      console.warn(`Unknown quest node: ${nodeId}`)
      return false
    }

    if (!unlockedNodes.value.includes(nodeId)) {
      console.warn(`Node not unlocked: ${nodeId}`)
      return false
    }

    currentRun.value = {
      nodeId,
      battleIndex: 0,
      partyState // { [instanceId]: { currentHp, currentMp } }
    }

    // Track for home screen background
    lastVisitedNode.value = nodeId

    return true
  }

  function advanceBattle() {
    if (!currentRun.value) return false

    const node = getQuestNode(currentRun.value.nodeId)
    if (!node) return false

    currentRun.value.battleIndex++

    // Check if all battles complete
    if (currentRun.value.battleIndex >= node.battles.length) {
      return completeRun()
    }

    return true
  }

  function updatePartyState(newPartyState) {
    if (!currentRun.value) return
    currentRun.value.partyState = newPartyState
  }

  function applyBetweenBattleRecovery(partyState, heroStats) {
    // 10% HP and MP recovery between battles
    const recovered = {}
    for (const [instanceId, state] of Object.entries(partyState)) {
      const maxHp = heroStats[instanceId]?.hp || 100
      const maxMp = heroStats[instanceId]?.mp || 50
      recovered[instanceId] = {
        currentHp: Math.min(state.currentHp + Math.floor(maxHp * 0.1), maxHp),
        currentMp: Math.min(state.currentMp + Math.floor(maxMp * 0.1), maxMp)
      }
    }
    return recovered
  }

  function rollItemDrops(node) {
    const drops = []
    for (const drop of node.itemDrops || []) {
      if (Math.random() > drop.chance) continue
      const count = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min
      drops.push({ itemId: drop.itemId, count })
    }
    return drops
  }

  function completeRun() {
    if (!currentRun.value) return null

    const node = getQuestNode(currentRun.value.nodeId)
    if (!node) return null

    const isFirstClear = !completedNodes.value.includes(node.id)

    // Mark as completed
    if (!completedNodes.value.includes(node.id)) {
      completedNodes.value.push(node.id)
    }

    // Unlock connected nodes
    for (const connectedId of node.connections) {
      if (!unlockedNodes.value.includes(connectedId)) {
        unlockedNodes.value.push(connectedId)
      }
    }

    // Roll item drops
    const itemDrops = rollItemDrops(node)

    // Grant items
    const inventoryStore = useInventoryStore()
    for (const drop of itemDrops) {
      inventoryStore.addItem(drop.itemId, drop.count)
    }

    // Calculate rewards (gold is based on exp value or explicit node.rewards.gold)
    const baseGold = node.rewards.gold || Math.floor(node.rewards.exp * 2)
    const rewards = {
      gems: node.rewards.gems,
      exp: node.rewards.exp,
      gold: baseGold,
      isFirstClear,
      items: itemDrops
    }

    if (isFirstClear && node.firstClearBonus) {
      rewards.gems += node.firstClearBonus.gems || 0
      rewards.exp += node.firstClearBonus.exp || 0
      rewards.gold += node.firstClearBonus.gold || Math.floor(baseGold * 0.5)
    }

    // Clear current run
    currentRun.value = null

    return rewards
  }

  function abandonRun() {
    currentRun.value = null
  }

  function failRun() {
    // Called when party wipes
    currentRun.value = null
    return { defeat: true }
  }

  // Persistence
  function loadState(savedState) {
    if (savedState.unlockedNodes) unlockedNodes.value = savedState.unlockedNodes
    if (savedState.completedNodes) completedNodes.value = savedState.completedNodes
    if (savedState.lastVisitedNode) lastVisitedNode.value = savedState.lastVisitedNode
    // Don't restore currentRun - player should restart quests on reload
  }

  function saveState() {
    return {
      unlockedNodes: unlockedNodes.value,
      completedNodes: completedNodes.value,
      lastVisitedNode: lastVisitedNode.value
    }
  }

  return {
    // State
    unlockedNodes,
    completedNodes,
    currentRun,
    lastVisitedNode,
    // Getters
    isNodeUnlocked,
    isNodeCompleted,
    availableNodes,
    completedNodeCount,
    isInRun,
    currentNode,
    currentBattleIndex,
    currentBattle,
    totalBattlesInCurrentNode,
    regionProgress,
    // Actions
    startRun,
    advanceBattle,
    updatePartyState,
    applyBetweenBattleRecovery,
    completeRun,
    abandonRun,
    failRun,
    // Persistence
    loadState,
    saveState
  }
})

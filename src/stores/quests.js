import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getQuestNode, getAllQuestNodes, regions, superRegions, getRegionsBySuperRegion, getNodesByRegion } from '../data/quests/index.js'
import { useInventoryStore } from './inventory.js'
import { useShardsStore } from './shards.js'
import { useTipsStore } from './tips.js'
import { useColosseumStore } from './colosseum.js'
import { getTokenForRegion, getItem } from '../data/items.js'

export const useQuestsStore = defineStore('quests', () => {
  // State
  const unlockedNodes = ref(['forest_01']) // Start with first node unlocked
  const completedNodes = ref([])
  const currentRun = ref(null) // { nodeId, battleIndex, partyState }
  const lastVisitedNode = ref(null) // Track last node for background display
  const lastVisitedRegion = ref(null) // Track last region for map navigation
  const defeatedEnemyTypes = ref(new Set()) // Track which enemy types player has defeated

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
      // Exclude exploration nodes from progress count - they're optional side content
      const regionNodes = getAllQuestNodes().filter(n => n.region === region.name && n.type !== 'exploration')
      const completed = regionNodes.filter(n => completedNodes.value.includes(n.id))
      progress[region.id] = {
        name: region.name,
        completed: completed.length,
        total: regionNodes.length
      }
    }
    return progress
  })

  const superRegionProgress = computed(() => {
    const progress = {}
    for (const sr of superRegions) {
      const srRegions = getRegionsBySuperRegion(sr.id)
      const srNodeIds = srRegions.flatMap(r => getNodesByRegion(r.name).map(n => n.id))
      progress[sr.id] = {
        completed: srNodeIds.filter(id => completedNodes.value.includes(id)).length,
        total: srNodeIds.length
      }
    }
    return progress
  })

  const unlockedSuperRegions = computed(() => {
    return superRegions.filter(sr =>
      sr.unlockedByDefault ||
      (sr.unlockCondition?.completedNode &&
       completedNodes.value.includes(sr.unlockCondition.completedNode))
    )
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

    // Track for home screen background and map navigation
    lastVisitedNode.value = nodeId
    // Find and store the region for this node
    const nodeRegion = regions.find(r => r.name === node.region)
    if (nodeRegion) {
      lastVisitedRegion.value = nodeRegion.id
    }

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
    // 10% HP and MP recovery between battles, preserve rage
    const recovered = {}
    for (const [instanceId, state] of Object.entries(partyState)) {
      const maxHp = heroStats[instanceId]?.hp || 100
      const maxMp = heroStats[instanceId]?.mp || 50
      recovered[instanceId] = {
        currentHp: Math.min(state.currentHp + Math.floor(maxHp * 0.1), maxHp),
        currentMp: Math.min(state.currentMp + Math.floor(maxMp * 0.1), maxMp),
        currentRage: state.currentRage
      }
    }
    return recovered
  }

  function rollItemDrops(node, isFirstClear = false) {
    const drops = []
    for (const drop of node.itemDrops || []) {
      const item = getItem(drop.itemId)
      const effectiveChance = (isFirstClear && item?.type === 'key') ? 1.0 : drop.chance
      if (Math.random() > effectiveChance) continue
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

    // Unlock Coral Depths when aqua_08 is completed
    if (node.id === 'aqua_08' && !unlockedNodes.value.includes('coral_01')) {
      unlockedNodes.value.push('coral_01')
    }

    // Check if any newly unlocked node enables an exploration or Genus Loci
    const tipsStore = useTipsStore()
    const allNodes = getAllQuestNodes()

    // Check for exploration unlocks
    const explorationNodes = allNodes.filter(n => n.type === 'exploration')
    for (const explorationNode of explorationNodes) {
      if (completedNodes.value.includes(explorationNode.unlockedBy)) {
        tipsStore.showTip('explorations_intro')
        break
      }
    }

    // Check for Genus Loci unlocks
    const genusLociNodes = allNodes.filter(n => n.type === 'genusLoci')
    for (const glNode of genusLociNodes) {
      if (unlockedNodes.value.includes(glNode.id)) {
        tipsStore.showTip('genus_loci_intro')
        break
      }
    }

    // Check for Colosseum unlock
    if (node.unlocks === 'colosseum') {
      const colosseumStore = useColosseumStore()
      if (!colosseumStore.colosseumUnlocked) {
        colosseumStore.unlockColosseum()
        tipsStore.showTip('colosseum_unlock')
      }
    }

    // Roll item drops (guarantee key drops on first clear)
    const itemDrops = rollItemDrops(node, isFirstClear)

    // Grant items
    const inventoryStore = useInventoryStore()
    for (const drop of itemDrops) {
      inventoryStore.addItem(drop.itemId, drop.count)
    }

    // Roll shard drops (only for nodes with shardDropChance)
    const shardsStore = useShardsStore()
    let shardDrop = null
    if (node.shardDropChance && Math.random() < node.shardDropChance) {
      shardDrop = shardsStore.rollShardDrop()
      if (shardDrop) {
        shardsStore.addShards(shardDrop.templateId, shardDrop.count)
      }
    }

    // Unlock shards system when first Aquaria node is completed
    if (node.region === 'Gate to Aquaria' && !shardsStore.isUnlocked) {
      shardsStore.unlock()
    }

    // Calculate rewards (gold is based on exp value or explicit node.rewards.gold)
    const baseGold = node.rewards.gold || Math.floor(node.rewards.exp * 2)
    const rewards = {
      gems: node.rewards.gems,
      exp: node.rewards.exp,
      gold: baseGold,
      isFirstClear,
      items: itemDrops,
      shardDrop // { templateId, count } or null
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

  function collectWithToken(nodeId) {
    const node = getQuestNode(nodeId)
    if (!node) {
      return { success: false, error: 'Quest not found' }
    }

    // Must be completed
    if (!completedNodes.value.includes(nodeId)) {
      return { success: false, error: 'Quest not yet completed' }
    }

    // Cannot use on Genus Loci or Exploration
    if (node.type === 'genusLoci' || node.type === 'exploration') {
      return { success: false, error: 'Cannot use token on this quest type' }
    }

    // Find matching token for this region
    const token = getTokenForRegion(node.region)
    if (!token) {
      return { success: false, error: 'No token exists for this region' }
    }

    // Check if player has the token
    const inventoryStore = useInventoryStore()
    if (inventoryStore.getItemCount(token.id) <= 0) {
      return { success: false, error: 'No token available' }
    }

    // Consume token
    inventoryStore.removeItem(token.id, 1)

    // Roll item drops (reuse existing function)
    const itemDrops = rollItemDrops(node)

    // Grant items
    for (const drop of itemDrops) {
      inventoryStore.addItem(drop.itemId, drop.count)
    }

    // Roll shard drops
    const shardsStore = useShardsStore()
    let shardDrop = null
    if (node.shardDropChance && Math.random() < node.shardDropChance) {
      shardDrop = shardsStore.rollShardDrop()
      if (shardDrop) {
        shardsStore.addShards(shardDrop.templateId, shardDrop.count)
      }
    }

    // Calculate rewards (no first clear bonus)
    const baseGold = node.rewards.gold || Math.floor(node.rewards.exp * 2)
    const rewards = {
      gems: node.rewards.gems,
      exp: node.rewards.exp,
      gold: baseGold,
      items: itemDrops,
      shardDrop,
      usedToken: token.name
    }

    return { success: true, rewards }
  }

  function abandonRun() {
    currentRun.value = null
  }

  function failRun() {
    // Called when party wipes
    currentRun.value = null
    return { defeat: true }
  }

  // Enemy discovery tracking
  function recordDefeatedEnemy(templateId) {
    if (templateId) {
      defeatedEnemyTypes.value.add(templateId)
    }
  }

  function hasDefeatedEnemy(templateId) {
    return defeatedEnemyTypes.value.has(templateId)
  }

  // Persistence
  function loadState(savedState) {
    if (savedState.unlockedNodes) unlockedNodes.value = savedState.unlockedNodes
    if (savedState.completedNodes) completedNodes.value = savedState.completedNodes
    if (savedState.lastVisitedNode) lastVisitedNode.value = savedState.lastVisitedNode
    if (savedState.lastVisitedRegion) lastVisitedRegion.value = savedState.lastVisitedRegion
    if (savedState.defeatedEnemyTypes) defeatedEnemyTypes.value = new Set(savedState.defeatedEnemyTypes)
    // Don't restore currentRun - player should restart quests on reload
  }

  function saveState() {
    return {
      unlockedNodes: unlockedNodes.value,
      completedNodes: completedNodes.value,
      lastVisitedNode: lastVisitedNode.value,
      lastVisitedRegion: lastVisitedRegion.value,
      defeatedEnemyTypes: Array.from(defeatedEnemyTypes.value)
    }
  }

  return {
    // State
    unlockedNodes,
    completedNodes,
    currentRun,
    lastVisitedNode,
    lastVisitedRegion,
    defeatedEnemyTypes,
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
    superRegionProgress,
    unlockedSuperRegions,
    // Actions
    startRun,
    advanceBattle,
    updatePartyState,
    applyBetweenBattleRecovery,
    completeRun,
    collectWithToken,
    abandonRun,
    failRun,
    recordDefeatedEnemy,
    hasDefeatedEnemy,
    // Persistence
    loadState,
    saveState
  }
})

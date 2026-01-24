import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { questNodes } from '../data/questNodes.js'
import { useQuestsStore } from './quests.js'
import { useHeroesStore } from './heroes.js'
import { useGachaStore } from './gacha.js'
import { useInventoryStore } from './inventory.js'
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'

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

  // Get the exploration closest to completion (for home screen summary)
  const nextCompletion = computed(() => {
    const nodeIds = Object.keys(activeExplorations.value)
    if (nodeIds.length === 0) return null

    let closest = null
    let closestScore = Infinity

    for (const nodeId of nodeIds) {
      const exploration = activeExplorations.value[nodeId]
      const node = getExplorationNode(nodeId)
      if (!node) continue

      const config = node.explorationConfig
      const fightsRemaining = Math.max(0, config.requiredFights - exploration.fightCount)
      const elapsed = Date.now() - exploration.startedAt
      const timeRemainingMs = Math.max(0, (config.timeLimit * 60 * 1000) - elapsed)

      // Score by whichever is closer (lower = closer to completion)
      // Use fights as primary metric, time as tiebreaker
      const score = fightsRemaining + (timeRemainingMs / (60 * 60 * 1000)) // hours as fraction

      if (score < closestScore) {
        closestScore = score
        closest = {
          nodeId,
          node,
          fightsRemaining,
          timeRemainingMs,
          exploration
        }
      }
    }

    return closest
  })

  // Get exploration node by ID
  function getExplorationNode(nodeId) {
    const node = questNodes[nodeId]
    if (!node || node.type !== 'exploration') return null
    return node
  }

  // Check if heroes meet party request conditions
  function checkPartyRequest(nodeId, heroInstanceIds) {
    const heroesStore = useHeroesStore()
    const node = getExplorationNode(nodeId)
    if (!node?.explorationConfig?.partyRequest) return true // No request = always met

    const conditions = node.explorationConfig.partyRequest.conditions

    // Get hero roles and classes
    const heroData = heroInstanceIds.map(instanceId => {
      const hero = heroesStore.collection.find(h => h.instanceId === instanceId)
      if (!hero) return null
      const template = getHeroTemplate(hero.templateId)
      const heroClass = getClass(template?.classId)
      return {
        role: heroClass?.role,
        classId: template?.classId
      }
    }).filter(Boolean)

    // Check each condition
    for (const condition of conditions) {
      if (condition.role) {
        const count = heroData.filter(h => h.role === condition.role).length
        if (count < condition.count) return false
      }
      if (condition.classId) {
        const count = heroData.filter(h => h.classId === condition.classId).length
        if (count < condition.count) return false
      }
    }

    return true
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
      partyRequestMet: checkPartyRequest(nodeId, heroInstanceIds)
    }

    return { success: true }
  }

  // Cancel an exploration (forfeits all progress)
  function cancelExploration(nodeId) {
    const heroesStore = useHeroesStore()
    const exploration = activeExplorations.value[nodeId]
    if (!exploration) return false

    // Unlock all heroes
    for (const instanceId of exploration.heroes) {
      heroesStore.unlockHeroFromExploration(instanceId)
    }

    // Remove active exploration
    delete activeExplorations.value[nodeId]
    return true
  }

  // Increment fight count for all active explorations
  function incrementFightCount() {
    for (const nodeId of Object.keys(activeExplorations.value)) {
      activeExplorations.value[nodeId].fightCount++
    }
  }

  // Check all active explorations for completion
  function checkCompletions() {
    for (const nodeId of Object.keys(activeExplorations.value)) {
      // Skip if already pending
      if (pendingCompletions.value.includes(nodeId)) continue

      const exploration = activeExplorations.value[nodeId]
      const node = getExplorationNode(nodeId)
      if (!node) continue

      const config = node.explorationConfig
      const elapsed = Date.now() - exploration.startedAt
      const timeComplete = elapsed >= config.timeLimit * 60 * 1000
      const fightsComplete = exploration.fightCount >= config.requiredFights

      if (timeComplete || fightsComplete) {
        pendingCompletions.value.push(nodeId)
      }
    }
  }

  // Claim a completed exploration and distribute rewards
  function claimCompletion(nodeId) {
    const heroesStore = useHeroesStore()
    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    const exploration = activeExplorations.value[nodeId]
    if (!exploration) return null

    const node = getExplorationNode(nodeId)
    if (!node) return null

    const config = node.explorationConfig
    const bonusMultiplier = exploration.partyRequestMet ? 1.10 : 1.0

    // Calculate rewards
    const goldReward = Math.floor(config.rewards.gold * bonusMultiplier)
    const gemsReward = Math.floor(config.rewards.gems * bonusMultiplier)
    const xpReward = Math.floor(config.rewards.xp * bonusMultiplier)
    const xpPerHero = Math.floor(xpReward / 5)

    // Apply currency rewards
    gachaStore.addGold(goldReward)
    gachaStore.addGems(gemsReward)

    // Distribute XP to heroes
    for (const instanceId of exploration.heroes) {
      heroesStore.addExp(instanceId, xpPerHero)
    }

    // Roll item drops
    const itemsDropped = []
    for (const drop of config.itemDrops || []) {
      if (Math.random() < drop.chance) {
        inventoryStore.addItem(drop.itemId, 1)
        itemsDropped.push(drop.itemId)
      }
    }

    // Unlock heroes
    for (const instanceId of exploration.heroes) {
      heroesStore.unlockHeroFromExploration(instanceId)
    }

    // Add to history (limit to 10)
    completedHistory.value.push({
      nodeId,
      heroes: [...exploration.heroes],
      completedAt: Date.now(),
      rewards: { gold: goldReward, gems: gemsReward, xp: xpReward },
      itemsDropped
    })
    if (completedHistory.value.length > 10) {
      completedHistory.value.shift()
    }

    // Remove from active and pending
    delete activeExplorations.value[nodeId]
    const pendingIndex = pendingCompletions.value.indexOf(nodeId)
    if (pendingIndex !== -1) {
      pendingCompletions.value.splice(pendingIndex, 1)
    }

    return {
      gold: goldReward,
      gems: gemsReward,
      xp: xpReward,
      xpPerHero,
      itemsDropped,
      partyRequestMet: exploration.partyRequestMet
    }
  }

  // Persistence
  function saveState() {
    return {
      activeExplorations: activeExplorations.value,
      completedHistory: completedHistory.value
    }
  }

  function loadState(savedState) {
    if (!savedState) return
    if (savedState.activeExplorations) {
      activeExplorations.value = savedState.activeExplorations
    }
    if (savedState.completedHistory) {
      completedHistory.value = savedState.completedHistory
    }
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
    nextCompletion,
    // Actions
    getExplorationNode,
    checkPartyRequest,
    startExploration,
    cancelExploration,
    incrementFightCount,
    checkCompletions,
    claimCompletion,
    saveState,
    loadState
  }
})

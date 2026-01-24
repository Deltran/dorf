<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore, useShardsStore, useGenusLociStore, useExplorationsStore } from './stores'
import { saveGame, loadGame, hasSaveData } from './utils/storage.js'
import { getGenusLoci } from './data/genusLoci.js'

import HomeScreen from './screens/HomeScreen.vue'
import GachaScreen from './screens/GachaScreen.vue'
import HeroesScreen from './screens/HeroesScreen.vue'
import WorldMapScreen from './screens/WorldMapScreen.vue'
import BattleScreen from './screens/BattleScreen.vue'
import InventoryScreen from './screens/InventoryScreen.vue'
import ShardsScreen from './screens/ShardsScreen.vue'
import MergeScreen from './screens/MergeScreen.vue'
import AdminScreen from './screens/AdminScreen.vue'
import GenusLociScreen from './screens/GenusLociScreen.vue'
import ExplorationsScreen from './screens/ExplorationsScreen.vue'
import ExplorationDetailView from './components/ExplorationDetailView.vue'
import ExplorationCompletePopup from './components/ExplorationCompletePopup.vue'

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()
const inventoryStore = useInventoryStore()
const shardsStore = useShardsStore()
const genusLociStore = useGenusLociStore()
const explorationsStore = useExplorationsStore()

const currentScreen = ref('home')
const isLoaded = ref(false)
const initialHeroId = ref(null)
const autoOpenMerge = ref(false)
const selectedBossId = ref(null)
const genusLociBattleContext = ref(null)
const selectedExplorationNodeId = ref(null)
const currentCompletionPopup = ref(null)

// Load game on mount
onMounted(() => {
  const hasData = hasSaveData()

  if (hasData) {
    loadGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore, genusLoci: genusLociStore, explorations: explorationsStore })
  } else {
    // New player: give them a starter hero
    initNewPlayer()
  }

  // Check for any explorations that completed while offline
  explorationsStore.checkCompletions()

  isLoaded.value = true

  // Dev-only: Ctrl+Shift+A opens admin
  if (import.meta.env.DEV) {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        currentScreen.value = 'admin'
      }
    })
  }
})

function initNewPlayer() {
  // Give the player a guaranteed 3-star hero to start
  heroesStore.addHero('town_guard')
  heroesStore.autoFillParty()
}

// Auto-save when relevant state changes
watch(
  () => [
    heroesStore.collection.length,
    heroesStore.party,
    gachaStore.gems,
    gachaStore.gold,
    gachaStore.totalPulls,
    questsStore.completedNodes.length,
    inventoryStore.totalItemCount,
    shardsStore.huntingSlots,
    shardsStore.unlocked,
    genusLociStore.progress,
    explorationsStore.activeExplorations,
    explorationsStore.completedHistory
  ],
  () => {
    if (isLoaded.value) {
      saveGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore, genusLoci: genusLociStore, explorations: explorationsStore })
    }
  },
  { deep: true }
)

// Watch for pending completions and show popup
watch(
  () => explorationsStore.pendingCompletions.length,
  (count) => {
    if (count > 0 && !currentCompletionPopup.value) {
      showNextCompletionPopup()
    }
  }
)

function showNextCompletionPopup() {
  if (explorationsStore.pendingCompletions.length === 0) {
    currentCompletionPopup.value = null
    return
  }

  const nodeId = explorationsStore.pendingCompletions[0]
  const exploration = explorationsStore.activeExplorations[nodeId]
  const node = explorationsStore.getExplorationNode(nodeId)

  if (!exploration || !node) {
    currentCompletionPopup.value = null
    return
  }

  // Pre-calculate rewards for display (without claiming yet)
  const config = node.explorationConfig
  const bonusMultiplier = exploration.partyRequestMet ? 1.10 : 1.0
  const goldReward = Math.floor(config.rewards.gold * bonusMultiplier)
  const gemsReward = Math.floor(config.rewards.gems * bonusMultiplier)
  const xpReward = Math.floor(config.rewards.xp * bonusMultiplier)
  const xpPerHero = Math.floor(xpReward / 5)

  currentCompletionPopup.value = {
    nodeId,
    nodeName: node.name,
    rewards: { gold: goldReward, gems: gemsReward, xp: xpReward, xpPerHero },
    heroes: [...exploration.heroes],
    itemsDropped: [], // Will be filled when claimed
    partyRequestMet: exploration.partyRequestMet
  }
}

function claimCompletionPopup() {
  if (!currentCompletionPopup.value) return

  const result = explorationsStore.claimCompletion(currentCompletionPopup.value.nodeId)
  if (result) {
    // Update popup with actual items dropped
    currentCompletionPopup.value.itemsDropped = result.itemsDropped
  }

  // Close popup and check for more
  currentCompletionPopup.value = null
  if (explorationsStore.pendingCompletions.length > 0) {
    // Small delay before showing next popup
    setTimeout(showNextCompletionPopup, 300)
  }
}

function navigate(screen, param = null) {
  currentScreen.value = screen
  if (screen === 'heroes') {
    // Support both string (heroId) and object ({ heroId, openMerge })
    if (typeof param === 'object' && param !== null) {
      initialHeroId.value = param.heroId
      autoOpenMerge.value = param.openMerge || false
    } else {
      initialHeroId.value = param
      autoOpenMerge.value = false
    }
  } else if (screen === 'genusLoci') {
    selectedBossId.value = param
  } else if (screen === 'exploration-detail') {
    selectedExplorationNodeId.value = param
  }
}

function handleExplorationBack() {
  currentScreen.value = 'home'
}

function handleExplorationDetailClose() {
  currentScreen.value = 'explorations'
  selectedExplorationNodeId.value = null
}

function handleExplorationStarted() {
  // Return to explorations list after starting
  currentScreen.value = 'explorations'
  selectedExplorationNodeId.value = null
}

function handleExplorationCancelled() {
  // Return to explorations list after cancelling
  currentScreen.value = 'explorations'
  selectedExplorationNodeId.value = null
}

function startBattle() {
  genusLociBattleContext.value = null
  currentScreen.value = 'battle'
}

function startGenusLociBattle({ genusLociId, powerLevel }) {
  // Consume key before battle
  const bossData = getGenusLoci(genusLociId)
  if (bossData && inventoryStore.getItemCount(bossData.keyItemId) > 0) {
    inventoryStore.removeItem(bossData.keyItemId, 1)
  }

  // Initialize party state for battle
  const partyState = {}
  for (const instanceId of heroesStore.party.filter(Boolean)) {
    const stats = heroesStore.getHeroStats(instanceId)
    partyState[instanceId] = {
      currentHp: stats.hp,
      currentMp: Math.floor(stats.mp * 0.3)
    }
  }

  // Set battle context for BattleScreen
  genusLociBattleContext.value = {
    genusLociId,
    powerLevel,
    partyState
  }

  currentScreen.value = 'battle'
}
</script>

<template>
  <div :class="['app', { 'full-width': currentScreen === 'admin' }]">
    <template v-if="isLoaded">
      <HomeScreen
        v-if="currentScreen === 'home'"
        @navigate="navigate"
      />
      <GachaScreen
        v-else-if="currentScreen === 'gacha'"
        @navigate="navigate"
      />
      <HeroesScreen
        v-else-if="currentScreen === 'heroes'"
        :initial-hero-id="initialHeroId"
        :auto-open-merge="autoOpenMerge"
        @navigate="navigate"
      />
      <WorldMapScreen
        v-else-if="currentScreen === 'worldmap'"
        @navigate="navigate"
        @startBattle="startBattle"
        @startGenusLociBattle="startGenusLociBattle"
      />
      <BattleScreen
        v-else-if="currentScreen === 'battle'"
        :genus-loci-context="genusLociBattleContext"
        @navigate="navigate"
      />
      <GenusLociScreen
        v-else-if="currentScreen === 'genusLoci'"
        :selected-boss-id="selectedBossId"
        @navigate="navigate"
        @startGenusLociBattle="startGenusLociBattle"
      />
      <InventoryScreen
        v-else-if="currentScreen === 'inventory'"
        @navigate="navigate"
      />
      <ShardsScreen
        v-else-if="currentScreen === 'shards'"
        @navigate="navigate"
      />
      <MergeScreen
        v-else-if="currentScreen === 'merge'"
        @navigate="navigate"
      />
      <AdminScreen
        v-else-if="currentScreen === 'admin'"
        @navigate="navigate"
      />
      <ExplorationsScreen
        v-else-if="currentScreen === 'explorations'"
        @navigate="navigate"
        @back="handleExplorationBack"
      />
      <ExplorationDetailView
        v-else-if="currentScreen === 'exploration-detail'"
        :node-id="selectedExplorationNodeId"
        @close="handleExplorationDetailClose"
        @started="handleExplorationStarted"
        @cancelled="handleExplorationCancelled"
      />

      <!-- Exploration Completion Popup -->
      <ExplorationCompletePopup
        v-if="currentCompletionPopup"
        :completion="currentCompletionPopup"
        @claim="claimCompletionPopup"
      />
    </template>

    <div v-else class="loading">
      <p>Loading...</p>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: #111827;
  color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
  max-width: 600px;
  margin: 0 auto;
}

.app.full-width {
  max-width: none;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #6b7280;
}
</style>

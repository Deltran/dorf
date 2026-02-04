<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore, useShardsStore, useGenusLociStore, useExplorationsStore, useTipsStore, useShopsStore, useEquipmentStore, useIntroStore, useCodexStore } from './stores'
import { useColosseumStore } from './stores/colosseum.js'
import { saveGame, loadGame, hasSaveData } from './utils/storage.js'
import { getGenusLoci } from './data/genusLoci.js'
import { getAllQuestNodes } from './data/quests/index.js'

import HomeScreen from './screens/HomeScreen.vue'
import IntroScreen from './screens/IntroScreen.vue'
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
import FellowshipHallScreen from './screens/FellowshipHallScreen.vue'
import MapRoomScreen from './screens/MapRoomScreen.vue'
import GenusLociListScreen from './screens/GenusLociListScreen.vue'
import PartyScreen from './screens/PartyScreen.vue'
import GoodsAndMarketsScreen from './screens/GoodsAndMarketsScreen.vue'
import ShopsScreen from './screens/ShopsScreen.vue'
import CodexScreen from './screens/CodexScreen.vue'
import CompendiumScreen from './screens/CompendiumScreen.vue'
import FieldGuideScreen from './screens/FieldGuideScreen.vue'
import FieldGuideArticleScreen from './screens/FieldGuideArticleScreen.vue'
import CompendiumRosterScreen from './screens/CompendiumRosterScreen.vue'
import CompendiumBestiaryScreen from './screens/CompendiumBestiaryScreen.vue'
import CompendiumAtlasScreen from './screens/CompendiumAtlasScreen.vue'
import ColosseumScreen from './screens/ColosseumScreen.vue'
import ExplorationDetailView from './components/ExplorationDetailView.vue'
import ExplorationCompletePopup from './components/ExplorationCompletePopup.vue'
import TipPopup from './components/TipPopup.vue'
import TooltipOverlay from './components/TooltipOverlay.vue'

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()
const inventoryStore = useInventoryStore()
const shardsStore = useShardsStore()
const genusLociStore = useGenusLociStore()
const explorationsStore = useExplorationsStore()
const tipsStore = useTipsStore()
const shopsStore = useShopsStore()
const equipmentStore = useEquipmentStore()
const introStore = useIntroStore()
const codexStore = useCodexStore()
const colosseumStore = useColosseumStore()

const currentScreen = ref(
  import.meta.env.DEV ? (sessionStorage.getItem('dorf_dev_screen') || 'home') : 'home'
)
const isLoaded = ref(false)
const initialHeroId = ref(null)
const autoOpenMerge = ref(false)
const selectedBossId = ref(null)
const genusLociBattleContext = ref(null)
const selectedExplorationNodeId = ref(null)
const currentCompletionPopup = ref(null)
const placingHeroId = ref(null)
const initialRegionName = ref(null)
const isIntroBattle = ref(false)
const selectedTopicId = ref(null)

// Repair: sync genus loci victories with completedNodes
// Older saves may have genus loci progress without the quest node marked complete
function repairGenusLociCompletions() {
  const glNodes = getAllQuestNodes().filter(n => n.type === 'genusLoci' && n.genusLociId)
  for (const node of glNodes) {
    if (genusLociStore.isUnlocked(node.genusLociId) && !questsStore.completedNodes.includes(node.id)) {
      questsStore.completedNodes.push(node.id)
    }
  }
}

// Load game on mount
onMounted(() => {
  const hasData = hasSaveData()
  tipsStore.loadTips()

  if (hasData) {
    loadGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore, genusLoci: genusLociStore, explorations: explorationsStore, shops: shopsStore, equipment: equipmentStore, intro: introStore, codex: codexStore })
    codexStore.syncUnlocksFromCollection()
    repairGenusLociCompletions()
  } else {
    // New player: start the intro sequence
    // Heroes are created during the intro flow, not here
    currentScreen.value = 'intro'
  }

  // Check for any explorations that completed while offline
  explorationsStore.checkCompletions()

  isLoaded.value = true

  // Dev-only: Ctrl+Shift+A opens admin, persist screen across HMR reloads
  if (import.meta.env.DEV) {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        currentScreen.value = 'admin'
      }
    })
    watch(currentScreen, (val) => sessionStorage.setItem('dorf_dev_screen', val))
  }
})

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
    explorationsStore.completedHistory,
    shopsStore.purchases,
    equipmentStore.ownedEquipment,
    equipmentStore.equippedGear,
    equipmentStore.blacksmithUnlocked,
    introStore.isIntroComplete,
    codexStore.unlockedTopics,
    codexStore.readEntries
  ],
  () => {
    if (isLoaded.value) {
      saveGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore, genusLoci: genusLociStore, explorations: explorationsStore, shops: shopsStore, equipment: equipmentStore, intro: introStore, codex: codexStore })
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
    codexStore.unlockTopic('genus_loci')
  } else if (screen === 'exploration-detail') {
    selectedExplorationNodeId.value = param
  } else if (screen === 'party') {
    placingHeroId.value = param
  } else if (screen === 'worldmap') {
    initialRegionName.value = param
  } else if (screen === 'field-guide-article') {
    selectedTopicId.value = param
  } else if (screen === 'shards') {
    codexStore.unlockTopic('shards')
  } else if (screen === 'merge') {
    codexStore.unlockTopic('fusion')
  } else if (screen === 'explorations') {
    codexStore.unlockTopic('explorations')
  }
}

function handleExplorationBack() {
  currentScreen.value = 'map-room'
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

const colosseumBattleContext = ref(null)

function startBattle() {
  genusLociBattleContext.value = null
  colosseumBattleContext.value = null
  currentScreen.value = 'battle'
}

function startColosseumBattle(bout) {
  genusLociBattleContext.value = null
  colosseumBattleContext.value = { bout }
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

// Intro flow handlers
function handleIntroStartBattle() {
  isIntroBattle.value = true

  // Build party state for intro battle
  const partyState = {}
  for (const instanceId of heroesStore.party.filter(Boolean)) {
    const stats = heroesStore.getHeroStats(instanceId)
    partyState[instanceId] = {
      currentHp: stats.hp,
      currentMp: Math.floor(stats.mp * 0.3)
    }
  }

  // Start the first quest run
  questsStore.startRun('forest_01', partyState)
  currentScreen.value = 'battle'
}

function handleIntroComplete() {
  isIntroBattle.value = false
  currentScreen.value = 'home'
}

// Handle battle results during intro
function handleBattleNavigate(screen, param) {
  if (isIntroBattle.value) {
    // BattleScreen navigates to 'worldmap' on victory, 'home' on defeat/exit
    if (screen === 'worldmap') {
      // Victory - show victory outro
      introStore.handleVictory()
      currentScreen.value = 'intro'
      return
    }
    if (screen === 'home') {
      // Defeat or early exit
      introStore.handleDefeat()
      currentScreen.value = 'intro'
      return
    }
  }
  navigate(screen, param)
}
</script>

<template>
  <div :class="['app', { 'full-width': currentScreen === 'admin' }]">
    <template v-if="isLoaded">
      <IntroScreen
        v-if="currentScreen === 'intro'"
        @startBattle="handleIntroStartBattle"
        @complete="handleIntroComplete"
      />
      <HomeScreen
        v-if="currentScreen === 'home'"
        @navigate="navigate"
      />
      <FellowshipHallScreen
        v-else-if="currentScreen === 'fellowship-hall'"
        @navigate="navigate"
      />
      <MapRoomScreen
        v-else-if="currentScreen === 'map-room'"
        @navigate="navigate"
      />
      <GenusLociListScreen
        v-else-if="currentScreen === 'genus-loci-list'"
        @navigate="navigate"
      />
      <ColosseumScreen
        v-else-if="currentScreen === 'colosseum'"
        @navigate="navigate"
        @startColosseumBattle="startColosseumBattle"
      />
      <PartyScreen
        v-else-if="currentScreen === 'party'"
        :placing-hero-id="placingHeroId"
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
        :initial-region-name="initialRegionName"
        @navigate="navigate"
        @startBattle="startBattle"
        @startGenusLociBattle="startGenusLociBattle"
      />
      <BattleScreen
        v-else-if="currentScreen === 'battle'"
        :genus-loci-context="genusLociBattleContext"
        :colosseum-context="colosseumBattleContext"
        @navigate="handleBattleNavigate"
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
      <GoodsAndMarketsScreen
        v-else-if="currentScreen === 'goodsAndMarkets'"
        @navigate="navigate"
      />
      <ShopsScreen
        v-else-if="currentScreen === 'shops'"
        @navigate="navigate"
      />
      <CodexScreen
        v-else-if="currentScreen === 'codex'"
        @navigate="navigate"
      />
      <FieldGuideScreen
        v-else-if="currentScreen === 'field-guide'"
        @navigate="navigate"
      />
      <FieldGuideArticleScreen
        v-else-if="currentScreen === 'field-guide-article'"
        :topic-id="selectedTopicId"
        @navigate="navigate"
      />
      <CompendiumScreen
        v-else-if="currentScreen === 'compendium'"
        @navigate="navigate"
      />
      <CompendiumRosterScreen
        v-else-if="currentScreen === 'compendium-roster'"
        @navigate="navigate"
      />
      <CompendiumBestiaryScreen
        v-else-if="currentScreen === 'compendium-bestiary'"
        @navigate="navigate"
      />
      <CompendiumAtlasScreen
        v-else-if="currentScreen === 'compendium-atlas'"
        @navigate="navigate"
      />

      <!-- Exploration Completion Popup -->
      <ExplorationCompletePopup
        v-if="currentCompletionPopup"
        :completion="currentCompletionPopup"
        @claim="claimCompletionPopup"
      />

      <!-- Tip Popup (global) -->
      <TipPopup />
      <TooltipOverlay />
    </template>

    <div v-else class="loading">
      <p>Loading...</p>
    </div>
  </div>
</template>

<style>
:root {
  /* Safe area insets for phones with notches/status bars */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}

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

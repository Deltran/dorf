<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore, useShardsStore, useGenusLociStore, useExplorationsStore, useTipsStore, useShopsStore, useEquipmentStore, useIntroStore, useCodexStore, useBattleStore } from './stores'
import { useColosseumStore } from './stores/colosseum.js'
import { useGemShopStore } from './stores/gemShop.js'
import { useMawStore } from './stores/maw.js'
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
import MawScreen from './screens/MawScreen.vue'
import SettingsScreen from './screens/SettingsScreen.vue'
import ExplorationDetailView from './components/ExplorationDetailView.vue'
import ExplorationCompletePopup from './components/ExplorationCompletePopup.vue'
import TipPopup from './components/TipPopup.vue'
import TooltipOverlay from './components/TooltipOverlay.vue'
import BattleTransitionOverlay from './components/BattleTransitionOverlay.vue'

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
const gemShopStore = useGemShopStore()
const mawStore = useMawStore()
const battleStore = useBattleStore()

const battleTransitionActive = ref(false)

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

// Navigation back-stack
const navigationStack = ref([])

const FALLBACK_BACK = {
  'fellowship-hall': 'home',
  'heroes': 'fellowship-hall',
  'party': 'fellowship-hall',
  'merge': 'fellowship-hall',
  'shards': 'fellowship-hall',
  'map-room': 'home',
  'worldmap': 'map-room',
  'explorations': 'map-room',
  'exploration-detail': 'explorations',
  'genus-loci-list': 'map-room',
  'genusLoci': 'genus-loci-list',
  'colosseum': 'map-room',
  'maw': 'map-room',
  'gacha': 'home',
  'goodsAndMarkets': 'home',
  'inventory': 'goodsAndMarkets',
  'shops': 'goodsAndMarkets',
  'codex': 'home',
  'field-guide': 'codex',
  'field-guide-article': 'field-guide',
  'compendium': 'codex',
  'compendium-roster': 'compendium',
  'compendium-bestiary': 'compendium',
  'compendium-atlas': 'compendium',
  'admin': 'home',
  'settings': 'home'
}

function captureCurrentParams() {
  const s = currentScreen.value
  if (s === 'heroes') return initialHeroId.value ? (autoOpenMerge.value ? { heroId: initialHeroId.value, openMerge: true } : initialHeroId.value) : null
  if (s === 'genusLoci') return selectedBossId.value
  if (s === 'exploration-detail') return selectedExplorationNodeId.value
  if (s === 'party') return placingHeroId.value
  if (s === 'worldmap') return initialRegionName.value
  if (s === 'field-guide-article') return selectedTopicId.value
  return null
}

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

// All persisted stores - add new stores here and they'll auto-save
const persistedStores = {
  heroes: heroesStore,
  gacha: gachaStore,
  quests: questsStore,
  inventory: inventoryStore,
  shards: shardsStore,
  genusLoci: genusLociStore,
  explorations: explorationsStore,
  shops: shopsStore,
  equipment: equipmentStore,
  intro: introStore,
  codex: codexStore,
  colosseum: colosseumStore,
  gemShop: gemShopStore,
  maw: mawStore
}

// Load game on mount
onMounted(() => {
  const hasData = hasSaveData()
  tipsStore.loadTips()

  if (hasData) {
    loadGame(persistedStores)
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

// Auto-save when any persisted store state changes
// Watches the serialized state of all stores - no manual property listing needed
watch(
  () => {
    // Create a snapshot of all store states for change detection
    const snapshot = {}
    for (const [name, store] of Object.entries(persistedStores)) {
      if (store.saveState) {
        snapshot[name] = JSON.stringify(store.saveState())
      }
    }
    return snapshot
  },
  () => {
    if (isLoaded.value) {
      saveGame(persistedStores)
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

function applyNavigation(screen, param = null) {
  currentScreen.value = screen
  if (screen === 'heroes') {
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
  } else if (screen === 'colosseum') {
    codexStore.unlockTopic('colosseum')
  } else if (screen === 'maw') {
    codexStore.unlockTopic('the_maw')
  }
}

function navigate(screen, param = null) {
  if (screen === 'home') {
    navigationStack.value = []
  } else {
    navigationStack.value.push({ screen: currentScreen.value, params: captureCurrentParams() })
    if (navigationStack.value.length > 20) navigationStack.value.shift()
  }
  applyNavigation(screen, param)
}

function navigateBack() {
  if (navigationStack.value.length > 0) {
    const prev = navigationStack.value.pop()
    applyNavigation(prev.screen, prev.params)
  } else {
    applyNavigation(FALLBACK_BACK[currentScreen.value] || 'home', null)
  }
}

function navigateReplace(screen, param = null) {
  if (screen === 'home') navigationStack.value = []
  applyNavigation(screen, param)
}

function handleExplorationDetailClose() {
  selectedExplorationNodeId.value = null
  navigateBack()
}

function handleExplorationStarted() {
  selectedExplorationNodeId.value = null
  navigateBack()
}

function handleExplorationCancelled() {
  selectedExplorationNodeId.value = null
  navigateBack()
}

const colosseumBattleContext = ref(null)
const mawBattleContext = ref(null)

function transitionToBattle(setupFn) {
  if (battleTransitionActive.value) return
  if (setupFn) setupFn()
  battleTransitionActive.value = true
}

function onTransitionScreenSwap() {
  currentScreen.value = 'battle'
}

function onTransitionComplete() {
  battleTransitionActive.value = false
  battleStore.signalTransitionComplete()
}

function startBattle() {
  transitionToBattle(() => {
    genusLociBattleContext.value = null
    colosseumBattleContext.value = null
  })
}

function startColosseumBattle(bout) {
  transitionToBattle(() => {
    genusLociBattleContext.value = null
    colosseumBattleContext.value = { bout }
  })
}

function startMawBattle(battleConfig) {
  transitionToBattle(() => {
    genusLociBattleContext.value = null
    colosseumBattleContext.value = null
    mawBattleContext.value = battleConfig
  })
}

function startGenusLociBattle({ genusLociId, powerLevel }) {
  transitionToBattle(() => {
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
  })
}

// Intro flow handlers
function handleIntroStartBattle() {
  transitionToBattle(() => {
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
  })
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
  navigateReplace(screen, param)
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
        @back="navigateBack"
      />
      <MapRoomScreen
        v-else-if="currentScreen === 'map-room'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <GenusLociListScreen
        v-else-if="currentScreen === 'genus-loci-list'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <ColosseumScreen
        v-else-if="currentScreen === 'colosseum'"
        @navigate="navigate"
        @back="navigateBack"
        @startColosseumBattle="startColosseumBattle"
      />
      <MawScreen
        v-else-if="currentScreen === 'maw'"
        @navigate="navigate"
        @back="navigateBack"
        @startMawBattle="startMawBattle"
      />
      <PartyScreen
        v-else-if="currentScreen === 'party'"
        :placing-hero-id="placingHeroId"
        @navigate="navigate"
        @back="navigateBack"
      />
      <GachaScreen
        v-else-if="currentScreen === 'gacha'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <HeroesScreen
        v-else-if="currentScreen === 'heroes'"
        :initial-hero-id="initialHeroId"
        :auto-open-merge="autoOpenMerge"
        @navigate="navigate"
        @back="navigateBack"
      />
      <WorldMapScreen
        v-else-if="currentScreen === 'worldmap'"
        :initial-region-name="initialRegionName"
        @navigate="navigate"
        @back="navigateBack"
        @startBattle="startBattle"
        @startGenusLociBattle="startGenusLociBattle"
      />
      <BattleScreen
        v-else-if="currentScreen === 'battle'"
        :genus-loci-context="genusLociBattleContext"
        :colosseum-context="colosseumBattleContext"
        :maw-context="mawBattleContext"
        @navigate="handleBattleNavigate"
      />
      <GenusLociScreen
        v-else-if="currentScreen === 'genusLoci'"
        :selected-boss-id="selectedBossId"
        @navigate="navigate"
        @back="navigateBack"
        @startGenusLociBattle="startGenusLociBattle"
      />
      <InventoryScreen
        v-else-if="currentScreen === 'inventory'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <ShardsScreen
        v-else-if="currentScreen === 'shards'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <MergeScreen
        v-else-if="currentScreen === 'merge'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <AdminScreen
        v-else-if="currentScreen === 'admin'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <SettingsScreen
        v-else-if="currentScreen === 'settings'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <ExplorationsScreen
        v-else-if="currentScreen === 'explorations'"
        @navigate="navigate"
        @back="navigateBack"
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
        @back="navigateBack"
      />
      <ShopsScreen
        v-else-if="currentScreen === 'shops'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <CodexScreen
        v-else-if="currentScreen === 'codex'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <FieldGuideScreen
        v-else-if="currentScreen === 'field-guide'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <FieldGuideArticleScreen
        v-else-if="currentScreen === 'field-guide-article'"
        :topic-id="selectedTopicId"
        @navigate="navigate"
        @back="navigateBack"
      />
      <CompendiumScreen
        v-else-if="currentScreen === 'compendium'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <CompendiumRosterScreen
        v-else-if="currentScreen === 'compendium-roster'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <CompendiumBestiaryScreen
        v-else-if="currentScreen === 'compendium-bestiary'"
        @navigate="navigate"
        @back="navigateBack"
      />
      <CompendiumAtlasScreen
        v-else-if="currentScreen === 'compendium-atlas'"
        @navigate="navigate"
        @back="navigateBack"
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

      <!-- Battle transition overlay (doors) -->
      <BattleTransitionOverlay
        :active="battleTransitionActive"
        @screenSwap="onTransitionScreenSwap"
        @complete="onTransitionComplete"
      />
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

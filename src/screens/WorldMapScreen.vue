<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useQuestsStore, useHeroesStore, useInventoryStore, useGenusLociStore, useExplorationsStore, useGachaStore } from '../stores'
import { regions, superRegions, getQuestNode, getNodesByRegion, getRegion, getRegionsBySuperRegion } from '../data/quests/index.js'
import { getItem, getTokenForRegion } from '../data/items.js'
import { getEnemyTemplate } from '../data/enemies/index.js'
import { getGenusLoci } from '../data/genusLoci.js'
import MapCanvas from '../components/MapCanvas.vue'
import SuperRegionSelect from '../components/SuperRegionSelect.vue'
import EnemyDetailSheet from '../components/EnemyDetailSheet.vue'
import GameIcon from '../components/GameIcon.vue'
import { useTooltip } from '../composables/useTooltip.js'
import { useSwipeToDismiss } from '../composables/useSwipeToDismiss.js'

const { onPointerEnter, onPointerLeave } = useTooltip()

const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })
const enemyImages = import.meta.glob('../assets/enemies/*.png', { eager: true, import: 'default' })
const mapImages = import.meta.glob('../assets/maps/*.png', { eager: true, import: 'default' })

function getBossPortraitUrl(bossId) {
  if (!bossId) return null
  const portraitPath = `../assets/enemies/${bossId}_portrait.png`
  return enemyPortraits[portraitPath] || null
}

function getEnemyImageUrl(enemyId) {
  if (!enemyId) return null
  const portraitPath = `../assets/enemies/${enemyId}_portrait.png`
  if (enemyPortraits[portraitPath]) return enemyPortraits[portraitPath]
  const imagePath = `../assets/enemies/${enemyId}.png`
  return enemyImages[imagePath] || null
}

function getRegionMapImage(regionId) {
  const path = `../assets/maps/${regionId}.png`
  return mapImages[path] || null
}

const emit = defineEmits(['navigate', 'back', 'startBattle', 'startGenusLociBattle'])
const props = defineProps({
  initialRegionName: { type: String, default: null }
})

const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()
const inventoryStore = useInventoryStore()
const genusLociStore = useGenusLociStore()
const explorationsStore = useExplorationsStore()
const gachaStore = useGachaStore()

// Hero image loading
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroPortraitUrl(heroId) {
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}

// Multi-party system
const parties = computed(() => heroesStore.parties)
const activePartyId = computed(() => heroesStore.activePartyId)
const activeParty = computed(() => heroesStore.activeParty)

// Check if current party has heroes
const partyHasHeroes = computed(() => {
  return activeParty.value?.slots.some(s => s !== null) ?? false
})

function switchToPrevParty() {
  const currentIndex = parties.value.findIndex(p => p.id === activePartyId.value)
  const prevIndex = currentIndex <= 0 ? parties.value.length - 1 : currentIndex - 1
  heroesStore.setActiveParty(parties.value[prevIndex].id)
}

function switchToNextParty() {
  const currentIndex = parties.value.findIndex(p => p.id === activePartyId.value)
  const nextIndex = currentIndex >= parties.value.length - 1 ? 0 : currentIndex + 1
  heroesStore.setActiveParty(parties.value[nextIndex].id)
}

function getActivePartyPreview() {
  if (!activeParty.value) return []
  return activeParty.value.slots.map(instanceId => {
    if (!instanceId) return null
    return heroesStore.getHeroFull(instanceId)
  })
}

const selectedNode = ref(null)
const selectedRegion = ref(null) // null = show region list, string = show map
const selectedSuperRegion = ref(null)
const showTokenResults = ref(false)
const tokenResults = ref(null)
const enemyDetailTarget = ref(null) // For EnemyDetailSheet (long-press)

// Refs for swipe-to-dismiss bottom sheets
const nodePreviewRef = ref(null)
const tokenResultsRef = ref(null)

// Swipe-to-dismiss for node preview
const nodePreviewIsOpen = computed(() => selectedNode.value !== null)
useSwipeToDismiss({
  elementRef: nodePreviewRef,
  isOpen: nodePreviewIsOpen,
  onClose: () => { selectedNode.value = null }
})

// Swipe-to-dismiss for token results
useSwipeToDismiss({
  elementRef: tokenResultsRef,
  isOpen: showTokenResults,
  onClose: () => {
    showTokenResults.value = false
    tokenResults.value = null
    selectedNode.value = null
  }
})

// Long-press detection for enemy info sheet
let enemyLongPressTimer = null
let enemyLongPressTarget = null
const LONG_PRESS_DURATION = 500

function onEnemyLongPressStart(enemy, event) {
  enemyLongPressTarget = enemy
  enemyLongPressTimer = setTimeout(() => {
    if (enemyLongPressTarget === enemy) {
      enemyDetailTarget.value = {
        template: enemy,
        currentHp: enemy.stats.hp,
        maxHp: enemy.stats.hp,
        stats: enemy.stats,
        statusEffects: []
      }
    }
    enemyLongPressTimer = null
  }, LONG_PRESS_DURATION)
}

function onEnemyLongPressEnd() {
  if (enemyLongPressTimer) {
    clearTimeout(enemyLongPressTimer)
    enemyLongPressTimer = null
  }
  enemyLongPressTarget = null
}

function closeEnemyDetail() {
  enemyDetailTarget.value = null
}

// Combine regular unlocked nodes with unlocked exploration nodes
const allUnlockedNodes = computed(() => {
  const explorationNodeIds = explorationsStore.unlockedExplorations.map(node => node.id)
  return [...questsStore.unlockedNodes, ...explorationNodeIds]
})

// Get token for selected node (only for completed regular quests)
const selectedNodeToken = computed(() => {
  if (!selectedNode.value) return null
  if (!selectedNode.value.isCompleted) return null
  if (selectedNode.value.isGenusLoci || selectedNode.value.isExploration) return null

  const token = getTokenForRegion(selectedNode.value.region)
  if (!token) return null

  return {
    ...token,
    count: inventoryStore.getItemCount(token.id)
  }
})

// Track if we should skip the region reset on super-region change
let skipNextRegionReset = false

// Restore last visited region on mount
onMounted(() => {
  // If navigated with a specific region (e.g. from inventory token)
  if (props.initialRegionName) {
    const targetRegion = regions.find(r => r.name === props.initialRegionName)
    if (targetRegion) {
      skipNextRegionReset = true
      if (targetRegion.superRegion) {
        selectedSuperRegion.value = targetRegion.superRegion
      }
      selectedRegion.value = targetRegion.id
    }
    return
  }

  // Otherwise restore from lastVisitedRegion (e.g. returning from battle)
  const savedRegion = questsStore.lastVisitedRegion
  if (savedRegion) {
    const regionData = getRegion(savedRegion)
    if (regionData) {
      skipNextRegionReset = true
      selectedSuperRegion.value = regionData.superRegion
      selectedRegion.value = savedRegion
    }
  }
})

// Check if we should show super-region selection
const showSuperRegionSelect = computed(() => {
  return questsStore.unlockedSuperRegions.length > 1
})

// Auto-select super-region if only one is unlocked
watchEffect(() => {
  if (questsStore.unlockedSuperRegions.length === 1) {
    selectedSuperRegion.value = questsStore.unlockedSuperRegions[0].id
  } else if (questsStore.unlockedSuperRegions.length > 1 && !selectedSuperRegion.value) {
    // Multiple unlocked but none selected - show selection screen
    selectedSuperRegion.value = null
  }
})

// Filter regions by selected super-region, only show regions with unlocked nodes
const filteredRegions = computed(() => {
  if (!selectedSuperRegion.value) return []
  const srRegions = getRegionsBySuperRegion(selectedSuperRegion.value)
  return srRegions.filter(region => {
    const regionNodes = getNodesByRegion(region.name)
    return regionNodes.some(node => questsStore.unlockedNodes.includes(node.id))
  })
})

// Get the full region object
const currentRegion = computed(() => {
  if (!selectedRegion.value) return null
  return getRegion(selectedRegion.value)
})

// Get all nodes for the current region
const currentRegionNodes = computed(() => {
  if (!currentRegion.value) return []
  return getNodesByRegion(currentRegion.value.name)
})

const regionProgress = computed(() => {
  if (!selectedRegion.value) return { completed: 0, total: 0 }
  return questsStore.regionProgress[selectedRegion.value] || { completed: 0, total: 0 }
})

// Get progress for a specific region (for region list)
function getRegionProgress(regionId) {
  return questsStore.regionProgress[regionId] || { completed: 0, total: 0 }
}

// Determine the "next" region - first incomplete region by order
const nextRegionId = computed(() => {
  for (const region of filteredRegions.value) {
    const progress = getRegionProgress(region.id)
    if (progress.completed < progress.total) {
      return region.id
    }
  }
  return null
})

// Get region state for styling
function getRegionState(regionId) {
  const progress = getRegionProgress(regionId)
  if (progress.completed >= progress.total && progress.total > 0) {
    return 'completed'
  }
  if (regionId === nextRegionId.value) {
    return 'next'
  }
  return 'in-progress'
}

function getRegionBackground(region) {
  const path = `../assets/battle_backgrounds/${region.startNode}.png`
  return battleBackgrounds[path] || null
}

// Clear selection when changing regions
watch(selectedRegion, () => {
  selectedNode.value = null
})

// Reset region when super-region changes (but not when restoring saved region)
watch(selectedSuperRegion, (newSuperRegion) => {
  if (skipNextRegionReset) {
    skipNextRegionReset = false
    return
  }
  if (newSuperRegion) {
    // Clear region selection to show region list
    selectedRegion.value = null
  }
})

function selectNode(node) {
  if (selectedNode.value?.id === node.id) {
    return
  }

  // For genusLoci nodes, enrich with boss data
  if (node.type === 'genusLoci') {
    const bossData = getGenusLoci(node.genusLociId)
    const keyCount = inventoryStore.getItemCount(bossData?.keyItemId)
    const isUnlocked = genusLociStore.isUnlocked(node.genusLociId)
    const highestCleared = genusLociStore.getHighestCleared(node.genusLociId)

    selectedNode.value = {
      ...node,
      isCompleted: highestCleared >= (bossData?.maxPowerLevel || 20),
      isGenusLoci: true,
      bossData,
      keyCount,
      isUnlocked,
      highestCleared
    }
  } else if (node.type === 'exploration') {
    const activeExploration = explorationsStore.activeExplorations[node.id]
    const config = node.explorationConfig

    let progress = null
    if (activeExploration) {
      const elapsed = Date.now() - activeExploration.startedAt
      const timeRemainingMs = Math.max(0, (config.timeLimit * 60 * 1000) - elapsed)
      const fightsRemaining = Math.max(0, config.requiredFights - activeExploration.fightCount)

      progress = {
        fightCount: activeExploration.fightCount,
        requiredFights: config.requiredFights,
        fightsRemaining,
        timeRemainingMs,
        timeRemainingMinutes: Math.ceil(timeRemainingMs / 60000),
        partyRequestMet: activeExploration.partyRequestMet,
        isComplete: timeRemainingMs <= 0 || fightsRemaining <= 0
      }
    }

    selectedNode.value = {
      ...node,
      isExploration: true,
      isActive: !!activeExploration,
      explorationConfig: config,
      progress
    }
  } else {
    selectedNode.value = {
      ...node,
      isCompleted: questsStore.completedNodes.includes(node.id)
    }
  }
}

function clearSelection() {
  selectedNode.value = null
}

function handleRegionNavigate({ targetRegion }) {
  // Handle cross-super-region navigation
  const targetSuperRegion = targetRegion.superRegion
  if (targetSuperRegion !== selectedSuperRegion.value) {
    skipNextRegionReset = true
    selectedSuperRegion.value = targetSuperRegion
  }

  selectedNode.value = null
  selectedRegion.value = targetRegion.id
}

function getNodeEnemies(node) {
  const enemyIds = new Set()
  for (const battle of node.battles) {
    for (const enemyId of battle.enemies) {
      enemyIds.add(enemyId)
    }
  }
  return Array.from(enemyIds).map(id => getEnemyTemplate(id))
}

function startQuest() {
  if (!selectedNode.value) return
  if (!heroesStore.partyIsFull && heroesStore.party.filter(Boolean).length === 0) {
    alert('You need at least one hero in your party!')
    return
  }

  const partyState = {}
  for (const instanceId of heroesStore.party.filter(Boolean)) {
    const stats = heroesStore.getHeroStats(instanceId)
    partyState[instanceId] = {
      currentHp: stats.hp,
      currentMp: Math.floor(stats.mp * 0.3)
    }
  }

  questsStore.startRun(selectedNode.value.id, partyState)
  emit('startBattle')
}

function goToSuperRegionSelect() {
  selectedSuperRegion.value = null
  selectedRegion.value = null
  selectedNode.value = null
}

function goToRegionList() {
  selectedRegion.value = null
  selectedNode.value = null
}

function selectRegion(regionId) {
  selectedRegion.value = regionId
}

function startGenusLociChallenge() {
  if (!selectedNode.value?.isGenusLoci) return
  const { bossData, keyCount, isUnlocked, genusLociId } = selectedNode.value

  if (keyCount <= 0) {
    alert('You need a key to challenge this boss!')
    return
  }

  if (!heroesStore.partyIsFull && heroesStore.party.filter(Boolean).length === 0) {
    alert('You need at least one hero in your party!')
    return
  }

  if (isUnlocked) {
    emit('navigate', 'genusLoci', genusLociId)
    return
  }

  emit('startGenusLociBattle', {
    genusLociId,
    powerLevel: 1
  })
}

function goToExplorationDetail() {
  if (!selectedNode.value?.isExploration) return
  emit('navigate', 'exploration-detail', selectedNode.value.id)
}

function useToken() {
  if (!selectedNode.value || !selectedNodeToken.value) return

  const result = questsStore.collectWithToken(selectedNode.value.id)
  if (result.success) {
    gachaStore.addGems(result.rewards.gems)
    gachaStore.addGold(result.rewards.gold)
    heroesStore.addExpToParty(result.rewards.exp)

    tokenResults.value = result.rewards
    showTokenResults.value = true
  }
}

function closeTokenResults() {
  showTokenResults.value = false
  tokenResults.value = null
  selectedNode.value = null
}

// Get current super-region data
const currentSuperRegion = computed(() => {
  if (!selectedSuperRegion.value) return null
  return superRegions.find(sr => sr.id === selectedSuperRegion.value)
})

// Total cleared for trophy display
const totalCleared = computed(() => {
  return questsStore.completedNodeCount
})
</script>

<template>
  <div class="worldmap-screen">
    <!-- Animated Background -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-pattern"></div>
      <div class="bg-vignette"></div>
    </div>

    <!-- Super-Region Selection (when multiple are unlocked) -->
    <SuperRegionSelect
      v-if="showSuperRegionSelect && !selectedSuperRegion"
      :super-regions="superRegions"
      :unlocked-super-regions="questsStore.unlockedSuperRegions"
      :super-region-progress="questsStore.superRegionProgress"
      @select="selectedSuperRegion = $event"
      @back="emit('back')"
    />

    <!-- Region List View (Screen 1) -->
    <div v-else-if="!selectedRegion" class="region-list-view">
      <header class="floating-header">
        <button class="back-button" @click="showSuperRegionSelect ? goToSuperRegionSelect() : emit('back')">
          <span class="back-arrow">&larr;</span>
        </button>
        <h1 class="header-title">{{ currentSuperRegion?.name || 'World Map' }}</h1>
        <div class="trophy-badge">
          <span class="trophy-icon">🏆</span>
          <span class="trophy-count">{{ totalCleared }}</span>
        </div>
      </header>

      <div class="region-cards-scroll">
        <button
          v-for="region in filteredRegions"
          :key="region.id"
          :class="['region-card', `region-${getRegionState(region.id)}`]"
          @click="selectRegion(region.id)"
        >
          <div
            class="region-card-bg"
            :style="getRegionBackground(region) ? { backgroundImage: `url(${getRegionBackground(region)})` } : {}"
          ></div>
          <div class="region-card-overlay"></div>
          <div class="region-card-content">
            <span class="region-name">{{ region.name }}</span>
            <span class="region-progress-text">
              {{ getRegionProgress(region.id).completed }}/{{ getRegionProgress(region.id).total }} cleared
            </span>
            <span v-if="getRegionState(region.id) === 'next'" class="next-badge">Continue Journey</span>
          </div>
          <div v-if="getRegionState(region.id) === 'completed'" class="region-card-decoration">
            <span class="check-icon">✓</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Region Map View (Screen 2) -->
    <div v-else class="region-map-view">
      <!-- Floating Header -->
      <header class="map-floating-header">
        <button class="back-button-floating" @click="goToRegionList">
          <span class="back-arrow">&larr;</span>
        </button>
        <h1 class="region-title">{{ currentRegion?.name }}</h1>
        <span class="region-progress-badge">
          {{ regionProgress.completed }}/{{ regionProgress.total }}
        </span>
      </header>

      <!-- Full-Screen Map -->
      <MapCanvas
        v-if="currentRegion"
        :region="currentRegion"
        :nodes="currentRegionNodes"
        :unlocked-nodes="allUnlockedNodes"
        :completed-nodes="questsStore.completedNodes"
        :selected-node-id="selectedNode?.id"
        @select-node="selectNode"
        @navigate-region="handleRegionNavigate"
      />
    </div>

    <!-- Node Preview Modal -->
    <Transition name="slide-up">
      <aside v-if="selectedNode" ref="nodePreviewRef" class="node-preview">
        <div class="preview-handle"></div>

        <div class="preview-header">
          <div class="preview-title-area">
            <h2>{{ selectedNode.name }}</h2>
            <span v-if="selectedNode.isCompleted" class="completed-badge">Cleared</span>
            <span v-if="selectedNode.battles?.length && (selectedNode.isGenusLoci || selectedNode.isExploration)" class="battle-count-badge">{{ selectedNode.battles.length }}</span>
          </div>
          <button class="close-preview" @click="clearSelection">×</button>
        </div>

        <!-- Genus Loci Preview -->
        <div v-if="selectedNode.isGenusLoci" class="preview-body genus-loci-preview">
          <div class="boss-info-card">
            <div class="boss-icon">
              <img
                v-if="getBossPortraitUrl(selectedNode.genusLociId)"
                :src="getBossPortraitUrl(selectedNode.genusLociId)"
                :alt="selectedNode.bossData?.name"
                class="boss-portrait"
              />
              <span v-else>👹</span>
            </div>
            <div class="boss-details">
              <span class="boss-name">{{ selectedNode.bossData?.name }}</span>
              <span class="boss-desc">{{ selectedNode.bossData?.description }}</span>
            </div>
          </div>

          <div class="key-status-card">
            <span class="key-icon">🔑</span>
            <span class="key-count" :class="{ 'no-keys': selectedNode.keyCount <= 0 }">
              {{ selectedNode.keyCount }}
            </span>
            <span class="key-label">Keys Available</span>
          </div>

          <div v-if="selectedNode.isUnlocked" class="progress-info">
            <span class="progress-label">Highest Cleared:</span>
            <span class="progress-value">Lv.{{ selectedNode.highestCleared }} / {{ selectedNode.bossData?.maxPowerLevel }}</span>
          </div>

          <div class="rewards-section">
            <h4 class="section-label">
              <span class="label-line"></span>
              <span>Rewards</span>
              <span class="label-line"></span>
            </h4>
            <div class="rewards-grid">
              <div v-if="selectedNode.bossData?.currencyRewards?.base?.gold" class="reward-card">
                <span class="reward-icon">🪙</span>
                <div class="reward-info">
                  <span class="reward-label">Gold</span>
                  <span class="reward-value gold">{{ selectedNode.bossData.currencyRewards.base.gold }}+</span>
                </div>
              </div>
              <div v-if="selectedNode.bossData?.currencyRewards?.base?.gems" class="reward-card">
                <span class="reward-icon">💎</span>
                <div class="reward-info">
                  <span class="reward-label">Gems</span>
                  <span class="reward-value">{{ selectedNode.bossData.currencyRewards.base.gems }}+</span>
                </div>
              </div>
              <div v-if="!selectedNode.isUnlocked && selectedNode.bossData?.firstClearBonus?.gems" class="reward-card">
                <span class="reward-icon">💎</span>
                <div class="reward-info">
                  <span class="reward-label">First Clear</span>
                  <span class="reward-value">+{{ selectedNode.bossData.firstClearBonus.gems }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="start-quest-btn genus-loci-btn"
            :disabled="selectedNode.keyCount <= 0"
            @click="startGenusLociChallenge"
          >
            <span class="btn-icon">
              <img
                v-if="getBossPortraitUrl(selectedNode.genusLociId)"
                :src="getBossPortraitUrl(selectedNode.genusLociId)"
                :alt="selectedNode.bossData?.name"
                class="btn-portrait"
              />
              <span v-else>👹</span>
            </span>
            <span v-if="selectedNode.keyCount <= 0">No Keys</span>
            <span v-else-if="selectedNode.isUnlocked">Select Level</span>
            <span v-else>Challenge (🔑 x1)</span>
          </button>
        </div>

        <!-- Exploration Preview -->
        <div v-else-if="selectedNode.isExploration" class="preview-body exploration-preview">
          <div class="exploration-info-card">
            <div class="exploration-icon">🧭</div>
            <div class="exploration-details">
              <span class="exploration-name">{{ selectedNode.name }}</span>
              <span class="exploration-desc">Send heroes on an idle expedition</span>
            </div>
          </div>

          <div v-if="selectedNode.isActive" class="exploration-progress-card">
            <div class="progress-header">
              <span class="progress-icon">⏳</span>
              <span class="progress-title">In Progress</span>
            </div>
            <div class="progress-stats">
              <div class="progress-stat">
                <span class="stat-label">Fights</span>
                <span class="stat-value">{{ selectedNode.progress.fightCount }} / {{ selectedNode.progress.requiredFights }}</span>
              </div>
              <div class="progress-stat">
                <span class="stat-label">Time Left</span>
                <span class="stat-value">{{ selectedNode.progress.timeRemainingMinutes }} min</span>
              </div>
            </div>
            <div class="progress-bar-container">
              <div
                class="exploration-progress-bar"
                :style="{ width: Math.min(100, (selectedNode.progress.fightCount / selectedNode.progress.requiredFights) * 100) + '%' }"
              ></div>
            </div>
            <div v-if="selectedNode.progress.partyRequestMet" class="bonus-indicator">
              <span class="bonus-icon">✨</span>
              <span class="bonus-text">+10% Bonus Active</span>
            </div>
          </div>

          <div v-else class="exploration-requirements">
            <div class="requirement-row">
              <span class="requirement-icon">
                <GameIcon name="sword" size="sm" inline />
              </span>
              <span class="requirement-text">{{ selectedNode.explorationConfig.requiredFights }} fights required</span>
            </div>
            <div class="requirement-row">
              <span class="requirement-icon">⏱️</span>
              <span class="requirement-text">{{ selectedNode.explorationConfig.timeLimit }} min time limit</span>
            </div>
            <div v-if="selectedNode.explorationConfig.partyRequest" class="requirement-row bonus-row">
              <span class="requirement-icon">✨</span>
              <span class="requirement-text">Bonus: {{ selectedNode.explorationConfig.partyRequest.description }}</span>
            </div>
          </div>

          <div class="rewards-section">
            <h4 class="section-label">
              <span class="label-line"></span>
              <span>Rewards</span>
              <span class="label-line"></span>
            </h4>
            <div class="rewards-grid">
              <div class="reward-card">
                <span class="reward-icon">🪙</span>
                <div class="reward-info">
                  <span class="reward-label">Gold</span>
                  <span class="reward-value gold">{{ selectedNode.explorationConfig.rewards.gold }}</span>
                </div>
              </div>
              <div class="reward-card">
                <span class="reward-icon">💎</span>
                <div class="reward-info">
                  <span class="reward-label">Gems</span>
                  <span class="reward-value">{{ selectedNode.explorationConfig.rewards.gems }}</span>
                </div>
              </div>
              <div class="reward-card">
                <span class="reward-icon">⭐</span>
                <div class="reward-info">
                  <span class="reward-label">XP</span>
                  <span class="reward-value">{{ selectedNode.explorationConfig.rewards.xp }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="start-quest-btn exploration-btn"
            @click="goToExplorationDetail"
          >
            <span class="btn-icon">🧭</span>
            <span v-if="selectedNode.isActive && selectedNode.progress.isComplete">Claim Rewards</span>
            <span v-else-if="selectedNode.isActive">View Progress</span>
            <span v-else>Start Exploration</span>
          </button>
        </div>

        <!-- Regular Quest Preview -->
        <div v-else class="preview-body preview-body-compact">
          <div class="quest-detail-columns">
            <div class="quest-info-left">
              <div class="quest-fight-count">
                <GameIcon name="sword" size="sm" inline class="fight-icon" />
                <span class="fight-number">{{ selectedNode.battles.length }}</span>
                <span class="fight-label">fights</span>
              </div>

              <div class="quest-enemies-box">
                <span class="box-label">Enemies</span>
                <div class="enemy-portraits-row">
                  <div
                    v-for="enemy in getNodeEnemies(selectedNode)"
                    :key="enemy.id"
                    class="enemy-portrait-wrap"
                    @pointerenter="onPointerEnter($event, `${enemy.name}\n❤️ ${enemy.stats.hp} HP`, 200)"
                    @pointerleave="onPointerLeave()"
                    @touchstart.passive="onEnemyLongPressStart(enemy, $event)"
                    @touchend="onEnemyLongPressEnd"
                    @touchmove="onEnemyLongPressEnd"
                    @mousedown="onEnemyLongPressStart(enemy, $event)"
                    @mouseup="onEnemyLongPressEnd"
                    @mouseleave="onEnemyLongPressEnd"
                  >
                    <img
                      v-if="getEnemyImageUrl(enemy.id)"
                      :src="getEnemyImageUrl(enemy.id)"
                      :alt="enemy.name"
                      class="enemy-portrait-img"
                    />
                    <div v-else class="enemy-portrait-fallback">
                      <GameIcon name="skull" size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="quest-rewards-box">
              <span class="box-label">Rewards</span>
              <div class="reward-line-items">
                <div v-if="selectedNode.rewards.gems" class="reward-line">
                  <span class="reward-line-icon">💎</span>
                  <span class="reward-line-label">Gems</span>
                  <span class="reward-line-value">{{ selectedNode.rewards.gems }}</span>
                </div>
                <div v-if="selectedNode.rewards.gold" class="reward-line">
                  <span class="reward-line-icon">🪙</span>
                  <span class="reward-line-label">Gold</span>
                  <span class="reward-line-value gold">{{ selectedNode.rewards.gold }}</span>
                </div>
                <div v-if="selectedNode.rewards.exp" class="reward-line">
                  <span class="reward-line-icon">⭐</span>
                  <span class="reward-line-label">XP</span>
                  <span class="reward-line-value">{{ selectedNode.rewards.exp }}</span>
                </div>
              </div>
              <div v-if="!selectedNode.isCompleted && selectedNode.firstClearBonus" class="first-clear-line">
                +{{ selectedNode.firstClearBonus.gems }} 💎 first clear
              </div>
            </div>
          </div>

          <!-- Party Selector -->
          <div class="party-selector">
            <button class="party-arrow" @click.stop="switchToPrevParty">&lsaquo;</button>
            <div class="party-info">
              <span class="party-name">{{ activeParty?.name }}</span>
              <div class="party-mini-preview">
                <template v-for="(hero, idx) in getActivePartyPreview()" :key="idx">
                  <div v-if="hero" class="mini-hero">
                    <img
                      v-if="getHeroPortraitUrl(hero.templateId)"
                      :src="getHeroPortraitUrl(hero.templateId)"
                      :alt="hero.template?.name"
                    />
                    <span v-else class="mini-hero-placeholder">{{ hero.template?.name?.[0] || '?' }}</span>
                  </div>
                  <div v-else class="mini-hero empty"></div>
                </template>
              </div>
            </div>
            <button class="party-arrow" @click.stop="switchToNextParty">&rsaquo;</button>
          </div>

          <div :class="['quest-buttons', { 'has-token': selectedNodeToken }]">
            <button
              v-if="selectedNodeToken"
              class="use-token-btn"
              :disabled="selectedNodeToken.count <= 0"
              @click="useToken"
            >
              <span class="btn-icon">🎫</span>
              <span v-if="selectedNodeToken.count > 0">Use Token ({{ selectedNodeToken.count }})</span>
              <span v-else>No Token</span>
            </button>

            <button
              class="start-quest-btn"
              :disabled="!partyHasHeroes"
              @click="startQuest"
            >
              <span class="btn-icon">
                <GameIcon name="sword" size="sm" inline />
              </span>
              <span>{{ selectedNode.isCompleted ? 'Replay Quest' : 'Start Quest' }}</span>
            </button>
          </div>
        </div>
      </aside>
    </Transition>

    <!-- Token Results Modal -->
    <Transition name="fade">
      <div v-if="showTokenResults" class="token-results-backdrop" @click="closeTokenResults"></div>
    </Transition>
    <Transition name="slide-up">
      <div v-if="showTokenResults && tokenResults" ref="tokenResultsRef" class="token-results-modal">
        <div class="token-results-header">
          <h3>Token Rewards Collected</h3>
          <span class="token-node-name">{{ selectedNode?.name }}</span>
        </div>

        <div class="token-results-body">
          <div class="token-currency-rewards">
            <div class="currency-item">
              <span class="currency-icon">🪙</span>
              <span class="currency-value">{{ tokenResults.gold }}</span>
            </div>
            <div class="currency-item">
              <span class="currency-icon">💎</span>
              <span class="currency-value">{{ tokenResults.gems }}</span>
            </div>
            <div class="currency-item">
              <span class="currency-icon">⭐</span>
              <span class="currency-value">{{ tokenResults.exp }} XP</span>
            </div>
          </div>

          <div v-if="tokenResults.items && tokenResults.items.length > 0" class="token-item-drops">
            <h4>Items</h4>
            <div class="token-items-grid">
              <div v-for="(item, index) in tokenResults.items" :key="index" class="token-item">
                <span class="item-name">{{ getItem(item.itemId)?.name }}</span>
                <span class="item-count">x{{ item.count }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-items-dropped">
            No items dropped
          </div>
        </div>

        <div class="token-results-actions">
          <button class="collect-btn" @click="closeTokenResults">
            Collect
          </button>
          <button
            v-if="selectedNodeToken && selectedNodeToken.count > 0"
            class="spend-token-btn"
            @click="useToken"
          >
            🎫 Spend Token ({{ selectedNodeToken.count }})
          </button>
        </div>
      </div>
    </Transition>

    <!-- Backdrop for modal -->
    <Transition name="fade">
      <div v-if="selectedNode" class="modal-backdrop" @click="clearSelection"></div>
    </Transition>

    <!-- Enemy Detail Sheet (long-press on enemy portraits) -->
    <EnemyDetailSheet
      :enemy="enemyDetailTarget"
      :isOpen="enemyDetailTarget !== null"
      :isKnown="true"
      @close="closeEnemyDetail"
    />
  </div>
</template>

<style scoped>
.worldmap-screen {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    #1a1a2e 0%,
    #16213e 50%,
    #1a1a2e 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
  background-size: 32px 32px;
}

.bg-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
}

/* ========================================
   REGION LIST VIEW (Screen 1)
   ======================================== */
.region-list-view {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.floating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  padding-top: calc(20px + env(safe-area-inset-top, 0px));
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: translateX(-2px);
}

.back-arrow {
  font-size: 1.3rem;
}

.header-title {
  font-size: 1.4rem;
  color: #f1f5f9;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.trophy-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 8px 14px;
}

.trophy-icon {
  font-size: 1rem;
}

.trophy-count {
  color: #fbbf24;
  font-weight: 700;
  font-size: 1rem;
}

/* Region Cards */
.region-cards-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 100px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.region-card {
  position: relative;
  width: 100%;
  min-height: 120px;
  border: none;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: none;
  padding: 0;
  text-align: left;
  /* Parchment-style torn edges */
  clip-path: polygon(
    0% 2%, 4% 0%, 8% 1%, 12% 0%, 16% 2%, 20% 0%, 24% 1%, 28% 0%, 32% 2%,
    36% 0%, 40% 1%, 44% 0%, 48% 2%, 52% 0%, 56% 1%, 60% 0%, 64% 2%,
    68% 0%, 72% 1%, 76% 0%, 80% 2%, 84% 0%, 88% 1%, 92% 0%, 96% 2%, 100% 0%,
    100% 98%, 96% 100%, 92% 99%, 88% 100%, 84% 98%, 80% 100%, 76% 99%, 72% 100%, 68% 98%,
    64% 100%, 60% 99%, 56% 100%, 52% 98%, 48% 100%, 44% 99%, 40% 100%, 36% 98%,
    32% 100%, 28% 99%, 24% 100%, 20% 98%, 16% 100%, 12% 99%, 8% 100%, 4% 98%, 0% 100%
  );
}

.region-card:active {
  transform: scale(0.98);
}

.region-card-bg {
  position: absolute;
  inset: 0;
  background-color: #3d3522;
  background-size: cover;
  background-position: center right;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.region-card-overlay {
  position: absolute;
  inset: 0;
  /* Left-to-right gradient: solid for text legibility, fading to reveal art */
  background: linear-gradient(
    90deg,
    rgba(61, 53, 34, 0.95) 0%,
    rgba(61, 53, 34, 0.85) 40%,
    rgba(61, 53, 34, 0.4) 70%,
    rgba(61, 53, 34, 0.2) 100%
  );
  transition: background 0.3s ease;
}

.region-card-content {
  position: relative;
  z-index: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
  justify-content: center;
}

.region-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f5f0e1;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  font-family: Georgia, 'Times New Roman', serif;
}

.region-progress-text {
  font-size: 0.85rem;
  color: rgba(245, 240, 225, 0.7);
  font-style: italic;
}

.region-card-decoration {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.check-icon {
  font-size: 1.5rem;
  color: #22c55e;
  text-shadow: 0 2px 8px rgba(34, 197, 94, 0.5);
}

/* Region State: Completed */
.region-card.region-completed {
  opacity: 0.7;
}

.region-card.region-completed .region-card-bg {
  opacity: 0.3;
  filter: grayscale(40%);
}

.region-card.region-completed .region-name {
  color: rgba(245, 240, 225, 0.7);
}

/* Region State: Next (call to action) */
.region-card.region-next {
  border: 2px solid rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.15);
}

.region-card.region-next .region-card-bg {
  opacity: 0.7;
}

.region-card.region-next .region-card-overlay {
  background: linear-gradient(
    90deg,
    rgba(61, 53, 34, 0.9) 0%,
    rgba(61, 53, 34, 0.7) 40%,
    rgba(61, 53, 34, 0.3) 70%,
    rgba(61, 53, 34, 0.1) 100%
  );
}

.next-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 3px 10px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #1a1a1a;
  font-size: 0.7rem;
  font-weight: 700;
  font-style: normal;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Region State: In Progress (default, no special styling needed) */
.region-card.region-in-progress {
  /* Default state */
}

/* ========================================
   REGION MAP VIEW (Screen 2)
   ======================================== */
.region-map-view {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.map-floating-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  padding-top: calc(8px + env(safe-area-inset-top, 0px));
  pointer-events: none;
}

.map-floating-header > * {
  pointer-events: auto;
}

.back-button-floating {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: #f3f4f6;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.back-button-floating:hover {
  background: rgba(0, 0, 0, 0.7);
}

.region-title {
  flex: 1;
  font-size: 1.2rem;
  font-weight: 600;
  color: #f3f4f6;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.region-progress-badge {
  background: rgba(0, 0, 0, 0.5);
  color: #fbbf24;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Modal Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

/* Node Preview Panel */
.node-preview {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  border-radius: 24px 24px 0 0;
  padding: 12px 20px 24px;
  max-height: 60vh;
  overflow-y: auto;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
  z-index: 20;
}

.preview-handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.preview-title-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-header h2 {
  color: #f3f4f6;
  margin: 0;
  font-size: 1.4rem;
}

.completed-badge {
  display: inline-block;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  width: fit-content;
}

.battle-count-badge {
  font-size: 0.8rem;
  color: #fef3c7;
  background: rgba(251, 191, 36, 0.2);
  padding: 3px 8px;
  border-radius: 8px;
}

.close-preview {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #9ca3af;
  font-size: 1.8rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.2s ease;
}

.close-preview:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #f3f4f6;
}

/* Section Labels */
.section-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9ca3af;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
}

/* Rewards Section */
.rewards-section {
  margin-bottom: 24px;
}

.rewards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.reward-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.reward-icon {
  font-size: 1.5rem;
}

.reward-info {
  display: flex;
  flex-direction: column;
}

.reward-label {
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.reward-value {
  color: #f3f4f6;
  font-weight: 600;
  font-size: 1.1rem;
}

.reward-value.gold {
  color: #f59e0b;
}

/* Compact Quest Layout */
.preview-body-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quest-detail-columns {
  display: flex;
  gap: 12px;
}

.quest-info-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.quest-fight-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #d1d5db;
}

.fight-icon {
  font-size: 1rem;
}

.fight-number {
  font-weight: 700;
  color: #f3f4f6;
}

.fight-label {
  color: #9ca3af;
}

.quest-enemies-box,
.quest-rewards-box {
  position: relative;
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 10px;
  padding: 14px 10px 10px;
  background: rgba(31, 41, 55, 0.4);
}

.box-label {
  position: absolute;
  top: -8px;
  left: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #1a2332;
  padding: 0 6px;
}

.enemy-portraits-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.enemy-portrait-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ef4444;
  cursor: pointer;
  transition: transform 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.enemy-portrait-wrap:hover {
  transform: scale(1.15);
  border-color: #fbbf24;
}

.enemy-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  pointer-events: none;
}

.enemy-portrait-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  background: linear-gradient(135deg, #5f1e1e 0%, #dc2626 100%);
}

.quest-rewards-box {
  flex: 1;
  min-width: 0;
}

.reward-line-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reward-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.reward-line-icon {
  font-size: 0.9rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.reward-line-label {
  color: #9ca3af;
  flex: 1;
}

.reward-line-value {
  font-weight: 700;
  color: #f3f4f6;
}

.reward-line-value.gold {
  color: #f59e0b;
}

.first-clear-line {
  font-size: 0.75rem;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  margin-top: 8px;
  text-align: center;
}

/* Quest Buttons Container */
.quest-buttons {
  display: flex;
  gap: 10px;
}

.quest-buttons.has-token .start-quest-btn,
.quest-buttons.has-token .use-token-btn {
  flex: 1;
}

/* Start Quest Button */
.start-quest-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.quest-buttons.has-token .start-quest-btn {
  width: auto;
}

.start-quest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.start-quest-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-portrait {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

/* Genus Loci Preview */
.genus-loci-preview .boss-info-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(107, 33, 168, 0.2) 100%);
  border: 1px solid rgba(147, 51, 234, 0.4);
  border-radius: 12px;
  margin-bottom: 16px;
}

.genus-loci-preview .boss-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.3);
  border-radius: 12px;
  flex-shrink: 0;
  overflow: hidden;
}

.genus-loci-preview .boss-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.genus-loci-preview .boss-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.genus-loci-preview .boss-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.genus-loci-preview .boss-desc {
  font-size: 0.85rem;
  color: #9ca3af;
}

.genus-loci-preview .key-status-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.genus-loci-preview .key-icon {
  font-size: 1.3rem;
}

.genus-loci-preview .key-count {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fbbf24;
}

.genus-loci-preview .key-count.no-keys {
  color: #ef4444;
}

.genus-loci-preview .key-label {
  color: #6b7280;
  font-size: 0.85rem;
}

.genus-loci-preview .progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
}

.genus-loci-preview .progress-label {
  color: #9ca3af;
  font-size: 0.85rem;
}

.genus-loci-preview .progress-value {
  color: #22c55e;
  font-weight: 600;
}

.start-quest-btn.genus-loci-btn {
  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
}

.start-quest-btn.genus-loci-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(147, 51, 234, 0.5);
}

.start-quest-btn.genus-loci-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

/* Exploration Preview */
.exploration-preview .exploration-info-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 12px;
  margin-bottom: 16px;
}

.exploration-preview .exploration-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  flex-shrink: 0;
}

.exploration-preview .exploration-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exploration-preview .exploration-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.exploration-preview .exploration-desc {
  font-size: 0.85rem;
  color: #9ca3af;
}

.exploration-preview .exploration-progress-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.exploration-preview .progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.exploration-preview .progress-icon {
  font-size: 1.2rem;
}

.exploration-preview .progress-title {
  font-size: 1rem;
  font-weight: 600;
  color: #22c55e;
}

.exploration-preview .progress-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.exploration-preview .progress-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.exploration-preview .stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
}

.exploration-preview .stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.exploration-preview .progress-bar-container {
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
}

.exploration-preview .exploration-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.exploration-preview .bonus-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
}

.exploration-preview .bonus-icon {
  font-size: 1rem;
}

.exploration-preview .bonus-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fbbf24;
}

.exploration-preview .exploration-requirements {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exploration-preview .requirement-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exploration-preview .requirement-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

.exploration-preview .requirement-text {
  color: #d1d5db;
  font-size: 0.9rem;
}

.exploration-preview .bonus-row {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.exploration-preview .bonus-row .requirement-text {
  color: #fbbf24;
}

.start-quest-btn.exploration-btn {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.start-quest-btn.exploration-btn:hover {
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
}

/* Use Token Button */
.use-token-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.use-token-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.use-token-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Token Results Modal */
.token-results-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
}

.token-results-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 360px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 20px;
  z-index: 301;
}

.token-results-header {
  text-align: center;
  margin-bottom: 20px;
}

.token-results-header h3 {
  margin: 0 0 4px 0;
  color: #a78bfa;
  font-size: 1.1rem;
}

.token-node-name {
  color: #9ca3af;
  font-size: 0.9rem;
}

.token-currency-rewards {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.currency-icon {
  font-size: 1.2rem;
}

.currency-value {
  font-weight: 700;
  color: #f3f4f6;
}

.token-item-drops h4 {
  margin: 0 0 12px 0;
  color: #9ca3af;
  font-size: 0.85rem;
  text-align: center;
}

.token-items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.token-item {
  background: rgba(55, 65, 81, 0.5);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  color: #d1d5db;
  font-size: 0.85rem;
}

.item-count {
  color: #22c55e;
  font-weight: 600;
}

.no-items-dropped {
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  padding: 12px;
}

.token-results-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.collect-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.collect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.spend-token-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #475569;
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.spend-token-btn:hover {
  border-color: #64748b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Party Selector */
.party-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1a1f2e;
  border-radius: 10px;
  border: 1px solid #252b3b;
  margin-bottom: 12px;
}

.party-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #252b3b;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.party-arrow:hover {
  background: #374151;
  color: #f3f4f6;
}

.party-arrow:active {
  transform: scale(0.95);
}

.party-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.party-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f3f4f6;
}

.party-mini-preview {
  display: flex;
  gap: 6px;
}

.mini-hero {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  background: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-hero.empty {
  border: 1px dashed #4b5563;
  background: transparent;
}

.mini-hero-placeholder {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 600;
}

.start-quest-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.start-quest-btn:disabled:hover {
  transform: none;
}

</style>

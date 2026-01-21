<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useQuestsStore, useHeroesStore, useInventoryStore, useGenusLociStore } from '../stores'
import { regions, superRegions, getQuestNode, getNodesByRegion, getRegion, getRegionsBySuperRegion } from '../data/questNodes.js'
import { getEnemyTemplate } from '../data/enemyTemplates.js'
import { getGenusLoci } from '../data/genusLoci.js'
import MapCanvas from '../components/MapCanvas.vue'
import SuperRegionSelect from '../components/SuperRegionSelect.vue'

const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

const emit = defineEmits(['navigate', 'startBattle', 'startGenusLociBattle'])

const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()
const inventoryStore = useInventoryStore()
const genusLociStore = useGenusLociStore()

const selectedNode = ref(null)
const selectedRegion = ref(regions[0].id)
const selectedSuperRegion = ref(null)

// Track if we should skip the region reset on super-region change
let skipNextRegionReset = false

// Restore last visited region on mount
onMounted(() => {
  const savedRegion = questsStore.lastVisitedRegion
  if (savedRegion) {
    const regionData = getRegion(savedRegion)
    if (regionData) {
      // Set flag to skip the watch reset
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
  return getRegion(selectedRegion.value)
})

// Get all nodes for the current region
const currentRegionNodes = computed(() => {
  if (!currentRegion.value) return []
  return getNodesByRegion(currentRegion.value.name)
})

const regionProgress = computed(() => {
  return questsStore.regionProgress[selectedRegion.value] || { completed: 0, total: 0 }
})

function getRegionBackground(region) {
  const path = `../assets/battle_backgrounds/${region.startNode}.png`
  return battleBackgrounds[path] || null
}

// Clear selection when changing regions or super-regions
watch([selectedRegion, selectedSuperRegion], () => {
  selectedNode.value = null
})

// Reset to first region when super-region changes (but not when restoring saved region)
watch(selectedSuperRegion, (newSuperRegion) => {
  if (skipNextRegionReset) {
    skipNextRegionReset = false
    return
  }
  if (newSuperRegion) {
    const srRegions = getRegionsBySuperRegion(newSuperRegion)
    if (srRegions.length > 0) {
      selectedRegion.value = srRegions[0].id
    }
  }
})

function selectNode(node) {
  if (selectedNode.value?.id === node.id) {
    // Second tap - could start quest directly, but we use the button
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

function getNodeEnemies(node) {
  // Get unique enemies from all battles
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

  // Initialize party state (full HP, 30% MP)
  const partyState = {}
  for (const instanceId of heroesStore.party.filter(Boolean)) {
    const stats = heroesStore.getHeroStats(instanceId)
    partyState[instanceId] = {
      currentHp: stats.hp,
      currentMp: Math.floor(stats.mp * 0.3)
    }
  }

  // Start the quest run
  questsStore.startRun(selectedNode.value.id, partyState)

  // Navigate to battle
  emit('startBattle')
}

function goToSuperRegionSelect() {
  selectedSuperRegion.value = null
  selectedNode.value = null
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

  // If already unlocked, navigate to GenusLociScreen for level selection
  if (isUnlocked) {
    emit('navigate', 'genusLoci', genusLociId)
    return
  }

  // First time challenge - start level 1 battle directly
  emit('startGenusLociBattle', {
    genusLociId,
    powerLevel: 1
  })
}
</script>

<template>
  <div class="worldmap-screen">
    <!-- Animated Background -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-pattern"></div>
      <div class="bg-vignette"></div>
    </div>

    <!-- Super-Region Selection -->
    <SuperRegionSelect
      v-if="showSuperRegionSelect && !selectedSuperRegion"
      :super-regions="superRegions"
      :unlocked-super-regions="questsStore.unlockedSuperRegions"
      :super-region-progress="questsStore.superRegionProgress"
      @select="selectedSuperRegion = $event"
      @back="emit('navigate', 'home')"
    />

    <!-- Region Content -->
    <div v-else class="content">
      <header class="worldmap-header">
        <button class="back-button" @click="showSuperRegionSelect ? goToSuperRegionSelect() : emit('navigate', 'home')">
          <span class="back-arrow">&larr;</span>
          <span>{{ showSuperRegionSelect ? 'Regions' : 'Back' }}</span>
        </button>
        <h1 class="page-title">{{ selectedSuperRegion ? superRegions.find(sr => sr.id === selectedSuperRegion)?.name : 'World Map' }}</h1>
        <div class="cleared-badge">
          <span class="cleared-icon">🏆</span>
          <span class="cleared-count">{{ questsStore.completedNodeCount }}</span>
        </div>
      </header>

      <nav class="region-tabs">
        <button
          v-for="region in filteredRegions"
          :key="region.id"
          :class="['region-tab', { active: selectedRegion === region.id }]"
          :style="getRegionBackground(region) ? { backgroundImage: `url(${getRegionBackground(region)})` } : {}"
          @click="selectedRegion = region.id"
        >
          <div class="region-tab-overlay"></div>
          <span class="region-tab-label">{{ region.name }}</span>
        </button>
      </nav>

      <div class="region-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: (regionProgress.total > 0 ? regionProgress.completed / regionProgress.total * 100 : 0) + '%' }"
          ></div>
          <div class="progress-shine"></div>
        </div>
        <span class="progress-text">{{ regionProgress.completed }} / {{ regionProgress.total }} cleared</span>
      </div>

      <!-- Map Canvas -->
      <section class="map-section">
        <MapCanvas
          v-if="currentRegion"
          :region="currentRegion"
          :nodes="currentRegionNodes"
          :unlocked-nodes="questsStore.unlockedNodes"
          :completed-nodes="questsStore.completedNodes"
          :selected-node-id="selectedNode?.id"
          @select-node="selectNode"
        />
      </section>
    </div>

    <!-- Node Preview Modal -->
    <Transition name="slide-up">
      <aside v-if="selectedNode" class="node-preview">
        <div class="preview-handle"></div>

        <div class="preview-header">
          <div class="preview-title-area">
            <h2>{{ selectedNode.name }}</h2>
            <span v-if="selectedNode.isCompleted" class="completed-badge">Cleared</span>
          </div>
          <button class="close-preview" @click="clearSelection">×</button>
        </div>

        <!-- Genus Loci Preview -->
        <div v-if="selectedNode.isGenusLoci" class="preview-body genus-loci-preview">
          <div class="boss-info-card">
            <div class="boss-icon">👹</div>
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
              <div class="reward-card">
                <span class="reward-icon">🪙</span>
                <div class="reward-info">
                  <span class="reward-label">Gold</span>
                  <span class="reward-value gold">{{ selectedNode.bossData?.currencyRewards?.base?.gold }}+</span>
                </div>
              </div>
              <div v-if="!selectedNode.isUnlocked" class="reward-card">
                <span class="reward-icon">💎</span>
                <div class="reward-info">
                  <span class="reward-label">First Clear</span>
                  <span class="reward-value">{{ selectedNode.bossData?.firstClearBonus?.gems }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="start-quest-btn genus-loci-btn"
            :disabled="selectedNode.keyCount <= 0"
            @click="startGenusLociChallenge"
          >
            <span class="btn-icon">👹</span>
            <span v-if="selectedNode.keyCount <= 0">No Keys</span>
            <span v-else-if="selectedNode.isUnlocked">Select Level</span>
            <span v-else>Challenge (🔑 x1)</span>
          </button>
        </div>

        <!-- Regular Quest Preview -->
        <div v-else class="preview-body">
          <div class="battle-count-card">
            <span class="battle-count-icon">⚔️</span>
            <span class="battle-count-text">{{ selectedNode.battles.length }} Battles</span>
          </div>

          <div class="enemies-section">
            <h4 class="section-label">
              <span class="label-line"></span>
              <span>Enemies</span>
              <span class="label-line"></span>
            </h4>
            <div class="enemy-list">
              <div
                v-for="enemy in getNodeEnemies(selectedNode)"
                :key="enemy.id"
                class="enemy-preview"
              >
                <span class="enemy-name">{{ enemy.name }}</span>
                <div class="enemy-stats">
                  <span class="enemy-hp">❤️ {{ enemy.stats.hp }}</span>
                </div>
              </div>
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
                <span class="reward-icon">💎</span>
                <div class="reward-info">
                  <span class="reward-label">Gems</span>
                  <span class="reward-value">
                    {{ selectedNode.rewards.gems }}
                    <span
                      v-if="!selectedNode.isCompleted && selectedNode.firstClearBonus"
                      class="first-clear-bonus-badge"
                    >+{{ selectedNode.firstClearBonus.gems }} first time bonus!</span>
                  </span>
                </div>
              </div>
              <div v-if="selectedNode.rewards.gold" class="reward-card">
                <span class="reward-icon">🪙</span>
                <div class="reward-info">
                  <span class="reward-label">Gold</span>
                  <span class="reward-value gold">{{ selectedNode.rewards.gold }}</span>
                </div>
              </div>
              <div class="reward-card">
                <span class="reward-icon">⭐</span>
                <div class="reward-info">
                  <span class="reward-label">EXP</span>
                  <span class="reward-value">{{ selectedNode.rewards.exp }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="start-quest-btn"
            @click="startQuest"
          >
            <span class="btn-icon">⚔️</span>
            <span>{{ selectedNode.isCompleted ? 'Replay Quest' : 'Start Quest' }}</span>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Backdrop for modal -->
    <Transition name="fade">
      <div v-if="selectedNode" class="modal-backdrop" @click="clearSelection"></div>
    </Transition>
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

/* Content */
.content {
  position: relative;
  z-index: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
}

/* Header */
.worldmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.back-arrow {
  font-size: 1.1rem;
}

.page-title {
  font-size: 1.5rem;
  color: #f1f5f9;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.cleared-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 6px 12px;
}

.cleared-icon {
  font-size: 1rem;
}

.cleared-count {
  color: #fbbf24;
  font-weight: 600;
}

/* Region Tabs */
.region-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 8px;
}

.region-tab {
  position: relative;
  padding: 10px 14px;
  background-color: rgba(0, 0, 0, 0.5);
  background-size: cover;
  background-position: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #94a3b8;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.region-tab-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  transition: background 0.3s ease;
}

.region-tab-label {
  position: relative;
  z-index: 1;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.region-tab:hover {
  border-color: rgba(251, 191, 36, 0.5);
  color: #e2e8f0;
  transform: translateY(-2px);
}

.region-tab:hover .region-tab-overlay {
  background: rgba(0, 0, 0, 0.4);
}

.region-tab.active {
  border-color: #fbbf24;
  color: #fbbf24;
}

.region-tab.active .region-tab-overlay {
  background: rgba(251, 191, 36, 0.25);
}

/* Region Progress */
.region-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 5px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 5px 5px 0 0;
}

.progress-text {
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Map Section */
.map-section {
  flex: 1;
  display: flex;
  flex-direction: column;
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
  max-height: 75vh;
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

/* Battle Count Card */
.battle-count-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  margin-bottom: 20px;
}

.battle-count-icon {
  font-size: 1.5rem;
}

.battle-count-text {
  color: #fef3c7;
  font-size: 1.2rem;
  font-weight: 600;
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

/* Enemies Section */
.enemies-section {
  margin-bottom: 20px;
}

.enemy-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.enemy-preview {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 14px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enemy-name {
  color: #fca5a5;
  font-weight: 600;
  font-size: 0.9rem;
}

.enemy-stats {
  display: flex;
  gap: 8px;
}

.enemy-hp {
  color: #9ca3af;
  font-size: 0.8rem;
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

.first-clear-bonus-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.5);
  border-radius: 8px;
  animation: bonusGlow 1.5s ease-in-out infinite;
}

@keyframes bonusGlow {
  0%, 100% {
    box-shadow: 0 0 4px rgba(251, 191, 36, 0.4);
  }
  50% {
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);
  }
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

.start-quest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.start-quest-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.2rem;
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
</style>

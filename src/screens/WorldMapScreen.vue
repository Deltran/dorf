<script setup>
import { ref, computed, watch } from 'vue'
import { useQuestsStore, useHeroesStore } from '../stores'
import { regions, getQuestNode, getNodesByRegion, getRegion } from '../data/questNodes.js'
import { getEnemyTemplate } from '../data/enemyTemplates.js'
import MapCanvas from '../components/MapCanvas.vue'

const emit = defineEmits(['navigate', 'startBattle'])

const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()

const selectedNode = ref(null)
const selectedRegion = ref(regions[0].id)

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

// Clear selection when changing regions
watch(selectedRegion, () => {
  selectedNode.value = null
})

function selectNode(node) {
  if (selectedNode.value?.id === node.id) {
    // Second tap - could start quest directly, but we use the button
    return
  }
  selectedNode.value = {
    ...node,
    isCompleted: questsStore.completedNodes.includes(node.id)
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
</script>

<template>
  <div class="worldmap-screen">
    <!-- Animated Background -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-pattern"></div>
      <div class="bg-vignette"></div>
    </div>

    <!-- Content -->
    <div class="content">
      <header class="worldmap-header">
        <button class="back-button" @click="emit('navigate', 'home')">
          <span class="back-arrow">&larr;</span>
          <span>Back</span>
        </button>
        <h1 class="page-title">World Map</h1>
        <div class="cleared-badge">
          <span class="cleared-icon">🏆</span>
          <span class="cleared-count">{{ questsStore.completedNodeCount }}</span>
        </div>
      </header>

      <nav class="region-tabs">
        <button
          v-for="region in regions"
          :key="region.id"
          :class="['region-tab', { active: selectedRegion === region.id }]"
          @click="selectedRegion = region.id"
        >
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

        <div class="preview-body">
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
                  <span class="reward-value">{{ selectedNode.rewards.gems }}</span>
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
            <div v-if="!selectedNode.isCompleted && selectedNode.firstClearBonus" class="first-clear-bonus">
              <span class="bonus-icon">🎁</span>
              <span class="bonus-text">First Clear Bonus</span>
              <span class="bonus-value">+{{ selectedNode.firstClearBonus.gems }} 💎</span>
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
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.region-tabs::-webkit-scrollbar {
  display: none;
}

.region-tab {
  position: relative;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #94a3b8;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  overflow: hidden;
  min-width: 100px;
}

.region-tab-label {
  position: relative;
  z-index: 1;
  font-weight: 500;
}

.region-tab:hover {
  border-color: rgba(251, 191, 36, 0.5);
  color: #e2e8f0;
  transform: translateY(-2px);
}

.region-tab.active {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
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

.first-clear-bonus {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 10px;
}

.bonus-icon {
  font-size: 1.3rem;
}

.bonus-text {
  flex: 1;
  color: #fcd34d;
  font-weight: 500;
}

.bonus-value {
  color: #fbbf24;
  font-weight: 600;
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

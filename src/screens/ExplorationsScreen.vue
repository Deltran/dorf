<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useExplorationsStore, useHeroesStore } from '../stores'

const emit = defineEmits(['navigate', 'back'])

const explorationsStore = useExplorationsStore()
const heroesStore = useHeroesStore()

const unlockedExplorations = computed(() => explorationsStore.unlockedExplorations)
const activeExplorations = computed(() => explorationsStore.activeExplorations)

// Timer to update time display every minute
const tick = ref(0)
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    tick.value++
  }, 60000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

function isActive(nodeId) {
  return !!activeExplorations.value[nodeId]
}

function getExploration(nodeId) {
  return activeExplorations.value[nodeId]
}

function getProgressPercent(nodeId) {
  const exploration = getExploration(nodeId)
  const node = explorationsStore.getExplorationNode(nodeId)
  if (!exploration || !node) return 0
  return Math.min(100, (exploration.fightCount / node.explorationConfig.requiredFights) * 100)
}

function getTimeRemaining(nodeId) {
  // Reference tick to force reactivity on timer updates
  void tick.value

  const exploration = getExploration(nodeId)
  const node = explorationsStore.getExplorationNode(nodeId)
  if (!exploration || !node) return ''

  const elapsed = Date.now() - exploration.startedAt
  const remaining = Math.max(0, (node.explorationConfig.timeLimit * 60 * 1000) - elapsed)
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000)

  if (hours === 0 && minutes === 0) {
    return 'Less than a minute'
  }
  if (hours === 0) {
    return `${minutes}m`
  }
  return `${hours}h ${minutes}m`
}

function openExploration(nodeId) {
  emit('navigate', 'exploration-detail', nodeId)
}

function getExplorationRank(nodeId) {
  return explorationsStore.getExplorationRank(nodeId)
}
</script>

<template>
  <div class="explorations-screen">
    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">←</span>
      </button>
      <h1>Explorations</h1>
    </header>

    <div class="explorations-content">
      <div class="active-count">
        {{ explorationsStore.activeExplorationCount }} active exploration{{ explorationsStore.activeExplorationCount !== 1 ? 's' : '' }}
      </div>

      <div v-if="unlockedExplorations.length === 0" class="no-explorations">
        <p>No explorations available yet.</p>
        <p class="hint">Complete quest nodes to unlock explorations.</p>
      </div>

      <div v-else class="exploration-list">
        <div
          v-for="node in unlockedExplorations"
          :key="node.id"
          :class="['exploration-card', { active: isActive(node.id) }]"
          @click="openExploration(node.id)"
        >
          <div class="card-header">
            <span class="compass-icon">🧭</span>
            <h3>{{ node.name }}</h3>
            <span :class="['rank-badge', `rank-${getExplorationRank(node.id)}`]">
              {{ getExplorationRank(node.id) }}
            </span>
          </div>

          <div class="card-body">
            <template v-if="isActive(node.id)">
              <div class="progress-info">
                <div class="progress-row">
                  <span>Progress:</span>
                  <span>{{ getExploration(node.id).fightCount }} / {{ node.explorationConfig.requiredFights }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getProgressPercent(node.id) + '%' }"></div>
                </div>
                <div class="time-remaining">
                  {{ getTimeRemaining(node.id) }} remaining
                </div>
              </div>
              <div v-if="getExploration(node.id).partyRequestMet" class="bonus-active">
                +10% bonus active
              </div>
            </template>

            <template v-else>
              <div class="requirements">
                <div class="req-row">
                  <span>Fights:</span>
                  <span>{{ node.explorationConfig.requiredFights }}</span>
                </div>
                <div class="req-row">
                  <span>Time limit:</span>
                  <span>{{ node.explorationConfig.timeLimit }}m</span>
                </div>
              </div>
              <div class="rewards-preview">
                <span>{{ node.explorationConfig.rewards.gold }} gold</span>
                <span>{{ node.explorationConfig.rewards.gems }} gems</span>
              </div>
            </template>
          </div>

          <div class="card-action">
            <span v-if="isActive(node.id)" class="status-badge active">In Progress</span>
            <span v-else class="status-badge available">Available</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explorations-screen {
  min-height: 100vh;
  background: #111827;
  color: #f3f4f6;
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #1f2937;
}

.back-button {
  background: #374151;
  border: none;
  color: #f3f4f6;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.explorations-content {
  padding: 20px;
}

.active-count {
  text-align: center;
  color: #9ca3af;
  margin-bottom: 20px;
}

.no-explorations {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.hint {
  font-size: 0.9rem;
  margin-top: 8px;
}

.exploration-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exploration-card {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exploration-card:hover {
  border-color: #4b5563;
  transform: translateY(-2px);
}

.exploration-card.active {
  border-color: #06b6d4;
  background: linear-gradient(135deg, #1f2937 0%, #164e63 100%);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.compass-icon {
  font-size: 1.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.card-body {
  margin-bottom: 12px;
}

.progress-info {
  margin-bottom: 8px;
}

.progress-row, .req-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.progress-bar {
  height: 6px;
  background: #374151;
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #10b981);
  transition: width 0.3s ease;
}

.time-remaining {
  font-size: 0.85rem;
  color: #9ca3af;
  text-align: center;
}

.bonus-active {
  color: #10b981;
  font-size: 0.85rem;
  text-align: center;
}

.requirements {
  color: #9ca3af;
  font-size: 0.9rem;
}

.rewards-preview {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #fbbf24;
}

.card-action {
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}

.status-badge.available {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.rank-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
}

.rank-badge.rank-E {
  background: #4b5563;
  color: #9ca3af;
}

.rank-badge.rank-D {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.rank-badge.rank-C {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.rank-badge.rank-B {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.rank-badge.rank-A {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.rank-badge.rank-S {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 179, 8, 0.3) 100%);
  color: #fbbf24;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}
</style>

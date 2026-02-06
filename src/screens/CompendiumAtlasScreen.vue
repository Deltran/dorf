<script setup>
import { ref, computed } from 'vue'
import { useCodexStore, useQuestsStore } from '../stores'
import { regions, superRegions } from '../data/quests/regions.js'
import { getNodesByRegion } from '../data/quests/index.js'

const emit = defineEmits(['navigate', 'back'])
const codexStore = useCodexStore()
const questsStore = useQuestsStore()

const selectedRegion = ref(null)
const showGemReward = ref(false)
const gemRewardAmount = ref(0)
let gemTimer = null

function isRegionDiscovered(region) {
  return questsStore.unlockedNodes.includes(region.startNode)
}

function isNodeCompleted(nodeId) {
  return questsStore.completedNodes.includes(nodeId)
}

function isNodeUnlocked(nodeId) {
  return questsStore.unlockedNodes.includes(nodeId)
}

const regionsBySuperRegion = computed(() => {
  const grouped = {}
  for (const sr of superRegions) {
    const regionList = regions.filter(r => r.superRegion === sr.id)
    if (regionList.length > 0) {
      grouped[sr.name] = regionList
    }
  }
  // Also handle regions without superRegion
  const noSuper = regions.filter(r => !r.superRegion)
  if (noSuper.length > 0) {
    grouped['Other'] = noSuper
  }
  return grouped
})

function selectRegion(region) {
  if (!isRegionDiscovered(region)) return
  clearTimeout(gemTimer)
  showGemReward.value = false
  selectedRegion.value = region
  const gems = codexStore.markRead(`region:${region.id}`)
  if (gems) {
    gemRewardAmount.value = gems
    showGemReward.value = true
    gemTimer = setTimeout(() => { showGemReward.value = false }, 2000)
  }
}

function closeDetail() {
  clearTimeout(gemTimer)
  showGemReward.value = false
  selectedRegion.value = null
}

const selectedRegionNodes = computed(() => {
  if (!selectedRegion.value) return []
  return getNodesByRegion(selectedRegion.value.name)
})
</script>

<template>
  <div class="atlas-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Atlas</h1>
      <div class="header-counter">
        {{ codexStore.discoveredRegions.length }}/{{ codexStore.totalRegions }}
      </div>
    </header>

    <div class="region-list">
      <div v-for="(regionList, superName) in regionsBySuperRegion" :key="superName" class="super-group">
        <h2 class="super-title">{{ superName }}</h2>
        <div class="region-rows">
          <button
            v-for="region in regionList"
            :key="region.id"
            class="region-row"
            :class="{ discovered: isRegionDiscovered(region), undiscovered: !isRegionDiscovered(region) }"
            @click="selectRegion(region)"
          >
            <span v-if="isRegionDiscovered(region)" class="region-name">{{ region.name }}</span>
            <span v-else class="region-name unknown">???</span>
            <span
              v-if="isRegionDiscovered(region) && !codexStore.hasRead(`region:${region.id}`)"
              class="row-gem-badge"
            >💎</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Detail panel -->
    <div v-if="selectedRegion" class="detail-overlay" @click.self="closeDetail">
      <div class="detail-panel">
        <button class="detail-close" @click="closeDetail">✕</button>
        <div v-if="showGemReward" class="gem-reward">+{{ gemRewardAmount }} 💎</div>

        <h2 class="detail-name">{{ selectedRegion.name }}</h2>

        <div v-if="selectedRegion.description" class="detail-description">
          {{ selectedRegion.description }}
        </div>

        <!-- Nodes list -->
        <div class="detail-section">
          <h3 class="detail-section-title">Locations</h3>
          <div v-for="node in selectedRegionNodes" :key="node.id" class="node-entry">
            <span class="node-status">
              {{ isNodeCompleted(node.id) ? '✅' : isNodeUnlocked(node.id) ? '🔓' : '🔒' }}
            </span>
            <span class="node-name" :class="{ locked: !isNodeUnlocked(node.id) }">
              {{ isNodeUnlocked(node.id) ? node.name : '???' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.atlas-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow-y: auto;
  background: linear-gradient(to bottom, #0a0a0a 0%, #111827 100%);
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
  z-index: 0;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-counter {
  font-size: 0.9rem;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  min-width: 70px;
  text-align: right;
}

/* Region list */
.region-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
  padding-bottom: 20px;
}

.super-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.super-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 4px 4px;
}

.region-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.region-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid #1e293b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.region-row.discovered:hover {
  background: rgba(30, 41, 59, 0.7);
  border-color: #334155;
}

.region-row.undiscovered {
  cursor: default;
  opacity: 0.4;
}

.region-name {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
  color: #d1d5db;
}

.region-name.unknown {
  color: #374151;
}

.row-gem-badge {
  font-size: 0.7rem;
  flex-shrink: 0;
}

/* Detail panel */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.detail-panel {
  background: #111827;
  border-top: 2px solid #334155;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  overflow-y: auto;
  padding: 24px 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
}

.detail-close:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.detail-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.detail-description {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.5;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
}

.node-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(30, 41, 59, 0.3);
  border-radius: 6px;
}

.node-status {
  font-size: 0.8rem;
  flex-shrink: 0;
}

.node-name {
  font-size: 0.85rem;
  color: #d1d5db;
}

.node-name.locked {
  color: #374151;
}

.gem-reward {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.3rem;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);
  z-index: 10;
  pointer-events: none;
  animation: gemFloat 2s ease-out forwards;
}

@keyframes gemFloat {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.5);
  }
  15% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1.1);
  }
  30% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px) scale(1);
  }
}
</style>

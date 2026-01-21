<script setup>
const props = defineProps({
  superRegions: {
    type: Array,
    required: true
  },
  unlockedSuperRegions: {
    type: Array,
    required: true
  },
  superRegionProgress: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select', 'back'])

function isUnlocked(superRegionId) {
  return props.unlockedSuperRegions.some(sr => sr.id === superRegionId)
}

function getProgress(superRegionId) {
  return props.superRegionProgress[superRegionId] || { completed: 0, total: 0 }
}

function getUnlockHint(superRegion) {
  if (!superRegion.unlockCondition?.completedNode) return null
  return `Complete ${superRegion.unlockCondition.completedNode} to unlock`
}
</script>

<template>
  <div class="super-region-select">
    <header class="select-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">&larr;</span>
        <span>Back</span>
      </button>
      <h1 class="page-title">Select Region</h1>
      <div class="spacer"></div>
    </header>

    <div class="cards-container">
      <button
        v-for="sr in superRegions"
        :key="sr.id"
        :class="['super-region-card', { locked: !isUnlocked(sr.id) }]"
        :disabled="!isUnlocked(sr.id)"
        @click="isUnlocked(sr.id) && emit('select', sr.id)"
      >
        <div class="card-background" :data-region="sr.id"></div>
        <div class="card-overlay"></div>
        <div class="card-content">
          <h2 class="card-title">{{ sr.name }}</h2>
          <p class="card-description">{{ sr.description }}</p>
          <div v-if="isUnlocked(sr.id)" class="card-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: (getProgress(sr.id).total > 0 ? getProgress(sr.id).completed / getProgress(sr.id).total * 100 : 0) + '%' }"
              ></div>
            </div>
            <span class="progress-text">
              {{ getProgress(sr.id).completed }} / {{ getProgress(sr.id).total }} cleared
            </span>
          </div>
          <div v-else class="locked-overlay">
            <span class="lock-icon">🔒</span>
            <span class="unlock-hint">{{ getUnlockHint(sr) }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.super-region-select {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.select-header {
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

.spacer {
  width: 80px;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  flex: 1;
  align-items: center;
}

.super-region-card {
  position: relative;
  width: 100%;
  max-width: 350px;
  min-height: 200px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: none;
  padding: 0;
  text-align: left;
}

.super-region-card:not(.locked):hover {
  border-color: #fbbf24;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.super-region-card.locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.card-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.card-background[data-region="western_veros"] {
  background: linear-gradient(135deg, #1a2f1a 0%, #2d4a2d 100%);
}

.card-background[data-region="aquarias"] {
  background: linear-gradient(135deg, #0a2a3a 0%, #1a4a5a 100%);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.7) 100%);
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.card-title {
  color: #f3f4f6;
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.card-description {
  color: #9ca3af;
  font-size: 0.95rem;
  margin: 0 0 auto 0;
  line-height: 1.4;
}

.card-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  color: #9ca3af;
  font-size: 0.85rem;
}

.locked-overlay {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.lock-icon {
  font-size: 1.5rem;
}

.unlock-hint {
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
}

@media (min-width: 768px) {
  .super-region-card {
    width: calc(50% - 10px);
  }
}
</style>

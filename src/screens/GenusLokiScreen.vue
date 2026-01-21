<script setup>
import { ref, computed } from 'vue'
import { useGenusLokiStore, useInventoryStore } from '../stores'
import { getGenusLoki, getAllGenusLoki } from '../data/genusLoki.js'

const emit = defineEmits(['navigate', 'startGenusLokiBattle'])

const props = defineProps({
  selectedBossId: {
    type: String,
    default: null
  }
})

const genusLokiStore = useGenusLokiStore()
const inventoryStore = useInventoryStore()

const selectedBoss = computed(() => {
  if (props.selectedBossId) {
    return getGenusLoki(props.selectedBossId)
  }
  return null
})

const selectedLevel = ref(null)

const availableLevels = computed(() => {
  if (!selectedBoss.value) return []
  return genusLokiStore.getAvailableLevels(selectedBoss.value.id)
})

const highestCleared = computed(() => {
  if (!selectedBoss.value) return 0
  return genusLokiStore.getHighestCleared(selectedBoss.value.id)
})

const keyCount = computed(() => {
  if (!selectedBoss.value) return 0
  return inventoryStore.getItemCount(selectedBoss.value.keyItemId)
})

const canChallenge = computed(() => {
  return selectedLevel.value && keyCount.value > 0
})

function selectLevel(level) {
  selectedLevel.value = level
}

function startBattle() {
  if (!canChallenge.value) return
  emit('startGenusLokiBattle', {
    genusLokiId: selectedBoss.value.id,
    powerLevel: selectedLevel.value
  })
}

function calculateGoldReward(level) {
  if (!selectedBoss.value) return 0
  const { base, perLevel } = selectedBoss.value.currencyRewards
  return base.gold + perLevel.gold * (level - 1)
}

function goBack() {
  emit('navigate', 'home')
}
</script>

<template>
  <div class="genus-loki-screen">
    <header class="screen-header">
      <button class="back-btn" @click="goBack">← Back</button>
      <h1>Genus Loki</h1>
    </header>

    <div v-if="selectedBoss" class="boss-detail">
      <div class="boss-header">
        <div class="boss-icon">👹</div>
        <div class="boss-title">
          <h2>{{ selectedBoss.name }}</h2>
          <p class="boss-description">{{ selectedBoss.description }}</p>
        </div>
      </div>

      <div class="key-status">
        <span class="key-icon">🔑</span>
        <span class="key-count">{{ keyCount }}</span>
        <span class="key-label">Keys Available</span>
      </div>

      <div class="level-selection">
        <h3>Select Power Level</h3>
        <div class="level-grid">
          <button
            v-for="level in availableLevels"
            :key="level"
            :class="['level-btn', { selected: selectedLevel === level, cleared: level <= highestCleared }]"
            @click="selectLevel(level)"
          >
            <span class="level-number">{{ level }}</span>
            <span class="level-reward">🪙 {{ calculateGoldReward(level) }}</span>
          </button>
        </div>
        <div v-if="availableLevels.length < selectedBoss.maxPowerLevel" class="locked-hint">
          Defeat Lv.{{ availableLevels[availableLevels.length - 1] }} to unlock Lv.{{ availableLevels[availableLevels.length - 1] + 1 }}
        </div>
      </div>

      <button
        class="challenge-btn"
        :disabled="!canChallenge"
        @click="startBattle"
      >
        <span v-if="keyCount === 0">No Keys</span>
        <span v-else-if="!selectedLevel">Select Level</span>
        <span v-else>Challenge (🔑 x1)</span>
      </button>
    </div>

    <div v-else class="no-boss-selected">
      <p>Select a Genus Loki from the home screen.</p>
      <button class="back-btn-large" @click="goBack">Return Home</button>
    </div>
  </div>
</template>

<style scoped>
.genus-loki-screen {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #1a1025 0%, #0f172a 100%);
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.screen-header h1 {
  font-size: 1.5rem;
  color: #f3f4f6;
  margin: 0;
}

.back-btn {
  background: none;
  border: 1px solid #4b5563;
  color: #9ca3af;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: #6b7280;
  color: #f3f4f6;
}

.boss-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.boss-header {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #2a1f3d 0%, #1f2937 100%);
  border-radius: 16px;
  border: 1px solid #6b21a8;
}

.boss-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.2);
  border-radius: 12px;
}

.boss-title h2 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  color: #f3f4f6;
}

.boss-description {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.key-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #1f2937;
  border-radius: 8px;
}

.key-icon {
  font-size: 1.2rem;
}

.key-count {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fbbf24;
}

.key-label {
  color: #6b7280;
  font-size: 0.85rem;
}

.level-selection {
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
}

.level-selection h3 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.level-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #374151;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-btn:hover {
  background: #4b5563;
}

.level-btn.selected {
  border-color: #9333ea;
  background: rgba(147, 51, 234, 0.2);
}

.level-btn.cleared {
  background: rgba(34, 197, 94, 0.1);
}

.level-btn.cleared .level-number {
  color: #22c55e;
}

.level-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.level-reward {
  font-size: 0.7rem;
  color: #f59e0b;
  margin-top: 4px;
}

.locked-hint {
  margin-top: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 0.8rem;
}

.challenge-btn {
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.challenge-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
}

.challenge-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
}

.no-boss-selected {
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
}

.back-btn-large {
  margin-top: 16px;
  padding: 12px 24px;
  background: #374151;
  border: none;
  border-radius: 8px;
  color: #f3f4f6;
  cursor: pointer;
}
</style>

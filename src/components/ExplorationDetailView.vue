<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useExplorationsStore, useHeroesStore } from '../stores'
import HeroCard from './HeroCard.vue'

// Image imports
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

function getHeroImageUrl(templateId) {
  if (!templateId) return null
  const gifPath = `../assets/heroes/${templateId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${templateId}.png`
  return heroImages[pngPath] || null
}

function getBackgroundUrl(backgroundId) {
  if (!backgroundId) return null
  const path = `../assets/battle_backgrounds/${backgroundId}.png`
  return battleBackgrounds[path] || battleBackgrounds['../assets/battle_backgrounds/default.png'] || null
}

const props = defineProps({
  nodeId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'started', 'cancelled'])

const explorationsStore = useExplorationsStore()
const heroesStore = useHeroesStore()

const node = computed(() => explorationsStore.getExplorationNode(props.nodeId))
const config = computed(() => node.value?.explorationConfig)
const isActive = computed(() => !!explorationsStore.activeExplorations[props.nodeId])
const exploration = computed(() => explorationsStore.activeExplorations[props.nodeId])

// Hero selection (when not active)
const selectedHeroes = ref([])
const showCancelConfirm = ref(false)

const availableHeroes = computed(() => heroesStore.availableForExploration)

const canStart = computed(() => selectedHeroes.value.length === 5)

const partyRequestMet = computed(() => {
  if (selectedHeroes.value.length !== 5) return false
  return explorationsStore.checkPartyRequest(props.nodeId, selectedHeroes.value)
})

// Time display for active exploration
const timeDisplay = computed(() => {
  if (!exploration.value || !config.value) return ''
  const elapsed = Date.now() - exploration.value.startedAt
  const remaining = Math.max(0, (config.value.timeLimit * 60 * 1000) - elapsed)
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${hours}h ${minutes}m ${seconds}s`
})

const progressPercent = computed(() => {
  if (!exploration.value || !config.value) return 0
  return Math.min(100, (exploration.value.fightCount / config.value.requiredFights) * 100)
})

// Banner background URL
const backgroundUrl = computed(() => {
  return getBackgroundUrl(node.value?.backgroundId)
})

// Heroes to display in banner (active exploration or selection in progress)
const displayHeroes = computed(() => {
  const heroIds = isActive.value
    ? exploration.value?.heroes || []
    : selectedHeroes.value

  return [0, 1, 2, 3, 4].map(i => {
    const instanceId = heroIds[i]
    if (!instanceId) return null
    return heroesStore.getHeroFull(instanceId)
  })
})

function toggleHeroSelection(instanceId) {
  const index = selectedHeroes.value.indexOf(instanceId)
  if (index === -1) {
    if (selectedHeroes.value.length < 5) {
      selectedHeroes.value.push(instanceId)
    }
  } else {
    selectedHeroes.value.splice(index, 1)
  }
}

function isHeroSelected(instanceId) {
  return selectedHeroes.value.includes(instanceId)
}

function startExploration() {
  const result = explorationsStore.startExploration(props.nodeId, selectedHeroes.value)
  if (result.success) {
    selectedHeroes.value = []
    emit('started')
  }
}

function confirmCancel() {
  showCancelConfirm.value = true
}

function cancelExploration() {
  explorationsStore.cancelExploration(props.nodeId)
  showCancelConfirm.value = false
  emit('cancelled')
}

// Update time display every second when active
let timer = null
watch(isActive, (active) => {
  if (active) {
    timer = setInterval(() => {}, 1000) // Force reactivity
  } else if (timer) {
    clearInterval(timer)
    timer = null
  }
}, { immediate: true })

// Clean up timer on component unmount to prevent memory leak
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="exploration-detail">
    <header class="detail-header">
      <button class="close-button" @click="emit('close')">×</button>
      <h2>{{ node?.name }}</h2>
    </header>

    <div class="detail-content">
      <!-- Exploration Banner with Heroes -->
      <div class="exploration-banner" :style="backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {}">
        <div class="banner-overlay"></div>
        <div class="banner-heroes">
          <div
            v-for="(hero, index) in displayHeroes"
            :key="index"
            :class="['banner-hero', `slot-${index}`, { empty: !hero }]"
          >
            <img
              v-if="hero && getHeroImageUrl(hero.templateId)"
              :src="getHeroImageUrl(hero.templateId)"
              :alt="hero.template?.name"
            />
          </div>
        </div>
      </div>

      <!-- Party Request -->
      <div class="party-request" :class="{ met: isActive ? exploration?.partyRequestMet : partyRequestMet }">
        <div class="request-label">Party Request:</div>
        <div class="request-description">{{ config?.partyRequest?.description }}</div>
        <div class="request-bonus" v-if="isActive ? exploration?.partyRequestMet : partyRequestMet">
          +10% bonus active!
        </div>
      </div>

      <!-- Active Exploration View -->
      <template v-if="isActive">
        <div class="progress-section">
          <div class="progress-row">
            <span>Fights:</span>
            <span>{{ exploration.fightCount }} / {{ config.requiredFights }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="time-remaining">
            Time remaining: {{ timeDisplay }}
          </div>
        </div>

        <div class="assigned-heroes">
          <h3>Assigned Heroes</h3>
          <div class="hero-grid">
            <HeroCard
              v-for="instanceId in exploration.heroes"
              :key="instanceId"
              :hero="heroesStore.getHeroFull(instanceId)"
              compact
            />
          </div>
        </div>

        <button class="cancel-button" @click="confirmCancel">
          Cancel Exploration
        </button>

        <!-- Cancel Confirmation -->
        <div v-if="showCancelConfirm" class="confirm-overlay">
          <div class="confirm-dialog">
            <p>Cancel this exploration?</p>
            <p class="warning">All progress will be lost!</p>
            <div class="confirm-buttons">
              <button class="confirm-no" @click="showCancelConfirm = false">Keep Going</button>
              <button class="confirm-yes" @click="cancelExploration">Cancel</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Hero Selection View -->
      <template v-else>
        <div class="requirements">
          <div class="req-item">
            <span>Fights:</span>
            <span>{{ config?.requiredFights }}</span>
          </div>
          <div class="req-item">
            <span>Time Limit:</span>
            <span>{{ config?.timeLimit }} minutes</span>
          </div>
        </div>

        <div class="rewards-preview">
          <h3>Rewards</h3>
          <div class="reward-items">
            <span>🪙 {{ config?.rewards?.gold }}</span>
            <span>💎 {{ config?.rewards?.gems }}</span>
            <span>⭐ {{ config?.rewards?.xp }} XP</span>
          </div>
        </div>

        <div class="hero-selection">
          <h3>Select 5 Heroes ({{ selectedHeroes.length }}/5)</h3>
          <div v-if="availableHeroes.length === 0" class="no-heroes">
            No available heroes. Heroes in party or on other explorations cannot be selected.
          </div>
          <div v-else class="hero-grid">
            <HeroCard
              v-for="hero in availableHeroes"
              :key="hero.instanceId"
              :hero="heroesStore.getHeroFull(hero.instanceId)"
              :selected="isHeroSelected(hero.instanceId)"
              compact
              @click="toggleHeroSelection(hero.instanceId)"
            />
          </div>
        </div>

        <button
          class="start-button"
          :disabled="!canStart"
          @click="startExploration"
        >
          Start Exploration
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.exploration-detail {
  background: #111827;
  min-height: 100vh;
  color: #f3f4f6;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #1f2937;
}

.close-button {
  background: #374151;
  border: none;
  color: #f3f4f6;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
}

h2 {
  margin: 0;
  font-size: 1.3rem;
}

h3 {
  font-size: 1rem;
  color: #9ca3af;
  margin-bottom: 12px;
}

.detail-content {
  padding: 20px;
}

/* Exploration Banner */
.exploration-banner {
  position: relative;
  height: 180px;
  background-color: #1f2937;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

.banner-heroes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.banner-hero {
  position: absolute;
  bottom: 0;
  transform: translateX(-50%);
  transition: all 0.3s ease;
}

.banner-hero img {
  height: 150px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
}

.banner-hero.empty {
  display: none;
}

/* Slot positions - staggered pyramid formation */
.banner-hero.slot-0 {
  left: 10%;
  bottom: 5px;
  z-index: 1;
}

.banner-hero.slot-1 {
  left: 28%;
  bottom: 10px;
  z-index: 2;
}

.banner-hero.slot-2 {
  left: 50%;
  bottom: 15px;
  z-index: 3;
}

.banner-hero.slot-3 {
  left: 72%;
  bottom: 10px;
  z-index: 2;
}

.banner-hero.slot-4 {
  left: 90%;
  bottom: 5px;
  z-index: 1;
}

.party-request {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.party-request.met {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.request-label {
  font-size: 0.85rem;
  color: #9ca3af;
}

.request-description {
  font-weight: 600;
  margin-top: 4px;
}

.request-bonus {
  color: #10b981;
  font-size: 0.85rem;
  margin-top: 8px;
}

.requirements, .rewards-preview {
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.req-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.reward-items {
  display: flex;
  gap: 16px;
}

.hero-selection, .assigned-heroes {
  margin-bottom: 20px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.no-heroes {
  text-align: center;
  color: #6b7280;
  padding: 24px;
}

.start-button, .cancel-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-button {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-button {
  background: #374151;
  color: #f3f4f6;
}

.cancel-button:hover {
  background: #4b5563;
}

.progress-section {
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #10b981);
  transition: width 0.3s ease;
}

.time-remaining {
  text-align: center;
  margin-top: 12px;
  color: #9ca3af;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.confirm-dialog {
  background: #1f2937;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  max-width: 300px;
}

.warning {
  color: #ef4444;
  font-size: 0.9rem;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.confirm-no, .confirm-yes {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-no {
  background: #06b6d4;
  color: white;
}

.confirm-yes {
  background: #ef4444;
  color: white;
}
</style>

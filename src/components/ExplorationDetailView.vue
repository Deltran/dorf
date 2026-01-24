<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useExplorationsStore, useHeroesStore, useGachaStore, useInventoryStore } from '../stores'
import { RANK_BONUS_PER_LEVEL } from '../data/explorationRanks.js'
import { getItem } from '../data/items.js'
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
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

const node = computed(() => explorationsStore.getExplorationNode(props.nodeId))
const config = computed(() => node.value?.explorationConfig)
const isActive = computed(() => !!explorationsStore.activeExplorations[props.nodeId])
const exploration = computed(() => explorationsStore.activeExplorations[props.nodeId])

const currentRank = computed(() => {
  return explorationsStore.getExplorationRank(props.nodeId)
})

const rankBonusPercent = computed(() => {
  const rankIndex = ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(currentRank.value)
  return rankIndex * RANK_BONUS_PER_LEVEL
})

// Hero selection (when not active)
const selectedHeroes = ref([])
const showCancelConfirm = ref(false)
const showEnhanceModal = ref(false)

const enhanceInfo = computed(() => {
  return explorationsStore.canUpgradeExploration(props.nodeId)
})

const enhanceCrestItem = computed(() => {
  if (!enhanceInfo.value?.crestId) return null
  return getItem(enhanceInfo.value.crestId)
})

function openEnhanceModal() {
  showEnhanceModal.value = true
}

function closeEnhanceModal() {
  showEnhanceModal.value = false
}

function confirmEnhance() {
  const result = explorationsStore.upgradeExploration(props.nodeId)
  if (result.success) {
    closeEnhanceModal()
  }
}

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

const availableHeroes = computed(() => heroesStore.availableForExploration)

const canStart = computed(() => selectedHeroes.value.length === 5)

const partyRequestMet = computed(() => {
  if (selectedHeroes.value.length !== 5) return false
  return explorationsStore.checkPartyRequest(props.nodeId, selectedHeroes.value)
})

// Time display for active exploration
const timeDisplay = computed(() => {
  // Reference tick to force reactivity on timer updates
  void tick.value

  if (!exploration.value || !config.value) return ''
  const elapsed = Date.now() - exploration.value.startedAt
  const remaining = Math.max(0, (config.value.timeLimit * 60 * 1000) - elapsed)
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000)

  if (hours === 0 && minutes === 0) {
    return 'Less than a minute'
  }
  if (hours === 0) {
    return `${minutes}m`
  }
  return `${hours}h ${minutes}m`
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

</script>

<template>
  <div class="exploration-detail">
    <header class="detail-header">
      <button class="close-button" @click="emit('close')">×</button>
      <h2>{{ node?.name }}</h2>
      <span :class="['rank-badge', `rank-${currentRank}`]">{{ currentRank }}</span>
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

      <div v-if="rankBonusPercent > 0" class="rank-bonus">
        Rank {{ currentRank }}: +{{ rankBonusPercent }}% rewards
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

        <button
          v-if="currentRank !== 'S'"
          class="enhance-btn"
          @click="openEnhanceModal"
        >
          Enhance Exploration
        </button>
      </template>

      <!-- Enhance Modal -->
      <div v-if="showEnhanceModal" class="modal-backdrop" @click="closeEnhanceModal"></div>
      <div v-if="showEnhanceModal && enhanceInfo" class="enhance-modal">
        <div class="modal-header">
          <h3>Enhance Exploration</h3>
          <button class="close-btn" @click="closeEnhanceModal">×</button>
        </div>

        <div class="modal-body">
          <div class="rank-transition">
            <span :class="['rank-badge', 'large', `rank-${enhanceInfo.currentRank}`]">
              {{ enhanceInfo.currentRank }}
            </span>
            <span class="arrow">→</span>
            <span :class="['rank-badge', 'large', `rank-${enhanceInfo.nextRank}`]">
              {{ enhanceInfo.nextRank }}
            </span>
          </div>

          <div class="bonus-info">
            +5% reward bonus
          </div>

          <div class="enhance-requirements">
            <div class="requirement-row">
              <span class="req-label">{{ enhanceCrestItem?.name || 'Crest' }}</span>
              <span :class="['req-value', enhanceInfo.crestsHave >= enhanceInfo.crestsNeeded ? 'met' : 'unmet']">
                {{ enhanceInfo.crestsHave }} / {{ enhanceInfo.crestsNeeded }}
              </span>
            </div>
            <div class="requirement-row">
              <span class="req-label">Gold</span>
              <span :class="['req-value', enhanceInfo.goldHave >= enhanceInfo.goldNeeded ? 'met' : 'unmet']">
                {{ enhanceInfo.goldHave.toLocaleString() }} / {{ enhanceInfo.goldNeeded.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEnhanceModal">Cancel</button>
          <button
            class="confirm-btn"
            :disabled="!enhanceInfo.canUpgrade"
            @click="confirmEnhance"
          >
            Enhance
          </button>
        </div>
      </div>
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
  height: 100px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
}

.banner-hero.empty {
  display: none;
}

/* Slot positions - evenly spaced with overlap */
.banner-hero.slot-0 {
  left: 10%;
  z-index: 1;
}

.banner-hero.slot-1 {
  left: 28%;
  z-index: 2;
}

.banner-hero.slot-2 {
  left: 50%;
  z-index: 3;
}

.banner-hero.slot-3 {
  left: 72%;
  z-index: 2;
}

.banner-hero.slot-4 {
  left: 90%;
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

.hero-selection {
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

.rank-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
}

.rank-badge.rank-E { background: #4b5563; color: #9ca3af; }
.rank-badge.rank-D { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.rank-badge.rank-C { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.rank-badge.rank-B { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
.rank-badge.rank-A { background: rgba(249, 115, 22, 0.2); color: #f97316; }
.rank-badge.rank-S {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 179, 8, 0.3) 100%);
  color: #fbbf24;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.rank-bonus {
  text-align: center;
  color: #22c55e;
  font-size: 0.85rem;
  padding: 8px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
}

.enhance-btn {
  width: 100%;
  padding: 14px;
  margin-top: 12px;
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  border: 1px solid #6b7280;
  border-radius: 12px;
  color: #d1d5db;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.enhance-btn:hover {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border-color: #9ca3af;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
}

.enhance-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 20px;
  min-width: 300px;
  z-index: 101;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #f3f4f6;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
}

.rank-transition {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.rank-badge.large {
  font-size: 1.5rem;
  padding: 8px 16px;
}

.arrow {
  font-size: 1.5rem;
  color: #6b7280;
}

.bonus-info {
  text-align: center;
  color: #22c55e;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.enhance-requirements {
  background: #111827;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.enhance-requirements .requirement-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.enhance-requirements .req-label {
  color: #9ca3af;
}

.req-value {
  font-weight: 600;
}

.req-value.met {
  color: #22c55e;
}

.req-value.unmet {
  color: #ef4444;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 10px 20px;
  background: #374151;
  border: none;
  border-radius: 8px;
  color: #d1d5db;
  font-weight: 600;
  cursor: pointer;
}

.confirm-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
}
</style>

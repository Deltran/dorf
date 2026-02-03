<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useExplorationsStore, useHeroesStore, useGachaStore, useInventoryStore } from '../stores'
import { RANK_BONUS_PER_LEVEL } from '../data/explorationRanks.js'
import { getItem } from '../data/items.js'
import { particleBurst, scaleBounce } from '../composables/useParticleBurst.js'
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

// Template refs
const rankBadgeEl = ref(null)

const rankColors = {
  E: '#9ca3af', D: '#22c55e', C: '#3b82f6',
  B: '#a855f7', A: '#f97316', S: '#fbbf24'
}

// Hero selection (when not active)
const selectedHeroes = ref([])
const showCancelConfirm = ref(false)
const showEnhanceModal = ref(false)
const isDeparting = ref(false)

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
    nextTick(() => {
      if (rankBadgeEl.value) {
        const color = rankColors[currentRank.value] || '#f59e0b'
        particleBurst(rankBadgeEl.value, { color, count: 18, duration: 800 })
        scaleBounce(rankBadgeEl.value, 400)
      }
    })
  }
}

// Timer to update time display every minute
const tick = ref(0)
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    tick.value++
  }, 60000)
  document.addEventListener('click', handleFilterClickOutside)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  document.removeEventListener('click', handleFilterClickOutside)
})

const availableHeroes = computed(() => heroesStore.availableForExploration)

// Filter/Sort state
const sortBy = ref('default')
const selectedRoles = ref([])
const selectedClasses = ref([])

const showSortDropdown = ref(false)
const showRoleDropdown = ref(false)
const showClassDropdown = ref(false)

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'level', label: 'Level' },
  { value: 'atk', label: 'ATK' },
  { value: 'def', label: 'DEF' },
  { value: 'spd', label: 'SPD' }
]

const roleOptions = [
  { value: 'tank', label: 'Tank', icon: '🛡️' },
  { value: 'dps', label: 'DPS', icon: '⚔️' },
  { value: 'healer', label: 'Healer', icon: '💚' },
  { value: 'support', label: 'Support', icon: '✨' }
]

const classOptions = [
  { value: 'berserker', label: 'Berserker' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'knight', label: 'Knight' },
  { value: 'paladin', label: 'Paladin' },
  { value: 'mage', label: 'Mage' },
  { value: 'cleric', label: 'Cleric' },
  { value: 'druid', label: 'Druid' },
  { value: 'bard', label: 'Bard' },
  { value: 'alchemist', label: 'Alchemist' }
]

function toggleRole(role) {
  const index = selectedRoles.value.indexOf(role)
  if (index === -1) {
    selectedRoles.value.push(role)
  } else {
    selectedRoles.value.splice(index, 1)
  }
}

function toggleClass(classId) {
  const index = selectedClasses.value.indexOf(classId)
  if (index === -1) {
    selectedClasses.value.push(classId)
  } else {
    selectedClasses.value.splice(index, 1)
  }
}

function closeAllDropdowns() {
  showSortDropdown.value = false
  showRoleDropdown.value = false
  showClassDropdown.value = false
}

function handleFilterClickOutside(event) {
  const filterBar = event.target.closest('.filter-bar')
  if (!filterBar) {
    closeAllDropdowns()
  }
}

const filteredAndSortedHeroes = computed(() => {
  let heroes = availableHeroes.value.map(h => heroesStore.getHeroFull(h.instanceId)).filter(Boolean)

  // Filter by role
  if (selectedRoles.value.length > 0) {
    heroes = heroes.filter(hero => selectedRoles.value.includes(hero.class.role))
  }

  // Filter by class
  if (selectedClasses.value.length > 0) {
    heroes = heroes.filter(hero => selectedClasses.value.includes(hero.template.classId))
  }

  // Sort
  heroes.sort((a, b) => {
    let primary = 0
    let secondary = 0

    switch (sortBy.value) {
      case 'rarity':
        primary = b.template.rarity - a.template.rarity
        secondary = b.level - a.level
        break
      case 'level':
        primary = b.level - a.level
        secondary = b.template.rarity - a.template.rarity
        break
      case 'atk':
        primary = b.stats.atk - a.stats.atk
        secondary = b.template.rarity - a.template.rarity
        break
      case 'def':
        primary = b.stats.def - a.stats.def
        secondary = b.template.rarity - a.template.rarity
        break
      case 'spd':
        primary = b.stats.spd - a.stats.spd
        secondary = b.template.rarity - a.template.rarity
        break
      default:
        primary = b.template.rarity - a.template.rarity
        secondary = b.level - a.level
    }

    return primary !== 0 ? primary : secondary
  })

  return heroes
})

const hasActiveFilters = computed(() => {
  return sortBy.value !== 'default' ||
    selectedRoles.value.length > 0 ||
    selectedClasses.value.length > 0
})

// Pre-populate from last party if available
watch(() => props.nodeId, (nodeId) => {
  if (isActive.value) return // Don't pre-populate if exploration is active
  const saved = explorationsStore.lastParty[nodeId]
  if (!saved) return

  const availableIds = new Set(availableHeroes.value.map(h => h.instanceId))
  selectedHeroes.value = saved.filter(id => availableIds.has(id))
}, { immediate: true })

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
  if (isDeparting.value) return

  // Trigger departure animation
  isDeparting.value = true

  // Wait for animation to complete before actually starting
  setTimeout(() => {
    const result = explorationsStore.startExploration(props.nodeId, selectedHeroes.value)
    if (result.success) {
      selectedHeroes.value = []
      isDeparting.value = false
      emit('started')
    } else {
      isDeparting.value = false
    }
  }, 1800) // Animation duration
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
      <span ref="rankBadgeEl" :class="['rank-badge', `rank-${currentRank}`]">{{ currentRank }}</span>
    </header>

    <div class="detail-content">
      <!-- Exploration Banner with Heroes -->
      <div
        class="exploration-banner"
        :class="{ departing: isDeparting }"
        :style="backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : {}"
      >
        <div class="banner-overlay"></div>
        <div class="departure-fog"></div>
        <div class="banner-heroes">
          <div
            v-for="(hero, index) in displayHeroes"
            :key="index"
            :class="['banner-hero', `slot-${index}`, { empty: !hero, departing: isDeparting }]"
            :style="isDeparting ? { '--depart-delay': `${index * 0.12}s` } : {}"
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

        <button
          class="start-button start-button-top"
          :class="{ departing: isDeparting }"
          :disabled="!canStart || isDeparting"
          @click="startExploration"
        >
          {{ isDeparting ? 'Departing...' : 'Start Exploration' }}
        </button>

        <div class="hero-selection">
          <h3>Select 5 Heroes ({{ selectedHeroes.length }}/5)</h3>

          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="filter-controls">
              <!-- Sort Dropdown -->
              <div class="dropdown-container">
                <button
                  class="filter-btn"
                  :class="{ active: sortBy !== 'default' }"
                  @click.stop="showSortDropdown = !showSortDropdown; showRoleDropdown = false; showClassDropdown = false"
                >
                  <span>Sort: {{ sortOptions.find(o => o.value === sortBy)?.label || 'Default' }}</span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div v-if="showSortDropdown" class="dropdown-menu">
                  <div
                    v-for="option in sortOptions"
                    :key="option.value"
                    class="dropdown-item"
                    :class="{ selected: sortBy === option.value }"
                    @click="sortBy = option.value; showSortDropdown = false"
                  >
                    <span class="check-mark">{{ sortBy === option.value ? '✓' : '' }}</span>
                    <span>{{ option.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Role Dropdown -->
              <div class="dropdown-container">
                <button
                  class="filter-btn"
                  :class="{ active: selectedRoles.length > 0 }"
                  @click.stop="showRoleDropdown = !showRoleDropdown; showSortDropdown = false; showClassDropdown = false"
                >
                  <span>Role{{ selectedRoles.length > 0 ? ` (${selectedRoles.length})` : '' }}</span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div v-if="showRoleDropdown" class="dropdown-menu">
                  <label
                    v-for="role in roleOptions"
                    :key="role.value"
                    class="dropdown-checkbox"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedRoles.includes(role.value)"
                      @change="toggleRole(role.value)"
                    />
                    <span class="role-icon">{{ role.icon }}</span>
                    <span>{{ role.label }}</span>
                  </label>
                </div>
              </div>

              <!-- Class Dropdown -->
              <div class="dropdown-container">
                <button
                  class="filter-btn"
                  :class="{ active: selectedClasses.length > 0 }"
                  @click.stop="showClassDropdown = !showClassDropdown; showSortDropdown = false; showRoleDropdown = false"
                >
                  <span>Class{{ selectedClasses.length > 0 ? ` (${selectedClasses.length})` : '' }}</span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div v-if="showClassDropdown" class="dropdown-menu class-dropdown">
                  <label
                    v-for="cls in classOptions"
                    :key="cls.value"
                    class="dropdown-checkbox"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedClasses.includes(cls.value)"
                      @change="toggleClass(cls.value)"
                    />
                    <span>{{ cls.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredAndSortedHeroes.length === 0" class="no-heroes">
            <template v-if="hasActiveFilters">
              No heroes match current filters.
            </template>
            <template v-else>
              No available heroes. Heroes in party or on other explorations cannot be selected.
            </template>
          </div>
          <div v-else class="hero-grid">
            <HeroCard
              v-for="hero in filteredAndSortedHeroes"
              :key="hero.instanceId"
              :hero="hero"
              :selected="isHeroSelected(hero.instanceId)"
              compact
              @click="toggleHeroSelection(hero.instanceId)"
            />
          </div>
        </div>

        <button
          class="start-button"
          :class="{ departing: isDeparting }"
          :disabled="!canStart || isDeparting"
          @click="startExploration"
        >
          {{ isDeparting ? 'Departing...' : 'Start Exploration' }}
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
  padding-top: calc(20px + var(--safe-area-top));
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
  image-rendering: pixelated;
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

/* Departure Animation - March into the Unknown */
.departure-fog {
  position: absolute;
  right: -20%;
  top: 0;
  bottom: 0;
  width: 60%;
  background: linear-gradient(
    to left,
    rgba(17, 24, 39, 1) 0%,
    rgba(17, 24, 39, 0.95) 20%,
    rgba(17, 24, 39, 0.7) 50%,
    rgba(17, 24, 39, 0) 100%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease, right 1.2s ease;
  z-index: 10;
}

.exploration-banner.departing .departure-fog {
  opacity: 1;
  right: 0;
}

.banner-hero.departing {
  animation: heroMarchOff 1.6s ease-in forwards;
  animation-delay: var(--depart-delay, 0s);
}

@keyframes heroMarchOff {
  0% {
    transform: translateX(-50%);
    opacity: 1;
  }
  15% {
    /* Small anticipation - heroes shift slightly left before marching */
    transform: translateX(calc(-50% - 8px));
    opacity: 1;
  }
  100% {
    transform: translateX(calc(-50% + 150%));
    opacity: 0;
  }
}

/* Darken the banner during departure */
.exploration-banner.departing .banner-overlay {
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.6) 60%,
    rgba(0, 0, 0, 0.8) 100%
  );
  transition: background 0.8s ease;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .banner-hero.departing {
    animation: heroFadeOut 0.5s ease forwards;
    animation-delay: var(--depart-delay, 0s);
  }

  @keyframes heroFadeOut {
    to { opacity: 0; }
  }

  .departure-fog {
    transition: opacity 0.3s ease;
  }
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

/* Filter Bar */
.filter-bar {
  position: relative;
  z-index: 10;
  margin-bottom: 12px;
}

.filter-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.dropdown-container {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #4b5563;
  color: #f3f4f6;
}

.filter-btn.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.dropdown-arrow {
  font-size: 0.7rem;
  opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 150px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 6px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dropdown-menu.class-dropdown {
  min-width: 140px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.dropdown-item.selected {
  color: #60a5fa;
}

.check-mark {
  width: 16px;
  color: #60a5fa;
}

.dropdown-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.dropdown-checkbox:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.dropdown-checkbox input[type="checkbox"] {
  accent-color: #3b82f6;
  width: 16px;
  height: 16px;
}

.role-icon {
  font-size: 1rem;
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

.start-button-top {
  margin-bottom: 20px;
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-button.departing {
  opacity: 0.7;
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
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

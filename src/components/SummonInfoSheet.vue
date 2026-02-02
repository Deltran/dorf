<script setup>
import { computed, ref } from 'vue'
import { getHeroTemplate } from '../data/heroes/index.js'
import StarRating from './StarRating.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  banner: {
    type: Object,
    required: true
  },
  pityInfo: {
    type: Object,
    required: true
  },
  bannerType: {
    type: String,
    required: true,
    validator: (v) => ['normal', 'blackMarket'].includes(v)
  }
})

const emit = defineEmits(['close'])

// Touch handling for swipe-to-close
const touchStartY = ref(0)
const touchCurrentY = ref(0)
const isDragging = ref(false)

const SWIPE_THRESHOLD = 100 // pixels needed to trigger close

function handleTouchStart(e) {
  if (e.touches && e.touches.length > 0) {
    touchStartY.value = e.touches[0].clientY
    touchCurrentY.value = e.touches[0].clientY
    isDragging.value = true
  }
}

function handleTouchMove(e) {
  if (isDragging.value && e.touches && e.touches.length > 0) {
    touchCurrentY.value = e.touches[0].clientY
  }
}

function handleTouchEnd() {
  if (isDragging.value) {
    const deltaY = touchCurrentY.value - touchStartY.value
    if (deltaY > SWIPE_THRESHOLD) {
      emit('close')
    }
    isDragging.value = false
    touchStartY.value = 0
    touchCurrentY.value = 0
  }
}

function handleBackdropClick() {
  emit('close')
}

function handleCloseClick() {
  emit('close')
}

// Pool grouped by rarity (5-star down to 1-star)
const poolByRarity = computed(() => {
  if (!props.banner?.heroPool) return []

  const rarityLabels = {
    5: 'Legendary',
    4: 'Epic',
    3: 'Rare',
    2: 'Uncommon',
    1: 'Common'
  }

  return [5, 4, 3, 2, 1].map(rarity => ({
    rarity,
    label: rarityLabels[rarity],
    heroes: (props.banner.heroPool[rarity] || [])
      .map(id => getHeroTemplate(id))
      .filter(Boolean)
  })).filter(group => group.heroes.length > 0)
})

// Pity display computed based on banner type
const pityDisplay = computed(() => {
  const info = props.pityInfo
  if (!info) return []

  if (props.bannerType === 'blackMarket') {
    return [
      {
        label: '4-Star Pity',
        current: info.pullsSince4Star,
        max: info.FOUR_STAR_PITY,
        percent: info.pity4Percent,
        colorClass: 'pity-4'
      },
      {
        label: '5-Star Hard Pity',
        current: info.pullsSince5Star,
        max: info.HARD_PITY,
        percent: info.pity5HardPercent,
        colorClass: 'pity-5-hard'
      }
    ]
  }

  // Normal banner
  return [
    {
      label: '4-Star Pity',
      current: info.pullsSince4Star,
      max: info.FOUR_STAR_PITY,
      percent: info.pity4Percent,
      colorClass: 'pity-4'
    },
    {
      label: '5-Star Soft Pity',
      current: info.pullsSince5Star,
      max: info.SOFT_PITY_START,
      percent: info.pity5SoftPercent,
      colorClass: 'pity-5-soft'
    },
    {
      label: '5-Star Hard Pity',
      current: info.pullsSince5Star,
      max: info.HARD_PITY,
      percent: info.pity5HardPercent,
      colorClass: 'pity-5-hard'
    }
  ]
})

// Base summon rates
const rates = [
  { rarity: 5, label: 'Legendary', rate: '2%', color: '#f59e0b' },
  { rarity: 4, label: 'Epic', rate: '8%', color: '#a855f7' },
  { rarity: 3, label: 'Rare', rate: '20%', color: '#3b82f6' },
  { rarity: 2, label: 'Uncommon', rate: '30%', color: '#22c55e' },
  { rarity: 1, label: 'Common', rate: '40%', color: '#9ca3af' }
]
</script>

<template>
  <div v-if="visible" class="summon-info-sheet visible">
    <div class="sheet-backdrop" @click="handleBackdropClick"></div>
    <div
      class="sheet-content"
      @click.stop
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <div class="sheet-handle"></div>

      <div class="sheet-header">
        <h2 class="sheet-title">{{ banner?.name }}</h2>
        <button class="sheet-close" @click="handleCloseClick">&times;</button>
      </div>

      <div class="sheet-body">
        <!-- Rates Section -->
        <section class="rates-section">
          <h3 class="section-title">Summon Rates</h3>
          <div class="rates-grid">
            <div
              v-for="r in rates"
              :key="r.rarity"
              class="rate-item"
              :style="{ borderLeftColor: r.color }"
            >
              <StarRating :rating="r.rarity" size="sm" />
              <span class="rate-value">{{ r.rate }}</span>
            </div>
          </div>
        </section>

        <!-- Pity Section -->
        <section class="pity-section">
          <h3 class="section-title">Pity Progress</h3>
          <div class="pity-grid">
            <div
              v-for="pity in pityDisplay"
              :key="pity.label"
              class="pity-item"
            >
              <div class="pity-header">
                <span class="pity-label">{{ pity.label }}</span>
                <span class="pity-value">{{ pity.current }}/{{ pity.max }}</span>
              </div>
              <div class="pity-bar">
                <div
                  class="pity-fill"
                  :class="pity.colorClass"
                  :style="{ width: pity.percent + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Hero Pool Section -->
        <section class="pool-section">
          <h3 class="section-title">Hero Pool</h3>
          <div class="pool-list">
            <div
              v-for="group in poolByRarity"
              :key="group.rarity"
              class="pool-rarity-group"
            >
              <div class="pool-rarity-header">
                <StarRating :rating="group.rarity" size="sm" />
                <span class="pool-rarity-label">{{ group.label }}</span>
              </div>
              <div class="pool-heroes">
                <div
                  v-for="hero in group.heroes"
                  :key="hero.id"
                  class="pool-hero"
                  :class="`pool-hero-rarity-${group.rarity}`"
                >
                  <span class="pool-hero-name">{{ hero.name }}</span>
                  <span class="pool-hero-class">{{ hero.classId }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summon-info-sheet {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sheet-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
}

.sheet-content {
  position: relative;
  background: #1a1a1a;
  border-radius: 16px 16px 0 0;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  transform: translateY(0);
  transition: transform 0.3s ease-out;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
}

.summon-info-sheet.visible .sheet-content {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: #3a3a3a;
  border-radius: 2px;
  margin: 12px auto 8px;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 12px;
  border-bottom: 1px solid #2a2a2a;
}

.sheet-title {
  color: #e5e5e5;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.sheet-close {
  background: none;
  border: none;
  color: #6b6b6b;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s ease;
}

.sheet-close:hover {
  color: #e5e5e5;
}

.sheet-body {
  padding: 16px 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Section Styling */
.section-title {
  color: #6b6b6b;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px;
}

/* Rates Section */
.rates-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #2a2a2a;
}

.rates-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #222222;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #6b6b6b;
}

.rate-value {
  color: #e5e5e5;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Pity Section */
.pity-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #2a2a2a;
}

.pity-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pity-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pity-label {
  font-size: 0.8rem;
  color: #9ca3af;
}

.pity-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e5e5e5;
}

.pity-bar {
  height: 8px;
  background: #333333;
  border-radius: 4px;
  overflow: hidden;
}

.pity-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.pity-fill.pity-4 {
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
}

.pity-fill.pity-5-soft {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.pity-fill.pity-5-hard {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

/* Pool Section */
.pool-section {
  flex: 1;
}

.pool-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pool-rarity-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pool-rarity-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pool-rarity-label {
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pool-heroes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
}

.pool-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #222222;
  border-radius: 6px;
  border-left: 3px solid #4b5563;
}

.pool-hero-rarity-5 { border-left-color: #f59e0b; }
.pool-hero-rarity-4 { border-left-color: #a855f7; }
.pool-hero-rarity-3 { border-left-color: #3b82f6; }
.pool-hero-rarity-2 { border-left-color: #22c55e; }
.pool-hero-rarity-1 { border-left-color: #9ca3af; }

.pool-hero-name {
  color: #e5e5e5;
  font-size: 0.85rem;
  font-weight: 500;
}

.pool-hero-class {
  color: #6b6b6b;
  font-size: 0.75rem;
  text-transform: capitalize;
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useColosseumStore } from '../stores/colosseum.js'
import { useBattleStore } from '../stores/battle.js'
import { useHeroesStore } from '../stores/heroes.js'
import { getHeroTemplate } from '../data/heroes/index.js'
import { getClass } from '../data/classes.js'
import colosseumBg from '../assets/backgrounds/colosseum_bg.png'
import laurelIcon from '../assets/icons/laurels.png'

const emit = defineEmits(['navigate', 'startColosseumBattle'])

const colosseumStore = useColosseumStore()
const heroesStore = useHeroesStore()

const showShop = ref(false)

const currentBout = computed(() => colosseumStore.getCurrentBout())
const dailyIncome = computed(() => colosseumStore.getDailyIncome())
const allCleared = computed(() => colosseumStore.highestBout >= 50)

const roleIcons = {
  tank: '\u{1F6E1}\u{FE0F}',
  dps: '\u{2694}\u{FE0F}',
  healer: '\u{1F49A}',
  support: '\u{2728}'
}

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

function getHeroInfo(heroDef) {
  const template = getHeroTemplate(heroDef.templateId)
  if (!template) return null
  const heroClass = getClass(template.classId)
  return {
    name: template.name,
    classId: template.classId,
    className: heroClass?.title || template.classId,
    role: heroClass?.role || 'dps',
    rarity: template.rarity,
    level: heroDef.level,
    stars: heroDef.stars,
    isLeader: currentBout.value?.leader === heroDef.templateId
  }
}

function startFight() {
  if (!currentBout.value) return
  emit('startColosseumBattle', currentBout.value)
}

// Shop
const shopItems = computed(() => colosseumStore.getColosseumShopDisplay())

function purchaseItem(itemId) {
  colosseumStore.purchaseColosseumItem(itemId)
}

// Collect daily laurels on mount
onMounted(() => {
  colosseumStore.collectDailyLaurels()
})
</script>

<template>
  <div class="colosseum-screen">
    <!-- Dark vignette background -->
    <div class="bg-vignette"></div>

    <!-- Atmospheric background image -->
    <div
      class="screen-background"
      :style="{ backgroundImage: `url(${colosseumBg})` }"
    ></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'map-room')">
        <span class="back-arrow">&#8249;</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Colosseum</h1>
      <div class="laurel-display">
        <img :src="laurelIcon" alt="Laurels" class="laurel-icon" />
        <span class="laurel-count">{{ colosseumStore.laurels }}</span>
      </div>
    </header>

    <!-- Income display -->
    <div class="income-bar">
      <span class="income-label">Daily Income</span>
      <span class="income-value">{{ dailyIncome }} <img :src="laurelIcon" alt="" class="inline-laurel" />/day</span>
    </div>

    <!-- Main view: Bout preview or Shop -->
    <template v-if="!showShop">
      <!-- All cleared state -->
      <div v-if="allCleared" class="all-cleared">
        <div class="cleared-icon">&#127942;</div>
        <h2 class="cleared-title">Colosseum Conquered</h2>
        <p class="cleared-text">All 50 bouts cleared. You reign supreme.</p>
      </div>

      <!-- Bout preview -->
      <div v-else-if="currentBout" class="bout-preview">
        <div class="bout-header">
          <span class="bout-number">Bout {{ currentBout.bout }}</span>
          <span class="bout-name">{{ currentBout.name }}</span>
        </div>

        <div class="enemy-team">
          <div
            v-for="(heroDef, i) in currentBout.heroes"
            :key="i"
            class="enemy-hero-card"
            :style="{ borderColor: rarityColors[heroDef.stars] || '#9ca3af' }"
          >
            <template v-if="getHeroInfo(heroDef)">
              <div class="hero-card-header">
                <span v-if="getHeroInfo(heroDef).isLeader" class="leader-crown">&#128081;</span>
                <span class="hero-stars" :style="{ color: rarityColors[heroDef.stars] }">
                  {{ '\u2605'.repeat(heroDef.stars) }}
                </span>
              </div>
              <div class="hero-name">{{ getHeroInfo(heroDef).name }}</div>
              <div class="hero-meta">
                <span class="hero-class">{{ roleIcons[getHeroInfo(heroDef).role] }} {{ getHeroInfo(heroDef).className }}</span>
                <span class="hero-level">Lv.{{ heroDef.level }}</span>
              </div>
            </template>
          </div>
        </div>

        <div class="bout-reward">
          <span class="reward-label">First Clear</span>
          <span class="reward-value">{{ currentBout.firstClearReward }} <img :src="laurelIcon" alt="Laurels" class="inline-laurel" /></span>
        </div>

        <button class="fight-button" @click="startFight">
          <span class="fight-icon">&#9876;&#65039;</span>
          <span>Fight</span>
        </button>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${(colosseumStore.highestBout / 50) * 100}%` }"></div>
        <span class="progress-label">{{ colosseumStore.highestBout }} / 50</span>
      </div>
    </template>

    <!-- Shop view -->
    <template v-else>
      <div class="shop-section">
        <div class="shop-header">
          <h2 class="shop-title">Laurel Exchange</h2>
        </div>

        <!-- Exclusive heroes -->
        <div class="shop-category">
          <h3 class="category-title">Exclusive Heroes</h3>
          <div class="shop-items">
            <div
              v-for="item in shopItems.filter(i => i.type === 'exclusive_hero')"
              :key="item.id"
              class="shop-item placeholder-hero"
              :style="{ borderColor: rarityColors[item.rarity] || '#9ca3af' }"
            >
              <div class="item-stars" :style="{ color: rarityColors[item.rarity] }">
                {{ '\u2605'.repeat(item.rarity) }}
              </div>
              <div class="item-name">{{ item.name }}</div>
              <div class="item-coming-soon">Coming Soon</div>
              <div class="item-cost">{{ item.cost }} <img :src="laurelIcon" alt="Laurels" class="inline-laurel" /></div>
            </div>
          </div>
        </div>

        <!-- Resources -->
        <div class="shop-category">
          <h3 class="category-title">Resources</h3>
          <div class="shop-items-list">
            <div
              v-for="item in shopItems.filter(i => i.type !== 'exclusive_hero')"
              :key="item.id"
              class="shop-item-row"
            >
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-stock">{{ item.remainingStock }}/{{ item.maxStock }} ({{ item.stockType }})</span>
              </div>
              <button
                class="buy-button"
                :disabled="colosseumStore.laurels < item.cost || item.remainingStock <= 0"
                @click="purchaseItem(item.id)"
              >
                {{ item.cost }} <img :src="laurelIcon" alt="" class="inline-laurel" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Bottom toggle -->
    <div class="bottom-nav">
      <button
        class="tab-button"
        :class="{ active: !showShop }"
        @click="showShop = false"
      >
        &#9876;&#65039; Fight
      </button>
      <button
        class="tab-button"
        :class="{ active: showShop }"
        @click="showShop = true"
      >
        <img :src="laurelIcon" alt="" class="inline-laurel" /> Shop
      </button>
    </div>
  </div>
</template>

<style scoped>
.colosseum-screen {
  min-height: 100vh;
  padding: 16px;
  position: relative;
  overflow: hidden;
  padding-top: calc(16px + var(--safe-area-top));
  padding-bottom: calc(80px + var(--safe-area-bottom));
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(to bottom, #1a0a0a 0%, #111827 40%, #0a0a1a 100%);
}

/* Dark vignette background */
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

/* Atmospheric background image */
.screen-background {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  height: 100%;
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}

/* Header */
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
  font-size: 1.4rem;
  font-weight: 700;
  color: #f59e0b;
  margin: 0;
  letter-spacing: 0.05em;
}

.laurel-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 6px 12px;
}

.laurel-icon {
  height: 18px;
  width: auto;
  vertical-align: middle;
}

.inline-laurel {
  height: 14px;
  width: auto;
  vertical-align: middle;
  margin-left: 2px;
}

.laurel-count {
  color: #f59e0b;
  font-weight: 700;
  font-size: 1rem;
}

/* Income bar */
.income-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 8px 14px;
  position: relative;
  z-index: 1;
}

.income-label {
  color: #9ca3af;
  font-size: 0.85rem;
}

.income-value {
  color: #f59e0b;
  font-weight: 600;
  font-size: 0.9rem;
}

/* All cleared */
.all-cleared {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.cleared-icon {
  font-size: 3rem;
}

.cleared-title {
  color: #f59e0b;
  font-size: 1.5rem;
  margin: 0;
}

.cleared-text {
  color: #9ca3af;
  font-size: 0.95rem;
  margin: 0;
}

/* Bout preview */
.bout-preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.bout-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.bout-number {
  color: #f59e0b;
  font-weight: 700;
  font-size: 1.2rem;
}

.bout-name {
  color: #d1d5db;
  font-size: 1rem;
  font-style: italic;
}

/* Enemy team grid */
.enemy-team {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.enemy-hero-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.leader-crown {
  font-size: 1rem;
}

.hero-stars {
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.hero-name {
  color: #f3f4f6;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-class {
  color: #9ca3af;
  font-size: 0.75rem;
}

.hero-level {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Bout reward */
.bout-reward {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 8px;
  padding: 10px 14px;
}

.reward-label {
  color: #9ca3af;
  font-size: 0.85rem;
}

.reward-value {
  color: #f59e0b;
  font-weight: 600;
}

/* Fight button */
.fight-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%);
  border: none;
  border-radius: 12px;
  color: #1a0a0a;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
}

.fight-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
}

.fight-button:active {
  transform: translateY(0);
}

.fight-icon {
  font-size: 1.3rem;
}

/* Progress bar */
.progress-bar {
  position: relative;
  z-index: 1;
  height: 24px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid #334155;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #b45309, #f59e0b);
  border-radius: 12px;
  transition: width 0.5s ease;
}

.progress-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f3f4f6;
  font-size: 0.8rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* Shop */
.shop-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-title {
  color: #f3f4f6;
  font-size: 1.2rem;
  margin: 0;
}

.category-title {
  color: #9ca3af;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 10px;
}

.shop-items {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.shop-item.placeholder-hero {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  opacity: 0.6;
}

.item-stars {
  font-size: 0.7rem;
  letter-spacing: 1px;
}

.shop-item .item-name {
  color: #d1d5db;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-coming-soon {
  color: #6b7280;
  font-size: 0.65rem;
  font-style: italic;
}

.item-cost {
  color: #f59e0b;
  font-size: 0.75rem;
  font-weight: 600;
}

.shop-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-info .item-name {
  color: #f3f4f6;
  font-size: 0.9rem;
  font-weight: 500;
}

.item-stock {
  color: #6b7280;
  font-size: 0.75rem;
}

.buy-button {
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
  border: none;
  border-radius: 6px;
  color: #1a0a0a;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.buy-button:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
}

.buy-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

/* Bottom nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  display: flex;
  padding: 0 16px;
  padding-bottom: calc(8px + var(--safe-area-bottom));
  gap: 8px;
  background: linear-gradient(to top, #0a0a1a 60%, transparent);
  z-index: 10;
}

.tab-button {
  flex: 1;
  padding: 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button.active {
  background: rgba(245, 158, 11, 0.15);
  border-color: #f59e0b;
  color: #f59e0b;
}

.tab-button:hover {
  border-color: #4b5563;
}
</style>

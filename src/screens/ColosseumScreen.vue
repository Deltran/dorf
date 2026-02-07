<script setup>
import { computed, onMounted } from 'vue'
import { useColosseumStore } from '../stores/colosseum.js'
import { getHeroTemplate } from '../data/heroes/index.js'
import { getClass } from '../data/classes.js'
import colosseumBg from '../assets/backgrounds/colosseum_bg.png'
import laurelIcon from '../assets/icons/laurels.png'

const emit = defineEmits(['navigate', 'back', 'startColosseumBattle'])

const colosseumStore = useColosseumStore()

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

// Tier definitions — the journey through the colosseum
const tiers = [
  { stars: 1, name: 'The Dregs', startBout: 1, endBout: 8, color: '#9ca3af' },
  { stars: 2, name: 'Proving Grounds', startBout: 9, endBout: 16, color: '#22c55e' },
  { stars: 3, name: 'Blood & Iron', startBout: 17, endBout: 28, color: '#3b82f6' },
  { stars: 4, name: 'The Crucible', startBout: 29, endBout: 40, color: '#a855f7' },
  { stars: 5, name: 'Hall of Legends', startBout: 41, endBout: 50, color: '#f59e0b' }
]

const currentTier = computed(() => {
  const bout = colosseumStore.highestBout + 1 // next bout to clear
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (bout >= tiers[i].startBout) return tiers[i]
  }
  return tiers[0]
})

// For tier display when all cleared, show the final tier
const displayTier = computed(() => {
  if (allCleared.value) return tiers[tiers.length - 1]
  return currentTier.value
})

// All heroes, leader sorted first
const boutHeroes = computed(() => {
  if (!currentBout.value) return []
  const leader = currentBout.value.leader
  return currentBout.value.heroes
    .map(def => ({ def, info: getHeroInfo(def) }))
    .filter(h => h.info)
    .sort((a, b) => (b.info.isLeader ? 1 : 0) - (a.info.isLeader ? 1 : 0))
})

// Tier color for bout preview tinting
const boutTierColor = computed(() => {
  if (!currentBout.value) return '#9ca3af'
  const stars = currentBout.value.heroes[0]?.stars || 1
  return rarityColors[stars] || '#9ca3af'
})

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
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">&#8249;</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Colosseum</h1>
      <div class="laurel-display">
        <img :src="laurelIcon" alt="Laurels" class="laurel-icon" />
        <div class="laurel-info">
          <span class="laurel-count">{{ colosseumStore.laurels }}</span>
          <span class="laurel-income">+{{ dailyIncome }}/day</span>
        </div>
      </div>
    </header>

    <!-- All cleared — trophy room -->
    <div v-if="allCleared" class="all-cleared">
      <div class="cleared-trophy">&#127942;</div>
      <h2 class="cleared-title">Colosseum Conquered</h2>
      <p class="cleared-subtitle">All 50 bouts cleared. You reign supreme.</p>
      <div class="cleared-earnings">
        <img :src="laurelIcon" alt="Laurels" class="laurel-icon" />
        <span class="earnings-value">{{ dailyIncome }}</span>
        <span class="earnings-label">/day</span>
      </div>
      <div class="cleared-tiers">
        <div
          v-for="tier in tiers"
          :key="tier.stars"
          class="cleared-tier"
          :style="{ color: tier.color }"
        >
          <span class="cleared-tier-stars">{{ '\u2605'.repeat(tier.stars) }}</span>
          <span class="cleared-tier-name">{{ tier.name }}</span>
        </div>
      </div>
    </div>

    <!-- Bout preview — the fight card -->
    <div v-else-if="currentBout" class="bout-preview" :style="{ '--tier-color': boutTierColor }">
      <div class="bout-header">
        <span class="bout-label">Bout</span>
        <span class="bout-number">{{ currentBout.bout }}</span>
        <span class="bout-name">{{ currentBout.name }}</span>
        <span class="bout-divider"></span>
      </div>

      <div class="enemy-roster">
        <div
          v-for="(hero, i) in boutHeroes"
          :key="i"
          class="roster-card"
          :class="{ 'is-leader': hero.info.isLeader }"
          :style="{ borderColor: rarityColors[hero.def.stars] || '#9ca3af' }"
        >
          <span v-if="hero.info.isLeader" class="leader-crown">&#128081;</span>
          <div class="roster-info">
            <span class="hero-name">{{ hero.info.name }}</span>
            <span class="hero-meta">{{ roleIcons[hero.info.role] }} {{ hero.info.className }} &middot; Lv.{{ hero.def.level }}</span>
          </div>
          <span class="hero-stars" :style="{ color: rarityColors[hero.def.stars] }">
            {{ '\u2605'.repeat(hero.def.stars) }}
          </span>
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

    <!-- Tier + Progress -->
    <div class="journey-section">
      <div class="tier-label" :style="{ color: displayTier.color }">
        <span class="tier-stars">{{ '\u2605'.repeat(displayTier.stars) }}</span>
        <span class="tier-name">{{ displayTier.name }}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${(colosseumStore.highestBout / 50) * 100}%` }"></div>
        <div
          v-for="tier in tiers.slice(0, -1)"
          :key="tier.stars"
          class="tier-notch"
          :class="{ cleared: colosseumStore.highestBout >= tier.endBout }"
          :style="{ left: `${(tier.endBout / 50) * 100}%` }"
        >
          <span class="notch-line"></span>
        </div>
        <span class="progress-label">{{ colosseumStore.highestBout }} / 50</span>
      </div>
      <div class="tier-markers">
        <span
          v-for="tier in tiers"
          :key="tier.stars"
          class="tier-marker"
          :class="{ active: displayTier.stars === tier.stars, cleared: colosseumStore.highestBout >= tier.endBout }"
          :style="{
            color: colosseumStore.highestBout >= tier.startBout - 1 ? tier.color : '#374151',
            flex: `${tier.endBout - tier.startBout + 1}`
          }"
        >{{ '\u2605'.repeat(tier.stars) }}</span>
      </div>
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
  padding-bottom: calc(16px + var(--safe-area-bottom));
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

.laurel-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.laurel-count {
  color: #f59e0b;
  font-weight: 700;
  font-size: 1rem;
}

.laurel-income {
  color: #9ca3af;
  font-size: 0.65rem;
}

/* All cleared — trophy room */
.all-cleared {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.cleared-trophy {
  font-size: 4rem;
  animation: trophyPulse 3s ease-in-out infinite;
}

@keyframes trophyPulse {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.3)); }
  50% { filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.6)); }
}

.cleared-title {
  color: #f59e0b;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  margin: 0;
}

.cleared-subtitle {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0;
}

.cleared-earnings {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  padding: 10px 20px;
}

.earnings-value {
  color: #f59e0b;
  font-size: 1.3rem;
  font-weight: 900;
}

.earnings-label {
  color: #9ca3af;
  font-size: 0.85rem;
}

.cleared-tiers {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.cleared-tier {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.8;
}

.cleared-tier-stars {
  font-size: 0.6rem;
  letter-spacing: 1px;
  min-width: 50px;
  text-align: right;
}

.cleared-tier-name {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Bout preview — the fight card */
.bout-preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}

/* Bout header */
.bout-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bout-label {
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.bout-number {
  color: var(--tier-color, #f59e0b);
  font-weight: 900;
  font-size: 2rem;
  line-height: 1;
}

.bout-name {
  color: #d1d5db;
  font-size: 1.1rem;
  font-style: italic;
  font-weight: 500;
}

.bout-divider {
  width: 60px;
  height: 2px;
  background: var(--tier-color, #f59e0b);
  opacity: 0.4;
  border-radius: 1px;
  margin-top: 4px;
}

/* Enemy roster — single list, leader gets accent */
.enemy-roster {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.roster-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
}

.roster-card.is-leader {
  padding: 12px 14px;
  border-width: 2px;
}

.leader-crown {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.roster-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-name {
  color: #f3f4f6;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-leader .hero-name {
  font-size: 1rem;
  font-weight: 700;
}

.hero-meta {
  color: #6b7280;
  font-size: 0.75rem;
}

.hero-stars {
  font-size: 0.75rem;
  letter-spacing: 1px;
  flex-shrink: 0;
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

/* Journey section — tier + progress */
.journey-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tier-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.85rem;
}

.tier-stars {
  font-size: 0.7rem;
  letter-spacing: 1px;
}

.tier-name {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Progress track with tier notches */
.progress-track {
  position: relative;
  height: 24px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid #334155;
  overflow: hidden;
}

.progress-track .progress-fill {
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

.tier-notch {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-1px);
  z-index: 2;
  display: flex;
  align-items: center;
}

.notch-line {
  width: 2px;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: block;
}

.tier-notch.cleared .notch-line {
  background: rgba(245, 158, 11, 0.3);
}

/* Tier star markers below the bar */
.tier-markers {
  display: flex;
  padding: 0 2px;
}

.tier-marker {
  font-size: 0.5rem;
  letter-spacing: 0.5px;
  text-align: center;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.tier-marker.active {
  opacity: 1;
}

.tier-marker.cleared {
  opacity: 0.7;
}
</style>

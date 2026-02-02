<script setup>
import { ref, computed, watch } from 'vue'
import { useGachaStore, useTipsStore, useHeroesStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import HeroSpotlight from '../components/HeroSpotlight.vue'
import StarRating from '../components/StarRating.vue'
import EmberParticles from '../components/EmberParticles.vue'
import SummonInfoSheet from '../components/SummonInfoSheet.vue'
import summoningBg from '../assets/backgrounds/summoning.png'
import { getBannerAvailabilityText, getBannerImageUrl } from '../data/banners.js'

const emit = defineEmits(['navigate'])

const gachaStore = useGachaStore()
const tipsStore = useTipsStore()
const heroesStore = useHeroesStore()

const pullResults = ref([])
const isAnimating = ref(false)
const showResults = ref(false)
const showInfoSheet = ref(false)
const revealedCount = ref(0)
const spotlightHero = ref(null)
const pendingRevealIndex = ref(0)
const ownedBeforePull = ref(new Set())  // Templates owned before current pull
const spotlightedThisPull = ref(new Set())  // Templates already spotlighted in current reveal

// Check for unlock and show tip
watch(() => gachaStore.blackMarketUnlocked, (unlocked) => {
  if (unlocked) {
    tipsStore.showTip('black_market_unlock')
  }
}, { immediate: true })

// Sequentially reveal heroes when results are shown
watch(showResults, (newVal) => {
  if (newVal && pullResults.value.length > 0) {
    revealedCount.value = 0
    pendingRevealIndex.value = 0
    spotlightHero.value = null
    spotlightedThisPull.value = new Set()
    setTimeout(revealHeroesSequentially, 300)
  }
})

function revealHeroesSequentially() {
  if (pendingRevealIndex.value >= pullResults.value.length) {
    return // All revealed
  }

  const result = pullResults.value[pendingRevealIndex.value]
  const templateId = result.template.id

  // A hero is "new" if:
  // 1. Player didn't own this template before the pull, AND
  // 2. We haven't already spotlighted this template in this reveal session
  const isNewTemplate = !ownedBeforePull.value.has(templateId)
  const alreadySpotlighted = spotlightedThisPull.value.has(templateId)

  // Spotlight first occurrence of any new template
  if (isNewTemplate && !alreadySpotlighted) {
    spotlightedThisPull.value.add(templateId)
    spotlightHero.value = result
    return // Pause reveal until spotlight dismissed
  }

  // Normal reveal
  revealedCount.value++
  pendingRevealIndex.value++

  if (pendingRevealIndex.value < pullResults.value.length) {
    setTimeout(revealHeroesSequentially, 300)
  }
}

function onSpotlightDismiss() {
  spotlightHero.value = null
  // Resume reveal after brief delay
  setTimeout(() => {
    revealedCount.value++
    pendingRevealIndex.value++
    if (pendingRevealIndex.value < pullResults.value.length) {
      setTimeout(revealHeroesSequentially, 300)
    }
  }, 50)
}

const pityInfo = computed(() => ({
  pullsSince4Star: gachaStore.pullsSince4Star,
  pullsSince5Star: gachaStore.pullsSince5Star,
  until4StarPity: Math.max(0, gachaStore.FOUR_STAR_PITY - gachaStore.pullsSince4Star),
  until5StarSoftPity: Math.max(0, gachaStore.SOFT_PITY_START - gachaStore.pullsSince5Star),
  until5StarHardPity: Math.max(0, gachaStore.HARD_PITY - gachaStore.pullsSince5Star),
  current5StarRate: (gachaStore.current5StarRate * 100).toFixed(1),
  pity4Percent: Math.min(100, (gachaStore.pullsSince4Star / gachaStore.FOUR_STAR_PITY) * 100),
  pity5SoftPercent: Math.min(100, (gachaStore.pullsSince5Star / gachaStore.SOFT_PITY_START) * 100),
  pity5HardPercent: Math.min(100, (gachaStore.pullsSince5Star / gachaStore.HARD_PITY) * 100),
  FOUR_STAR_PITY: gachaStore.FOUR_STAR_PITY,
  SOFT_PITY_START: gachaStore.SOFT_PITY_START,
  HARD_PITY: gachaStore.HARD_PITY
}))

const activeBanners = computed(() => gachaStore.activeBanners)
const selectedBanner = computed(() => gachaStore.selectedBanner)
const bannerAvailability = computed(() => {
  if (!selectedBanner.value) return ''
  return getBannerAvailabilityText(selectedBanner.value)
})
const bannerUrgent = computed(() => {
  return bannerAvailability.value === 'Last day!'
    || bannerAvailability.value === '1 day remaining'
    || bannerAvailability.value === '2 days remaining'
    || bannerAvailability.value === '3 days remaining'
})
const bannerImageUrl = computed(() => {
  if (!selectedBanner.value) return null
  return getBannerImageUrl(selectedBanner.value.id)
})
const currentBannerIndex = computed(() => {
  return activeBanners.value.findIndex(b => b.id === gachaStore.selectedBannerId)
})

async function doSinglePull() {
  if (!gachaStore.canSinglePull || isAnimating.value) return

  isAnimating.value = true
  pullResults.value = []

  // Capture owned templates BEFORE pulling
  ownedBeforePull.value = new Set(heroesStore.collection.map(h => h.templateId))

  // Simulate animation delay
  await new Promise(r => setTimeout(r, 800))

  const result = gachaStore.singlePull()
  if (result) {
    pullResults.value = [result]
    showResults.value = true
  }

  isAnimating.value = false
}

async function doTenPull() {
  if (!gachaStore.canTenPull || isAnimating.value) return

  isAnimating.value = true
  pullResults.value = []

  // Capture owned templates BEFORE pulling
  ownedBeforePull.value = new Set(heroesStore.collection.map(h => h.templateId))

  // Simulate animation delay
  await new Promise(r => setTimeout(r, 1200))

  const results = gachaStore.tenPull()
  if (results) {
    pullResults.value = results
    showResults.value = true
  }

  isAnimating.value = false
}

function closeResults() {
  showResults.value = false
  pullResults.value = []
  revealedCount.value = 0
}

function getResultHeroData(result) {
  return {
    instanceId: result.instance.instanceId,
    templateId: result.template.id,
    level: 1,
    template: result.template,
    stats: result.template.baseStats
  }
}

function prevBanner() {
  const banners = activeBanners.value
  if (banners.length <= 1) return
  const idx = (currentBannerIndex.value - 1 + banners.length) % banners.length
  gachaStore.selectBanner(banners[idx].id)
}

function nextBanner() {
  const banners = activeBanners.value
  if (banners.length <= 1) return
  const idx = (currentBannerIndex.value + 1) % banners.length
  gachaStore.selectBanner(banners[idx].id)
}

function openInfoSheet() {
  showInfoSheet.value = true
}

function closeInfoSheet() {
  showInfoSheet.value = false
}
</script>

<template>
  <div class="gacha-screen">
    <!-- Dark vignette background -->
    <div class="bg-vignette"></div>

    <!-- Header -->
    <header class="gacha-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">&#8249;</span>
        <span>Back</span>
      </button>
      <div class="gem-display">
        <span class="gem-icon">&#128142;</span>
        <span class="gem-count">{{ gachaStore.gems.toLocaleString() }}</span>
      </div>
    </header>

    <!-- Banner Section -->
    <section class="banner-section">
      <div class="banner-frame">
        <div
          class="banner-image"
          :style="bannerImageUrl ? { backgroundImage: `url(${bannerImageUrl})` } : {}"
        >
          <div class="banner-inner-shadow"></div>
        </div>
        <!-- Navigation arrows -->
        <div class="banner-nav" v-if="activeBanners.length > 1">
          <button class="banner-arrow banner-arrow-left" @click="prevBanner">&#9668;</button>
          <button class="banner-arrow banner-arrow-right" @click="nextBanner">&#9658;</button>
        </div>
      </div>

      <!-- Banner info -->
      <h2 class="banner-name">{{ selectedBanner?.name || 'Hero Summoning' }}</h2>
      <div class="banner-availability">
        <span class="availability-text" :class="{ 'availability-urgent': bannerUrgent }">
          {{ bannerAvailability }}
        </span>
      </div>
    </section>

    <!-- Altar Section with Embers -->
    <section class="altar-section">
      <div class="altar-surface">
        <EmberParticles :count="16" palette="warm" intensity="medium" />
      </div>
    </section>

    <!-- Pull Buttons -->
    <section class="pull-buttons">
      <button
        class="pull-button single"
        :disabled="!gachaStore.canSinglePull || isAnimating"
        @click="doSinglePull"
      >
        <span class="pull-label">&#215;1</span>
      </button>

      <button
        class="pull-button ten"
        :disabled="!gachaStore.canTenPull || isAnimating"
        @click="doTenPull"
      >
        <span class="pull-label">&#215;10</span>
        <span class="pull-divider">&#183;</span>
        <span class="pull-cost">
          <span class="cost-icon">&#128142;</span>
          {{ gachaStore.TEN_PULL_COST }}
        </span>
      </button>
    </section>

    <!-- Info Button -->
    <button class="info-button" @click="openInfoSheet">?</button>

    <!-- Black Market Hidden Door -->
    <div
      v-if="gachaStore.blackMarketUnlocked"
      class="black-market-door"
      @click="emit('navigate', 'black-market')"
    >
      <span class="door-icon">&#127761;</span>
    </div>

    <!-- Animation overlay -->
    <div v-if="isAnimating" class="animation-overlay">
      <div class="summon-effect">
        <div class="altar-flare"></div>
      </div>
      <p class="summon-text">Summoning...</p>
    </div>

    <!-- Results modal -->
    <div v-if="showResults" class="results-modal" @click.self="closeResults">
      <div class="results-content">
        <div class="results-banner" :style="{ backgroundImage: `url(${summoningBg})` }">
          <div class="banner-overlay"></div>
          <div class="banner-text">
            <div class="results-sparkle left">&#10022;</div>
            <h2>Summon Results!</h2>
            <div class="results-sparkle right">&#10022;</div>
          </div>
        </div>
        <div class="results-body">
          <div class="results-grid">
            <template v-for="(result, index) in pullResults" :key="result.instance.instanceId">
              <div
                v-if="index < revealedCount"
                :class="[
                  'result-card-wrapper',
                  `rarity-${result.template.rarity}`,
                  { 'glow-epic': result.template.rarity === 4 },
                  { 'glow-legendary': result.template.rarity === 5 }
                ]"
              >
                <HeroCard
                  :hero="getResultHeroData(result)"
                  showStats
                />
              </div>
            </template>
          </div>
          <div class="results-counter">
            {{ revealedCount }} / {{ pullResults.length }}
          </div>
          <button class="close-button" @click="closeResults">
            <span>{{ revealedCount < pullResults.length ? 'Skip' : 'Continue' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Summon Info Sheet -->
    <SummonInfoSheet
      :visible="showInfoSheet"
      :banner="selectedBanner"
      :pity-info="pityInfo"
      banner-type="normal"
      @close="closeInfoSheet"
    />

    <!-- New Hero Spotlight -->
    <HeroSpotlight
      :hero="spotlightHero"
      :visible="!!spotlightHero"
      @dismiss="onSpotlightDismiss"
    />
  </div>
</template>

<style scoped>
/* ===== Base Layout ===== */
.gacha-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, #0a0a0a 0%, #121212 100%);
  padding: 16px;
}

/* ===== Dark Vignette Background ===== */
.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%);
  pointer-events: none;
  z-index: 0;
}

/* ===== Header ===== */
.gacha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid #2a2520;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #e5e5e5;
  border-color: #3a3530;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.gem-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(26, 26, 26, 0.9);
  padding: 10px 18px;
  border-radius: 24px;
  border: 1px solid #2a2520;
}

.gem-icon {
  font-size: 1.2rem;
}

.gem-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
}

/* ===== Banner Section ===== */
.banner-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.banner-frame {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 16/9;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 12px;
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.5),
    0 4px 8px rgba(0,0,0,0.3),
    0 0 0 2px #2a2520;
}

.banner-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-color: #111;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.banner-inner-shadow {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
  pointer-events: none;
}

/* ===== Banner Navigation ===== */
.banner-nav {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
  pointer-events: none;
}

.banner-arrow {
  pointer-events: auto;
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid #2a2520;
  color: #9ca3af;
  font-size: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.banner-arrow:hover {
  background: rgba(42, 37, 32, 0.9);
  color: #e5e5e5;
  transform: scale(1.1);
}

/* ===== Banner Info ===== */
.banner-name {
  color: #e5e5e5;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 12px 0 4px;
  text-align: center;
}

.banner-availability {
  text-align: center;
}

.availability-text {
  font-size: 0.85rem;
  color: #6b6b6b;
}

.availability-text.availability-urgent {
  color: #f59e0b;
  font-weight: 600;
}

/* ===== Altar Section ===== */
.altar-section {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.altar-surface {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 80px;
  background: linear-gradient(
    to top,
    #1a1816 0%,
    #221f1c 50%,
    #1a1816 100%
  );
  border-radius: 8px;
  border: 1px solid #2a2520;
  box-shadow:
    0 0 20px rgba(255, 176, 32, 0.1),
    inset 0 -4px 8px rgba(0,0,0,0.3);
  overflow: hidden;
}

/* ===== Pull Buttons ===== */
.pull-buttons {
  display: flex;
  gap: 12px;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.pull-button {
  border-radius: 10px;
  border: 1px solid #2a2520;
  background: linear-gradient(to bottom, #1a1816 0%, #141210 100%);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  color: #e5e5e5;
  font-size: 1rem;
  font-weight: 600;
}

.pull-button:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #3a3530;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.pull-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pull-button.single {
  flex: 0 0 30%;
}

.pull-button.ten {
  flex: 1;
  background: linear-gradient(to bottom, #221f1c 0%, #1a1816 100%);
  border-color: #3a3530;
  box-shadow: 0 0 15px rgba(255, 176, 32, 0.1);
}

.pull-button.ten:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(255, 176, 32, 0.2), 0 4px 12px rgba(0,0,0,0.4);
}

.pull-label {
  font-size: 1.1rem;
}

.pull-divider {
  color: #4b4b4b;
}

.pull-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #60a5fa;
}

.cost-icon {
  font-size: 0.9rem;
}

/* ===== Info Button ===== */
.info-button {
  position: relative;
  z-index: 1;
  align-self: center;
  background: transparent;
  border: 1px solid #3a3530;
  color: #6b6b6b;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.info-button:hover {
  color: #e5e5e5;
  border-color: #4b4540;
}

/* ===== Black Market Door ===== */
.black-market-door {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.black-market-door:hover {
  opacity: 1;
  transform: scale(1.1);
}

.door-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 4px rgba(64, 255, 96, 0.3));
}

/* ===== Animation Overlay ===== */
.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.summon-effect {
  position: relative;
  width: 200px;
  height: 200px;
}

.altar-flare {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255, 176, 32, 0.8) 0%, rgba(255, 96, 48, 0.4) 50%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: altarPulse 0.8s ease-in-out infinite;
}

@keyframes altarPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.7; }
}

.summon-text {
  color: #e5e5e5;
  font-size: 1.2rem;
  margin-top: 30px;
  letter-spacing: 2px;
  animation: textPulse 1s ease-in-out infinite;
}

@keyframes textPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== Results Modal ===== */
.results-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.results-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid #2a2520;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.results-banner {
  position: relative;
  width: 100%;
  height: 140px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(10, 10, 10, 0.8) 100%
  );
}

.banner-text {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.banner-text h2 {
  color: #e5e5e5;
  margin: 0;
  font-size: 1.5rem;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.results-sparkle {
  color: #ffb020;
  font-size: 1.2rem;
  animation: sparkle 1s ease-in-out infinite;
}

.results-sparkle.left {
  animation-delay: 0s;
}

.results-sparkle.right {
  animation-delay: 0.5s;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.results-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  min-height: 180px;
}

.result-card-wrapper {
  border-radius: 10px;
  animation: heroPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes heroPop {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-10deg);
  }
  60% {
    transform: scale(1.15) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.glow-epic {
  animation: heroPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, glowPurple 2s ease-in-out infinite 0.4s;
}

.glow-legendary {
  animation: heroPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, glowGolden 2s ease-in-out infinite 0.4s;
}

@keyframes glowPurple {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)); }
  50% { filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.9)); }
}

@keyframes glowGolden {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 176, 32, 0.6)); }
  50% { filter: drop-shadow(0 0 25px rgba(255, 176, 32, 0.9)); }
}

.results-counter {
  text-align: center;
  color: #6b6b6b;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.close-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.close-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}
</style>

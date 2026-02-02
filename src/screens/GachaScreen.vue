<script setup>
import { ref, computed, watch } from 'vue'
import { useGachaStore, useTipsStore, useHeroesStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import HeroSpotlight from '../components/HeroSpotlight.vue'
import StarRating from '../components/StarRating.vue'
import EmberParticles from '../components/EmberParticles.vue'
import SummonInfoSheet from '../components/SummonInfoSheet.vue'
import SummonRevealCard from '../components/SummonRevealCard.vue'
import summoningBg from '../assets/backgrounds/summoning.png'
import { getBannerAvailabilityText, getBannerImageUrl, getBlackMarketBanners } from '../data/banners.js'

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

// Touch tracking for banner swipe gestures
const bannerTouchStartX = ref(0)

// 10-pull reveal sequence state
const showRevealStage = ref(false)
const showSummaryGrid = ref(false)
const revealSequenceActive = ref(false)
const revealPaused = ref(false)  // True when spotlight is showing
const pendingSpotlightFromSummary = ref(null)  // Hero clicked in summary grid

// Timing constants (ms) per rarity
const REVEAL_TIMING = {
  1: 250,  // Common
  2: 250,  // Uncommon
  3: 250,  // Rare
  4: 400,  // Epic
  5: 500   // Legendary
}

// Ritual animation state
const ritualActive = ref(false)
const ritualPhase = ref('idle')  // 'idle' | 'gem-float' | 'ignition' | 'fade'

// View state for Black Market transition
const currentView = ref('normal')  // 'normal' | 'blackMarket'
const selectedBlackMarketBannerId = ref(null)
const isViewTransitioning = ref(false)  // Track transition state for animation

// Check for unlock and show tip
watch(() => gachaStore.blackMarketUnlocked, (unlocked) => {
  if (unlocked) {
    tipsStore.showTip('black_market_unlock')
  }
}, { immediate: true })

// Handle single pull results (direct to spotlight for new heroes)
watch(showResults, (newVal) => {
  if (newVal && pullResults.value.length === 1) {
    // Single pull - use spotlight directly for new heroes
    revealedCount.value = 0
    pendingRevealIndex.value = 0
    spotlightHero.value = null
    spotlightedThisPull.value = new Set()
    setTimeout(revealHeroesSequentially, 300)
  }
})

// Handle 10-pull reveal sequence
watch(showRevealStage, (newVal) => {
  if (newVal && pullResults.value.length > 1) {
    revealedCount.value = 0
    pendingRevealIndex.value = 0
    spotlightHero.value = null
    spotlightedThisPull.value = new Set()
    showSummaryGrid.value = false
    revealSequenceActive.value = true
    revealPaused.value = false
    setTimeout(revealNextCard, 300)
  }
})

// Get timing for revealing a card based on rarity
function getRevealTiming(rarity) {
  return REVEAL_TIMING[rarity] || 250
}

// Check if a hero is new (not owned before this pull)
function isHeroNew(result) {
  const templateId = result.template.id
  return !ownedBeforePull.value.has(templateId)
}

// Check if hero should trigger spotlight (first occurrence of new template)
function shouldSpotlight(result) {
  const templateId = result.template.id
  const isNewTemplate = !ownedBeforePull.value.has(templateId)
  const alreadySpotlighted = spotlightedThisPull.value.has(templateId)
  return isNewTemplate && !alreadySpotlighted
}

// 10-pull reveal: reveal next card
function revealNextCard() {
  if (!revealSequenceActive.value || revealPaused.value) return

  if (pendingRevealIndex.value >= pullResults.value.length) {
    // All revealed - show summary grid
    showSummaryGrid.value = true
    revealSequenceActive.value = false
    return
  }

  const result = pullResults.value[pendingRevealIndex.value]

  // Check if this hero should trigger spotlight
  if (shouldSpotlight(result)) {
    spotlightedThisPull.value.add(result.template.id)
    revealPaused.value = true
    spotlightHero.value = result
    // The card is revealed but we pause for spotlight
    revealedCount.value++
    pendingRevealIndex.value++
    return
  }

  // Normal reveal
  revealedCount.value++
  pendingRevealIndex.value++

  if (pendingRevealIndex.value < pullResults.value.length) {
    const nextResult = pullResults.value[pendingRevealIndex.value]
    const timing = getRevealTiming(nextResult?.template?.rarity || 1)
    setTimeout(revealNextCard, timing)
  } else {
    // All revealed - show summary grid
    showSummaryGrid.value = true
    revealSequenceActive.value = false
  }
}

// Advance reveal (tap to speed up)
function advanceReveal() {
  if (revealPaused.value || !revealSequenceActive.value) return

  // Immediately reveal next card
  if (pendingRevealIndex.value < pullResults.value.length) {
    revealNextCard()
  }
}

// Skip to summary grid
function skipReveal() {
  revealSequenceActive.value = false
  revealPaused.value = false
  // Reveal all cards immediately
  revealedCount.value = pullResults.value.length
  pendingRevealIndex.value = pullResults.value.length
  showSummaryGrid.value = true
}

// Handle card click in summary grid (for new heroes)
function handleSummaryCardClick(result) {
  const templateId = result.template.id
  const isNew = !ownedBeforePull.value.has(templateId)

  if (isNew && !spotlightedThisPull.value.has(templateId)) {
    spotlightedThisPull.value.add(templateId)
    pendingSpotlightFromSummary.value = result
    spotlightHero.value = result
  }
}

// Close reveal stage and return to altar
function closeRevealStage() {
  showRevealStage.value = false
  showSummaryGrid.value = false
  revealSequenceActive.value = false
  pullResults.value = []
  revealedCount.value = 0
  pendingRevealIndex.value = 0
}

// Sequential reveal for SINGLE pulls (existing logic)
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

  // Check if this was a summary grid click
  if (pendingSpotlightFromSummary.value) {
    pendingSpotlightFromSummary.value = null
    return // Stay on summary grid
  }

  // If in 10-pull reveal sequence
  if (showRevealStage.value && revealPaused.value) {
    revealPaused.value = false
    // Resume reveal after brief delay
    setTimeout(() => {
      if (pendingRevealIndex.value < pullResults.value.length) {
        const nextResult = pullResults.value[pendingRevealIndex.value]
        const timing = getRevealTiming(nextResult?.template?.rarity || 1)
        setTimeout(revealNextCard, timing)
      } else {
        // All revealed - show summary grid
        showSummaryGrid.value = true
        revealSequenceActive.value = false
      }
    }, 50)
    return
  }

  // Single pull reveal (existing logic)
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

// Black Market state
const isBlackMarketView = computed(() => currentView.value === 'blackMarket')
const blackMarketBanners = computed(() => getBlackMarketBanners())
const selectedBlackMarketBanner = computed(() => {
  if (!selectedBlackMarketBannerId.value) return blackMarketBanners.value[0] || null
  return blackMarketBanners.value.find(b => b.id === selectedBlackMarketBannerId.value) || blackMarketBanners.value[0]
})
const currentBlackMarketBannerIndex = computed(() => {
  if (!selectedBlackMarketBanner.value) return 0
  return blackMarketBanners.value.findIndex(b => b.id === selectedBlackMarketBanner.value.id)
})
const blackMarketBannerImageUrl = computed(() => {
  if (!selectedBlackMarketBanner.value) return null
  return getBannerImageUrl(selectedBlackMarketBanner.value.id)
})

// Current banner based on view
const displayBanner = computed(() => {
  if (isBlackMarketView.value) {
    return selectedBlackMarketBanner.value
  }
  return selectedBanner.value
})

const displayBannerImageUrl = computed(() => {
  if (isBlackMarketView.value) {
    return blackMarketBannerImageUrl.value
  }
  return bannerImageUrl.value
})

const displayBannerAvailability = computed(() => {
  if (isBlackMarketView.value && selectedBlackMarketBanner.value) {
    return getBannerAvailabilityText(selectedBlackMarketBanner.value)
  }
  return bannerAvailability.value
})

const displayBannerCount = computed(() => {
  return isBlackMarketView.value ? blackMarketBanners.value.length : activeBanners.value.length
})

// Black Market pity info
const blackMarketPityInfo = computed(() => ({
  pullsSince4Star: gachaStore.blackMarketPullsSince4Star,
  pullsSince5Star: gachaStore.blackMarketPullsSince5Star,
  pity4Percent: Math.min(100, (gachaStore.blackMarketPullsSince4Star / gachaStore.FOUR_STAR_PITY) * 100),
  pity5HardPercent: Math.min(100, (gachaStore.blackMarketPullsSince5Star / gachaStore.HARD_PITY) * 100),
  FOUR_STAR_PITY: gachaStore.FOUR_STAR_PITY,
  HARD_PITY: gachaStore.HARD_PITY
}))

const displayPityInfo = computed(() => {
  return isBlackMarketView.value ? blackMarketPityInfo.value : pityInfo.value
})

const displayBannerType = computed(() => {
  return isBlackMarketView.value ? 'blackMarket' : 'normal'
})

// Pull costs based on view
const displaySingleCost = computed(() => {
  return isBlackMarketView.value ? gachaStore.BLACK_MARKET_SINGLE_COST : gachaStore.SINGLE_PULL_COST
})

const displayTenCost = computed(() => {
  return isBlackMarketView.value ? gachaStore.BLACK_MARKET_TEN_COST : gachaStore.TEN_PULL_COST
})

const canDisplaySinglePull = computed(() => {
  return isBlackMarketView.value
    ? gachaStore.gems >= gachaStore.BLACK_MARKET_SINGLE_COST && selectedBlackMarketBanner.value
    : gachaStore.canSinglePull
})

const canDisplayTenPull = computed(() => {
  return isBlackMarketView.value
    ? gachaStore.gems >= gachaStore.BLACK_MARKET_TEN_COST && selectedBlackMarketBanner.value
    : gachaStore.canTenPull
})

async function runRitualAnimation(durationMs) {
  ritualActive.value = true
  ritualPhase.value = 'gem-float'

  // Phase 1: Gem float (~0.4s)
  await new Promise(r => setTimeout(r, 400))

  // Phase 2: Altar ignition (~0.4s for single, longer for 10-pull)
  ritualPhase.value = 'ignition'
  const ignitionDuration = durationMs === 1200 ? 500 : 300
  await new Promise(r => setTimeout(r, ignitionDuration))

  // Phase 3: Fade to black (~0.3s)
  ritualPhase.value = 'fade'
  await new Promise(r => setTimeout(r, durationMs - 400 - ignitionDuration))

  ritualPhase.value = 'idle'
  ritualActive.value = false
}

async function doSinglePull() {
  if (!gachaStore.canSinglePull || isAnimating.value) return

  isAnimating.value = true
  pullResults.value = []

  // Capture owned templates BEFORE pulling
  ownedBeforePull.value = new Set(heroesStore.collection.map(h => h.templateId))

  // Run ritual animation
  await runRitualAnimation(800)

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

  // Run ritual animation (longer for 10-pull)
  await runRitualAnimation(1200)

  const results = gachaStore.tenPull()
  if (results) {
    pullResults.value = results
    // Use reveal stage for 10-pull
    showRevealStage.value = true
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

// Black Market navigation
function enterBlackMarket() {
  isViewTransitioning.value = true
  currentView.value = 'blackMarket'
  if (blackMarketBanners.value.length > 0 && !selectedBlackMarketBannerId.value) {
    selectedBlackMarketBannerId.value = blackMarketBanners.value[0].id
  }
  // Clear transition flag after animation completes
  setTimeout(() => {
    isViewTransitioning.value = false
  }, 400)
}

function exitBlackMarket() {
  isViewTransitioning.value = true
  currentView.value = 'normal'
  // Clear transition flag after animation completes
  setTimeout(() => {
    isViewTransitioning.value = false
  }, 400)
}

function prevBlackMarketBanner() {
  const banners = blackMarketBanners.value
  if (banners.length <= 1) return
  const idx = (currentBlackMarketBannerIndex.value - 1 + banners.length) % banners.length
  selectedBlackMarketBannerId.value = banners[idx].id
}

function nextBlackMarketBanner() {
  const banners = blackMarketBanners.value
  if (banners.length <= 1) return
  const idx = (currentBlackMarketBannerIndex.value + 1) % banners.length
  selectedBlackMarketBannerId.value = banners[idx].id
}

// Unified banner navigation based on view
function handlePrevBanner() {
  if (isBlackMarketView.value) {
    prevBlackMarketBanner()
  } else {
    prevBanner()
  }
}

function handleNextBanner() {
  if (isBlackMarketView.value) {
    nextBlackMarketBanner()
  } else {
    nextBanner()
  }
}

// Touch handlers for banner swipe gestures
function handleBannerTouchStart(e) {
  bannerTouchStartX.value = e.touches[0].clientX
}

function handleBannerTouchEnd(e) {
  const deltaX = e.changedTouches[0].clientX - bannerTouchStartX.value
  if (deltaX > 50) handlePrevBanner()
  else if (deltaX < -50) handleNextBanner()
}

// Black Market pull functions
async function doBlackMarketSinglePull() {
  if (!canDisplaySinglePull.value || isAnimating.value) return

  isAnimating.value = true
  pullResults.value = []

  ownedBeforePull.value = new Set(heroesStore.collection.map(h => h.templateId))

  await runRitualAnimation(800)

  const result = gachaStore.blackMarketSinglePull(selectedBlackMarketBanner.value.id)
  if (result) {
    pullResults.value = [result]
    showResults.value = true
  }

  isAnimating.value = false
}

async function doBlackMarketTenPull() {
  if (!canDisplayTenPull.value || isAnimating.value) return

  isAnimating.value = true
  pullResults.value = []

  ownedBeforePull.value = new Set(heroesStore.collection.map(h => h.templateId))

  await runRitualAnimation(1200)

  const results = gachaStore.blackMarketTenPull(selectedBlackMarketBanner.value.id)
  if (results) {
    pullResults.value = results
    // Use reveal stage for 10-pull
    showRevealStage.value = true
  }

  isAnimating.value = false
}

// Unified pull handlers based on view
function handleSinglePull() {
  if (isBlackMarketView.value) {
    doBlackMarketSinglePull()
  } else {
    doSinglePull()
  }
}

function handleTenPull() {
  if (isBlackMarketView.value) {
    doBlackMarketTenPull()
  } else {
    doTenPull()
  }
}
</script>

<template>
  <div class="gacha-screen" :class="{ 'ritual-active': ritualActive, 'view-black-market': isBlackMarketView }">
    <!-- Dark vignette background -->
    <div class="bg-vignette" :class="{ 'vignette-corrupted': isBlackMarketView }"></div>

    <!-- Ritual animation elements -->
    <div v-if="ritualActive" class="ritual-overlay">
      <!-- Floating gem from header to altar -->
      <div v-if="ritualPhase === 'gem-float' || ritualPhase === 'ignition'" class="gem-float">
        <span class="gem-float-icon">&#128142;</span>
      </div>

      <!-- Altar ignition burst -->
      <div v-if="ritualPhase === 'ignition' || ritualPhase === 'fade'" class="altar-ignition">
        <div class="ignition-core" :class="{ 'ignition-corrupted': isBlackMarketView }"></div>
        <div class="ignition-burst" :class="{ 'burst-corrupted': isBlackMarketView }"></div>
        <EmberParticles :count="32" :palette="isBlackMarketView ? 'corrupt' : 'warm'" intensity="high" />
      </div>

      <!-- Fade to black overlay -->
      <div class="ritual-fade-overlay" :class="{ active: ritualPhase === 'fade' }"></div>
    </div>

    <!-- Altar Container - handles slide transitions -->
    <div class="altar-container" :class="{ 'view-black-market': isBlackMarketView, 'view-transitioning': isViewTransitioning }">
      <!-- Header -->
      <header class="gacha-header">
        <!-- Back button for Black Market view -->
        <button v-if="isBlackMarketView" class="back-button black-market-back" @click="exitBlackMarket">
          <span class="back-arrow">&#8249;</span>
          <span>Back</span>
        </button>
        <button v-else class="back-button" @click="emit('navigate', 'home')">
          <span class="back-arrow">&#8249;</span>
          <span>Back</span>
        </button>
        <div class="gem-display" :class="{ 'gem-display-corrupted': isBlackMarketView }">
          <span class="gem-icon">&#128142;</span>
          <span class="gem-count">{{ gachaStore.gems.toLocaleString() }}</span>
        </div>
      </header>

      <!-- Banner Section -->
      <section class="banner-section">
        <div class="banner-frame" :class="{ 'frame-corrupted': isBlackMarketView }" @touchstart="handleBannerTouchStart" @touchend="handleBannerTouchEnd">
          <div
            class="banner-image"
            :style="displayBannerImageUrl ? { backgroundImage: `url(${displayBannerImageUrl})` } : {}"
          >
            <div class="banner-inner-shadow"></div>
          </div>
          <!-- Navigation arrows -->
          <div class="banner-nav" v-if="displayBannerCount > 1">
            <button class="banner-arrow banner-arrow-left" :class="{ 'arrow-corrupted': isBlackMarketView }" @click="handlePrevBanner">&#9668;</button>
            <button class="banner-arrow banner-arrow-right" :class="{ 'arrow-corrupted': isBlackMarketView }" @click="handleNextBanner">&#9658;</button>
          </div>
        </div>

        <!-- Banner info -->
        <h2 class="banner-name" :class="{ 'name-corrupted': isBlackMarketView }">{{ displayBanner?.name || 'Hero Summoning' }}</h2>
        <div class="banner-availability">
          <span class="availability-text" :class="{ 'availability-urgent': bannerUrgent, 'availability-corrupted': isBlackMarketView }">
            {{ displayBannerAvailability }}
          </span>
        </div>
      </section>

      <!-- Altar Section with Embers -->
      <section class="altar-section">
        <div class="altar-surface" :class="{ 'altar-corrupted': isBlackMarketView }">
          <EmberParticles :count="16" :palette="isBlackMarketView ? 'corrupt' : 'warm'" intensity="medium" />
        </div>
      </section>

      <!-- Pull Buttons -->
      <section class="pull-buttons">
        <button
          class="pull-button single"
          :class="{ 'button-corrupted': isBlackMarketView }"
          :disabled="!canDisplaySinglePull || isAnimating"
          @click="handleSinglePull"
        >
          <span class="pull-label">&#215;1</span>
        </button>

        <button
          class="pull-button ten"
          :class="{ 'button-corrupted': isBlackMarketView }"
          :disabled="!canDisplayTenPull || isAnimating"
          @click="handleTenPull"
        >
          <span class="pull-label">&#215;10</span>
          <span class="pull-divider">&#183;</span>
          <span class="pull-cost">
            <span class="cost-icon">&#128142;</span>
            {{ displayTenCost }}
          </span>
          <span class="guarantee-badge">4★+</span>
        </button>
      </section>

      <!-- Info Button -->
      <button class="info-button" :class="{ 'info-corrupted': isBlackMarketView }" @click="openInfoSheet">?</button>
    </div>

    <!-- Black Market Hidden Door -->
    <div
      v-if="gachaStore.blackMarketUnlocked && !isBlackMarketView"
      class="black-market-door"
      @click="enterBlackMarket"
    >
      <span class="door-icon">&#127761;</span>
      <div class="door-embers">
        <EmberParticles :count="3" palette="corrupt" intensity="low" />
      </div>
    </div>

    <!-- Animation overlay (legacy - now using ritual animation) -->
    <div v-if="isAnimating && !ritualActive" class="animation-overlay">
      <div class="summon-effect">
        <div class="altar-flare"></div>
      </div>
      <p class="summon-text">Summoning...</p>
    </div>

    <!-- 10-Pull Reveal Stage -->
    <div v-if="showRevealStage" class="reveal-stage" @click="advanceReveal">
      <!-- Card reveal area -->
      <div class="reveal-cards" v-if="!showSummaryGrid">
        <template v-for="(result, index) in pullResults" :key="result.instance.instanceId">
          <SummonRevealCard
            :hero="result"
            :revealed="index < revealedCount"
            :isNew="isHeroNew(result)"
            :revealDelay="0"
            @click.stop="() => {}"
          />
        </template>
      </div>

      <!-- Summary grid (2x5 layout) -->
      <div v-if="showSummaryGrid" class="summary-grid" @click.stop>
        <template v-for="(result, index) in pullResults" :key="result.instance.instanceId">
          <SummonRevealCard
            :hero="result"
            :revealed="true"
            :isNew="isHeroNew(result)"
            @click="handleSummaryCardClick(result)"
          />
        </template>
      </div>

      <!-- Skip button during reveal -->
      <button
        v-if="!showSummaryGrid"
        class="skip-reveal-button"
        @click.stop="skipReveal"
      >
        Skip
      </button>

      <!-- Continue button in summary -->
      <button
        v-if="showSummaryGrid"
        class="continue-button"
        @click.stop="closeRevealStage"
      >
        Continue
      </button>

      <!-- Progress indicator -->
      <div class="reveal-progress" v-if="!showSummaryGrid">
        {{ revealedCount }} / {{ pullResults.length }}
      </div>
    </div>

    <!-- Results modal (for single pulls only) -->
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
      :banner="displayBanner"
      :pity-info="displayPityInfo"
      :banner-type="displayBannerType"
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

.door-embers {
  position: absolute;
  inset: -10px;
  pointer-events: none;
}

/* ===== Altar Container for Slide Transitions ===== */
.altar-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  z-index: 1;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.altar-container.view-transitioning {
  opacity: 0;
}

.altar-container.view-black-market.view-transitioning {
  opacity: 0;
  animation: slideInFromRight 0.4s ease-in-out forwards 0.1s;
}

@keyframes slideInFromRight {
  0% {
    opacity: 0;
    transform: translateX(30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ===== Corrupted Black Market Palette ===== */

/* Vignette with green tint */
.bg-vignette.vignette-corrupted {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 20, 0, 0.85) 100%);
}

/* Corrupted banner frame */
.banner-frame.frame-corrupted {
  background: #0f1a0f;
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.6),
    0 4px 8px rgba(0,0,0,0.4),
    0 0 0 2px #1a3020,
    0 0 15px rgba(64, 255, 96, 0.15);
}

/* Corrupted navigation arrows */
.banner-arrow.arrow-corrupted {
  background: rgba(15, 26, 15, 0.9);
  border-color: #1a3020;
  color: #40ff60;
}

.banner-arrow.arrow-corrupted:hover {
  background: rgba(26, 48, 32, 0.9);
  color: #60ff80;
  border-color: #2a4530;
}

/* Corrupted banner name */
.banner-name.name-corrupted {
  color: #40ff60;
  text-shadow: 0 0 10px rgba(64, 255, 96, 0.3);
}

/* Corrupted availability text */
.availability-text.availability-corrupted {
  color: #ff2020;
}

/* Corrupted altar surface */
.altar-surface.altar-corrupted {
  background: linear-gradient(
    to top,
    #0a1a0a 0%,
    #102010 50%,
    #0a1a0a 100%
  );
  border-color: #1a3020;
  box-shadow:
    0 0 20px rgba(64, 255, 96, 0.15),
    0 0 30px rgba(255, 32, 32, 0.1),
    inset 0 -4px 8px rgba(0,0,0,0.4);
}

/* Corrupted pull buttons */
.pull-button.button-corrupted {
  background: linear-gradient(to bottom, #0f1a0f 0%, #0a120a 100%);
  border-color: #1a3020;
}

.pull-button.button-corrupted:hover:not(:disabled) {
  border-color: #2a4530;
  box-shadow: 0 4px 12px rgba(0, 20, 0, 0.5), 0 0 15px rgba(64, 255, 96, 0.2);
}

.pull-button.ten.button-corrupted {
  background: linear-gradient(to bottom, #152015 0%, #0f1a0f 100%);
  border-color: #1a3020;
  box-shadow: 0 0 15px rgba(64, 255, 96, 0.15);
}

.pull-button.ten.button-corrupted:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(64, 255, 96, 0.25), 0 4px 12px rgba(0, 20, 0, 0.5);
}

/* Corrupted info button */
.info-button.info-corrupted {
  border-color: #1a3020;
  color: #40ff60;
}

.info-button.info-corrupted:hover {
  color: #60ff80;
  border-color: #2a4530;
}

/* Corrupted gem display */
.gem-display.gem-display-corrupted {
  border-color: #1a3020;
  background: rgba(15, 26, 15, 0.9);
}

/* Black Market back button */
.back-button.black-market-back {
  border-color: #1a3020;
  color: #40ff60;
}

.back-button.black-market-back:hover {
  color: #60ff80;
  border-color: #2a4530;
}

/* Corrupted ignition effects */
.ignition-core.ignition-corrupted {
  background: radial-gradient(circle, rgba(100, 255, 140, 0.9) 0%, rgba(64, 255, 96, 0.6) 40%, transparent 70%);
}

.ignition-burst.burst-corrupted {
  background: radial-gradient(circle, rgba(64, 255, 96, 0.5) 0%, rgba(255, 32, 32, 0.3) 30%, transparent 60%);
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

/* ===== 10-Pull Reveal Stage ===== */
.reveal-stage {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #050505;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
  cursor: pointer;
}

.reveal-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  max-width: 600px;
  padding: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  max-width: 580px;
  padding: 16px;
}

@media (max-width: 500px) {
  .summary-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    padding: 12px;
  }
}

.skip-reveal-button {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 20px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.skip-reveal-button:hover {
  background: rgba(50, 50, 50, 0.9);
  color: #e5e5e5;
}

.continue-button {
  margin-top: 24px;
  padding: 16px 48px;
  background: linear-gradient(to bottom, #2a2520 0%, #1a1816 100%);
  border: 1px solid #3a3530;
  border-radius: 12px;
  color: #e5e5e5;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.continue-button:hover {
  transform: translateY(-2px);
  border-color: #4b4540;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}

.reveal-progress {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: #6b6b6b;
  font-size: 0.85rem;
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
  background: linear-gradient(to bottom, #2a2520 0%, #1a1816 100%);
  border: 1px solid #3a3530;
  border-radius: 12px;
  color: #e5e5e5;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.close-button:hover {
  transform: translateY(-2px);
  border-color: #4b4540;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}

/* ===== Ritual Animation ===== */
.ritual-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.gem-float {
  position: absolute;
  top: 40px;
  right: 80px;
  z-index: 52;
  animation: gemFloatToAltar 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.gem-float-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.8));
}

@keyframes gemFloatToAltar {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(calc(50vh - 100px)) translateX(-30vw) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(calc(50vh - 40px)) translateX(-30vw) scale(0.5);
  }
}

.altar-ignition {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 200px;
  transform: translate(-50%, -30%);
  z-index: 51;
  overflow: visible;
}

.ignition-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(255, 200, 100, 0.9) 0%, rgba(255, 140, 40, 0.6) 40%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ignitionCorePulse 0.6s ease-out forwards;
}

@keyframes ignitionCorePulse {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0.8;
  }
}

.ignition-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 176, 32, 0.5) 0%, rgba(255, 96, 48, 0.3) 30%, transparent 60%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ignitionBurst 0.6s ease-out forwards;
}

@keyframes ignitionBurst {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  40% {
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

.ritual-fade-overlay {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: 0;
  transition: opacity 0.3s ease-in;
  z-index: 53;
}

.ritual-fade-overlay.active {
  opacity: 1;
}

/* Dim the main UI during ritual */
.gacha-screen.ritual-active .gacha-header,
.gacha-screen.ritual-active .banner-section,
.gacha-screen.ritual-active .pull-buttons,
.gacha-screen.ritual-active .info-button {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.gacha-screen.ritual-active .altar-section {
  opacity: 1;
}

/* Reduced motion: instant transitions */
@media (prefers-reduced-motion: reduce) {
  .gem-float,
  .ignition-core,
  .ignition-burst,
  .ritual-fade-overlay {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

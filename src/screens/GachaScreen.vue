<script setup>
import { ref, computed, watch } from 'vue'
import { useGachaStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import StarRating from '../components/StarRating.vue'
import summoningBg from '../assets/backgrounds/summoning.png'
import { getBannerAvailabilityText, getBannerImageUrl } from '../data/banners.js'

const emit = defineEmits(['navigate'])

const gachaStore = useGachaStore()

const pullResults = ref([])
const isAnimating = ref(false)
const showResults = ref(false)
const revealedCount = ref(0)

// Sequentially reveal heroes when results are shown
watch(showResults, (newVal) => {
  if (newVal && pullResults.value.length > 0) {
    revealedCount.value = 0
    revealHeroesSequentially()
  }
})

function revealHeroesSequentially() {
  if (revealedCount.value < pullResults.value.length) {
    revealedCount.value++
    setTimeout(revealHeroesSequentially, 300)
  }
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
  pity5HardPercent: Math.min(100, (gachaStore.pullsSince5Star / gachaStore.HARD_PITY) * 100)
}))

const activeBanners = computed(() => gachaStore.activeBanners)
const selectedBanner = computed(() => gachaStore.selectedBanner)
const bannerAvailability = computed(() => {
  if (!selectedBanner.value) return ''
  return getBannerAvailabilityText(selectedBanner.value)
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
</script>

<template>
  <div class="gacha-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-stars"></div>
    <div class="bg-vignette"></div>

    <header class="gacha-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Summon</h1>
      <div class="gem-display">
        <div class="gem-glow"></div>
        <span class="gem-icon">💎</span>
        <span class="gem-count">{{ gachaStore.gems.toLocaleString() }}</span>
      </div>
    </header>

    <section class="banner-area">
      <div class="banner" :style="bannerImageUrl ? { backgroundImage: `url(${bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}">
        <div class="banner-glow"></div>
        <div class="banner-nav" v-if="activeBanners.length > 1">
          <button class="banner-arrow banner-arrow-left" @click="prevBanner">‹</button>
          <button class="banner-arrow banner-arrow-right" @click="nextBanner">›</button>
        </div>
        <div class="banner-content">
          <span class="banner-label">{{ selectedBanner?.permanent ? 'Standard Banner' : 'Featured Banner' }}</span>
          <h2>{{ selectedBanner?.name || 'Hero Summoning' }}</h2>
          <p>{{ selectedBanner?.description || 'Call forth powerful heroes to join your party!' }}</p>
        </div>
        <div class="banner-stars">
          <span>&#10022;</span><span>&#10022;</span><span>&#10022;</span>
        </div>
      </div>
      <div class="banner-availability">
        <span class="availability-text" :class="{ 'availability-urgent': bannerAvailability.includes('remaining') || bannerAvailability.includes('Last') }">
          {{ bannerAvailability }}
        </span>
        <div class="banner-dots" v-if="activeBanners.length > 1">
          <span
            v-for="(b, i) in activeBanners"
            :key="b.id"
            class="banner-dot"
            :class="{ active: i === currentBannerIndex }"
            @click="gachaStore.selectBanner(b.id)"
          ></span>
        </div>
      </div>
    </section>

    <section class="rates-info">
      <div class="section-header">
        <div class="section-line"></div>
        <h3>Summon Rates</h3>
        <div class="section-line"></div>
      </div>
      <div class="rate-grid">
        <div class="rate rate-5">
          <div class="rate-stars">
            <StarRating :rating="5" size="sm" />
          </div>
          <span class="rate-value">{{ pityInfo.current5StarRate }}%</span>
          <span class="rate-label">Legendary</span>
        </div>
        <div class="rate rate-4">
          <div class="rate-stars">
            <StarRating :rating="4" size="sm" />
          </div>
          <span class="rate-value">8%</span>
          <span class="rate-label">Epic</span>
        </div>
        <div class="rate rate-3">
          <div class="rate-stars">
            <StarRating :rating="3" size="sm" />
          </div>
          <span class="rate-value">20%</span>
          <span class="rate-label">Rare</span>
        </div>
      </div>
    </section>

    <section class="pity-info">
      <div class="section-header">
        <div class="section-line"></div>
        <h3>Pity Progress</h3>
        <div class="section-line"></div>
      </div>
      <div class="pity-grid">
        <div class="pity-item">
          <div class="pity-header">
            <span class="pity-label">4★ Pity</span>
            <span class="pity-value">{{ pityInfo.pullsSince4Star }}/{{ gachaStore.FOUR_STAR_PITY }}</span>
          </div>
          <div class="pity-bar">
            <div class="pity-fill pity-4" :style="{ width: pityInfo.pity4Percent + '%' }"></div>
          </div>
        </div>
        <div class="pity-item">
          <div class="pity-header">
            <span class="pity-label">5★ Soft Pity</span>
            <span class="pity-value">{{ pityInfo.pullsSince5Star }}/{{ gachaStore.SOFT_PITY_START }}</span>
          </div>
          <div class="pity-bar">
            <div class="pity-fill pity-5-soft" :style="{ width: pityInfo.pity5SoftPercent + '%' }"></div>
          </div>
        </div>
        <div class="pity-item">
          <div class="pity-header">
            <span class="pity-label">5★ Hard Pity</span>
            <span class="pity-value">{{ pityInfo.pullsSince5Star }}/{{ gachaStore.HARD_PITY }}</span>
          </div>
          <div class="pity-bar">
            <div class="pity-fill pity-5-hard" :style="{ width: pityInfo.pity5HardPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="pull-buttons">
      <button
        class="pull-button single"
        :disabled="!gachaStore.canSinglePull || isAnimating"
        @click="doSinglePull"
      >
        <div class="pull-icon">✦</div>
        <div class="pull-content">
          <span class="pull-label">Single Pull</span>
          <span class="pull-cost">
            <span class="cost-icon">💎</span>
            {{ gachaStore.SINGLE_PULL_COST }}
          </span>
        </div>
      </button>

      <button
        class="pull-button ten"
        :disabled="!gachaStore.canTenPull || isAnimating"
        @click="doTenPull"
      >
        <div class="pull-icon">✦✦✦</div>
        <div class="pull-content">
          <span class="pull-label">10 Pull</span>
          <span class="pull-cost">
            <span class="cost-icon">💎</span>
            {{ gachaStore.TEN_PULL_COST }}
          </span>
        </div>
        <span class="pull-bonus">Guaranteed 4★+</span>
      </button>
    </section>

    <!-- Animation overlay -->
    <div v-if="isAnimating" class="animation-overlay">
      <div class="summon-effect">
        <div class="summon-ring ring-1"></div>
        <div class="summon-ring ring-2"></div>
        <div class="summon-ring ring-3"></div>
        <div class="summon-core"></div>
      </div>
      <p class="summon-text">Summoning...</p>
    </div>

    <!-- Results modal -->
    <div v-if="showResults" class="results-modal" @click.self="closeResults">
      <div class="results-content">
        <div class="results-banner" :style="{ backgroundImage: `url(${summoningBg})` }">
          <div class="banner-overlay"></div>
          <div class="banner-text">
            <div class="results-sparkle left">✦</div>
            <h2>Summon Results!</h2>
            <div class="results-sparkle right">✦</div>
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
  </div>
</template>

<style scoped>
/* ===== Base Layout ===== */
.gacha-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* ===== Animated Background ===== */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #1e1b4b 0%,
    #312e81 25%,
    #4c1d95 50%,
    #312e81 75%,
    #1e1b4b 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-stars {
  background-image:
    radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.3), transparent),
    radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.2), transparent),
    radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.4), transparent);
  background-size: 200px 200px;
  animation: starsTwinkle 4s ease-in-out infinite;
}

@keyframes starsTwinkle {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%);
  pointer-events: none;
  z-index: -1;
}

/* ===== Header ===== */
.gacha-header {
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
  text-shadow: 0 2px 10px rgba(168, 85, 247, 0.5);
}

.gem-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 10px 18px;
  border-radius: 24px;
  border: 1px solid #334155;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.gem-glow {
  position: absolute;
  top: 50%;
  left: 20px;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.4) 0%, transparent 70%);
  transform: translateY(-50%);
  animation: gemPulse 2s ease-in-out infinite;
}

@keyframes gemPulse {
  0%, 100% { opacity: 0.5; transform: translateY(-50%) scale(1); }
  50% { opacity: 1; transform: translateY(-50%) scale(1.2); }
}

.gem-icon {
  font-size: 1.2rem;
  position: relative;
  z-index: 1;
}

.gem-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
  position: relative;
  z-index: 1;
}

/* ===== Banner ===== */
.banner-area {
  position: relative;
  z-index: 1;
}

.banner {
  background: linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #6d28d9 100%);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 8px 32px rgba(109, 40, 217, 0.3);
}

.banner-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 50%);
  animation: bannerPulse 3s ease-in-out infinite;
}

@keyframes bannerPulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
}

.banner-content {
  position: relative;
  z-index: 1;
}

.banner-label {
  font-size: 0.75rem;
  color: #c4b5fd;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.banner h2 {
  color: #f3f4f6;
  margin: 8px 0;
  font-size: 1.5rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.banner p {
  color: #c4b5fd;
  margin: 0;
  font-size: 0.9rem;
}

.banner-stars {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 16px;
  color: #fbbf24;
  font-size: 1.2rem;
  animation: starsFloat 2s ease-in-out infinite;
}

@keyframes starsFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.banner-stars span:nth-child(2) {
  animation-delay: 0.2s;
}

.banner-stars span:nth-child(3) {
  animation-delay: 0.4s;
}

/* ===== Section Headers ===== */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  white-space: nowrap;
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #374151 50%, transparent 100%);
}

/* ===== Rates ===== */
.rates-info {
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #334155;
}

.rate-grid {
  display: flex;
  justify-content: space-around;
  gap: 12px;
}

.rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: rgba(55, 65, 81, 0.5);
  border-radius: 10px;
  flex: 1;
  transition: transform 0.2s ease;
}

.rate:hover {
  transform: translateY(-2px);
}

.rate-5 { border-bottom: 2px solid #f59e0b; }
.rate-4 { border-bottom: 2px solid #a855f7; }
.rate-3 { border-bottom: 2px solid #3b82f6; }

.rate-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f3f4f6;
}

.rate-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
}

/* ===== Pity ===== */
.pity-info {
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #334155;
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
  color: #f3f4f6;
}

.pity-bar {
  height: 8px;
  background: #374151;
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

/* ===== Pull Buttons ===== */
.pull-buttons {
  display: flex;
  gap: 16px;
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.pull-button {
  flex: 1;
  padding: 20px;
  border-radius: 14px;
  border: 2px solid #374151;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.pull-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.5s ease;
}

.pull-button:hover:not(:disabled)::before {
  left: 100%;
}

.pull-button:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
}

.pull-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pull-button.ten {
  border-color: #7c3aed;
  background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%);
}

.pull-button.ten:hover:not(:disabled) {
  border-color: #a78bfa;
  box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4);
}

.pull-icon {
  font-size: 1.5rem;
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.pull-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pull-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.pull-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1rem;
  color: #60a5fa;
}

.cost-icon {
  font-size: 0.9rem;
}

.pull-bonus {
  font-size: 0.7rem;
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.2);
  padding: 4px 10px;
  border-radius: 10px;
  margin-top: 4px;
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

.summon-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 100px;
  height: 100px;
  border-color: #a855f7;
  animation: ringPulse 1.5s ease-in-out infinite;
}

.ring-2 {
  width: 140px;
  height: 140px;
  border-color: #c084fc;
  animation: ringPulse 1.5s ease-in-out infinite 0.2s;
}

.ring-3 {
  width: 180px;
  height: 180px;
  border-color: #e9d5ff;
  animation: ringPulse 1.5s ease-in-out infinite 0.4s;
}

@keyframes ringPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.5; }
}

.summon-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: corePulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
}

@keyframes corePulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

.summon-text {
  color: #f3f4f6;
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
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid #334155;
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
    rgba(30, 27, 75, 0.7) 100%
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
  color: #f3f4f6;
  margin: 0;
  font-size: 1.5rem;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.results-sparkle {
  color: #fbbf24;
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
  0%, 100% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); }
  50% { filter: drop-shadow(0 0 25px rgba(251, 191, 36, 0.9)); }
}

.results-counter {
  text-align: center;
  color: #6b7280;
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

/* ===== Banner Navigation ===== */
.banner-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  pointer-events: none;
}

.banner-arrow {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f3f4f6;
  font-size: 1.8rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin: 0 8px;
  line-height: 1;
}

.banner-arrow:hover {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

/* ===== Banner Availability + Dots ===== */
.banner-availability {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px 0;
}

.availability-text {
  font-size: 0.8rem;
  color: #9ca3af;
  letter-spacing: 0.5px;
}

.availability-text.availability-urgent {
  color: #f59e0b;
  font-weight: 600;
}

.banner-dots {
  display: flex;
  gap: 8px;
}

.banner-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-dot.active {
  background: #a78bfa;
  box-shadow: 0 0 6px rgba(167, 139, 250, 0.5);
}

.banner-dot:hover {
  background: #6b7280;
}
</style>

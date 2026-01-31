<script setup>
import { ref, computed } from 'vue'
import { useGachaStore } from '../stores'
import { getBlackMarketBanners } from '../data/banners.js'
import { getHeroTemplate } from '../data/heroes/index.js'

const emit = defineEmits(['pull-results'])

const gachaStore = useGachaStore()

const selectedBannerId = ref(null)
const isAnimating = ref(false)

const blackMarketBanners = computed(() => getBlackMarketBanners())

const selectedBanner = computed(() => {
  if (!selectedBannerId.value) return blackMarketBanners.value[0] || null
  return blackMarketBanners.value.find(b => b.id === selectedBannerId.value)
})

const canSinglePull = computed(() =>
  gachaStore.gems >= gachaStore.BLACK_MARKET_SINGLE_COST && selectedBanner.value
)
const canTenPull = computed(() =>
  gachaStore.gems >= gachaStore.BLACK_MARKET_TEN_COST && selectedBanner.value
)

const dealerQuotes = [
  "These fell off a caravan, if you catch my meaning...",
  "No refunds. No questions. No witnesses.",
  "You didn't get this from me.",
  "Premium goods for discerning customers..."
]

const currentQuote = computed(() => {
  const index = Math.floor(Date.now() / 60000) % dealerQuotes.length
  return dealerQuotes[index]
})

const slotLabels = {
  last: 'LAST MONTH',
  next: 'NEXT MONTH',
  vault: 'VAULT'
}

const pityInfo = computed(() => ({
  pullsSince4Star: gachaStore.blackMarketPullsSince4Star,
  pullsSince5Star: gachaStore.blackMarketPullsSince5Star,
  pity4Percent: Math.min(100, (gachaStore.blackMarketPullsSince4Star / gachaStore.FOUR_STAR_PITY) * 100),
  pity5HardPercent: Math.min(100, (gachaStore.blackMarketPullsSince5Star / gachaStore.HARD_PITY) * 100)
}))

function selectBanner(bannerId) {
  selectedBannerId.value = bannerId
}

async function doSinglePull() {
  if (!canSinglePull.value || isAnimating.value) return

  isAnimating.value = true
  await new Promise(r => setTimeout(r, 800))

  const result = gachaStore.blackMarketSinglePull(selectedBanner.value.id)
  if (result) {
    emit('pull-results', [result])
  }

  isAnimating.value = false
}

async function doTenPull() {
  if (!canTenPull.value || isAnimating.value) return

  isAnimating.value = true
  await new Promise(r => setTimeout(r, 1200))

  const results = gachaStore.blackMarketTenPull(selectedBanner.value.id)
  if (results) {
    emit('pull-results', results)
  }

  isAnimating.value = false
}

function getPoolPreview(banner) {
  if (!banner?.heroPool) return []
  const heroes5 = (banner.heroPool[5] || []).map(id => getHeroTemplate(id)).filter(Boolean)
  return heroes5.slice(0, 3)
}
</script>

<template>
  <div class="black-market">
    <!-- Dealer area with space for goblin art -->
    <div class="dealer-area">
      <div class="dealer-quote">
        <span class="quote-mark">"</span>
        {{ currentQuote }}
        <span class="quote-mark">"</span>
      </div>
      <!-- Space for goblin art in upper right -->
      <div class="goblin-space"></div>
    </div>

    <!-- Empty state -->
    <div v-if="blackMarketBanners.length === 0" class="empty-state">
      <p class="empty-text">Shelves are empty... check back later.</p>
    </div>

    <!-- Banner list -->
    <div v-else class="banner-list">
      <div
        v-for="banner in blackMarketBanners"
        :key="banner.id"
        class="banner-card"
        :class="{ selected: selectedBanner?.id === banner.id }"
        @click="selectBanner(banner.id)"
      >
        <div class="banner-slot-label">{{ slotLabels[banner.blackMarketSlot] }}</div>
        <div class="banner-info">
          <h3 class="banner-name">{{ banner.name }}</h3>
          <div class="banner-preview">
            <span
              v-for="hero in getPoolPreview(banner)"
              :key="hero.id"
              class="preview-hero"
            >
              {{ hero.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pity info -->
    <div class="pity-section" v-if="blackMarketBanners.length > 0">
      <div class="pity-header">
        <span class="pity-label">Black Market Pity</span>
      </div>
      <div class="pity-bars">
        <div class="pity-item">
          <span class="pity-text">4★: {{ pityInfo.pullsSince4Star }}/{{ gachaStore.FOUR_STAR_PITY }}</span>
          <div class="pity-bar">
            <div class="pity-fill pity-4" :style="{ width: pityInfo.pity4Percent + '%' }"></div>
          </div>
        </div>
        <div class="pity-item">
          <span class="pity-text">5★: {{ pityInfo.pullsSince5Star }}/{{ gachaStore.HARD_PITY }}</span>
          <div class="pity-bar">
            <div class="pity-fill pity-5" :style="{ width: pityInfo.pity5HardPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pull buttons -->
    <div class="pull-buttons" v-if="blackMarketBanners.length > 0">
      <button
        class="pull-button single"
        :disabled="!canSinglePull || isAnimating"
        @click="doSinglePull"
      >
        <div class="pull-content">
          <span class="pull-label">Single</span>
          <span class="pull-cost">
            <span class="cost-icon">💎</span>
            {{ gachaStore.BLACK_MARKET_SINGLE_COST }}
          </span>
        </div>
      </button>

      <button
        class="pull-button ten"
        :disabled="!canTenPull || isAnimating"
        @click="doTenPull"
      >
        <div class="pull-content">
          <span class="pull-label">10 Pull</span>
          <span class="pull-cost">
            <span class="cost-icon">💎</span>
            {{ gachaStore.BLACK_MARKET_TEN_COST }}
          </span>
        </div>
        <span class="pull-bonus">Guaranteed 4★+</span>
      </button>
    </div>

    <!-- Animation overlay -->
    <div v-if="isAnimating" class="animation-overlay">
      <div class="summon-effect">
        <div class="summon-ring ring-1"></div>
        <div class="summon-ring ring-2"></div>
        <div class="summon-core"></div>
      </div>
      <p class="summon-text">Summoning...</p>
    </div>
  </div>
</template>

<style scoped>
.black-market {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Dealer Area ===== */
.dealer-area {
  position: relative;
  background: linear-gradient(135deg, rgba(20, 10, 30, 0.9) 0%, rgba(40, 15, 35, 0.9) 100%);
  border: 1px solid #4a1942;
  border-radius: 12px;
  padding: 20px;
  min-height: 80px;
}

.dealer-quote {
  color: #d4a5a5;
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 70%;
}

.quote-mark {
  color: #991b1b;
  font-size: 1.2rem;
}

.goblin-space {
  position: absolute;
  top: -20px;
  right: -10px;
  width: 100px;
  height: 100px;
  /* Space reserved for goblin art */
}

/* ===== Empty State ===== */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-text {
  color: #6b7280;
  font-style: italic;
}

/* ===== Banner List ===== */
.banner-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.banner-card {
  background: linear-gradient(135deg, rgba(30, 20, 40, 0.8) 0%, rgba(20, 10, 25, 0.8) 100%);
  border: 1px solid #4a1942;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-card:hover {
  border-color: #6b2158;
  transform: translateX(4px);
}

.banner-card.selected {
  border-color: #991b1b;
  background: linear-gradient(135deg, rgba(50, 20, 40, 0.9) 0%, rgba(30, 10, 25, 0.9) 100%);
  box-shadow: 0 0 20px rgba(153, 27, 27, 0.3);
}

.banner-slot-label {
  font-size: 0.65rem;
  color: #991b1b;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.banner-name {
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.banner-preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-hero {
  font-size: 0.75rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

/* ===== Pity Section ===== */
.pity-section {
  background: rgba(20, 10, 30, 0.6);
  border: 1px solid #3a1232;
  border-radius: 10px;
  padding: 12px 16px;
}

.pity-header {
  margin-bottom: 10px;
}

.pity-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pity-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pity-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pity-text {
  font-size: 0.8rem;
  color: #d1d5db;
  min-width: 70px;
}

.pity-bar {
  flex: 1;
  height: 6px;
  background: #374151;
  border-radius: 3px;
  overflow: hidden;
}

.pity-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.pity-fill.pity-4 {
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
}

.pity-fill.pity-5 {
  background: linear-gradient(90deg, #991b1b 0%, #dc2626 100%);
}

/* ===== Pull Buttons ===== */
.pull-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.pull-button {
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #4a1942;
  background: linear-gradient(135deg, #2d1a2e 0%, #1a0f1a 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.pull-button:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: #991b1b;
  box-shadow: 0 6px 20px rgba(153, 27, 27, 0.4);
}

.pull-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pull-button.ten {
  border-color: #991b1b;
  background: linear-gradient(135deg, #3d1a2e 0%, #2a0f1a 100%);
}

.pull-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pull-label {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.pull-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.95rem;
  color: #60a5fa;
}

.cost-icon {
  font-size: 0.85rem;
}

.pull-bonus {
  font-size: 0.65rem;
  color: #fca5a5;
  background: rgba(220, 38, 38, 0.2);
  padding: 3px 8px;
  border-radius: 8px;
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
  width: 150px;
  height: 150px;
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
  width: 80px;
  height: 80px;
  border-color: #991b1b;
  animation: ringPulse 1.5s ease-in-out infinite;
}

.ring-2 {
  width: 120px;
  height: 120px;
  border-color: #dc2626;
  animation: ringPulse 1.5s ease-in-out infinite 0.2s;
}

@keyframes ringPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.5; }
}

.summon-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #dc2626 0%, #991b1b 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: corePulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 25px rgba(220, 38, 38, 0.6);
}

@keyframes corePulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

.summon-text {
  color: #fca5a5;
  font-size: 1.1rem;
  margin-top: 24px;
  letter-spacing: 2px;
}
</style>

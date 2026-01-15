<script setup>
import { ref, computed } from 'vue'
import { useGachaStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import StarRating from '../components/StarRating.vue'

const emit = defineEmits(['navigate'])

const gachaStore = useGachaStore()

const pullResults = ref([])
const isAnimating = ref(false)
const showResults = ref(false)

const pityInfo = computed(() => ({
  pullsSince4Star: gachaStore.pullsSince4Star,
  pullsSince5Star: gachaStore.pullsSince5Star,
  until4StarPity: Math.max(0, gachaStore.FOUR_STAR_PITY - gachaStore.pullsSince4Star),
  until5StarSoftPity: Math.max(0, gachaStore.SOFT_PITY_START - gachaStore.pullsSince5Star),
  until5StarHardPity: Math.max(0, gachaStore.HARD_PITY - gachaStore.pullsSince5Star),
  current5StarRate: (gachaStore.current5StarRate * 100).toFixed(1)
}))

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
</script>

<template>
  <div class="gacha-screen">
    <header class="gacha-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        ← Back
      </button>
      <h1>Summon Heroes</h1>
      <div class="gem-display">
        <span class="gem-icon">💎</span>
        <span class="gem-count">{{ gachaStore.gems }}</span>
      </div>
    </header>

    <section class="banner-area">
      <div class="banner">
        <h2>Standard Banner</h2>
        <p>Summon powerful heroes to join your party!</p>
      </div>
    </section>

    <section class="rates-info">
      <h3>Rates</h3>
      <div class="rate-grid">
        <div class="rate">
          <StarRating :rating="5" size="sm" />
          <span>{{ pityInfo.current5StarRate }}%</span>
        </div>
        <div class="rate">
          <StarRating :rating="4" size="sm" />
          <span>8%</span>
        </div>
        <div class="rate">
          <StarRating :rating="3" size="sm" />
          <span>20%</span>
        </div>
      </div>
    </section>

    <section class="pity-info">
      <h3>Pity Progress</h3>
      <div class="pity-grid">
        <div class="pity-item">
          <span class="pity-label">4★ Pity</span>
          <span class="pity-value">{{ pityInfo.pullsSince4Star }}/{{ gachaStore.FOUR_STAR_PITY }}</span>
        </div>
        <div class="pity-item">
          <span class="pity-label">5★ Soft Pity</span>
          <span class="pity-value">{{ pityInfo.pullsSince5Star }}/{{ gachaStore.SOFT_PITY_START }}</span>
        </div>
        <div class="pity-item">
          <span class="pity-label">5★ Hard Pity</span>
          <span class="pity-value">{{ pityInfo.pullsSince5Star }}/{{ gachaStore.HARD_PITY }}</span>
        </div>
      </div>
    </section>

    <section class="pull-buttons">
      <button
        class="pull-button single"
        :disabled="!gachaStore.canSinglePull || isAnimating"
        @click="doSinglePull"
      >
        <span class="pull-label">Single Pull</span>
        <span class="pull-cost">💎 {{ gachaStore.SINGLE_PULL_COST }}</span>
      </button>

      <button
        class="pull-button ten"
        :disabled="!gachaStore.canTenPull || isAnimating"
        @click="doTenPull"
      >
        <span class="pull-label">10 Pull</span>
        <span class="pull-cost">💎 {{ gachaStore.TEN_PULL_COST }}</span>
        <span class="pull-bonus">Guaranteed 4★+</span>
      </button>
    </section>

    <!-- Animation overlay -->
    <div v-if="isAnimating" class="animation-overlay">
      <div class="summon-circle"></div>
      <p>Summoning...</p>
    </div>

    <!-- Results modal -->
    <div v-if="showResults" class="results-modal" @click.self="closeResults">
      <div class="results-content">
        <h2>Summon Results!</h2>
        <div class="results-grid">
          <HeroCard
            v-for="result in pullResults"
            :key="result.instance.instanceId"
            :hero="getResultHeroData(result)"
            showStats
          />
        </div>
        <button class="close-button" @click="closeResults">Continue</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gacha-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gacha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
}

.back-button:hover {
  color: #f3f4f6;
}

.gacha-header h1 {
  font-size: 1.5rem;
  color: #f3f4f6;
  margin: 0;
}

.gem-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1f2937;
  padding: 8px 16px;
  border-radius: 20px;
}

.gem-icon {
  font-size: 1.2rem;
}

.gem-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #60a5fa;
}

.banner-area {
  background: linear-gradient(135deg, #1e3a5f, #312e81);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
}

.banner h2 {
  color: #f3f4f6;
  margin: 0 0 8px 0;
}

.banner p {
  color: #9ca3af;
  margin: 0;
}

.rates-info, .pity-info {
  background: #1f2937;
  border-radius: 8px;
  padding: 16px;
}

.rates-info h3, .pity-info h3 {
  font-size: 0.9rem;
  color: #9ca3af;
  margin: 0 0 12px 0;
}

.rate-grid {
  display: flex;
  justify-content: space-around;
}

.rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rate span:last-child {
  color: #f3f4f6;
  font-weight: 600;
}

.pity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.pity-item {
  text-align: center;
}

.pity-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
}

.pity-value {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.pull-buttons {
  display: flex;
  gap: 16px;
  margin-top: auto;
}

.pull-button {
  flex: 1;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #374151;
  background: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pull-button:hover:not(:disabled) {
  border-color: #4b5563;
  transform: translateY(-2px);
}

.pull-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pull-button.ten {
  border-color: #a855f7;
}

.pull-button.ten:hover:not(:disabled) {
  border-color: #c084fc;
}

.pull-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #f3f4f6;
}

.pull-cost {
  font-size: 1rem;
  color: #60a5fa;
}

.pull-bonus {
  font-size: 0.75rem;
  color: #a855f7;
}

.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.summon-circle {
  width: 150px;
  height: 150px;
  border: 4px solid #a855f7;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

.animation-overlay p {
  color: #f3f4f6;
  font-size: 1.2rem;
  margin-top: 20px;
}

.results-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.results-content {
  background: #1f2937;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.results-content h2 {
  color: #f3f4f6;
  text-align: center;
  margin: 0 0 20px 0;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.close-button {
  width: 100%;
  padding: 16px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.close-button:hover {
  background: #2563eb;
}
</style>

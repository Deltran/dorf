<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore, useIntroStore } from '../stores'
import defaultBg from '../assets/battle_backgrounds/default.png'
import dorfLogo from '../assets/dorf-logo-1.png'
import gemIcon from '../assets/icons/gems.png'
import goldIcon from '../assets/icons/gold.png'
import mapIcon from '../assets/icons/map.png'
import codexIcon from '../assets/icons/codex.png'
import storeIcon from '../assets/icons/store_goods.png'
import fellowshipIcon from '../assets/icons/fellowship_hall.png'

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()
const introStore = useIntroStore()

// Attention animation for summon button after intro
const summonAttention = ref(false)

onMounted(() => {
  if (introStore.showSummonAttention) {
    // Small delay to let the page render first
    setTimeout(() => {
      summonAttention.value = true
      introStore.clearSummonAttention()
      // Clear animation class after it completes
      setTimeout(() => {
        summonAttention.value = false
      }, 2000)
    }, 300)
  }
})

// Hero images (check for animated gif first, then static png)
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  // Prefer animated gif if available
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) {
    return heroGifs[gifPath]
  }
  // Fall back to static png
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}

// Battle backgrounds for party section
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

const partyBackgroundUrl = computed(() => {
  const nodeId = questsStore.lastVisitedNode
  if (nodeId) {
    const imagePath = `../assets/battle_backgrounds/${nodeId}.png`
    if (battleBackgrounds[imagePath]) {
      return battleBackgrounds[imagePath]
    }
  }
  return defaultBg
})

// Multi-party carousel
const parties = computed(() => heroesStore.parties)
const activePartyId = computed(() => heroesStore.activePartyId)
const carouselRef = ref(null)
const currentVisibleParty = ref(1)

function getPartyPreview(partyIndex) {
  const party = heroesStore.parties[partyIndex]
  if (!party) return []
  return party.slots.map(instanceId => {
    if (!instanceId) return null
    return heroesStore.getHeroFull(instanceId)
  })
}

let scrollTimeout = null

function handleCarouselScroll() {
  if (!carouselRef.value) return
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    const container = carouselRef.value
    const scrollLeft = container.scrollLeft
    const pageWidth = container.offsetWidth
    const newPartyIndex = Math.round(scrollLeft / pageWidth)
    const newPartyId = newPartyIndex + 1
    if (newPartyId !== currentVisibleParty.value && newPartyId >= 1 && newPartyId <= 3) {
      currentVisibleParty.value = newPartyId
      heroesStore.setActiveParty(newPartyId)
    }
  }, 50)
}

// Sync carousel position when activePartyId changes externally (e.g., from PartyScreen)
watch(activePartyId, (newId) => {
  if (newId !== currentVisibleParty.value && carouselRef.value) {
    const pageWidth = carouselRef.value.offsetWidth
    carouselRef.value.scrollTo({
      left: (newId - 1) * pageWidth,
      behavior: 'smooth'
    })
    currentVisibleParty.value = newId
  }
})

// On mount, ensure carousel is scrolled to the active party (DOM must be ready first)
onMounted(() => {
  nextTick(() => {
    if (carouselRef.value && heroesStore.activePartyId !== 1) {
      const pageWidth = carouselRef.value.offsetWidth
      // Use instant scroll on mount (no animation)
      carouselRef.value.scrollTo({
        left: (heroesStore.activePartyId - 1) * pageWidth,
        behavior: 'instant'
      })
      currentVisibleParty.value = heroesStore.activePartyId
    }
  })
})
</script>

<template>
  <div class="home-screen" :style="{ backgroundImage: `url(${partyBackgroundUrl})` }">
    <div class="bg-vignette"></div>
    <header class="home-header">
      <img :src="dorfLogo" alt="Dorf" class="game-logo" />
      <div class="currency-row">
        <div class="gem-display">
          <img :src="gemIcon" alt="Gems" class="currency-icon" />
          <span class="gem-count">{{ gachaStore.gems.toLocaleString() }}</span>
        </div>
        <div class="gold-display">
          <img :src="goldIcon" alt="Gold" class="currency-icon" />
          <span class="gold-count">{{ gachaStore.gold.toLocaleString() }}</span>
        </div>
      </div>
    </header>

    <section class="party-preview">
      <div class="party-container">
        <div class="party-title">Your Party</div>
        <div ref="carouselRef" class="party-carousel" @scroll="handleCarouselScroll">
          <div v-for="(party, pIndex) in parties" :key="party.id" class="party-page">
            <div v-if="getPartyPreview(pIndex).some(h => h)" class="party-grid">
              <template v-for="(hero, index) in getPartyPreview(pIndex)" :key="index">
                <div class="party-slot" :class="{ filled: hero }" @click="emit('navigate', 'heroes', hero?.instanceId)">
                  <img
                    v-if="hero"
                    :src="getHeroImageUrl(hero.templateId)"
                    :alt="hero.template?.name"
                    class="hero-portrait"
                  />
                  <div v-else class="empty-slot">
                    <span class="slot-number">{{ index + 1 }}</span>
                  </div>
                </div>
              </template>
            </div>
            <div v-else class="no-party">
              <span class="no-party-icon">⚔️</span>
              <span class="no-party-text">No heroes in {{ party.name }}</span>
            </div>
          </div>
        </div>
        <div class="carousel-dots">
          <span v-for="party in parties" :key="party.id" :class="['dot', { active: party.id === currentVisibleParty }]"></span>
        </div>
      </div>
    </section>

    <nav class="main-nav">
      <button
        class="summon-button"
        :class="{ attention: summonAttention }"
        @click="emit('navigate', 'gacha')"
      >
        <span class="summon-label">Summon Heroes</span>
      </button>

      <div class="room-buttons">
        <button
          class="room-button"
          @click="emit('navigate', 'fellowship-hall')"
        >
          <div class="room-icon-wrapper fellowship">
            <img :src="fellowshipIcon" alt="Fellowship Hall" class="room-icon-img" />
          </div>
          <span class="room-label">Fellowship Hall</span>
        </button>

        <button
          class="room-button map-button"
          @click="emit('navigate', 'map-room')"
        >
          <div class="room-icon-wrapper map">
            <img :src="mapIcon" alt="Map Room" class="room-icon-img" />
          </div>
          <span class="room-label">Map Room</span>
        </button>

        <button
          class="room-button"
          @click="emit('navigate', 'goodsAndMarkets')"
        >
          <div class="room-icon-wrapper store">
            <img :src="storeIcon" alt="Goods & Markets" class="room-icon-img" />
          </div>
          <span class="room-label">Goods & Markets</span>
        </button>

        <button
          class="room-button"
          @click="emit('navigate', 'codex')"
        >
          <div class="room-icon-wrapper codex">
            <img :src="codexIcon" alt="Codex" class="room-icon-img" />
          </div>
          <span class="room-label">Codex</span>
        </button>
      </div>
    </nav>

  </div>
</template>

<style scoped>
/* ===== Base Layout ===== */
.home-screen {
  min-height: 100vh;
  padding: 16px;
  padding-top: calc(16px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  background-color: #0f172a;
  background-size: cover;
  background-position: center;
  image-rendering: pixelated;
}

.bg-vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%);
  pointer-events: none;
  z-index: 0;
}

/* ===== Header ===== */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.game-logo {
  height: 5rem;
  width: auto;
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7));
}

.currency-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.gem-display,
.gold-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.gem-count,
.gold-count {
  font-size: 1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.gem-count {
  color: #7dd3fc;
}

.gold-count {
  color: #fcd34d;
}

/* ===== Party Preview - THE CENTERPIECE ===== */
.party-preview {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 200px;
  margin-bottom: -12px;
}

.party-container {
  position: relative;
}

.party-title {
  font-size: 0.65rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 8px;
  text-align: left;
  padding-left: 16px;
}

.party-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 520px;
  margin: 0 auto;
  padding: 70px 16px 0 16px; /* Extra top padding so scaled hero images don't clip at carousel overflow boundary */
}

.party-slot {
  aspect-ratio: 1;
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
  overflow: visible;
}

/* Back row - heroes 1 and 3 (odd slots) raised up */
.party-slot:nth-child(odd) {
  transform: translateY(-24px);
  z-index: 1;
}

/* Front row - heroes 2 and 4 (even slots) on top */
.party-slot:nth-child(even) {
  z-index: 2;
}

.party-slot:hover {
  transform: scale(1.05);
}

.party-slot:nth-child(odd):hover {
  transform: translateY(-24px) scale(1.05);
}

.party-slot.filled {
  /* No box shadow on the container */
}

.hero-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  image-rendering: pixelated;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.7));
  transform: scale(1.33);
  transform-origin: bottom center;
}

.empty-slot {
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.party-slot:hover .empty-slot {
  border-color: rgba(255, 255, 255, 0.3);
}

.slot-number {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.2);
}

.no-party {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  opacity: 0.4;
}

.no-party-icon {
  font-size: 1.1rem;
}

.no-party-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

/* ===== Party Carousel ===== */
.party-carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.party-carousel::-webkit-scrollbar {
  display: none;
}

.party-page {
  flex: 0 0 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #374151;
  transition: all 0.2s ease;
}

.dot.active {
  background: #f59e0b;
  transform: scale(1.2);
}

/* ===== Navigation ===== */
.main-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}

/* Summon button - PRIMARY action, bold and unmissable */
.summon-button {
  position: relative;
  padding: 20px 32px;
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
  border: 3px solid #b45309;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.1s ease;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 4px 0 #78350f,
    0 6px 12px rgba(0, 0, 0, 0.5);
}

.summon-button::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(180, 83, 9, 0.3);
  border-radius: 2px;
  pointer-events: none;
}

.summon-button:hover {
  border-color: #d97706;
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 5px 0 #78350f,
    0 8px 16px rgba(0, 0, 0, 0.5);
}

.summon-button:active {
  transform: translateY(2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 0 #78350f,
    0 3px 8px rgba(0, 0, 0, 0.5);
}

.summon-label {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f59e0b;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

/* Attention animation after intro */
.summon-button.attention {
  animation: summonPulse 0.5s ease-in-out 3;
}

.summon-button.attention::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid #f59e0b;
  border-radius: 6px;
  animation: summonGlow 0.5s ease-in-out 3;
}

@keyframes summonPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes summonGlow {
  0%, 100% {
    opacity: 0;
    box-shadow: 0 0 10px #f59e0b;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 25px #f59e0b, 0 0 50px rgba(245, 158, 11, 0.5);
  }
}

/* ===== Room Buttons ===== */
.room-buttons {
  display: flex;
  gap: 8px;
}

/* Room buttons - tertiary navigation */
.room-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  text-align: center;
}

.room-button:hover {
  border-color: #4b5563;
  background: rgba(30, 41, 59, 0.8);
}

/* Map Room - SECONDARY action, slightly more prominent */
.room-button.map-button {
  border-color: rgba(5, 150, 105, 0.4);
}

.room-button.map-button:hover {
  border-color: #059669;
}

.room-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-icon-wrapper.fellowship {
  background: #7f1d1d;
}

.room-icon-wrapper.map {
  background: #059669;
}

.room-icon-wrapper.store {
  background: #1e3a8a;
}

.room-icon-wrapper.codex {
  background: #92400e;
}

.room-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.room-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #9ca3af;
}

.room-button.map-button .room-label {
  color: #d1d5db;
}

</style>

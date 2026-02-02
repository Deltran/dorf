<script setup>
import { computed } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore } from '../stores'
import defaultBg from '../assets/battle_backgrounds/default.png'

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()

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

const partyPreview = computed(() => {
  return heroesStore.partyHeroes.map(hero => {
    if (!hero) return null
    return heroesStore.getHeroFull(hero.instanceId)
  })
})

const hasParty = computed(() => {
  return heroesStore.party.some(id => id !== null)
})
</script>

<template>
  <div class="home-screen" :style="{ backgroundImage: `url(${partyBackgroundUrl})` }">
    <div class="bg-vignette"></div>
    <header class="home-header">
      <h1 class="game-title">Dorf</h1>
      <div class="currency-row">
        <div class="gem-display">
          <span class="gem-icon">💎</span>
          <span class="gem-count">{{ gachaStore.gems.toLocaleString() }}</span>
        </div>
        <div class="gold-display">
          <span class="gold-icon">🪙</span>
          <span class="gold-count">{{ gachaStore.gold.toLocaleString() }}</span>
        </div>
      </div>
    </header>

    <section class="party-preview">
      <div class="party-container">
        <div class="party-title">Your Party</div>
        <div v-if="hasParty" class="party-grid">
          <template v-for="(hero, index) in partyPreview" :key="index">
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
          <div class="no-party-icon">⚔️</div>
          <p>No heroes in party!</p>
          <button class="summon-cta" @click="emit('navigate', 'gacha')">
            <span>Summon Heroes</span>
          </button>
        </div>
      </div>
    </section>

    <nav class="main-nav">
      <button
        class="summon-button"
        @click="emit('navigate', 'gacha')"
      >
        <span class="nav-icon">✨</span>
        <span class="nav-label">Summon</span>
      </button>

      <div class="room-buttons">
        <button
          class="room-button"
          @click="emit('navigate', 'fellowship-hall')"
        >
          <div class="room-icon-wrapper fellowship">
            <span class="room-icon">🏰</span>
          </div>
          <span class="room-label">Fellowship Hall</span>
        </button>

        <button
          class="room-button map-button"
          @click="emit('navigate', 'map-room')"
        >
          <div class="room-icon-wrapper map">
            <span class="room-icon">🗺️</span>
          </div>
          <span class="room-label">Map Room</span>
        </button>

        <button
          class="room-button"
          @click="emit('navigate', 'goodsAndMarkets')"
        >
          <div class="room-icon-wrapper store">
            <span class="room-icon">📦</span>
          </div>
          <span class="room-label">Goods & Markets</span>
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  background-color: #0f172a;
  background-size: cover;
  background-position: center;
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

.game-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  color: #f59e0b;
}

.gem-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1e293b;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #334155;
}

.gem-icon {
  font-size: 1rem;
}

.gem-count {
  font-size: 1rem;
  font-weight: 700;
  color: #60a5fa;
}

.currency-row {
  display: flex;
  gap: 8px;
}

.gold-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1e293b;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #334155;
}

.gold-icon {
  font-size: 1rem;
}

.gold-count {
  font-size: 1rem;
  font-weight: 700;
  color: #f59e0b;
}

/* ===== Party Preview - THE CENTERPIECE ===== */
.party-preview {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 200px;
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
  margin-bottom: 16px;
  text-align: center;
}

.party-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 520px;
  margin: 0 auto;
}

.party-slot {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;
}

.party-slot:hover {
  transform: scale(1.05);
}

.party-slot.filled {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.hero-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  image-rendering: pixelated;
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
  text-align: center;
  padding: 40px 24px;
}

.no-party-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.4;
}

.no-party p {
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.summon-cta {
  background: #6366f1;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.summon-cta:hover {
  background: #818cf8;
}

/* ===== Navigation ===== */
.main-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}

/* Summon button - PRIMARY action, dramatically prominent */
.summon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 24px;
  background: #6366f1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 0 24px rgba(99, 102, 241, 0.5);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.summon-button:hover {
  background: #818cf8;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.6);
}

.summon-button .nav-icon {
  font-size: 1.5rem;
}

.summon-button .nav-label {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
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

.room-icon {
  font-size: 1.3rem;
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

<script setup>
import { computed } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore } from '../stores'
import summoningBg from '../assets/backgrounds/summoning.png'
import questBg from '../assets/backgrounds/quests_bg.png'
import fellowshipHallBg from '../assets/backgrounds/fellowship_hall_bg.png'
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
  <div class="home-screen">
    <!-- Animated background layers -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="home-header">
      <div class="title-container">
        <h1 class="game-title">Dorf</h1>
        <span class="title-subtitle">Heroes of the Realm</span>
      </div>
      <div class="currency-row">
        <div class="gem-display">
          <div class="gem-glow"></div>
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
      <div class="party-container" :style="{ backgroundImage: `url(${partyBackgroundUrl})` }">
        <div class="party-container-overlay"></div>
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
        class="nav-button summon-button"
        :style="{ backgroundImage: `url(${summoningBg})` }"
        @click="emit('navigate', 'gacha')"
      >
        <div class="nav-icon-wrapper summon">
          <span class="nav-icon">✨</span>
        </div>
        <div class="nav-content">
          <span class="nav-label">Summon</span>
          <span class="nav-hint">Get new heroes</span>
        </div>
        <div class="nav-arrow">›</div>
      </button>

      <div class="room-buttons">
        <button
          class="room-button fellowship-hall-button"
          :style="{ backgroundImage: `url(${fellowshipHallBg})` }"
          @click="emit('navigate', 'fellowship-hall')"
        >
          <div class="room-icon-wrapper fellowship">
            <span class="room-icon">🏰</span>
          </div>
          <span class="room-label">Fellowship Hall</span>
          <span class="room-hint">Manage heroes</span>
        </button>

        <button
          class="room-button map-room-button"
          :style="{ backgroundImage: `url(${questBg})` }"
          @click="emit('navigate', 'map-room')"
        >
          <div class="room-icon-wrapper map">
            <span class="room-icon">🗺️</span>
          </div>
          <span class="room-label">Map Room</span>
          <span class="room-hint">Explore world</span>
        </button>

        <button class="room-button" @click="emit('navigate', 'inventory')">
          <div class="room-icon-wrapper store">
            <span class="room-icon">📦</span>
          </div>
          <span class="room-label">Store Room</span>
          <span class="room-hint">Items</span>
        </button>
      </div>
    </nav>

    <footer class="home-footer">
      <div class="footer-stats">
        <div class="stat-item">
          <span class="stat-value">{{ gachaStore.totalPulls }}</span>
          <span class="stat-label">Total Pulls</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ heroesStore.heroCount }}</span>
          <span class="stat-label">Heroes</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ questsStore.completedNodeCount }}</span>
          <span class="stat-label">Quests</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ===== Base Layout ===== */
.home-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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
    #0f172a 0%,
    #1e1b4b 25%,
    #172554 50%,
    #0f172a 75%,
    #1e1b4b 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* ===== Header ===== */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.title-container {
  display: flex;
  flex-direction: column;
}

.game-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s linear infinite;
  text-shadow: 0 0 40px rgba(251, 191, 36, 0.3);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.title-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 2px;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
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
  font-size: 1.3rem;
  position: relative;
  z-index: 1;
  animation: gemBounce 2s ease-in-out infinite;
}

@keyframes gemBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.gem-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
  position: relative;
  z-index: 1;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.currency-row {
  display: flex;
  gap: 8px;
}

.gold-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #302a1f 0%, #1f2937 100%);
  padding: 10px 14px;
  border-radius: 24px;
  border: 1px solid #f59e0b33;
}

.gold-icon {
  font-size: 1rem;
}

.gold-count {
  font-size: 1rem;
  font-weight: 700;
  color: #f59e0b;
}

/* ===== Section Headers ===== */
.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 0.85rem;
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

/* ===== Party Preview ===== */
.party-preview {
  position: relative;
  z-index: 1;
}

.party-container {
  position: relative;
  background-size: cover;
  background-position: center;
  border-radius: 16px;
  overflow: hidden;
  padding: 16px;
  border: 1px solid #334155;
}

.party-container-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(15, 23, 42, 0.6) 0%,
    rgba(15, 23, 42, 0.75) 100%
  );
  pointer-events: none;
}

.party-title {
  position: relative;
  z-index: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 6px 12px 6px 12px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 70%, transparent 100%);
  border-radius: 6px;
  width: fit-content;
  padding-right: 32px;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  border-left: 3px solid rgba(251, 191, 36, 0.8);
}

.party-grid {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px 0;
}

.party-slot {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.party-slot:hover {
  transform: translateY(-6px) scale(1.05);
}

.party-slot.filled {
  animation: slotAppear 0.5s ease backwards;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.party-slot:nth-child(1) { animation-delay: 0.1s; }
.party-slot:nth-child(2) { animation-delay: 0.2s; }
.party-slot:nth-child(3) { animation-delay: 0.3s; }
.party-slot:nth-child(4) { animation-delay: 0.4s; }

@keyframes slotAppear {
  from { opacity: 0; transform: translateY(20px) scale(0.8); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.hero-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.empty-slot {
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.6);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.party-slot:hover .empty-slot {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(30, 41, 59, 0.8);
}

.slot-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

.no-party {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 48px 24px;
}

.no-party-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-party p {
  color: #9ca3af;
  margin-bottom: 20px;
  font-size: 1rem;
}

.summon-cta {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.summon-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

/* ===== Navigation ===== */
.main-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  position: relative;
  z-index: 1;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  transition: left 0.5s ease;
}

.nav-button:hover:not(:disabled)::before {
  left: 100%;
}

.nav-button:hover:not(:disabled) {
  border-color: #4b5563;
  transform: translateX(6px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.nav-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.nav-icon-wrapper.summon {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nav-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.nav-hint {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 2px;
}

.nav-arrow {
  font-size: 1.5rem;
  color: #4b5563;
  transition: transform 0.3s ease, color 0.3s ease;
}

.nav-button:hover:not(:disabled) .nav-arrow {
  transform: translateX(4px);
  color: #6b7280;
}

/* Summon button special styling */
.nav-button.summon-button {
  background-size: cover;
  background-position: center;
  border-color: #6366f1;
}

.nav-button.summon-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.7) 0%, rgba(139, 92, 246, 0.5) 100%);
  border-radius: 13px;
  z-index: 0;
}

.nav-button.summon-button > * {
  position: relative;
  z-index: 1;
}

.nav-button.summon-button .nav-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.nav-button.summon-button .nav-hint {
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.nav-button.summon-button .nav-arrow {
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-button.summon-button:hover:not(:disabled) .nav-arrow {
  color: rgba(255, 255, 255, 0.9);
}

.nav-button.summon-button:hover:not(:disabled) {
  border-color: #818cf8;
  box-shadow: 0 4px 25px rgba(99, 102, 241, 0.4);
}

/* ===== Footer ===== */
.home-footer {
  position: relative;
  z-index: 1;
  padding-top: 16px;
}

.footer-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
  border-radius: 12px;
  border: 1px solid #1e293b;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f3f4f6;
}

.stat-label {
  font-size: 0.65rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: linear-gradient(180deg, transparent 0%, #374151 50%, transparent 100%);
}

/* ===== Room Buttons ===== */
.room-buttons {
  display: flex;
  gap: 12px;
}

.room-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.room-button:hover {
  border-color: #4b5563;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.room-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-icon-wrapper.fellowship {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.room-icon-wrapper.map {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.room-icon-wrapper.store {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.room-icon {
  font-size: 1.8rem;
}

.room-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f3f4f6;
}

.room-hint {
  font-size: 0.7rem;
  color: #6b7280;
}

/* Map Room button with background image */
.room-button.map-room-button {
  background-size: cover;
  background-position: center;
  border-color: #10b981;
  position: relative;
  overflow: hidden;
}

.room-button.map-room-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.75) 0%, rgba(16, 185, 129, 0.6) 100%);
  border-radius: 13px;
  z-index: 0;
}

.room-button.map-room-button > * {
  position: relative;
  z-index: 1;
}

.room-button.map-room-button .room-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.room-button.map-room-button .room-hint {
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.room-button.map-room-button:hover {
  border-color: #34d399;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

/* Fellowship Hall button with background image */
.room-button.fellowship-hall-button {
  background-size: cover;
  background-position: center;
  border-color: #ef4444;
  position: relative;
  overflow: hidden;
}

.room-button.fellowship-hall-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.75) 0%, rgba(239, 68, 68, 0.6) 100%);
  border-radius: 13px;
  z-index: 0;
}

.room-button.fellowship-hall-button > * {
  position: relative;
  z-index: 1;
}

.room-button.fellowship-hall-button .room-label {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.room-button.fellowship-hall-button .room-hint {
  color: rgba(255, 255, 255, 0.75);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.room-button.fellowship-hall-button:hover {
  border-color: #f87171;
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}
</style>

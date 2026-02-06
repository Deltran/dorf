<script setup>
import { ref, computed } from 'vue'
import { useCodexStore, useHeroesStore } from '../stores'
import { getAllHeroTemplates } from '../data/heroes/index.js'
import { classes } from '../data/classes.js'
import GameIcon from '../components/GameIcon.vue'

const emit = defineEmits(['navigate', 'back'])
const codexStore = useCodexStore()
const heroesStore = useHeroesStore()

const selectedHero = ref(null)
const showGemReward = ref(false)
const gemRewardAmount = ref(0)
let gemTimer = null

const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

const roleIcons = {
  tank: 'tank',
  dps: 'dps',
  healer: 'healer',
  support: 'support'
}

const herosByRarity = computed(() => {
  const all = getAllHeroTemplates()
  const grouped = { 5: [], 4: [], 3: [], 2: [], 1: [] }
  for (const hero of all) {
    grouped[hero.rarity]?.push(hero)
  }
  // Sort each group alphabetically
  for (const arr of Object.values(grouped)) {
    arr.sort((a, b) => a.name.localeCompare(b.name))
  }
  return grouped
})

function isDiscovered(heroId) {
  return heroesStore.hasTemplate(heroId)
}

function selectHero(hero) {
  if (!isDiscovered(hero.id)) return
  clearTimeout(gemTimer)
  showGemReward.value = false
  selectedHero.value = hero
  const gems = codexStore.markRead(`hero:${hero.id}`)
  if (gems) {
    gemRewardAmount.value = gems
    showGemReward.value = true
    gemTimer = setTimeout(() => { showGemReward.value = false }, 2000)
  }
}

function closeDetail() {
  clearTimeout(gemTimer)
  showGemReward.value = false
  selectedHero.value = null
}
</script>

<template>
  <div class="roster-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Hero Roster</h1>
      <div class="header-counter">
        {{ codexStore.discoveredHeroes.length }}/{{ codexStore.totalHeroes }}
      </div>
    </header>

    <!-- Hero grid -->
    <div class="hero-list">
      <template v-for="rarity in [5, 4, 3, 2, 1]" :key="rarity">
        <div v-if="herosByRarity[rarity].length > 0" class="rarity-group">
          <h2 class="rarity-title" :style="{ color: rarityColors[rarity] }">
            {{ '★'.repeat(rarity) }}
          </h2>
          <div class="hero-grid">
            <button
              v-for="hero in herosByRarity[rarity]"
              :key="hero.id"
              class="hero-cell"
              :class="{ discovered: isDiscovered(hero.id), undiscovered: !isDiscovered(hero.id) }"
              :style="{ borderColor: isDiscovered(hero.id) ? rarityColors[rarity] : '#1e293b' }"
              @click="selectHero(hero)"
            >
              <img
                v-if="isDiscovered(hero.id) && getHeroImageUrl(hero.id)"
                :src="getHeroImageUrl(hero.id)"
                :alt="hero.name"
                class="hero-thumb"
              />
              <div v-else-if="isDiscovered(hero.id)" class="hero-placeholder">
                {{ hero.name[0] }}
              </div>
              <div v-else class="hero-silhouette">?</div>
              <span v-if="isDiscovered(hero.id)" class="hero-name-label">{{ hero.name }}</span>
              <span v-else class="hero-name-label unknown">???</span>
              <span
                v-if="isDiscovered(hero.id) && !codexStore.hasRead(`hero:${hero.id}`)"
                class="cell-gem-badge"
              >💎</span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Detail panel -->
    <div v-if="selectedHero" class="detail-overlay" @click.self="closeDetail">
      <div class="detail-panel">
        <button class="detail-close" @click="closeDetail">✕</button>
        <div v-if="showGemReward" class="gem-reward">+{{ gemRewardAmount }} 💎</div>

        <div class="detail-header">
          <div class="detail-rarity" :style="{ color: rarityColors[selectedHero.rarity] }">
            {{ '★'.repeat(selectedHero.rarity) }}
          </div>
          <h2 class="detail-name">{{ selectedHero.name }}</h2>
          <div v-if="selectedHero.epithet" class="detail-epithet">{{ selectedHero.epithet }}</div>
          <div class="detail-class">
            <GameIcon :name="roleIcons[classes[selectedHero.classId]?.role] || 'dps'" size="sm" inline />
            {{ classes[selectedHero.classId]?.title || selectedHero.classId }}
          </div>
        </div>

        <div v-if="selectedHero.introQuote" class="detail-quote">
          "{{ selectedHero.introQuote }}"
        </div>

        <div v-if="selectedHero.lore" class="detail-lore">
          {{ selectedHero.lore }}
        </div>

        <!-- Stats -->
        <div class="detail-section">
          <h3 class="detail-section-title">Base Stats</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">HP</span>
              <span class="stat-value">{{ selectedHero.baseStats.hp }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">ATK</span>
              <span class="stat-value">{{ selectedHero.baseStats.atk }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">DEF</span>
              <span class="stat-value">{{ selectedHero.baseStats.def }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">SPD</span>
              <span class="stat-value">{{ selectedHero.baseStats.spd }}</span>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div v-if="selectedHero.skills?.length" class="detail-section">
          <h3 class="detail-section-title">Skills</h3>
          <div v-for="skill in selectedHero.skills" :key="skill.name" class="skill-entry">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-desc">{{ skill.description }}</span>
          </div>
        </div>

        <!-- Leader Skill -->
        <div v-if="selectedHero.leaderSkill" class="detail-section">
          <h3 class="detail-section-title">
            <GameIcon name="crown" size="sm" inline />
            Leader Skill
          </h3>
          <div class="skill-entry">
            <span class="skill-name">{{ selectedHero.leaderSkill.name }}</span>
            <span class="skill-desc">{{ selectedHero.leaderSkill.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roster-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow-y: auto;
  background: linear-gradient(to bottom, #0a0a0a 0%, #111827 100%);
}

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
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-counter {
  font-size: 0.9rem;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  min-width: 70px;
  text-align: right;
}

/* Hero grid */
.hero-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
  padding-bottom: 20px;
}

.rarity-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rarity-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 2px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.hero-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #1e293b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.hero-cell.discovered:hover {
  background: rgba(30, 41, 59, 0.8);
}

.hero-cell.undiscovered {
  cursor: default;
  opacity: 0.5;
}

.hero-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  image-rendering: pixelated;
  border-radius: 4px;
}

.hero-placeholder {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e293b;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #4b5563;
}

.hero-silhouette {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.hero-name-label {
  font-size: 0.6rem;
  color: #9ca3af;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-name-label.unknown {
  color: #374151;
}

.cell-gem-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.6rem;
}

/* Detail overlay */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.detail-panel {
  background: #111827;
  border-top: 2px solid #334155;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
}

.detail-close:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.detail-header {
  text-align: center;
}

.detail-rarity {
  font-size: 1rem;
  letter-spacing: 2px;
}

.detail-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 4px 0 0 0;
}

.detail-epithet {
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 2px;
}

.detail-class {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 4px;
}

.detail-quote {
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 8px 16px;
  border-left: 2px solid #334155;
  margin: 0 20px;
}

.detail-lore {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.5;
  padding: 0 4px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 6px;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #e5e7eb;
  font-variant-numeric: tabular-nums;
}

.skill-entry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 6px;
}

.skill-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #d1d5db;
}

.skill-desc {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.gem-reward {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.3rem;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);
  z-index: 10;
  pointer-events: none;
  animation: gemFloat 2s ease-out forwards;
}

@keyframes gemFloat {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.5);
  }
  15% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1.1);
  }
  30% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-30px) scale(1);
  }
}
</style>

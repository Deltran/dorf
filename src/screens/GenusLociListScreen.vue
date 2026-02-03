<script setup>
import { computed } from 'vue'
import { useGenusLociStore } from '../stores'
import { getAllQuestNodes } from '../data/quests/index.js'

const emit = defineEmits(['navigate'])

const genusLociStore = useGenusLociStore()

// Enemy portraits for genus loci
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

// Battle backgrounds for genus loci cards
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

function getBossPortraitUrl(bossId) {
  const portraitPath = `../assets/enemies/${bossId}_portrait.png`
  return enemyPortraits[portraitPath] || null
}

function getBossBackgroundUrl(bossId) {
  // Find the quest node that has this genusLociId
  const questNode = getAllQuestNodes().find(n => n.genusLociId === bossId)
  if (questNode) {
    const bgPath = `../assets/battle_backgrounds/${questNode.id}.png`
    if (battleBackgrounds[bgPath]) {
      return battleBackgrounds[bgPath]
    }
  }
  return null
}

const unlockedGenusLoci = computed(() => genusLociStore.unlockedBosses)
const hasAnyGenusLoci = computed(() => unlockedGenusLoci.value.length > 0)

function selectBoss(bossId) {
  emit('navigate', 'genusLoci', bossId)
}
</script>

<template>
  <div class="genus-loci-list-screen">
    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'map-room')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Genus Loci</h1>
      <div class="header-spacer"></div>
    </header>

    <section id="genus-loci-list" class="boss-section">
      <div v-if="hasAnyGenusLoci" class="boss-grid">
        <div
          v-for="boss in unlockedGenusLoci"
          :key="boss.id"
          class="boss-card"
          :style="getBossBackgroundUrl(boss.id) ? { backgroundImage: `url(${getBossBackgroundUrl(boss.id)})` } : {}"
          @click="selectBoss(boss.id)"
        >
          <div class="boss-icon">
            <img
              v-if="getBossPortraitUrl(boss.id)"
              :src="getBossPortraitUrl(boss.id)"
              :alt="boss.name"
              class="boss-portrait"
            />
            <span v-else>👹</span>
          </div>
          <div class="boss-info">
            <span class="boss-name">{{ boss.name }}</span>
            <span class="boss-level">Highest: Lv.{{ boss.highestCleared }}</span>
          </div>
          <div class="boss-arrow">›</div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🏰</div>
        <p class="empty-text">No Genus Loci discovered yet.</p>
        <p class="empty-hint">Powerful guardians await in the world. Seek them out on your quest.</p>
        <button class="quest-btn" @click="emit('navigate', 'worldmap')">
          <span>Explore Quests</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.genus-loci-list-screen {
  min-height: 100vh;
  padding: 20px;
  padding-top: calc(20px + var(--safe-area-top));
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
  background: #111827;
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.header-spacer {
  width: 70px;
}

/* Boss Section */
.boss-section {
  position: relative;
  z-index: 1;
  flex: 1;
}

.boss-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.boss-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #2a1f3d 0%, #1f2937 100%);
  background-size: cover;
  background-position: center;
  border: 1px solid #6b21a8;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.boss-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(42, 31, 61, 0.85) 0%, rgba(31, 41, 55, 0.8) 100%);
  z-index: 0;
}

.boss-card > * {
  position: relative;
  z-index: 1;
}

.boss-card:hover {
  transform: translateX(6px);
  border-color: #9333ea;
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.3);
}

.boss-card:hover::before {
  background: linear-gradient(135deg, rgba(42, 31, 61, 0.75) 0%, rgba(31, 41, 55, 0.7) 100%);
}

.boss-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.2);
  border-radius: 12px;
  font-size: 2rem;
  overflow: hidden;
}

.boss-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.boss-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
}

.boss-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.boss-level {
  font-size: 0.85rem;
  color: #9ca3af;
}

.boss-arrow {
  font-size: 1.5rem;
  color: #6b21a8;
  transition: transform 0.3s ease;
}

.boss-card:hover .boss-arrow {
  transform: translateX(4px);
  color: #9333ea;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px dashed #374151;
  border-radius: 16px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  color: #f3f4f6;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-hint {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 24px 0;
}

.quest-btn {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.quest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}
</style>

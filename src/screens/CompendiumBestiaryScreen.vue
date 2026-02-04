<script setup>
import { ref, computed } from 'vue'
import { useCodexStore, useQuestsStore } from '../stores'
import { getAllEnemyTemplates } from '../data/enemies/index.js'
import { getNodesByRegion } from '../data/quests/index.js'
import { regions } from '../data/quests/regions.js'

const emit = defineEmits(['navigate'])
const codexStore = useCodexStore()
const questsStore = useQuestsStore()

const selectedEnemy = ref(null)
const showGemReward = ref(false)
const gemRewardAmount = ref(0)
let gemTimer = null

const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

function getEnemyPortraitUrl(enemyId) {
  const portraitPath = `../assets/enemies/${enemyId}_portrait.png`
  return enemyPortraits[portraitPath] || null
}

// Group enemies by the region they first appear in
const enemiesByRegion = computed(() => {
  const all = getAllEnemyTemplates()
  const enemyRegionMap = {}

  // Build a mapping of enemy ID to region name
  for (const region of regions) {
    const nodes = getNodesByRegion(region.name)
    for (const node of nodes) {
      if (!node.battles) continue
      for (const battle of node.battles) {
        for (const enemyId of (battle.enemies || [])) {
          if (!enemyRegionMap[enemyId]) {
            enemyRegionMap[enemyId] = region.name
          }
        }
      }
    }
  }

  // Group templates by region
  const grouped = {}
  for (const enemy of all) {
    const region = enemyRegionMap[enemy.id] || 'Unknown'
    if (!grouped[region]) grouped[region] = []
    grouped[region].push(enemy)
  }

  // Sort each group alphabetically
  for (const arr of Object.values(grouped)) {
    arr.sort((a, b) => a.name.localeCompare(b.name))
  }

  return grouped
})

const regionOrder = computed(() => {
  return regions.map(r => r.name).filter(name => enemiesByRegion.value[name])
})

function isDiscovered(enemyId) {
  return questsStore.hasDefeatedEnemy(enemyId)
}

function selectEnemy(enemy) {
  if (!isDiscovered(enemy.id)) return
  clearTimeout(gemTimer)
  showGemReward.value = false
  selectedEnemy.value = enemy
  const gems = codexStore.markRead(`enemy:${enemy.id}`)
  if (gems) {
    gemRewardAmount.value = gems
    showGemReward.value = true
    gemTimer = setTimeout(() => { showGemReward.value = false }, 2000)
  }
}

function closeDetail() {
  clearTimeout(gemTimer)
  showGemReward.value = false
  selectedEnemy.value = null
}
</script>

<template>
  <div class="bestiary-screen">
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'compendium')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Bestiary</h1>
      <div class="header-counter">
        {{ codexStore.discoveredEnemies.length }}/{{ codexStore.totalEnemies }}
      </div>
    </header>

    <div class="enemy-list">
      <div v-for="regionName in regionOrder" :key="regionName" class="region-group">
        <h2 class="region-title">{{ regionName }}</h2>
        <div class="enemy-rows">
          <button
            v-for="enemy in enemiesByRegion[regionName]"
            :key="enemy.id"
            class="enemy-row"
            :class="{ discovered: isDiscovered(enemy.id), undiscovered: !isDiscovered(enemy.id) }"
            @click="selectEnemy(enemy)"
          >
            <img
              v-if="isDiscovered(enemy.id) && getEnemyPortraitUrl(enemy.id)"
              :src="getEnemyPortraitUrl(enemy.id)"
              class="enemy-portrait"
            />
            <div v-else class="enemy-portrait-placeholder">
              {{ isDiscovered(enemy.id) ? enemy.name[0] : '?' }}
            </div>
            <span v-if="isDiscovered(enemy.id)" class="enemy-name">{{ enemy.name }}</span>
            <span v-else class="enemy-name unknown">???</span>
            <span
              v-if="isDiscovered(enemy.id) && !codexStore.hasRead(`enemy:${enemy.id}`)"
              class="row-gem-badge"
            >💎</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Detail panel -->
    <div v-if="selectedEnemy" class="detail-overlay" @click.self="closeDetail">
      <div class="detail-panel">
        <button class="detail-close" @click="closeDetail">✕</button>
        <div v-if="showGemReward" class="gem-reward">+{{ gemRewardAmount }} 💎</div>

        <h2 class="detail-name">{{ selectedEnemy.name }}</h2>

        <div v-if="selectedEnemy.lore" class="detail-lore">
          {{ selectedEnemy.lore }}
        </div>

        <div class="detail-section">
          <h3 class="detail-section-title">Stats</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">HP</span>
              <span class="stat-value">{{ selectedEnemy.stats.hp }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">ATK</span>
              <span class="stat-value">{{ selectedEnemy.stats.atk }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">DEF</span>
              <span class="stat-value">{{ selectedEnemy.stats.def }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">SPD</span>
              <span class="stat-value">{{ selectedEnemy.stats.spd }}</span>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div v-if="selectedEnemy.skill || selectedEnemy.skills" class="detail-section">
          <h3 class="detail-section-title">Skills</h3>
          <template v-if="selectedEnemy.skills">
            <div v-for="skill in selectedEnemy.skills" :key="skill.name" class="skill-entry">
              <span class="skill-name">{{ skill.name }}</span>
              <span v-if="skill.description" class="skill-desc">{{ skill.description }}</span>
            </div>
          </template>
          <div v-else-if="selectedEnemy.skill" class="skill-entry">
            <span class="skill-name">{{ selectedEnemy.skill.name }}</span>
            <span v-if="selectedEnemy.skill.description" class="skill-desc">{{ selectedEnemy.skill.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bestiary-screen {
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

/* Enemy list */
.enemy-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
  padding-bottom: 20px;
}

.region-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.region-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0 0 4px 4px;
}

.enemy-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enemy-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid #1e293b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.enemy-row.discovered:hover {
  background: rgba(30, 41, 59, 0.7);
  border-color: #334155;
}

.enemy-row.undiscovered {
  cursor: default;
  opacity: 0.4;
}

.enemy-portrait {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
  image-rendering: pixelated;
}

.enemy-portrait-placeholder {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
}

.enemy-name {
  flex: 1;
  font-size: 0.9rem;
  color: #d1d5db;
}

.enemy-name.unknown {
  color: #374151;
}

.row-gem-badge {
  font-size: 0.7rem;
  flex-shrink: 0;
}

/* Detail panel */
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
  max-height: 70vh;
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

.detail-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.detail-lore {
  font-size: 0.85rem;
  color: #9ca3af;
  line-height: 1.5;
  font-style: italic;
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

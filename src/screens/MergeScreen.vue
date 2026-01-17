<script setup>
import { computed } from 'vue'
import { useHeroesStore, useGachaStore } from '../stores'
import { getHeroTemplate } from '../data/heroTemplates.js'

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()

// Hero images
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const path = `../assets/heroes/${heroId}.png`
  return heroImages[path] || null
}

const heroGroups = computed(() => {
  // Group heroes by templateId
  const groups = {}

  heroesStore.collection.forEach(hero => {
    if (!groups[hero.templateId]) {
      groups[hero.templateId] = {
        templateId: hero.templateId,
        template: getHeroTemplate(hero.templateId),
        copies: []
      }
    }
    groups[hero.templateId].copies.push(hero)
  })

  // Calculate merge info for each group
  return Object.values(groups)
    .map(group => {
      // Sort copies by star level desc, then level desc
      group.copies.sort((a, b) => {
        const starA = a.starLevel || group.template.rarity
        const starB = b.starLevel || group.template.rarity
        if (starB !== starA) return starB - starA
        return b.level - a.level
      })

      const highestHero = group.copies[0]
      const highestStar = highestHero.starLevel || group.template.rarity
      const mergeInfo = heroesStore.canMergeHero(highestHero.instanceId)

      return {
        ...group,
        highestStar,
        highestHero,
        canMerge: mergeInfo.canMerge,
        copiesNeeded: mergeInfo.copiesNeeded || highestStar,
        copiesHave: group.copies.length - 1  // Exclude the base
      }
    })
    .filter(g => g.highestStar < 5)  // Hide maxed heroes
    .sort((a, b) => {
      // Sort: mergeable first, then by star level desc
      if (a.canMerge !== b.canMerge) return a.canMerge ? -1 : 1
      return b.highestStar - a.highestStar
    })
})

function selectGroup(group) {
  // Navigate to heroes screen - the user can select the hero there
  emit('navigate', 'heroes')
}
</script>

<template>
  <div class="merge-screen">
    <header class="screen-header">
      <button class="back-btn" @click="emit('navigate', 'heroes')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h2>Hero Fusion</h2>
      <div class="gold-display">
        <span class="gold-icon">🪙</span>
        <span class="gold-value">{{ gachaStore.gold }}</span>
      </div>
    </header>

    <div class="hero-groups">
      <div
        v-for="group in heroGroups"
        :key="group.templateId"
        class="hero-group"
        :class="[`rarity-${group.highestStar}`, { 'can-merge': group.canMerge }]"
        @click="selectGroup(group)"
      >
        <div class="group-image">
          <img
            v-if="getHeroImageUrl(group.templateId)"
            :src="getHeroImageUrl(group.templateId)"
            :alt="group.template.name"
            class="hero-portrait"
          />
          <div v-else class="hero-portrait-placeholder">
            {{ group.template.name.charAt(0) }}
          </div>
        </div>
        <div class="group-content">
          <div class="group-header">
            <span class="hero-name">{{ group.template.name }}</span>
            <span class="hero-stars">{{ '★'.repeat(group.highestStar) }}</span>
          </div>

          <div class="group-info">
            <span class="copy-count">{{ group.copies.length }} copies</span>
            <span v-if="group.canMerge" class="merge-ready">Ready to merge!</span>
            <span v-else class="merge-progress">
              {{ group.copiesHave }}/{{ group.copiesNeeded }} for next ★
            </span>
          </div>
        </div>
      </div>

      <div v-if="heroGroups.length === 0" class="empty-state">
        <div class="empty-icon">⭐</div>
        <p>No heroes to merge</p>
        <p class="empty-hint">Pull more duplicates to merge and power up your heroes!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.merge-screen {
  min-height: 100vh;
  background: #111827;
  color: white;
}

.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 1px solid #374151;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: #f3f4f6;
  border-color: #6b7280;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #f59e0b;
}

.gold-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.gold-icon {
  font-size: 1rem;
}

.gold-value {
  color: #f59e0b;
  font-weight: 700;
}

.hero-groups {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-group {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  padding: 12px 16px;
  border-left: 4px solid #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #374151;
}

.group-image {
  flex-shrink: 0;
}

.hero-portrait {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 8px;
  background: #374151;
}

.hero-portrait-placeholder {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #374151;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #6b7280;
}

.group-content {
  flex: 1;
  min-width: 0;
}

.hero-group:hover {
  transform: translateX(4px);
  border-color: #4b5563;
}

.hero-group:active {
  transform: scale(0.98);
}

/* Rarity backgrounds */
.hero-group.rarity-1 {
  background: linear-gradient(135deg, #1f2937 0%, #262d36 100%);
  border-left-color: #9ca3af;
}

.hero-group.rarity-2 {
  background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%);
  border-left-color: #22c55e;
}

.hero-group.rarity-3 {
  background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%);
  border-left-color: #3b82f6;
}

.hero-group.rarity-4 {
  background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%);
  border-left-color: #a855f7;
}

.hero-group.can-merge {
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
}

.hero-group.can-merge:hover {
  border-color: #f59e0b;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hero-name {
  font-weight: 600;
  font-size: 1rem;
  color: #f3f4f6;
}

.hero-stars {
  color: #f59e0b;
  font-size: 0.9rem;
}

.group-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #9ca3af;
}

.merge-ready {
  color: #22c55e;
  font-weight: 600;
}

.merge-progress {
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.empty-hint {
  font-size: 0.85rem;
  color: #4b5563;
}
</style>

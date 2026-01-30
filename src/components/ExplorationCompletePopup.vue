<script setup>
import { computed } from 'vue'
import { useHeroesStore } from '../stores'
import { getItem } from '../data/items.js'

// Hero image imports
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroImageUrl(templateId) {
  if (!templateId) return null
  const gifPath = `../assets/heroes/${templateId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${templateId}.png`
  return heroImages[pngPath] || null
}

const props = defineProps({
  completion: {
    type: Object,
    required: true
    // { nodeId, nodeName, rewards: { gold, gems, xp, xpPerHero }, heroes, itemsDropped, partyRequestMet }
  }
})

const emit = defineEmits(['claim'])

const heroesStore = useHeroesStore()

const heroDisplays = computed(() => {
  return props.completion.heroes.map(instanceId => {
    return heroesStore.getHeroFull(instanceId)
  }).filter(Boolean)
})

const itemDisplays = computed(() => {
  return props.completion.itemsDropped.map(itemId => {
    return getItem(itemId)
  }).filter(Boolean)
})
</script>

<template>
  <div class="popup-overlay">
    <div class="popup-container">
      <div class="popup-header">
        <div class="celebration">🎉</div>
        <h2>Exploration Complete!</h2>
        <div class="node-name">{{ completion.nodeName }}</div>
      </div>

      <div class="heroes-row">
        <div
          v-for="hero in heroDisplays"
          :key="hero.instanceId"
          class="hero-portrait"
        >
          <img
            v-if="getHeroImageUrl(hero.template?.id)"
            :src="getHeroImageUrl(hero.template?.id)"
            :alt="hero.template?.name"
            class="portrait-image"
          />
          <div v-else class="portrait-placeholder">{{ hero.template?.name?.charAt(0) }}</div>
          <div class="hero-xp">+{{ completion.rewards.xpPerHero }} XP</div>
        </div>
      </div>

      <div class="rewards-section">
        <h3>Rewards</h3>
        <div class="reward-grid">
          <div class="reward-item">
            <span class="reward-icon">🪙</span>
            <span class="reward-value">{{ completion.rewards.gold }}</span>
            <span class="reward-label">Gold</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">💎</span>
            <span class="reward-value">{{ completion.rewards.gems }}</span>
            <span class="reward-label">Gems</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">⭐</span>
            <span class="reward-value">{{ completion.rewards.xp }}</span>
            <span class="reward-label">Total XP</span>
          </div>
        </div>

        <div v-if="completion.partyRequestMet" class="bonus-indicator">
          +10% Party Request Bonus Applied!
        </div>

        <div v-if="itemDisplays.length > 0" class="items-section">
          <h4>Items Found</h4>
          <div class="items-grid">
            <div
              v-for="item in itemDisplays"
              :key="item.id"
              class="item-card"
            >
              <div class="item-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <button class="claim-button" @click="emit('claim')">
        Claim Rewards
      </button>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.popup-container {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  border: 2px solid #06b6d4;
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.popup-header {
  margin-bottom: 20px;
}

.celebration {
  font-size: 3rem;
  margin-bottom: 8px;
}

h2 {
  color: #06b6d4;
  margin: 0 0 8px 0;
  font-size: 1.5rem;
}

.node-name {
  color: #9ca3af;
  font-size: 0.9rem;
}

.heroes-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.hero-portrait {
  text-align: center;
}

.portrait-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 4px;
  border: 2px solid #374151;
  image-rendering: pixelated;
}

.portrait-placeholder {
  width: 48px;
  height: 48px;
  background: #374151;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #9ca3af;
  margin: 0 auto 4px;
}

.hero-xp {
  font-size: 0.7rem;
  color: #10b981;
}

h3 {
  color: #f3f4f6;
  margin: 0 0 12px 0;
  font-size: 1rem;
}

h4 {
  color: #9ca3af;
  margin: 16px 0 8px 0;
  font-size: 0.9rem;
}

.reward-grid {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reward-icon {
  font-size: 1.5rem;
}

.reward-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #f3f4f6;
}

.reward-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.bonus-indicator {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid #10b981;
  color: #10b981;
  padding: 8px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.85rem;
}

.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.item-card {
  background: #374151;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.claim-button {
  width: 100%;
  padding: 16px;
  margin-top: 24px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.claim-button:hover {
  transform: scale(1.02);
}
</style>

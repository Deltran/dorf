<script setup>
import { computed } from 'vue'
import StarRating from './StarRating.vue'

// Import all hero images (following CLAUDE.md pattern)
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  // Check for GIF first (higher priority)
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  // Fall back to PNG
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}

const props = defineProps({
  hero: {
    type: Object,
    required: true
  },
  revealed: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  revealDelay: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['click'])

const template = computed(() => {
  return props.hero.template || null
})

const rarity = computed(() => {
  return template.value?.rarity || 1
})

const rarityClass = computed(() => {
  return `rarity-${rarity.value}`
})

const heroImageUrl = computed(() => {
  return getHeroImageUrl(template.value?.id)
})

const cardStyle = computed(() => {
  return {
    animationDelay: `${props.revealDelay}ms`
  }
})

function handleClick() {
  emit('click', props.hero)
}
</script>

<template>
  <div
    :class="[
      'summon-reveal-card',
      rarityClass,
      { revealed, 'new-hero': isNew }
    ]"
    :style="cardStyle"
    @click="handleClick"
  >
    <div class="card-portrait">
      <img
        v-if="heroImageUrl"
        :src="heroImageUrl"
        :alt="template?.name"
        class="hero-image"
      />
      <div v-else class="no-image">
        <span class="placeholder-icon">?</span>
      </div>
    </div>

    <div class="card-info">
      <div class="hero-name">{{ template?.name || 'Unknown' }}</div>
      <StarRating :rating="rarity" size="sm" />
    </div>
  </div>
</template>

<style scoped>
.summon-reveal-card {
  width: 100px;
  max-width: 120px;
  background: #1f2937;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  user-select: none;
  opacity: 0;
  transform: translateY(-100px);
  border: 2px solid transparent;
  transition: box-shadow 0.2s ease;
}

/* Revealed state - fly in animation */
.summon-reveal-card.revealed {
  animation: flyIn 0.3s ease-out forwards;
}

@keyframes flyIn {
  0% {
    opacity: 0;
    transform: translateY(-100px);
  }
  70% {
    opacity: 1;
    transform: translateY(5px);
  }
  85% {
    transform: translateY(-2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Impact shake for high rarity */
.rarity-4.revealed,
.rarity-5.revealed {
  animation: flyInImpact 0.4s ease-out forwards;
}

@keyframes flyInImpact {
  0% {
    opacity: 0;
    transform: translateY(-100px);
  }
  60% {
    opacity: 1;
    transform: translateY(8px);
  }
  70% {
    transform: translateY(-4px) rotate(-1deg);
  }
  80% {
    transform: translateY(2px) rotate(1deg);
  }
  90% {
    transform: translateY(-1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}

/* New hero pulsing glow - only when revealed */
.summon-reveal-card.new-hero.revealed {
  animation: flyIn 0.3s ease-out forwards, pulseGlow 1.5s ease-in-out 0.3s infinite;
}

.rarity-4.new-hero.revealed,
.rarity-5.new-hero.revealed {
  animation: flyInImpact 0.4s ease-out forwards, pulseGlow 1.5s ease-in-out 0.4s infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 8px var(--rarity-glow);
  }
  50% {
    box-shadow: 0 0 20px var(--rarity-glow);
  }
}

/* Rarity colors from CLAUDE.md */
.rarity-1 {
  border-color: #9ca3af;
  background: linear-gradient(135deg, #1f2937 0%, #262d36 100%);
  --rarity-glow: rgba(156, 163, 175, 0.6);
}

.rarity-2 {
  border-color: #22c55e;
  background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%);
  --rarity-glow: rgba(34, 197, 94, 0.6);
}

.rarity-3 {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%);
  --rarity-glow: rgba(59, 130, 246, 0.6);
}

.rarity-4 {
  border-color: #a855f7;
  background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%);
  --rarity-glow: rgba(168, 85, 247, 0.6);
}

.rarity-5 {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%);
  --rarity-glow: rgba(245, 158, 11, 0.7);
}

.card-portrait {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
  height: 56px;
}

.hero-image {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #374151;
  image-rendering: pixelated;
}

.no-image {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #374151;
  border-radius: 6px;
  border: 1px solid #4b5563;
}

.placeholder-icon {
  font-size: 1.5rem;
  color: #6b7280;
}

.card-info {
  text-align: center;
}

.hero-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.75rem;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

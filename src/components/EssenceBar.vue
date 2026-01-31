<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentEssence: {
    type: Number,
    default: 0
  },
  maxEssence: {
    type: Number,
    default: 60
  },
  size: {
    type: String,
    default: 'sm' // 'sm' or 'md'
  }
})

const percentage = computed(() => {
  if (props.maxEssence <= 0) return 0
  return Math.min(100, Math.max(0, (props.currentEssence / props.maxEssence) * 100))
})

const volatilityTier = computed(() => {
  const essence = props.currentEssence
  if (essence <= 20) return 'stable'
  if (essence <= 40) return 'reactive'
  return 'volatile'
})

const tierInfo = computed(() => {
  const tier = volatilityTier.value
  if (tier === 'stable') {
    return { name: 'Stable', icon: '~', bonus: 0, color: '#6b7280', warning: null }
  }
  if (tier === 'reactive') {
    return { name: 'Reactive', icon: '!', bonus: 15, color: '#f59e0b', warning: null }
  }
  return { name: 'Volatile', icon: '!!', bonus: 30, color: '#ef4444', warning: '5% self-dmg' }
})
</script>

<template>
  <div :class="['essence-bar', size, `tier-${volatilityTier}`]">
    <div class="essence-header">
      <span class="essence-label">Essence</span>
      <span class="essence-value">{{ currentEssence }}/{{ maxEssence }}</span>
    </div>
    <div class="essence-track">
      <div class="essence-fill" :style="{ width: percentage + '%' }"></div>
      <!-- Tier threshold markers at 20 and 40 -->
      <div class="tier-marker" style="left: 33.33%"></div>
      <div class="tier-marker" style="left: 66.66%"></div>
    </div>
    <div class="volatility-indicator">
      <span class="tier-icon" :style="{ color: tierInfo.color }">{{ tierInfo.icon }}</span>
      <span class="tier-name" :style="{ color: tierInfo.color }">{{ tierInfo.name }}</span>
      <span v-if="tierInfo.bonus > 0" class="tier-bonus">+{{ tierInfo.bonus }}%</span>
      <span v-if="tierInfo.warning" class="tier-warning">{{ tierInfo.warning }}</span>
    </div>
  </div>
</template>

<style scoped>
.essence-bar {
  width: 100%;
}

.essence-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.essence-label {
  color: #06b6d4;
  font-weight: 600;
}

.essence-value {
  color: #9ca3af;
}

.sm .essence-header {
  font-size: 0.65rem;
}

.md .essence-header {
  font-size: 0.75rem;
}

.essence-track {
  position: relative;
  height: 6px;
  background: #374151;
  border-radius: 3px;
  overflow: hidden;
}

.sm .essence-track {
  height: 4px;
}

.essence-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background 0.3s ease;
}

/* Tier-based fill colors */
.tier-stable .essence-fill {
  background: linear-gradient(90deg, #0891b2, #06b6d4);
}

.tier-reactive .essence-fill {
  background: linear-gradient(90deg, #d97706, #f59e0b);
}

.tier-volatile .essence-fill {
  background: linear-gradient(90deg, #dc2626, #f97316);
  animation: volatilePulse 1s ease-in-out infinite;
}

.tier-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.volatility-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.tier-icon {
  font-weight: 700;
  font-size: 0.7rem;
}

.sm .tier-icon {
  font-size: 0.6rem;
}

.tier-name {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sm .tier-name {
  font-size: 0.55rem;
}

.tier-bonus {
  font-size: 0.55rem;
  font-weight: 600;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  padding: 0 3px;
  border-radius: 2px;
}

.sm .tier-bonus {
  font-size: 0.5rem;
}

.tier-warning {
  font-size: 0.5rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
  padding: 0 3px;
  border-radius: 2px;
}

.sm .tier-warning {
  font-size: 0.45rem;
}

/* Volatile pulsing animation */
@keyframes volatilePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Tier-based indicator styling */
.tier-volatile .tier-icon,
.tier-volatile .tier-name {
  animation: volatileTextPulse 1s ease-in-out infinite;
}

@keyframes volatileTextPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
</style>

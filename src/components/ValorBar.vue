<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentValor: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: 'sm' // sm, md
  }
})

const percentage = computed(() => {
  return Math.min(100, Math.max(0, props.currentValor))
})

const currentTier = computed(() => {
  const valor = props.currentValor
  if (valor >= 100) return 4
  if (valor >= 75) return 3
  if (valor >= 50) return 2
  if (valor >= 25) return 1
  return 0
})
</script>

<template>
  <div
    :class="['valor-bar', size]"
    role="progressbar"
    :aria-valuenow="currentValor"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="`Valor: ${currentValor} out of 100`"
  >
    <div class="valor-container">
      <div class="valor-fill" :style="{ width: percentage + '%' }"></div>
      <!-- Threshold markers -->
      <div class="threshold-marker" style="left: 25%"></div>
      <div class="threshold-marker" style="left: 50%"></div>
      <div class="threshold-marker" style="left: 75%"></div>
      <span class="valor-text">{{ currentValor }}/100</span>
    </div>
    <div class="valor-tiers">
      <span :class="['tier-pip', { active: currentTier >= 1 }]">◆</span>
      <span :class="['tier-pip', { active: currentTier >= 2 }]">◆</span>
      <span :class="['tier-pip', { active: currentTier >= 3 }]">◆</span>
      <span :class="['tier-pip', { active: currentTier >= 4 }]">◆</span>
    </div>
  </div>
</template>

<style scoped>
.valor-bar {
  width: 100%;
}

.valor-container {
  position: relative;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
  height: 12px;
}

.valor-bar.md .valor-container {
  height: 18px;
}

.valor-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  transition: width 0.3s ease;
}

.threshold-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-1px);
}

.valor-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.6rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  user-select: none;
}

.valor-bar.md .valor-text {
  font-size: 0.7rem;
}

.valor-tiers {
  display: flex;
  justify-content: space-around;
  margin-top: 2px;
}

.tier-pip {
  font-size: 0.5rem;
  color: #4b5563;
  transition: all 0.3s ease;
  user-select: none;
}

.valor-bar.md .tier-pip {
  font-size: 0.6rem;
}

.tier-pip.active {
  color: #60a5fa;
  text-shadow: 0 0 4px #60a5fa88;
}
</style>

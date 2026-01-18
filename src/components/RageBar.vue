<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentRage: {
    type: Number,
    default: 0
  },
  size: {
    type: String,
    default: 'md' // 'sm' or 'md'
  }
})

const percentage = computed(() => {
  return Math.min(100, Math.max(0, props.currentRage))
})

const sizeClass = computed(() => `size-${props.size}`)
</script>

<template>
  <div :class="['rage-bar', sizeClass]">
    <div class="rage-label">
      <span class="label-text">Rage</span>
      <span class="label-value">{{ currentRage }}/100</span>
    </div>
    <div class="rage-track">
      <div class="rage-fill" :style="{ width: percentage + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.rage-bar {
  width: 100%;
}

.rage-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.label-text {
  color: #ef4444;
  font-weight: 600;
}

.label-value {
  color: #9ca3af;
}

.size-sm .rage-label {
  font-size: 0.65rem;
}

.size-md .rage-label {
  font-size: 0.75rem;
}

.rage-track {
  height: 6px;
  background: #374151;
  border-radius: 3px;
  overflow: hidden;
}

.size-sm .rage-track {
  height: 4px;
}

.rage-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc2626, #f97316);
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>

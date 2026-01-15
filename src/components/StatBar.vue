<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'green' // green, blue, red, yellow
  },
  showValues: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg
  }
})

const percentage = computed(() => {
  if (props.max <= 0) return 0
  return Math.min(100, Math.max(0, (props.current / props.max) * 100))
})

const colorClasses = {
  green: 'bar-green',
  blue: 'bar-blue',
  red: 'bar-red',
  yellow: 'bar-yellow',
  purple: 'bar-purple'
}

const sizeClasses = {
  sm: 'bar-sm',
  md: 'bar-md',
  lg: 'bar-lg'
}
</script>

<template>
  <div :class="['stat-bar', sizeClasses[size]]">
    <div v-if="label" class="bar-label">{{ label }}</div>
    <div class="bar-container">
      <div
        :class="['bar-fill', colorClasses[color]]"
        :style="{ width: percentage + '%' }"
      ></div>
      <span v-if="showValues" class="bar-text">
        {{ current }} / {{ max }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.stat-bar {
  width: 100%;
}

.bar-label {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 2px;
}

.bar-container {
  position: relative;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.bar-sm .bar-container {
  height: 12px;
}

.bar-md .bar-container {
  height: 18px;
}

.bar-lg .bar-container {
  height: 24px;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-green {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.bar-blue {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.bar-red {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.bar-yellow {
  background: linear-gradient(90deg, #eab308, #ca8a04);
}

.bar-purple {
  background: linear-gradient(90deg, #a855f7, #9333ea);
}

.bar-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.bar-sm .bar-text {
  font-size: 0.6rem;
}

.bar-lg .bar-text {
  font-size: 0.85rem;
}
</style>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rating: {
    type: Number,
    required: true,
    validator: (v) => v >= 1 && v <= 5
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg
  },
  animate: {
    type: Boolean,
    default: false
  }
})

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl'
}

const rarityColors = {
  1: { color: '#9ca3af', glow: 'rgba(156, 163, 175, 0.4)' },
  2: { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' },
  3: { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
  4: { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
  5: { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' }
}

const starStyle = computed(() => {
  const r = rarityColors[props.rating] || rarityColors[1]
  return {
    color: r.color,
    textShadow: `0 0 4px ${r.glow}`
  }
})
</script>

<template>
  <span :class="['star-rating', sizeClasses[size]]">
    <span
      v-for="i in 5"
      :key="i"
      :class="[i <= rating ? 'star-filled' : 'star-empty', { 'star-pop': animate && i <= rating }]"
      :style="[i <= rating ? starStyle : undefined, animate && i <= rating ? { animationDelay: (i - 1) * 80 + 'ms' } : undefined]"
    >
      ★
    </span>
  </span>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 1px;
}

.star-filled {
  /* color and text-shadow applied via inline style */
}

.star-empty {
  color: #4b5563;
}

.text-sm {
  font-size: 0.875rem;
}

.text-base {
  font-size: 1rem;
}

.text-xl {
  font-size: 1.25rem;
}

.star-pop {
  animation: starPop 0.35s ease-out both;
}

@keyframes starPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

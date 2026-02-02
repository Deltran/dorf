<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    default: 12
  },
  palette: {
    type: String,
    default: 'warm',
    validator: (value) => ['warm', 'corrupt'].includes(value)
  },
  intensity: {
    type: String,
    default: 'medium',
    validator: (value) => ['low', 'medium', 'high'].includes(value)
  }
})

// Generate randomized ember styles
function emberStyle(index) {
  const left = Math.random() * 100
  const delay = Math.random() * 3

  // Base duration varies by intensity
  const baseDuration = props.intensity === 'high' ? 2
    : props.intensity === 'low' ? 4
    : 3
  const duration = baseDuration + Math.random() * 2

  const size = 2 + Math.random() * 3
  const drift = -20 + Math.random() * 40

  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`,
    '--drift': `${drift}px`
  }
}

const fieldClasses = computed(() => [
  'ember-field',
  `palette-${props.palette}`,
  `intensity-${props.intensity}`
])
</script>

<template>
  <div :class="fieldClasses">
    <div
      class="ember"
      v-for="n in count"
      :key="n"
      :style="emberStyle(n)"
    ></div>
  </div>
</template>

<style scoped>
.ember-field {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.ember {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  opacity: 0;
  animation: emberRise linear infinite;
}

/* Warm palette (gold/orange) - default for normal altar */
.palette-warm .ember {
  background: radial-gradient(circle, #ffd080 0%, transparent 70%);
}

/* Corrupt palette (green/red) - for Black Market */
.palette-corrupt .ember {
  background: radial-gradient(circle, #40ff60 0%, transparent 70%);
}

.palette-corrupt .ember:nth-child(even) {
  background: radial-gradient(circle, #ff2020 0%, transparent 70%);
}

/* Intensity affects animation speed and opacity */
.intensity-low .ember {
  animation-duration: 4s;
}

.intensity-medium .ember {
  animation-duration: 3s;
}

.intensity-high .ember {
  animation-duration: 2s;
}

@keyframes emberRise {
  0% {
    opacity: 0;
    transform: translateY(0) translateX(0);
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) translateX(var(--drift, 0));
  }
}

/* Intensity modifies peak opacity */
.intensity-low .ember {
  --peak-opacity: 0.5;
}

.intensity-high .ember {
  --peak-opacity: 1;
}

/* Reduced motion: minimal animation */
@media (prefers-reduced-motion: reduce) {
  .ember {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
  }
}
</style>

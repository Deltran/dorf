<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    default: 'damage', // 'damage', 'heal', 'buff', 'debuff', 'miss'
    validator: (v) => ['damage', 'heal', 'buff', 'debuff', 'miss'].includes(v)
  }
})

const emit = defineEmits(['complete'])

const isVisible = ref(true)

// Random variance for position so multiple hits don't stack exactly
const offsetX = Math.round((Math.random() - 0.5) * 40) // -20px to +20px
const offsetY = Math.round((Math.random() - 0.5) * 20) // -10px to +10px

onMounted(() => {
  // Remove after animation completes
  setTimeout(() => {
    isVisible.value = false
    emit('complete')
  }, 1500)
})

const displayValue = props.type === 'miss' ? 'Miss!' : props.type === 'heal' ? `+${props.value}` : `-${props.value}`
</script>

<template>
  <div
    v-if="isVisible"
    :class="['damage-number', type]"
    :style="{ '--offset-x': `${offsetX}px`, '--offset-y': `${offsetY}px` }"
  >
    {{ displayValue }}
  </div>
</template>

<style scoped>
.damage-number {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(calc(-50% + var(--offset-x, 0px))) translateY(var(--offset-y, 0px));
  font-weight: 700;
  font-size: 1.25rem;
  pointer-events: none;
  z-index: 100;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
  animation: floatUp 1.5s ease-out forwards;
}

.damage-number.damage {
  color: #ef4444;
}

.damage-number.heal {
  color: #22c55e;
}

.damage-number.buff {
  color: #fbbf24;
}

.damage-number.debuff {
  color: #a855f7;
}

.damage-number.miss {
  color: #9ca3af;
  font-style: italic;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateX(calc(-50% + var(--offset-x, 0px))) translateY(var(--offset-y, 0px)) scale(1);
  }
  20% {
    transform: translateX(calc(-50% + var(--offset-x, 0px))) translateY(calc(-5px + var(--offset-y, 0px))) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateX(calc(-50% + var(--offset-x, 0px))) translateY(calc(-40px + var(--offset-y, 0px))) scale(1);
  }
}
</style>

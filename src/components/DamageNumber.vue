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

onMounted(() => {
  // Remove after animation completes
  setTimeout(() => {
    isVisible.value = false
    emit('complete')
  }, 1000)
})

const displayValue = props.type === 'miss' ? 'Miss!' : props.type === 'heal' ? `+${props.value}` : `-${props.value}`
</script>

<template>
  <div
    v-if="isVisible"
    :class="['damage-number', type]"
  >
    {{ displayValue }}
  </div>
</template>

<style scoped>
.damage-number {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 1.25rem;
  pointer-events: none;
  user-select: none;
  z-index: 100;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
  animation: floatUp 1s ease-out forwards;
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
    transform: translateX(-50%) translateY(0) scale(1);
  }
  20% {
    transform: translateX(-50%) translateY(-5px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-40px) scale(1);
  }
}
</style>

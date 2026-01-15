<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true // 'attack', 'magic', 'heal', 'buff', 'debuff'
  }
})

const emit = defineEmits(['complete'])

const isVisible = ref(true)

const icons = {
  attack: '⚔️',
  magic: '✨',
  heal: '💚',
  buff: '🛡️',
  debuff: '💀'
}

const icon = icons[props.type] || '⚔️'

onMounted(() => {
  setTimeout(() => {
    isVisible.value = false
    emit('complete')
  }, 400)
})
</script>

<template>
  <div v-if="isVisible" class="impact-icon">
    {{ icon }}
  </div>
</template>

<style scoped>
.impact-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  pointer-events: none;
  z-index: 200;
  animation: impactPop 0.4s ease-out forwards;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
}

@keyframes impactPop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.3);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>

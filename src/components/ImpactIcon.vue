<script setup>
import { ref, onMounted, computed } from 'vue'
import GameIcon from './GameIcon.vue'

const props = defineProps({
  type: {
    type: String,
    required: true // 'attack', 'magic', 'heal', 'buff', 'debuff'
  }
})

const emit = defineEmits(['complete'])

const isVisible = ref(true)

const iconNames = {
  attack: 'sword',
  buff: 'shield',
  debuff: 'skull'
}

const iconEmojis = {
  magic: '✨',
  heal: '💚'
}

const iconName = computed(() => iconNames[props.type])
const iconEmoji = computed(() => iconEmojis[props.type])

onMounted(() => {
  setTimeout(() => {
    isVisible.value = false
    emit('complete')
  }, 400)
})
</script>

<template>
  <div v-if="isVisible" class="impact-icon">
    <GameIcon v-if="iconName" :name="iconName" size="xl" inline />
    <span v-else>{{ iconEmoji }}</span>
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
  user-select: none;
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

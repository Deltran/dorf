<script setup>
import { computed } from 'vue'

const props = defineProps({
  effects: {
    type: Array,
    default: () => []
  },
  position: {
    type: String,
    default: 'top-right' // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  },
  maxVisible: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['click'])

const visibleEffects = computed(() => props.effects.slice(0, props.maxVisible))
const overflowCount = computed(() => Math.max(0, props.effects.length - props.maxVisible))

function handleEffectClick(effect, event) {
  event.stopPropagation()
  emit('click', effect)
}
</script>

<template>
  <div :class="['status-overlay', position]" v-if="effects.length > 0">
    <div
      v-for="(effect, index) in visibleEffects"
      :key="index"
      class="overlay-icon"
      :class="{ buff: effect.definition?.isBuff, debuff: !effect.definition?.isBuff }"
      :title="effect.definition?.name"
      @click="handleEffectClick(effect, $event)"
    >
      {{ effect.definition?.icon }}
    </div>
    <div v-if="overflowCount > 0" class="overflow-badge">
      +{{ overflowCount }}
    </div>
  </div>
</template>

<style scoped>
.status-overlay {
  position: absolute;
  display: flex;
  gap: 2px;
  z-index: 10;
  pointer-events: auto;
}

.status-overlay.top-right {
  top: 2px;
  right: 2px;
}

.status-overlay.top-left {
  top: 2px;
  left: 2px;
}

.status-overlay.bottom-right {
  bottom: 2px;
  right: 2px;
}

.status-overlay.bottom-left {
  bottom: 2px;
  left: 2px;
}

.overlay-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.7);
  cursor: pointer;
}

.overlay-icon.buff {
  border: 1px solid rgba(34, 197, 94, 0.6);
}

.overlay-icon.debuff {
  border: 1px solid rgba(239, 68, 68, 0.6);
}

.overflow-badge {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 3px;
}
</style>

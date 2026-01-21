<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  scale: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['select'])

const isGenusLoci = computed(() => props.node.type === 'genusLoci')

const markerStyle = computed(() => ({
  left: `${props.node.x * props.scale}px`,
  top: `${props.node.y * props.scale}px`,
  transform: `translate(-50%, -50%) scale(${props.isSelected ? 1.2 : 1})`
}))
</script>

<template>
  <button
    :class="[
      'node-marker',
      {
        'completed': isCompleted,
        'selected': isSelected,
        'genus-loci': isGenusLoci
      }
    ]"
    :style="markerStyle"
    @click="emit('select', node)"
  >
    <div class="marker-ring"></div>
    <div class="marker-icon">
      <span v-if="isGenusLoci">👹</span>
      <span v-else-if="isCompleted">✓</span>
      <span v-else>!</span>
    </div>
    <div class="marker-label">{{ node.name }}</div>
  </button>
</template>

<style scoped>
.node-marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.3s ease;
  z-index: 10;
  padding: 0;
}

.marker-ring {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(251, 191, 36, 0.5);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.node-marker.selected .marker-ring {
  opacity: 1;
  animation: ringPulse 1.5s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.5; }
}

.marker-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #1f2937;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  transition: all 0.3s ease;
}

.node-marker:not(.completed) .marker-icon {
  animation: markerPulse 2s ease-in-out infinite;
}

@keyframes markerPulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(251, 191, 36, 0.7); }
}

.node-marker.completed .marker-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* Genus Loci (boss) node styling */
.node-marker.genus-loci .marker-icon {
  background: linear-gradient(135deg, #9333ea 0%, #6b21a8 100%);
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.5);
}

.node-marker.genus-loci:not(.completed) .marker-icon {
  animation: genusLociPulse 2s ease-in-out infinite;
}

@keyframes genusLociPulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(147, 51, 234, 0.5); }
  50% { box-shadow: 0 4px 24px rgba(147, 51, 234, 0.9); }
}

.node-marker.genus-loci .marker-ring {
  border-color: rgba(147, 51, 234, 0.5);
}

.node-marker.genus-loci.selected .marker-ring {
  border-color: #9333ea;
}

.node-marker:hover .marker-icon {
  transform: scale(1.1);
}

.marker-label {
  background: rgba(0, 0, 0, 0.7);
  color: #f3f4f6;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
}

.node-marker:hover .marker-label,
.node-marker.selected .marker-label {
  opacity: 1;
  transform: translateY(0);
}
</style>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  link: {
    type: Object,
    required: true
  },
  logicalWidth: {
    type: Number,
    default: 800
  },
  logicalHeight: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['navigate'])

// Safe zone boundaries (percentages) to avoid header/edges - must match NodeMarker.vue
const SAFE_ZONE = { top: 12, bottom: 92, left: 8, right: 92 }

// Position as percentage of logical coordinate space, mapped to safe zone
const markerStyle = computed(() => {
  const safeLeft = SAFE_ZONE.left + (props.link.position.x / props.logicalWidth) * (SAFE_ZONE.right - SAFE_ZONE.left)
  const safeTop = SAFE_ZONE.top + (props.link.position.y / props.logicalHeight) * (SAFE_ZONE.bottom - SAFE_ZONE.top)
  return {
    left: `${safeLeft}%`,
    top: `${safeTop}%`
  }
})
</script>

<template>
  <button
    class="region-link-marker"
    :style="markerStyle"
    @click="emit('navigate', { targetRegion: link.targetRegion, targetNode: link.targetNode })"
  >
    <div class="link-ring"></div>
    <div class="link-icon">➡</div>
    <div class="link-label">{{ link.targetRegion.name }}</div>
  </button>
</template>

<style scoped>
.region-link-marker {
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
  transform: translate(-50%, -50%);
}

.link-ring {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.5);
  top: 22px;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: linkPulse 2s ease-in-out infinite;
}

@keyframes linkPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.3; }
}

.link-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
  animation: linkGlow 2s ease-in-out infinite;
}

@keyframes linkGlow {
  0%, 100% { box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 4px 20px rgba(59, 130, 246, 0.8); }
}

.region-link-marker:hover .link-icon {
  transform: scale(1.1);
}

.link-label {
  background: rgba(59, 130, 246, 0.85);
  color: #f3f4f6;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
}

.region-link-marker:hover .link-label {
  opacity: 1;
  transform: translateY(0);
}
</style>

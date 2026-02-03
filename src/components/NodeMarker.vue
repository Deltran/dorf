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
  logicalWidth: {
    type: Number,
    default: 800
  },
  logicalHeight: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['select'])

// Enemy portraits for genus loci
const enemyPortraits = import.meta.glob('../assets/enemies/*_portrait.png', { eager: true, import: 'default' })

// Battle backgrounds for node preview
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

const isGenusLoci = computed(() => props.node.type === 'genusLoci')
const isExploration = computed(() => props.node.type === 'exploration')

const genusLociPortrait = computed(() => {
  if (!isGenusLoci.value || !props.node.genusLociId) return null
  const portraitPath = `../assets/enemies/${props.node.genusLociId}_portrait.png`
  return enemyPortraits[portraitPath] || null
})

const nodeBackground = computed(() => {
  const bgPath = `../assets/battle_backgrounds/${props.node.id}.png`
  return battleBackgrounds[bgPath] || null
})

// Safe zone boundaries (percentages) to avoid header/edges
const SAFE_ZONE = { top: 12, bottom: 92, left: 8, right: 92 }

// Position as percentage of logical coordinate space, mapped to safe zone
const markerStyle = computed(() => {
  const safeLeft = SAFE_ZONE.left + (props.node.x / props.logicalWidth) * (SAFE_ZONE.right - SAFE_ZONE.left)
  const safeTop = SAFE_ZONE.top + (props.node.y / props.logicalHeight) * (SAFE_ZONE.bottom - SAFE_ZONE.top)
  return {
    left: `${safeLeft}%`,
    top: `${safeTop}%`,
    transform: `translate(-50%, -50%) scale(${props.isSelected ? 1.15 : 1})`
  }
})
</script>

<template>
  <button
    :class="[
      'node-marker',
      {
        'completed': isCompleted,
        'selected': isSelected,
        'genus-loci': isGenusLoci,
        'exploration': isExploration,
        'has-background': nodeBackground
      }
    ]"
    :style="markerStyle"
    @click="emit('select', node)"
  >
    <div v-if="nodeBackground" class="marker-background">
      <img :src="nodeBackground" :alt="node.name" class="background-image" />
      <div class="background-tint"></div>
    </div>
    <div class="marker-ring"></div>
    <div class="marker-icon" :class="{ 'has-portrait': genusLociPortrait }">
      <img v-if="genusLociPortrait" :src="genusLociPortrait" :alt="node.name" class="genus-loci-portrait" />
      <span v-else-if="isGenusLoci">👹</span>
      <span v-else-if="isExploration">🧭</span>
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

/* Background preview - centered on the marker icon */
.marker-background {
  position: absolute;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  top: 22px; /* Half of marker-icon height (44px / 2) */
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

.background-tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Yellow/gold tint for uncompleted nodes */
.node-marker:not(.completed) .background-tint {
  background: rgba(251, 191, 36, 0.35);
}

/* Green tint for completed nodes */
.node-marker.completed .background-tint {
  background: rgba(16, 185, 129, 0.4);
}

/* Purple tint for genus loci */
.node-marker.genus-loci:not(.completed) .background-tint {
  background: rgba(147, 51, 234, 0.4);
}

.marker-ring {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(251, 191, 36, 0.5);
  top: 22px; /* Centered on marker-icon */
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* Larger ring for nodes with background */
.node-marker.has-background .marker-ring {
  width: 80px;
  height: 80px;
  border-radius: 16px;
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
  overflow: hidden;
}

.marker-icon.has-portrait {
  padding: 0;
}

.genus-loci-portrait {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* Exploration node styling */
.node-marker.exploration .marker-icon {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.5);
}

.node-marker.exploration:not(.completed) .marker-icon {
  animation: explorationPulse 2s ease-in-out infinite;
}

@keyframes explorationPulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(6, 182, 212, 0.5); }
  50% { box-shadow: 0 4px 24px rgba(6, 182, 212, 0.9); }
}

.node-marker.exploration .marker-ring {
  border-color: rgba(6, 182, 212, 0.5);
}

.node-marker.exploration.selected .marker-ring {
  border-color: #06b6d4;
}

/* Teal tint for exploration nodes */
.node-marker.exploration:not(.completed) .background-tint {
  background: rgba(6, 182, 212, 0.4);
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

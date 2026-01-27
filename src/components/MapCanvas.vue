<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getQuestNode, regions } from '../data/questNodes.js'
import NodeMarker from './NodeMarker.vue'
import RegionLinkMarker from './RegionLinkMarker.vue'

const props = defineProps({
  region: {
    type: Object,
    required: true
  },
  nodes: {
    type: Array,
    required: true
  },
  unlockedNodes: {
    type: Array,
    required: true
  },
  completedNodes: {
    type: Array,
    required: true
  },
  selectedNodeId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['selectNode', 'navigateRegion'])

const containerRef = ref(null)
const containerWidth = ref(0)

// Calculate scale to fit map in container
const scale = computed(() => {
  if (!containerWidth.value || !props.region.width) return 1
  return Math.min(containerWidth.value / props.region.width, 1)
})

const scaledHeight = computed(() => {
  return props.region.height * scale.value
})

// Filter to only show unlocked nodes
const visibleNodes = computed(() => {
  return props.nodes.filter(node => props.unlockedNodes.includes(node.id))
})

// Build trails between nodes
const trails = computed(() => {
  const result = []

  for (const node of props.nodes) {
    const isNodeUnlocked = props.unlockedNodes.includes(node.id)

    for (const connectedId of node.connections || []) {
      const connectedNode = getQuestNode(connectedId)
      if (!connectedNode) continue

      // Skip cross-region connections (these open new world maps)
      if (connectedNode.region !== node.region) continue

      const isConnectedUnlocked = props.unlockedNodes.includes(connectedId)

      // Determine trail visibility
      // - Both unlocked: full trail
      // - One unlocked: faded trail (teaser)
      // - Neither unlocked: hidden
      if (!isNodeUnlocked && !isConnectedUnlocked) continue

      result.push({
        from: node,
        to: connectedNode,
        fullyVisible: isNodeUnlocked && isConnectedUnlocked,
        id: `${node.id}-${connectedId}`
      })
    }
  }

  return result
})

// Detect cross-region connections from completed nodes
const regionLinks = computed(() => {
  const links = []
  for (const node of props.nodes) {
    if (!props.completedNodes.includes(node.id)) continue
    for (const connId of node.connections || []) {
      const connNode = getQuestNode(connId)
      if (!connNode || connNode.region === props.region.name) continue
      const targetRegion = regions.find(r => r.name === connNode.region)
      if (!targetRegion) continue
      links.push({
        id: `link-${node.id}-${connId}`,
        sourceNode: node,
        targetNode: connNode,
        targetRegion,
        position: node.regionLinkPosition || { x: node.x + 60, y: node.y }
      })
    }
  }
  return links
})

function handleResize() {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function selectNode(node) {
  emit('selectNode', node)
}

function navigateRegion(payload) {
  emit('navigateRegion', payload)
}
</script>

<template>
  <div
    ref="containerRef"
    class="map-canvas"
    :style="{ height: scaledHeight + 'px' }"
  >
    <!-- Background -->
    <div
      class="map-background"
      :style="{
        backgroundColor: region.backgroundColor,
        backgroundImage: region.backgroundImage ? `url(${region.backgroundImage})` : 'none'
      }"
    ></div>

    <!-- SVG Layer for fog and trails -->
    <svg
      class="map-svg"
      :viewBox="`0 0 ${region.width} ${region.height}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Dotted trail paths -->
      <g class="trails">
        <template v-for="trail in trails" :key="trail.id">
          <line
            :x1="trail.from.x"
            :y1="trail.from.y"
            :x2="trail.to.x"
            :y2="trail.to.y"
            :class="['trail-line', { faded: !trail.fullyVisible }]"
            stroke-dasharray="8 8"
          />
        </template>
        <!-- Region link trails -->
        <template v-for="link in regionLinks" :key="link.id">
          <line
            :x1="link.sourceNode.x"
            :y1="link.sourceNode.y"
            :x2="link.position.x"
            :y2="link.position.y"
            class="trail-line region-link-trail"
            stroke-dasharray="8 8"
          />
        </template>
      </g>
    </svg>

    <!-- Node markers (positioned absolutely) -->
    <div class="markers-layer">
      <NodeMarker
        v-for="node in visibleNodes"
        :key="node.id"
        :node="node"
        :is-completed="completedNodes.includes(node.id)"
        :is-selected="selectedNodeId === node.id"
        :scale="scale"
        @select="selectNode"
      />
      <RegionLinkMarker
        v-for="link in regionLinks"
        :key="link.id"
        :link="link"
        :scale="scale"
        @navigate="navigateRegion"
      />
    </div>
  </div>
</template>

<style scoped>
.map-canvas {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.map-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.map-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.trail-line {
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 3;
  stroke-linecap: round;
}

.trail-line.faded {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-dasharray: 6 10;
}

.trail-line.region-link-trail {
  stroke: rgba(59, 130, 246, 0.5);
  stroke-width: 3;
  stroke-linecap: round;
}

.markers-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.markers-layer > * {
  pointer-events: auto;
}
</style>

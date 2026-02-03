<script setup>
import { computed } from 'vue'
import { getQuestNode, regions } from '../data/quests/index.js'
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

// Use region dimensions for coordinate space
const logicalWidth = computed(() => props.region.width || 600)
const logicalHeight = computed(() => props.region.height || 1000)

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

// Safe zone boundaries (percentages) to avoid header/edges - must match NodeMarker.vue
const SAFE_ZONE = { top: 12, bottom: 92, left: 8, right: 92 }

// Convert logical coordinates to safe zone percentage
function toSafeX(x) {
  return SAFE_ZONE.left + (x / logicalWidth.value) * (SAFE_ZONE.right - SAFE_ZONE.left)
}

function toSafeY(y) {
  return SAFE_ZONE.top + (y / logicalHeight.value) * (SAFE_ZONE.bottom - SAFE_ZONE.top)
}

function selectNode(node) {
  emit('selectNode', node)
}

function navigateRegion(payload) {
  emit('navigateRegion', payload)
}
</script>

<template>
  <div class="map-canvas">
    <!-- Background -->
    <div
      class="map-background"
      :style="{
        backgroundColor: region.backgroundColor,
        backgroundImage: region.backgroundImage ? `url(${region.backgroundImage})` : 'none'
      }"
    ></div>

    <!-- SVG Layer for trails (uses percentage coordinates to match safe zone) -->
    <svg
      class="map-svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <!-- Dotted trail paths -->
      <g class="trails">
        <template v-for="trail in trails" :key="trail.id">
          <line
            :x1="toSafeX(trail.from.x)"
            :y1="toSafeY(trail.from.y)"
            :x2="toSafeX(trail.to.x)"
            :y2="toSafeY(trail.to.y)"
            :class="['trail-line', { faded: !trail.fullyVisible }]"
            stroke-dasharray="2 2"
          />
        </template>
        <!-- Region link trails -->
        <template v-for="link in regionLinks" :key="link.id">
          <line
            :x1="toSafeX(link.sourceNode.x)"
            :y1="toSafeY(link.sourceNode.y)"
            :x2="toSafeX(link.position.x)"
            :y2="toSafeY(link.position.y)"
            class="trail-line region-link-trail"
            stroke-dasharray="2 2"
          />
        </template>
      </g>
    </svg>

    <!-- Node markers (positioned as percentages) -->
    <div class="markers-layer">
      <NodeMarker
        v-for="node in visibleNodes"
        :key="node.id"
        :node="node"
        :is-completed="completedNodes.includes(node.id)"
        :is-selected="selectedNodeId === node.id"
        :logical-width="logicalWidth"
        :logical-height="logicalHeight"
        @select="selectNode"
      />
      <RegionLinkMarker
        v-for="link in regionLinks"
        :key="link.id"
        :link="link"
        :logical-width="logicalWidth"
        :logical-height="logicalHeight"
        @navigate="navigateRegion"
      />
    </div>
  </div>
</template>

<style scoped>
.map-canvas {
  position: absolute;
  inset: 0;
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
  stroke-width: 0.5;
  stroke-linecap: round;
}

.trail-line.faded {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-dasharray: 1 2;
}

.trail-line.region-link-trail {
  stroke: rgba(59, 130, 246, 0.5);
  stroke-width: 0.5;
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

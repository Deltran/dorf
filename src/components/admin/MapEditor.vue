<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { generateMapImage } from '../../lib/gemini.js'
import { getQuestNode } from '../../data/quests/index.js'

const props = defineProps({
  region: { type: Object, required: true },
  nodes: { type: Array, required: true },
  imageUrl: { type: String, default: null },
  savedPrompt: { type: String, default: null }
})

const emit = defineEmits(['back', 'save-image', 'save-positions', 'resize-region', 'save-link-positions'])

// --- Bounds clamping ---
const EDGE_MARGIN = 10

function clampToRegion(pos) {
  return {
    x: Math.max(EDGE_MARGIN, Math.min(props.region.width - EDGE_MARGIN, pos.x)),
    y: Math.max(EDGE_MARGIN, Math.min(props.region.height - EDGE_MARGIN, pos.y))
  }
}

// --- Local node positions (mutable copies) ---
const nodePositions = ref({})
const movedNodes = ref({})

// --- Region link positions (mutable copies) ---
const linkPositions = ref({})
const movedLinks = ref({})

watch(() => props.nodes, (nodes) => {
  const positions = {}
  for (const node of nodes) {
    positions[node.id] = clampToRegion({ x: node.x, y: node.y })
  }
  nodePositions.value = positions
  movedNodes.value = {}
}, { immediate: true })

watch(() => props.nodes, (nodes) => {
  const positions = {}
  for (const node of nodes) {
    for (const connId of node.connections || []) {
      const connNode = getQuestNode(connId)
      if (!connNode || connNode.region === node.region) continue
      const linkId = `link-${node.id}`
      const rawPos = node.regionLinkPosition || { x: node.x + 60, y: node.y }
      const pos = clampToRegion(rawPos)
      positions[linkId] = { x: pos.x, y: pos.y, sourceNodeId: node.id }
    }
  }
  linkPositions.value = positions
  movedLinks.value = {}
}, { immediate: true })

const hasChanges = computed(() =>
  Object.keys(movedNodes.value).length > 0 || Object.keys(movedLinks.value).length > 0
)

// --- Map canvas scaling ---
const mapContainer = ref(null)
const containerWidth = ref(0)

const scale = computed(() => {
  if (!containerWidth.value || !props.region.width) return 1
  return Math.min(containerWidth.value / props.region.width, 1)
})

const scaledHeight = computed(() => {
  return props.region.height * scale.value
})

function updateContainerWidth() {
  if (mapContainer.value) {
    containerWidth.value = mapContainer.value.clientWidth
  }
}

onMounted(() => {
  updateContainerWidth()
  window.addEventListener('resize', updateContainerWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

// --- Node dragging ---
const draggingNodeId = ref(null)
const draggingLinkId = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

function onNodeMouseDown(e, nodeId) {
  e.preventDefault()
  draggingNodeId.value = nodeId
  const pos = nodePositions.value[nodeId]
  const rect = mapContainer.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - (pos.x * scale.value + rect.left),
    y: e.clientY - (pos.y * scale.value + rect.top)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onLinkMouseDown(e, linkId) {
  e.preventDefault()
  draggingLinkId.value = linkId
  const pos = linkPositions.value[linkId]
  const rect = mapContainer.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - (pos.x * scale.value + rect.left),
    y: e.clientY - (pos.y * scale.value + rect.top)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  const activeId = draggingNodeId.value || draggingLinkId.value
  if (!activeId) return
  const rect = mapContainer.value.getBoundingClientRect()
  const rawX = (e.clientX - rect.left - dragOffset.value.x) / scale.value
  const rawY = (e.clientY - rect.top - dragOffset.value.y) / scale.value
  const x = Math.max(0, Math.min(props.region.width, Math.round(rawX)))
  const y = Math.max(0, Math.min(props.region.height, Math.round(rawY)))

  if (draggingNodeId.value) {
    nodePositions.value[draggingNodeId.value] = { x, y }
    movedNodes.value[draggingNodeId.value] = true
  } else if (draggingLinkId.value) {
    const existing = linkPositions.value[draggingLinkId.value]
    linkPositions.value[draggingLinkId.value] = { ...existing, x, y }
    movedLinks.value[draggingLinkId.value] = true
  }
}

function onMouseUp() {
  draggingNodeId.value = null
  draggingLinkId.value = null
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

// --- Save positions ---
function saveLayout() {
  if (!hasChanges.value) return
  const positions = {}
  for (const nodeId of Object.keys(movedNodes.value)) {
    positions[nodeId] = clampToRegion(nodePositions.value[nodeId])
  }
  const linkPosPayload = {}
  for (const linkId of Object.keys(movedLinks.value)) {
    const link = linkPositions.value[linkId]
    const clamped = clampToRegion({ x: link.x, y: link.y })
    linkPosPayload[link.sourceNodeId] = clamped
  }
  if (Object.keys(positions).length > 0) {
    emit('save-positions', positions)
  }
  if (Object.keys(linkPosPayload).length > 0) {
    emit('save-link-positions', linkPosPayload)
  }
  movedNodes.value = {}
  movedLinks.value = {}
}

// --- Image generation ---
function buildDefaultPrompt() {
  const nodeDescriptions = props.nodes.map(n => 'a ' + n.name.toLowerCase())
  const nodeList = nodeDescriptions.length > 1
    ? nodeDescriptions.slice(0, -1).join(', ') + ', and ' + nodeDescriptions.at(-1)
    : nodeDescriptions[0] || ''
  return `No text. ${props.region.name}. Ariel view. Distinct areas that have no label that look like ${nodeList}. NEVER ADD TEXT TO THE IMAGE. No people. No monsters. No animals. Dark Fantasy. Pixel Art.`
}

const prompt = ref('')
const generateWidth = ref(600)
const generateHeight = ref(1000)
const generating = ref(false)
const generationError = ref(null)
const generationStatus = ref(null)
const generatedDataUrl = ref(null)

watch(() => props.region, (region) => {
  if (region) {
    prompt.value = props.savedPrompt || buildDefaultPrompt()
    generatedDataUrl.value = null
    generationError.value = null
    generating.value = false
  }
}, { immediate: true })

async function generate() {
  if (generating.value) return
  generating.value = true
  generationError.value = null
  generationStatus.value = null
  generatedDataUrl.value = null

  try {
    const dataUrl = await generateMapImage({
      prompt: prompt.value,
      width: generateWidth.value,
      height: generateHeight.value,
      onStatus: (msg) => { generationStatus.value = msg }
    })
    generatedDataUrl.value = dataUrl
  } catch (e) {
    generationError.value = e.message
  } finally {
    generating.value = false
  }
}

function saveGenerated() {
  emit('save-image', {
    regionId: props.region.id,
    dataUrl: generatedDataUrl.value,
    prompt: prompt.value
  })
  generatedDataUrl.value = null
}

function tryAgain() {
  generatedDataUrl.value = null
  generationError.value = null
}

// --- Trail connections ---
const trails = computed(() => {
  const result = []
  const regionNodes = new Set(props.nodes.map(n => n.id))
  for (const node of props.nodes) {
    for (const connId of node.connections || []) {
      if (!regionNodes.has(connId)) continue
      const fromPos = nodePositions.value[node.id]
      const toPos = nodePositions.value[connId]
      if (!fromPos || !toPos) continue
      result.push({
        id: `${node.id}-${connId}`,
        x1: fromPos.x, y1: fromPos.y,
        x2: toPos.x, y2: toPos.y
      })
    }
  }
  return result
})

const linkTrails = computed(() => {
  const result = []
  for (const [linkId, link] of Object.entries(linkPositions.value)) {
    const sourcePos = nodePositions.value[link.sourceNodeId]
    if (!sourcePos) continue
    result.push({
      id: linkId,
      x1: sourcePos.x, y1: sourcePos.y,
      x2: link.x, y2: link.y
    })
  }
  return result
})

// --- Node style helper ---
function getNodeStyle(nodeId) {
  const pos = nodePositions.value[nodeId]
  if (!pos) return {}
  return {
    left: `${pos.x * scale.value}px`,
    top: `${pos.y * scale.value}px`
  }
}

function getLinkStyle(linkId) {
  const pos = linkPositions.value[linkId]
  if (!pos) return {}
  return {
    left: `${pos.x * scale.value}px`,
    top: `${pos.y * scale.value}px`
  }
}
</script>

<template>
  <div class="map-editor">
    <!-- Top bar -->
    <div class="editor-top-bar">
      <button class="btn btn-secondary" @click="emit('back')">Back</button>
      <h2 class="editor-title">{{ region.name }}</h2>
      <div class="region-size-label">600x1000</div>
      <button
        class="btn btn-success"
        :disabled="!hasChanges"
        @click="saveLayout"
      >
        Save Layout
      </button>
    </div>

    <!-- Map canvas with node overlay -->
    <div
      ref="mapContainer"
      class="map-canvas-container"
      :style="{ maxWidth: region.width + 'px', height: scaledHeight + 'px' }"
    >
      <!-- Map background -->
      <div
        class="map-background"
        :style="{
          backgroundColor: region.backgroundColor || '#1a1a2a',
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none'
        }"
      ></div>

      <!-- Trail connections -->
      <svg
        class="trail-svg"
        :viewBox="`0 0 ${region.width} ${region.height}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          v-for="trail in trails"
          :key="trail.id"
          :x1="trail.x1" :y1="trail.y1"
          :x2="trail.x2" :y2="trail.y2"
          class="trail-line"
          stroke-dasharray="8 8"
        />
        <!-- Region link trails -->
        <line
          v-for="trail in linkTrails"
          :key="trail.id"
          :x1="trail.x1" :y1="trail.y1"
          :x2="trail.x2" :y2="trail.y2"
          class="trail-line link-trail"
          stroke-dasharray="8 8"
        />
      </svg>

      <!-- Node markers -->
      <div
        v-for="node in nodes"
        :key="node.id"
        :class="['node-marker', {
          'node-moved': movedNodes[node.id],
          'node-dragging': draggingNodeId === node.id,
          'node-genus-loci': node.type === 'genusLoci',
          'node-exploration': node.type === 'exploration'
        }]"
        :style="getNodeStyle(node.id)"
        :title="`${node.name} (${nodePositions[node.id]?.x}, ${nodePositions[node.id]?.y})`"
        @mousedown="onNodeMouseDown($event, node.id)"
      >
        <div class="node-dot"></div>
        <div class="node-label">{{ node.name }}</div>
      </div>

      <!-- Region link markers -->
      <div
        v-for="(link, linkId) in linkPositions"
        :key="linkId"
        :class="['node-marker', 'node-link', {
          'node-moved': movedLinks[linkId],
          'node-dragging': draggingLinkId === linkId
        }]"
        :style="getLinkStyle(linkId)"
        :title="`Region Link (${link.x}, ${link.y})`"
        @mousedown="onLinkMouseDown($event, linkId)"
      >
        <div class="node-dot"></div>
        <div class="node-label">Link</div>
      </div>
    </div>

    <!-- Generation panel -->
    <div class="generation-panel">
      <h3 class="panel-title">Generate Map Image</h3>

      <label class="prompt-label">Prompt</label>
      <textarea
        v-model="prompt"
        class="prompt-textarea"
        rows="3"
        :disabled="generating"
      />


      <button
        class="btn btn-primary"
        :disabled="generating || !prompt.trim()"
        @click="generate"
      >
        {{ generating ? 'Generating...' : 'Generate' }}
      </button>

      <div v-if="generating && generationStatus" class="status-msg">
        {{ generationStatus }}
      </div>

      <div v-if="generationError" class="error-msg">
        {{ generationError }}
      </div>

      <!-- Generation preview -->
      <div v-if="generatedDataUrl" class="generation-preview">
        <div class="preview-compare">
          <div v-if="imageUrl" class="compare-item">
            <div class="compare-label">Current</div>
            <img :src="imageUrl" class="preview-image" />
          </div>
          <div class="compare-item">
            <div class="compare-label">Generated</div>
            <img :src="generatedDataUrl" class="preview-image" />
          </div>
        </div>
        <div class="preview-actions">
          <button class="btn btn-success" @click="saveGenerated">Save</button>
          <button class="btn btn-secondary" @click="tryAgain">Try Again</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #374151;
}

.editor-title {
  flex: 1;
  margin: 0;
  font-size: 20px;
  color: #f3f4f6;
}

.region-size-label {
  font-size: 12px;
  color: #9ca3af;
  padding: 4px 10px;
  border: 1px solid #374151;
  border-radius: 4px;
}

/* --- Map Canvas --- */
.map-canvas-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #374151;
}

.map-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  image-rendering: pixelated;
}

/* --- Trail Connections --- */
.trail-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.trail-line {
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 3;
  stroke-linecap: round;
}

/* --- Node Markers --- */
.node-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.node-marker:active,
.node-dragging {
  cursor: grabbing;
  z-index: 20;
}

.node-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #facc15;
  border: 2px solid #fef08a;
  box-shadow: 0 0 6px rgba(250, 204, 21, 0.5);
}

.node-genus-loci .node-dot {
  background: #a855f7;
  border-color: #c084fc;
  box-shadow: 0 0 6px rgba(168, 85, 247, 0.5);
}

.node-exploration .node-dot {
  background: #22d3ee;
  border-color: #67e8f9;
  box-shadow: 0 0 6px rgba(34, 211, 238, 0.5);
}

.node-moved .node-dot {
  border-color: #f97316;
  box-shadow: 0 0 8px rgba(249, 115, 22, 0.6);
}

.node-dragging .node-dot {
  transform: scale(1.3);
}

.node-link .node-dot {
  background: #3b82f6;
  border-color: #60a5fa;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
}

.trail-line.link-trail {
  stroke: rgba(59, 130, 246, 0.5);
}

.node-label {
  font-size: 9px;
  color: #f3f4f6;
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
}

/* --- Generation Panel --- */
.generation-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  color: #d1d5db;
}

.prompt-label {
  font-size: 13px;
  font-weight: 600;
  color: #d1d5db;
}

.prompt-textarea {
  width: 100%;
  padding: 10px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.prompt-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.prompt-textarea:disabled {
  opacity: 0.5;
}


.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
}

.btn-secondary {
  background: #374151;
  color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.status-msg {
  color: #facc15;
  font-size: 13px;
  padding: 8px;
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  padding: 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
}

.generation-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.preview-compare {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.compare-item {
  text-align: center;
}

.compare-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.preview-image {
  max-width: 400px;
  max-height: 250px;
  image-rendering: pixelated;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.preview-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>

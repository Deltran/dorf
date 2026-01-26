<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { generateMapImage } from '../../lib/gemini.js'

const props = defineProps({
  region: { type: Object, required: true },
  nodes: { type: Array, required: true },
  imageUrl: { type: String, default: null },
  savedPrompt: { type: String, default: null }
})

const emit = defineEmits(['back', 'save-image', 'save-positions', 'resize-region'])

// --- Local node positions (mutable copies) ---
const nodePositions = ref({})
const movedNodes = ref({})

watch(() => props.nodes, (nodes) => {
  const positions = {}
  for (const node of nodes) {
    positions[node.id] = { x: node.x, y: node.y }
  }
  nodePositions.value = positions
  movedNodes.value = {}
}, { immediate: true })

const hasChanges = computed(() => Object.keys(movedNodes.value).length > 0)

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

function onMouseMove(e) {
  if (!draggingNodeId.value) return
  const rect = mapContainer.value.getBoundingClientRect()
  const rawX = (e.clientX - rect.left - dragOffset.value.x) / scale.value
  const rawY = (e.clientY - rect.top - dragOffset.value.y) / scale.value

  // Clamp to region bounds
  const x = Math.max(0, Math.min(props.region.width, Math.round(rawX)))
  const y = Math.max(0, Math.min(props.region.height, Math.round(rawY)))

  nodePositions.value[draggingNodeId.value] = { x, y }
  movedNodes.value[draggingNodeId.value] = true
}

function onMouseUp() {
  draggingNodeId.value = null
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

// --- Save positions ---
function saveLayout() {
  if (!hasChanges.value) return
  const positions = {}
  for (const nodeId of Object.keys(movedNodes.value)) {
    positions[nodeId] = nodePositions.value[nodeId]
  }
  emit('save-positions', positions)
  movedNodes.value = {}
}

// --- Image generation ---
function buildDefaultPrompt() {
  return `${props.region.name}. Dark fantasy pixel art.`
}

const prompt = ref('')
const generateWidth = ref(800)
const generateHeight = ref(500)
const generating = ref(false)
const generationError = ref(null)
const generatedDataUrl = ref(null)

watch(() => props.region, (region) => {
  if (region) {
    prompt.value = props.savedPrompt || buildDefaultPrompt()
    generatedDataUrl.value = null
    generationError.value = null
    generating.value = false
    // Default size from region dimensions, snapped to preferred sizes
    if (region.width === region.height) {
      generateWidth.value = 800
      generateHeight.value = 800
    } else {
      generateWidth.value = 800
      generateHeight.value = 500
    }
  }
}, { immediate: true })

async function generate() {
  if (generating.value) return
  generating.value = true
  generationError.value = null
  generatedDataUrl.value = null

  try {
    const dataUrl = await generateMapImage({
      prompt: prompt.value,
      width: generateWidth.value,
      height: generateHeight.value
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

// --- Node style helper ---
function getNodeStyle(nodeId) {
  const pos = nodePositions.value[nodeId]
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
      <div class="region-size-toggle">
        <button
          :class="['size-btn', { active: region.width === 800 && region.height === 500 }]"
          @click="emit('resize-region', { width: 800, height: 500 })"
        >800x500</button>
        <button
          :class="['size-btn', { active: region.width === 800 && region.height === 800 }]"
          @click="emit('resize-region', { width: 800, height: 800 })"
        >800x800</button>
      </div>
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

      <div class="size-picker">
        <label class="prompt-label">Size</label>
        <div class="size-options">
          <label :class="['size-option', { active: generateWidth === 800 && generateHeight === 500 }]">
            <input type="radio" name="mapSize" :checked="generateWidth === 800 && generateHeight === 500" @change="generateWidth = 800; generateHeight = 500" :disabled="generating" />
            800x500
          </label>
          <label :class="['size-option', { active: generateWidth === 800 && generateHeight === 800 }]">
            <input type="radio" name="mapSize" :checked="generateWidth === 800 && generateHeight === 800" @change="generateWidth = 800; generateHeight = 800" :disabled="generating" />
            800x800
          </label>
        </div>
      </div>

      <button
        class="btn btn-primary"
        :disabled="generating || !prompt.trim()"
        @click="generate"
      >
        {{ generating ? 'Generating...' : 'Generate' }}
      </button>

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

.region-size-toggle {
  display: flex;
  gap: 4px;
}

.size-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #374151;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
}

.size-btn.active {
  border-color: #3b82f6;
  color: #f3f4f6;
  background: rgba(59, 130, 246, 0.15);
}

.size-btn:hover:not(.active) {
  border-color: #4b5563;
  color: #d1d5db;
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
  user-select: none;
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

.size-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.size-options {
  display: flex;
  gap: 12px;
}

.size-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #374151;
}

.size-option.active {
  color: #f3f4f6;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.size-option input {
  display: none;
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

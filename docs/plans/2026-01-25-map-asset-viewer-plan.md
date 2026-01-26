# Map Asset Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Maps" section to the admin asset viewer with Gemini-powered map generation, node overlay preview, and drag-and-drop node repositioning.

**Architecture:** Card grid grouped by super region. Click a card to open a full-width inline editor showing the map with draggable node markers. Gemini API generates map images (resized via canvas), and a new admin endpoint writes updated node positions back to `questNodes.js` source.

**Tech Stack:** Vue 3 Composition API, Gemini `generateContent` API, HTML Canvas (resize + drag), Vite dev server middleware

---

### Task 1: Gemini image generation client

**Files:**
- Create: `src/lib/gemini.js`

**Context:**
- Gemini's `generateContent` endpoint generates images when `responseModalities` includes `"IMAGE"`
- Model: `gemini-2.5-flash-image` (aka Nano Banana)
- API key from `import.meta.env.VITE_GEMINI_API_KEY`
- Returns base64 PNG in `inlineData` parts of the response
- We need to resize the generated image (Gemini outputs ~1024px) to the target dimensions using canvas
- Aspect ratio param maps our sizes: 800x500 → "16:9", 800x800 → "1:1"

**Step 1: Create the client**

```js
// Browser-side Gemini image generation client

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function getApiKey() {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Add it to your .env file.')
  }
  return key
}

/**
 * Pick the closest Gemini aspect ratio for target dimensions.
 */
function getAspectRatio(width, height) {
  const ratio = width / height
  // Gemini supports: 1:1, 16:9, 9:16, 4:3, 3:4
  if (Math.abs(ratio - 1) < 0.1) return '1:1'
  if (ratio > 1.5) return '16:9'
  if (ratio < 0.67) return '9:16'
  if (ratio > 1) return '4:3'
  return '3:4'
}

/**
 * Resize an image data URL to exact target dimensions using canvas.
 */
function resizeImage(dataUrl, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        reject(new Error('Failed to resize image: ' + e.message))
      }
    }
    img.onerror = () => reject(new Error('Failed to load image for resize'))
    img.src = dataUrl
  })
}

/**
 * Generate a map image using the Gemini API.
 *
 * @param {Object} options
 * @param {string} options.prompt - Description of the map to generate
 * @param {number} [options.width=800] - Target image width in pixels
 * @param {number} [options.height=500] - Target image height in pixels
 * @returns {Promise<string>} Data URL of the generated image (data:image/png;base64,...)
 */
export async function generateMapImage({ prompt, width = 800, height = 500 }) {
  const apiKey = getApiKey()
  const model = 'gemini-2.5-flash-image'
  const aspectRatio = getAspectRatio(width, height)

  const response = await fetch(
    `${API_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          aspectRatio
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  // Extract base64 image from response parts
  const candidates = result.candidates || []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || []
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        // Resize to target dimensions
        return await resizeImage(dataUrl, width, height)
      }
    }
  }

  throw new Error('No image found in Gemini response')
}
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/lib/gemini.js
git commit -m "feat(admin): add Gemini image generation client"
```

---

### Task 2: Save node positions endpoint

**Files:**
- Modify: `vite-plugin-admin.js`

**Context:**
- Node positions in `questNodes.js` look like: `    x: 100,` and `    y: 320,` on separate lines
- Each node block starts with `  nodeId: {` and contains `id: 'nodeId'`
- Strategy: for each node, find its block by matching `id: '{nodeId}'`, then regex-replace the `x:` and `y:` lines within that block
- Must round coordinates to integers

**Step 1: Add the endpoint**

Add this new middleware block in `vite-plugin-admin.js` after the `save-prompts` middleware (before the closing `}` of `configureServer`):

```js
      // POST /__admin/save-node-positions - update x/y in questNodes.js
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/__admin/save-node-positions') {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          try {
            const { positions } = JSON.parse(body)

            if (!positions || typeof positions !== 'object') {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'positions object is required' }))
              return
            }

            const filePath = path.resolve(process.cwd(), 'src/data/questNodes.js')
            let content = fs.readFileSync(filePath, 'utf-8')

            for (const [nodeId, pos] of Object.entries(positions)) {
              const x = Math.round(pos.x)
              const y = Math.round(pos.y)

              // Find the node block by its id property
              const idPattern = new RegExp(`id:\\s*'${nodeId}'`)
              const idMatch = content.match(idPattern)
              if (!idMatch) continue

              // Find the enclosing block boundaries (search backward for opening key, forward for next node)
              const idIndex = idMatch.index
              // Replace x: and y: values within a reasonable range after the id match
              // Search for x: and y: within the next 200 chars (well within the node block)
              const blockSlice = content.slice(idIndex, idIndex + 200)

              const xMatch = blockSlice.match(/x:\s*\d+/)
              const yMatch = blockSlice.match(/y:\s*\d+/)

              if (xMatch) {
                const absoluteIndex = idIndex + xMatch.index
                content = content.slice(0, absoluteIndex) + `x: ${x}` + content.slice(absoluteIndex + xMatch[0].length)
              }

              if (yMatch) {
                // Re-find after x replacement may have shifted indices
                const updatedIdMatch = content.match(idPattern)
                const updatedIdIndex = updatedIdMatch.index
                const updatedSlice = content.slice(updatedIdIndex, updatedIdIndex + 200)
                const updatedYMatch = updatedSlice.match(/y:\s*\d+/)
                if (updatedYMatch) {
                  const absoluteIndex = updatedIdIndex + updatedYMatch.index
                  content = content.slice(0, absoluteIndex) + `y: ${y}` + content.slice(absoluteIndex + updatedYMatch[0].length)
                }
              }
            }

            fs.writeFileSync(filePath, content, 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }
        next()
      })
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add vite-plugin-admin.js
git commit -m "feat(admin): add save-node-positions endpoint for questNodes.js"
```

---

### Task 3: MapAssetCard component

**Files:**
- Create: `src/components/admin/MapAssetCard.vue`

**Context:**
- Shows a region as a card with map thumbnail
- Region object: `{ id, name, width, height, backgroundImage?, backgroundColor }`
- `imageUrl` prop comes from glob import (resolved URL or null)
- Node count passed as prop
- Landscape orientation matching the map aspect ratio

**Step 1: Create the component**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  region: { type: Object, required: true },
  imageUrl: { type: String, default: null },
  nodeCount: { type: Number, default: 0 }
})

const emit = defineEmits(['select'])

const hasPng = computed(() => !!props.imageUrl)
</script>

<template>
  <div
    :class="['map-asset-card', { 'missing-png': !hasPng }]"
    @click="emit('select', region)"
  >
    <div class="image-area">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="region.name"
        class="map-image"
      />
      <div
        v-else
        class="image-placeholder"
        :style="{ backgroundColor: region.backgroundColor || '#1a1a2a' }"
      >?</div>
    </div>

    <div class="card-info">
      <div class="region-name">{{ region.name }}</div>
      <div class="region-id">{{ region.id }}</div>
      <div class="node-count">{{ nodeCount }} nodes</div>
    </div>

    <div class="status-row">
      <span :class="['status-indicator', hasPng ? 'status-ok' : 'status-missing']">PNG</span>
    </div>
  </div>
</template>

<style scoped>
.map-asset-card {
  border: 2px solid #374151;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #1f2937 0%, #1a2030 100%);
}

.map-asset-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.map-asset-card.missing-png {
  border-style: dashed;
  opacity: 0.7;
}

.image-area {
  width: 200px;
  height: 125px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border-radius: 4px;
  overflow: hidden;
}

.map-image {
  width: 200px;
  height: 125px;
  image-rendering: pixelated;
  object-fit: cover;
}

.image-placeholder {
  width: 200px;
  height: 125px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #4b5563;
  user-select: none;
}

.card-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.region-name {
  font-size: 13px;
  font-weight: 600;
  color: #f3f4f6;
  line-height: 1.2;
}

.region-id {
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
}

.node-count {
  font-size: 11px;
  color: #9ca3af;
}

.status-row {
  display: flex;
  gap: 6px;
}

.status-indicator {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
}

.status-indicator.status-ok {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.status-indicator.status-missing {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}
</style>
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/components/admin/MapAssetCard.vue
git commit -m "feat(admin): add MapAssetCard component"
```

---

### Task 4: MapEditor component

**Files:**
- Create: `src/components/admin/MapEditor.vue`

**Context:**
- Full-width inline editor that replaces the card grid when a region is selected
- Three sections: top bar, map canvas with draggable nodes, generation panel
- Node dragging: mousedown on node starts drag, mousemove updates position, mouseup ends drag
- Positions are in native region coordinates (0 to region.width / region.height)
- Scale factor: `containerWidth / region.width` (capped at 1)
- "Save Layout" button calls `/__admin/save-node-positions`
- Map generation uses Gemini (from `src/lib/gemini.js`)
- Save image uses existing `/__admin/save-asset` with path `maps/{regionId}.png`
- Prompts keyed as `map_{regionId}` in assetPrompts
- Moved nodes get a visual indicator (orange border)
- The `nodes` prop contains objects with `{ id, name, x, y, type?, region }` — we make local copies for dragging

**Step 1: Create the component**

```vue
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { generateMapImage } from '../../lib/gemini.js'

const props = defineProps({
  region: { type: Object, required: true },
  nodes: { type: Array, required: true },
  imageUrl: { type: String, default: null },
  savedPrompt: { type: String, default: null }
})

const emit = defineEmits(['back', 'save-image', 'save-positions'])

// --- Local node positions (mutable copies) ---
const nodePositions = ref({})
const movedNodes = ref(new Set())

watch(() => props.nodes, (nodes) => {
  const positions = {}
  for (const node of nodes) {
    positions[node.id] = { x: node.x, y: node.y }
  }
  nodePositions.value = positions
  movedNodes.value = new Set()
}, { immediate: true })

const hasChanges = computed(() => movedNodes.value.size > 0)

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
  movedNodes.value.add(draggingNodeId.value)
}

function onMouseUp() {
  draggingNodeId.value = null
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

// --- Save positions ---
const savingPositions = ref(false)

async function saveLayout() {
  if (!hasChanges.value || savingPositions.value) return
  savingPositions.value = true

  try {
    const positions = {}
    for (const nodeId of movedNodes.value) {
      positions[nodeId] = nodePositions.value[nodeId]
    }
    emit('save-positions', positions)
    movedNodes.value = new Set()
  } finally {
    savingPositions.value = false
  }
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
      <button
        class="btn btn-success"
        :disabled="!hasChanges || savingPositions"
        @click="saveLayout"
      >
        {{ savingPositions ? 'Saving...' : 'Save Layout' }}
      </button>
    </div>

    <!-- Map canvas with node overlay -->
    <div
      ref="mapContainer"
      class="map-canvas-container"
      :style="{ height: scaledHeight + 'px' }"
    >
      <!-- Map background -->
      <div
        class="map-background"
        :style="{
          backgroundColor: region.backgroundColor || '#1a1a2a',
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          width: (region.width * scale) + 'px',
          height: (region.height * scale) + 'px'
        }"
      ></div>

      <!-- Node markers -->
      <div
        v-for="node in nodes"
        :key="node.id"
        :class="['node-marker', {
          'node-moved': movedNodes.has(node.id),
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

/* --- Map Canvas --- */
.map-canvas-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #374151;
}

.map-background {
  position: absolute;
  top: 0;
  left: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
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
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/components/admin/MapEditor.vue
git commit -m "feat(admin): add MapEditor with draggable nodes and generation"
```

---

### Task 5: AssetViewerMaps screen

**Files:**
- Create: `src/screens/admin/AssetViewerMaps.vue`

**Context:**
- Card grid grouped by super region, toggles to inline editor on card click
- Imports `regions`, `questNodes`, `superRegions` from `questNodes.js`
- Map images detected via glob from `src/assets/maps/`
- When editing, passes region + filtered nodes to MapEditor
- Handles save-image (POST to save-asset), save-positions (POST to save-node-positions), prompt saves
- Override map for post-save image reactivity

**Step 1: Create the component**

```vue
<script setup>
import { ref, computed } from 'vue'
import { questNodes, regions, superRegions } from '../../data/questNodes.js'
import assetPromptsData from '../../data/assetPrompts.json'
import MapAssetCard from '../../components/admin/MapAssetCard.vue'
import MapEditor from '../../components/admin/MapEditor.vue'

// --- Glob imports for asset detection ---
const mapImages = import.meta.glob('../../assets/maps/*.png', { eager: true, import: 'default' })

// --- Override map for newly saved assets ---
const imageOverrides = ref({})

// --- Asset lookup ---
function getImageUrl(regionId) {
  if (imageOverrides.value[regionId]) return imageOverrides.value[regionId]
  const path = `../../assets/maps/${regionId}.png`
  return mapImages[path] || null
}

// --- Node counts per region ---
function getNodeCount(regionName) {
  return Object.values(questNodes).filter(n => n.region === regionName).length
}

// --- Nodes for a region ---
function getRegionNodes(regionName) {
  return Object.values(questNodes)
    .filter(n => n.region === regionName)
    .map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y, type: n.type || null, region: n.region }))
}

// --- Super region groups ---
const superRegionGroups = computed(() => {
  const groups = []
  for (const sr of superRegions) {
    const srRegions = regions.filter(r => r.superRegion === sr.id)
    if (srRegions.length > 0) {
      groups.push({
        superRegionName: sr.name,
        regions: srRegions
      })
    }
  }
  return groups
})

// --- Asset prompts state ---
const assetPrompts = ref({ ...assetPromptsData })

// --- Editor state ---
const editingRegion = ref(null)

function openEditor(region) {
  editingRegion.value = region
}

function closeEditor() {
  editingRegion.value = null
}

// --- Save handlers ---
async function saveImage({ regionId, dataUrl, prompt }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `maps/${regionId}.png`, dataUrl })
    })

    const promptKey = `map_${regionId}`
    assetPrompts.value[promptKey] = prompt
    await fetch('/__admin/save-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPrompts.value)
    })

    imageOverrides.value[regionId] = dataUrl
  } catch (err) {
    alert('Failed to save map: ' + (err.message || err))
  }
}

async function savePositions(positions) {
  try {
    await fetch('/__admin/save-node-positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions })
    })
  } catch (err) {
    alert('Failed to save positions: ' + (err.message || err))
  }
}
</script>

<template>
  <div class="asset-viewer-maps">
    <!-- Editor view -->
    <MapEditor
      v-if="editingRegion"
      :region="editingRegion"
      :nodes="getRegionNodes(editingRegion.name)"
      :image-url="getImageUrl(editingRegion.id)"
      :saved-prompt="assetPrompts[`map_${editingRegion.id}`] || null"
      @back="closeEditor"
      @save-image="saveImage"
      @save-positions="savePositions"
    />

    <!-- Card grid view -->
    <template v-else>
      <div v-for="group in superRegionGroups" :key="group.superRegionName" class="super-region-group">
        <h3 class="super-region-header">{{ group.superRegionName }}</h3>
        <div class="maps-grid">
          <MapAssetCard
            v-for="region in group.regions"
            :key="region.id"
            :region="region"
            :image-url="getImageUrl(region.id)"
            :node-count="getNodeCount(region.name)"
            @select="openEditor"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.asset-viewer-maps {
  padding: 16px;
}

.super-region-group {
  margin-bottom: 32px;
}

.super-region-header {
  font-size: 16px;
  font-weight: 600;
  color: #d1d5db;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #374151;
}

.maps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
</style>
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/screens/admin/AssetViewerMaps.vue
git commit -m "feat(admin): add AssetViewerMaps with super-region grouping"
```

---

### Task 6: Wire into AdminScreen

**Files:**
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Add the Maps section**

Add import:
```js
import AssetViewerMaps from './admin/AssetViewerMaps.vue'
```

Add to sections array:
```js
{ id: 'maps', label: 'Maps' }
```

Add to template content-body:
```html
<AssetViewerMaps v-else-if="activeSection === 'maps'" />
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/screens/AdminScreen.vue
git commit -m "feat(admin): wire Maps section into AdminScreen sidebar"
```

---

### Task 7: Smoke test

**Step 1: Verify build passes**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -10`
Expected: Build succeeds

**Step 2: Verify no broken imports**

Run: `cd /home/deltran/code/dorf && grep -r "MapAssetCard\|MapEditor\|AssetViewerMaps\|gemini" src/ --include="*.vue" --include="*.js"`
Expected: References only in new files and AdminScreen

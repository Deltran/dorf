# Battle Backgrounds Asset Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Backgrounds" section to the admin asset viewer for browsing and generating battle background images, grouped by region.

**Architecture:** Three new Vue components following the existing hero/enemy viewer pattern. Quest node data from `questNodes.js` provides the node list and region grouping. Background images live in `src/assets/battle_backgrounds/{nodeId}.png` and are detected via Vite glob import. A special "Default" section sits at the top for the global `default.png` fallback.

**Tech Stack:** Vue 3 Composition API, Vite glob imports, PixelLab v2 API (existing `pixellab.js` client)

---

### Task 1: BackgroundAssetCard component

**Files:**
- Create: `src/components/admin/BackgroundAssetCard.vue`

**Context:**
- Battle backgrounds are 320x128 pixels — landscape orientation
- Each card represents a quest node (or the "default" fallback)
- Node object shape: `{ id, name, region, type? }` where type is optionally `'genusLoci'` or `'exploration'`
- For the default card, node will be `{ id: 'default', name: 'Default Background', region: 'Default' }`

**Step 1: Create the component**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  imageUrl: { type: String, default: null }
})

const emit = defineEmits(['select'])

const hasPng = computed(() => !!props.imageUrl)
const displayImage = computed(() => props.imageUrl || null)

const typeBadge = computed(() => {
  if (props.node.type === 'genusLoci') return 'Genus Loci'
  if (props.node.type === 'exploration') return 'Exploration'
  return null
})
</script>

<template>
  <div
    :class="['bg-asset-card', { 'missing-png': !hasPng }]"
    @click="emit('select', node)"
  >
    <div class="image-area">
      <img
        v-if="displayImage"
        :src="displayImage"
        :alt="node.name"
        class="bg-image"
      />
      <div v-else class="image-placeholder">?</div>
    </div>

    <div class="card-info">
      <div class="node-name">{{ node.name }}</div>
      <div class="node-id">{{ node.id }}</div>
      <div v-if="typeBadge" :class="['type-badge', node.type]">{{ typeBadge }}</div>
    </div>

    <div class="status-row">
      <span :class="['status-indicator', hasPng ? 'status-ok' : 'status-missing']">PNG</span>
    </div>
  </div>
</template>

<style scoped>
.bg-asset-card {
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

.bg-asset-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.bg-asset-card.missing-png {
  border-style: dashed;
  opacity: 0.7;
}

.image-area {
  width: 160px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border-radius: 4px;
  overflow: hidden;
}

.bg-image {
  width: 160px;
  height: 64px;
  image-rendering: pixelated;
  object-fit: cover;
}

.image-placeholder {
  width: 160px;
  height: 64px;
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

.node-name {
  font-size: 13px;
  font-weight: 600;
  color: #f3f4f6;
  line-height: 1.2;
}

.node-id {
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
}

.type-badge {
  font-size: 11px;
  color: #9ca3af;
}

.type-badge.genusLoci {
  color: #f59e0b;
  font-weight: 600;
}

.type-badge.exploration {
  color: #22c55e;
  font-weight: 600;
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
Expected: Build succeeds (component not yet imported anywhere, but no syntax errors)

**Step 3: Commit**

```bash
git add src/components/admin/BackgroundAssetCard.vue
git commit -m "feat(admin): add BackgroundAssetCard component"
```

---

### Task 2: BackgroundAssetModal component

**Files:**
- Create: `src/components/admin/BackgroundAssetModal.vue`

**Context:**
- Same modal pattern as `EnemyAssetModal.vue` but simpler: no portrait crop, no size picker
- Fixed generation size: 320x128
- Default prompt: `"{node name}. {region name}. Battle background. Dark fantasy pixel art."`
- Default card prompt: `"Battle background. Dark fantasy pixel art."`
- Prompts keyed by `bg_{nodeId}` in assetPrompts.json to avoid ID collisions
- Uses existing `generateHeroImage` from `src/lib/pixellab.js` (works for any image, name is legacy)

**Step 1: Create the component**

```vue
<script setup>
import { ref, watch } from 'vue'
import { generateHeroImage } from '../../lib/pixellab.js'

const props = defineProps({
  node: { type: Object, default: null },
  imageUrl: { type: String, default: null },
  savedPrompt: { type: String, default: null }
})

const emit = defineEmits(['close', 'save-image'])

function buildDefaultPrompt(node) {
  if (node.id === 'default') return 'Battle background. Dark fantasy pixel art.'
  return `${node.name}. ${node.region}. Battle background. Dark fantasy pixel art.`
}

const prompt = ref('')
const generating = ref(false)
const generationError = ref(null)
const generatedDataUrl = ref(null)

watch(() => props.node, (newNode) => {
  if (newNode) {
    prompt.value = props.savedPrompt || buildDefaultPrompt(newNode)
    generatedDataUrl.value = null
    generationError.value = null
    generating.value = false
  }
}, { immediate: true })

async function generate() {
  if (generating.value) return
  generating.value = true
  generationError.value = null
  generatedDataUrl.value = null

  try {
    const dataUrl = await generateHeroImage({
      prompt: prompt.value,
      width: 320,
      height: 128
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
    nodeId: props.node.id,
    dataUrl: generatedDataUrl.value,
    prompt: prompt.value
  })
  generatedDataUrl.value = null
}

function tryAgain() {
  generatedDataUrl.value = null
  generationError.value = null
}

function onBackdropClick(e) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <div v-if="node" class="modal-backdrop" @click="onBackdropClick">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ node.name }}</h2>
        <span class="node-id-label">{{ node.id }}</span>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Top: Image preview -->
        <div class="preview-section">
          <div class="main-preview">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              :alt="node.name"
              class="main-image"
            />
            <div v-else class="preview-placeholder">No background image</div>
          </div>
        </div>

        <!-- Bottom: Generation controls -->
        <div class="generation-section">
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
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #f3f4f6;
}

.node-id-label {
  font-size: 13px;
  color: #6b7280;
  font-family: monospace;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  cursor: pointer;
  padding: 0 4px;
  margin-left: auto;
}

.close-btn:hover {
  color: #f3f4f6;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.preview-section {
  display: flex;
  justify-content: center;
}

.main-preview {
  width: 480px;
  height: 192px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.main-image {
  width: 480px;
  height: 192px;
  image-rendering: pixelated;
  object-fit: fill;
}

.preview-placeholder {
  color: #4b5563;
  font-size: 14px;
}

.generation-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.btn-success:hover {
  background: #16a34a;
}

.btn-secondary {
  background: #374151;
  color: #d1d5db;
}

.btn-secondary:hover {
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
  flex-direction: column;
  gap: 12px;
  align-items: center;
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
  width: 320px;
  height: 128px;
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
git add src/components/admin/BackgroundAssetModal.vue
git commit -m "feat(admin): add BackgroundAssetModal component"
```

---

### Task 3: AssetViewerBackgrounds screen

**Files:**
- Create: `src/screens/admin/AssetViewerBackgrounds.vue`

**Context:**
- Imports `questNodes` and `regions` from `src/data/questNodes.js`
- Groups nodes by region, with "Default" section at top
- Each node object needs: `{ id, name, region, type? }` — extract from questNodes data
- Background images glob: `../../assets/battle_backgrounds/*.png`
- Prompts keyed as `bg_{nodeId}` in assetPrompts to avoid collision with hero/enemy IDs
- Override map pattern for post-save reactivity (no page reload)
- Save asset path: `battle_backgrounds/{nodeId}.png`

**Step 1: Create the component**

```vue
<script setup>
import { ref, computed } from 'vue'
import { questNodes, regions } from '../../data/questNodes.js'
import assetPromptsData from '../../data/assetPrompts.json'
import BackgroundAssetCard from '../../components/admin/BackgroundAssetCard.vue'
import BackgroundAssetModal from '../../components/admin/BackgroundAssetModal.vue'

// --- Glob imports for asset detection ---
const bgImages = import.meta.glob('../../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

// --- Override map for newly saved assets ---
const imageOverrides = ref({})

// --- Asset lookup ---
function getImageUrl(nodeId) {
  if (imageOverrides.value[nodeId]) return imageOverrides.value[nodeId]
  const path = `../../assets/battle_backgrounds/${nodeId}.png`
  return bgImages[path] || null
}

// --- Default node pseudo-object ---
const defaultNode = { id: 'default', name: 'Default Background', region: 'Default' }

// --- Build region groups from questNodes + regions ---
const regionGroups = computed(() => {
  const groups = []

  // Default section first
  groups.push({
    regionName: 'Default',
    nodes: [defaultNode]
  })

  // Each region in order
  for (const region of regions) {
    const regionNodes = Object.values(questNodes)
      .filter(n => n.region === region.name)
      .map(n => ({ id: n.id, name: n.name, region: n.region, type: n.type || null }))

    if (regionNodes.length > 0) {
      groups.push({
        regionName: region.name,
        nodes: regionNodes
      })
    }
  }

  return groups
})

// --- Asset prompts state ---
const assetPrompts = ref({ ...assetPromptsData })

// --- Modal state ---
const selectedNode = ref(null)

function openModal(node) {
  selectedNode.value = node
}

function closeModal() {
  selectedNode.value = null
}

// --- Save handler ---
async function saveImage({ nodeId, dataUrl, prompt }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetPath: `battle_backgrounds/${nodeId}.png`, dataUrl })
    })

    const promptKey = `bg_${nodeId}`
    assetPrompts.value[promptKey] = prompt
    await fetch('/__admin/save-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPrompts.value)
    })

    imageOverrides.value[nodeId] = dataUrl
  } catch (err) {
    alert('Failed to save background: ' + (err.message || err))
  }
}
</script>

<template>
  <div class="asset-viewer-backgrounds">
    <div v-for="group in regionGroups" :key="group.regionName" class="region-group">
      <h3 class="region-header">{{ group.regionName }}</h3>
      <div class="backgrounds-grid">
        <BackgroundAssetCard
          v-for="node in group.nodes"
          :key="node.id"
          :node="node"
          :image-url="getImageUrl(node.id)"
          @select="openModal"
        />
      </div>
    </div>

    <BackgroundAssetModal
      :node="selectedNode"
      :image-url="selectedNode ? getImageUrl(selectedNode.id) : null"
      :saved-prompt="selectedNode ? (assetPrompts[`bg_${selectedNode.id}`] || null) : null"
      @close="closeModal"
      @save-image="saveImage"
    />
  </div>
</template>

<style scoped>
.asset-viewer-backgrounds {
  padding: 16px;
}

.region-group {
  margin-bottom: 32px;
}

.region-header {
  font-size: 16px;
  font-weight: 600;
  color: #d1d5db;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #374151;
}

.backgrounds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
}
</style>
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/screens/admin/AssetViewerBackgrounds.vue
git commit -m "feat(admin): add AssetViewerBackgrounds region-grouped screen"
```

---

### Task 4: Wire into AdminScreen

**Files:**
- Modify: `src/screens/AdminScreen.vue`

**Step 1: Add the Backgrounds section**

Add import at top of script:
```js
import AssetViewerBackgrounds from './admin/AssetViewerBackgrounds.vue'
```

Add to sections array:
```js
const sections = [
  { id: 'heroes', label: 'Heroes' },
  { id: 'enemies', label: 'Enemies' },
  { id: 'backgrounds', label: 'Backgrounds' }
]
```

Add to template content-body:
```html
<AssetViewerBackgrounds v-else-if="activeSection === 'backgrounds'" />
```

**Step 2: Verify build**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -5`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add src/screens/AdminScreen.vue
git commit -m "feat(admin): wire Backgrounds section into AdminScreen sidebar"
```

---

### Task 5: Smoke test

**Step 1: Verify build passes**

Run: `cd /home/deltran/code/dorf && npx vite build 2>&1 | tail -10`
Expected: Build succeeds, no warnings about missing imports or broken references

**Step 2: Verify no broken imports**

Run: `cd /home/deltran/code/dorf && grep -r "BackgroundAsset" src/ --include="*.vue" --include="*.js"`
Expected: References only in the new files and AdminScreen

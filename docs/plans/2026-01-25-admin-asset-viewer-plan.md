# Admin Asset Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing admin interface with a hero asset viewer that shows all heroes as rarity-styled cards, displays image status, and integrates PixelLab for image generation and portrait auto-cropping.

**Architecture:** Vue 3 SFC components in the existing admin screen structure. Cards read hero data from `heroTemplates` and detect images via Vite glob imports. PixelLab calls happen browser-side using `VITE_PIXELLAB_TOKEN`. File saving uses new routes on the existing Vite dev server plugin.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite dev server middleware, PixelLab v2 REST API, HTML Canvas for portrait cropping.

**Design doc:** `docs/plans/2026-01-25-admin-asset-viewer-design.md`

---

### Task 1: Add asset-saving routes to the Vite dev server plugin

The existing `vite-plugin-admin.js` handles CRUD for data files. We need two new routes for saving binary assets and the prompts JSON file.

**Files:**
- Modify: `vite-plugin-admin.js`
- Create: `src/data/assetPrompts.json`

**Step 1: Create the empty prompts JSON file**

Create `src/data/assetPrompts.json`:
```json
{}
```

**Step 2: Add save-asset and save-prompts routes**

At the end of the `configureServer(server)` function in `vite-plugin-admin.js`, before the closing braces, add two new middleware handlers:

```js
// POST /__admin/save-asset — save binary image to src/assets/
server.middlewares.use(async (req, res, next) => {
  if (req.method === 'POST' && req.url === '/__admin/save-asset') {
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    try {
      const { assetPath, dataUrl } = JSON.parse(body)

      // Validate path stays within src/assets
      const resolved = path.resolve(process.cwd(), 'src/assets', assetPath)
      if (!resolved.startsWith(path.resolve(process.cwd(), 'src/assets'))) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Invalid asset path' }))
        return
      }

      // Extract base64 data from data URL
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      // Ensure directory exists
      fs.mkdirSync(path.dirname(resolved), { recursive: true })
      fs.writeFileSync(resolved, buffer)

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: true, path: resolved }))
    } catch (e) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }
  next()
})

// POST /__admin/save-prompts — update assetPrompts.json
server.middlewares.use(async (req, res, next) => {
  if (req.method === 'POST' && req.url === '/__admin/save-prompts') {
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    try {
      const prompts = JSON.parse(body)
      const promptsPath = path.resolve(process.cwd(), 'src/data/assetPrompts.json')
      fs.writeFileSync(promptsPath, JSON.stringify(prompts, null, 2) + '\n', 'utf-8')

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: true }))
    } catch (e) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: e.message }))
    }
    return
  }
  next()
})
```

**Step 3: Verify manually**

Run: `npm run dev`
Test with curl:
```bash
curl -X POST http://localhost:5173/__admin/save-prompts \
  -H 'Content-Type: application/json' \
  -d '{"test_hero": "Test prompt"}'
```
Expected: `{"success":true}` and `src/data/assetPrompts.json` contains the test data.

Clean up test data after verification.

**Step 4: Commit**

```bash
git add vite-plugin-admin.js src/data/assetPrompts.json
git commit -m "feat(admin): add asset save and prompts save routes to vite plugin"
```

---

### Task 2: Create the browser-side PixelLab client

A slim browser-side module that calls the PixelLab v2 API directly. Mirrors the Node script logic but uses browser `fetch` and reads the token from a Vite env var.

**Files:**
- Create: `src/lib/pixellab.js`

**Step 1: Write the browser PixelLab client**

Create `src/lib/pixellab.js`:
```js
const API_BASE = 'https://api.pixellab.ai/v2'

function getToken() {
  const token = import.meta.env.VITE_PIXELLAB_TOKEN
  if (!token) {
    throw new Error('VITE_PIXELLAB_TOKEN is not set in .env')
  }
  return token
}

export async function createMapObject({ prompt, width, height }) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/map-objects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: prompt,
      image_size: { width, height }
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PixelLab API error: ${response.status} - ${text}`)
  }

  const data = await response.json()
  if (data.success === false) {
    throw new Error(`PixelLab API error: ${data.error || JSON.stringify(data)}`)
  }
  return data.data || data
}

export async function getBackgroundJob(jobId) {
  const token = getToken()

  const response = await fetch(`${API_BASE}/background-jobs/${jobId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PixelLab API error: ${response.status} - ${text}`)
  }

  const data = await response.json()
  if (data.success === false) {
    throw new Error(`PixelLab API error: ${data.error || JSON.stringify(data)}`)
  }
  return data.data || data
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function generateHeroImage({ prompt, width = 64, height = 64 }) {
  const result = await createMapObject({ prompt, width, height })

  // Direct base64 response
  if (result.image) {
    return `data:image/png;base64,${result.image}`
  }

  // Poll for background job completion
  const jobId = result.background_job_id
  if (!jobId) {
    throw new Error('Unexpected response: no image or background_job_id')
  }

  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(10000)
    const job = await getBackgroundJob(jobId)

    if (job.status === 'failed') {
      throw new Error(`Generation failed: ${job.error || 'Unknown error'}`)
    }

    if (job.status === 'completed') {
      if (job.last_response?.image?.base64) {
        return `data:image/png;base64,${job.last_response.image.base64}`
      }
      if (job.image?.base64) {
        return `data:image/png;base64,${job.image.base64}`
      }
      if (job.image && typeof job.image === 'string') {
        return `data:image/png;base64,${job.image}`
      }
      throw new Error('Completed but no image in response')
    }
  }

  throw new Error('Generation timed out')
}
```

**Step 2: Ensure `.env` has the token variable**

Verify `.env` exists and add `VITE_PIXELLAB_TOKEN=<token>` if not present. This file is already gitignored.

**Step 3: Commit**

```bash
git add src/lib/pixellab.js
git commit -m "feat(admin): add browser-side PixelLab API client"
```

---

### Task 3: Create the HeroAssetCard component

A card component that displays a hero's image (or placeholder), name, class/role, and asset status indicators. Uses the game's rarity gradient styling.

**Files:**
- Create: `src/components/admin/HeroAssetCard.vue`

**Step 1: Write the component**

Create `src/components/admin/HeroAssetCard.vue`:
```vue
<script setup>
import { computed } from 'vue'
import { classes } from '../../data/classes.js'

const props = defineProps({
  hero: { type: Object, required: true },
  imageUrl: { type: String, default: null },
  gifUrl: { type: String, default: null },
  portraitUrl: { type: String, default: null }
})

const emit = defineEmits(['select'])

const classData = computed(() => classes[props.hero.classId])

const roleIcons = {
  tank: '\u{1F6E1}\uFE0F',
  dps: '\u2694\uFE0F',
  healer: '\u{1F49A}',
  support: '\u2728'
}

const roleLabel = computed(() => {
  const cls = classData.value
  if (!cls) return ''
  return `${cls.title} / ${cls.role.charAt(0).toUpperCase() + cls.role.slice(1)}`
})

const roleIcon = computed(() => {
  return roleIcons[classData.value?.role] || ''
})

const hasPng = computed(() => !!props.imageUrl)
const hasGif = computed(() => !!props.gifUrl)
const hasPortrait = computed(() => !!props.portraitUrl)
const hasMissing = computed(() => !hasPng.value)

const rarityClass = computed(() => `rarity-${props.hero.rarity}`)
</script>

<template>
  <div
    :class="['hero-asset-card', rarityClass, { 'missing-assets': hasMissing }]"
    @click="emit('select', hero)"
  >
    <div class="image-area">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="hero.name"
        class="hero-image"
      />
      <div v-else class="placeholder">?</div>
    </div>

    <div class="hero-name">{{ hero.name }}</div>

    <div class="class-badge">
      <span class="role-icon">{{ roleIcon }}</span>
      {{ roleLabel }}
    </div>

    <div class="status-row">
      <span :class="['status-icon', hasPng ? 'has' : 'missing']" title="PNG">PNG</span>
      <span :class="['status-icon', hasGif ? 'has' : 'missing']" title="GIF">GIF</span>
      <span :class="['status-icon', hasPortrait ? 'has' : 'missing']" title="Portrait">PRT</span>
    </div>
  </div>
</template>

<style scoped>
.hero-asset-card {
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  border: 1px solid #374151;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hero-asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.hero-asset-card.missing-assets {
  border-style: dashed;
  opacity: 0.7;
}

.rarity-1 { border-color: #9ca3af; background: linear-gradient(135deg, #1f2937 0%, #262d36 100%); }
.rarity-2 { border-color: #22c55e; background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%); }
.rarity-3 { border-color: #3b82f6; background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%); }
.rarity-4 { border-color: #a855f7; background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%); }
.rarity-5 { border-color: #f59e0b; background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%); }

.image-area {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.hero-image {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
}

.placeholder {
  font-size: 28px;
  color: #4b5563;
  user-select: none;
}

.hero-name {
  font-size: 13px;
  font-weight: 600;
  color: #f3f4f6;
  text-align: center;
  line-height: 1.2;
}

.class-badge {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}

.role-icon {
  font-size: 11px;
}

.status-row {
  display: flex;
  gap: 6px;
}

.status-icon {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
}

.status-icon.has {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.15);
}

.status-icon.missing {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/admin/HeroAssetCard.vue
git commit -m "feat(admin): create HeroAssetCard component with rarity styling"
```

---

### Task 4: Create the HeroAssetModal component

The detail modal with image preview (left), prompt editing and generation controls (right), and portrait auto-crop support.

**Files:**
- Create: `src/components/admin/HeroAssetModal.vue`

**Step 1: Write the component**

Create `src/components/admin/HeroAssetModal.vue`:
```vue
<script setup>
import { ref, computed, watch } from 'vue'
import { classes } from '../../data/classes.js'
import { generateHeroImage } from '../../lib/pixellab.js'

const props = defineProps({
  hero: { type: Object, default: null },
  imageUrl: { type: String, default: null },
  gifUrl: { type: String, default: null },
  portraitUrl: { type: String, default: null },
  savedPrompt: { type: String, default: null }
})

const emit = defineEmits(['close', 'save-image', 'save-portrait', 'save-prompt'])

const weaponMap = {
  berserker: 'battle axe',
  ranger: 'bow',
  knight: 'sword and shield',
  paladin: 'holy sword',
  mage: 'magical energy',
  cleric: 'holy staff',
  druid: 'nature staff',
  bard: 'lute',
  alchemist: 'potions'
}

function buildDefaultPrompt(hero) {
  const cls = classes[hero.classId]
  const weapon = weaponMap[hero.classId] || 'weapon'
  return `${hero.name}. ${cls?.title || hero.classId}. Holding a ${weapon}. High fantasy.`
}

const prompt = ref('')
const generating = ref(false)
const generationError = ref(null)
const previewDataUrl = ref(null)
const portraitPreview = ref(null)
const showPortraitConfirm = ref(false)

watch(() => props.hero, (hero) => {
  if (hero) {
    prompt.value = props.savedPrompt || buildDefaultPrompt(hero)
    previewDataUrl.value = null
    generationError.value = null
    generating.value = false
    portraitPreview.value = null
    showPortraitConfirm.value = false
  }
}, { immediate: true })

const canCreatePortrait = computed(() => {
  return props.imageUrl && !props.portraitUrl
})

async function generate() {
  generating.value = true
  generationError.value = null
  previewDataUrl.value = null

  try {
    const dataUrl = await generateHeroImage({
      prompt: prompt.value,
      width: 64,
      height: 64
    })
    previewDataUrl.value = dataUrl
  } catch (e) {
    generationError.value = e.message
  } finally {
    generating.value = false
  }
}

function saveGenerated() {
  emit('save-image', {
    heroId: props.hero.id,
    dataUrl: previewDataUrl.value,
    prompt: prompt.value
  })
  previewDataUrl.value = null
}

function tryAgain() {
  previewDataUrl.value = null
  generationError.value = null
}

function createPortrait() {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    // Crop: centered horizontally (x = (width - 32) / 2), top-aligned (y = 0)
    const sx = Math.floor((img.width - 32) / 2)
    ctx.drawImage(img, sx, 0, 32, 32, 0, 0, 32, 32)
    portraitPreview.value = canvas.toDataURL('image/png')
    showPortraitConfirm.value = true
  }
  img.src = props.imageUrl
}

function confirmPortrait() {
  emit('save-portrait', {
    heroId: props.hero.id,
    dataUrl: portraitPreview.value
  })
  showPortraitConfirm.value = false
  portraitPreview.value = null
}

function cancelPortrait() {
  showPortraitConfirm.value = false
  portraitPreview.value = null
}

function onBackdropClick(e) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <div v-if="hero" class="modal-backdrop" @click="onBackdropClick">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ hero.name }}</h2>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Left column: Image preview -->
        <div class="preview-column">
          <div class="main-preview">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              :alt="hero.name"
              class="preview-image"
            />
            <div v-else class="preview-placeholder">No image generated</div>
          </div>

          <div class="variant-row">
            <div class="variant">
              <div class="variant-label">GIF</div>
              <img v-if="gifUrl" :src="gifUrl" class="variant-image" />
              <div v-else class="variant-empty">--</div>
            </div>
            <div class="variant">
              <div class="variant-label">Portrait</div>
              <img v-if="portraitUrl" :src="portraitUrl" class="variant-image variant-portrait" />
              <div v-else class="variant-empty">--</div>
            </div>
          </div>

          <button
            v-if="canCreatePortrait"
            class="portrait-btn"
            @click="createPortrait"
          >
            Create Portrait
          </button>

          <!-- Portrait crop confirmation -->
          <div v-if="showPortraitConfirm" class="portrait-confirm">
            <div class="portrait-confirm-label">Portrait preview:</div>
            <img :src="portraitPreview" class="portrait-confirm-image" />
            <div class="portrait-confirm-actions">
              <button class="btn btn-save" @click="confirmPortrait">Looks good</button>
              <button class="btn btn-cancel" @click="cancelPortrait">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Right column: Generation -->
        <div class="generation-column">
          <label class="prompt-label">Prompt</label>
          <textarea
            v-model="prompt"
            class="prompt-textarea"
            rows="4"
            :disabled="generating"
          />

          <button
            class="btn btn-generate"
            :disabled="generating || !prompt.trim()"
            @click="generate"
          >
            {{ generating ? 'Generating...' : 'Generate' }}
          </button>

          <div v-if="generationError" class="error-msg">
            {{ generationError }}
          </div>

          <!-- Generation preview -->
          <div v-if="previewDataUrl" class="generation-preview">
            <div class="preview-compare">
              <div v-if="imageUrl" class="compare-item">
                <div class="compare-label">Current</div>
                <img :src="imageUrl" class="compare-image" />
              </div>
              <div class="compare-item">
                <div class="compare-label">Generated</div>
                <img :src="previewDataUrl" class="compare-image" />
              </div>
            </div>
            <div class="preview-actions">
              <button class="btn btn-save" @click="saveGenerated">Save</button>
              <button class="btn btn-cancel" @click="tryAgain">Try Again</button>
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
  width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #f3f4f6;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn:hover {
  color: #f3f4f6;
}

.modal-body {
  display: flex;
  gap: 24px;
  padding: 20px;
}

.preview-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.main-preview {
  width: 192px;
  height: 192px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.preview-image {
  width: 192px;
  height: 192px;
  image-rendering: pixelated;
}

.preview-placeholder {
  color: #4b5563;
  font-size: 14px;
}

.variant-row {
  display: flex;
  gap: 16px;
}

.variant {
  text-align: center;
}

.variant-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.variant-image {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.variant-portrait {
  width: 32px;
  height: 32px;
}

.variant-empty {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.portrait-btn {
  padding: 6px 14px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 13px;
  cursor: pointer;
}

.portrait-btn:hover {
  background: #4b5563;
}

.portrait-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.portrait-confirm-label {
  font-size: 12px;
  color: #9ca3af;
}

.portrait-confirm-image {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.portrait-confirm-actions {
  display: flex;
  gap: 8px;
}

.generation-column {
  flex: 1;
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

.btn-generate {
  background: #3b82f6;
  color: white;
}

.btn-generate:hover:not(:disabled) {
  background: #2563eb;
}

.btn-save {
  background: #22c55e;
  color: white;
}

.btn-save:hover {
  background: #16a34a;
}

.btn-cancel {
  background: #374151;
  color: #d1d5db;
}

.btn-cancel:hover {
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
}

.compare-item {
  text-align: center;
}

.compare-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.compare-image {
  width: 128px;
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

**Step 2: Commit**

```bash
git add src/components/admin/HeroAssetModal.vue
git commit -m "feat(admin): create HeroAssetModal with generation and portrait crop"
```

---

### Task 5: Create the AssetViewerHeroes screen

The grid view that reads all heroes from `heroTemplates`, detects which images exist via Vite glob imports, and renders HeroAssetCard components. Manages the modal and handles save operations.

**Files:**
- Create: `src/screens/admin/AssetViewerHeroes.vue`

**Step 1: Write the component**

Create `src/screens/admin/AssetViewerHeroes.vue`:
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { heroTemplates } from '../../data/heroTemplates.js'
import assetPromptsData from '../../data/assetPrompts.json'
import HeroAssetCard from '../../components/admin/HeroAssetCard.vue'
import HeroAssetModal from '../../components/admin/HeroAssetModal.vue'

// Glob import all hero assets
const heroImages = import.meta.glob('../../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../../assets/heroes/*.gif', { eager: true, import: 'default' })

function getImageUrl(heroId) {
  const path = `../../assets/heroes/${heroId}.png`
  return heroImages[path] || null
}

function getGifUrl(heroId) {
  const path = `../../assets/heroes/${heroId}.gif`
  return heroGifs[path] || null
}

function getPortraitUrl(heroId) {
  const path = `../../assets/heroes/${heroId}_portrait.png`
  return heroImages[path] || null
}

// Hero list sorted by rarity desc, then name
const heroes = computed(() => {
  return Object.values(heroTemplates)
    .sort((a, b) => {
      if (a.rarity !== b.rarity) return b.rarity - a.rarity
      return a.name.localeCompare(b.name)
    })
})

// Prompt storage (reactive copy)
const assetPrompts = ref({ ...assetPromptsData })

// Modal state
const selectedHero = ref(null)

function openModal(hero) {
  selectedHero.value = hero
}

function closeModal() {
  selectedHero.value = null
}

// Save generated image
async function saveImage({ heroId, dataUrl, prompt }) {
  try {
    // Save image file
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetPath: `heroes/${heroId}.png`,
        dataUrl
      })
    })

    // Update and save prompt
    assetPrompts.value[heroId] = prompt
    await fetch('/__admin/save-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetPrompts.value)
    })

    // Reload page to pick up new asset via Vite glob
    window.location.reload()
  } catch (e) {
    alert('Failed to save: ' + e.message)
  }
}

// Save cropped portrait
async function savePortrait({ heroId, dataUrl }) {
  try {
    await fetch('/__admin/save-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetPath: `heroes/${heroId}_portrait.png`,
        dataUrl
      })
    })

    window.location.reload()
  } catch (e) {
    alert('Failed to save portrait: ' + e.message)
  }
}
</script>

<template>
  <div class="asset-viewer-heroes">
    <div class="hero-grid">
      <HeroAssetCard
        v-for="hero in heroes"
        :key="hero.id"
        :hero="hero"
        :image-url="getImageUrl(hero.id)"
        :gif-url="getGifUrl(hero.id)"
        :portrait-url="getPortraitUrl(hero.id)"
        @select="openModal"
      />
    </div>

    <HeroAssetModal
      :hero="selectedHero"
      :image-url="selectedHero ? getImageUrl(selectedHero.id) : null"
      :gif-url="selectedHero ? getGifUrl(selectedHero.id) : null"
      :portrait-url="selectedHero ? getPortraitUrl(selectedHero.id) : null"
      :saved-prompt="selectedHero ? assetPrompts[selectedHero.id] : null"
      @close="closeModal"
      @save-image="saveImage"
      @save-portrait="savePortrait"
    />
  </div>
</template>

<style scoped>
.asset-viewer-heroes {
  height: 100%;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}
</style>
```

**Step 2: Commit**

```bash
git add src/screens/admin/AssetViewerHeroes.vue
git commit -m "feat(admin): create AssetViewerHeroes grid with save handlers"
```

---

### Task 6: Rewire AdminScreen and clean up old admin files

Replace the AdminScreen sidebar and content with the new AssetViewerHeroes. Remove all old admin components and composables.

**Files:**
- Modify: `src/screens/AdminScreen.vue`
- Delete: `src/screens/admin/StatusEffectsAdmin.vue`
- Delete: `src/screens/admin/ClassesAdmin.vue`
- Delete: `src/screens/admin/ItemsAdmin.vue`
- Delete: `src/screens/admin/HeroesAdmin.vue`
- Delete: `src/screens/admin/EnemiesAdmin.vue`
- Delete: `src/screens/admin/QuestsAdmin.vue`
- Delete: `src/components/admin/AdminListPanel.vue`
- Delete: `src/components/admin/AdminEditPanel.vue`
- Delete: `src/composables/useAdminApi.js`

**Step 1: Rewrite AdminScreen.vue**

Replace the entire contents of `src/screens/AdminScreen.vue`:
```vue
<script setup>
import { ref } from 'vue'
import AssetViewerHeroes from './admin/AssetViewerHeroes.vue'

const activeSection = ref('heroes')

const sections = [
  { id: 'heroes', label: 'Heroes' }
]

const emit = defineEmits(['navigate'])

function exitAdmin() {
  emit('navigate', 'home')
}
</script>

<template>
  <div class="admin-screen">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Assets</h2>
        <button class="exit-btn" @click="exitAdmin">Exit</button>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="['nav-item', { active: activeSection === section.id }]"
          @click="activeSection = section.id"
        >
          {{ section.label }}
        </button>
      </nav>
    </aside>

    <main class="content">
      <div class="content-header">
        <h1>{{ sections.find(s => s.id === activeSection)?.label }}</h1>
      </div>

      <div class="content-body">
        <AssetViewerHeroes v-if="activeSection === 'heroes'" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-screen {
  display: flex;
  min-height: 100vh;
  background: #111827;
}

.sidebar {
  width: 200px;
  background: #1f2937;
  border-right: 1px solid #374151;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #f3f4f6;
}

.exit-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
}

.exit-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
}

.nav-item {
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9ca3af;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.nav-item:hover {
  background: #374151;
  color: #f3f4f6;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: none;
}

.content-header {
  padding: 16px 24px;
  border-bottom: 1px solid #374151;
}

.content-header h1 {
  margin: 0;
  font-size: 24px;
  color: #f3f4f6;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
```

**Step 2: Delete old admin files**

```bash
rm src/screens/admin/StatusEffectsAdmin.vue
rm src/screens/admin/ClassesAdmin.vue
rm src/screens/admin/ItemsAdmin.vue
rm src/screens/admin/HeroesAdmin.vue
rm src/screens/admin/EnemiesAdmin.vue
rm src/screens/admin/QuestsAdmin.vue
rm src/components/admin/AdminListPanel.vue
rm src/components/admin/AdminEditPanel.vue
rm src/composables/useAdminApi.js
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin): rewire AdminScreen to asset viewer, remove old admin components"
```

---

### Task 7: Smoke test and fix

Verify the full flow works end-to-end.

**Step 1: Start the dev server**

Run: `npm run dev`

**Step 2: Open the admin screen**

Navigate to the app in the browser, press `Ctrl+Shift+A`.

**Step 3: Verify the hero grid**

- All heroes from `heroTemplates` should appear as cards
- Cards should show correct rarity gradients and borders
- Status icons should correctly reflect which assets exist
- Heroes should be sorted 5-star first

**Step 4: Verify the modal**

- Click a hero card — modal should open
- Prompt textarea should show the default template prompt
- GIF and portrait thumbnails should show correctly (or "--" if missing)
- "Create Portrait" button should appear for heroes with PNG but no portrait
- Close button and backdrop click should dismiss the modal

**Step 5: Test portrait cropping**

- Click a hero that has a PNG but no portrait
- Click "Create Portrait"
- Verify the 32x32 preview appears
- Click "Looks good"
- Verify the page reloads and the portrait now shows

**Step 6: Test PixelLab generation (if token is available)**

- Open modal for any hero
- Edit the prompt if desired
- Click "Generate"
- Wait for the image to appear in the preview area
- Verify "Current" vs "Generated" comparison shows (if hero already has an image)
- Click "Save" and verify page reloads with new image

**Step 7: Fix any issues found**

Address any rendering, saving, or API issues discovered during testing.

**Step 8: Commit any fixes**

```bash
git add -A
git commit -m "fix(admin): address smoke test issues in asset viewer"
```

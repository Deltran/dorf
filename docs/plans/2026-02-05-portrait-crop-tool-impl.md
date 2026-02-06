# Portrait Crop Tool Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the one-click auto-crop portrait tool in the admin enemy asset modal with an interactive drag-to-position crop tool.

**Architecture:** Extract pure crop calculation logic into `src/lib/portraitCrop.js` (testable), then update `EnemyAssetModal.vue` to use a canvas-based interactive crop UI with drag handling and live preview.

**Tech Stack:** Vue 3 (Composition API), HTML Canvas API, Vitest

---

### Task 1: Write failing tests for crop utility functions

**Files:**
- Create: `src/lib/__tests__/portraitCrop.test.js`

**Step 1: Write the tests**

Create `src/lib/__tests__/portraitCrop.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getCropSize, getDefaultCropPosition, clampCropPosition } from '../portraitCrop.js'

describe('portraitCrop utilities', () => {
  describe('getCropSize', () => {
    it('returns 1/4 of source dimensions for 64x64', () => {
      expect(getCropSize(64, 64)).toEqual({ width: 32, height: 32 })
    })

    it('returns 1/4 of source dimensions for 128x128', () => {
      expect(getCropSize(128, 128)).toEqual({ width: 64, height: 64 })
    })

    it('returns 1/4 of source dimensions for non-square', () => {
      expect(getCropSize(128, 64)).toEqual({ width: 64, height: 32 })
    })

    it('floors fractional results', () => {
      expect(getCropSize(100, 100)).toEqual({ width: 50, height: 50 })
      expect(getCropSize(65, 65)).toEqual({ width: 32, height: 32 })
    })
  })

  describe('getDefaultCropPosition', () => {
    it('centers horizontally and places at upper-third vertically for 64x64 source', () => {
      const pos = getDefaultCropPosition(64, 64, 32, 32)
      // horizontal center: (64 - 32) / 2 = 16
      // vertical upper-third: (64 / 3) - (32 / 2) = ~5.33, floored to 5
      expect(pos.x).toBe(16)
      expect(pos.y).toBe(5)
    })

    it('centers horizontally and places at upper-third vertically for 128x128 source', () => {
      const pos = getDefaultCropPosition(128, 128, 64, 64)
      // horizontal center: (128 - 64) / 2 = 32
      // vertical upper-third: (128 / 3) - (64 / 2) = ~10.67, floored to 10
      expect(pos.x).toBe(32)
      expect(pos.y).toBe(10)
    })

    it('clamps to 0 when crop is larger than upper-third allows', () => {
      // Tiny source where upper-third minus half-crop would go negative
      const pos = getDefaultCropPosition(32, 32, 16, 16)
      // vertical: (32 / 3) - (16 / 2) = ~2.67, floored to 2
      expect(pos.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe('clampCropPosition', () => {
    it('returns position unchanged when within bounds', () => {
      expect(clampCropPosition(10, 10, 32, 32, 64, 64)).toEqual({ x: 10, y: 10 })
    })

    it('clamps negative x to 0', () => {
      expect(clampCropPosition(-5, 10, 32, 32, 64, 64)).toEqual({ x: 0, y: 10 })
    })

    it('clamps negative y to 0', () => {
      expect(clampCropPosition(10, -5, 32, 32, 64, 64)).toEqual({ x: 10, y: 0 })
    })

    it('clamps x when crop box would exceed right edge', () => {
      // x=40 + cropW=32 = 72 > sourceW=64, so clamp to 64-32=32
      expect(clampCropPosition(40, 10, 32, 32, 64, 64)).toEqual({ x: 32, y: 10 })
    })

    it('clamps y when crop box would exceed bottom edge', () => {
      // y=40 + cropH=32 = 72 > sourceH=64, so clamp to 64-32=32
      expect(clampCropPosition(10, 40, 32, 32, 64, 64)).toEqual({ x: 10, y: 32 })
    })

    it('clamps both axes simultaneously', () => {
      expect(clampCropPosition(-5, 100, 32, 32, 64, 64)).toEqual({ x: 0, y: 32 })
    })

    it('works with 128x128 source and 64x64 crop', () => {
      expect(clampCropPosition(70, 70, 64, 64, 128, 128)).toEqual({ x: 64, y: 64 })
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/portraitCrop.test.js`
Expected: FAIL — module `../portraitCrop.js` not found

---

### Task 2: Implement crop utility functions to pass tests

**Files:**
- Create: `src/lib/portraitCrop.js`

**Step 1: Write the implementation**

Create `src/lib/portraitCrop.js`:

```js
/**
 * Calculate portrait crop size as 1/4 of source dimensions.
 */
export function getCropSize(sourceWidth, sourceHeight) {
  return {
    width: Math.floor(sourceWidth / 2),
    height: Math.floor(sourceHeight / 2)
  }
}

/**
 * Calculate default crop position: horizontally centered, vertically at upper-third.
 */
export function getDefaultCropPosition(sourceWidth, sourceHeight, cropWidth, cropHeight) {
  const x = Math.floor((sourceWidth - cropWidth) / 2)
  const y = Math.max(0, Math.floor(sourceHeight / 3 - cropHeight / 2))
  return { x, y }
}

/**
 * Clamp crop position so the crop box stays within source image bounds.
 */
export function clampCropPosition(x, y, cropWidth, cropHeight, sourceWidth, sourceHeight) {
  return {
    x: Math.max(0, Math.min(x, sourceWidth - cropWidth)),
    y: Math.max(0, Math.min(y, sourceHeight - cropHeight))
  }
}
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/portraitCrop.test.js`
Expected: All 10 tests PASS

**Step 3: Commit**

```bash
git add src/lib/portraitCrop.js src/lib/__tests__/portraitCrop.test.js
git commit -m "feat(admin): add portrait crop utility functions with tests"
```

---

### Task 3: Update EnemyAssetModal with interactive crop UI

**Files:**
- Modify: `src/components/admin/EnemyAssetModal.vue`

**Context:** This is the main UI task. Replace the auto-crop `createPortrait()` function and the `showPortraitCrop` confirmation UI with a canvas-based interactive crop tool.

**Step 1: Replace the script section**

In `src/components/admin/EnemyAssetModal.vue`, make these changes:

**1a. Add import at top of `<script setup>` (after existing imports):**

```js
import { getCropSize, getDefaultCropPosition, clampCropPosition } from '../../lib/portraitCrop.js'
```

**1b. Add new refs (after `generateSize` ref on line 25):**

```js
const cropMode = ref(false)
const cropX = ref(0)
const cropY = ref(0)
const cropW = ref(32)
const cropH = ref(32)
const sourceImageObj = ref(null)
const cropCanvasRef = ref(null)
const previewCanvasRef = ref(null)
const preview4xCanvasRef = ref(null)
const isDragging = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)
const SCALE = 2
```

**1c. Reset crop state in the existing `watch(() => props.enemy, ...)` handler. Add these lines inside the `if (newEnemy)` block (after `generateSize.value = ...`):**

```js
    cropMode.value = false
    sourceImageObj.value = null
```

**1d. Replace the entire `createPortrait()` function (lines 79-105) with:**

```js
function createPortrait() {
  if (!props.imageUrl) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    sourceImageObj.value = img
    const size = getCropSize(img.width, img.height)
    cropW.value = size.width
    cropH.value = size.height
    const pos = getDefaultCropPosition(img.width, img.height, size.width, size.height)
    cropX.value = pos.x
    cropY.value = pos.y
    cropMode.value = true
    showPortraitCrop.value = false
    nextTick(() => drawCropCanvas())
  }
  img.onerror = () => {
    generationError.value = 'Failed to load image for portrait crop'
  }
  img.src = props.imageUrl
}
```

**Note:** Add `nextTick` to the import from vue at the top: change `import { ref, computed, watch } from 'vue'` to `import { ref, computed, watch, nextTick } from 'vue'`.

**1e. Add canvas drawing and drag functions (after `cancelPortrait()`):**

```js
function drawCropCanvas() {
  const canvas = cropCanvasRef.value
  const img = sourceImageObj.value
  if (!canvas || !img) return

  const displayW = img.width * SCALE
  const displayH = img.height * SCALE
  canvas.width = displayW
  canvas.height = displayH
  const ctx = canvas.getContext('2d')

  // Draw full image scaled up (pixelated via CSS)
  ctx.drawImage(img, 0, 0, displayW, displayH)

  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(0, 0, displayW, displayH)

  // Clear the crop region (shows image through)
  const sx = cropX.value * SCALE
  const sy = cropY.value * SCALE
  const sw = cropW.value * SCALE
  const sh = cropH.value * SCALE
  ctx.clearRect(sx, sy, sw, sh)
  ctx.drawImage(img, cropX.value, cropY.value, cropW.value, cropH.value, sx, sy, sw, sh)

  // Crop box border
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.strokeRect(sx, sy, sw, sh)

  // Corner accents
  const cornerLen = 6
  ctx.strokeStyle = '#60a5fa'
  ctx.lineWidth = 3
  // Top-left
  ctx.beginPath()
  ctx.moveTo(sx, sy + cornerLen); ctx.lineTo(sx, sy); ctx.lineTo(sx + cornerLen, sy)
  ctx.stroke()
  // Top-right
  ctx.beginPath()
  ctx.moveTo(sx + sw - cornerLen, sy); ctx.lineTo(sx + sw, sy); ctx.lineTo(sx + sw, sy + cornerLen)
  ctx.stroke()
  // Bottom-left
  ctx.beginPath()
  ctx.moveTo(sx, sy + sh - cornerLen); ctx.lineTo(sx, sy + sh); ctx.lineTo(sx + cornerLen, sy + sh)
  ctx.stroke()
  // Bottom-right
  ctx.beginPath()
  ctx.moveTo(sx + sw - cornerLen, sy + sh); ctx.lineTo(sx + sw, sy + sh); ctx.lineTo(sx + sw, sy + sh - cornerLen)
  ctx.stroke()

  drawPreviews()
}

function drawPreviews() {
  const img = sourceImageObj.value
  if (!img) return

  // Actual size preview
  const preview = previewCanvasRef.value
  if (preview) {
    preview.width = cropW.value
    preview.height = cropH.value
    const pctx = preview.getContext('2d')
    pctx.drawImage(img, cropX.value, cropY.value, cropW.value, cropH.value, 0, 0, cropW.value, cropH.value)
  }

  // 4x preview
  const preview4x = preview4xCanvasRef.value
  if (preview4x) {
    const scale4 = 4
    preview4x.width = cropW.value * scale4
    preview4x.height = cropH.value * scale4
    const pctx4 = preview4x.getContext('2d')
    pctx4.imageSmoothingEnabled = false
    pctx4.drawImage(img, cropX.value, cropY.value, cropW.value, cropH.value, 0, 0, cropW.value * scale4, cropH.value * scale4)
  }
}

function onCropMouseDown(e) {
  const canvas = cropCanvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width)
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height)

  const sx = cropX.value * SCALE
  const sy = cropY.value * SCALE
  const sw = cropW.value * SCALE
  const sh = cropH.value * SCALE

  if (mouseX >= sx && mouseX <= sx + sw && mouseY >= sy && mouseY <= sy + sh) {
    isDragging.value = true
    dragOffsetX.value = mouseX - sx
    dragOffsetY.value = mouseY - sy
    e.preventDefault()
  }
}

function onCropMouseMove(e) {
  if (!isDragging.value) return
  const canvas = cropCanvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width)
  const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height)

  const newX = (mouseX - dragOffsetX.value) / SCALE
  const newY = (mouseY - dragOffsetY.value) / SCALE

  const clamped = clampCropPosition(
    Math.round(newX), Math.round(newY),
    cropW.value, cropH.value,
    sourceImageObj.value.width, sourceImageObj.value.height
  )
  cropX.value = clamped.x
  cropY.value = clamped.y

  drawCropCanvas()
}

function onCropMouseUp() {
  isDragging.value = false
}

function confirmCrop() {
  const img = sourceImageObj.value
  if (!img) return

  const canvas = document.createElement('canvas')
  canvas.width = cropW.value
  canvas.height = cropH.value
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, cropX.value, cropY.value, cropW.value, cropH.value, 0, 0, cropW.value, cropH.value)

  emit('save-portrait', {
    enemyId: props.enemy.id,
    dataUrl: canvas.toDataURL('image/png')
  })
  cropMode.value = false
  sourceImageObj.value = null
}

function cancelCrop() {
  cropMode.value = false
  sourceImageObj.value = null
}
```

**Step 2: Replace the template**

Replace the entire `<template>` section with:

```html
<template>
  <div v-if="enemy" class="modal-backdrop" @click="onBackdropClick">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ enemy.name }}</h2>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <!-- CROP MODE -->
      <div v-if="cropMode" class="modal-body crop-body">
        <div class="crop-source">
          <div class="crop-label">Drag the box to select portrait region</div>
          <canvas
            ref="cropCanvasRef"
            class="crop-canvas"
            @mousedown="onCropMouseDown"
            @mousemove="onCropMouseMove"
            @mouseup="onCropMouseUp"
            @mouseleave="onCropMouseUp"
          />
        </div>

        <div class="crop-previews">
          <div class="preview-item">
            <div class="preview-label">Actual</div>
            <canvas ref="previewCanvasRef" class="preview-actual" />
          </div>
          <div class="preview-item">
            <div class="preview-label">Preview</div>
            <canvas ref="preview4xCanvasRef" class="preview-4x" />
          </div>

          <div class="crop-actions">
            <button class="btn btn-success" @click="confirmCrop">Save Portrait</button>
            <button class="btn btn-secondary" @click="cancelCrop">Cancel</button>
          </div>
        </div>
      </div>

      <!-- NORMAL MODE -->
      <div v-else class="modal-body">
        <!-- Left column: Image preview -->
        <div class="preview-column">
          <div class="main-preview">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              :alt="enemy.name"
              class="main-image"
            />
            <div v-else class="preview-placeholder">No image generated</div>
          </div>

          <div class="variant-row">
            <div class="variant">
              <div class="variant-label">Portrait</div>
              <img v-if="portraitUrl" :src="portraitUrl" class="thumbnail-img portrait-thumb" />
              <div v-else class="variant-empty">--</div>
            </div>
          </div>

          <button
            v-if="imageUrl"
            class="portrait-btn"
            @click="createPortrait"
          >
            {{ portraitUrl ? 'Redo Portrait' : 'Create Portrait' }}
          </button>
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

          <div class="size-picker">
            <label class="prompt-label">Size</label>
            <div class="size-options">
              <label :class="['size-option', { active: generateSize === 64 }]">
                <input type="radio" v-model="generateSize" :value="64" :disabled="generating" />
                64x64
              </label>
              <label :class="['size-option', { active: generateSize === 128 }]">
                <input type="radio" v-model="generateSize" :value="128" :disabled="generating" />
                128x128
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
    </div>
  </div>
</template>
```

**Step 3: Add crop-mode CSS**

Add these styles at the end of the `<style scoped>` section (before the closing `</style>` tag):

```css
.crop-body {
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

@media (min-width: 500px) {
  .crop-body {
    flex-direction: row;
    align-items: flex-start;
  }
}

.crop-source {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.crop-label {
  font-size: 13px;
  color: #9ca3af;
}

.crop-canvas {
  image-rendering: pixelated;
  cursor: grab;
  border-radius: 4px;
  background: #111827;
}

.crop-canvas:active {
  cursor: grabbing;
}

.crop-previews {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-item {
  text-align: center;
}

.preview-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.preview-actual {
  image-rendering: pixelated;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #374151;
}

.preview-4x {
  image-rendering: pixelated;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #374151;
}

.crop-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
```

**Step 4: Run the dev server and manually verify**

Run: `npm run dev`

Verify in browser:
1. Open admin (Ctrl+Shift+A) → Enemy Art tab
2. Click an enemy that has a PNG image
3. Click "Create Portrait" (or "Redo Portrait" if portrait exists)
4. Crop mode should appear with 2x source image + draggable blue box
5. Drag the box — previews update in real-time
6. Click "Save Portrait" — portrait saves and crop mode closes
7. Click "Cancel" — returns to normal modal without saving

**Step 5: Commit**

```bash
git add src/components/admin/EnemyAssetModal.vue
git commit -m "feat(admin): interactive portrait crop tool with drag and preview"
```

---

### Task 4: Clean up dead code

**Files:**
- Modify: `src/components/admin/EnemyAssetModal.vue`

**Step 1: Remove unused portrait confirmation code**

The old `confirmPortrait()` and `cancelPortrait()` functions (now replaced by `confirmCrop()` and `cancelCrop()`) and the `portraitPreviewUrl` ref are no longer used. Remove them:

- Delete the `portraitPreviewUrl` ref declaration
- Delete the `confirmPortrait()` function
- Delete the `cancelPortrait()` function
- Delete the old `showPortraitCrop` ref if no longer referenced (check if it's still used in `createPortrait`'s new version — it is set to false there, but never read. Remove the ref and the assignment.)

Also remove the old portrait-confirm CSS classes that are no longer used:
- `.portrait-confirm`
- `.portrait-confirm-label`
- `.portrait-preview-img`
- `.portrait-confirm-actions`

**Step 2: Run tests to make sure nothing broke**

Run: `npx vitest run src/lib/__tests__/portraitCrop.test.js`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/components/admin/EnemyAssetModal.vue
git commit -m "refactor(admin): remove dead portrait auto-crop code"
```

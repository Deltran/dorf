<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { generateHeroImage } from '../../lib/pixellab.js'
import { getCropSize, getDefaultCropPosition, clampCropPosition } from '../../lib/portraitCrop.js'

const props = defineProps({
  enemy: { type: Object, default: null },
  imageUrl: { type: String, default: null },
  portraitUrl: { type: String, default: null },
  savedPrompt: { type: String, default: null },
  isGenusLoci: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save-image', 'save-portrait'])

function buildDefaultPrompt(enemy) {
  return `${enemy.name}. Enemy creature. High fantasy.`
}

const prompt = ref('')
const generating = ref(false)
const generationError = ref(null)
const generatedDataUrl = ref(null)
const showPortraitCrop = ref(false)
const portraitPreviewUrl = ref(null)
const generateSize = ref(64)
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

watch(() => props.enemy, (newEnemy) => {
  if (newEnemy) {
    prompt.value = props.savedPrompt || buildDefaultPrompt(newEnemy)
    generatedDataUrl.value = null
    generationError.value = null
    generating.value = false
    showPortraitCrop.value = false
    portraitPreviewUrl.value = null
    generateSize.value = props.isGenusLoci ? 128 : 64
    cropMode.value = false
    sourceImageObj.value = null
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
      width: generateSize.value,
      height: generateSize.value
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
    enemyId: props.enemy.id,
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

function confirmPortrait() {
  emit('save-portrait', {
    enemyId: props.enemy.id,
    dataUrl: portraitPreviewUrl.value
  })
  showPortraitCrop.value = false
  portraitPreviewUrl.value = null
}

function cancelPortrait() {
  showPortraitCrop.value = false
  portraitPreviewUrl.value = null
}

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
</script>

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

.main-image {
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

.thumbnail-img {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.3);
}

.portrait-thumb {
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

.portrait-preview-img {
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

.preview-image {
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
</style>

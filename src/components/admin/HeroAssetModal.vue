<script setup>
import { ref, computed, watch } from 'vue'
import { classes } from '../../data/classes.js'
import { generateHeroImage } from '../../lib/pixellab.js'

const props = defineProps({
  hero: {
    type: Object,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  gifUrl: {
    type: String,
    default: null
  },
  portraitUrl: {
    type: String,
    default: null
  },
  savedPrompt: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'save-image', 'save-portrait'])

// --- Weapon map ---
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

// --- State ---
const prompt = ref('')
const generating = ref(false)
const generationError = ref(null)
const generatedDataUrl = ref(null)

// Portrait crop state
const showPortraitCrop = ref(false)
const portraitPreviewUrl = ref(null)

// --- Computed ---
const isVisible = computed(() => props.hero !== null)

// --- Watch hero changes to reset state ---
watch(
  () => props.hero,
  (newHero) => {
    if (newHero) {
      prompt.value = props.savedPrompt || buildDefaultPrompt(newHero)
    }
    generatedDataUrl.value = null
    generationError.value = null
    generating.value = false
    showPortraitCrop.value = false
    portraitPreviewUrl.value = null
  }
)

// --- Methods ---
function onBackdropClick(event) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

async function generate() {
  if (generating.value) return
  generating.value = true
  generationError.value = null
  generatedDataUrl.value = null

  try {
    const dataUrl = await generateHeroImage({
      prompt: prompt.value,
      width: 64,
      height: 64
    })
    generatedDataUrl.value = dataUrl
  } catch (err) {
    generationError.value = err.message || 'Generation failed'
  } finally {
    generating.value = false
  }
}

function saveGenerated() {
  if (!generatedDataUrl.value || !props.hero) return
  emit('save-image', {
    heroId: props.hero.id,
    dataUrl: generatedDataUrl.value,
    prompt: prompt.value
  })
  generatedDataUrl.value = null
}

function tryAgain() {
  generatedDataUrl.value = null
  generationError.value = null
}

function createPortrait() {
  if (!props.imageUrl) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')

    const sx = Math.floor((img.width - 32) / 2)
    const sy = 0
    ctx.drawImage(img, sx, sy, 32, 32, 0, 0, 32, 32)

    portraitPreviewUrl.value = canvas.toDataURL('image/png')
    showPortraitCrop.value = true
  }
  img.onerror = () => {
    generationError.value = 'Failed to load image for portrait crop'
  }
  img.src = props.imageUrl
}

function confirmPortrait() {
  if (!portraitPreviewUrl.value || !props.hero) return
  emit('save-portrait', {
    heroId: props.hero.id,
    dataUrl: portraitPreviewUrl.value
  })
  showPortraitCrop.value = false
  portraitPreviewUrl.value = null
}

function cancelPortrait() {
  showPortraitCrop.value = false
  portraitPreviewUrl.value = null
}
</script>

<template>
  <div v-if="isVisible" class="modal-backdrop" @click="onBackdropClick">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <h2>{{ hero.name }}</h2>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Left Column: Image Preview -->
        <div class="left-column">
          <div class="main-image-area">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              :alt="hero.name"
              class="main-image"
            />
            <div v-else class="image-placeholder">No image generated</div>
          </div>

          <div class="thumbnails">
            <div class="thumbnail-item">
              <div class="thumbnail-label">GIF</div>
              <div class="thumbnail-box">
                <img v-if="gifUrl" :src="gifUrl" :alt="`${hero.name} GIF`" class="thumbnail-img" />
                <span v-else class="thumbnail-missing">--</span>
              </div>
            </div>
            <div class="thumbnail-item">
              <div class="thumbnail-label">Portrait</div>
              <div class="thumbnail-box">
                <img v-if="portraitUrl" :src="portraitUrl" :alt="`${hero.name} Portrait`" class="thumbnail-img" />
                <span v-else class="thumbnail-missing">--</span>
              </div>
            </div>
          </div>

          <!-- Create Portrait button -->
          <button
            v-if="imageUrl && !portraitUrl"
            class="btn btn-secondary create-portrait-btn"
            @click="createPortrait"
          >
            Create Portrait
          </button>

          <!-- Portrait crop confirmation -->
          <div v-if="showPortraitCrop" class="portrait-crop-section">
            <div class="portrait-preview-label">Portrait Preview</div>
            <div class="portrait-preview-box">
              <img
                :src="portraitPreviewUrl"
                alt="Portrait preview"
                class="portrait-preview-img"
              />
            </div>
            <div class="portrait-crop-actions">
              <button class="btn btn-success" @click="confirmPortrait">Looks good</button>
              <button class="btn btn-secondary" @click="cancelPortrait">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Right Column: Generation -->
        <div class="right-column">
          <label class="prompt-label" for="prompt-textarea">Prompt</label>
          <textarea
            id="prompt-textarea"
            v-model="prompt"
            class="prompt-textarea"
            rows="4"
            spellcheck="false"
          ></textarea>

          <button
            class="btn btn-primary generate-btn"
            :disabled="generating"
            @click="generate"
          >
            {{ generating ? 'Generating...' : 'Generate' }}
          </button>

          <!-- Error message -->
          <div v-if="generationError" class="error-message">{{ generationError }}</div>

          <!-- Preview area (after generation succeeds) -->
          <div v-if="generatedDataUrl" class="preview-area">
            <div class="preview-compare">
              <div class="preview-item">
                <div class="preview-item-label">Current</div>
                <div class="preview-image-box">
                  <img
                    v-if="imageUrl"
                    :src="imageUrl"
                    alt="Current image"
                    class="preview-image"
                  />
                  <span v-else class="preview-no-image">None</span>
                </div>
              </div>
              <div class="preview-item">
                <div class="preview-item-label">Generated</div>
                <div class="preview-image-box">
                  <img
                    :src="generatedDataUrl"
                    alt="Generated image"
                    class="preview-image"
                  />
                </div>
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
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  width: 680px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
  line-height: 1;
}

.close-btn:hover {
  color: #f3f4f6;
}

.modal-body {
  display: flex;
  gap: 24px;
  padding: 20px;
}

/* Left Column */
.left-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.main-image-area {
  width: 192px;
  height: 192px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border-radius: 8px;
  border: 1px solid #374151;
  overflow: hidden;
}

.main-image {
  width: 192px;
  height: 192px;
  object-fit: contain;
  image-rendering: pixelated;
}

.image-placeholder {
  color: #6b7280;
  font-size: 14px;
  text-align: center;
  padding: 16px;
}

.thumbnails {
  display: flex;
  gap: 16px;
}

.thumbnail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.thumbnail-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.thumbnail-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border-radius: 4px;
  border: 1px solid #374151;
  overflow: hidden;
}

.thumbnail-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
}

.thumbnail-missing {
  color: #4b5563;
  font-size: 14px;
}

.create-portrait-btn {
  width: 100%;
  max-width: 192px;
}

.portrait-crop-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #111827;
  border-radius: 8px;
  border: 1px solid #374151;
  width: 100%;
  max-width: 192px;
}

.portrait-preview-label {
  font-size: 12px;
  color: #9ca3af;
}

.portrait-preview-box {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1f2937;
  border-radius: 4px;
  border: 1px solid #374151;
  overflow: hidden;
}

.portrait-preview-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
}

.portrait-crop-actions {
  display: flex;
  gap: 8px;
}

/* Right Column */
.right-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.prompt-label {
  font-size: 14px;
  font-weight: 600;
  color: #f3f4f6;
}

.prompt-textarea {
  width: 100%;
  padding: 10px 12px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #f3f4f6;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}

.prompt-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.generate-btn {
  align-self: flex-start;
}

.error-message {
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 13px;
}

.preview-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #111827;
  border-radius: 8px;
  border: 1px solid #374151;
}

.preview-compare {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.preview-item-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 600;
}

.preview-image-box {
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1f2937;
  border-radius: 4px;
  border: 1px solid #374151;
  overflow: hidden;
}

.preview-image {
  width: 128px;
  height: 128px;
  object-fit: contain;
  image-rendering: pixelated;
}

.preview-no-image {
  color: #4b5563;
  font-size: 13px;
}

.preview-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
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

.btn-secondary {
  background: #374151;
  color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  color: #f3f4f6;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
}
</style>

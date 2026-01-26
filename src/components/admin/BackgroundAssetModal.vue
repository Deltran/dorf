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

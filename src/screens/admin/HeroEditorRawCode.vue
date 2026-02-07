<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  code: { type: String, required: true }
})

const emit = defineEmits(['update:code'])

const localCode = ref(props.code)
const parseError = ref(null)

watch(() => props.code, (newCode) => {
  localCode.value = newCode
  validateCode(newCode)
})

function onInput(event) {
  localCode.value = event.target.value
  emit('update:code', localCode.value)
}

function onBlur() {
  validateCode(localCode.value)
}

function validateCode(code) {
  try {
    // Extract the object from export statement
    const match = code.match(/export\s+const\s+\w+\s*=\s*(\{[\s\S]*\})\s*$/)
    if (!match) {
      parseError.value = 'Could not find export statement'
      return
    }

    // Replace EffectType refs with strings for parsing
    const withStrings = match[1].replace(/EffectType\.\w+/g, "'placeholder'")

    // Try to parse as object literal
    new Function(`return ${withStrings}`)()
    parseError.value = null
  } catch (e) {
    parseError.value = e.message
  }
}

const lineNumbers = computed(() => {
  const lines = localCode.value.split('\n').length
  return Array.from({ length: lines }, (_, i) => i + 1)
})

// Initial validation
validateCode(props.code)
</script>

<template>
  <div class="raw-code-tab">
    <div class="code-editor">
      <div class="line-numbers">
        <div v-for="n in lineNumbers" :key="n" class="line-num">{{ n }}</div>
      </div>
      <textarea
        :value="localCode"
        @input="onInput"
        @blur="onBlur"
        spellcheck="false"
        class="code-textarea"
      ></textarea>
    </div>

    <div v-if="parseError" class="parse-error">
      <span class="error-icon">⚠️</span>
      <span class="error-text">Syntax error: {{ parseError }}</span>
    </div>
  </div>
</template>

<style scoped>
.raw-code-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
}

.code-editor {
  flex: 1;
  display: flex;
  background: #1e1e1e;
  border: 1px solid #374151;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'SF Mono', 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.line-numbers {
  padding: 12px 0;
  background: #252526;
  color: #858585;
  text-align: right;
  border-right: 1px solid #374151;
  min-width: 40px;
}

.line-num {
  padding: 0 12px 0 8px;
  height: 1.5em;
}

.code-textarea {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: #d4d4d4;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  resize: none;
  outline: none;
  white-space: pre;
  overflow-x: auto;
  tab-size: 2;
}

.code-textarea::placeholder {
  color: #6b7280;
}

.parse-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: #451a1a;
  border: 1px solid #dc2626;
  border-radius: 6px;
}

.error-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.error-text {
  color: #fca5a5;
  font-size: 13px;
}
</style>

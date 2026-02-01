<script setup>
const model = defineModel()
const emit = defineEmits(['blur'])

function handleBlur() {
  emit('blur')
}
</script>

<template>
  <div class="raw-code-tab">
    Raw Code - {{ model?.substring(0, 50) }}...
    <textarea
      :value="model"
      @input="model = $event.target.value"
      @blur="handleBlur"
      class="code-editor"
      placeholder="Hero JavaScript code..."
    />
  </div>
</template>

<style scoped>
.raw-code-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #9ca3af;
}

.code-editor {
  flex: 1;
  margin-top: 12px;
  padding: 12px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #f3f4f6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  resize: none;
}

.code-editor:focus {
  outline: none;
  border-color: #3b82f6;
}
</style>

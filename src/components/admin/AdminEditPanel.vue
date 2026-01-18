<script setup>
const props = defineProps({
  title: { type: String, default: 'Edit' },
  isNew: { type: Boolean, default: false },
  error: { type: String, default: null },
  emptyMessage: { type: String, default: 'Select an item to edit, or click "+ New" to create one.' }
})

const emit = defineEmits(['save', 'delete', 'cancel'])

const jsonText = defineModel('json', { type: String, default: '' })
const hasContent = defineModel('hasContent', { type: Boolean, default: false })
</script>

<template>
  <div class="edit-panel">
    <div v-if="hasContent" class="edit-content">
      <div class="edit-header">
        <h3>{{ isNew ? `New ${title}` : `Edit ${title}` }}</h3>
        <div class="edit-actions">
          <button class="btn btn-secondary" @click="emit('cancel')">Cancel</button>
          <button v-if="!isNew" class="btn btn-danger" @click="emit('delete')">Delete</button>
          <button class="btn btn-primary" @click="emit('save')">Save</button>
        </div>
      </div>

      <div v-if="error" class="json-error">{{ error }}</div>

      <slot name="form">
        <textarea
          v-model="jsonText"
          class="json-editor"
          spellcheck="false"
        ></textarea>
      </slot>
    </div>

    <div v-else class="empty-state">
      <p>{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.edit-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.edit-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.edit-header {
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-header h3 {
  margin: 0;
  font-size: 16px;
  color: #f3f4f6;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #374151;
  color: #9ca3af;
}

.btn-secondary:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.json-error {
  padding: 8px 16px;
  background: #7f1d1d;
  color: #fca5a5;
  font-size: 14px;
}

.json-editor {
  flex: 1;
  padding: 16px;
  background: #111827;
  border: none;
  color: #f3f4f6;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
}

.json-editor:focus {
  outline: none;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}
</style>

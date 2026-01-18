<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('classes')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')

const classesList = computed(() => {
  return Object.values(data.value).sort((a, b) => a.title.localeCompare(b.title))
})

const selectedClass = computed(() => {
  return selectedId.value ? data.value[selectedId.value] : null
})

const roleIcons = {
  tank: '🛡️',
  dps: '⚔️',
  healer: '💚',
  support: '✨'
}

onMounted(() => {
  fetchAll()
})

function selectClass(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newClass() {
  const template = {
    id: 'new_class',
    title: 'New Class',
    role: 'dps',
    resourceName: 'Energy'
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveClass() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Class must have an id field'
      return
    }

    if (selectedId.value) {
      await updateEntry(selectedId.value, parsed)
      selectedId.value = parsed.id
    } else {
      await createEntry(parsed)
      selectedId.value = parsed.id
    }
    jsonText.value = JSON.stringify(data.value[parsed.id], null, 2)
  } catch (e) {
    jsonError.value = e.message
  }
}

async function deleteClass() {
  if (!selectedId.value) return
  if (!confirm(`Delete "${selectedClass.value?.title}"?`)) return

  await deleteEntry(selectedId.value)
  selectedId.value = null
  jsonText.value = ''
}

function cancelEdit() {
  if (selectedId.value && data.value[selectedId.value]) {
    jsonText.value = JSON.stringify(data.value[selectedId.value], null, 2)
  } else {
    jsonText.value = ''
    selectedId.value = null
  }
  jsonError.value = null
}
</script>

<template>
  <div class="classes-admin">
    <div class="list-panel">
      <div class="list-header">
        <input type="text" placeholder="Search..." class="search-input" />
        <button class="new-btn" @click="newClass">+ New</button>
      </div>

      <div class="list-body">
        <div v-if="loading && !classesList.length" class="loading">Loading...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div
          v-for="cls in classesList"
          :key="cls.id"
          :class="['list-item', { selected: selectedId === cls.id }]"
          @click="selectClass(cls.id)"
        >
          <span class="item-name">{{ cls.title }}</span>
          <span class="item-meta">
            <span class="role-icon">{{ roleIcons[cls.role] || '?' }}</span>
            {{ cls.role }}
          </span>
        </div>
      </div>
    </div>

    <div class="edit-panel">
      <div v-if="selectedId || jsonText" class="edit-content">
        <div class="edit-header">
          <h3>{{ selectedId ? 'Edit Class' : 'New Class' }}</h3>
          <div class="edit-actions">
            <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
            <button v-if="selectedId" class="btn btn-danger" @click="deleteClass">Delete</button>
            <button class="btn btn-primary" @click="saveClass">Save</button>
          </div>
        </div>

        <div v-if="jsonError" class="json-error">{{ jsonError }}</div>

        <textarea
          v-model="jsonText"
          class="json-editor"
          spellcheck="false"
        ></textarea>
      </div>

      <div v-else class="empty-state">
        <p>Select a class to edit, or click "+ New" to create one.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.classes-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.list-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid #374151;
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 14px;
}

.search-input::placeholder {
  color: #6b7280;
}

.new-btn {
  padding: 8px 12px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.new-btn:hover {
  background: #2563eb;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-item {
  padding: 12px;
  border-bottom: 1px solid #374151;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-item:hover {
  background: #374151;
}

.list-item.selected {
  background: #3b82f6;
}

.item-name {
  color: #f3f4f6;
  font-size: 14px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.role-icon {
  font-size: 14px;
}

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

.loading, .error {
  padding: 16px;
  text-align: center;
  color: #6b7280;
}

.error {
  color: #fca5a5;
}
</style>

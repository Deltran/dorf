<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('statusEffects')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const effectsList = computed(() => {
  return Object.values(data.value).sort((a, b) => (a.name || a.id || '').localeCompare(b.name || b.id || ''))
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

onMounted(() => {
  fetchAll()
})

function selectEffect(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newEffect() {
  const template = {
    name: 'New Effect',
    icon: '✨',
    color: '#ffffff',
    isBuff: true,
    stackable: false
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveEffect() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)

    // For status effects, the key is different - we need an ID
    // Generate from name if not present
    if (!parsed.id) {
      parsed.id = (parsed.name || 'effect').toLowerCase().replace(/\s+/g, '_')
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

async function deleteEffect() {
  if (!selectedId.value) return
  const effect = data.value[selectedId.value]
  if (!confirm(`Delete "${effect?.name || selectedId.value}"?`)) return

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
  <div class="effects-admin">
    <AdminListPanel
      :items="effectsList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectEffect"
      @new="newEffect"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="effect-icon">{{ item.icon || '?' }}</span>
          <span class="effect-name">{{ item.name || item.id }}</span>
          <span :class="['buff-badge', item.isBuff ? 'buff' : 'debuff']">
            {{ item.isBuff ? 'Buff' : 'Debuff' }}
          </span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Status Effect"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveEffect"
      @delete="deleteEffect"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.effects-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.effect-icon {
  font-size: 16px;
}

.effect-name {
  flex: 1;
  color: #f3f4f6;
  font-size: 14px;
}

.buff-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.buff-badge.buff {
  background: #166534;
  color: #86efac;
}

.buff-badge.debuff {
  background: #7f1d1d;
  color: #fca5a5;
}
</style>

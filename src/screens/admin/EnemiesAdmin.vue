<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('enemies')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const enemiesList = computed(() => {
  return Object.values(data.value).sort((a, b) => a.name.localeCompare(b.name))
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

onMounted(() => {
  fetchAll()
})

function selectEnemy(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newEnemy() {
  const template = {
    id: 'new_enemy',
    name: 'New Enemy',
    stats: { hp: 100, atk: 20, def: 10, spd: 10 },
    skill: {
      name: 'Basic Attack',
      description: 'Deal 100% ATK damage',
      cooldown: 2
    }
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveEnemy() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Enemy must have an id field'
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

async function deleteEnemy() {
  if (!selectedId.value) return
  const enemy = data.value[selectedId.value]
  if (!confirm(`Delete "${enemy?.name}"?`)) return

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
  <div class="enemies-admin">
    <AdminListPanel
      :items="enemiesList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectEnemy"
      @new="newEnemy"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="enemy-name">{{ item.name }}</span>
          <span class="enemy-hp">HP: {{ item.stats?.hp || '?' }}</span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Enemy"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveEnemy"
      @delete="deleteEnemy"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.enemies-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.enemy-name {
  color: #f3f4f6;
  font-size: 14px;
}

.enemy-hp {
  color: #9ca3af;
  font-size: 12px;
}
</style>

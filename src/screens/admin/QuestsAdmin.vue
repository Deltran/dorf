<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('questNodes')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const questsList = computed(() => {
  return Object.values(data.value).sort((a, b) => {
    // Sort by region, then by id
    if (a.region !== b.region) return a.region.localeCompare(b.region)
    return a.id.localeCompare(b.id)
  })
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

onMounted(() => {
  fetchAll()
})

function selectQuest(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newQuest() {
  const template = {
    id: 'new_node',
    name: 'New Quest Node',
    region: 'Whispering Woods',
    x: 100,
    y: 100,
    battles: [
      { enemies: ['goblin_scout', 'goblin_scout'] }
    ],
    connections: [],
    rewards: { gems: 50, gold: 100, exp: 80 },
    firstClearBonus: { gems: 30 },
    itemDrops: []
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveQuest() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Quest node must have an id field'
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

async function deleteQuest() {
  if (!selectedId.value) return
  const quest = data.value[selectedId.value]
  if (!confirm(`Delete "${quest?.name}"?`)) return

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
  <div class="quests-admin">
    <AdminListPanel
      :items="questsList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectQuest"
      @new="newQuest"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="quest-info">
            <span class="quest-name">{{ item.name }}</span>
            <span class="quest-id">{{ item.id }}</span>
          </span>
          <span class="quest-region">{{ item.region }}</span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Quest Node"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveQuest"
      @delete="deleteQuest"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.quests-admin {
  display: flex;
  gap: 24px;
  height: calc(100vh - 120px);
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.quest-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quest-name {
  color: #f3f4f6;
  font-size: 14px;
}

.quest-id {
  color: #6b7280;
  font-size: 11px;
  font-family: monospace;
}

.quest-region {
  color: #9ca3af;
  font-size: 11px;
  white-space: nowrap;
}
</style>

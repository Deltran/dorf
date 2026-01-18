<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminApi } from '../../composables/useAdminApi.js'
import AdminListPanel from '../../components/admin/AdminListPanel.vue'
import AdminEditPanel from '../../components/admin/AdminEditPanel.vue'

const { data, loading, error, fetchAll, createEntry, updateEntry, deleteEntry } = useAdminApi('heroes')

const selectedId = ref(null)
const jsonError = ref(null)
const jsonText = ref('')
const searchText = ref('')

const heroesList = computed(() => {
  return Object.values(data.value).sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity
    return a.name.localeCompare(b.name)
  })
})

const hasContent = computed(() => selectedId.value !== null || jsonText.value !== '')
const isNew = computed(() => selectedId.value === null && jsonText.value !== '')

const rarityColors = {
  1: '#9ca3af',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f59e0b'
}

onMounted(() => {
  fetchAll()
})

function selectHero(id) {
  selectedId.value = id
  jsonError.value = null
  if (data.value[id]) {
    jsonText.value = JSON.stringify(data.value[id], null, 2)
  }
}

function newHero() {
  const template = {
    id: 'new_hero',
    name: 'New Hero',
    rarity: 3,
    classId: 'knight',
    baseStats: { hp: 100, atk: 25, def: 25, spd: 10, mp: 50 },
    skill: {
      name: 'Basic Skill',
      description: 'Deal 100% ATK damage to one enemy',
      mpCost: 10,
      targetType: 'enemy'
    }
  }
  jsonText.value = JSON.stringify(template, null, 2)
  selectedId.value = null
  jsonError.value = null
}

async function saveHero() {
  jsonError.value = null
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.id) {
      jsonError.value = 'Hero must have an id field'
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

async function deleteHero() {
  if (!selectedId.value) return
  const hero = data.value[selectedId.value]
  if (!confirm(`Delete "${hero?.name}"?`)) return

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
  <div class="heroes-admin">
    <AdminListPanel
      :items="heroesList"
      :selected-id="selectedId"
      :loading="loading"
      :error="error"
      label-key="name"
      v-model:search="searchText"
      @select="selectHero"
      @new="newHero"
    >
      <template #item="{ item }">
        <span class="item-row">
          <span class="hero-info">
            <span class="rarity-stars" :style="{ color: rarityColors[item.rarity] }">
              {{ '\u2605'.repeat(item.rarity) }}
            </span>
            <span class="hero-name">{{ item.name }}</span>
          </span>
          <span class="hero-class">{{ item.classId }}</span>
        </span>
      </template>
    </AdminListPanel>

    <AdminEditPanel
      title="Hero"
      :is-new="isNew"
      :error="jsonError"
      v-model:json="jsonText"
      v-model:has-content="hasContent"
      @save="saveHero"
      @delete="deleteHero"
      @cancel="cancelEdit"
    />
  </div>
</template>

<style scoped>
.heroes-admin {
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

.hero-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rarity-stars {
  font-size: 10px;
  letter-spacing: -2px;
}

.hero-name {
  color: #f3f4f6;
  font-size: 14px;
}

.hero-class {
  color: #9ca3af;
  font-size: 12px;
  text-transform: capitalize;
}
</style>

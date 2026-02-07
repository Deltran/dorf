<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuestsStore } from '../../stores/quests.js'
import SearchableDropdown from '../../components/admin/SearchableDropdown.vue'

const questsStore = useQuestsStore()

// State
const allRegions = ref([])
const selectedRegionId = ref(null)
const editingNodeId = ref(null)
const loading = ref(false)
const error = ref(null)
const showRegionMeta = ref(true)
const showCreateRegion = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref(null) // { type: 'region'|'node', id, name }

// Region metadata form state
const regionForm = ref({})
const newRegionForm = ref({
  id: '',
  name: '',
  description: '',
  superRegion: 'western_veros',
  startNode: '',
  width: 600,
  height: 1000,
  backgroundColor: '#1f2937'
})

// Node form state
const nodeForm = ref({})
const enemyOptions = ref([])
const itemOptions = ref([])
const showAllRegionConnections = ref(false)

// Fetch all regions from API
async function fetchRegions() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/__admin/quest-regions')
    if (!res.ok) throw new Error(await res.text())
    allRegions.value = await res.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function fetchDropdownData() {
  try {
    const [enemyRes, itemRes] = await Promise.all([
      fetch('/__admin/enemies'),
      fetch('/__admin/items')
    ])
    if (enemyRes.ok) {
      const data = await enemyRes.json()
      enemyOptions.value = Object.values(data).map(e => ({
        id: e.id, label: e.name || e.id, sublabel: e.id
      }))
    }
    if (itemRes.ok) {
      const data = await itemRes.json()
      itemOptions.value = Object.values(data).map(i => ({
        id: i.id, label: i.name || i.id, sublabel: i.id
      }))
    }
  } catch (e) { /* ignore dropdown fetch errors */ }
}

onMounted(() => {
  fetchRegions()
  fetchDropdownData()
})

// Computed
const superRegionGroups = computed(() => {
  const groups = { western_veros: [], aquarias: [] }
  for (const region of allRegions.value) {
    const sr = region.regionMeta.superRegion || 'western_veros'
    if (!groups[sr]) groups[sr] = []
    groups[sr].push(region)
  }
  return groups
})

const selectedRegion = computed(() =>
  allRegions.value.find(r => r.regionId === selectedRegionId.value) || null
)

const selectedRegionNodes = computed(() => {
  if (!selectedRegion.value) return []
  return Object.values(selectedRegion.value.nodes).map(node => ({
    ...node,
    type: node.type || 'battle',
    unlocked: questsStore.unlockedNodes.includes(node.id),
    completed: questsStore.completedNodes.includes(node.id)
  }))
})

// Sync regionForm when selected region changes
watch(selectedRegion, (region) => {
  if (region) {
    regionForm.value = { ...region.regionMeta }
  } else {
    regionForm.value = {}
  }
}, { immediate: true })

// Populate node form when editing node changes
watch(editingNodeId, (nodeId) => {
  if (nodeId && selectedRegion.value) {
    nodeForm.value = JSON.parse(JSON.stringify(selectedRegion.value.nodes[nodeId]))
  }
})

// Connection options computed
const connectionOptions = computed(() => {
  if (showAllRegionConnections.value) {
    return allRegions.value.flatMap(r =>
      Object.values(r.nodes).map(n => ({
        id: n.id, label: n.name, sublabel: `${r.regionMeta.name} / ${n.id}`
      }))
    )
  }
  if (!selectedRegion.value) return []
  return Object.values(selectedRegion.value.nodes)
    .filter(n => n.id !== editingNodeId.value)
    .map(n => ({ id: n.id, label: n.name, sublabel: n.id }))
})

// Actions
function selectRegion(regionId) {
  selectedRegionId.value = regionId
  editingNodeId.value = null
}

function editNode(nodeId) {
  editingNodeId.value = nodeId
}

function backToNodeList() {
  editingNodeId.value = null
}

// Unlock/lock (preserved from QuestNodeList)
function toggleUnlock(nodeId, currentlyUnlocked) {
  if (currentlyUnlocked) {
    const idx = questsStore.unlockedNodes.indexOf(nodeId)
    if (idx !== -1) questsStore.unlockedNodes.splice(idx, 1)
    const compIdx = questsStore.completedNodes.indexOf(nodeId)
    if (compIdx !== -1) questsStore.completedNodes.splice(compIdx, 1)
  } else {
    questsStore.unlockedNodes.push(nodeId)
  }
}

function unlockAllInRegion() {
  if (!selectedRegion.value) return
  const nodes = Object.values(selectedRegion.value.nodes)
  for (const node of nodes) {
    if (!questsStore.unlockedNodes.includes(node.id)) {
      questsStore.unlockedNodes.push(node.id)
    }
  }
}

function lockAllInRegion() {
  if (!selectedRegion.value) return
  const nodeIds = new Set(Object.keys(selectedRegion.value.nodes))
  questsStore.unlockedNodes = questsStore.unlockedNodes.filter(id => !nodeIds.has(id))
  questsStore.completedNodes = questsStore.completedNodes.filter(id => !nodeIds.has(id))
}

// Delete confirmation
function confirmDelete(type, id, name) {
  deleteTarget.value = { type, id, name }
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

async function executeDelete() {
  if (!deleteTarget.value) return
  const { type, id } = deleteTarget.value

  try {
    let url
    if (type === 'region') {
      url = `/__admin/quest-regions/${id}`
    } else {
      url = `/__admin/quest-regions/${selectedRegionId.value}/nodes/${id}`
    }

    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error(await res.text())

    if (type === 'region' && selectedRegionId.value === id) {
      selectedRegionId.value = null
    }
    if (type === 'node' && editingNodeId.value === id) {
      editingNodeId.value = null
    }

    await fetchRegions()
  } catch (e) {
    error.value = e.message
  } finally {
    showDeleteConfirm.value = false
    deleteTarget.value = null
  }
}

// Region metadata save
async function saveRegionMeta() {
  if (!selectedRegionId.value) return
  try {
    const res = await fetch(`/__admin/quest-regions/${selectedRegionId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionMeta: regionForm.value })
    })
    if (!res.ok) throw new Error(await res.text())
    await fetchRegions()
  } catch (e) {
    error.value = e.message
  }
}

// Create new region
async function createRegion() {
  try {
    const res = await fetch('/__admin/quest-regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionMeta: newRegionForm.value })
    })
    if (!res.ok) throw new Error(await res.text())
    const created = await res.json()
    await fetchRegions()
    // Select the newly created region
    selectedRegionId.value = created.regionId || newRegionForm.value.id
    // Reset the form
    newRegionForm.value = {
      id: '',
      name: '',
      description: '',
      superRegion: 'western_veros',
      startNode: '',
      width: 600,
      height: 1000,
      backgroundColor: '#1f2937'
    }
    showCreateRegion.value = false
  } catch (e) {
    error.value = e.message
  }
}

// Save node
async function saveNode() {
  if (!selectedRegion.value || !editingNodeId.value) return
  try {
    const res = await fetch(
      `/__admin/quest-regions/${selectedRegion.value.regionId}/nodes/${editingNodeId.value}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nodeForm.value) }
    )
    if (!res.ok) throw new Error(await res.text())
    if (nodeForm.value.id !== editingNodeId.value) {
      editingNodeId.value = nodeForm.value.id
    }
    await fetchRegions()
  } catch (e) { error.value = e.message }
}

// Create node
async function createNode() {
  if (!selectedRegion.value) return
  const existingIds = Object.keys(selectedRegion.value.nodes)
  const prefix = selectedRegion.value.regionId.split('_')[0]
  const num = String(existingIds.length + 1).padStart(2, '0')
  const nodeId = `${prefix}_${num}`
  const newNode = {
    id: nodeId,
    name: 'New Node',
    region: selectedRegion.value.regionMeta.name,
    x: 100, y: 100,
    battles: [{ enemies: [] }],
    connections: [],
    rewards: { gems: 0, gold: 0, exp: 0 }
  }
  try {
    const res = await fetch(
      `/__admin/quest-regions/${selectedRegion.value.regionId}/nodes`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNode) }
    )
    if (!res.ok) throw new Error(await res.text())
    await fetchRegions()
    editingNodeId.value = nodeId
  } catch (e) { error.value = e.message }
}

// Battle wave helpers
function addBattleWave() {
  if (!nodeForm.value.battles) nodeForm.value.battles = []
  nodeForm.value.battles.push({ enemies: [] })
}
function removeBattleWave(index) {
  nodeForm.value.battles.splice(index, 1)
}
function moveBattleWave(index, direction) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= nodeForm.value.battles.length) return
  const battles = nodeForm.value.battles
  const temp = battles[index]
  battles[index] = battles[newIndex]
  battles[newIndex] = temp
}
function addEnemyToBattle(battleIndex, option) {
  nodeForm.value.battles[battleIndex].enemies.push(option.id)
}
function removeEnemyFromBattle(battleIndex, enemyIndex) {
  nodeForm.value.battles[battleIndex].enemies.splice(enemyIndex, 1)
}

// Connection helpers
function addConnection(option) {
  if (!nodeForm.value.connections) nodeForm.value.connections = []
  if (!nodeForm.value.connections.includes(option.id)) {
    nodeForm.value.connections.push(option.id)
  }
}
function removeConnection(index) {
  nodeForm.value.connections.splice(index, 1)
}

// Item drop helpers
function addItemDrop(option) {
  if (!nodeForm.value.itemDrops) nodeForm.value.itemDrops = []
  nodeForm.value.itemDrops.push({ itemId: option.id, min: 1, max: 1, chance: 0.5 })
}
function removeItemDrop(index) {
  nodeForm.value.itemDrops.splice(index, 1)
}

// Expose for child components
function onRegionSaved() {
  fetchRegions()
}

function onNodeSaved() {
  fetchRegions()
}
</script>

<template>
  <div class="quest-editor">
    <!-- Left Panel: Region List -->
    <aside class="region-list-panel">
      <div class="panel-header">
        <span class="panel-title">Regions</span>
        <button class="create-btn" @click="showCreateRegion = true">+ New</button>
      </div>

      <div v-if="loading" class="loading">Loading...</div>

      <div v-for="(regions, superRegionId) in superRegionGroups" :key="superRegionId" class="super-region-group">
        <div class="super-region-label">{{ superRegionId === 'western_veros' ? 'Western Veros' : 'Aquarias' }}</div>
        <button
          v-for="region in regions"
          :key="region.regionId"
          :class="['region-item', { active: selectedRegionId === region.regionId }]"
          @click="selectRegion(region.regionId)"
        >
          <span class="region-item-name">{{ region.regionMeta.name }}</span>
          <span class="region-item-count">{{ Object.keys(region.nodes).length }}</span>
        </button>
      </div>
    </aside>

    <!-- Right Panel: Region Detail + Nodes -->
    <main class="detail-panel">
      <template v-if="showCreateRegion">
        <div class="create-region-panel">
          <div class="section-header">
            <span>Create New Region</span>
          </div>
          <div class="section-body">
            <div class="form-grid">
              <label class="form-field">
                <span class="field-label">ID</span>
                <input v-model="newRegionForm.id" class="field-input" placeholder="e.g. crystal_caverns" />
              </label>
              <label class="form-field">
                <span class="field-label">Name</span>
                <input v-model="newRegionForm.name" class="field-input" placeholder="e.g. Crystal Caverns" />
              </label>
              <label class="form-field full-width">
                <span class="field-label">Description</span>
                <textarea v-model="newRegionForm.description" class="field-textarea" rows="2" placeholder="Region description..." />
              </label>
              <label class="form-field">
                <span class="field-label">Super Region</span>
                <select v-model="newRegionForm.superRegion" class="field-select">
                  <option value="western_veros">Western Veros</option>
                  <option value="aquarias">Aquarias</option>
                </select>
              </label>
              <label class="form-field">
                <span class="field-label">Start Node</span>
                <input v-model="newRegionForm.startNode" class="field-input" placeholder="First node ID" />
              </label>
              <label class="form-field">
                <span class="field-label">Width</span>
                <input v-model.number="newRegionForm.width" type="number" class="field-input" />
              </label>
              <label class="form-field">
                <span class="field-label">Height</span>
                <input v-model.number="newRegionForm.height" type="number" class="field-input" />
              </label>
              <label class="form-field">
                <span class="field-label">Background Color</span>
                <div class="color-field">
                  <input v-model="newRegionForm.backgroundColor" type="color" class="field-color" />
                  <input v-model="newRegionForm.backgroundColor" class="field-input color-text" />
                </div>
              </label>
            </div>
            <div class="form-actions">
              <button class="cancel-btn" @click="showCreateRegion = false">Cancel</button>
              <button class="save-btn" @click="createRegion">Create Region</button>
            </div>
          </div>
        </div>
      </template>

      <template v-if="!selectedRegion && !showCreateRegion">
        <div class="empty-state">Select a region or create a new one</div>
      </template>

      <!-- Region metadata editor (collapsible) -->
      <template v-if="selectedRegion && !editingNodeId">
        <div class="region-meta-section">
          <div class="section-header" @click="showRegionMeta = !showRegionMeta">
            <span>Region: {{ selectedRegion.regionMeta.name }}</span>
            <span class="collapse-icon">{{ showRegionMeta ? '▼' : '▶' }}</span>
          </div>
          <div v-if="showRegionMeta" class="section-body">
            <div class="form-grid">
              <label class="form-field">
                <span class="field-label">ID</span>
                <input v-model="regionForm.id" class="field-input" />
              </label>
              <label class="form-field">
                <span class="field-label">Name</span>
                <input v-model="regionForm.name" class="field-input" />
              </label>
              <label class="form-field full-width">
                <span class="field-label">Description</span>
                <textarea v-model="regionForm.description" class="field-textarea" rows="2" />
              </label>
              <label class="form-field">
                <span class="field-label">Super Region</span>
                <select v-model="regionForm.superRegion" class="field-select">
                  <option value="western_veros">Western Veros</option>
                  <option value="aquarias">Aquarias</option>
                </select>
              </label>
              <label class="form-field">
                <span class="field-label">Start Node</span>
                <select v-model="regionForm.startNode" class="field-select">
                  <option v-for="node in selectedRegionNodes" :key="node.id" :value="node.id">
                    {{ node.name }} ({{ node.id }})
                  </option>
                </select>
              </label>
              <label class="form-field">
                <span class="field-label">Width</span>
                <input v-model.number="regionForm.width" type="number" class="field-input" />
              </label>
              <label class="form-field">
                <span class="field-label">Height</span>
                <input v-model.number="regionForm.height" type="number" class="field-input" />
              </label>
              <label class="form-field">
                <span class="field-label">Background Color</span>
                <div class="color-field">
                  <input v-model="regionForm.backgroundColor" type="color" class="field-color" />
                  <input v-model="regionForm.backgroundColor" class="field-input color-text" />
                </div>
              </label>
            </div>
            <div class="form-actions">
              <button class="save-btn" @click="saveRegionMeta">Save Region</button>
            </div>
          </div>
          <div class="region-actions-bar">
            <button class="action-btn danger" @click="confirmDelete('region', selectedRegion.regionId, selectedRegion.regionMeta.name)">Delete Region</button>
          </div>
        </div>

        <!-- Node List -->
        <div class="node-list-section">
          <div class="section-header">
            <span>Nodes ({{ selectedRegionNodes.length }})</span>
            <div class="node-list-actions">
              <button class="small-btn" @click="unlockAllInRegion">Unlock All</button>
              <button class="small-btn muted" @click="lockAllInRegion">Lock All</button>
              <button class="small-btn" @click="createNode">+ Node</button>
            </div>
          </div>
          <div class="node-rows">
            <div
              v-for="node in selectedRegionNodes"
              :key="node.id"
              :class="['node-row', { unlocked: node.unlocked, completed: node.completed }]"
            >
              <div class="node-info" @click="editNode(node.id)">
                <span class="node-name">{{ node.name }}</span>
                <span class="node-id">{{ node.id }}</span>
                <span v-if="node.type !== 'battle'" class="node-type-badge">{{ node.type }}</span>
              </div>
              <div class="node-actions">
                <span v-if="node.completed" class="status-badge completed-badge">Done</span>
                <button
                  :class="['toggle-btn', node.unlocked ? 'is-unlocked' : 'is-locked']"
                  @click.stop="toggleUnlock(node.id, node.unlocked)"
                >
                  {{ node.unlocked ? 'Lock' : 'Unlock' }}
                </button>
                <button class="edit-btn" @click.stop="editNode(node.id)">Edit</button>
                <button class="delete-node-btn" @click.stop="confirmDelete('node', node.id, node.name)">&#x2715;</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Node Editor -->
      <template v-if="editingNodeId">
        <div class="node-editor-header">
          <button class="back-btn" @click="backToNodeList">&#x2190; Back</button>
          <span>Editing: {{ editingNodeId }}</span>
        </div>

        <div class="node-editor-form">
          <!-- Identity -->
          <div class="section-divider">Identity</div>
          <div class="form-grid">
            <label class="form-field">
              <span class="field-label">ID</span>
              <input v-model="nodeForm.id" class="field-input" />
            </label>
            <label class="form-field">
              <span class="field-label">Name</span>
              <input v-model="nodeForm.name" class="field-input" />
            </label>
            <label class="form-field">
              <span class="field-label">Type</span>
              <select v-model="nodeForm.type" class="field-select">
                <option value="battle">Battle</option>
                <option value="genusLoci">Genus Loci</option>
                <option value="exploration">Exploration</option>
              </select>
            </label>
            <label class="form-field">
              <span class="field-label">Region</span>
              <input :value="nodeForm.region" class="field-input" readonly />
            </label>
          </div>

          <!-- Position -->
          <div class="section-divider">Position</div>
          <div class="form-grid">
            <label class="form-field">
              <span class="field-label">X</span>
              <input v-model.number="nodeForm.x" type="number" class="field-input" />
            </label>
            <label class="form-field">
              <span class="field-label">Y</span>
              <input v-model.number="nodeForm.y" type="number" class="field-input" />
            </label>
          </div>

          <!-- Battles -->
          <div v-if="(nodeForm.type || 'battle') === 'battle'" class="battles-section">
            <div class="section-divider">Battles</div>
            <div
              v-for="(battle, bIdx) in (nodeForm.battles || [])"
              :key="bIdx"
              class="battle-wave"
            >
              <div class="wave-header">
                <span>Wave {{ bIdx + 1 }}</span>
                <div class="wave-actions">
                  <button class="wave-btn" :disabled="bIdx === 0" @click="moveBattleWave(bIdx, -1)">&#x2191;</button>
                  <button class="wave-btn" :disabled="bIdx === (nodeForm.battles || []).length - 1" @click="moveBattleWave(bIdx, 1)">&#x2193;</button>
                  <button class="wave-btn danger" @click="removeBattleWave(bIdx)">&#x2715;</button>
                </div>
              </div>
              <div class="tag-list">
                <span v-for="(enemyId, eIdx) in battle.enemies" :key="eIdx" class="tag">
                  {{ enemyId }}
                  <button class="tag-remove" @click="removeEnemyFromBattle(bIdx, eIdx)">&#x2715;</button>
                </span>
              </div>
              <SearchableDropdown
                :options="enemyOptions"
                placeholder="Add enemy..."
                @select="addEnemyToBattle(bIdx, $event)"
              />
            </div>
            <button class="small-btn" @click="addBattleWave">+ Add Wave</button>
          </div>

          <!-- Connections -->
          <div class="section-divider">Connections</div>
          <div class="tag-list">
            <span v-for="(connId, cIdx) in (nodeForm.connections || [])" :key="cIdx" class="tag">
              {{ connId }}
              <button class="tag-remove" @click="removeConnection(cIdx)">&#x2715;</button>
            </span>
          </div>
          <label class="checkbox-field">
            <input v-model="showAllRegionConnections" type="checkbox" />
            Show all regions
          </label>
          <SearchableDropdown
            :options="connectionOptions"
            placeholder="Add connection..."
            @select="addConnection"
          />

          <!-- Rewards -->
          <div class="section-divider">Rewards</div>
          <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr;">
            <label class="form-field">
              <span class="field-label">Gems</span>
              <input v-model.number="nodeForm.rewards.gems" type="number" class="field-input" />
            </label>
            <label class="form-field">
              <span class="field-label">Gold</span>
              <input v-model.number="nodeForm.rewards.gold" type="number" class="field-input" />
            </label>
            <label class="form-field">
              <span class="field-label">Exp</span>
              <input v-model.number="nodeForm.rewards.exp" type="number" class="field-input" />
            </label>
          </div>

          <!-- First Clear Bonus -->
          <div class="section-divider">First Clear Bonus</div>
          <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr;">
            <label class="form-field">
              <span class="field-label">Gems</span>
              <input
                :value="(nodeForm.firstClearBonus || {}).gems || 0"
                type="number"
                class="field-input"
                @input="if (!nodeForm.firstClearBonus) nodeForm.firstClearBonus = {}; nodeForm.firstClearBonus.gems = Number($event.target.value)"
              />
            </label>
            <label class="form-field">
              <span class="field-label">Gold</span>
              <input
                :value="(nodeForm.firstClearBonus || {}).gold || 0"
                type="number"
                class="field-input"
                @input="if (!nodeForm.firstClearBonus) nodeForm.firstClearBonus = {}; nodeForm.firstClearBonus.gold = Number($event.target.value)"
              />
            </label>
            <label class="form-field">
              <span class="field-label">Exp</span>
              <input
                :value="(nodeForm.firstClearBonus || {}).exp || 0"
                type="number"
                class="field-input"
                @input="if (!nodeForm.firstClearBonus) nodeForm.firstClearBonus = {}; nodeForm.firstClearBonus.exp = Number($event.target.value)"
              />
            </label>
          </div>

          <!-- Item Drops -->
          <div class="section-divider">Item Drops</div>
          <div v-for="(drop, dIdx) in (nodeForm.itemDrops || [])" :key="dIdx" class="item-drop-row">
            <span>{{ drop.itemId }}</span>
            <input v-model.number="drop.chance" type="number" step="0.05" min="0" max="1" class="drop-input" title="Chance" />
            <input v-model.number="drop.min" type="number" min="1" class="drop-input" title="Min" />
            <input v-model.number="drop.max" type="number" min="1" class="drop-input" title="Max" />
            <button class="tag-remove" @click="removeItemDrop(dIdx)">&#x2715;</button>
          </div>
          <SearchableDropdown
            :options="itemOptions"
            placeholder="Add item drop..."
            @select="addItemDrop"
          />

          <!-- Genus Loci -->
          <template v-if="nodeForm.type === 'genusLoci'">
            <div class="section-divider">Genus Loci</div>
            <div class="form-grid">
              <label class="form-field full-width">
                <span class="field-label">Genus Loci ID</span>
                <input v-model="nodeForm.genusLociId" class="field-input" placeholder="e.g. great_troll" />
              </label>
            </div>
          </template>

          <!-- Exploration -->
          <template v-if="nodeForm.type === 'exploration'">
            <div class="section-divider">Exploration Config</div>
            <div class="form-grid">
              <label class="form-field">
                <span class="field-label">Required Fights</span>
                <input
                  :value="(nodeForm.explorationConfig || {}).requiredFights || 0"
                  type="number"
                  class="field-input"
                  @input="if (!nodeForm.explorationConfig) nodeForm.explorationConfig = {}; nodeForm.explorationConfig.requiredFights = Number($event.target.value)"
                />
              </label>
              <label class="form-field">
                <span class="field-label">Time Limit</span>
                <input
                  :value="(nodeForm.explorationConfig || {}).timeLimit || 0"
                  type="number"
                  class="field-input"
                  @input="if (!nodeForm.explorationConfig) nodeForm.explorationConfig = {}; nodeForm.explorationConfig.timeLimit = Number($event.target.value)"
                />
              </label>
              <label class="form-field full-width">
                <span class="field-label">Required Crest ID</span>
                <input
                  :value="(nodeForm.explorationConfig || {}).requiredCrestId || ''"
                  class="field-input"
                  @input="if (!nodeForm.explorationConfig) nodeForm.explorationConfig = {}; nodeForm.explorationConfig.requiredCrestId = $event.target.value"
                />
              </label>
            </div>
          </template>

          <!-- Special Fields -->
          <div class="section-divider">Special</div>
          <div class="form-grid">
            <label class="form-field">
              <span class="field-label">Unlocks</span>
              <input v-model="nodeForm.unlocks" class="field-input" placeholder="Node ID to unlock" />
            </label>
            <label class="form-field">
              <span class="field-label">Unlocked By</span>
              <input v-model="nodeForm.unlockedBy" class="field-input" placeholder="Required node ID" />
            </label>
            <label class="form-field full-width">
              <span class="field-label">Background ID</span>
              <input v-model="nodeForm.backgroundId" class="field-input" placeholder="Battle background asset ID" />
            </label>
          </div>

          <!-- Save -->
          <div class="form-actions">
            <button class="save-btn" @click="saveNode">Save Node</button>
          </div>
        </div>
      </template>
    </main>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="confirm-overlay" @click.self="cancelDelete">
      <div class="confirm-dialog">
        <p class="confirm-message">
          Delete {{ deleteTarget?.type }} <strong>{{ deleteTarget?.name }}</strong>?
          <template v-if="deleteTarget?.type === 'region'">
            <br /><span class="confirm-warning">This will delete the region file and all its nodes.</span>
          </template>
        </p>
        <div class="confirm-actions">
          <button class="confirm-cancel" @click="cancelDelete">Cancel</button>
          <button class="confirm-delete" @click="executeDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- Error display -->
    <div v-if="error" class="error-banner" @click="error = null">{{ error }}</div>
  </div>
</template>

<style scoped>
.quest-editor {
  display: flex;
  height: calc(100vh - 80px);
  gap: 0;
}

.region-list-panel {
  width: 240px;
  background: #1f2937;
  border-right: 1px solid #374151;
  overflow-y: auto;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #374151;
  background: #111827;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f3f4f6;
}

.create-btn {
  padding: 3px 10px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.create-btn:hover {
  background: #2563eb;
}

.super-region-group {
  padding: 4px 0;
}

.super-region-label {
  padding: 8px 14px 4px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.region-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 0.8rem;
  cursor: pointer;
  text-align: left;
}

.region-item:hover {
  background: #374151;
  color: #f3f4f6;
}

.region-item.active {
  background: #3b82f6;
  color: white;
}

.region-item-count {
  font-size: 0.7rem;
  opacity: 0.6;
}

.detail-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  font-size: 0.9rem;
}

.region-meta-section {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #111827;
  cursor: pointer;
  font-size: 0.9rem;
  color: #f3f4f6;
  font-weight: 600;
}

.collapse-icon {
  font-size: 0.7rem;
  color: #6b7280;
}

.section-body {
  padding: 16px;
}

.region-actions-bar {
  padding: 8px 16px;
  border-top: 1px solid #374151;
  display: flex;
  justify-content: flex-end;
}

.action-btn.danger {
  padding: 4px 12px;
  background: #7f1d1d;
  border: none;
  border-radius: 4px;
  color: #fca5a5;
  font-size: 0.75rem;
  cursor: pointer;
}

.action-btn.danger:hover {
  background: #991b1b;
}

.node-list-section {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.node-list-actions {
  display: flex;
  gap: 6px;
}

.small-btn {
  padding: 3px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: #22c55e;
  color: #111827;
}

.small-btn:hover {
  background: #16a34a;
}

.small-btn.muted {
  background: #374151;
  color: #9ca3af;
}

.small-btn.muted:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.node-rows {
  display: flex;
  flex-direction: column;
}

.node-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #1a2332;
}

.node-row:last-child {
  border-bottom: none;
}

.node-row.unlocked {
  background: rgba(34, 197, 94, 0.04);
}

.node-row.completed {
  background: rgba(59, 130, 246, 0.04);
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.node-info:hover .node-name {
  color: #f3f4f6;
}

.node-name {
  font-size: 0.85rem;
  color: #d1d5db;
}

.node-id {
  font-size: 0.7rem;
  color: #4b5563;
  font-family: monospace;
}

.node-type-badge {
  font-size: 0.65rem;
  padding: 1px 6px;
  background: #374151;
  border-radius: 3px;
  color: #9ca3af;
  text-transform: uppercase;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.completed-badge {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.toggle-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
}

.is-locked { background: #22c55e; color: #111827; }
.is-locked:hover { background: #16a34a; }
.is-unlocked { background: #374151; color: #9ca3af; }
.is-unlocked:hover { background: #4b5563; color: #f3f4f6; }

.edit-btn {
  padding: 4px 10px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.7rem;
  cursor: pointer;
}

.edit-btn:hover {
  background: #3b82f6;
  color: white;
}

.delete-node-btn {
  padding: 2px 6px;
  background: transparent;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #6b7280;
  font-size: 0.7rem;
  cursor: pointer;
}

.delete-node-btn:hover {
  background: #7f1d1d;
  border-color: #991b1b;
  color: #fca5a5;
}

.node-editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #f3f4f6;
}

.back-btn {
  padding: 4px 10px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.8rem;
  cursor: pointer;
}

.back-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

/* Delete confirmation dialog */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
}

.confirm-message {
  color: #f3f4f6;
  font-size: 0.9rem;
  margin: 0 0 16px 0;
}

.confirm-warning {
  color: #fca5a5;
  font-size: 0.8rem;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-cancel {
  padding: 6px 16px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
}

.confirm-delete {
  padding: 6px 16px;
  background: #dc2626;
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.confirm-delete:hover {
  background: #b91c1c;
}

.error-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #7f1d1d;
  color: #fca5a5;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  z-index: 1000;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}

/* Form styles */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.field-input, .field-textarea, .field-select {
  padding: 6px 10px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 0.85rem;
}

.field-input:focus, .field-textarea:focus, .field-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.field-textarea {
  resize: vertical;
  font-family: inherit;
}

.field-select {
  cursor: pointer;
}

.color-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.field-color {
  width: 36px;
  height: 30px;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
}

.color-text {
  flex: 1;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.save-btn {
  padding: 6px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.save-btn:hover {
  background: #2563eb;
}

.cancel-btn {
  padding: 6px 20px;
  background: #374151;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.create-region-panel {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.node-editor-form {
  background: #1f2937;
  border-radius: 8px;
  padding: 16px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #374151;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #d1d5db;
}

.tag-remove {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0 2px;
}

.tag-remove:hover {
  color: #ef4444;
}

.battle-wave {
  background: #111827;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
}

.wave-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.wave-actions {
  display: flex;
  gap: 4px;
}

.wave-btn {
  padding: 2px 6px;
  background: #374151;
  border: none;
  border-radius: 3px;
  color: #9ca3af;
  font-size: 0.7rem;
  cursor: pointer;
}

.wave-btn:hover {
  background: #4b5563;
  color: #f3f4f6;
}

.wave-btn.danger:hover {
  background: #7f1d1d;
  color: #fca5a5;
}

.wave-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.item-drop-row {
  display: grid;
  grid-template-columns: 1fr 70px 50px 50px 30px;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #1a2332;
  font-size: 0.8rem;
  color: #d1d5db;
}

.item-drop-row:last-child {
  border-bottom: none;
}

.drop-input {
  padding: 4px 6px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 3px;
  color: #f3f4f6;
  font-size: 0.8rem;
  width: 100%;
  box-sizing: border-box;
}

.section-divider {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  margin: 16px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #374151;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 8px;
}

.battles-section {
  margin-bottom: 4px;
}
</style>

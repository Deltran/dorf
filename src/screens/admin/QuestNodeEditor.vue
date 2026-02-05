<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuestsStore } from '../../stores/quests.js'

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

// Placeholder refs for Task 9 and Task 10
const regionForm = ref({})
const nodeForm = ref({})

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

onMounted(fetchRegions)

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

// Placeholder functions for Task 9
function saveRegionMeta() {
  // Task 9 will implement
}

function createRegion() {
  // Task 9 will implement
}

// Placeholder functions for Task 10
function saveNode() {
  // Task 10 will implement
}

function createNode() {
  // Task 10 will implement
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
            <!-- Region form: Task 9 -->
            <p class="placeholder-text">Region metadata form (Task 9)</p>
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
              <!-- Add Node button: Task 10 -->
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

      <!-- Node Editor: Task 10 -->
      <template v-if="editingNodeId">
        <div class="node-editor-header">
          <button class="back-btn" @click="backToNodeList">&#x2190; Back</button>
          <span>Editing: {{ editingNodeId }}</span>
        </div>
        <!-- Node editor form: Task 10 -->
        <p class="placeholder-text">Node editor form (Task 10)</p>
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
  user-select: none;
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

.placeholder-text {
  color: #6b7280;
  font-size: 0.85rem;
  padding: 16px;
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
</style>

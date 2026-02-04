<script setup>
import { computed } from 'vue'
import { regions } from '../../data/quests/index.js'
import { getNodesByRegion } from '../../data/quests/index.js'
import { useQuestsStore } from '../../stores/quests.js'

const questsStore = useQuestsStore()

const regionGroups = computed(() => {
  return regions.map(region => ({
    id: region.id,
    name: region.name,
    nodes: getNodesByRegion(region.name).map(node => ({
      id: node.id,
      name: node.name,
      type: node.type || 'battle',
      unlocked: questsStore.unlockedNodes.includes(node.id),
      completed: questsStore.completedNodes.includes(node.id)
    }))
  })).filter(r => r.nodes.length > 0)
})

function toggleUnlock(nodeId, currentlyUnlocked) {
  if (currentlyUnlocked) {
    const idx = questsStore.unlockedNodes.indexOf(nodeId)
    if (idx !== -1) questsStore.unlockedNodes.splice(idx, 1)
    // Also remove from completed if locked
    const compIdx = questsStore.completedNodes.indexOf(nodeId)
    if (compIdx !== -1) questsStore.completedNodes.splice(compIdx, 1)
  } else {
    questsStore.unlockedNodes.push(nodeId)
  }
}

function unlockAllInRegion(regionName) {
  const nodes = getNodesByRegion(regionName)
  for (const node of nodes) {
    if (!questsStore.unlockedNodes.includes(node.id)) {
      questsStore.unlockedNodes.push(node.id)
    }
  }
}

function lockAllInRegion(regionName) {
  const nodes = getNodesByRegion(regionName)
  const nodeIds = new Set(nodes.map(n => n.id))
  questsStore.unlockedNodes = questsStore.unlockedNodes.filter(id => !nodeIds.has(id))
  questsStore.completedNodes = questsStore.completedNodes.filter(id => !nodeIds.has(id))
}
</script>

<template>
  <div class="quest-node-list">
    <div v-for="region in regionGroups" :key="region.id" class="region-group">
      <div class="region-header">
        <h3 class="region-name">{{ region.name }}</h3>
        <div class="region-actions">
          <button class="region-btn unlock-all" @click="unlockAllInRegion(region.name)">Unlock All</button>
          <button class="region-btn lock-all" @click="lockAllInRegion(region.name)">Lock All</button>
        </div>
      </div>
      <div class="node-rows">
        <div
          v-for="node in region.nodes"
          :key="node.id"
          :class="['node-row', { unlocked: node.unlocked, completed: node.completed }]"
        >
          <div class="node-info">
            <span class="node-name">{{ node.name }}</span>
            <span class="node-id">{{ node.id }}</span>
            <span v-if="node.type !== 'battle'" class="node-type">{{ node.type }}</span>
          </div>
          <div class="node-status">
            <span v-if="node.completed" class="status-badge completed-badge">Done</span>
            <button
              :class="['toggle-btn', node.unlocked ? 'is-unlocked' : 'is-locked']"
              @click="toggleUnlock(node.id, node.unlocked)"
            >
              {{ node.unlocked ? 'Lock' : 'Unlock' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quest-node-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.region-group {
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.region-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #111827;
  border-bottom: 1px solid #374151;
}

.region-name {
  margin: 0;
  font-size: 0.95rem;
  color: #f3f4f6;
}

.region-actions {
  display: flex;
  gap: 6px;
}

.region-btn {
  padding: 3px 10px;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.unlock-all {
  background: #22c55e;
  color: #111827;
}

.unlock-all:hover {
  background: #16a34a;
}

.lock-all {
  background: #374151;
  color: #9ca3af;
}

.lock-all:hover {
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
  min-width: 0;
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

.node-type {
  font-size: 0.65rem;
  padding: 1px 6px;
  background: #374151;
  border-radius: 3px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.node-status {
  display: flex;
  align-items: center;
  gap: 8px;
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
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  min-width: 60px;
}

.is-locked {
  background: #22c55e;
  color: #111827;
}

.is-locked:hover {
  background: #16a34a;
}

.is-unlocked {
  background: #374151;
  color: #9ca3af;
}

.is-unlocked:hover {
  background: #4b5563;
  color: #f3f4f6;
}
</style>

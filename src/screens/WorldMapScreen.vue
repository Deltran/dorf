<script setup>
import { ref, computed } from 'vue'
import { useQuestsStore, useHeroesStore } from '../stores'
import { regions, getQuestNode } from '../data/questNodes.js'
import { getEnemyTemplate } from '../data/enemyTemplates.js'

const emit = defineEmits(['navigate', 'startBattle'])

const questsStore = useQuestsStore()
const heroesStore = useHeroesStore()

const selectedNode = ref(null)
const selectedRegion = ref(regions[0].id)

const regionNodes = computed(() => {
  const region = regions.find(r => r.id === selectedRegion.value)
  if (!region) return []

  return questsStore.availableNodes
    .filter(node => node.region === region.name)
    .map(node => ({
      ...node,
      isCompleted: questsStore.completedNodes.includes(node.id),
      isUnlocked: questsStore.unlockedNodes.includes(node.id)
    }))
})

const regionProgress = computed(() => {
  return questsStore.regionProgress[selectedRegion.value] || { completed: 0, total: 0 }
})

function selectNode(node) {
  selectedNode.value = node
}

function getNodeEnemies(node) {
  // Get unique enemies from all battles
  const enemyIds = new Set()
  for (const battle of node.battles) {
    for (const enemyId of battle.enemies) {
      enemyIds.add(enemyId)
    }
  }
  return Array.from(enemyIds).map(id => getEnemyTemplate(id))
}

function startQuest() {
  if (!selectedNode.value) return
  if (!heroesStore.partyIsFull && heroesStore.party.filter(Boolean).length === 0) {
    alert('You need at least one hero in your party!')
    return
  }

  // Initialize party state (full HP, 30% MP)
  const partyState = {}
  for (const instanceId of heroesStore.party.filter(Boolean)) {
    const stats = heroesStore.getHeroStats(instanceId)
    partyState[instanceId] = {
      currentHp: stats.hp,
      currentMp: Math.floor(stats.mp * 0.3)
    }
  }

  // Start the quest run
  questsStore.startRun(selectedNode.value.id, partyState)

  // Navigate to battle
  emit('startBattle')
}
</script>

<template>
  <div class="worldmap-screen">
    <header class="worldmap-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        ← Back
      </button>
      <h1>World Map</h1>
      <span class="progress">{{ questsStore.completedNodeCount }} cleared</span>
    </header>

    <nav class="region-tabs">
      <button
        v-for="region in regions"
        :key="region.id"
        :class="['region-tab', { active: selectedRegion === region.id }]"
        @click="selectedRegion = region.id"
      >
        {{ region.name }}
      </button>
    </nav>

    <div class="region-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: (regionProgress.completed / regionProgress.total * 100) + '%' }"
        ></div>
      </div>
      <span>{{ regionProgress.completed }} / {{ regionProgress.total }}</span>
    </div>

    <section class="nodes-list">
      <div
        v-for="node in regionNodes"
        :key="node.id"
        :class="['node-item', { completed: node.isCompleted, selected: selectedNode?.id === node.id }]"
        @click="selectNode(node)"
      >
        <div class="node-status">
          <span v-if="node.isCompleted" class="status-icon">✓</span>
          <span v-else class="status-icon">○</span>
        </div>
        <div class="node-info">
          <h3>{{ node.name }}</h3>
          <p>{{ node.battles.length }} battles</p>
        </div>
        <div class="node-rewards">
          <span class="gem-reward">💎 {{ node.rewards.gems }}</span>
          <span v-if="!node.isCompleted && node.firstClearBonus" class="bonus">
            +{{ node.firstClearBonus.gems }}
          </span>
        </div>
      </div>

      <div v-if="regionNodes.length === 0" class="no-nodes">
        <p>Complete previous regions to unlock this area!</p>
      </div>
    </section>

    <!-- Node Preview Modal -->
    <aside v-if="selectedNode" class="node-preview">
      <div class="preview-header">
        <h2>{{ selectedNode.name }}</h2>
        <button class="close-preview" @click="selectedNode = null">×</button>
      </div>

      <div class="preview-body">
        <div class="battle-count">
          {{ selectedNode.battles.length }} Battles
        </div>

        <div class="enemies-section">
          <h4>Enemies</h4>
          <div class="enemy-list">
            <div
              v-for="enemy in getNodeEnemies(selectedNode)"
              :key="enemy.id"
              class="enemy-preview"
            >
              <span class="enemy-name">{{ enemy.name }}</span>
              <span class="enemy-hp">HP: {{ enemy.stats.hp }}</span>
            </div>
          </div>
        </div>

        <div class="rewards-section">
          <h4>Rewards</h4>
          <div class="rewards-list">
            <div class="reward">
              <span>💎 Gems</span>
              <span>{{ selectedNode.rewards.gems }}</span>
            </div>
            <div class="reward">
              <span>⭐ EXP</span>
              <span>{{ selectedNode.rewards.exp }}</span>
            </div>
            <div v-if="!selectedNode.isCompleted && selectedNode.firstClearBonus" class="reward bonus">
              <span>🎁 First Clear</span>
              <span>+{{ selectedNode.firstClearBonus.gems }} 💎</span>
            </div>
          </div>
        </div>

        <button
          class="start-quest-btn"
          @click="startQuest"
        >
          {{ selectedNode.isCompleted ? 'Replay Quest' : 'Start Quest' }}
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.worldmap-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.worldmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px;
}

.back-button:hover {
  color: #f3f4f6;
}

.worldmap-header h1 {
  font-size: 1.5rem;
  color: #f3f4f6;
  margin: 0;
}

.progress {
  color: #6b7280;
  font-size: 0.9rem;
}

.region-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.region-tab {
  padding: 10px 16px;
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.region-tab.active {
  border-color: #3b82f6;
  color: #f3f4f6;
}

.region-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #22c55e;
  transition: width 0.3s ease;
}

.region-progress span {
  color: #6b7280;
  font-size: 0.85rem;
}

.nodes-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.node-item:hover {
  border-color: #4b5563;
}

.node-item.selected {
  border-color: #3b82f6;
}

.node-item.completed {
  opacity: 0.7;
}

.node-item.completed .status-icon {
  color: #22c55e;
}

.node-status {
  font-size: 1.5rem;
}

.status-icon {
  color: #6b7280;
}

.node-info {
  flex: 1;
}

.node-info h3 {
  color: #f3f4f6;
  margin: 0 0 4px 0;
  font-size: 1rem;
}

.node-info p {
  color: #6b7280;
  margin: 0;
  font-size: 0.85rem;
}

.node-rewards {
  text-align: right;
}

.gem-reward {
  color: #60a5fa;
  font-weight: 600;
}

.bonus {
  display: block;
  font-size: 0.8rem;
  color: #fbbf24;
}

.no-nodes {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.node-preview {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1f2937;
  border-radius: 16px 16px 0 0;
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h2 {
  color: #f3f4f6;
  margin: 0;
}

.close-preview {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
}

.battle-count {
  text-align: center;
  padding: 12px;
  background: #374151;
  border-radius: 8px;
  color: #f3f4f6;
  font-weight: 600;
  margin-bottom: 16px;
}

.enemies-section h4, .rewards-section h4 {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0 0 8px 0;
}

.enemy-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.enemy-preview {
  background: #374151;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.enemy-name {
  color: #f87171;
  font-weight: 500;
  font-size: 0.9rem;
}

.enemy-hp {
  color: #6b7280;
  font-size: 0.75rem;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.reward {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #374151;
  border-radius: 6px;
  color: #f3f4f6;
}

.reward.bonus {
  background: #422006;
  color: #fbbf24;
}

.start-quest-btn {
  width: 100%;
  padding: 16px;
  background: #22c55e;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.start-quest-btn:hover {
  background: #16a34a;
}
</style>

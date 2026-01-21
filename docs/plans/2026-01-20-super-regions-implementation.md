# Super-Regions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add super-region hierarchy (Western Veros, Aquarias) to the world map with smart UI that skips selection when only one is available.

**Architecture:** Add `superRegions` array and `superRegion` property to regions in questNodes.js. Extend quests store with computed properties for super-region progress and unlock state. Create SuperRegionSelect component, integrate into WorldMapScreen with conditional rendering.

**Tech Stack:** Vue 3, Pinia, CSS

---

## Task 1: Add superRegions Data Structure

**Files:**
- Modify: `src/data/questNodes.js:1-5` (imports area)
- Modify: `src/data/questNodes.js:1481-1572` (regions array)

**Step 1: Add superRegions array before regions**

At line ~1479 (before `export const regions`), add:

```js
export const superRegions = [
  {
    id: 'western_veros',
    name: 'Western Veros',
    description: 'The familiar lands where your journey began',
    unlockedByDefault: true
  },
  {
    id: 'aquarias',
    name: 'Aquarias',
    description: 'A realm beneath the waves',
    unlockedByDefault: false,
    unlockCondition: { completedNode: 'aqua_08' }
  }
]
```

**Step 2: Add superRegion property to all 11 existing regions**

Add `superRegion: 'western_veros',` to each region object:
- whispering_woods
- echoing_caverns
- stormwind_peaks
- whisper_lake
- the_summit
- blistering_cliffsides
- janxier_floodplain
- old_fort_calindash
- ancient_catacombs
- underground_morass
- gate_to_aquaria

**Step 3: Add Coral Depths region**

After gate_to_aquaria, add:

```js
{
  id: 'coral_depths',
  name: 'Coral Depths',
  superRegion: 'aquarias',
  startNode: 'coral_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a2a3a'
}
```

**Step 4: Add helper functions**

After `getRegion` function, add:

```js
export function getSuperRegion(superRegionId) {
  return superRegions.find(sr => sr.id === superRegionId) || null
}

export function getRegionsBySuperRegion(superRegionId) {
  return regions.filter(r => r.superRegion === superRegionId)
}
```

**Step 5: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat: add superRegions data structure and Coral Depths region"
```

---

## Task 2: Add Coral Tunnels Quest Node

**Files:**
- Modify: `src/data/questNodes.js` (after aqua_08 node, ~line 1478)

**Step 1: Add coral_01 quest node**

After the aqua_08 node definition, add:

```js
// Coral Depths (Aquarias) - First region of the underwater realm
coral_01: {
  id: 'coral_01',
  name: 'Coral Tunnels',
  region: 'Coral Depths',
  x: 100,
  y: 250,
  battles: [
    { enemies: ['merfolk_warrior', 'merfolk_warrior', 'merfolk_mage'] },
    { enemies: ['sea_serpent', 'sea_serpent', 'coral_golem'] },
    { enemies: ['tide_priest', 'merfolk_warrior', 'merfolk_warrior', 'merfolk_mage'] }
  ],
  connections: [],
  rewards: { gems: 100, gold: 250, exp: 200 },
  firstClearBonus: { gems: 50 },
  itemDrops: [
    { itemId: 'tome_medium', min: 1, max: 2, chance: 0.8 },
    { itemId: 'tome_large', min: 1, max: 1, chance: 0.3 }
  ]
},
```

**Step 2: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat: add Coral Tunnels quest node for Coral Depths region"
```

---

## Task 3: Update Quests Store with Super-Region Support

**Files:**
- Modify: `src/stores/quests.js`

**Step 1: Update imports**

Change line 3 from:
```js
import { getQuestNode, getAllQuestNodes, regions } from '../data/questNodes.js'
```
to:
```js
import { getQuestNode, getAllQuestNodes, regions, superRegions, getRegionsBySuperRegion, getNodesByRegion } from '../data/questNodes.js'
```

**Step 2: Add superRegionProgress computed**

After `regionProgress` computed (around line 62), add:

```js
const superRegionProgress = computed(() => {
  const progress = {}
  for (const sr of superRegions) {
    const srRegions = getRegionsBySuperRegion(sr.id)
    const srNodeIds = srRegions.flatMap(r => getNodesByRegion(r.name).map(n => n.id))
    progress[sr.id] = {
      completed: srNodeIds.filter(id => completedNodes.value.includes(id)).length,
      total: srNodeIds.length
    }
  }
  return progress
})
```

**Step 3: Add unlockedSuperRegions computed**

After `superRegionProgress`, add:

```js
const unlockedSuperRegions = computed(() => {
  return superRegions.filter(sr =>
    sr.unlockedByDefault ||
    (sr.unlockCondition?.completedNode &&
     completedNodes.value.includes(sr.unlockCondition.completedNode))
  )
})
```

**Step 4: Add coral_01 unlock logic in completeRun**

In `completeRun` function, after the existing "Unlock connected nodes" block (around line 153), add:

```js
// Unlock Coral Depths when aqua_08 is completed
if (node.id === 'aqua_08' && !unlockedNodes.value.includes('coral_01')) {
  unlockedNodes.value.push('coral_01')
}
```

**Step 5: Export new computed properties**

In the return statement, add after `regionProgress,`:
```js
superRegionProgress,
unlockedSuperRegions,
```

**Step 6: Commit**

```bash
git add src/stores/quests.js
git commit -m "feat: add super-region progress tracking and unlock logic"
```

---

## Task 4: Create SuperRegionSelect Component

**Files:**
- Create: `src/components/SuperRegionSelect.vue`

**Step 1: Create the component**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  superRegions: {
    type: Array,
    required: true
  },
  unlockedSuperRegions: {
    type: Array,
    required: true
  },
  superRegionProgress: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select', 'back'])

function isUnlocked(superRegionId) {
  return props.unlockedSuperRegions.some(sr => sr.id === superRegionId)
}

function getProgress(superRegionId) {
  return props.superRegionProgress[superRegionId] || { completed: 0, total: 0 }
}

function getUnlockHint(superRegion) {
  if (!superRegion.unlockCondition?.completedNode) return null
  return `Complete ${superRegion.unlockCondition.completedNode} to unlock`
}
</script>

<template>
  <div class="super-region-select">
    <header class="select-header">
      <button class="back-button" @click="emit('back')">
        <span class="back-arrow">&larr;</span>
        <span>Back</span>
      </button>
      <h1 class="page-title">Select Region</h1>
      <div class="spacer"></div>
    </header>

    <div class="cards-container">
      <button
        v-for="sr in superRegions"
        :key="sr.id"
        :class="['super-region-card', { locked: !isUnlocked(sr.id) }]"
        :disabled="!isUnlocked(sr.id)"
        @click="isUnlocked(sr.id) && emit('select', sr.id)"
      >
        <div class="card-background" :data-region="sr.id"></div>
        <div class="card-overlay"></div>
        <div class="card-content">
          <h2 class="card-title">{{ sr.name }}</h2>
          <p class="card-description">{{ sr.description }}</p>
          <div v-if="isUnlocked(sr.id)" class="card-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: (getProgress(sr.id).total > 0 ? getProgress(sr.id).completed / getProgress(sr.id).total * 100 : 0) + '%' }"
              ></div>
            </div>
            <span class="progress-text">
              {{ getProgress(sr.id).completed }} / {{ getProgress(sr.id).total }} cleared
            </span>
          </div>
          <div v-else class="locked-overlay">
            <span class="lock-icon">🔒</span>
            <span class="unlock-hint">{{ getUnlockHint(sr) }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.super-region-select {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.select-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.back-arrow {
  font-size: 1.1rem;
}

.page-title {
  font-size: 1.5rem;
  color: #f1f5f9;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.spacer {
  width: 80px;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  flex: 1;
  align-items: center;
}

.super-region-card {
  position: relative;
  width: 100%;
  max-width: 350px;
  min-height: 200px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: none;
  padding: 0;
  text-align: left;
}

.super-region-card:not(.locked):hover {
  border-color: #fbbf24;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.super-region-card.locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.card-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.card-background[data-region="western_veros"] {
  background: linear-gradient(135deg, #1a2f1a 0%, #2d4a2d 100%);
}

.card-background[data-region="aquarias"] {
  background: linear-gradient(135deg, #0a2a3a 0%, #1a4a5a 100%);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.7) 100%);
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.card-title {
  color: #f3f4f6;
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.card-description {
  color: #9ca3af;
  font-size: 0.95rem;
  margin: 0 0 auto 0;
  line-height: 1.4;
}

.card-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  color: #9ca3af;
  font-size: 0.85rem;
}

.locked-overlay {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.lock-icon {
  font-size: 1.5rem;
}

.unlock-hint {
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
}

@media (min-width: 768px) {
  .super-region-card {
    width: calc(50% - 10px);
  }
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/SuperRegionSelect.vue
git commit -m "feat: create SuperRegionSelect component"
```

---

## Task 5: Integrate Super-Region Selection into WorldMapScreen

**Files:**
- Modify: `src/screens/WorldMapScreen.vue`

**Step 1: Update imports**

Change line 5 from:
```js
import { regions, getQuestNode, getNodesByRegion, getRegion } from '../data/questNodes.js'
```
to:
```js
import { regions, superRegions, getQuestNode, getNodesByRegion, getRegion, getRegionsBySuperRegion } from '../data/questNodes.js'
```

Add after MapCanvas import:
```js
import SuperRegionSelect from '../components/SuperRegionSelect.vue'
```

**Step 2: Add super-region state and computed properties**

After `const selectedRegion = ref(regions[0].id)` (line 16), add:

```js
const selectedSuperRegion = ref(null)

// Check if we should show super-region selection
const showSuperRegionSelect = computed(() => {
  return questsStore.unlockedSuperRegions.length > 1
})

// Auto-select super-region if only one is unlocked
watchEffect(() => {
  if (questsStore.unlockedSuperRegions.length === 1) {
    selectedSuperRegion.value = questsStore.unlockedSuperRegions[0].id
  } else if (questsStore.unlockedSuperRegions.length > 1 && !selectedSuperRegion.value) {
    // Multiple unlocked but none selected - show selection screen
    selectedSuperRegion.value = null
  }
})

// Filter regions by selected super-region
const filteredRegions = computed(() => {
  if (!selectedSuperRegion.value) return []
  return getRegionsBySuperRegion(selectedSuperRegion.value)
})
```

Add `watchEffect` to imports at top:
```js
import { ref, computed, watch, watchEffect } from 'vue'
```

**Step 3: Update selectedRegion watcher**

Change the watch on selectedRegion to also reset when super-region changes:
```js
// Clear selection when changing regions or super-regions
watch([selectedRegion, selectedSuperRegion], () => {
  selectedNode.value = null
})

// Reset to first region when super-region changes
watch(selectedSuperRegion, (newSuperRegion) => {
  if (newSuperRegion) {
    const srRegions = getRegionsBySuperRegion(newSuperRegion)
    if (srRegions.length > 0) {
      selectedRegion.value = srRegions[0].id
    }
  }
})
```

**Step 4: Add function to go back to super-region select**

After `startQuest` function:
```js
function goToSuperRegionSelect() {
  selectedSuperRegion.value = null
  selectedNode.value = null
}
```

**Step 5: Update template**

Replace the entire `<template>` section:

```vue
<template>
  <div class="worldmap-screen">
    <!-- Animated Background -->
    <div class="bg-layer">
      <div class="bg-gradient"></div>
      <div class="bg-pattern"></div>
      <div class="bg-vignette"></div>
    </div>

    <!-- Super-Region Selection -->
    <SuperRegionSelect
      v-if="showSuperRegionSelect && !selectedSuperRegion"
      :super-regions="superRegions"
      :unlocked-super-regions="questsStore.unlockedSuperRegions"
      :super-region-progress="questsStore.superRegionProgress"
      @select="selectedSuperRegion = $event"
      @back="emit('navigate', 'home')"
    />

    <!-- Region Content -->
    <div v-else class="content">
      <header class="worldmap-header">
        <button class="back-button" @click="showSuperRegionSelect ? goToSuperRegionSelect() : emit('navigate', 'home')">
          <span class="back-arrow">&larr;</span>
          <span>{{ showSuperRegionSelect ? 'Regions' : 'Back' }}</span>
        </button>
        <h1 class="page-title">{{ selectedSuperRegion ? superRegions.find(sr => sr.id === selectedSuperRegion)?.name : 'World Map' }}</h1>
        <div class="cleared-badge">
          <span class="cleared-icon">🏆</span>
          <span class="cleared-count">{{ questsStore.completedNodeCount }}</span>
        </div>
      </header>

      <nav class="region-tabs">
        <button
          v-for="region in filteredRegions"
          :key="region.id"
          :class="['region-tab', { active: selectedRegion === region.id }]"
          :style="getRegionBackground(region) ? { backgroundImage: `url(${getRegionBackground(region)})` } : {}"
          @click="selectedRegion = region.id"
        >
          <div class="region-tab-overlay"></div>
          <span class="region-tab-label">{{ region.name }}</span>
        </button>
      </nav>

      <div class="region-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: (regionProgress.total > 0 ? regionProgress.completed / regionProgress.total * 100 : 0) + '%' }"
          ></div>
          <div class="progress-shine"></div>
        </div>
        <span class="progress-text">{{ regionProgress.completed }} / {{ regionProgress.total }} cleared</span>
      </div>

      <!-- Map Canvas -->
      <section class="map-section">
        <MapCanvas
          v-if="currentRegion"
          :region="currentRegion"
          :nodes="currentRegionNodes"
          :unlocked-nodes="questsStore.unlockedNodes"
          :completed-nodes="questsStore.completedNodes"
          :selected-node-id="selectedNode?.id"
          @select-node="selectNode"
        />
      </section>
    </div>

    <!-- Node Preview Modal -->
    <Transition name="slide-up">
      <aside v-if="selectedNode" class="node-preview">
        <div class="preview-handle"></div>

        <div class="preview-header">
          <div class="preview-title-area">
            <h2>{{ selectedNode.name }}</h2>
            <span v-if="selectedNode.isCompleted" class="completed-badge">Cleared</span>
          </div>
          <button class="close-preview" @click="clearSelection">×</button>
        </div>

        <div class="preview-body">
          <div class="battle-count-card">
            <span class="battle-count-icon">⚔️</span>
            <span class="battle-count-text">{{ selectedNode.battles.length }} Battles</span>
          </div>

          <div class="enemies-section">
            <h4 class="section-label">
              <span class="label-line"></span>
              <span>Enemies</span>
              <span class="label-line"></span>
            </h4>
            <div class="enemy-list">
              <div
                v-for="enemy in getNodeEnemies(selectedNode)"
                :key="enemy.id"
                class="enemy-preview"
              >
                <span class="enemy-name">{{ enemy.name }}</span>
                <div class="enemy-stats">
                  <span class="enemy-hp">❤️ {{ enemy.stats.hp }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="rewards-section">
            <h4 class="section-label">
              <span class="label-line"></span>
              <span>Rewards</span>
              <span class="label-line"></span>
            </h4>
            <div class="rewards-grid">
              <div class="reward-card">
                <span class="reward-icon">💎</span>
                <div class="reward-info">
                  <span class="reward-label">Gems</span>
                  <span class="reward-value">
                    {{ selectedNode.rewards.gems }}
                    <span
                      v-if="!selectedNode.isCompleted && selectedNode.firstClearBonus"
                      class="first-clear-bonus-badge"
                    >+{{ selectedNode.firstClearBonus.gems }} first time bonus!</span>
                  </span>
                </div>
              </div>
              <div v-if="selectedNode.rewards.gold" class="reward-card">
                <span class="reward-icon">🪙</span>
                <div class="reward-info">
                  <span class="reward-label">Gold</span>
                  <span class="reward-value gold">{{ selectedNode.rewards.gold }}</span>
                </div>
              </div>
              <div class="reward-card">
                <span class="reward-icon">⭐</span>
                <div class="reward-info">
                  <span class="reward-label">EXP</span>
                  <span class="reward-value">{{ selectedNode.rewards.exp }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="start-quest-btn"
            @click="startQuest"
          >
            <span class="btn-icon">⚔️</span>
            <span>{{ selectedNode.isCompleted ? 'Replay Quest' : 'Start Quest' }}</span>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Backdrop for modal -->
    <Transition name="fade">
      <div v-if="selectedNode" class="modal-backdrop" @click="clearSelection"></div>
    </Transition>
  </div>
</template>
```

**Step 6: Commit**

```bash
git add src/screens/WorldMapScreen.vue
git commit -m "feat: integrate super-region selection into WorldMapScreen"
```

---

## Task 6: Manual Testing Checklist

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Test with fresh state (only Western Veros unlocked)**

- [ ] Navigate to World Map
- [ ] Should skip super-region selection and go directly to region tabs
- [ ] Back button should go to home
- [ ] All existing regions should be visible and functional

**Step 3: Test with Aquarias unlocked (simulate by editing localStorage or completing aqua_08)**

In browser console:
```js
// Simulate completing aqua_08 to unlock Aquarias
const state = JSON.parse(localStorage.getItem('dorf-state'))
if (!state.quests.completedNodes.includes('aqua_08')) {
  state.quests.completedNodes.push('aqua_08')
}
if (!state.quests.unlockedNodes.includes('coral_01')) {
  state.quests.unlockedNodes.push('coral_01')
}
localStorage.setItem('dorf-state', JSON.stringify(state))
location.reload()
```

- [ ] Navigate to World Map
- [ ] Should show super-region selection screen with two cards
- [ ] Western Veros card shows progress and is clickable
- [ ] Aquarias card shows progress and is clickable
- [ ] Clicking Western Veros shows its regions
- [ ] Back button returns to super-region selection
- [ ] Clicking Aquarias shows Coral Depths region
- [ ] Coral Tunnels node is visible and playable

**Step 4: Test locked state display**

Reset localStorage to fresh state and verify:
- [ ] Aquarias card shows locked with lock icon
- [ ] Aquarias card shows "Complete aqua_08 to unlock" hint
- [ ] Aquarias card is not clickable

**Step 5: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: address issues found during testing"
```

---

## Task 7: Final Cleanup and PR

**Step 1: Run linter (if available)**

```bash
npm run lint
```

Fix any issues.

**Step 2: Build check**

```bash
npm run build
```

Ensure no build errors.

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "chore: cleanup and lint fixes"
```

**Step 4: Push and create PR**

```bash
git push -u origin feature/super-regions
```

Create PR with summary from design doc.

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add superRegions data structure | questNodes.js |
| 2 | Add Coral Tunnels quest node | questNodes.js |
| 3 | Update quests store | quests.js |
| 4 | Create SuperRegionSelect component | SuperRegionSelect.vue |
| 5 | Integrate into WorldMapScreen | WorldMapScreen.vue |
| 6 | Manual testing | - |
| 7 | Cleanup and PR | - |

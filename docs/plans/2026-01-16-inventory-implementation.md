# Inventory System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an inventory system with XP items that can be applied to heroes and junk items that can be sold for gems.

**Architecture:** New inventory store manages item counts as a simple map. Items are defined in a data file with type-specific properties. Quest completion rolls for item drops and displays them on the victory screen. Two entry points for using items: from hero detail panel or from new inventory screen.

**Tech Stack:** Vue 3 (Composition API), Pinia stores, Vite

---

## Task 1: Item Data Definitions

**Files:**
- Create: `src/data/items.js`

**Step 1: Create item definitions file**

```js
// src/data/items.js

export const items = {
  tome_small: {
    id: 'tome_small',
    name: 'Faded Tome',
    description: 'A worn book of basic knowledge.',
    type: 'xp',
    rarity: 1,
    xpValue: 50,
    sellReward: { gems: 10 }
  },
  tome_medium: {
    id: 'tome_medium',
    name: 'Knowledge Tome',
    description: 'A well-preserved collection of teachings.',
    type: 'xp',
    rarity: 2,
    xpValue: 200,
    sellReward: { gems: 40 }
  },
  tome_large: {
    id: 'tome_large',
    name: 'Ancient Codex',
    description: 'Centuries of wisdom bound in leather.',
    type: 'xp',
    rarity: 3,
    xpValue: 500,
    sellReward: { gems: 100 }
  },
  useless_rock: {
    id: 'useless_rock',
    name: 'Useless Rock',
    description: "It's a rock. Completely useless.",
    type: 'junk',
    rarity: 1,
    sellReward: { gems: 5 }
  },
  shiny_pebble: {
    id: 'shiny_pebble',
    name: 'Shiny Pebble',
    description: 'At least it sparkles a little.',
    type: 'junk',
    rarity: 1,
    sellReward: { gems: 8 }
  },
  goblin_trinket: {
    id: 'goblin_trinket',
    name: 'Goblin Trinket',
    description: 'A crude charm made from bone and string.',
    type: 'junk',
    rarity: 2,
    sellReward: { gems: 15 }
  }
}

export function getItem(itemId) {
  return items[itemId] || null
}

export function getAllItems() {
  return Object.values(items)
}

export function getItemsByType(type) {
  return Object.values(items).filter(item => item.type === type)
}
```

**Step 2: Verify file loads without errors**

Run: `cd /home/deltran/code/dorf/.worktrees/inventory && /home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/data/items.js
git commit -m "feat(inventory): add item data definitions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Inventory Store

**Files:**
- Create: `src/stores/inventory.js`
- Modify: `src/stores/index.js`

**Step 1: Create inventory store**

```js
// src/stores/inventory.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getItem } from '../data/items.js'
import { useGachaStore } from './gacha.js'

export const useInventoryStore = defineStore('inventory', () => {
  // State - items stored as { itemId: count }
  const items = ref({})

  // Getters
  const itemList = computed(() => {
    return Object.entries(items.value)
      .filter(([_, count]) => count > 0)
      .map(([itemId, count]) => ({
        ...getItem(itemId),
        count
      }))
      .sort((a, b) => {
        // Sort by type (xp first), then rarity (desc), then name
        if (a.type !== b.type) {
          return a.type === 'xp' ? -1 : 1
        }
        if (a.rarity !== b.rarity) {
          return b.rarity - a.rarity
        }
        return a.name.localeCompare(b.name)
      })
  })

  const totalItemCount = computed(() =>
    Object.values(items.value).reduce((sum, count) => sum + count, 0)
  )

  const xpItemCount = computed(() => {
    return itemList.value
      .filter(item => item.type === 'xp')
      .reduce((sum, item) => sum + item.count, 0)
  })

  // Actions
  function addItem(itemId, count = 1) {
    const item = getItem(itemId)
    if (!item) {
      console.warn(`Unknown item: ${itemId}`)
      return false
    }
    items.value[itemId] = (items.value[itemId] || 0) + count
    return true
  }

  function removeItem(itemId, count = 1) {
    if ((items.value[itemId] || 0) < count) return false
    items.value[itemId] -= count
    if (items.value[itemId] <= 0) {
      delete items.value[itemId]
    }
    return true
  }

  function getItemCount(itemId) {
    return items.value[itemId] || 0
  }

  function sellItem(itemId, count = 1) {
    const item = getItem(itemId)
    if (!item?.sellReward) return false
    if (!removeItem(itemId, count)) return false

    const reward = item.sellReward
    const gachaStore = useGachaStore()

    if (reward.gems) {
      gachaStore.addGems(reward.gems * count)
    }
    if (reward.items) {
      for (const r of reward.items) {
        addItem(r.itemId, r.count * count)
      }
    }

    return true
  }

  // Persistence
  function saveState() {
    return { items: items.value }
  }

  function loadState(savedState) {
    if (savedState.items) items.value = savedState.items
  }

  return {
    // State
    items,
    // Getters
    itemList,
    totalItemCount,
    xpItemCount,
    // Actions
    addItem,
    removeItem,
    getItemCount,
    sellItem,
    // Persistence
    saveState,
    loadState
  }
})
```

**Step 2: Export from stores index**

In `src/stores/index.js`, add the export:

```js
export { useHeroesStore } from './heroes.js'
export { useGachaStore } from './gacha.js'
export { useQuestsStore } from './quests.js'
export { useBattleStore, BattleState } from './battle.js'
export { useInventoryStore } from './inventory.js'
```

**Step 3: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/stores/inventory.js src/stores/index.js
git commit -m "feat(inventory): add inventory store with persistence

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Integrate Inventory with Persistence

**Files:**
- Modify: `src/utils/storage.js`
- Modify: `src/App.vue`

**Step 1: Update storage.js to handle inventory**

In `src/utils/storage.js`, update `saveGame` and `loadGame`:

```js
const SAVE_KEY = 'dorf_save'
const SAVE_VERSION = 2  // Bump version for inventory addition

export function saveGame(stores) {
  const { heroes, gacha, quests, inventory } = stores

  const saveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    heroes: heroes.saveState(),
    gacha: gacha.saveState(),
    quests: quests.saveState(),
    inventory: inventory?.saveState() || { items: {} }
  }

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
    return true
  } catch (e) {
    console.error('Failed to save game:', e)
    return false
  }
}

export function loadGame(stores) {
  const { heroes, gacha, quests, inventory } = stores

  try {
    const saved = localStorage.getItem(SAVE_KEY)
    if (!saved) return false

    const saveData = JSON.parse(saved)

    // Version check for future migrations
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: ${saveData.version} vs ${SAVE_VERSION}`)
      // Could add migration logic here
    }

    if (saveData.heroes) heroes.loadState(saveData.heroes)
    if (saveData.gacha) gacha.loadState(saveData.gacha)
    if (saveData.quests) quests.loadState(saveData.quests)
    if (saveData.inventory && inventory) inventory.loadState(saveData.inventory)

    return true
  } catch (e) {
    console.error('Failed to load game:', e)
    return false
  }
}
```

**Step 2: Update App.vue to use inventory store**

In `src/App.vue`, add inventory store to imports and save/load:

```vue
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore } from './stores'
import { saveGame, loadGame, hasSaveData } from './utils/storage.js'

import HomeScreen from './screens/HomeScreen.vue'
import GachaScreen from './screens/GachaScreen.vue'
import HeroesScreen from './screens/HeroesScreen.vue'
import WorldMapScreen from './screens/WorldMapScreen.vue'
import BattleScreen from './screens/BattleScreen.vue'
import InventoryScreen from './screens/InventoryScreen.vue'

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const questsStore = useQuestsStore()
const inventoryStore = useInventoryStore()

const currentScreen = ref('home')
const isLoaded = ref(false)

// Load game on mount
onMounted(() => {
  const hasData = hasSaveData()

  if (hasData) {
    loadGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore })
  } else {
    // New player: give them a starter hero
    initNewPlayer()
  }

  isLoaded.value = true
})

function initNewPlayer() {
  // Give the player a guaranteed 3-star hero to start
  heroesStore.addHero('town_guard')
  heroesStore.autoFillParty()
}

// Auto-save when relevant state changes
watch(
  () => [
    heroesStore.collection.length,
    heroesStore.party,
    gachaStore.gems,
    gachaStore.totalPulls,
    questsStore.completedNodes.length,
    inventoryStore.totalItemCount
  ],
  () => {
    if (isLoaded.value) {
      saveGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore })
    }
  },
  { deep: true }
)

function navigate(screen) {
  currentScreen.value = screen
}

function startBattle() {
  currentScreen.value = 'battle'
}
</script>

<template>
  <div class="app">
    <template v-if="isLoaded">
      <HomeScreen
        v-if="currentScreen === 'home'"
        @navigate="navigate"
      />
      <GachaScreen
        v-else-if="currentScreen === 'gacha'"
        @navigate="navigate"
      />
      <HeroesScreen
        v-else-if="currentScreen === 'heroes'"
        @navigate="navigate"
      />
      <WorldMapScreen
        v-else-if="currentScreen === 'worldmap'"
        @navigate="navigate"
        @startBattle="startBattle"
      />
      <BattleScreen
        v-else-if="currentScreen === 'battle'"
        @navigate="navigate"
      />
      <InventoryScreen
        v-else-if="currentScreen === 'inventory'"
        @navigate="navigate"
      />
    </template>

    <div v-else class="loading">
      <p>Loading...</p>
    </div>
  </div>
</template>
```

Note: InventoryScreen doesn't exist yet - we'll create it in a later task. The build will fail until then, but that's expected.

**Step 3: Commit storage changes**

```bash
git add src/utils/storage.js src/App.vue
git commit -m "feat(inventory): integrate inventory with persistence

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Add useXpItem to Heroes Store

**Files:**
- Modify: `src/stores/heroes.js`

**Step 1: Add useXpItem function**

In `src/stores/heroes.js`, add the import and function:

At the top, add import:
```js
import { getItem } from '../data/items.js'
```

Before the return statement, add:
```js
function useXpItem(instanceId, itemId) {
  // Import here to avoid circular dependency
  const { useInventoryStore } = require('./inventory.js')
  const inventoryStore = useInventoryStore()

  const item = getItem(itemId)
  if (!item || item.type !== 'xp') return { success: false, reason: 'invalid_item' }
  if (!inventoryStore.removeItem(itemId)) return { success: false, reason: 'no_item' }

  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) {
    inventoryStore.addItem(itemId) // refund
    return { success: false, reason: 'hero_not_found' }
  }

  const oldLevel = hero.level
  addExp(instanceId, item.xpValue)
  const newLevel = hero.level

  return {
    success: true,
    xpGained: item.xpValue,
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel
  }
}
```

Add `useXpItem` to the return statement.

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds (InventoryScreen import will fail - that's expected for now)

**Step 3: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat(inventory): add useXpItem action to heroes store

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Item Drops to Quest Nodes

**Files:**
- Modify: `src/data/questNodes.js`

**Step 1: Add itemDrops to quest nodes**

Add `itemDrops` arrays to quest nodes. Here are the first few nodes as examples - add similar drops to all nodes:

```js
forest_01: {
  id: 'forest_01',
  name: 'Dark Thicket',
  region: 'Whispering Woods',
  x: 100,
  y: 320,
  battles: [
    { enemies: ['goblin_scout', 'goblin_scout'] },
    { enemies: ['goblin_scout', 'forest_wolf'] }
  ],
  connections: ['forest_02'],
  rewards: { gems: 50, exp: 80 },
  firstClearBonus: { gems: 30 },
  itemDrops: [
    { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
    { itemId: 'useless_rock', min: 1, max: 1, chance: 0.3 }
  ]
},
forest_02: {
  id: 'forest_02',
  name: 'Wolf Den',
  region: 'Whispering Woods',
  x: 280,
  y: 250,
  battles: [
    { enemies: ['forest_wolf', 'forest_wolf'] },
    { enemies: ['forest_wolf', 'goblin_scout', 'goblin_scout'] },
    { enemies: ['dire_wolf'] }
  ],
  connections: ['forest_03', 'forest_04'],
  rewards: { gems: 60, exp: 120 },
  firstClearBonus: { gems: 40 },
  itemDrops: [
    { itemId: 'tome_small', min: 1, max: 3, chance: 1.0 },
    { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.25 }
  ]
},
```

Continue adding `itemDrops` to all nodes. Pattern:
- Early nodes: tome_small + junk
- Mid nodes: tome_small/tome_medium + better junk
- Late nodes: tome_medium/tome_large + rare junk
- Higher chance for better items in harder nodes

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat(inventory): add item drops to quest nodes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Add Item Drop Rolling to Quests Store

**Files:**
- Modify: `src/stores/quests.js`

**Step 1: Add rollItemDrops function and update completeRun**

At the top, add import:
```js
import { useInventoryStore } from './inventory.js'
```

Add the rollItemDrops function:
```js
function rollItemDrops(node) {
  const drops = []
  for (const drop of node.itemDrops || []) {
    if (Math.random() > drop.chance) continue
    const count = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min
    drops.push({ itemId: drop.itemId, count })
  }
  return drops
}
```

Update `completeRun` to roll and grant items:
```js
function completeRun() {
  if (!currentRun.value) return null

  const node = getQuestNode(currentRun.value.nodeId)
  if (!node) return null

  const isFirstClear = !completedNodes.value.includes(node.id)

  // Mark as completed
  if (!completedNodes.value.includes(node.id)) {
    completedNodes.value.push(node.id)
  }

  // Unlock connected nodes
  for (const connectedId of node.connections) {
    if (!unlockedNodes.value.includes(connectedId)) {
      unlockedNodes.value.push(connectedId)
    }
  }

  // Roll item drops
  const itemDrops = rollItemDrops(node)

  // Grant items
  const inventoryStore = useInventoryStore()
  for (const drop of itemDrops) {
    inventoryStore.addItem(drop.itemId, drop.count)
  }

  // Calculate rewards
  const rewards = {
    gems: node.rewards.gems,
    exp: node.rewards.exp,
    isFirstClear,
    items: itemDrops
  }

  if (isFirstClear && node.firstClearBonus) {
    rewards.gems += node.firstClearBonus.gems || 0
    rewards.exp += node.firstClearBonus.exp || 0
  }

  // Clear current run
  currentRun.value = null

  return rewards
}
```

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/stores/quests.js
git commit -m "feat(inventory): roll and grant item drops on quest completion

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create ItemCard Component

**Files:**
- Create: `src/components/ItemCard.vue`

**Step 1: Create ItemCard component**

```vue
<script setup>
import { computed } from 'vue'
import StarRating from './StarRating.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  showCount: {
    type: Boolean,
    default: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const rarityClass = computed(() => `rarity-${props.item.rarity || 1}`)

const typeIcon = computed(() => {
  switch (props.item.type) {
    case 'xp': return '📖'
    case 'junk': return '🪨'
    case 'material': return '💎'
    default: return '📦'
  }
})
</script>

<template>
  <div
    :class="['item-card', rarityClass, { selected, compact }]"
    @click="emit('click', item)"
  >
    <div class="card-header">
      <span class="type-icon">{{ typeIcon }}</span>
      <span v-if="showCount && item.count" class="item-count">×{{ item.count }}</span>
    </div>

    <div class="card-body">
      <div class="item-name">{{ item.name }}</div>
      <StarRating :rating="item.rarity || 1" size="sm" />
    </div>

    <div v-if="!compact" class="card-footer">
      <div v-if="item.type === 'xp'" class="item-value xp">
        +{{ item.xpValue }} XP
      </div>
      <div v-else-if="item.sellReward?.gems" class="item-value sell">
        {{ item.sellReward.gems }} 💎
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-card {
  background: #1f2937;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  min-width: 100px;
  user-select: none;
}

.item-card.compact {
  padding: 8px;
  min-width: 80px;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.item-card.selected {
  border-color: #3b82f6;
}

/* Rarity borders and backgrounds */
.rarity-1 { border-left: 3px solid #9ca3af; background: linear-gradient(135deg, #1f2937 0%, #262d36 100%); }
.rarity-2 { border-left: 3px solid #22c55e; background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%); }
.rarity-3 { border-left: 3px solid #3b82f6; background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%); }
.rarity-4 { border-left: 3px solid #a855f7; background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%); }
.rarity-5 { border-left: 3px solid #f59e0b; background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.type-icon {
  font-size: 1.4rem;
}

.compact .type-icon {
  font-size: 1.1rem;
}

.item-count {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-body {
  text-align: center;
}

.item-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.compact .item-name {
  font-size: 0.75rem;
}

.card-footer {
  margin-top: 8px;
  text-align: center;
}

.item-value {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.item-value.xp {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.2);
}

.item-value.sell {
  color: #9ca3af;
}
</style>
```

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/ItemCard.vue
git commit -m "feat(inventory): add ItemCard component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Display Item Drops on Victory Screen

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Add item drop display to victory modal**

Import ItemCard and getItem:
```js
import ItemCard from '../components/ItemCard.vue'
import { getItem } from '../data/items.js'
```

Add computed for item drops with reveal animation:
```js
const revealedItemCount = ref(0)

const itemDropsWithData = computed(() => {
  if (!rewards.value?.items) return []
  return rewards.value.items.map(drop => ({
    ...getItem(drop.itemId),
    count: drop.count
  }))
})
```

In the `handleVictory` function, after setting `showVictoryModal.value = true`:
```js
// Reveal items sequentially
revealedItemCount.value = 0
if (rewards.value?.items?.length > 0) {
  const revealNext = () => {
    if (revealedItemCount.value < rewards.value.items.length) {
      revealedItemCount.value++
      setTimeout(revealNext, 200)
    }
  }
  setTimeout(revealNext, 800) // Start after gems/exp animate
}
```

In the template, add item drops section to victory modal (after rewards div, before victory-party):
```vue
<div v-if="itemDropsWithData.length > 0" class="item-drops">
  <div class="drops-header">Items Found</div>
  <div class="drops-grid">
    <div
      v-for="(item, index) in itemDropsWithData"
      :key="item.id"
      :class="['drop-item', { revealed: index < revealedItemCount }]"
    >
      <ItemCard :item="item" compact />
    </div>
  </div>
</div>
```

Add styles:
```css
.item-drops {
  margin-bottom: 20px;
}

.drops-header {
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.drops-grid {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drop-item {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

.drop-item.revealed {
  opacity: 1;
  transform: scale(1);
  animation: itemPop 0.3s ease;
}

@keyframes itemPop {
  0% { transform: scale(0.5); }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat(inventory): display item drops on victory screen

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create InventoryScreen

**Files:**
- Create: `src/screens/InventoryScreen.vue`

**Step 1: Create the inventory screen**

```vue
<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore, useGachaStore } from '../stores'
import ItemCard from '../components/ItemCard.vue'
import StarRating from '../components/StarRating.vue'

const emit = defineEmits(['navigate'])

const inventoryStore = useInventoryStore()
const gachaStore = useGachaStore()

const selectedItem = ref(null)
const sellCount = ref(1)

const items = computed(() => inventoryStore.itemList)

function selectItem(item) {
  selectedItem.value = item
  sellCount.value = 1
}

function closeDetail() {
  selectedItem.value = null
}

function sellSelected() {
  if (!selectedItem.value) return
  const success = inventoryStore.sellItem(selectedItem.value.id, sellCount.value)
  if (success) {
    // Update selected item's count or close if sold all
    const remaining = inventoryStore.getItemCount(selectedItem.value.id)
    if (remaining <= 0) {
      selectedItem.value = null
    } else {
      // Refresh selected item data
      selectedItem.value = {
        ...selectedItem.value,
        count: remaining
      }
      sellCount.value = Math.min(sellCount.value, remaining)
    }
  }
}

function incrementSellCount() {
  if (selectedItem.value && sellCount.value < selectedItem.value.count) {
    sellCount.value++
  }
}

function decrementSellCount() {
  if (sellCount.value > 1) {
    sellCount.value--
  }
}

function sellAll() {
  if (selectedItem.value) {
    sellCount.value = selectedItem.value.count
    sellSelected()
  }
}

const sellValue = computed(() => {
  if (!selectedItem.value?.sellReward?.gems) return 0
  return selectedItem.value.sellReward.gems * sellCount.value
})
</script>

<template>
  <div class="inventory-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="inventory-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Inventory</h1>
      <div class="gem-display">
        <span class="gem-icon">💎</span>
        <span class="gem-count">{{ gachaStore.gems }}</span>
      </div>
    </header>

    <div class="item-count-badge">
      <span class="count-value">{{ inventoryStore.totalItemCount }}</span>
      <span class="count-label">items</span>
    </div>

    <!-- Empty State -->
    <section v-if="items.length === 0" class="empty-inventory">
      <div class="empty-icon">📦</div>
      <p>No items yet!</p>
      <p class="empty-hint">Complete quests to find items.</p>
      <button class="quest-cta" @click="emit('navigate', 'worldmap')">
        <span>Go to Quests</span>
      </button>
    </section>

    <!-- Item Grid -->
    <section v-else class="inventory-grid">
      <ItemCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        :selected="selectedItem?.id === item.id"
        @click="selectItem(item)"
      />
    </section>

    <!-- Detail Backdrop -->
    <div
      v-if="selectedItem"
      class="detail-backdrop"
      @click="closeDetail"
    ></div>

    <!-- Item Detail Panel -->
    <aside v-if="selectedItem" :class="['item-detail', `rarity-${selectedItem.rarity}`]">
      <div class="detail-header">
        <div class="header-info">
          <h3>{{ selectedItem.name }}</h3>
          <StarRating :rating="selectedItem.rarity" />
        </div>
        <button class="close-detail" @click="closeDetail">×</button>
      </div>

      <div class="detail-body">
        <p class="item-description">{{ selectedItem.description }}</p>

        <div class="item-stats">
          <div class="stat-row">
            <span class="stat-label">Owned</span>
            <span class="stat-value">{{ selectedItem.count }}</span>
          </div>
          <div v-if="selectedItem.type === 'xp'" class="stat-row">
            <span class="stat-label">XP Value</span>
            <span class="stat-value xp">+{{ selectedItem.xpValue }}</span>
          </div>
          <div v-if="selectedItem.sellReward?.gems" class="stat-row">
            <span class="stat-label">Sell Value</span>
            <span class="stat-value sell">{{ selectedItem.sellReward.gems }} 💎</span>
          </div>
        </div>

        <div class="detail-actions">
          <div v-if="selectedItem.type === 'xp'" class="action-hint">
            Use from Heroes screen
          </div>

          <div class="sell-section">
            <div class="sell-count-control">
              <button class="count-btn" @click="decrementSellCount" :disabled="sellCount <= 1">−</button>
              <span class="count-display">{{ sellCount }}</span>
              <button class="count-btn" @click="incrementSellCount" :disabled="sellCount >= selectedItem.count">+</button>
            </div>
            <button class="sell-btn" @click="sellSelected">
              Sell for {{ sellValue }} 💎
            </button>
            <button v-if="selectedItem.count > 1" class="sell-all-btn" @click="sellAll">
              Sell All ({{ selectedItem.count }})
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Base Layout */
.inventory-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

/* Animated Background (same as HeroesScreen) */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e3a5f 25%,
    #1e1b4b 50%,
    #1e3a5f 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.gem-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #334155;
}

.gem-icon {
  font-size: 1.1rem;
}

.gem-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #60a5fa;
}

.item-count-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  background: rgba(30, 41, 59, 0.6);
  padding: 8px 16px;
  border-radius: 8px;
  position: relative;
  z-index: 1;
}

.count-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.count-label {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Empty State */
.empty-inventory {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border-radius: 16px;
  border: 1px solid #334155;
  position: relative;
  z-index: 1;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-inventory p {
  color: #9ca3af;
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 0.9rem;
  margin-bottom: 20px !important;
}

.quest-cta {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.quest-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

/* Item Grid */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  position: relative;
  z-index: 1;
}

/* Detail Panel */
.detail-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.item-detail {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px 20px 0 0;
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  animation: slideUp 0.3s ease;
  border: 1px solid #334155;
  border-bottom: none;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.item-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 20px 20px 0 0;
}

.item-detail.rarity-1::before { background: linear-gradient(90deg, #9ca3af 0%, transparent 100%); }
.item-detail.rarity-2::before { background: linear-gradient(90deg, #22c55e 0%, transparent 100%); }
.item-detail.rarity-3::before { background: linear-gradient(90deg, #3b82f6 0%, transparent 100%); }
.item-detail.rarity-4::before { background: linear-gradient(90deg, #a855f7 0%, transparent 100%); }
.item-detail.rarity-5::before { background: linear-gradient(90deg, #f59e0b 0%, transparent 100%); }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-info h3 {
  color: #f3f4f6;
  margin: 0 0 4px 0;
  font-size: 1.2rem;
}

.close-detail {
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid #4b5563;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 1.3rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-detail:hover {
  background: rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

.item-description {
  color: #9ca3af;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.item-stats {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.stat-row + .stat-row {
  border-top: 1px solid #374151;
}

.stat-label {
  color: #6b7280;
  font-size: 0.85rem;
}

.stat-value {
  color: #f3f4f6;
  font-weight: 600;
}

.stat-value.xp {
  color: #a78bfa;
}

.stat-value.sell {
  color: #60a5fa;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-hint {
  text-align: center;
  color: #6b7280;
  font-size: 0.85rem;
  padding: 8px;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 8px;
}

.sell-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sell-count-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.count-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #4b5563;
  background: #374151;
  color: #f3f4f6;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.count-btn:hover:not(:disabled) {
  background: #4b5563;
}

.count-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.count-display {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f3f4f6;
  min-width: 40px;
  text-align: center;
}

.sell-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sell-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.sell-all-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sell-all-btn:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}
</style>
```

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/screens/InventoryScreen.vue
git commit -m "feat(inventory): add InventoryScreen with item display and selling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Add Navigation to Inventory Screen

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Step 1: Add inventory navigation button**

In HomeScreen.vue, add an inventory button to the navigation section. Find the nav-grid and add:

```vue
<button class="nav-btn inventory" @click="emit('navigate', 'inventory')">
  <span class="nav-icon">📦</span>
  <span class="nav-label">Inventory</span>
</button>
```

Add corresponding styles:
```css
.nav-btn.inventory {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  border-color: #3b82f6;
}
```

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/screens/HomeScreen.vue
git commit -m "feat(inventory): add inventory navigation to home screen

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Add "Use XP Item" to Hero Detail Panel

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Add item usage to hero detail**

Import inventory store and item data:
```js
import { useInventoryStore } from '../stores'
import { getItem } from '../data/items.js'
```

Add state for item picker:
```js
const inventoryStore = useInventoryStore()
const showItemPicker = ref(false)
const xpGainAnimation = ref(null) // { value: number }

const xpItems = computed(() => {
  return inventoryStore.itemList.filter(item => item.type === 'xp')
})

function openItemPicker() {
  showItemPicker.value = true
}

function closeItemPicker() {
  showItemPicker.value = false
}

function useItemOnHero(item) {
  if (!selectedHero.value) return
  const result = heroesStore.useXpItem(selectedHero.value.instanceId, item.id)
  if (result.success) {
    // Show XP gain animation
    xpGainAnimation.value = { value: result.xpGained }
    setTimeout(() => {
      xpGainAnimation.value = null
    }, 1500)

    // Refresh selected hero data
    selectedHero.value = heroesStore.getHeroFull(selectedHero.value.instanceId)

    // Close picker if no more XP items
    if (xpItems.value.length === 0) {
      closeItemPicker()
    }
  }
}
```

In the template, add after the detail-actions div (but inside hero-detail):

```vue
<!-- Use XP Item Button -->
<div v-if="selectedHero.level < 250 && xpItems.length > 0" class="use-item-section">
  <button class="use-item-btn" @click="openItemPicker">
    <span class="btn-icon">📖</span>
    <span>Use XP Item</span>
    <span class="item-badge">{{ xpItems.length }}</span>
  </button>
</div>

<!-- XP Gain Animation -->
<div v-if="xpGainAnimation" class="xp-gain-floater">
  +{{ xpGainAnimation.value }} XP
</div>

<!-- Item Picker Modal -->
<div v-if="showItemPicker" class="item-picker-backdrop" @click="closeItemPicker"></div>
<div v-if="showItemPicker" class="item-picker-modal">
  <div class="picker-header">
    <h4>Use XP Item</h4>
    <button class="close-picker" @click="closeItemPicker">×</button>
  </div>
  <div class="picker-items">
    <div
      v-for="item in xpItems"
      :key="item.id"
      class="picker-item"
      @click="useItemOnHero(item)"
    >
      <span class="picker-item-icon">📖</span>
      <div class="picker-item-info">
        <span class="picker-item-name">{{ item.name }}</span>
        <span class="picker-item-xp">+{{ item.xpValue }} XP</span>
      </div>
      <span class="picker-item-count">×{{ item.count }}</span>
    </div>
  </div>
</div>
```

Add styles:
```css
/* Use XP Item Section */
.use-item-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #374151;
}

.use-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.use-item-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
}

.item-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.85rem;
}

/* XP Gain Animation */
.xp-gain-floater {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: 700;
  color: #a78bfa;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  animation: xpFloatUp 1.5s ease-out forwards;
  z-index: 110;
}

/* Item Picker Modal */
.item-picker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 105;
}

.item-picker-modal {
  position: fixed;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, 50%);
  background: #1e293b;
  border-radius: 16px;
  padding: 20px;
  width: 90%;
  max-width: 320px;
  max-height: 60vh;
  overflow-y: auto;
  z-index: 106;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid #374151;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.picker-header h4 {
  margin: 0;
  color: #f3f4f6;
  font-size: 1.1rem;
}

.close-picker {
  background: rgba(55, 65, 81, 0.5);
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 1.1rem;
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.picker-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.picker-item:hover {
  background: rgba(55, 65, 81, 0.5);
  transform: translateX(4px);
}

.picker-item-icon {
  font-size: 1.5rem;
}

.picker-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.picker-item-name {
  color: #f3f4f6;
  font-weight: 600;
  font-size: 0.9rem;
}

.picker-item-xp {
  color: #a78bfa;
  font-size: 0.8rem;
}

.picker-item-count {
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.9rem;
}
```

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Test manually in dev**

Run: `/home/deltran/.asdf/shims/npm run dev`
- Navigate to Heroes screen
- Select a hero
- Verify "Use XP Item" button appears if you have XP items
- Test using an item

**Step 4: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(inventory): add XP item usage to hero detail panel

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Fix heroes.js Circular Dependency

**Files:**
- Modify: `src/stores/heroes.js`

**Step 1: Fix the require to dynamic import**

The `require()` syntax doesn't work in ES modules. Update `useXpItem` to use dynamic import pattern:

```js
function useXpItem(instanceId, itemId) {
  const inventoryStore = useInventoryStore()

  const item = getItem(itemId)
  if (!item || item.type !== 'xp') return { success: false, reason: 'invalid_item' }
  if (!inventoryStore.removeItem(itemId)) return { success: false, reason: 'no_item' }

  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) {
    inventoryStore.addItem(itemId) // refund
    return { success: false, reason: 'hero_not_found' }
  }

  const oldLevel = hero.level
  addExp(instanceId, item.xpValue)
  const newLevel = hero.level

  return {
    success: true,
    xpGained: item.xpValue,
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel
  }
}
```

At the top of the file, add the import:
```js
import { useInventoryStore } from './inventory.js'
```

Note: Pinia handles circular dependencies between stores automatically when both stores are already created (which happens on app init).

**Step 2: Verify build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/stores/heroes.js
git commit -m "fix(inventory): resolve circular dependency in heroes store

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Final Integration Test

**Step 1: Run full build**

Run: `/home/deltran/.asdf/shims/npm run build`
Expected: Build succeeds with no errors

**Step 2: Run dev server and test full flow**

Run: `/home/deltran/.asdf/shims/npm run dev`

Test checklist:
- [ ] Home screen shows Inventory button
- [ ] Inventory screen shows items (or empty state)
- [ ] Complete a quest and see item drops on victory
- [ ] Items appear in inventory after quest
- [ ] Can sell items for gems
- [ ] Heroes screen shows "Use XP Item" button
- [ ] Can use XP items on heroes
- [ ] XP is granted and shows animation
- [ ] Save/load preserves inventory

**Step 3: Final commit**

```bash
git add -A
git status
# If any uncommitted changes:
git commit -m "feat(inventory): complete inventory system implementation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

This plan implements the complete inventory system:

1. **Data layer**: Item definitions with type, rarity, XP value, sell rewards
2. **State management**: Inventory store with add/remove/sell actions
3. **Persistence**: Save/load integration with existing storage system
4. **Quest integration**: Item drops rolled on quest completion
5. **UI - Victory screen**: Animated item drop display
6. **UI - Inventory screen**: Full item management with selling
7. **UI - Heroes screen**: XP item usage from hero detail panel

The implementation follows existing codebase patterns for stores, components, and styling.

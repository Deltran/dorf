# Inventory System - Design Document

## Overview

Add an inventory system for collectible items that drop from quests. Primary use case is XP-boosting items that can be applied to heroes, plus junk items that can be sold for gems.

## Goals

- Give players resources to level heroes outside of combat
- Add variety to quest rewards beyond gems/XP
- Flexible system that can expand to new item types and currencies

## Item Data Model

Items defined in `src/data/items.js`:

```js
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
  }
}

export function getItem(itemId) {
  return items[itemId] || null
}
```

### Item Types

| Type | Purpose | Properties |
|------|---------|------------|
| `xp` | Grant XP to heroes | `xpValue`, `sellReward` |
| `junk` | Sell for currency | `sellReward` only |
| `material` | Future crafting/trading | `sellReward` |

### Sell Reward Format

Flexible structure supporting multiple reward types:

```js
// Gems (current)
sellReward: { gems: 5 }

// Gold (future currency)
sellReward: { gold: 100 }

// Other items
sellReward: { items: [{ itemId: 'tome_small', count: 3 }] }

// Combined
sellReward: { gems: 10, items: [{ itemId: 'tome_small', count: 1 }] }
```

### Rarity

Items use the existing 1-5 rarity system for visual consistency with hero cards.

## Inventory Store

New `src/stores/inventory.js`:

```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getItem } from '../data/items'
import { useGachaStore } from './gacha'

export const useInventoryStore = defineStore('inventory', () => {
  // Items stored as { itemId: count }
  const items = ref({})

  // Getters
  const itemList = computed(() => {
    return Object.entries(items.value)
      .filter(([_, count]) => count > 0)
      .map(([itemId, count]) => ({
        ...getItem(itemId),
        count
      }))
  })

  const totalItemCount = computed(() =>
    Object.values(items.value).reduce((sum, count) => sum + count, 0)
  )

  // Actions
  function addItem(itemId, count = 1) {
    items.value[itemId] = (items.value[itemId] || 0) + count
  }

  function removeItem(itemId, count = 1) {
    if ((items.value[itemId] || 0) < count) return false
    items.value[itemId] -= count
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

    if (reward.gems) gachaStore.addGems(reward.gems * count)
    // Future: if (reward.gold) currencyStore.addGold(reward.gold * count)
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
    items,
    itemList,
    totalItemCount,
    addItem,
    removeItem,
    getItemCount,
    sellItem,
    saveState,
    loadState
  }
})
```

## Heroes Store Changes

Add XP item usage to `src/stores/heroes.js`:

```js
function useXpItem(instanceId, itemId) {
  const inventoryStore = useInventoryStore()
  const item = getItem(itemId)

  if (!item || item.type !== 'xp') return false
  if (!inventoryStore.removeItem(itemId)) return false

  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) {
    inventoryStore.addItem(itemId) // refund if hero not found
    return false
  }

  addExperience(instanceId, item.xpValue)
  return true
}
```

## Quest Reward Structure

Update quest nodes in `src/data/questNodes.js` to include item drops:

```js
{
  id: 'forest_01',
  name: 'Dark Thicket',
  region: 'Whispering Woods',
  x: 100,
  y: 250,
  battles: [...],
  rewards: { gems: 50, exp: 80 },
  firstClearBonus: { gems: 30 },
  itemDrops: [
    { itemId: 'tome_small', min: 2, max: 5, chance: 1.0 },
    { itemId: 'useless_rock', min: 1, max: 1, chance: 0.2 }
  ]
}
```

### Drop Format

| Property | Type | Description |
|----------|------|-------------|
| `itemId` | string | References item definition |
| `min` | number | Minimum count if drop succeeds |
| `max` | number | Maximum count if drop succeeds |
| `chance` | number | 0.0-1.0 probability of dropping |

### Processing Drops

Add to `src/stores/quests.js`:

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

function completeNode(nodeId) {
  const node = getNode(nodeId)
  const results = { gems: 0, exp: 0, items: [] }

  // Existing rewards
  results.gems += node.rewards.gems || 0
  results.exp += node.rewards.exp || 0

  // First clear bonus
  if (!isNodeCleared(nodeId)) {
    results.gems += node.firstClearBonus?.gems || 0
    results.firstClear = true
  }

  // Roll item drops
  results.items = rollItemDrops(node)

  // Apply rewards
  gachaStore.addGems(results.gems)
  for (const drop of results.items) {
    inventoryStore.addItem(drop.itemId, drop.count)
  }

  markNodeCleared(nodeId)
  return results
}
```

## UI Components

### New Bottom Nav Tab

Add "Inventory" tab alongside existing navigation (Home, Heroes, Gacha, etc.).

### InventoryScreen.vue

Main inventory view:

- Header with "Inventory" title and gem count display
- Grid of item cards (similar layout to hero grid)
- Each card shows: item icon, name, count badge, rarity-colored border
- Tap card to open item detail modal
- Empty state: "No items yet. Complete quests to find items!"

### Item Detail Modal

- Item name, description, count owned
- Rarity indicator
- For XP items: "Use" button and XP value display
- "Sell" button with reward preview (e.g., "Sell for 5 gems")
- Bulk sell option for junk items

### ItemCard.vue

Reusable item display:

- Item icon/image (from `src/assets/items/{item_id}.png`)
- Rarity-colored border using existing color system
- Count badge in corner
- Hover/tap states

### Hero Detail Panel Addition

In `HeroesScreen.vue`, add below hero stats:

- "Use XP Item" button
- Opens ItemPickerModal showing only XP-type items
- After use, show XP gain animation on hero's XP bar

### ItemPickerModal.vue

Grid of XP items from inventory:

- Each shows: icon, name, XP value, count owned
- Tap to use immediately
- Stays open for multiple uses
- Close button to dismiss

### HeroPickerModal.vue

For using items from inventory screen:

- Grid of all owned heroes
- Shows: hero image, name, level, XP bar
- Tap to apply selected item
- Returns to inventory after use

### Victory Screen Updates

In `BattleScreen.vue` victory state:

- Existing: gems earned, XP earned display
- New: item drops shown as small cards below
- Cards animate in sequentially (like gacha reveal)
- Each shows: icon, name, "×3" count

## Files Changed

### New Files

- `src/data/items.js` - Item definitions
- `src/stores/inventory.js` - Inventory state and actions
- `src/components/InventoryScreen.vue` - Bottom nav tab screen
- `src/components/ItemCard.vue` - Reusable item card
- `src/components/ItemPickerModal.vue` - Select item for hero
- `src/components/HeroPickerModal.vue` - Select hero for item

### Modified Files

- `src/data/questNodes.js` - Add `itemDrops` to quest nodes
- `src/stores/quests.js` - Add `rollItemDrops()`, update completion logic
- `src/stores/heroes.js` - Add `useXpItem()` action
- `src/stores/persistence.js` - Include inventory in save/load
- `src/components/HeroesScreen.vue` - Add "Use XP Item" to detail panel
- `src/components/BattleScreen.vue` - Show item drops on victory
- `src/App.vue` (or nav component) - Add Inventory tab

### Assets

- `src/assets/items/{item_id}.png` - Item icons

## Future Extensions

The system is designed to support:

- **Gold currency** - Add `gold` to sellReward, create currency store
- **Loot tables** - Replace `itemDrops` with `lootTableId` reference
- **Crafting** - New item type that consumes materials
- **Equipment** - Items that attach to heroes with stat bonuses
- **Consumables** - Battle items (potions, buffs)

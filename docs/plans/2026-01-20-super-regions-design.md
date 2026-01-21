# Super-Regions Design

Group existing regions under "Western Veros" and introduce a new super-region "Aquarias" to support narrative progression and a cleaner interface.

## Overview

Add a hierarchy level to the world map: **Super-regions** contain multiple **regions**, which contain **quest nodes**.

- **Western Veros**: All existing regions (Whispering Woods, Echoing Caverns, etc.)
- **Aquarias**: New super-region starting with "Coral Depths" region

## Data Structure

### New `superRegions` export in `questNodes.js`

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

### Region changes

Add `superRegion` property to all existing regions:

```js
{
  id: 'whispering_woods',
  name: 'Whispering Woods',
  superRegion: 'western_veros',  // NEW
  startNode: 'forest_01',
  // ... rest unchanged
}
```

### New Coral Depths region

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

### New Coral Tunnels quest node

```js
coral_01: {
  id: 'coral_01',
  name: 'Coral Tunnels',
  region: 'Coral Depths',
  x: 100,
  y: 250,
  battles: [],  // Define enemies later
  connections: [],
  rewards: { gems: 100, gold: 250, exp: 200 },
  firstClearBonus: { gems: 50 },
  itemDrops: []
}
```

### Helper functions

```js
export function getSuperRegion(id) {
  return superRegions.find(sr => sr.id === id)
}

export function getRegionsBySuperRegion(superRegionId) {
  return regions.filter(r => r.superRegion === superRegionId)
}
```

## UI Changes

### Super-Region Selection Screen

New component `SuperRegionSelect.vue`:

- Full-screen view with same animated background as WorldMapScreen
- Header: "Select Region" title + total progress badge
- Two large cards (side by side on wide screens, stacked on narrow):
  - Background image per super-region
  - Dark overlay for text legibility
  - Super-region name
  - Progress: "32/46 nodes cleared"
  - Locked state: grayed out with lock icon, "Complete aqua_08 to unlock"

### Smart Skip Logic

If only one super-region is unlocked, skip the selection screen entirely and go directly to region tabs (current behavior).

```js
const showSuperRegionSelect = computed(() => {
  return unlockedSuperRegions.value.length > 1
})
```

### WorldMapScreen Integration

```js
const selectedSuperRegion = ref(null)

// Auto-select if only one unlocked
watchEffect(() => {
  if (unlockedSuperRegions.value.length === 1) {
    selectedSuperRegion.value = unlockedSuperRegions.value[0].id
  }
})
```

Template structure:
1. Show `SuperRegionSelect` when multiple unlocked and none selected
2. Show current region view (filtered by super-region) otherwise
3. Add "Back to Regions" button when super-region select is available

Region tabs filtered by `selectedSuperRegion`.

## Store Changes

### `quests.js` additions

```js
// Super-region progress
const superRegionProgress = computed(() => {
  const progress = {}
  for (const sr of superRegions) {
    const srRegions = regions.filter(r => r.superRegion === sr.id)
    const srNodeIds = srRegions.flatMap(r => getNodesByRegion(r.name).map(n => n.id))
    progress[sr.id] = {
      completed: srNodeIds.filter(id => completedNodes.value.includes(id)).length,
      total: srNodeIds.length
    }
  }
  return progress
})

// Unlocked super-regions
const unlockedSuperRegions = computed(() => {
  return superRegions.filter(sr =>
    sr.unlockedByDefault ||
    (sr.unlockCondition?.completedNode &&
     completedNodes.value.includes(sr.unlockCondition.completedNode))
  )
})
```

### Unlock `coral_01` when `aqua_08` completed

Add to `unlockedNodes` computed:
```js
if (completedNodes.includes('aqua_08')) {
  unlocked.add('coral_01')
}
```

## New Assets Required

- `src/assets/maps/coral_depths.png` - Coral Depths region background
- `src/assets/maps/western_veros_card.png` - Super-region selection card
- `src/assets/maps/aquarias_card.png` - Super-region selection card

## Scope

- Aquarias will eventually mirror Western Veros scale (multiple regions)
- Only Coral Depths implemented initially
- Existing regions keep their individual maps and node layouts unchanged

# Inventory Contextual Actions Design

## Overview

Add contextual navigation buttons to inventory item detail panels. Each non-junk item type gets a button that navigates directly to the screen where the item is used.

## Button Mapping

| Item Type | Button Label | Navigates To | Param |
|-----------|-------------|--------------|-------|
| `xp` | "Use on Hero" | `heroes` | — |
| `token` | "Use Token" | `worldmap` | region name (from `item.region`) |
| `key` | "Challenge Boss" | `genus-loci-list` | — |
| `merge_material` | "Merge Hero" | `merge` | — |
| `genusLoci` | "Enhance Exploration" | `explorations` | — |
| `junk` | *(none)* | — | — |

## UI Placement

The contextual button replaces the existing "Use from Heroes screen" text hint in the item detail panel. It sits above the Sell controls, styled as a primary action button — same width as the sell button, with a distinct accent color to differentiate "use" from "sell."

## Implementation

### InventoryScreen.vue

A computed or helper maps `item.type` to `{ label, screen, param }`. The button calls `emit('navigate', screen, param)` when clicked. Items without a mapping (junk) don't show the button. Remove the old "Use from Heroes screen" hint text.

```js
function getContextualAction(item) {
  switch (item.type) {
    case 'xp': return { label: 'Use on Hero', screen: 'heroes' }
    case 'token': return { label: 'Use Token', screen: 'worldmap', param: item.region }
    case 'key': return { label: 'Challenge Boss', screen: 'genus-loci-list' }
    case 'merge_material': return { label: 'Merge Hero', screen: 'merge' }
    case 'genusLoci': return { label: 'Enhance Exploration', screen: 'explorations' }
    default: return null
  }
}
```

### Token Region Navigation

Tokens have a `region` field (e.g. `'Janxier Floodplain'`). The navigate call passes this as a param to WorldMapScreen, which uses it to set the active region tab on mount.

### Files Modified

- `src/screens/InventoryScreen.vue` — add contextual button, remove old hint text
- `src/App.vue` — pass region param through to WorldMapScreen for token navigation
- `src/screens/WorldMapScreen.vue` — accept region param prop to set initial region tab

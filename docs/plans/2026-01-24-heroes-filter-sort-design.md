# Heroes Screen Filter & Sort Design

## Overview

Add filtering and sorting controls to the Heroes screen to help players find and manage heroes in their collection.

## Features

### Sorting Options

| Option | Primary Sort | Secondary Sort |
|--------|--------------|----------------|
| Default | Rarity (desc) | Level (desc) |
| Rarity | Rarity (desc) | Level (desc) |
| Level | Level (desc) | Rarity (desc) |
| ATK | ATK stat (desc) | Rarity (desc) |
| DEF | DEF stat (desc) | Rarity (desc) |
| SPD | SPD stat (desc) | Rarity (desc) |

### Filters

- **Role filter**: Multi-select checkboxes for Tank, DPS, Healer, Support
- **Class filter**: Multi-select checkboxes for all 8 classes (Berserker, Ranger, Knight, Paladin, Mage, Cleric, Druid, Bard)
- **Expedition toggle**: Show/hide heroes currently on expedition

### Filter Logic

- AND logic across all filters
- Example: Tank role + Knight class = only heroes that are both Tank AND Knight
- No selection in a category = no filter applied for that category

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  ‹ Back          Heroes              [42 owned]     │  <- existing header
├─────────────────────────────────────────────────────┤
│  [Sort: Default ▼]  [Role ▼]  [Class ▼]  [🧭 ○]    │  <- new filter bar
├─────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │Hero1│ │Hero2│ │Hero3│ │Hero4│  ...              │  <- hero grid
```

### Sort Dropdown

```
┌──────────────┐
│ ✓ Default    │
│   Rarity     │
│   Level      │
│   ATK        │
│   DEF        │
│   SPD        │
└──────────────┘
```

### Role Filter Dropdown

```
┌──────────────────┐
│ ☐ Tank     🛡️   │
│ ☐ DPS      ⚔️   │
│ ☐ Healer   💚   │
│ ☐ Support  ✨   │
└──────────────────┘
```

### Class Filter Dropdown

```
┌──────────────────┐
│ ☐ Berserker      │
│ ☐ Ranger         │
│ ☐ Knight         │
│ ☐ Paladin        │
│ ☐ Mage           │
│ ☐ Cleric         │
│ ☐ Druid          │
│ ☐ Bard           │
└──────────────────┘
```

### Expedition Toggle

```
OFF (default):  🧭 ○    <- gray/muted, shows all heroes
ON:             🧭 ●    <- cyan/highlighted, hides heroes on expedition
```

### Visual Indicators

- Active filters show count in button: `Role (2)`
- Active filters get colored border/background (blue tint `#3b82f6`)
- Expedition toggle uses cyan (`#06b6d4`) when active
- Header badge shows filtered count: `12/42 owned`

### Empty State

When filters match no heroes:

```
┌─────────────────────────────────────────────────────┐
│  [Sort: ATK ▼]  [Role (1) ▼]  [Class ▼]  [🧭 ●]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│                    🔍                               │
│           No heroes match filters                   │
│           [Clear Filters]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Implementation

### Files to Modify

- `src/screens/HeroesScreen.vue` - All changes contained here

### New State

```js
const sortBy = ref('default')
const selectedRoles = ref([])
const selectedClasses = ref([])
const hideOnExpedition = ref(false)
```

### New Computed Properties

- `filteredAndSortedHeroes` - Replaces current `sortedHeroes`, applies filters then sort
- `activeFilterCount` - For showing filter indicators
- `filteredCount` - Number of heroes after filtering

### Template Additions

- Filter bar section between header and collection
- Three dropdown components (inline, no separate component needed)
- Click-outside handling for closing dropdowns

### Styling

- Filter bar: semi-transparent dark background matching existing UI
- Dropdowns: consistent with existing modal/picker styling
- Active state: blue tint (`#3b82f6`) for sort/filters, cyan (`#06b6d4`) for expedition

### No Changes Required

- Hero data structure
- Stores
- Other components

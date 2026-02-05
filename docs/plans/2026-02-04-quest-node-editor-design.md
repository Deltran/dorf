# Quest Node Editor — Admin Feature Design

## Overview

Expand the admin "Quest Nodes" section from a simple unlock/lock testing tool into a full CRUD editor for regions and quest nodes. The admin becomes the authoring tool for all non-asset quest data, writing directly to the split region source files.

Existing unlock/lock functionality is preserved for testing.

## Layout

**Two-panel design:**

### Left Panel — Region List
- All regions grouped by super-region (Western Veros, Aquarias)
- Each region shows name, node count, collapse/expand toggle
- "Create Region" button at top
- Clicking a region selects it → populates right panel

### Right Panel — Region Detail + Nodes
- **Top (collapsible):** Region metadata form
- **Below:** Node list with name, id, type badge (battle/genusLoci/exploration), unlock/complete status
- Existing unlock/lock toggle buttons remain on each node row
- "Add Node" button
- Clicking a node opens the node editor (replaces node list, back button to return)

### Delete Flows
- Region delete: confirmation dialog, removes file and cleans up imports
- Node delete: confirmation dialog, removes node from region file

## Region Editor Form

**Identity:**
- `id` — text input (auto-slugified, used as filename)
- `name` — text input
- `description` — textarea
- `superRegion` — dropdown: western_veros, aquarias

**Map Layout:**
- `width`, `height` — number inputs
- `backgroundColor` — color input with hex text fallback
- `startNode` — dropdown of nodes in this region

**Not editable in admin:**
- `backgroundImage` — asset import, stays as manual code edit

## Node Editor Form

### Identity
- `id` — text input (auto-slugified, validated unique)
- `name` — text input
- `type` — dropdown: battle (default), genusLoci, exploration
- `region` — auto-filled from parent region, read-only

### Position
- `x`, `y` — number inputs

### Battles (type = "battle")
- List of battle waves, each expandable
- Each wave: enemy list as tags with X remove buttons
- Searchable dropdown to add enemies (all enemy templates)
- "Add Wave" button
- Up/down arrows to reorder waves

### Connections
- Connected node IDs as tags with X remove buttons
- Searchable dropdown to add, defaults to same-region nodes
- "Show all regions" toggle for cross-region connections

### Rewards
- `gems`, `gold`, `exp` — number inputs in a row
- `firstClearBonus` — collapsible section with same fields

### Item Drops
- List of entries: item name, chance (0-1), min, max
- Searchable dropdown to add items (all items)
- Number inputs for chance/min/max per entry

### Genus Loci Fields (type = "genusLoci")
- `genusLociId` — dropdown of existing genus loci

### Exploration Fields (type = "exploration")
- `explorationConfig` sub-form: requiredFights, timeLimit, rewards, requiredCrestId, partyRequest

### Special Fields
- `unlocks` — optional text input (e.g., "colosseum")
- `unlockedBy` — node picker (for exploration nodes)
- `backgroundId` — text input

## Searchable Dropdown Pattern

Used for enemies, items, and connections. Not a free-text input — selection only from existing data. Includes search/filter to handle large lists. Displays as tags with X buttons once selected.

## Vite Plugin API

### Region Endpoints
- `GET /api/admin/quest-regions` — all regions with their nodes
- `POST /api/admin/quest-regions` — create region (creates file, updates index.js + regions.js)
- `PUT /api/admin/quest-regions/:regionId` — update region metadata
- `DELETE /api/admin/quest-regions/:regionId` — delete region file, clean up imports

### Node Endpoints
- `POST /api/admin/quest-regions/:regionId/nodes` — add node to region file
- `PUT /api/admin/quest-regions/:regionId/nodes/:nodeId` — update node
- `DELETE /api/admin/quest-regions/:regionId/nodes/:nodeId` — remove node

### After Every Write
- Invalidate quest modules via existing `invalidateQuestModules()`
- HMR picks up changes automatically

## File Serialization

Each region file (`src/data/quests/{region_id}.js`) has a specific structure.

### Read Flow
1. Read file as string
2. Extract and preserve import lines (backgroundImage, etc.)
3. Parse `regionMeta` object
4. Parse each individual node export
5. Ignore the combined nodes export (will be regenerated)

### Write Flow
1. Preserved import lines (carried through as-is)
2. `export const regionMeta = { ... }`
3. Each node as `export const {nodeId} = { ... }` (separated by blank lines)
4. Auto-generated combined export: `export const {camelCaseRegionId}Nodes = { node1, node2, ... }`

### Combined Export Naming
Derived from region id: camelCase + "Nodes" (e.g., `whispering_woods` → `whisperingWoodsNodes`)

### New Region Creation
Also updates:
- `src/data/quests/index.js` — adds import + spread into questNodes
- `src/data/quests/regions.js` — adds region metadata entry

### Key Principle
Import lines are preserved verbatim (they reference assets). Everything else is regenerated from data. The serializer doesn't need to understand asset imports, just carry them through.

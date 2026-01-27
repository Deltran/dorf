# Region Link Markers Design

Visual indicators on the world map that show paths to other regions, with clickable navigation and admin positioning.

## Problem

When a quest node connects to a node in another region, there's no visual indicator on the map. Players must discover new regions by noticing a new tab appeared. Cross-region connections exist in the data but are filtered out in MapCanvas.

## Design

### Data Model

Use existing cross-region entries in the `connections` array. Add a `regionLinkPosition` field to source nodes that have cross-region connections:

```js
{
  id: 'forest_05',
  name: 'Forest Edge',
  region: 'Whispering Woods',
  x: 700, y: 250,
  connections: ['cave_01'],  // cave_01 is in Echoing Caverns
  regionLinkPosition: { x: 750, y: 150 },
  // ...
}
```

Detection logic in MapCanvas finds these by comparing `node.region` against connected node regions. If `regionLinkPosition` is not set, falls back to an auto-offset of source node position + 60px on x-axis.

### Region Link Marker Component

New component: `RegionLinkMarker.vue`

**Visual:**
- 44x44 circle with blue-to-teal gradient (`#3b82f6` to `#06b6d4`)
- Arrow emoji inside (similar to NodeMarker icon pattern)
- Animated pulse ring (blue glow, 2s cycle)
- Label on hover: target region name (e.g., "Echoing Caverns")
- Only visible when the source quest node is completed

**Props:**
- `link` (Object) — contains sourceNode, targetNode, targetRegion, position
- `scale` (Number) — from MapCanvas
- `isSelected` (Boolean)

**Emits:**
- `navigate` — `{ targetRegion, targetNode }`

**Dotted trail** from source node to link marker rendered in the MapCanvas SVG layer. Same style as inter-node trails (`stroke-dasharray: 8 8`, full visibility).

### Slide Transition

When a region link is clicked, WorldMapScreen performs a slide animation:

- Current region slides out to the left
- Target region slides in from the right
- Duration: 400ms, ease-out
- Uses Vue `<Transition>` with CSS `translateX`
- After transition, auto-selects the target region
- Tab clicks still switch instantly (no slide)
- If a tab is clicked during a slide, cancel and jump immediately

```css
.region-slide-enter-active,
.region-slide-leave-active {
  transition: transform 0.4s ease-out;
}
.region-slide-enter-from { transform: translateX(100%); }
.region-slide-leave-to { transform: translateX(-100%); }
```

### Admin / MapEditor Integration

Region link markers appear alongside quest nodes in the existing MapEditor:

- Same drag-and-drop handlers as nodes
- Tracked in a separate `movedLinkPositions` ref
- Blue/teal visual with "link" label to distinguish from nodes
- Coordinate tooltip on hover
- Clamped to region bounds
- Saved via same "Save Layout" flow, updating `regionLinkPosition` on the source node in `questNodes.js`
- If no `regionLinkPosition` exists yet, starts at auto-offset position for the admin to drag into place

No new admin UI sections needed.

## Files to Change

| File | Change |
|------|--------|
| `src/data/questNodes.js` | Add `regionLinkPosition` to cross-region source nodes |
| `src/components/RegionLinkMarker.vue` | New component |
| `src/components/MapCanvas.vue` | Compute region links, render trails and markers |
| `src/screens/WorldMapScreen.vue` | Handle navigate event, slide transition |
| `src/components/admin/MapEditor.vue` | Drag-and-drop for link markers, save positions |

## Nodes Requiring regionLinkPosition

Any node whose `connections` array references a node in a different region. These are the cross-region boundary nodes that need the field added.

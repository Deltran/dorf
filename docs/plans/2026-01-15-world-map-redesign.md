# World Map Redesign - Design Document

## Overview

Replace the current list-based quest node display with an interactive graph/map view featuring fixed node positions, dotted trail connections, and fog of war for unexplored areas.

## Goals

- Make branching paths and loops visually clear
- Create a sense of exploration and discovery
- Maintain the existing node preview and interaction patterns

## Data Model Changes

### Region Definition (updated)

```js
{
  id: 'whispering_woods',
  name: 'Whispering Woods',
  backgroundImage: 'whispering_woods_map.png',
  width: 800,   // native map canvas size
  height: 600
}
```

### Quest Node (updated)

```js
{
  id: 'forest_01',
  name: 'Dark Thicket',
  region: 'whispering_woods',
  x: 150,       // position on region map (native coordinates)
  y: 400,
  battles: [...],
  connections: ['forest_02', 'forest_03'],
  rewards: {...}
}
```

No changes to unlock/completion logic. The existing `connections` array drives trail rendering.

## Visual Design

### Layer Stack (bottom to top)

1. **Background image** - Static region artwork
2. **Fog overlay** - Semi-transparent dark layer with circular cutouts
3. **Dotted trails** - SVG paths between connected nodes
4. **Node markers** - Clickable icons for unlocked/completed nodes

### Fog of War

- Each unlocked node reveals a circular area (~80px radius at native size)
- Fog is a dark overlay with transparent cutouts using CSS mask or SVG clip-path
- Cutouts have soft/feathered edges for a natural look
- Locked nodes are completely hidden under fog

### Dotted Trail Lines

- Treasure map style dashed lines between connected nodes
- Trails to unlocked nodes: fully visible
- Trails to locked nodes: fade out into the fog (teaser effect)
- Completed trails: optional subtle glow or color change

### Node Marker States

| State | Appearance |
|-------|------------|
| Locked | Hidden (under fog) |
| Unlocked | Glowing marker icon, gentle pulse animation |
| Completed | Checkmark/flag icon, no pulse, slightly dimmed |
| Selected | Enlarged with highlight ring |

## Map Sizing

Maps are defined at a native size (e.g., 800x600) and scaled to fit the viewport while maintaining aspect ratio.

- Mobile (375x650): scales to ~375x280
- Tablet (768x900): scales to ~768x576
- Desktop: scales up or centers with padding

Design constraints:
- 8-12 nodes max per region
- Minimum ~60px spacing between nodes at native size
- Node markers ~40-50px tap targets

Pan/zoom can be added later without refactoring if denser maps are needed.

## Interaction

1. Player taps an unlocked/completed node
2. Node enlarges with highlight ring
3. Preview panel slides up from bottom (reuse existing component)
4. Preview shows: node name, battle count, enemies, rewards
5. Player taps node again or "Start Quest" button to begin
6. Tapping elsewhere deselects the node

## Component Structure

```
WorldMapScreen.vue
├── RegionTabs (existing, keep as-is)
├── MapCanvas.vue (new)
│   ├── <img> background
│   ├── <svg> fog overlay with reveal cutouts
│   ├── <svg> dotted trail paths
│   └── NodeMarker.vue (repeated for each unlocked node)
│       ├── marker icon
│       ├── pulse animation (if unlocked, not completed)
│       └── click handler
└── NodePreview (existing, reuse the slide-up panel)
```

### MapCanvas Responsibilities

- Scale map to fit viewport
- Compute fog mask from unlocked node positions
- Draw SVG paths between connected nodes
- Handle node selection state

### NodeMarker Responsibilities

- Display appropriate icon for state
- Animate pulse for unlocked nodes
- Emit click events to parent

## Migration

### Data Updates Required

- Add `x`, `y` coordinates to each existing quest node
- Add `backgroundImage`, `width`, `height` to each region

### No Save File Changes

Node unlock state remains compatible.

### Placeholder Assets

Start with solid color or gradient backgrounds. Illustrated maps can be swapped in later without code changes.

### Removed Features

- List-based node display
- Text-based progress bar (replaced by visual map progress)

### Preserved Features

- Region tabs for switching areas
- Node preview slide-up panel
- All unlock/completion logic

## Edge Cases

- **Node with no connections**: Renders as isolated marker (valid for final boss nodes)
- **All nodes locked in region**: Shows fog + faded trails hinting at first node
- **First node of region**: Always starts unlocked (current behavior)

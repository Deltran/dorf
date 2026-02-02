# Quest Selection Mobile-First Redesign

## Overview

Redesign the quest selection flow to be mobile-first with full-screen map backgrounds and a cleaner two-screen navigation structure.

## Current Problems

- Map images are landscape (800x500) in a portrait mobile context
- Map area cramped (~40% of screen) with region tabs eating space
- Wasted vertical space between map and bottom sheet
- Too much UI competing for attention on one screen

## Design

### Screen 1: Super-region View (Region Selection)

A scrollable list of region buttons replaces the cramped tab system.

**Layout:**
- Full-screen dark background with subtle texture
- Floating header: back button, super-region name (e.g., "Western Veros"), trophy count
- Scrollable list of region buttons below

**Region Button Styling (parchment/map style):**
- Rectangular card with slightly uneven/torn edges (CSS clip-path)
- Sepia-toned base with the region's background image faded underneath (~20-30% opacity)
- Region name with appropriate typography
- Ink-style details: compass rose, dotted line accents, or map pin icon
- Progress shown subtly: "3/5 cleared" in corner
- On tap: subtle paper-press effect (scale down slightly, darken)

### Screen 2: Region Map View

Full-screen immersive map with minimal floating UI.

**Layout:**
- Map image fills entire screen edge-to-edge
- All UI floats on top with transparent backgrounds (no glass/blur effects)

**Floating Header:**
- Back arrow + region name (e.g., "Whispering Woods")
- Progress: "3/5 cleared" on the right
- No background, just text with subtle drop shadow for readability
- Positioned at top with safe-area padding for phone notch/status bar

**Node Markers:**
- Same positioning system (x/y coordinates scaled to screen as percentages)
- Touch targets sized appropriately for mobile
- States: locked (dimmed), available (glowing/pulsing), completed (checkmark), selected (highlighted ring)
- Labels only visible when selected (not always visible)

**Node Popup:**
- Slides up from bottom on node tap (unchanged behavior)
- Overlays the map
- Tap outside or X to dismiss
- Content unchanged: quest name, fight count, enemies, rewards, start button

## Technical Approach

### Map Scaling

- Keep region `width: 800, height: 500` as logical coordinate space
- Map image fills screen with `background-size: cover`
- Node positions calculated as percentages: `(node.x / 800) * 100%`, `(node.y / 500) * 100%`
- Same coordinates work regardless of actual screen size

### Image Specifications

New portrait map images:
- **Logical size:** 600x1000 pixels
- **Recommended export:** 900x1500 (1.5x) for retina sharpness
- **Ratio:** 3:5 (close to 9:16, covers most phones)
- **Format:** PNG

### File Changes

1. **WorldMapScreen.vue** - Major restructure:
   - Split into two views: super-region list vs region map
   - Super-region view: scrollable region buttons (parchment style)
   - Region view: full-screen map with floating header
   - Or split into two separate screen components

2. **MapCanvas.vue** - Simplify:
   - Remove container sizing logic, fill parent
   - Position nodes as percentages of logical coordinate space

3. **MapEditor.vue** (admin tool):
   - Update image upload guidance to expect 600x1000 images
   - Adjust preview to show portrait aspect ratio
   - Coordinate system unchanged (800x500)

4. **Region data files**:
   - Swap `backgroundImage` to new portrait assets when ready

### What Stays the Same

- Node popup content and behavior
- NodeMarker component
- Quest data structure
- Admin tool coordinate system (800x500)
- Node positioning data (will be adjusted via admin tool after new images)

## Migration Path

1. Implement code changes with current images (will look stretched/cropped)
2. Create new 600x1000 portrait map images for each region
3. Use admin tool to reposition nodes on new images
4. Replace image assets

## Out of Scope

- Map image creation (done separately by designer)
- Node data migration (done via admin tool)

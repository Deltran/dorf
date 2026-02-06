# Portrait Crop Tool Design

**Date:** 2026-02-05
**Status:** Approved

## Problem

The current portrait creation in the admin enemy asset modal is a one-click auto-crop that grabs a fixed 32x32 region from the center-top of the source image. This misses the "face" for many enemies — bats, snakes, large creatures, etc. — and there's no way to adjust it.

## Solution

Replace the auto-crop with an interactive drag-to-position crop tool inside the existing `EnemyAssetModal.vue`.

## Crop Tool Behavior

### Activation

Clicking "Create Portrait" enters crop mode. The modal body switches to a focused crop layout (replaces the current `showPortraitCrop` confirmation UI).

### Crop Box Sizing

The crop box is always **1/4 the source image dimensions**:
- 64x64 source → 32x32 crop (32x32 portrait output)
- 128x128 source → 64x64 crop (64x64 portrait output)

The box size is fixed — no resize or zoom controls.

### Starting Position

The crop box starts at **upper-third center**: horizontally centered, vertically at the 1/3 mark from the top. This approximates where the face/head sits on most character sprites.

### Layout

The crop mode takes over the modal body with a two-column layout:

```
┌─────────────────────────────────────┐
│  [Source image @ 2x]   [Preview]    │
│  ┌──────────────┐      Actual: ▪    │
│  │    ┌────┐    │      4x:  ┌──┐   │
│  │    │crop│    │           │  │   │
│  │    └────┘    │           └──┘   │
│  │   (drag me)  │                   │
│  └──────────────┘                   │
│                                     │
│    [ Save Portrait ]  [ Cancel ]    │
└─────────────────────────────────────┘
```

**Left side — Source canvas:**
- Source image rendered at **2x scale** (64px source → 128px display, 128px source → 256px display)
- `image-rendering: pixelated` for crisp pixel art scaling
- Semi-transparent dark overlay outside the crop region
- Bright-bordered crop box (draggable)

**Right side — Live preview:**
- Cropped region at **actual output size** (32x32 or 64x64) — labeled "Actual"
- Cropped region at **4x scale** — labeled "Preview" — so you can see detail
- Both update in real-time as the crop box is dragged

### Drag Mechanics

- Mouse down on the crop box initiates dragging
- Mouse move repositions the box (clamped to image bounds — box cannot extend beyond edges)
- Mouse up ends dragging
- The dark overlay and live previews update in real-time during drag
- Cursor changes to `grab`/`grabbing` on the crop box

### Buttons

- **Save Portrait** — Crops the source image at the selected position, emits `save-portrait` with the data URL
- **Cancel** — Exits crop mode, returns to normal modal view

## Implementation Scope

All changes are within `EnemyAssetModal.vue`:
- Replace `createPortrait()` to enter crop mode instead of auto-cropping
- Replace the `showPortraitCrop` confirmation UI with the interactive crop layout
- Add canvas-based rendering for the 2x source with overlay + crop box
- Add real-time preview canvases
- Add mouse drag handlers (mousedown/mousemove/mouseup)
- `confirmPortrait()` crops at the user-selected position instead of fixed center-top

No changes to `AssetViewerEnemies.vue`, `EnemyAssetCard.vue`, or the vite admin plugin. The save-portrait emit and backend endpoint remain the same.

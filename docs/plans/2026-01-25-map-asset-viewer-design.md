# Map Asset Viewer Design

**Goal:** Add a "Maps" section to the admin asset viewer for browsing, generating, and editing world map images with draggable node positioning.

**Architecture:** Card grid grouped by super region, with a full-width inline editor for each region. Gemini API (Nano Banana) for map image generation. Drag-and-drop node repositioning with batch save to questNodes.js source file.

## Card Grid View

Flat card grid grouped by super region (Western Veros, Aquarias):
- Thumbnail of map image (or "?" placeholder)
- Region name and ID
- Node count
- PNG status indicator
- Ordered by position in `regions` array
- Clicking a card opens the inline editor

## Inline Map Editor

Replaces the card grid when a region is selected:

**Top bar:**
- Region name
- Back button (returns to card grid)
- "Save Layout" button (disabled until a node is moved, saves all position changes at once)

**Map canvas:**
- Map image at full width with node markers overlaid at their x/y positions
- Nodes are draggable — drag to reposition
- Moved nodes visually indicated (different color)
- Positions scaled proportionally to canvas size

**Generation panel (below map):**
- Editable prompt field
- Size picker: 800x500 / 800x800 (defaults to region's current dimensions)
- Generate / Save / Try Again — same flow as other viewers
- Uses Gemini API (not PixelLab)
- Default prompt: `"{region name}. Dark fantasy pixel art."`
- Generated image resized in browser via canvas to target dimensions before saving

## Technical Components

**New files:**
- `src/lib/gemini.js` — Browser-side Gemini image generation client using `generateContent` endpoint with `responseModalities: ["TEXT", "IMAGE"]`
- `src/components/admin/MapAssetCard.vue` — Region card with thumbnail
- `src/components/admin/MapEditor.vue` — Full-width inline editor with draggable nodes and generation panel
- `src/screens/admin/AssetViewerMaps.vue` — Super-region-grouped card grid, toggles between grid and editor

**Modified files:**
- `vite-plugin-admin.js` — New `POST /__admin/save-node-positions` endpoint that updates x/y values in questNodes.js source file
- `src/screens/AdminScreen.vue` — Add "Maps" sidebar section

## Data Flow

- Map images detected via Vite glob import from `src/assets/maps/`
- Map generation: Gemini API → resize via canvas → save via `/__admin/save-asset`
- Node positions: drag on canvas → collect changes → save via `/__admin/save-node-positions` → regex update of questNodes.js
- Prompts saved to assetPrompts.json keyed by `map_{regionId}`

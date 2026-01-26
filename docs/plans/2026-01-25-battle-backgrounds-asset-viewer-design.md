# Battle Backgrounds Asset Viewer Design

**Goal:** Add a "Backgrounds" section to the admin asset viewer for browsing, generating, and managing battle background images grouped by region.

**Architecture:** New sidebar section in AdminScreen, following the same pattern as Heroes and Enemies viewers. Three new components: card, modal, and viewer. Fixed 320x128 generation size. Region-grouped layout with section headers.

## Card Layout

Landscape-oriented cards (backgrounds are 320x128, wider than tall):
- Background image preview (or "?" placeholder if missing)
- Node name (e.g., "Dark Thicket") and node ID (e.g., `forest_01`)
- Type badge for special nodes: "Genus Loci", "Exploration"
- Missing image indicator: dashed border + reduced opacity

## Region Grouping

- "Default" section at the top with the global `default.png` fallback
- Remaining sections grouped by region from `questNodes.js`
- Nodes within each region follow their definition order
- Section headers show region name

## Generation Modal

- Left column: large preview of current image (pixelated rendering)
- Right column: editable prompt + Generate / Save / Try Again
- Fixed generation size: 320x128 (no size picker)
- Default prompt: `"{node name}. {region name}. Battle background. Dark fantasy pixel art."`
- Default background for default card: `"Battle background. Dark fantasy pixel art."`
- Prompts saved to `assetPrompts.json` keyed by `bg_{nodeId}` (prefixed to avoid collision with enemy/hero IDs)

## Components

- `BackgroundAssetCard.vue` — landscape card
- `BackgroundAssetModal.vue` — generation modal (no portrait crop, no size picker)
- `AssetViewerBackgrounds.vue` — region-grouped view with glob imports and override maps

## Data Flow

Same as heroes/enemies:
- Vite `import.meta.glob` detects existing files at build time
- `/__admin/save-asset` writes generated images to disk
- `/__admin/save-prompts` persists prompt text
- Reactive override maps for immediate UI updates after save

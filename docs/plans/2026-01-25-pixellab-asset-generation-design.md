# Pixellab Asset Generation Design

## Overview

A Node.js script that batch-generates missing enemy sprites and battle backgrounds using Pixellab's API. Structured to later support an admin UI for viewing and regenerating assets.

## Current Asset Gaps

### Enemies Missing Images (12)

**Underground Morass:**
- `cave_leech`
- `fungal_zombie`
- `gloom_stalker`
- `blind_horror`
- `swamp_hag`

**Gate to Aquaria:**
- `merfolk_warrior`
- `merfolk_mage`
- `coral_golem`
- `abyssal_lurker`
- `sea_serpent`
- `tide_priest`
- `kraken`

### Battle Backgrounds Missing (43)

- `cliffs_01` through `cliffs_06` (Blistering Cliffsides)
- `flood_01` through `flood_07` (Janxier Floodplain)
- `fort_01` through `fort_06` (Old Fort Calindash)
- `cata_01` through `cata_07` (Ancient Catacombs)
- `morass_01` through `morass_06` (Underground Morass)
- `aqua_01` through `aqua_08` (Gate to Aquaria)
- `coral_01` (Coral Depths)
- `cave_exploration`
- `summit_exploration`

## Generation Rules

### Enemies

- **Tool:** `create_map_object`
- **Output:** Transparent background PNG
- **Location:** `src/assets/enemies/{enemy_id}.png`

**Size determination:**
- 128x128 if enemy has `imageSize` property in template
- 128x128 if name contains: giant, dragon, troll, golem, hydra, kraken, titan, elemental
- 64x64 otherwise

**Prompt format:**
```
A {enemy name}. {skill-derived flavor}. High fantasy.
```

Example:
```
A cave leech. Blood drain ability. High fantasy.
```

### Battle Backgrounds

- **Tool:** `create_map_object`
- **Size:** 320x128
- **Output:** Full scene (no transparency)
- **Location:** `src/assets/battle_backgrounds/{node_id}.png`

**Prompt format:**
```
{Node name}. {Region theme}. Dark fantasy.
```

Example:
```
Fungal hollow. Underground swamp. Glowing mushrooms. Murky water. Dark fantasy.
```

## File Structure

```
scripts/
  generate-assets.js        # CLI entry point
  lib/
    pixellab.js             # API client (reusable for admin UI)
    asset-checker.js        # Detects missing assets
    prompt-builder.js       # Generates prompts from enemy/node data

src/data/
  assetPrompts.js           # Manual prompt overrides (optional)
```

## Prompt Override File

`src/data/assetPrompts.js` allows manual control over any prompt:

```js
export const enemyPrompts = {
  kraken: {
    prompt: "A kraken. Giant squid creature. Massive tentacles. Dark purple skin. Glowing yellow eyes. Menacing. High fantasy.",
    size: 128
  }
}

export const backgroundPrompts = {
  cliffs_01: {
    prompt: "Volcanic cliffs. Orange lava glow. Black rock. Ash in air. Ominous sky. Dark fantasy."
  }
}
```

If an asset has an entry here, its prompt is used instead of auto-generation.

## Pixellab API Integration

### Authentication

```
Authorization: Bearer {PIXELLAB_TOKEN}
```

Token stored in environment variable `PIXELLAB_TOKEN`.

### Endpoint

MCP transport at `https://api.pixellab.ai/mcp`

### Async Flow

1. Call `create_map_object` with description, width, height
2. Receive `object_id` immediately
3. Poll `get_map_object` every 10 seconds until status is `completed`
4. Download from `/mcp/map_object/{id}/download`
5. Save to appropriate `src/assets/` directory

Processing time: 2-5 minutes per asset.

## CLI Interface

```bash
# Generate all missing assets
node scripts/generate-assets.js --all

# Generate only enemies or backgrounds
node scripts/generate-assets.js --enemies
node scripts/generate-assets.js --backgrounds

# Regenerate specific asset (even if exists)
node scripts/generate-assets.js --id cave_leech
node scripts/generate-assets.js --id cliffs_01

# Dry run - show what would be generated
node scripts/generate-assets.js --all --dry-run

# List missing assets
node scripts/generate-assets.js --list

# Resume from last failure
node scripts/generate-assets.js --all --resume
```

### Progress Output

```
Generating 12 enemies and 43 backgrounds...
[1/55] cave_leech (64x64) ... processing
[1/55] cave_leech (64x64) ... saved to src/assets/enemies/cave_leech.png
[2/55] fungal_zombie (64x64) ... processing
```

## Error Handling

- Failed generations logged to `scripts/generation-errors.log`
- Automatic retry (up to 3 attempts) with exponential backoff
- Partial progress saved - re-running skips already-generated assets
- `--resume` flag continues from last failure point

## Future: Admin UI

The `scripts/lib/` modules are designed for reuse. A future admin interface would:

1. Import `pixellab.js`, `asset-checker.js`, `prompt-builder.js`
2. Display all assets by category with thumbnails
3. Show missing assets highlighted
4. Allow editing prompts and triggering regeneration
5. Preview before saving

This would be a dev-only Vue route within the Dorf app.

## Region Theme Mapping

For auto-generating background prompts:

| Region | Theme Keywords |
|--------|---------------|
| Blistering Cliffsides | volcanic, lava, black rock, ash, orange glow |
| Janxier Floodplain | flooded plains, murky water, dead trees, overcast |
| Old Fort Calindash | ruined fort, crumbling walls, overgrown, ghostly |
| Ancient Catacombs | underground tombs, stone coffins, torches, bones |
| Underground Morass | swamp cave, glowing mushrooms, murky water, roots |
| Gate to Aquaria | underwater, coral, blue-green light, bubbles |
| Coral Depths | deep ocean, coral reef, bioluminescent, dark water |

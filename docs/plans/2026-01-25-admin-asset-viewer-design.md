# Admin Asset Viewer Design

## Overview

Replace the current admin interface (Heroes, Enemies, Classes, Status Effects, Quest Nodes, Items editors) with a new Asset Viewer focused on visual asset management. Starting scope: **Heroes only**, with the architecture ready to expand to Enemies, Battle Backgrounds, and Maps later.

Core workflow: browse hero asset cards, see what's missing, generate new images via PixelLab, edit prompts, auto-crop portraits.

## Admin Screen Structure

The sidebar/content layout stays. Existing admin sub-components get removed:

**Remove:**
- `src/screens/admin/StatusEffectsAdmin.vue`
- `src/screens/admin/ClassesAdmin.vue`
- `src/screens/admin/ItemsAdmin.vue`
- `src/screens/admin/HeroesAdmin.vue`
- `src/screens/admin/EnemiesAdmin.vue`
- `src/screens/admin/QuestsAdmin.vue`
- `src/components/admin/AdminListPanel.vue`
- `src/components/admin/AdminEditPanel.vue`
- `src/composables/useAdminApi.js`

**Add:**
- `src/screens/admin/AssetViewerHeroes.vue` — grid of hero asset cards with filtering
- `src/components/admin/HeroAssetCard.vue` — individual card component
- `src/components/admin/HeroAssetModal.vue` — detail/generation modal

**Update:**
- `src/screens/AdminScreen.vue` — sidebar shows single "Heroes" section (expandable later), content renders `AssetViewerHeroes`

## Hero Asset Card

Each card represents one hero from `heroTemplates`, styled with the game's rarity system (diagonal gradient background, rarity color border).

**Card contents (top to bottom):**
1. **Image area** — 64x64 hero image centered in padded box. Missing images show a dark placeholder with "?"
2. **Hero name**
3. **Class/role badge** — e.g., "Paladin / Tank" with role icon
4. **Status icons row** — three indicators:
   - PNG: green check or red X
   - GIF: green check or red X
   - Portrait: green check or red X

**Visual treatment:**
- Cards with missing assets get a dashed border or dimmed opacity for quick scanning
- Grid sorts by rarity descending (5-star first)

## Hero Asset Modal

Opens on card click. Two-column layout.

### Left Column — Image Preview
- Large display of current hero image (`image-rendering: pixelated` for crisp scaling)
- Smaller thumbnails for GIF and portrait variants (if they exist)
- Missing images show placeholder text
- **"Create Portrait" button** — appears when main image exists but portrait doesn't

### Right Column — Generation
- **Prompt textarea** — pre-filled with:
  - Saved prompt from `assetPrompts.json` if it exists, OR
  - Default template: `"{name}. {class}. Holding a {weapon}. High fantasy."`
- **"Generate" button** — calls PixelLab API, shows loading spinner while polling
- **Preview area** — after generation completes, shows result alongside current image for comparison
- **"Save" / "Try Again" buttons:**
  - Save: writes PNG to `src/assets/heroes/{id}.png`, updates `assetPrompts.json`, closes preview
  - Try Again: clears preview, allows prompt editing and regeneration

## Prompt System

### Default Prompt Template
```
{hero name}. {class}. Holding a {weapon}. High fantasy.
```

### Weapon Mapping by Class
| Class | Weapon |
|-------|--------|
| Berserker | battle axe |
| Ranger | bow |
| Knight | sword and shield |
| Paladin | holy sword |
| Mage | magical energy |
| Cleric | holy staff |
| Druid | nature staff |
| Bard | lute |

### Prompt Storage — `src/data/assetPrompts.json`
```json
{
  "aurora_the_dawn": "Aurora the Dawn. Paladin. Holding a holy sword. High fantasy.",
  "shadow_king": "The Shadow King. Berserker. Holding a battle axe. High fantasy."
}
```

Read at load time to populate modal textarea. Written on every successful "Save".

## PixelLab Integration

### Browser API Client
The existing `scripts/lib/pixellab.js` is Node-only. For the admin UI, call the PixelLab API directly from the browser using a `VITE_PIXELLAB_TOKEN` environment variable. This is acceptable since the admin interface is a dev-only tool.

Image size for heroes: **64x64**.

### Dev Server Middleware
File saving requires filesystem access. Add a Vite dev server plugin with two routes:

- `POST /__admin/save-asset` — writes image bytes to the specified asset path
- `POST /__admin/save-prompts` — writes updated `assetPrompts.json`

## Portrait Auto-Crop

Portraits are 32x32 crops from the 64x64 hero image: centered horizontally (x=16), top-aligned (y=0).

**Flow:**
1. Load hero image into offscreen `<canvas>`
2. Crop 32x32 region from top-center
3. Show preview with "Looks good" / "Cancel" confirmation
4. On confirm, POST to `/__admin/save-asset` with path `heroes/{id}_portrait.png`
5. Modal thumbnail updates immediately

No manual crop adjustment — keep it simple. The confirmation step lets users abort if auto-centering doesn't look right.

## File Structure Summary

```
src/
  data/
    assetPrompts.json              (new) prompt storage
  screens/
    AdminScreen.vue                (update) new sidebar, single section
    admin/
      AssetViewerHeroes.vue        (new) hero grid view
  components/
    admin/
      HeroAssetCard.vue            (new) card component
      HeroAssetModal.vue           (new) modal with preview + generation
  lib/
    pixellab.js                    (new) browser-side PixelLab client
vite.config.js                     (update) add admin dev server middleware
```

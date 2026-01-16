# Claude Development Notes

Notes for AI assistants working on this project.

## Project Overview

Dorf is a Vue 3 gacha hero battler with turn-based combat. See `README.md` for full documentation and `docs/plans/2026-01-14-dorf-design.md` for the original design document.

## Hero Images

Located in `src/assets/heroes/{hero_id}.png` (static) or `{hero_id}.gif` (animated). Not all heroes have images.

**Heroes with images:** `militia_soldier`, `apprentice_mage`, `herb_gatherer`, `farm_hand`, `street_urchin`, `beggar_monk`, `wandering_bard`

**Heroes with animated GIFs:** `shadow_king`, `aurora_the_dawn`

**Loading pattern (Vite glob import with GIF priority):**
```js
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const gifPath = `../assets/heroes/${heroId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${heroId}.png`
  return heroImages[pngPath] || null
}
```

## Rarity System

| Rarity | Color | Gradient End (for backgrounds) |
|--------|-------|-------------------------------|
| 1-star (Common) | `#9ca3af` | `#262d36` |
| 2-star (Uncommon) | `#22c55e` | `#1f3329` |
| 3-star (Rare) | `#3b82f6` | `#1f2a3d` |
| 4-star (Epic) | `#a855f7` | `#2a2340` |
| 5-star (Legendary) | `#f59e0b` | `#302a1f` |

Base background color: `#1f2937`

**Card backgrounds:** Diagonal gradient (135deg) from base to tinted color
**Detail panel:** Horizontal gradient bar (4px) at top, rarity color fading to base

## Role Icons

```js
const roleIcons = {
  tank: '🛡️',
  dps: '⚔️',
  healer: '💚',
  support: '✨'
}
```

## UI Patterns

### Placement Mode (HeroesScreen)
When adding a hero to party:
1. Set `placingHero` to the hero being placed
2. Hide the detail panel (`v-if="selectedHero && !placingHero"`)
3. Show compact placement bar with hero name and cancel button
4. On slot click: place hero and clear `placingHero`
5. On cancel: clear `placingHero` (returns to detail view)

### Combat vs Non-Combat Display (HeroCard)
- `showBars` prop indicates combat mode (HP/MP bars visible)
- Hero images in card header are hidden during combat (`v-if="!showBars && ..."`)

## Key Files

- `src/stores/heroes.js` - Hero collection, party management
- `src/stores/battle.js` - Combat state machine
- `src/stores/gacha.js` - Pull logic, pity counters
- `src/stores/quests.js` - Quest progress, node unlocks, `lastVisitedNode` tracking
- `src/data/heroTemplates.js` - Hero definitions
- `src/data/classes.js` - Class definitions (role, resource name)
- `src/data/statusEffects.js` - Buff/debuff definitions
- `src/data/questNodes.js` - Quest node definitions, region data

## World Map System

The world map displays quest nodes as an interactive graph with dotted trail connections.

### Components

- `src/components/MapCanvas.vue` - Main map container with SVG trails and scaling
- `src/components/NodeMarker.vue` - Clickable node markers with pulse animation

### Region Data Structure

```js
{
  id: 'whispering_woods',
  name: 'Whispering Woods',
  startNode: 'forest_01',
  width: 800,              // Native canvas size
  height: 500,
  backgroundColor: '#1a2f1a',
  backgroundImage: whisperingWoodsMap  // Imported asset
}
```

### Quest Node Structure

```js
{
  id: 'forest_01',
  name: 'Dark Thicket',
  region: 'Whispering Woods',
  x: 100,                  // Position on region map (native coordinates)
  y: 250,
  battles: [...],
  connections: ['forest_02'],  // Drives trail rendering
  rewards: { gems: 50, exp: 80 },
  firstClearBonus: { gems: 30 }
}
```

### Map Background Images

Located in `src/assets/maps/{region_id}.png`. Import and assign to region's `backgroundImage` property.

```js
import whisperingWoodsMap from '../assets/maps/whispering_woods.png'
// Then in regions array:
backgroundImage: whisperingWoodsMap
```

Recommended size: 800x500 pixels (matches region width/height).

### Trail Visibility Logic

- Both nodes unlocked: Full visibility trail
- One node unlocked: Faded trail (teaser effect)
- Neither unlocked: Hidden

## Battle Backgrounds

Located in `src/assets/backgrounds/{node_id}.png`. Loaded via glob import in BattleScreen.

The `quests.js` store tracks `lastVisitedNode` to show the most recent battle background on the home screen party section.

## UI Patterns

### Non-Selectable Floating Text

Damage numbers, healing numbers, and XP floaters use `user-select: none` to prevent accidental text selection during combat.

### Sequential Reveal Animation (GachaScreen)

Summon results appear one at a time with a "pop" animation:
```js
const revealedCount = ref(0)

watch(showResults, (show) => {
  if (show) {
    revealedCount.value = 0
    const revealNext = () => {
      if (revealedCount.value < lastPullResults.value.length) {
        revealedCount.value++
        setTimeout(revealNext, 200)
      }
    }
    setTimeout(revealNext, 300)
  }
})
```

Template uses `v-if="index < revealedCount"` to control visibility.

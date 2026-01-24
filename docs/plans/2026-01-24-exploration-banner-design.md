# Exploration Banner Design

## Overview

Add a visual banner to the ExplorationDetailView showing the battle background with assigned heroes overlaid in a staggered formation. This creates an "adventure party" feel and gives players a visual representation of their exploration team.

## Layout

The banner sits at the top of the detail content, above the Party Request section.

```
┌─────────────────────────────────────────────┐
│  Battle Background (from backgroundId)      │
│                                             │
│       [H2]           [H4]                   │
│    [H1]   [H3]   [H5]                       │
│                                             │
└─────────────────────────────────────────────┘
```

**Hero Positioning (staggered/layered):**
- Hero 3 (center): Largest, lowest position, highest z-index (appears "in front")
- Heroes 2 & 4: Medium size, mid-height
- Heroes 1 & 5: Smallest, highest position (appears "in back")
- Creates a pyramid/V-formation with visual depth

## Technical Approach

### Data Flow

**When exploration is active:**
- Use `exploration.heroes` array (5 instanceIds)

**When selecting heroes:**
- Use `selectedHeroes` array (0-5 instanceIds as user picks them)

**Mapping to images:**
```
instanceId → heroesStore.getHeroFull() → hero.templateId → image path
```

### Image Loading

```js
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })
const heroGifs = import.meta.glob('../assets/heroes/*.gif', { eager: true, import: 'default' })
const battleBackgrounds = import.meta.glob('../assets/battle_backgrounds/*.png', { eager: true, import: 'default' })

function getHeroImageUrl(templateId) {
  const gifPath = `../assets/heroes/${templateId}.gif`
  if (heroGifs[gifPath]) return heroGifs[gifPath]
  const pngPath = `../assets/heroes/${templateId}.png`
  return heroImages[pngPath] || null
}

function getBackgroundUrl(backgroundId) {
  const path = `../assets/battle_backgrounds/${backgroundId}.png`
  return battleBackgrounds[path] || battleBackgrounds['../assets/battle_backgrounds/default.png']
}
```

### Display Heroes Computed

```js
const displayHeroes = computed(() => {
  const heroIds = isActive.value
    ? exploration.value.heroes
    : selectedHeroes.value

  return [0, 1, 2, 3, 4].map(i => {
    const instanceId = heroIds[i]
    if (!instanceId) return null
    return heroesStore.getHeroFull(instanceId)
  })
})
```

### CSS Positioning

| Slot | Position | Left | Bottom | Scale | Z-Index |
|------|----------|------|--------|-------|---------|
| 0 | Far left | 5% | 10px | 0.8 | 1 |
| 1 | Left-mid | 20% | 20px | 0.9 | 2 |
| 2 | Center | 40% | 30px | 1.0 | 3 |
| 3 | Right-mid | 60% | 20px | 0.9 | 2 |
| 4 | Far right | 75% | 10px | 0.8 | 1 |

## Visual Styling

### Banner Container
- Height: 180px
- Border-radius: 12px (top corners)
- Background: Battle background image from `node.backgroundId`
- Overlay: Dark gradient (rgba(0,0,0,0.3) to rgba(0,0,0,0.5)) so heroes pop

### Hero Images
- Max height: 150px for center hero, scaled proportionally for others
- Drop shadow: `0 4px 12px rgba(0,0,0,0.5)`
- Position: absolute within banner
- Transition: smooth fade-in when added during selection

### Empty Slots
- Show nothing (keep it clean)
- Background visible through empty positions

## Template Structure

```html
<div class="detail-content">
  <!-- NEW: Exploration Banner -->
  <div class="exploration-banner" :style="{ backgroundImage: `url(${backgroundUrl})` }">
    <div class="banner-overlay"></div>
    <div
      v-for="(hero, index) in displayHeroes"
      :key="index"
      :class="['banner-hero', `slot-${index}`]"
    >
      <img
        v-if="hero"
        :src="getHeroImageUrl(hero.templateId)"
        :alt="hero.template?.name"
      />
    </div>
  </div>

  <!-- Existing content -->
  <div class="party-request">...</div>
</div>
```

## Edge Cases

1. **No heroes selected:** Show just the background (no placeholder needed)
2. **Animated GIF heroes:** Prefer `.gif` over `.png` when available
3. **Missing hero image:** Show nothing for that slot (graceful degradation)
4. **Missing background:** Fall back to default.png

## Files Modified

- `src/components/ExplorationDetailView.vue` - Add banner section and styling

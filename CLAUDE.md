# Claude Development Notes

Notes for AI assistants working on this project.

## Project Overview

Dorf is a Vue 3 gacha hero battler with turn-based combat. See `README.md` for full documentation and `docs/plans/2026-01-14-dorf-design.md` for the original design document.

## Hero Images

Located in `src/assets/heroes/{hero_id}.png`. Not all heroes have images.

**Heroes with images:** `militia_soldier`, `apprentice_mage`, `herb_gatherer`, `farm_hand`, `street_urchin`, `beggar_monk`, `wandering_bard`

**Loading pattern (Vite glob import):**
```js
const heroImages = import.meta.glob('../assets/heroes/*.png', { eager: true, import: 'default' })

function getHeroImageUrl(heroId) {
  const path = `../assets/heroes/${heroId}.png`
  return heroImages[path] || null
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
- `src/data/heroTemplates.js` - Hero definitions
- `src/data/classes.js` - Class definitions (role, resource name)
- `src/data/statusEffects.js` - Buff/debuff definitions

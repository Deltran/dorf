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

## Key Files

### Stores
- `src/stores/heroes.js` - Hero collection, party management, party leader
- `src/stores/battle.js` - Combat state machine, leader skill processing
- `src/stores/gacha.js` - Pull logic, pity counters, gems and gold currency
- `src/stores/quests.js` - Quest progress, node unlocks, `lastVisitedNode` tracking
- `src/stores/inventory.js` - Item storage and management

### Data
- `src/data/heroTemplates.js` - Hero definitions with skills and leader skills
- `src/data/enemyTemplates.js` - Enemy definitions
- `src/data/classes.js` - Class definitions (role, resource name)
- `src/data/statusEffects.js` - Buff/debuff definitions
- `src/data/questNodes.js` - Quest node definitions, region data
- `src/data/items.js` - Item definitions (XP tomes, junk items)

### Components
- `src/components/HeroCard.vue` - Hero display card
- `src/components/EnemyCard.vue` - Enemy display card
- `src/components/ItemCard.vue` - Item display card
- `src/components/MapCanvas.vue` - World map container with SVG trails
- `src/components/NodeMarker.vue` - Clickable quest node markers

## Leader Skills

5-star (Legendary) heroes have leader skills that activate when set as party leader.

### Leader Skill Types

**Passive** - Always active stat bonuses:
```js
leaderSkill: {
  name: "Dawn's Protection",
  description: 'Non-knight allies gain +15% DEF',
  effects: [{
    type: 'passive',
    stat: 'def',
    value: 15,
    condition: { classId: { not: 'knight' } }
  }]
}
```

**Timed** - Trigger at specific round:
```js
leaderSkill: {
  name: 'Lord of Shadows',
  description: 'On round 1, all allies gain +25% ATK for 2 turns',
  effects: [{
    type: 'timed',
    triggerRound: 1,
    target: 'all_allies',
    apply: {
      effectType: 'atk_up',
      duration: 2,
      value: 25
    }
  }]
}
```

**Timed Heal** - Round-triggered healing based on leader's ATK:
```js
leaderSkill: {
  name: 'Ancient Awakening',
  description: "On round 1, all allies are healed for 10% of Yggra's ATK",
  effects: [{
    type: 'timed',
    triggerRound: 1,
    target: 'all_allies',
    apply: {
      effectType: 'heal',
      value: 10  // Percentage of leader's ATK
    }
  }]
}
```

### Condition System

Conditions filter which units receive effects:
- `{ classId: 'knight' }` - Only knights
- `{ classId: { not: 'knight' } }` - All except knights
- `{ role: 'dps' }` - Only DPS role
- `{ role: { not: 'healer' } }` - All except healers

### Leader Skill Visual Effects

- **Timed skills**: Golden glow on leader card + floating skill name (1.5s)
- **Passive skills**: Brief green pulse on affected heroes at battle start (1.2s)

### Setting Party Leader

In `heroes.js` store:
- `partyLeader` ref holds the instanceId of the leader
- `setPartyLeader(instanceId)` to set (must be in party)
- `leaderHero` computed returns the full hero object
- HeroesScreen shows crown icon (👑) on leader's party slot

## Currency System

Two currencies managed in `gacha.js`:
- **Gems** (`gems`) - Premium currency for gacha pulls, starting at 1000
- **Gold** (`gold`) - Common currency for merging, starting at 10000

```js
gachaStore.addGems(amount)
gachaStore.spendGems(amount) // Returns false if insufficient
gachaStore.addGold(amount)
gachaStore.spendGold(amount) // Returns false if insufficient
```

## Item System

### Item Structure

```js
{
  id: 'tome_medium',
  name: 'Knowledge Tome',
  description: 'A well-preserved collection of teachings.',
  type: 'xp',        // 'xp' or 'junk'
  rarity: 2,         // 1-5
  xpValue: 200,      // For XP items
  sellReward: { gems: 40 }
}
```

### Inventory Store

```js
inventoryStore.addItem(itemId, count)
inventoryStore.removeItem(itemId, count)
inventoryStore.getItemCount(itemId)
inventoryStore.sellItem(itemId, count)  // Gives sellReward
inventoryStore.itemList  // Computed: sorted array of items with counts
```

### Item Drops

Quest nodes can drop items. In `questNodes.js`:
```js
rewards: { gems: 50, exp: 80, gold: 100 },
itemDrops: [
  { itemId: 'tome_small', chance: 0.3 },
  { itemId: 'useless_rock', chance: 0.5 }
]
```

Victory screen shows item drops with sequential reveal animation.

## World Map System

The world map displays quest nodes as an interactive graph with dotted trail connections.

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
  rewards: { gems: 50, exp: 80, gold: 100 },
  firstClearBonus: { gems: 30 },
  itemDrops: [{ itemId: 'tome_small', chance: 0.3 }]
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

Located in `src/assets/battle_backgrounds/{node_id}.png`. Loaded via glob import in BattleScreen.

The `quests.js` store tracks `lastVisitedNode` to show the most recent battle background on the home screen party section.

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

### Non-Selectable Floating Text

Damage numbers, healing numbers, and XP floaters use `user-select: none` to prevent accidental text selection during combat.

### Sequential Reveal Animation

Used in GachaScreen (summon results) and BattleScreen (item drops):
```js
const revealedCount = ref(0)

watch(showResults, (show) => {
  if (show) {
    revealedCount.value = 0
    const revealNext = () => {
      if (revealedCount.value < items.length) {
        revealedCount.value++
        setTimeout(revealNext, 200)
      }
    }
    setTimeout(revealNext, 300)
  }
})
```

Template uses `v-if="index < revealedCount"` to control visibility.

## Hero Roster

| Rarity | Heroes |
|--------|--------|
| 5-star | Aurora the Dawn (Paladin), Shadow King (Berserker), Yggra the World Root (Druid) |
| 4-star | Sir Gallan (Knight), Shasha Ember Witch (Mage), Lady Moonwhisper (Cleric), Swift Arrow (Ranger) |
| 3-star | Kensin Squire (Knight), Knarly Zeek (Mage), Grandma Helga (Cleric), Harl the Handsom (Bard) |
| 2-star | Sorju Gate Guard (Knight), Calisus (Mage), Bertan the Gatherer (Druid) |
| 1-star | Darl (Berserker), Salia (Ranger), Vagrant Bil (Cleric) |

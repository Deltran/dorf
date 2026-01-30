# Data Source Restructuring Design

## Problem

Three data files have grown large enough to impact context usage and maintainability:

| File | Size | Est. Tokens |
|------|------|-------------|
| questNodes.js | 80KB | ~20,000 |
| heroTemplates.js | 36KB | ~9,000 |
| enemyTemplates.js | 28KB | ~7,000 |

With planned roster expansion (doubling heroes, adding regions), these will only grow.

## Solution

Split each data source into smaller files organized by natural game concepts. Maintain existing helper functions and exports so consuming code doesn't change.

---

## Heroes Structure

**Before:** Single `src/data/heroTemplates.js` with 19 heroes.

**After:** Folders by rarity, files per hero.

```
src/data/heroes/
  5star/
    aurora_the_dawn.js
    shadow_king.js
    yggra_world_root.js
    index.js           # exports { heroes: { ...allFiveStars } }
  4star/
    sir_gallan.js
    ember_witch.js
    lady_moonwhisper.js
    swift_arrow.js
    index.js
  3star/
    town_guard.js
    hedge_wizard.js
    village_healer.js
    wandering_bard.js
    index.js
  2star/
    militia_soldier.js
    apprentice_mage.js
    herb_gatherer.js
    index.js
  1star/
    farm_hand.js
    street_urchin.js
    beggar_monk.js
    street_busker.js
    fennick.js
    index.js
  index.js             # merges all, exports heroTemplates + helpers
```

**Individual hero file:**
```js
// src/data/heroes/5star/aurora_the_dawn.js
import { EffectType } from '../../statusEffects.js'

export const aurora_the_dawn = {
  id: 'aurora_the_dawn',
  name: 'Aurora the Dawn',
  rarity: 5,
  classId: 'paladin',
  baseStats: { hp: 140, atk: 28, def: 30, spd: 12, mp: 60 },
  skills: [...],
  leaderSkill: {...}
}
```

**Rarity index file:**
```js
// src/data/heroes/5star/index.js
import { aurora_the_dawn } from './aurora_the_dawn.js'
import { shadow_king } from './shadow_king.js'
import { yggra_world_root } from './yggra_world_root.js'

export const heroes = {
  aurora_the_dawn,
  shadow_king,
  yggra_world_root
}
```

**Main index file:**
```js
// src/data/heroes/index.js
import { heroes as fiveStar } from './5star/index.js'
import { heroes as fourStar } from './4star/index.js'
import { heroes as threeStar } from './3star/index.js'
import { heroes as twoStar } from './2star/index.js'
import { heroes as oneStar } from './1star/index.js'

export const heroTemplates = {
  ...fiveStar,
  ...fourStar,
  ...threeStar,
  ...twoStar,
  ...oneStar
}

export function getHeroTemplate(templateId) {
  return heroTemplates[templateId] || null
}

export function getHeroTemplatesByRarity(rarity) {
  return Object.values(heroTemplates).filter(h => h.rarity === rarity)
}

export function getAllHeroTemplates() {
  return Object.values(heroTemplates)
}
```

---

## Quest Nodes Structure

**Before:** Single `src/data/questNodes.js` with ~83 nodes across 14 regions.

**After:** Files per region, separate regions metadata file.

```
src/data/quests/
  whispering_woods.js
  echoing_caverns.js
  whisper_lake.js
  stormwind_peaks.js
  hibernation_den.js
  the_summit.js
  blistering_cliffsides.js
  eruption_vent.js
  janxier_floodplain.js
  old_fort_calindash.js
  ancient_catacombs.js
  underground_morass.js
  gate_to_aquaria.js
  coral_depths.js
  regions.js           # regions + superRegions arrays
  index.js             # merges all, exports helpers
```

**Individual region file:**
```js
// src/data/quests/whispering_woods.js
import whisperingWoodsMap from '../../assets/maps/whispering_woods.png'

export const regionMeta = {
  id: 'whispering_woods',
  name: 'Whispering Woods',
  superRegion: 'western_veros',
  startNode: 'forest_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a2f1a',
  backgroundImage: whisperingWoodsMap
}

export const nodes = {
  forest_01: {
    id: 'forest_01',
    name: 'Dark Thicket',
    region: 'Whispering Woods',
    x: 100,
    y: 320,
    battles: [...],
    connections: ['forest_02'],
    rewards: { gems: 50, gold: 100, exp: 80 },
    firstClearBonus: { gems: 30 },
    itemDrops: [...]
  },
  // ... more nodes
}
```

**Regions file:**
```js
// src/data/quests/regions.js
import { regionMeta as whisperingWoods } from './whispering_woods.js'
import { regionMeta as echoingCaverns } from './echoing_caverns.js'
// ... all regions

export const regions = [
  whisperingWoods,
  echoingCaverns,
  // ...
]

export const superRegions = [
  {
    id: 'western_veros',
    name: 'Western Veros',
    description: 'The familiar lands where your journey began',
    unlockedByDefault: true
  },
  {
    id: 'aquarias',
    name: 'Aquarias',
    description: 'A realm beneath the waves',
    unlockedByDefault: false,
    unlockCondition: { completedNode: 'aqua_08' }
  }
]
```

**Main index file:**
```js
// src/data/quests/index.js
import { nodes as whisperingWoodsNodes } from './whispering_woods.js'
import { nodes as echoingCavernsNodes } from './echoing_caverns.js'
// ... all regions

export { regions, superRegions } from './regions.js'

export const questNodes = {
  ...whisperingWoodsNodes,
  ...echoingCavernsNodes,
  // ...
}

export function getQuestNode(nodeId) {
  return questNodes[nodeId] || null
}

export function getNodesByRegion(regionName) {
  return Object.values(questNodes).filter(n => n.region === regionName)
}

export function getAllQuestNodes() {
  return Object.values(questNodes)
}

export function getRegion(regionId) {
  return regions.find(r => r.id === regionId) || null
}

export function getSuperRegion(superRegionId) {
  return superRegions.find(sr => sr.id === superRegionId) || null
}

export function getRegionsBySuperRegion(superRegionId) {
  return regions.filter(r => r.superRegion === superRegionId)
}
```

---

## Enemies Structure

**Before:** Single `src/data/enemyTemplates.js` with ~60 enemies across 13 area groups.

**After:** Files per region/area, mirroring quest structure.

```
src/data/enemies/
  forest.js            # Forest enemies (early game)
  lake.js              # Lake enemies (branching area)
  cave.js              # Cave enemies (mid game)
  mountain.js          # Mountain enemies (late game)
  boss.js              # Boss enemies
  summit.js            # The Summit enemies
  blistering.js        # Blistering Cliffsides enemies
  janxier.js           # Janxier Floodplain enemies
  fort.js              # Old Fort Calindash enemies
  catacombs.js         # Ancient Catacombs enemies
  morass.js            # Underground Morass enemies
  aquaria_gate.js      # Gate to Aquaria enemies
  coral.js             # Coral Depths enemies
  index.js             # merges all, exports helpers
```

**Individual enemy file:**
```js
// src/data/enemies/forest.js
import { EffectType } from '../statusEffects.js'

export const enemies = {
  goblin_scout: {
    id: 'goblin_scout',
    name: 'Goblin Scout',
    stats: { hp: 50, atk: 15, def: 5, spd: 12 },
    skill: {...}
  },
  goblin_warrior: {...},
  // ... more forest enemies
}
```

**Main index file:**
```js
// src/data/enemies/index.js
import { enemies as forest } from './forest.js'
import { enemies as lake } from './lake.js'
// ... all regions

export const enemyTemplates = {
  ...forest,
  ...lake,
  // ...
}

export function getEnemyTemplate(templateId) {
  return enemyTemplates[templateId] || null
}

export function getAllEnemyTemplates() {
  return Object.values(enemyTemplates)
}
```

---

## Import Path Updates

Update `src/data/index.js` to re-export from new locations:

```js
// src/data/index.js
export * from './heroes/index.js'
export * from './quests/index.js'
export * from './enemies/index.js'
```

All existing imports via `../data/heroTemplates.js` etc. will need updating to `../data/heroes/index.js` OR the consuming code can use `../data/index.js` which re-exports everything.

---

## Files to Delete After Migration

- `src/data/heroTemplates.js`
- `src/data/questNodes.js`
- `src/data/enemyTemplates.js`

---

## Migration Approach

Single PR that:
1. Creates new folder structure with all files
2. Updates all imports across the codebase
3. Deletes old monolithic files
4. Runs full test suite to verify nothing broke

---

## Verification

- All existing tests pass
- `npm run dev` works
- Battle, gacha, world map, heroes screen all function correctly
- Admin asset viewers still load data

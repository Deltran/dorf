# Janxier Floodplain Exploration Design

## Overview

Add an exploration node to the Janxier Floodplain region, unlocked mid-region after completing Naga Territory (flood_03). Uses Pyroclast's Crest for rank upgrades, creating a cross-region connection to Blistering Cliffsides.

## Exploration Node

- **ID**: `flood_exploration`
- **Name**: Janxier Floodplain Exploration
- **Region**: Janxier Floodplain
- **Position**: x: 620, y: 450 (lower-right, away from main quest path)
- **Unlocked by**: `flood_03` (Naga Territory)
- **Background**: `flood_01` (reuse Muddy Banks battle background)
- **Required crest**: `pyroclast_crest` (from Blistering Cliffsides Genus Loci)

## Difficulty & Rewards

| Setting | Value |
|---------|-------|
| Required fights | 65 |
| Time limit | 300 min (5 hours) |
| Gold | 600 |
| Gems | 25 |
| XP | 350 |

## Party Request

**"Diverse scouts (3+ different classes)"** — requires 3 or more unique classes among the 5 expedition heroes. Grants +10% bonus to gold/gems/xp when met.

This introduces a new condition type (`uniqueClasses`) that needs to be added to the exploration party request validation logic.

## Item Drops

- `tome_large` — 40% chance
- `token_blistering_cliffs` — 15% chance
- `token_janxier_floodplain` (new) — 15% chance

## New Item: Janxier Floodplain Token

```js
token_janxier_floodplain: {
  id: 'token_janxier_floodplain',
  name: 'Janxier Floodplain Token',
  description: 'Instantly collect rewards from a completed Janxier Floodplain quest.',
  type: 'token',
  rarity: 3,
  region: 'Janxier Floodplain'
}
```

## Quest Node Definition

```js
flood_exploration: {
  id: 'flood_exploration',
  name: 'Janxier Floodplain Exploration',
  region: 'Janxier Floodplain',
  x: 620,
  y: 450,
  type: 'exploration',
  unlockedBy: 'flood_03',
  backgroundId: 'flood_01',
  connections: [],
  explorationConfig: {
    requiredFights: 65,
    timeLimit: 300,
    rewards: { gold: 600, gems: 25, xp: 350 },
    requiredCrestId: 'pyroclast_crest',
    itemDrops: [
      { itemId: 'tome_large', chance: 0.4 },
      { itemId: 'token_blistering_cliffs', chance: 0.15 },
      { itemId: 'token_janxier_floodplain', chance: 0.15 }
    ],
    partyRequest: {
      description: 'Diverse scouts (3+ different classes)',
      conditions: [
        { uniqueClasses: 3 }
      ]
    }
  }
}
```

## Files to Modify

1. **`src/data/items.js`** — Add `token_janxier_floodplain`
2. **`src/data/questNodes.js`** — Add `flood_exploration` node
3. **`src/stores/explorations.js`** — Add `uniqueClasses` condition check in party request validation

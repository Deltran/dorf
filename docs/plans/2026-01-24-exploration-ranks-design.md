# Exploration Ranks Design

## Overview

Add a ranking system to explorations that allows players to upgrade explorations from Rank E to Rank S. Each rank increases base rewards by a configurable percentage (default 5%). Upgrades cost Genus Loci crests (configurable per exploration) and gold.

## Ranks

| Rank | Bonus | Cumulative |
|------|-------|------------|
| E | +0% | Base |
| D | +5% | +5% |
| C | +10% | +10% |
| B | +15% | +15% |
| A | +20% | +20% |
| S | +25% | +25% |

## Upgrade Costs

| Upgrade | Crests | Gold |
|---------|--------|------|
| E → D | 1 | 1,000 |
| D → C | 5 | 1,500 |
| C → B | 15 | 2,250 |
| B → A | 50 | 3,375 |
| A → S | 100 | 5,000 |

## Constraints

- Cannot upgrade an exploration while it is active/in progress
- Each exploration specifies which crest it requires via `requiredCrestId` in config
- Rank S is the maximum (no further upgrades)

## Data Structure

### New File: `src/data/explorationRanks.js`

```js
export const RANK_BONUS_PER_LEVEL = 5 // 5% per rank - configurable

export const EXPLORATION_RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

export const RANK_UPGRADE_COSTS = {
  E: { crests: 1, gold: 1000 },
  D: { crests: 5, gold: 1500 },
  C: { crests: 15, gold: 2250 },
  B: { crests: 50, gold: 3375 },
  A: { crests: 100, gold: 5000 }
  // S is max, no upgrade from S
}
```

### Quest Node Config Addition

```js
// In questNodes.js
cave_exploration: {
  // ... existing fields
  explorationConfig: {
    // ... existing fields
    requiredCrestId: 'valinar_crest'  // Which crest upgrades this exploration
  }
}
```

### Store State Addition

```js
// In explorations.js
const explorationRanks = ref({})  // { nodeId: 'E' | 'D' | 'C' | ... }
```

## Store Functions

### `getExplorationRank(nodeId)`
Returns the current rank for an exploration (defaults to 'E').

### `getRankMultiplier(nodeId)`
Returns the reward multiplier based on rank (E=1.0, D=1.05, C=1.10, etc.).

### `canUpgradeExploration(nodeId)`
Checks if upgrade is possible and returns:
- `canUpgrade`: boolean
- `reason`: error message if can't upgrade
- `currentRank` / `nextRank`
- `crestId` / `crestsNeeded` / `crestsHave`
- `goldNeeded` / `goldHave`

### `upgradeExploration(nodeId)`
Performs the upgrade: deducts costs, increases rank.

## Reward Calculation

Update `claimCompletion` to apply rank multiplier:

```js
const rankMultiplier = getRankMultiplier(nodeId)
const partyMultiplier = exploration.partyRequestMet ? 1.10 : 1.0
const bonusMultiplier = rankMultiplier * partyMultiplier
```

Rank bonus and party request bonus stack multiplicatively.

## UI Changes

### ExplorationsScreen (List View)

- Rank badge on each exploration card (top-right corner)
- "Enhance" button on each card
- Button disabled when exploration is active
- Badge colors: E=gray, D=green, C=blue, B=purple, A=orange, S=gold with glow

### ExplorationDetailView

- Rank badge next to exploration name
- Current bonus display: "Rank C: +10% rewards"
- "Enhance" button in actions area
- Button disabled when exploration is active

### Enhance Modal

- Shows current rank → next rank transition
- Crest requirement with icon and have/need count
- Gold requirement with have/need count
- Confirm/Cancel buttons
- Confirm disabled if requirements not met

## Persistence

Add `explorationRanks` to save/load state:

```js
function saveState() {
  return {
    activeExplorations: activeExplorations.value,
    completedHistory: completedHistory.value,
    explorationRanks: explorationRanks.value
  }
}
```

## Files Modified

- `src/data/explorationRanks.js` (new)
- `src/data/questNodes.js` (add `requiredCrestId`)
- `src/stores/explorations.js` (add rank state + functions)
- `src/screens/ExplorationsScreen.vue` (badge + enhance button)
- `src/components/ExplorationDetailView.vue` (badge + enhance button + modal)

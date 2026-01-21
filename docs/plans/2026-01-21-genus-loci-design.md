# Genus Loci System Design

## Overview

Genus Loci is an endgame boss challenge system featuring powerful single bosses with deeper ability kits than normal enemies. Each Genus Loci requires both a map node unlock and a consumable key item to attempt.

## Access System

### Requirements

- **Key Item**: Consumable item specific to each Genus Loci (e.g., Lake Tower Key for Valinar)
- **Map Node**: Dedicated node in a specific region must be unlocked through normal progression

### Access Flow

**First Attempt:**
1. Player has required key item in inventory
2. Player has unlocked the Genus Loci's map node
3. Clicking the node prompts "Challenge [Boss]? (Key x1 required)"
4. Confirming consumes the key and enters Power Level 1 fight directly

**Subsequent Attempts:**
1. Clicking the node opens power level selector
2. Only unlocked levels are available (beat level N to unlock level N+1)
3. Confirming consumes the key and starts the selected level

### Key Items

- Consumed on each attempt (win or lose)
- Drop from thematically-tied content (e.g., Lake Tower Key drops from Whisper Lake region bosses)
- Type: `key` in items.js

## Power Level System

- Levels range from 1 to 20+ (configurable per boss)
- Unlock-based progression: defeating level N unlocks level N+1
- Scaling per level:
  - Base stats (HP, ATK, DEF) multiply by scaling factor
  - New abilities unlock at milestone levels (e.g., 5, 10, 15, 20)

## Rewards

- **Guaranteed unique drop**: Collectible item specific to each Genus Loci (future use TBD)
- **Scaling gold**: Base amount + per-level bonus
- **First clear bonus**: One-time gem reward on first ever victory

Example (Valinar):
- First clear: 20 gems
- Gold: 100 base + 25 per level (Level 1 = 100, Level 10 = 325)
- Unique drop: Valinar's Crest (guaranteed)

## UI and Navigation

### Home Screen Panel

The "Genus Loci" section is always visible on the home screen.

**When no Genus Loci are unlocked:**
- Shows a mysterious/teaser style card or button
- Tapping opens a screen with text: "Powerful guardians await in the world. Seek them out on your quest."

**When one or more are unlocked:**
- Displays unlocked bosses as small cards/icons
- Each card shows: boss name, image, highest cleared level, current key count
- Tap a boss to open its power level selection

### World Map Node

- Distinct visual style (special icon/glow) to indicate Genus Loci fight
- Different from normal combat nodes

### Power Level Selection Screen

- Lists power levels 1 through max
- Locked levels grayed with "Defeat Lv.N to unlock"
- Shows: recommended power, reward preview, key cost (1)
- "Challenge" button consumes key and starts fight

## Data Structures

### Genus Loci Definition (`src/data/genusLoci.js`)

```js
{
  id: 'valinar',
  name: 'Valinar, Lake Tower Guardian',
  description: 'A corrupted sentinel who guards the ancient lake tower.',
  region: 'whisper_lake',
  nodeId: 'whisper_lake_genus_loci',
  keyItemId: 'lake_tower_key',
  maxPowerLevel: 20,
  baseStats: { hp: 5000, atk: 150, def: 100, spd: 80 },
  statScaling: { hp: 1.15, atk: 1.1, def: 1.08 },
  abilities: [
    { id: 'iron_guard', unlocksAt: 1 },
    { id: 'heavy_strike', unlocksAt: 1 },
    { id: 'shield_bash', unlocksAt: 5 },
    { id: 'towers_wrath', unlocksAt: 10 },
    { id: 'counterattack_stance', unlocksAt: 15 },
    { id: 'judgment_of_ages', unlocksAt: 20 }
  ],
  uniqueDrop: { itemId: 'valinar_crest', guaranteed: true },
  firstClearBonus: { gems: 20 },
  currencyRewards: {
    base: { gold: 100 },
    perLevel: { gold: 25 }
  }
}
```

### Key Item (`src/data/items.js`)

```js
{
  id: 'lake_tower_key',
  name: 'Lake Tower Key',
  description: 'An ancient key that grants passage to the Lake Tower. Used to challenge Valinar.',
  type: 'key',
  rarity: 3
}
```

### Unique Drop Item (`src/data/items.js`)

```js
{
  id: 'valinar_crest',
  name: "Valinar's Crest",
  description: 'A battle-worn crest pried from the Lake Tower Guardian. Its purpose remains unknown.',
  type: 'genusLoci',
  rarity: 4
}
```

### Quest Node (`src/data/questNodes.js`)

```js
{
  id: 'whisper_lake_genus_loci',
  name: 'Lake Tower',
  region: 'whisper_lake',
  x: 380,
  y: 120,
  type: 'genusLoci',
  genusLociId: 'valinar',
  connections: ['whisper_lake_04'],
  unlockCondition: { nodeCleared: 'whisper_lake_boss' }
}
```

## State Management (`src/stores/genusLoci.js`)

### State Structure

```js
{
  progress: {
    valinar: {
      unlocked: true,
      highestCleared: 12,
      firstClearClaimed: true
    }
  }
}
```

### Store Actions

- `isUnlocked(genusLociId)` - Returns whether this boss appears in home screen panel
- `getHighestCleared(genusLociId)` - Returns highest defeated level (0 if never beaten)
- `canChallenge(genusLociId, powerLevel)` - Checks: level unlocked AND has key item
- `recordVictory(genusLociId, powerLevel)` - Updates highestCleared, marks unlocked, handles first clear
- `getAvailableLevels(genusLociId)` - Returns array of unlockable levels (1 through highestCleared + 1)

## Battle Integration

### Starting a Battle

1. Consume 1 key item from inventory
2. Initialize battle store with `battleType: 'genusLoci'` and metadata: `{ genusLociId, powerLevel }`
3. Generate boss enemy scaled to power level
4. Navigate to BattleScreen

### Enemy Generation

- Stats: `baseStat * (statScaling ^ (powerLevel - 1))`
- Abilities: Filter to those where `unlocksAt <= powerLevel`

### Boss AI Behavior

- Iron Guard used proactively when no DEF buff active
- Heavy Strike used when a hero is low HP
- Shield Bash prioritizes high-threat targets (healers, DPS)
- Tower's Wrath triggers automatically at 50% HP threshold
- Judgment of Ages used periodically or at HP thresholds

### Victory Handling

1. Call `genusLociStore.recordVictory(id, level)`
2. Award gold: `base + (perLevel * (powerLevel - 1))`
3. Award first-clear gems if applicable
4. Grant guaranteed unique drop item
5. Show victory screen with rewards

### Defeat Handling

Key is already consumed, no rewards. Return to world map or home.

## Valinar, Lake Tower Guardian

### Theme

Corrupted knight/sentinel - armored guardian with shields, counterattacks, and punishing hits.

### Abilities

| Level | Ability | Description |
|-------|---------|-------------|
| 1 | Iron Guard | Self-buff granting +50% DEF for 2-3 turns. May also grant a damage-absorbing shield. |
| 1 | Heavy Strike | High-damage single-target attack. Targets lowest HP or highest threat hero. |
| 5 | Shield Bash | Single-target stun for 1 turn. Damage scales with current shield/DEF buff amount. |
| 10 | Tower's Wrath | AoE attack hitting all heroes. Triggers when Valinar drops below 50% HP. |
| 15 | Counterattack Stance | Passive. When hit while DEF buff is active, retaliates with moderate damage. |
| 20 | Judgment of Ages | AoE attack that dispels all buffs from the entire party. Used periodically or at HP thresholds. |

### Key Drops

Lake Tower Key drops from Whisper Lake region bosses:

```js
itemDrops: [
  { itemId: 'lake_tower_key', chance: 0.25 },
  // ... existing drops
]
```

## Files to Create

- `src/data/genusLoci.js` - Boss definitions
- `src/stores/genusLoci.js` - Progress tracking store

## Files to Modify

- `src/data/items.js` - Add key items and unique drops
- `src/data/questNodes.js` - Add Genus Loci node type and Valinar's node
- `src/stores/battle.js` - Handle genusLoci battle type
- `src/views/HomeScreen.vue` - Add Genus Loci panel
- `src/components/NodeMarker.vue` - Handle genusLoci node type styling
- `src/views/BattleScreen.vue` - Handle Genus Loci victory/defeat

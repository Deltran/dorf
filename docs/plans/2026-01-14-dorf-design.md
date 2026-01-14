# Dorf: Gacha Hero Battler - Design Document

## Overview

A browser-based gacha hero collector with turn-based tactical combat. Players summon heroes, build parties of 4, and battle through quest nodes on a world map.

## Tech Stack

- **Frontend**: Vue 3 with Composition API
- **State Management**: Pinia
- **Build Tool**: Vite
- **Persistence**: Local Storage

## Project Structure

```
dorf/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js              # Vue app entry
│   ├── App.vue              # Root component, handles screens
│   ├── stores/              # Pinia stores for game state
│   │   ├── heroes.js        # Hero collection & party
│   │   ├── gacha.js         # Pull logic, pity counter
│   │   ├── quests.js        # World map, progress
│   │   └── battle.js        # Combat state machine
│   ├── components/          # Reusable UI pieces
│   │   ├── HeroCard.vue
│   │   ├── EnemyCard.vue
│   │   └── ...
│   ├── screens/             # Full-page views
│   │   ├── HomeScreen.vue
│   │   ├── GachaScreen.vue
│   │   ├── HeroesScreen.vue
│   │   ├── WorldMapScreen.vue
│   │   └── BattleScreen.vue
│   └── data/                # Static game data
│       ├── heroTemplates.js
│       ├── enemyTemplates.js
│       └── questNodes.js
```

## Data Models

### Class Definition

```js
{
  id: 'paladin',
  title: 'Paladin',
  role: 'tank',              // tank, dps, healer, support
  resourceName: 'Faith'      // Displayed instead of "MP"
}
```

### Hero Template (static data)

```js
{
  id: 'knight_01',
  name: 'Sir Gallan',
  rarity: 3,                 // 1-5 stars
  classId: 'paladin',
  baseStats: {
    hp: 120,
    atk: 25,
    def: 40,
    spd: 10,
    mp: 50
  },
  skill: {
    name: 'Shield Bash',
    description: 'Deal 80% ATK damage and reduce enemy ATK by 20% for 2 turns',
    mpCost: 15
  }
}
```

### Hero Instance (owned hero)

```js
{
  instanceId: 'uuid-1234',
  templateId: 'knight_01',
  level: 15,
  exp: 340
  // Stats calculated: base * (1 + 0.05 * level)
}
```

### Enemy Template

```js
{
  id: 'goblin_01',
  name: 'Goblin Scout',
  stats: { hp: 50, atk: 15, def: 5, spd: 12 },
  skill: {
    name: 'Quick Stab',
    description: 'Deal 120% ATK damage',
    cooldown: 2
  }
}
```

## Gacha System

### Rarity Rates

| Rarity | Rate |
|--------|------|
| 1-star (Common) | 40% |
| 2-star (Uncommon) | 30% |
| 3-star (Rare) | 20% |
| 4-star (Epic) | 8% |
| 5-star (Legendary) | 2% |

### Pity System

- Track pulls since last 4-star and 5-star separately
- **Soft pity at 50 pulls**: 5-star rate increases by 2% per pull after 50
- **Hard pity at 90 pulls**: Guaranteed 5-star
- **4-star pity at 10 pulls**: Guaranteed 4-star or higher every 10 pulls
- Pity counters reset when you get that rarity or higher

### Pull Types

- **Single pull**: 1 hero, costs 100 gems
- **10-pull**: 10 heroes, costs 900 gems (10% discount), guarantees at least one 4-star

### Currency

- **Gems**: Premium currency, earned from quests and achievements
- New players start with 1000 gems

## Battle System

### Turn Order

- All heroes and enemies sorted by speed stat (highest first)
- Each round, everyone acts once in speed order
- On a unit's turn: choose Basic Attack (free) or Skill (costs MP)

### Combat Flow

1. **Battle Start**
   - Heroes start with full HP, MP at 30% of max
   - Enemies start with full HP, cooldowns ready

2. **Each Turn**
   - Active unit highlighted
   - If hero: player picks action and target
   - If enemy: AI picks action (skill if off cooldown, else basic attack)
   - Action resolves, damage/effects applied
   - Check for deaths

3. **Victory**: All enemies defeated - rewards screen
4. **Defeat**: All heroes dead - return to world map

### Damage Formula

```js
damage = attacker.atk * skillMultiplier - defender.def * 0.5
// Minimum 1 damage
```

### MP Recovery

- Gain 10% max MP at the start of each round

## World Map & Quests

### Node Definition

```js
{
  id: 'forest_01',
  name: 'Dark Thicket',
  region: 'Whispering Woods',
  battles: [
    { enemies: ['goblin_01', 'goblin_01'] },
    { enemies: ['goblin_01', 'wolf_01'] },
    { enemies: ['wolf_01', 'wolf_01', 'goblin_02'] }
  ],
  connections: ['forest_02', 'forest_03'],
  rewards: {
    gems: 50,
    exp: 100
  },
  firstClearBonus: {
    gems: 30
  }
}
```

### Battle Series Flow

- HP and MP carry over between fights in a node
- Small HP/MP recovery between fights (10% each)
- If wiped, restart the node from battle 1
- Complete all battles - node cleared - connections unlock

### Quest State

```js
{
  unlockedNodes: ['forest_01'],
  completedNodes: [],
  currentRun: {
    nodeId: 'forest_01',
    battleIndex: 0,
    partyState: { ... }
  }
}
```

## UI Screens

### Screen Flow

```
HomeScreen (hub)
    ├── HeroesScreen (view/manage collection)
    │   └── HeroDetailModal (single hero stats, add to party)
    ├── PartyScreen (build team of 4)
    ├── GachaScreen (spend gems, pull heroes)
    │   └── PullResultsModal (dramatic reveal)
    ├── WorldMapScreen (select quest node)
    │   └── NodePreviewModal (see enemies, start quest)
    └── BattleScreen (active combat)
        └── VictoryModal / DefeatModal
```

### Battle Screen Layout

```
┌─────────────────────────────────┐
│  Battle 2/3      Node: Dark... │
├─────────────────────────────────┤
│  [Enemy1]  [Enemy2]  [Enemy3]  │
│                                 │
│  [Hero1] [Hero2] [Hero3] [Hero4]│
├─────────────────────────────────┤
│  [Basic Attack]  [Skill Name]  │
│  Select target...              │
└─────────────────────────────────┘
```

### Key Components

- `HeroCard.vue` - Hero portrait, name, level, rarity stars, class icon
- `EnemyCard.vue` - Enemy display with HP bar and cooldown indicator
- `StatBar.vue` - Reusable HP/MP bar with label and current/max values
- `ActionButton.vue` - Battle action buttons
- `StarRating.vue` - 1-5 star rarity display

## Data Persistence

### Local Storage Structure

```js
localStorage.setItem('dorf_save', JSON.stringify({
  heroes: { ... },
  gacha: { ... },
  quests: { ... },
  settings: { ... },
  version: 1
}))
```

### Save/Load Timing

- Auto-save after: pulling heroes, completing battles, any gem change
- Load on app startup, initialize fresh state if no save exists

### Error Handling

- Corrupted save: Warn player, offer to reset or continue with defaults
- Missing hero template: Skip that hero, log warning
- Battle edge cases: Minimum 1 damage, prevent negative HP/MP

## New Player Experience

- First launch: Start with 1000 gems + one guaranteed 3-star hero
- Tutorial quest unlocked (simple 2-battle node)
- Prompt to do first gacha pull

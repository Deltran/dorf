# Explorations Design

## Overview

Explorations is an idle progression system where players send 5 non-party heroes on expeditions to special exploration nodes. Expeditions run passively (including offline) and complete when either a fight threshold or time limit is reached.

## Core Concept

### Completion Conditions

- **Fight count**: Each expedition has its own counter, starting at zero when launched. When the player completes a battle with their main party, all active expedition counters increment by 1.
- **Time limit**: Real-world time in minutes. Checked against elapsed time when app opens.
- Whichever triggers first completes the expedition.

### Rewards

- Gold, gems, and XP (applied directly to the 5 expedition heroes)
- Random item drops (tomes, materials, etc.)
- +10% bonus to gold/gems/XP if the Party Request is satisfied

### Hero Locking

Heroes assigned to an expedition cannot be used for: main party, merging, discarding, or any other system until the expedition completes or is cancelled. Cancelling forfeits all progress and rewards (requires confirmation dialog).

## Exploration Node Data

### Node Type

Exploration nodes are a new node type (`type: 'exploration'`) in questNodes.js, unlocked by completing a prerequisite node.

### Data Structure

```javascript
cave_exploration: {
  id: 'cave_exploration',
  name: 'Echoing Caverns Exploration',
  region: 'Echoing Caverns',
  x: 300,
  y: 100,
  type: 'exploration',
  unlockedBy: 'cave_01',  // Revealed after completing Cavern Entrance
  backgroundId: 'cave_01', // Reuse existing battle background
  explorationConfig: {
    requiredFights: 50,
    timeLimit: 240,  // minutes (4 hours)
    rewards: {
      gold: 500,
      gems: 20,
      xp: 300
    },
    itemDrops: [
      { itemId: 'tome_medium', chance: 0.4 },
      { itemId: 'goblin_trinket', chance: 0.6 }
    ],
    partyRequest: {
      description: 'A tank, a DPS, and a support',
      conditions: [
        { role: 'tank', count: 1 },
        { role: 'dps', count: 1 },
        { role: 'support', count: 1 }
      ]
    }
  }
}
```

### Party Request Condition Types

- `{ role: 'tank', count: 1 }` - Requires N heroes of a role
- `{ classId: 'knight', count: 2 }` - Requires N heroes of a class
- More condition types can be added later

## State Management

### New Store: `explorations.js`

Tracks all active expeditions and history.

```javascript
// State
activeExplorations: {
  'cave_exploration': {
    nodeId: 'cave_exploration',
    heroes: ['hero_instance_1', 'hero_instance_2', ...],  // 5 instanceIds
    startedAt: 1706012400000,  // timestamp
    fightCount: 15,
    partyRequestMet: true
  }
},
completedHistory: [
  // Last 10 completed expeditions
  {
    nodeId: 'cave_exploration',
    heroes: ['hero_instance_1', ...],
    completedAt: 1706098800000,
    rewards: { gold: 550, gems: 22, xp: 330 }  // includes bonus if applicable
  }
]

// Key Actions
startExploration(nodeId, heroInstanceIds)  // Validate 5 heroes, lock them, record start time
cancelExploration(nodeId)                   // Free heroes, clear progress, no rewards
incrementFightCount()                       // Called after main party battle victories
checkCompletions()                          // Called on app open & after battles, checks time + fights
claimCompletion(nodeId)                     // Apply rewards, free heroes, add to history
```

### Integration Points

- `heroes.js`: Add `explorationNodeId` field to heroes to track lock status
- `battle.js`: Call `incrementFightCount()` after victory
- App initialization: Call `checkCompletions()` to handle offline progress

## UI & Screens

### Home Screen - Expedition Summary Card

New navigation button showing:
- Active expedition count (e.g., "2 Active")
- Next completion: time remaining AND fights remaining (e.g., "Next: 1h 23m / 12 fights")
- Tapping opens the Expedition Management Screen

### Expedition Management Screen

Full-screen view containing:
- List of all unlocked exploration slots with status (idle/in progress)
- For idle slots: "Start Expedition" button
- For active slots: tap to view expedition detail
- History log section showing last 10 completions (region name, hero portraits, rewards)

### Expedition Detail View

Shown when tapping an exploration node on world map OR an active expedition in management:
- Battle background (from `backgroundId`)
- 5 hero cards with floating/shift animation (reuse enemy shift animation code)
- Progress bar: "15/50 fights"
- Timer: "2h 34m 12s remaining"
- Party Request indicator (met/unmet with +10% bonus note)
- If idle: hero selection UI and "Start" button
- If active: "Cancel Expedition" button (with confirmation dialog)

### Completion Popup

Triggered after dismissing victory dialog (or on app open) when expedition completes:
- "Exploration Complete!" header
- 5 hero portraits in a row
- Reward breakdown (gold, gems, XP per hero, items)
- Party Request bonus line if applicable
- "Claim" button to dismiss

## World Map Integration

### Exploration Node Appearance

Exploration nodes use the existing `NodeMarker.vue` component with a new visual treatment:
- New node type check: `isExploration` computed (similar to `isGenusLoci`)
- Distinct color scheme (blue/teal gradient to differentiate from battle nodes)
- Icon: compass or tent symbol instead of "!" or boss icon
- Shows battle background preview like regular nodes (using `backgroundId`)

### Node States

- **Locked**: Hidden until prerequisite node (`unlockedBy`) is completed
- **Idle**: Normal appearance, tappable to start expedition
- **Active**: Pulsing/glowing animation, shows mini progress indicator
- **Completed** (history): Same as idle, ready for next run

### Tap Behavior

Unlike battle nodes, tapping an exploration node does NOT go to battle:
- If idle: Opens Expedition Detail View with hero selection
- If active: Opens Expedition Detail View showing progress

### Unlock Logic

In `quests.js` store, exploration nodes check `unlockedBy` against completed nodes rather than using the `connections` graph.

## Hero Locking System

### Hero State Extension

In `heroes.js` store, heroes gain an optional field:

```javascript
{
  instanceId: 'hero_123',
  templateId: 'aurora_the_dawn',
  // ... existing fields
  explorationNodeId: 'cave_exploration'  // null if not on expedition
}
```

### Lock Enforcement

New helper function `isHeroLocked(hero)` returns true if `explorationNodeId` is set.

Systems that must check this before acting:
- **Party assignment**: Cannot add locked hero to party
- **Merging**: Cannot use locked hero as base or fodder
- **Discarding**: Cannot discard locked hero
- **Future systems**: Any hero consumption/assignment checks `isHeroLocked()`

### UI Indicators

- Hero cards show "On Expedition" badge/overlay when locked
- Hero list can filter/sort by expedition status (designed to be extensible for future filter options)
- Locked heroes appear grayed or with expedition icon in selection UIs
- Attempting to use a locked hero shows toast: "Hero is on expedition"

### Freeing Heroes

When expedition completes or is cancelled, clear `explorationNodeId` for all 5 heroes.

## Completion Flow

### Completion Check Triggers

`checkCompletions()` is called:
1. On app initialization (catches offline completions)
2. After dismissing the victory dialog (catches timer + fight completions)

### Completion Logic

For each active exploration:

```javascript
const elapsed = Date.now() - exploration.startedAt
const timeComplete = elapsed >= (node.explorationConfig.timeLimit * 60 * 1000)
const fightsComplete = exploration.fightCount >= node.explorationConfig.requiredFights

if (timeComplete || fightsComplete) {
  queueCompletion(nodeId)
}
```

### Completion Queue

- Store maintains `pendingCompletions: []` array
- After victory dialog dismissal, process queue
- Shows one completion popup at a time
- After dismissing, shows next in queue (if any)

### Reward Application

On completion (before popup):
- Calculate rewards (apply +10% if `partyRequestMet`)
- Add gold/gems to `gacha.js` store
- Distribute XP evenly to the 5 heroes
- Roll item drops, add to `inventory.js`
- Clear `explorationNodeId` from heroes
- Add entry to `completedHistory`

## Initial Implementation Scope

### First Exploration Node

Start with one exploration to validate the system:

```javascript
cave_exploration: {
  id: 'cave_exploration',
  name: 'Echoing Caverns Exploration',
  region: 'Echoing Caverns',
  x: 300,
  y: 100,
  type: 'exploration',
  unlockedBy: 'cave_01',
  backgroundId: 'cave_01',
  explorationConfig: {
    requiredFights: 50,
    timeLimit: 240,  // 4 hours
    rewards: { gold: 500, gems: 20, xp: 300 },
    itemDrops: [
      { itemId: 'tome_medium', chance: 0.4 },
      { itemId: 'goblin_trinket', chance: 0.6 }
    ],
    partyRequest: {
      description: 'A tank, a DPS, and a support',
      conditions: [
        { role: 'tank', count: 1 },
        { role: 'dps', count: 1 },
        { role: 'support', count: 1 }
      ]
    }
  }
}
```

### New Files

- `src/stores/explorations.js` - State management
- `src/screens/ExplorationsScreen.vue` - Management screen
- `src/components/ExplorationDetailView.vue` - Detail/progress view
- `src/components/ExplorationCompletePopup.vue` - Completion popup

### Modified Files

- `src/data/questNodes.js` - Add exploration node
- `src/stores/heroes.js` - Add `explorationNodeId` field, `isHeroLocked()` helper
- `src/stores/battle.js` - Call `incrementFightCount()` on victory
- `src/screens/HomeScreen.vue` - Add expedition summary card
- `src/screens/WorldMapScreen.vue` - Handle exploration node tap
- `src/components/NodeMarker.vue` - Exploration node styling
- `src/components/HeroCard.vue` - "On Expedition" indicator

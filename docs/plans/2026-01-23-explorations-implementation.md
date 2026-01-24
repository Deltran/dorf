# Explorations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement an idle progression system where players send 5 non-party heroes on expeditions that complete via fight count or real-world time.

**Architecture:** New `explorations.js` Pinia store manages active expeditions and history. Heroes gain `explorationNodeId` field for locking. Battle victories increment all expedition fight counters. Completion triggers reward distribution and popup.

**Tech Stack:** Vue 3, Pinia, Vitest for testing

---

## Task 1: Hero Locking in heroes.js

Add the ability to lock heroes to explorations and check lock status.

**Files:**
- Modify: `src/stores/heroes.js`
- Create: `src/stores/__tests__/heroes-exploration.test.js`

**Step 1: Write the failing tests**

Create `src/stores/__tests__/heroes-exploration.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from '../heroes'

describe('heroes store - exploration locking', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useHeroesStore()
  })

  describe('isHeroLocked', () => {
    it('returns false for hero not on exploration', () => {
      const hero = store.addHero('militia_soldier')
      expect(store.isHeroLocked(hero.instanceId)).toBe(false)
    })

    it('returns true for hero on exploration', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      expect(store.isHeroLocked(hero.instanceId)).toBe(true)
    })
  })

  describe('lockHeroToExploration', () => {
    it('sets explorationNodeId on hero', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      const updated = store.collection.find(h => h.instanceId === hero.instanceId)
      expect(updated.explorationNodeId).toBe('cave_exploration')
    })

    it('fails if hero already locked', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      const result = store.lockHeroToExploration(hero.instanceId, 'other_exploration')
      expect(result).toBe(false)
    })
  })

  describe('unlockHeroFromExploration', () => {
    it('clears explorationNodeId on hero', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      store.unlockHeroFromExploration(hero.instanceId)
      const updated = store.collection.find(h => h.instanceId === hero.instanceId)
      expect(updated.explorationNodeId).toBeNull()
    })
  })

  describe('availableForExploration', () => {
    it('excludes heroes in party', () => {
      const hero1 = store.addHero('militia_soldier')
      const hero2 = store.addHero('apprentice_mage')
      store.setPartySlot(0, hero1.instanceId)

      const available = store.availableForExploration
      expect(available.some(h => h.instanceId === hero1.instanceId)).toBe(false)
      expect(available.some(h => h.instanceId === hero2.instanceId)).toBe(true)
    })

    it('excludes heroes already on exploration', () => {
      const hero1 = store.addHero('militia_soldier')
      const hero2 = store.addHero('apprentice_mage')
      store.lockHeroToExploration(hero1.instanceId, 'cave_exploration')

      const available = store.availableForExploration
      expect(available.some(h => h.instanceId === hero1.instanceId)).toBe(false)
      expect(available.some(h => h.instanceId === hero2.instanceId)).toBe(true)
    })
  })

  describe('party assignment blocks locked heroes', () => {
    it('setPartySlot fails for locked hero', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      const result = store.setPartySlot(0, hero.instanceId)
      expect(result).toBe(false)
      expect(store.party[0]).toBeNull()
    })
  })

  describe('persistence', () => {
    it('saves and loads explorationNodeId', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')

      const saved = store.saveState()

      // Create new store and load
      const newStore = useHeroesStore()
      newStore.loadState(saved)

      expect(newStore.isHeroLocked(hero.instanceId)).toBe(true)
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/heroes-exploration.test.js`

Expected: Multiple failures - `isHeroLocked`, `lockHeroToExploration`, etc. not defined

**Step 3: Implement hero locking in heroes.js**

Add to `src/stores/heroes.js` after the existing `availableForParty` computed:

```javascript
  // Heroes available for exploration (not in party, not already on exploration)
  const availableForExploration = computed(() => {
    const partyIds = new Set(party.value.filter(Boolean))
    return collection.value.filter(h =>
      !partyIds.has(h.instanceId) &&
      !h.explorationNodeId
    )
  })

  function isHeroLocked(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    return hero?.explorationNodeId != null
  }

  function lockHeroToExploration(instanceId, nodeId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return false
    if (hero.explorationNodeId) return false // Already locked
    hero.explorationNodeId = nodeId
    return true
  }

  function unlockHeroFromExploration(instanceId) {
    const hero = collection.value.find(h => h.instanceId === instanceId)
    if (!hero) return false
    hero.explorationNodeId = null
    return true
  }
```

Modify `setPartySlot` to check lock status (add at beginning of function):

```javascript
  function setPartySlot(slotIndex, instanceId) {
    if (slotIndex < 0 || slotIndex > 3) return false

    // Check if hero is locked to exploration
    if (isHeroLocked(instanceId)) return false

    // ... rest of existing code
  }
```

Modify `loadState` to handle migration (add `explorationNodeId: hero.explorationNodeId ?? null`):

```javascript
  function loadState(savedState) {
    if (savedState.collection) {
      collection.value = savedState.collection.map(hero => ({
        ...hero,
        starLevel: hero.starLevel || getHeroTemplate(hero.templateId)?.rarity || 1,
        shards: hero.shards ?? 0,
        shardTier: hero.shardTier ?? 0,
        explorationNodeId: hero.explorationNodeId ?? null
      }))
    }
    // ... rest unchanged
  }
```

Add to return statement:

```javascript
    // Exploration
    availableForExploration,
    isHeroLocked,
    lockHeroToExploration,
    unlockHeroFromExploration,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/heroes-exploration.test.js`

Expected: All tests pass

**Step 5: Run full test suite**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test`

Expected: All 143+ tests pass

**Step 6: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/heroes.js src/stores/__tests__/heroes-exploration.test.js
git commit -m "feat: add hero locking for explorations

- Add explorationNodeId field to heroes
- Add isHeroLocked, lockHeroToExploration, unlockHeroFromExploration
- Add availableForExploration computed
- Block locked heroes from party assignment
- Add persistence migration for explorationNodeId"
```

---

## Task 2: Exploration Node Data

Add the first exploration node to questNodes.js.

**Files:**
- Modify: `src/data/questNodes.js`

**Step 1: Add exploration node**

In `src/data/questNodes.js`, add after the `cave_07` node definition (before the `// Stormwind Peaks` comment):

```javascript
  // Echoing Caverns Exploration
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
      timeLimit: 240,
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
  },
```

**Step 2: Verify app still loads**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm run dev`

Check that app starts without errors (Ctrl+C to stop).

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/data/questNodes.js
git commit -m "feat: add Echoing Caverns Exploration node

First exploration node, unlocked by completing cave_01.
50 fights or 4 hours, rewards gold/gems/xp with item drops."
```

---

## Task 3: Explorations Store - Core State

Create the explorations store with basic state management.

**Files:**
- Create: `src/stores/explorations.js`
- Create: `src/stores/__tests__/explorations.test.js`
- Modify: `src/stores/index.js`

**Step 1: Write failing tests for core state**

Create `src/stores/__tests__/explorations.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExplorationsStore } from '../explorations'
import { useHeroesStore } from '../heroes'

describe('explorations store', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useExplorationsStore()
    heroesStore = useHeroesStore()
  })

  describe('initial state', () => {
    it('has empty activeExplorations', () => {
      expect(store.activeExplorations).toEqual({})
    })

    it('has empty completedHistory', () => {
      expect(store.completedHistory).toEqual([])
    })

    it('has empty pendingCompletions', () => {
      expect(store.pendingCompletions).toEqual([])
    })
  })

  describe('getExplorationNode', () => {
    it('returns exploration node by id', () => {
      const node = store.getExplorationNode('cave_exploration')
      expect(node).toBeDefined()
      expect(node.type).toBe('exploration')
      expect(node.explorationConfig.requiredFights).toBe(50)
    })

    it('returns null for non-exploration node', () => {
      const node = store.getExplorationNode('cave_01')
      expect(node).toBeNull()
    })
  })

  describe('unlockedExplorations', () => {
    it('returns empty when no nodes completed', () => {
      expect(store.unlockedExplorations).toEqual([])
    })
  })

  describe('activeExplorationCount', () => {
    it('returns 0 when no active explorations', () => {
      expect(store.activeExplorationCount).toBe(0)
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - module not found

**Step 3: Create explorations store**

Create `src/stores/explorations.js`:

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { questNodes } from '../data/questNodes.js'
import { useQuestsStore } from './quests.js'

export const useExplorationsStore = defineStore('explorations', () => {
  // State
  const activeExplorations = ref({})
  const completedHistory = ref([])
  const pendingCompletions = ref([])

  // Get all exploration nodes from questNodes
  const allExplorationNodes = computed(() => {
    return Object.values(questNodes).filter(node => node.type === 'exploration')
  })

  // Get unlocked explorations (based on completed prerequisite nodes)
  const unlockedExplorations = computed(() => {
    const questsStore = useQuestsStore()
    return allExplorationNodes.value.filter(node =>
      questsStore.completedNodes.includes(node.unlockedBy)
    )
  })

  // Count of active explorations
  const activeExplorationCount = computed(() => {
    return Object.keys(activeExplorations.value).length
  })

  // Get exploration node by ID
  function getExplorationNode(nodeId) {
    const node = questNodes[nodeId]
    if (!node || node.type !== 'exploration') return null
    return node
  }

  return {
    // State
    activeExplorations,
    completedHistory,
    pendingCompletions,
    // Getters
    allExplorationNodes,
    unlockedExplorations,
    activeExplorationCount,
    // Actions
    getExplorationNode
  }
})
```

**Step 4: Add to stores index**

Modify `src/stores/index.js` to add the export:

```javascript
export { useExplorationsStore } from './explorations.js'
```

**Step 5: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 6: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js src/stores/index.js
git commit -m "feat: add explorations store with core state

- activeExplorations, completedHistory, pendingCompletions state
- getExplorationNode helper
- unlockedExplorations computed based on quest progress
- activeExplorationCount computed"
```

---

## Task 4: Start Exploration

Implement starting an exploration with hero assignment.

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js`:

```javascript
  describe('startExploration', () => {
    it('creates active exploration with 5 heroes', () => {
      // Add 5 heroes
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)

      const result = store.startExploration('cave_exploration', heroIds)

      expect(result.success).toBe(true)
      expect(store.activeExplorations['cave_exploration']).toBeDefined()
      expect(store.activeExplorations['cave_exploration'].heroes).toEqual(heroIds)
      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(0)
    })

    it('locks all heroes to the exploration', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)

      store.startExploration('cave_exploration', heroIds)

      heroIds.forEach(id => {
        expect(heroesStore.isHeroLocked(id)).toBe(true)
      })
    })

    it('fails with less than 5 heroes', () => {
      const heroes = []
      for (let i = 0; i < 3; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)

      const result = store.startExploration('cave_exploration', heroIds)

      expect(result.success).toBe(false)
      expect(result.error).toContain('5 heroes')
    })

    it('fails if exploration already active', () => {
      const heroes1 = []
      const heroes2 = []
      for (let i = 0; i < 5; i++) {
        heroes1.push(heroesStore.addHero('militia_soldier'))
        heroes2.push(heroesStore.addHero('militia_soldier'))
      }

      store.startExploration('cave_exploration', heroes1.map(h => h.instanceId))
      const result = store.startExploration('cave_exploration', heroes2.map(h => h.instanceId))

      expect(result.success).toBe(false)
      expect(result.error).toContain('already active')
    })

    it('fails if hero is already locked', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      heroesStore.lockHeroToExploration(heroes[0].instanceId, 'other_exploration')

      const result = store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      expect(result.success).toBe(false)
      expect(result.error).toContain('unavailable')
    })

    it('records startedAt timestamp', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const before = Date.now()

      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      const after = Date.now()
      const startedAt = store.activeExplorations['cave_exploration'].startedAt
      expect(startedAt).toBeGreaterThanOrEqual(before)
      expect(startedAt).toBeLessThanOrEqual(after)
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - startExploration not defined

**Step 3: Implement startExploration**

Add to `src/stores/explorations.js` before the return statement:

```javascript
  // Start an exploration
  function startExploration(nodeId, heroInstanceIds) {
    const heroesStore = useHeroesStore()

    // Validate node exists and is exploration type
    const node = getExplorationNode(nodeId)
    if (!node) {
      return { success: false, error: 'Invalid exploration node' }
    }

    // Check not already active
    if (activeExplorations.value[nodeId]) {
      return { success: false, error: 'Exploration already active' }
    }

    // Validate 5 heroes
    if (heroInstanceIds.length !== 5) {
      return { success: false, error: 'Must assign exactly 5 heroes' }
    }

    // Check all heroes exist and are available
    for (const instanceId of heroInstanceIds) {
      if (heroesStore.isHeroLocked(instanceId)) {
        return { success: false, error: 'One or more heroes unavailable (already on exploration)' }
      }
      const hero = heroesStore.collection.find(h => h.instanceId === instanceId)
      if (!hero) {
        return { success: false, error: 'Hero not found' }
      }
    }

    // Lock all heroes
    for (const instanceId of heroInstanceIds) {
      heroesStore.lockHeroToExploration(instanceId, nodeId)
    }

    // Create active exploration
    activeExplorations.value[nodeId] = {
      nodeId,
      heroes: [...heroInstanceIds],
      startedAt: Date.now(),
      fightCount: 0,
      partyRequestMet: false // Will be calculated
    }

    return { success: true }
  }
```

Add import at top:

```javascript
import { useHeroesStore } from './heroes.js'
```

Add to return statement:

```javascript
    startExploration,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: implement startExploration

- Validates 5 heroes required
- Locks heroes to exploration
- Prevents duplicate active explorations
- Records start timestamp"
```

---

## Task 5: Party Request Validation

Implement checking if party meets the exploration's request conditions.

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js`:

```javascript
  describe('checkPartyRequest', () => {
    it('returns true when role conditions met', () => {
      // Need tank, dps, support for cave_exploration
      const tank = heroesStore.addHero('sorju_gate_guard') // Knight = tank
      const dps = heroesStore.addHero('darl') // Berserker = dps
      const support = heroesStore.addHero('harl_the_handsom') // Bard = support
      const filler1 = heroesStore.addHero('militia_soldier')
      const filler2 = heroesStore.addHero('militia_soldier')

      const heroIds = [tank, dps, support, filler1, filler2].map(h => h.instanceId)
      const result = store.checkPartyRequest('cave_exploration', heroIds)

      expect(result).toBe(true)
    })

    it('returns false when role conditions not met', () => {
      // All same role - won't meet tank+dps+support
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier')) // All basic heroes
      }

      const result = store.checkPartyRequest('cave_exploration', heroes.map(h => h.instanceId))

      expect(result).toBe(false)
    })
  })

  describe('startExploration sets partyRequestMet', () => {
    it('sets partyRequestMet true when conditions met', () => {
      const tank = heroesStore.addHero('sorju_gate_guard')
      const dps = heroesStore.addHero('darl')
      const support = heroesStore.addHero('harl_the_handsom')
      const filler1 = heroesStore.addHero('militia_soldier')
      const filler2 = heroesStore.addHero('militia_soldier')

      const heroIds = [tank, dps, support, filler1, filler2].map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)

      expect(store.activeExplorations['cave_exploration'].partyRequestMet).toBe(true)
    })

    it('sets partyRequestMet false when conditions not met', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }

      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      expect(store.activeExplorations['cave_exploration'].partyRequestMet).toBe(false)
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - checkPartyRequest not defined

**Step 3: Implement checkPartyRequest**

Add to `src/stores/explorations.js`:

```javascript
import { getHeroTemplate } from '../data/heroTemplates.js'
import { getClass } from '../data/classes.js'

  // Check if heroes meet party request conditions
  function checkPartyRequest(nodeId, heroInstanceIds) {
    const heroesStore = useHeroesStore()
    const node = getExplorationNode(nodeId)
    if (!node?.explorationConfig?.partyRequest) return true // No request = always met

    const conditions = node.explorationConfig.partyRequest.conditions

    // Get hero roles and classes
    const heroData = heroInstanceIds.map(instanceId => {
      const hero = heroesStore.collection.find(h => h.instanceId === instanceId)
      if (!hero) return null
      const template = getHeroTemplate(hero.templateId)
      const heroClass = getClass(template?.classId)
      return {
        role: heroClass?.role,
        classId: template?.classId
      }
    }).filter(Boolean)

    // Check each condition
    for (const condition of conditions) {
      if (condition.role) {
        const count = heroData.filter(h => h.role === condition.role).length
        if (count < condition.count) return false
      }
      if (condition.classId) {
        const count = heroData.filter(h => h.classId === condition.classId).length
        if (count < condition.count) return false
      }
    }

    return true
  }
```

Update `startExploration` to set `partyRequestMet`:

```javascript
    // Create active exploration
    activeExplorations.value[nodeId] = {
      nodeId,
      heroes: [...heroInstanceIds],
      startedAt: Date.now(),
      fightCount: 0,
      partyRequestMet: checkPartyRequest(nodeId, heroInstanceIds)
    }
```

Add to return:

```javascript
    checkPartyRequest,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: implement party request validation

- checkPartyRequest validates role and class conditions
- startExploration sets partyRequestMet flag
- Supports role: and classId: condition types"
```

---

## Task 6: Cancel Exploration

Implement cancelling an exploration and freeing heroes.

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js`:

```javascript
  describe('cancelExploration', () => {
    it('removes active exploration', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      store.cancelExploration('cave_exploration')

      expect(store.activeExplorations['cave_exploration']).toBeUndefined()
    })

    it('unlocks all heroes', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)

      store.cancelExploration('cave_exploration')

      heroIds.forEach(id => {
        expect(heroesStore.isHeroLocked(id)).toBe(false)
      })
    })

    it('does nothing if exploration not active', () => {
      const result = store.cancelExploration('cave_exploration')
      expect(result).toBe(false)
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - cancelExploration not defined

**Step 3: Implement cancelExploration**

Add to `src/stores/explorations.js`:

```javascript
  // Cancel an exploration (forfeits all progress)
  function cancelExploration(nodeId) {
    const heroesStore = useHeroesStore()
    const exploration = activeExplorations.value[nodeId]
    if (!exploration) return false

    // Unlock all heroes
    for (const instanceId of exploration.heroes) {
      heroesStore.unlockHeroFromExploration(instanceId)
    }

    // Remove active exploration
    delete activeExplorations.value[nodeId]
    return true
  }
```

Add to return:

```javascript
    cancelExploration,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: implement cancelExploration

- Removes active exploration state
- Unlocks all assigned heroes
- Forfeits all progress (no rewards)"
```

---

## Task 7: Increment Fight Count

Implement incrementing fight count for all active explorations.

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js`:

```javascript
  describe('incrementFightCount', () => {
    it('increments fightCount for all active explorations', () => {
      // Start exploration
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      store.incrementFightCount()

      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(1)
    })

    it('increments multiple explorations simultaneously', () => {
      // This test would require multiple exploration nodes
      // For now, just verify single exploration works
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      store.incrementFightCount()
      store.incrementFightCount()
      store.incrementFightCount()

      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(3)
    })

    it('does nothing when no active explorations', () => {
      // Should not throw
      expect(() => store.incrementFightCount()).not.toThrow()
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - incrementFightCount not defined

**Step 3: Implement incrementFightCount**

Add to `src/stores/explorations.js`:

```javascript
  // Increment fight count for all active explorations
  function incrementFightCount() {
    for (const nodeId of Object.keys(activeExplorations.value)) {
      activeExplorations.value[nodeId].fightCount++
    }
  }
```

Add to return:

```javascript
    incrementFightCount,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: implement incrementFightCount

Increments fight counter for all active explorations when
player completes a main party battle."
```

---

## Task 8: Check Completions

Implement checking if explorations have completed (via fights or time).

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js`:

```javascript
  describe('checkCompletions', () => {
    it('queues completion when fight count reached', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Simulate 50 fights (requiredFights for cave_exploration)
      for (let i = 0; i < 50; i++) {
        store.incrementFightCount()
      }

      store.checkCompletions()

      expect(store.pendingCompletions).toContain('cave_exploration')
    })

    it('queues completion when time elapsed', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Simulate time passing (240 minutes = 4 hours)
      store.activeExplorations['cave_exploration'].startedAt = Date.now() - (241 * 60 * 1000)

      store.checkCompletions()

      expect(store.pendingCompletions).toContain('cave_exploration')
    })

    it('does not queue incomplete exploration', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Only 10 fights, time just started
      for (let i = 0; i < 10; i++) {
        store.incrementFightCount()
      }

      store.checkCompletions()

      expect(store.pendingCompletions).not.toContain('cave_exploration')
    })

    it('does not double-queue already pending completion', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Complete via fights
      for (let i = 0; i < 50; i++) {
        store.incrementFightCount()
      }

      store.checkCompletions()
      store.checkCompletions() // Second check

      const count = store.pendingCompletions.filter(id => id === 'cave_exploration').length
      expect(count).toBe(1)
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - checkCompletions not defined

**Step 3: Implement checkCompletions**

Add to `src/stores/explorations.js`:

```javascript
  // Check all active explorations for completion
  function checkCompletions() {
    for (const nodeId of Object.keys(activeExplorations.value)) {
      // Skip if already pending
      if (pendingCompletions.value.includes(nodeId)) continue

      const exploration = activeExplorations.value[nodeId]
      const node = getExplorationNode(nodeId)
      if (!node) continue

      const config = node.explorationConfig
      const elapsed = Date.now() - exploration.startedAt
      const timeComplete = elapsed >= config.timeLimit * 60 * 1000
      const fightsComplete = exploration.fightCount >= config.requiredFights

      if (timeComplete || fightsComplete) {
        pendingCompletions.value.push(nodeId)
      }
    }
  }
```

Add to return:

```javascript
    checkCompletions,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: implement checkCompletions

- Checks fight count against requiredFights
- Checks elapsed time against timeLimit (minutes)
- Queues completed explorations to pendingCompletions
- Prevents double-queueing"
```

---

## Task 9: Claim Completion with Rewards

Implement claiming a completed exploration and distributing rewards.

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js` (add imports at top):

```javascript
import { useGachaStore } from '../gacha'
import { useInventoryStore } from '../inventory'
```

Add tests:

```javascript
  describe('claimCompletion', () => {
    let gachaStore
    let inventoryStore

    beforeEach(() => {
      gachaStore = useGachaStore()
      inventoryStore = useInventoryStore()
    })

    it('adds gold and gems to gacha store', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      const initialGold = gachaStore.gold
      const initialGems = gachaStore.gems

      store.claimCompletion('cave_exploration')

      // Base rewards: gold 500, gems 20
      expect(gachaStore.gold).toBe(initialGold + 500)
      expect(gachaStore.gems).toBe(initialGems + 20)
    })

    it('applies +10% bonus when partyRequestMet', () => {
      // Create party that meets request (tank, dps, support)
      const tank = heroesStore.addHero('sorju_gate_guard')
      const dps = heroesStore.addHero('darl')
      const support = heroesStore.addHero('harl_the_handsom')
      const filler1 = heroesStore.addHero('militia_soldier')
      const filler2 = heroesStore.addHero('militia_soldier')

      const heroIds = [tank, dps, support, filler1, filler2].map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      const initialGold = gachaStore.gold

      store.claimCompletion('cave_exploration')

      // 500 * 1.10 = 550
      expect(gachaStore.gold).toBe(initialGold + 550)
    })

    it('distributes XP to heroes', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      // XP 300 / 5 heroes = 60 each
      heroIds.forEach(id => {
        const hero = heroesStore.collection.find(h => h.instanceId === id)
        expect(hero.exp).toBeGreaterThan(0)
      })
    })

    it('unlocks heroes', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      heroIds.forEach(id => {
        expect(heroesStore.isHeroLocked(id)).toBe(false)
      })
    })

    it('removes from pendingCompletions', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.pendingCompletions).not.toContain('cave_exploration')
    })

    it('removes from activeExplorations', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.activeExplorations['cave_exploration']).toBeUndefined()
    })

    it('adds to completedHistory', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.completedHistory.length).toBe(1)
      expect(store.completedHistory[0].nodeId).toBe('cave_exploration')
      expect(store.completedHistory[0].heroes).toEqual(heroIds)
    })

    it('limits completedHistory to 10 entries', () => {
      // Add 10 entries manually
      for (let i = 0; i < 10; i++) {
        store.completedHistory.push({ nodeId: `old_${i}`, heroes: [], completedAt: Date.now() })
      }

      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.completedHistory.length).toBe(10)
      expect(store.completedHistory[9].nodeId).toBe('cave_exploration')
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - claimCompletion not defined

**Step 3: Implement claimCompletion**

Add imports at top of `src/stores/explorations.js`:

```javascript
import { useGachaStore } from './gacha.js'
import { useInventoryStore } from './inventory.js'
```

Add implementation:

```javascript
  // Claim a completed exploration and distribute rewards
  function claimCompletion(nodeId) {
    const heroesStore = useHeroesStore()
    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    const exploration = activeExplorations.value[nodeId]
    if (!exploration) return null

    const node = getExplorationNode(nodeId)
    if (!node) return null

    const config = node.explorationConfig
    const bonusMultiplier = exploration.partyRequestMet ? 1.10 : 1.0

    // Calculate rewards
    const goldReward = Math.floor(config.rewards.gold * bonusMultiplier)
    const gemsReward = Math.floor(config.rewards.gems * bonusMultiplier)
    const xpReward = Math.floor(config.rewards.xp * bonusMultiplier)
    const xpPerHero = Math.floor(xpReward / 5)

    // Apply currency rewards
    gachaStore.addGold(goldReward)
    gachaStore.addGems(gemsReward)

    // Distribute XP to heroes
    for (const instanceId of exploration.heroes) {
      heroesStore.addExp(instanceId, xpPerHero)
    }

    // Roll item drops
    const itemsDropped = []
    for (const drop of config.itemDrops) {
      if (Math.random() < drop.chance) {
        inventoryStore.addItem(drop.itemId, 1)
        itemsDropped.push(drop.itemId)
      }
    }

    // Unlock heroes
    for (const instanceId of exploration.heroes) {
      heroesStore.unlockHeroFromExploration(instanceId)
    }

    // Add to history (limit to 10)
    completedHistory.value.push({
      nodeId,
      heroes: [...exploration.heroes],
      completedAt: Date.now(),
      rewards: { gold: goldReward, gems: gemsReward, xp: xpReward },
      itemsDropped
    })
    if (completedHistory.value.length > 10) {
      completedHistory.value.shift()
    }

    // Remove from active and pending
    delete activeExplorations.value[nodeId]
    const pendingIndex = pendingCompletions.value.indexOf(nodeId)
    if (pendingIndex !== -1) {
      pendingCompletions.value.splice(pendingIndex, 1)
    }

    return {
      gold: goldReward,
      gems: gemsReward,
      xp: xpReward,
      xpPerHero,
      itemsDropped,
      partyRequestMet: exploration.partyRequestMet
    }
  }
```

Add to return:

```javascript
    claimCompletion,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Run full test suite**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test`

Expected: All tests pass

**Step 6: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: implement claimCompletion with rewards

- Distributes gold, gems, XP (with +10% party request bonus)
- Rolls item drops based on configured chances
- Unlocks heroes after completion
- Adds to completedHistory (limited to 10 entries)
- Removes from activeExplorations and pendingCompletions"
```

---

## Task 10: Persistence

Add save/load functionality for explorations state.

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js`:

```javascript
  describe('persistence', () => {
    it('saves and loads activeExplorations', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      store.incrementFightCount()

      const saved = store.saveState()

      // Reset and reload
      store.activeExplorations = {}
      store.loadState(saved)

      expect(store.activeExplorations['cave_exploration']).toBeDefined()
      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(1)
    })

    it('saves and loads completedHistory', () => {
      store.completedHistory.push({
        nodeId: 'cave_exploration',
        heroes: ['a', 'b', 'c', 'd', 'e'],
        completedAt: 12345,
        rewards: { gold: 500, gems: 20, xp: 300 }
      })

      const saved = store.saveState()

      store.completedHistory = []
      store.loadState(saved)

      expect(store.completedHistory.length).toBe(1)
      expect(store.completedHistory[0].nodeId).toBe('cave_exploration')
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - saveState/loadState not defined

**Step 3: Implement persistence**

Add to `src/stores/explorations.js`:

```javascript
  // Persistence
  function saveState() {
    return {
      activeExplorations: activeExplorations.value,
      completedHistory: completedHistory.value
    }
  }

  function loadState(savedState) {
    if (savedState.activeExplorations) {
      activeExplorations.value = savedState.activeExplorations
    }
    if (savedState.completedHistory) {
      completedHistory.value = savedState.completedHistory
    }
  }
```

Add to return:

```javascript
    saveState,
    loadState,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: add persistence for explorations store

- saveState/loadState for activeExplorations and completedHistory
- Preserves exploration state across sessions"
```

---

## Task 11: Next Completion Helper

Add computed helper for the home screen summary card.

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Write failing tests**

Add to `src/stores/__tests__/explorations.test.js`:

```javascript
  describe('nextCompletion', () => {
    it('returns null when no active explorations', () => {
      expect(store.nextCompletion).toBeNull()
    })

    it('returns exploration closest to completion by fights', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // 40 fights done, 10 remaining
      for (let i = 0; i < 40; i++) store.incrementFightCount()

      const next = store.nextCompletion
      expect(next).toBeDefined()
      expect(next.nodeId).toBe('cave_exploration')
      expect(next.fightsRemaining).toBe(10)
    })

    it('calculates time remaining', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Started 60 minutes ago (1 hour), timeLimit is 240 minutes
      store.activeExplorations['cave_exploration'].startedAt = Date.now() - (60 * 60 * 1000)

      const next = store.nextCompletion
      // ~180 minutes remaining (3 hours)
      expect(next.timeRemainingMs).toBeGreaterThan(179 * 60 * 1000)
      expect(next.timeRemainingMs).toBeLessThan(181 * 60 * 1000)
    })
  })
```

**Step 2: Run tests to verify they fail**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: Fails - nextCompletion not defined

**Step 3: Implement nextCompletion**

Add to `src/stores/explorations.js`:

```javascript
  // Get the exploration closest to completion (for home screen summary)
  const nextCompletion = computed(() => {
    const nodeIds = Object.keys(activeExplorations.value)
    if (nodeIds.length === 0) return null

    let closest = null
    let closestScore = Infinity

    for (const nodeId of nodeIds) {
      const exploration = activeExplorations.value[nodeId]
      const node = getExplorationNode(nodeId)
      if (!node) continue

      const config = node.explorationConfig
      const fightsRemaining = Math.max(0, config.requiredFights - exploration.fightCount)
      const elapsed = Date.now() - exploration.startedAt
      const timeRemainingMs = Math.max(0, (config.timeLimit * 60 * 1000) - elapsed)

      // Score by whichever is closer (lower = closer to completion)
      // Use fights as primary metric, time as tiebreaker
      const score = fightsRemaining + (timeRemainingMs / (60 * 60 * 1000)) // hours as fraction

      if (score < closestScore) {
        closestScore = score
        closest = {
          nodeId,
          node,
          fightsRemaining,
          timeRemainingMs,
          exploration
        }
      }
    }

    return closest
  })
```

Add to return:

```javascript
    nextCompletion,
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm test -- src/stores/__tests__/explorations.test.js`

Expected: All tests pass

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: add nextCompletion computed for home screen

- Returns exploration closest to completion
- Includes fightsRemaining and timeRemainingMs
- Used for home screen summary card display"
```

---

## Task 12: Integrate with Battle Victory

Call incrementFightCount after battle victories.

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Find victory handling location**

Search for where victory is handled in BattleScreen.vue - look for reward distribution or victory dialog.

**Step 2: Add exploration increment**

Import the explorations store at the top of the script:

```javascript
import { useExplorationsStore } from '../stores'
```

Initialize the store:

```javascript
const explorationsStore = useExplorationsStore()
```

Find the victory handling code (where rewards are distributed) and add after rewards:

```javascript
// Increment exploration fight counters
explorationsStore.incrementFightCount()
```

**Step 3: Add completion check after victory dialog closes**

Find where victory dialog is dismissed and add:

```javascript
explorationsStore.checkCompletions()
```

**Step 4: Test manually**

Run: `cd /home/deltran/code/dorf/.worktrees/explorations && npm run dev`

Start a quest battle, win it, verify no errors.

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/screens/BattleScreen.vue
git commit -m "feat: integrate explorations with battle victory

- Call incrementFightCount after each battle victory
- Call checkCompletions after victory dialog closes"
```

---

## Task 13: NodeMarker Exploration Styling

Add visual styling for exploration nodes on the world map.

**Files:**
- Modify: `src/components/NodeMarker.vue`

**Step 1: Add exploration detection**

Add to the script setup:

```javascript
const isExploration = computed(() => props.node.type === 'exploration')
```

**Step 2: Add exploration class to template**

Modify the button classes to include exploration:

```vue
:class="[
  'node-marker',
  {
    'completed': isCompleted,
    'selected': isSelected,
    'genus-loci': isGenusLoci,
    'exploration': isExploration
  }
]"
```

**Step 3: Add exploration icon**

Update the marker-icon content:

```vue
<span v-else-if="isExploration">🧭</span>
```

(Place after the genus-loci check, before the completed check)

**Step 4: Add exploration styles**

Add CSS for exploration nodes:

```css
/* Exploration node styling */
.node-marker.exploration .marker-icon {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.5);
}

.node-marker.exploration:not(.completed) .marker-icon {
  animation: explorationPulse 2s ease-in-out infinite;
}

@keyframes explorationPulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(6, 182, 212, 0.5); }
  50% { box-shadow: 0 4px 24px rgba(6, 182, 212, 0.9); }
}

.node-marker.exploration .marker-ring {
  border-color: rgba(6, 182, 212, 0.5);
}

.node-marker.exploration.selected .marker-ring {
  border-color: #06b6d4;
}
```

**Step 5: Test manually**

Run app and verify exploration node appears with teal styling.

**Step 6: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/components/NodeMarker.vue
git commit -m "feat: add exploration node styling to NodeMarker

- Teal/cyan gradient for exploration nodes
- Compass icon (🧭) for exploration type
- Pulse animation for active nodes"
```

---

## Task 14: HeroCard Exploration Indicator

Add "On Expedition" badge to hero cards.

**Files:**
- Modify: `src/components/HeroCard.vue`

**Step 1: Add explorationNodeId prop or detection**

Add to script:

```javascript
const isOnExploration = computed(() => {
  return props.hero.explorationNodeId != null
})
```

**Step 2: Add badge to template**

Add after the origin-badge div in card-body:

```vue
<div v-if="isOnExploration" class="exploration-badge">
  🧭 On Expedition
</div>
```

**Step 3: Add styles**

```css
.exploration-badge {
  font-size: 0.65rem;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
}

.hero-card.on-exploration {
  opacity: 0.7;
}
```

**Step 4: Add on-exploration class to card**

Update the card classes:

```vue
:class="[
  'hero-card',
  rarityClass,
  { selected, active, compact, dead: isDead, 'on-exploration': isOnExploration },
  hitEffect ? `hit-${hitEffect}` : ''
]"
```

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/components/HeroCard.vue
git commit -m "feat: add exploration indicator to HeroCard

- Shows '🧭 On Expedition' badge when hero is locked
- Reduces card opacity to indicate unavailability"
```

---

## Task 15: Home Screen Exploration Summary Card

Add exploration summary button to home screen navigation.

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Step 1: Import explorations store**

Add to imports:

```javascript
import { useExplorationsStore } from '../stores'
```

Initialize:

```javascript
const explorationsStore = useExplorationsStore()
```

**Step 2: Add computed helpers**

```javascript
const hasActiveExplorations = computed(() => explorationsStore.activeExplorationCount > 0)

const explorationSummary = computed(() => {
  const next = explorationsStore.nextCompletion
  if (!next) return null

  const minutes = Math.floor(next.timeRemainingMs / 60000)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return {
    activeCount: explorationsStore.activeExplorationCount,
    timeRemaining: timeStr,
    fightsRemaining: next.fightsRemaining
  }
})
```

**Step 3: Add navigation button**

Add after the existing nav buttons (before closing </nav>):

```vue
<button class="nav-button exploration-button" @click="emit('navigate', 'explorations')">
  <div class="nav-icon-wrapper exploration">
    <span class="nav-icon">🧭</span>
  </div>
  <div class="nav-content">
    <span class="nav-label">Explorations</span>
    <span v-if="explorationSummary" class="nav-hint">
      {{ explorationSummary.activeCount }} Active · {{ explorationSummary.timeRemaining }} / {{ explorationSummary.fightsRemaining }} fights
    </span>
    <span v-else class="nav-hint">Send heroes exploring</span>
  </div>
  <div class="nav-arrow">›</div>
</button>
```

**Step 4: Add styles**

```css
.nav-icon-wrapper.exploration {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}
```

**Step 5: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/screens/HomeScreen.vue
git commit -m "feat: add explorations summary card to home screen

- Shows active count, time remaining, fights remaining
- Links to explorations management screen"
```

---

## Task 16: ExplorationsScreen - Basic Structure

Create the explorations management screen.

**Files:**
- Create: `src/screens/ExplorationsScreen.vue`
- Modify: `src/screens/index.js`

**Step 1: Create basic screen structure**

Create `src/screens/ExplorationsScreen.vue`:

```vue
<script setup>
import { computed, ref } from 'vue'
import { useExplorationsStore, useHeroesStore, useQuestsStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'

const emit = defineEmits(['navigate', 'back'])

const explorationsStore = useExplorationsStore()
const heroesStore = useHeroesStore()
const questsStore = useQuestsStore()

const selectedExploration = ref(null)

const unlockedExplorations = computed(() => explorationsStore.unlockedExplorations)
const activeExplorations = computed(() => explorationsStore.activeExplorations)
const completedHistory = computed(() => explorationsStore.completedHistory)

function isExplorationActive(nodeId) {
  return !!activeExplorations.value[nodeId]
}

function getExplorationStatus(nodeId) {
  if (isExplorationActive(nodeId)) {
    const exp = activeExplorations.value[nodeId]
    return `${exp.fightCount} fights`
  }
  return 'Ready'
}

function selectExploration(node) {
  selectedExploration.value = node
  emit('navigate', 'exploration-detail', node.id)
}
</script>

<template>
  <div class="explorations-screen">
    <header class="screen-header">
      <button class="back-button" @click="emit('back')">←</button>
      <h1>Explorations</h1>
    </header>

    <section class="explorations-list">
      <h2>Available Explorations</h2>
      <div v-if="unlockedExplorations.length === 0" class="empty-state">
        <p>No explorations unlocked yet.</p>
        <p class="hint">Complete quest nodes to unlock exploration areas.</p>
      </div>
      <div v-else class="exploration-cards">
        <button
          v-for="node in unlockedExplorations"
          :key="node.id"
          class="exploration-card"
          :class="{ active: isExplorationActive(node.id) }"
          @click="selectExploration(node)"
        >
          <div class="exploration-icon">🧭</div>
          <div class="exploration-info">
            <div class="exploration-name">{{ node.name }}</div>
            <div class="exploration-status">{{ getExplorationStatus(node.id) }}</div>
          </div>
          <div class="exploration-arrow">›</div>
        </button>
      </div>
    </section>

    <section class="history-section">
      <h2>Recent Completions</h2>
      <div v-if="completedHistory.length === 0" class="empty-state">
        <p>No completed explorations yet.</p>
      </div>
      <div v-else class="history-list">
        <div
          v-for="(entry, index) in completedHistory"
          :key="index"
          class="history-entry"
        >
          <div class="history-name">{{ explorationsStore.getExplorationNode(entry.nodeId)?.name || entry.nodeId }}</div>
          <div class="history-rewards">
            <span>🪙 {{ entry.rewards.gold }}</span>
            <span>💎 {{ entry.rewards.gems }}</span>
            <span>⭐ {{ entry.rewards.xp }} XP</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.explorations-screen {
  min-height: 100vh;
  background: #111827;
  color: #f3f4f6;
  padding: 20px;
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-button {
  background: #374151;
  border: none;
  color: #f3f4f6;
  font-size: 1.5rem;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.back-button:hover {
  background: #4b5563;
}

h1 {
  font-size: 1.5rem;
  margin: 0;
}

h2 {
  font-size: 1.1rem;
  color: #9ca3af;
  margin-bottom: 12px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #6b7280;
}

.hint {
  font-size: 0.85rem;
  margin-top: 8px;
}

.exploration-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.exploration-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #1f2937;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.2s ease;
}

.exploration-card:hover {
  background: #374151;
}

.exploration-card.active {
  border-color: #06b6d4;
}

.exploration-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border-radius: 12px;
}

.exploration-info {
  flex: 1;
}

.exploration-name {
  font-weight: 600;
  color: #f3f4f6;
}

.exploration-status {
  font-size: 0.85rem;
  color: #9ca3af;
}

.exploration-arrow {
  font-size: 1.5rem;
  color: #6b7280;
}

.history-section {
  margin-top: 32px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1f2937;
  border-radius: 8px;
  padding: 12px 16px;
}

.history-name {
  font-weight: 500;
}

.history-rewards {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #9ca3af;
}
</style>
```

**Step 2: Add to screens index**

Modify `src/screens/index.js`:

```javascript
export { default as ExplorationsScreen } from './ExplorationsScreen.vue'
```

**Step 3: Test render**

Run app and manually navigate to verify basic render.

**Step 4: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/screens/ExplorationsScreen.vue src/screens/index.js
git commit -m "feat: create ExplorationsScreen with basic structure

- Shows unlocked explorations with status
- Shows completion history with rewards
- Navigation to exploration detail view"
```

---

## Task 17: ExplorationDetailView Component

Create the detail view for starting/viewing explorations.

**Files:**
- Create: `src/components/ExplorationDetailView.vue`
- Modify: `src/components/index.js`

**Step 1: Create component**

Create `src/components/ExplorationDetailView.vue`:

```vue
<script setup>
import { computed, ref, watch } from 'vue'
import { useExplorationsStore, useHeroesStore } from '../stores'
import HeroCard from './HeroCard.vue'

const props = defineProps({
  nodeId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'started', 'cancelled'])

const explorationsStore = useExplorationsStore()
const heroesStore = useHeroesStore()

const node = computed(() => explorationsStore.getExplorationNode(props.nodeId))
const config = computed(() => node.value?.explorationConfig)
const isActive = computed(() => !!explorationsStore.activeExplorations[props.nodeId])
const exploration = computed(() => explorationsStore.activeExplorations[props.nodeId])

// Hero selection (when not active)
const selectedHeroes = ref([])
const showCancelConfirm = ref(false)

const availableHeroes = computed(() => heroesStore.availableForExploration)

const canStart = computed(() => selectedHeroes.value.length === 5)

const partyRequestMet = computed(() => {
  if (selectedHeroes.value.length !== 5) return false
  return explorationsStore.checkPartyRequest(props.nodeId, selectedHeroes.value)
})

// Time display for active exploration
const timeDisplay = computed(() => {
  if (!exploration.value || !config.value) return ''
  const elapsed = Date.now() - exploration.value.startedAt
  const remaining = Math.max(0, (config.value.timeLimit * 60 * 1000) - elapsed)
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return `${hours}h ${minutes}m ${seconds}s`
})

const progressPercent = computed(() => {
  if (!exploration.value || !config.value) return 0
  return Math.min(100, (exploration.value.fightCount / config.value.requiredFights) * 100)
})

function toggleHeroSelection(instanceId) {
  const index = selectedHeroes.value.indexOf(instanceId)
  if (index === -1) {
    if (selectedHeroes.value.length < 5) {
      selectedHeroes.value.push(instanceId)
    }
  } else {
    selectedHeroes.value.splice(index, 1)
  }
}

function isHeroSelected(instanceId) {
  return selectedHeroes.value.includes(instanceId)
}

function startExploration() {
  const result = explorationsStore.startExploration(props.nodeId, selectedHeroes.value)
  if (result.success) {
    selectedHeroes.value = []
    emit('started')
  }
}

function confirmCancel() {
  showCancelConfirm.value = true
}

function cancelExploration() {
  explorationsStore.cancelExploration(props.nodeId)
  showCancelConfirm.value = false
  emit('cancelled')
}

// Update time display every second when active
let timer = null
watch(isActive, (active) => {
  if (active) {
    timer = setInterval(() => {}, 1000) // Force reactivity
  } else if (timer) {
    clearInterval(timer)
  }
}, { immediate: true })
</script>

<template>
  <div class="exploration-detail">
    <header class="detail-header">
      <button class="close-button" @click="emit('close')">×</button>
      <h2>{{ node?.name }}</h2>
    </header>

    <div class="detail-content">
      <!-- Party Request -->
      <div class="party-request" :class="{ met: isActive ? exploration?.partyRequestMet : partyRequestMet }">
        <div class="request-label">Party Request:</div>
        <div class="request-description">{{ config?.partyRequest?.description }}</div>
        <div class="request-bonus" v-if="isActive ? exploration?.partyRequestMet : partyRequestMet">
          +10% bonus active!
        </div>
      </div>

      <!-- Active Exploration View -->
      <template v-if="isActive">
        <div class="progress-section">
          <div class="progress-row">
            <span>Fights:</span>
            <span>{{ exploration.fightCount }} / {{ config.requiredFights }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="time-remaining">
            Time remaining: {{ timeDisplay }}
          </div>
        </div>

        <div class="assigned-heroes">
          <h3>Assigned Heroes</h3>
          <div class="hero-grid">
            <HeroCard
              v-for="instanceId in exploration.heroes"
              :key="instanceId"
              :hero="heroesStore.getHeroFull(instanceId)"
              compact
            />
          </div>
        </div>

        <button class="cancel-button" @click="confirmCancel">
          Cancel Exploration
        </button>

        <!-- Cancel Confirmation -->
        <div v-if="showCancelConfirm" class="confirm-overlay">
          <div class="confirm-dialog">
            <p>Cancel this exploration?</p>
            <p class="warning">All progress will be lost!</p>
            <div class="confirm-buttons">
              <button class="confirm-no" @click="showCancelConfirm = false">Keep Going</button>
              <button class="confirm-yes" @click="cancelExploration">Cancel</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Hero Selection View -->
      <template v-else>
        <div class="requirements">
          <div class="req-item">
            <span>Fights:</span>
            <span>{{ config?.requiredFights }}</span>
          </div>
          <div class="req-item">
            <span>Time Limit:</span>
            <span>{{ config?.timeLimit }} minutes</span>
          </div>
        </div>

        <div class="rewards-preview">
          <h3>Rewards</h3>
          <div class="reward-items">
            <span>🪙 {{ config?.rewards?.gold }}</span>
            <span>💎 {{ config?.rewards?.gems }}</span>
            <span>⭐ {{ config?.rewards?.xp }} XP</span>
          </div>
        </div>

        <div class="hero-selection">
          <h3>Select 5 Heroes ({{ selectedHeroes.length }}/5)</h3>
          <div v-if="availableHeroes.length === 0" class="no-heroes">
            No available heroes. Heroes in party or on other explorations cannot be selected.
          </div>
          <div v-else class="hero-grid">
            <HeroCard
              v-for="hero in availableHeroes"
              :key="hero.instanceId"
              :hero="heroesStore.getHeroFull(hero.instanceId)"
              :selected="isHeroSelected(hero.instanceId)"
              compact
              @click="toggleHeroSelection(hero.instanceId)"
            />
          </div>
        </div>

        <button
          class="start-button"
          :disabled="!canStart"
          @click="startExploration"
        >
          Start Exploration
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.exploration-detail {
  background: #111827;
  min-height: 100vh;
  color: #f3f4f6;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #1f2937;
}

.close-button {
  background: #374151;
  border: none;
  color: #f3f4f6;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
}

h2 {
  margin: 0;
  font-size: 1.3rem;
}

h3 {
  font-size: 1rem;
  color: #9ca3af;
  margin-bottom: 12px;
}

.detail-content {
  padding: 20px;
}

.party-request {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.party-request.met {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.request-label {
  font-size: 0.85rem;
  color: #9ca3af;
}

.request-description {
  font-weight: 600;
  margin-top: 4px;
}

.request-bonus {
  color: #10b981;
  font-size: 0.85rem;
  margin-top: 8px;
}

.requirements, .rewards-preview {
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.req-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.reward-items {
  display: flex;
  gap: 16px;
}

.hero-selection, .assigned-heroes {
  margin-bottom: 20px;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.no-heroes {
  text-align: center;
  color: #6b7280;
  padding: 24px;
}

.start-button, .cancel-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-button {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.start-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-button {
  background: #374151;
  color: #f3f4f6;
}

.cancel-button:hover {
  background: #4b5563;
}

.progress-section {
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #10b981);
  transition: width 0.3s ease;
}

.time-remaining {
  text-align: center;
  margin-top: 12px;
  color: #9ca3af;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.confirm-dialog {
  background: #1f2937;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  max-width: 300px;
}

.warning {
  color: #ef4444;
  font-size: 0.9rem;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.confirm-no, .confirm-yes {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-no {
  background: #06b6d4;
  color: white;
}

.confirm-yes {
  background: #ef4444;
  color: white;
}
</style>
```

**Step 2: Add to components index**

Modify `src/components/index.js`:

```javascript
export { default as ExplorationDetailView } from './ExplorationDetailView.vue'
```

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/components/ExplorationDetailView.vue src/components/index.js
git commit -m "feat: create ExplorationDetailView component

- Hero selection for starting exploration
- Progress display for active exploration
- Cancel with confirmation dialog
- Party request indicator with bonus status"
```

---

## Task 18: ExplorationCompletePopup Component

Create the completion popup shown after exploration finishes.

**Files:**
- Create: `src/components/ExplorationCompletePopup.vue`
- Modify: `src/components/index.js`

**Step 1: Create component**

Create `src/components/ExplorationCompletePopup.vue`:

```vue
<script setup>
import { computed } from 'vue'
import { useHeroesStore } from '../stores'
import { getItem } from '../data/items.js'

const props = defineProps({
  completion: {
    type: Object,
    required: true
    // { nodeId, nodeName, rewards: { gold, gems, xp, xpPerHero }, heroes, itemsDropped, partyRequestMet }
  }
})

const emit = defineEmits(['claim'])

const heroesStore = useHeroesStore()

const heroDisplays = computed(() => {
  return props.completion.heroes.map(instanceId => {
    return heroesStore.getHeroFull(instanceId)
  }).filter(Boolean)
})

const itemDisplays = computed(() => {
  return props.completion.itemsDropped.map(itemId => {
    return getItem(itemId)
  }).filter(Boolean)
})
</script>

<template>
  <div class="popup-overlay">
    <div class="popup-container">
      <div class="popup-header">
        <div class="celebration">🎉</div>
        <h2>Exploration Complete!</h2>
        <div class="node-name">{{ completion.nodeName }}</div>
      </div>

      <div class="heroes-row">
        <div
          v-for="hero in heroDisplays"
          :key="hero.instanceId"
          class="hero-portrait"
        >
          <div class="portrait-placeholder">{{ hero.template?.name?.charAt(0) }}</div>
          <div class="hero-xp">+{{ completion.rewards.xpPerHero }} XP</div>
        </div>
      </div>

      <div class="rewards-section">
        <h3>Rewards</h3>
        <div class="reward-grid">
          <div class="reward-item">
            <span class="reward-icon">🪙</span>
            <span class="reward-value">{{ completion.rewards.gold }}</span>
            <span class="reward-label">Gold</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">💎</span>
            <span class="reward-value">{{ completion.rewards.gems }}</span>
            <span class="reward-label">Gems</span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">⭐</span>
            <span class="reward-value">{{ completion.rewards.xp }}</span>
            <span class="reward-label">Total XP</span>
          </div>
        </div>

        <div v-if="completion.partyRequestMet" class="bonus-indicator">
          +10% Party Request Bonus Applied!
        </div>

        <div v-if="itemDisplays.length > 0" class="items-section">
          <h4>Items Found</h4>
          <div class="items-grid">
            <div
              v-for="item in itemDisplays"
              :key="item.id"
              class="item-card"
            >
              <div class="item-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <button class="claim-button" @click="emit('claim')">
        Claim Rewards
      </button>
    </div>
  </div>
</template>

<style scoped>
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.popup-container {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  border: 2px solid #06b6d4;
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.popup-header {
  margin-bottom: 20px;
}

.celebration {
  font-size: 3rem;
  margin-bottom: 8px;
}

h2 {
  color: #06b6d4;
  margin: 0 0 8px 0;
  font-size: 1.5rem;
}

.node-name {
  color: #9ca3af;
  font-size: 0.9rem;
}

.heroes-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.hero-portrait {
  text-align: center;
}

.portrait-placeholder {
  width: 48px;
  height: 48px;
  background: #374151;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #9ca3af;
  margin: 0 auto 4px;
}

.hero-xp {
  font-size: 0.7rem;
  color: #10b981;
}

h3 {
  color: #f3f4f6;
  margin: 0 0 12px 0;
  font-size: 1rem;
}

h4 {
  color: #9ca3af;
  margin: 16px 0 8px 0;
  font-size: 0.9rem;
}

.reward-grid {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reward-icon {
  font-size: 1.5rem;
}

.reward-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #f3f4f6;
}

.reward-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.bonus-indicator {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid #10b981;
  color: #10b981;
  padding: 8px 16px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.85rem;
}

.items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.item-card {
  background: #374151;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.claim-button {
  width: 100%;
  padding: 16px;
  margin-top: 24px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.claim-button:hover {
  transform: scale(1.02);
}
</style>
```

**Step 2: Update components index**

Add to `src/components/index.js`:

```javascript
export { default as ExplorationCompletePopup } from './ExplorationCompletePopup.vue'
```

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/components/ExplorationCompletePopup.vue src/components/index.js
git commit -m "feat: create ExplorationCompletePopup component

- Shows 5 hero portraits with XP gained
- Displays gold, gems, total XP rewards
- Party request bonus indicator
- Item drops display
- Claim button to dismiss"
```

---

## Task 19: Wire Up Navigation and Popup

Connect all the pieces - navigation, popup display, and app persistence.

**Files:**
- Modify: `src/App.vue`

**Step 1: Add explorations to App.vue**

This task involves modifying App.vue to:
1. Import and use explorations store
2. Add ExplorationsScreen to navigation
3. Add ExplorationDetailView handling
4. Add completion popup display logic
5. Add persistence for explorations
6. Check completions on app mount

The specific changes depend on the current App.vue structure. Read the file first, then integrate:

- Add `explorations` to saved/loaded state
- Add `explorationsStore.checkCompletions()` in mounted
- Add popup visibility logic based on `pendingCompletions`
- Add screen navigation for 'explorations' and 'exploration-detail'

**Step 2: Test full flow**

Run app, start exploration, complete battles, verify completion flow.

**Step 3: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/App.vue
git commit -m "feat: wire up explorations in App.vue

- Add explorations to persistence
- Check completions on mount
- Display completion popup
- Navigation to explorations screens"
```

---

## Task 20: World Map Integration

Handle exploration node taps on the world map.

**Files:**
- Modify: `src/screens/WorldMapScreen.vue`

**Step 1: Add exploration node handling**

Import explorations store, detect exploration nodes, navigate to detail view instead of battle.

**Step 2: Commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add src/screens/WorldMapScreen.vue
git commit -m "feat: handle exploration nodes in world map

- Detect exploration node type on tap
- Navigate to exploration detail instead of battle
- Show exploration status in node details panel"
```

---

## Task 21: Final Testing and Polish

Run full test suite and manual testing.

**Step 1: Run all tests**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations && npm test
```

Ensure all tests pass.

**Step 2: Manual testing checklist**

- [ ] Start exploration with 5 heroes
- [ ] Verify heroes locked (can't add to party)
- [ ] Complete battles, verify fight count increments
- [ ] Wait for time completion (or adjust time for testing)
- [ ] Verify completion popup appears after victory dialog
- [ ] Verify rewards applied correctly
- [ ] Verify heroes unlocked after completion
- [ ] Verify history updated
- [ ] Test cancellation with confirmation
- [ ] Test app reload preserves exploration state

**Step 3: Final commit**

```bash
cd /home/deltran/code/dorf/.worktrees/explorations
git add -A
git commit -m "feat: explorations feature complete

Idle progression system where players send 5 non-party heroes
on expeditions. Completes via fight count or real-world time.
Includes party request bonus system and completion popup."
```

---

## Summary

This plan implements the explorations feature in 21 tasks:

1. Hero locking in heroes.js
2. Exploration node data
3. Explorations store core state
4. Start exploration
5. Party request validation
6. Cancel exploration
7. Increment fight count
8. Check completions
9. Claim completion with rewards
10. Persistence
11. Next completion helper
12. Battle victory integration
13. NodeMarker exploration styling
14. HeroCard exploration indicator
15. Home screen summary card
16. ExplorationsScreen basic structure
17. ExplorationDetailView component
18. ExplorationCompletePopup component
19. App.vue wiring
20. World map integration
21. Final testing

Each task follows TDD where applicable, with frequent commits.

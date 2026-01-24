# Exploration Ranks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a ranking system (E→S) to explorations that increases rewards by 5% per rank, upgradeable with Genus Loci crests and gold.

**Architecture:** New data file defines rank constants and costs. Explorations store tracks rank per nodeId and provides upgrade functions. UI shows rank badges and enhance buttons/modal in both list and detail views.

**Tech Stack:** Vue 3, Pinia, Vitest

---

### Task 1: Create Exploration Ranks Data File

**Files:**
- Create: `src/data/explorationRanks.js`
- Test: `src/data/__tests__/explorationRanks.test.js`

**Step 1: Write the test file**

```js
// src/data/__tests__/explorationRanks.test.js
import { describe, it, expect } from 'vitest'
import {
  RANK_BONUS_PER_LEVEL,
  EXPLORATION_RANKS,
  RANK_UPGRADE_COSTS
} from '../explorationRanks.js'

describe('explorationRanks', () => {
  it('exports RANK_BONUS_PER_LEVEL as 5', () => {
    expect(RANK_BONUS_PER_LEVEL).toBe(5)
  })

  it('exports EXPLORATION_RANKS in order E to S', () => {
    expect(EXPLORATION_RANKS).toEqual(['E', 'D', 'C', 'B', 'A', 'S'])
  })

  it('exports upgrade costs for E through A', () => {
    expect(RANK_UPGRADE_COSTS.E).toEqual({ crests: 1, gold: 1000 })
    expect(RANK_UPGRADE_COSTS.D).toEqual({ crests: 5, gold: 1500 })
    expect(RANK_UPGRADE_COSTS.C).toEqual({ crests: 15, gold: 2250 })
    expect(RANK_UPGRADE_COSTS.B).toEqual({ crests: 50, gold: 3375 })
    expect(RANK_UPGRADE_COSTS.A).toEqual({ crests: 100, gold: 5000 })
  })

  it('does not have upgrade cost for S (max rank)', () => {
    expect(RANK_UPGRADE_COSTS.S).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/explorationRanks.test.js`
Expected: FAIL with "Cannot find module '../explorationRanks.js'"

**Step 3: Write the implementation**

```js
// src/data/explorationRanks.js

// Percentage bonus per rank level (configurable)
export const RANK_BONUS_PER_LEVEL = 5

// Rank progression from lowest to highest
export const EXPLORATION_RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

// Cost to upgrade FROM each rank (S has no entry - it's max)
export const RANK_UPGRADE_COSTS = {
  E: { crests: 1, gold: 1000 },
  D: { crests: 5, gold: 1500 },
  C: { crests: 15, gold: 2250 },
  B: { crests: 50, gold: 3375 },
  A: { crests: 100, gold: 5000 }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/explorationRanks.test.js`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/data/explorationRanks.js src/data/__tests__/explorationRanks.test.js
git commit -m "feat: add exploration ranks data constants"
```

---

### Task 2: Add requiredCrestId to Exploration Config

**Files:**
- Modify: `src/data/questNodes.js`

**Step 1: Add requiredCrestId to cave_exploration**

Find the `cave_exploration` node (around line 282) and add `requiredCrestId` to its `explorationConfig`:

```js
cave_exploration: {
  id: 'cave_exploration',
  name: 'Echoing Caverns Exploration',
  region: 'Echoing Caverns',
  x: 80,
  y: 310,
  type: 'exploration',
  unlockedBy: 'cave_01',
  backgroundId: 'cave_01',
  connections: [],
  explorationConfig: {
    requiredFights: 50,
    timeLimit: 240,
    rewards: { gold: 500, gems: 20, xp: 300 },
    requiredCrestId: 'valinar_crest',  // ADD THIS LINE
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

**Step 2: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat: add requiredCrestId to exploration config"
```

---

### Task 3: Add Rank State and Getters to Explorations Store

**Files:**
- Modify: `src/stores/explorations.js`
- Test: `src/stores/__tests__/explorations-ranks.test.js`

**Step 1: Write the test file**

```js
// src/stores/__tests__/explorations-ranks.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExplorationsStore } from '../explorations.js'

describe('explorations store - ranks', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useExplorationsStore()
  })

  describe('getExplorationRank', () => {
    it('returns E for exploration with no rank set', () => {
      expect(store.getExplorationRank('cave_exploration')).toBe('E')
    })

    it('returns stored rank when set', () => {
      store.explorationRanks['cave_exploration'] = 'C'
      expect(store.getExplorationRank('cave_exploration')).toBe('C')
    })
  })

  describe('getRankMultiplier', () => {
    it('returns 1.0 for rank E', () => {
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.0)
    })

    it('returns 1.05 for rank D', () => {
      store.explorationRanks['cave_exploration'] = 'D'
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.05)
    })

    it('returns 1.10 for rank C', () => {
      store.explorationRanks['cave_exploration'] = 'C'
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.10)
    })

    it('returns 1.25 for rank S', () => {
      store.explorationRanks['cave_exploration'] = 'S'
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.25)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/explorations-ranks.test.js`
Expected: FAIL with "store.explorationRanks is undefined" or similar

**Step 3: Add imports and state to explorations.js**

At top of file, add import:
```js
import {
  RANK_BONUS_PER_LEVEL,
  EXPLORATION_RANKS,
  RANK_UPGRADE_COSTS
} from '../data/explorationRanks.js'
```

After existing state declarations (around line 15), add:
```js
const explorationRanks = ref({})
```

**Step 4: Add getter functions**

After `getExplorationNode` function, add:

```js
// Get rank for an exploration (defaults to 'E')
function getExplorationRank(nodeId) {
  return explorationRanks.value[nodeId] || 'E'
}

// Get reward multiplier based on rank (E=1.0, D=1.05, C=1.10, etc.)
function getRankMultiplier(nodeId) {
  const rank = getExplorationRank(nodeId)
  const rankIndex = EXPLORATION_RANKS.indexOf(rank)
  return 1 + (rankIndex * RANK_BONUS_PER_LEVEL / 100)
}
```

**Step 5: Export new state and functions**

In the return statement, add:
```js
return {
  // State
  activeExplorations,
  completedHistory,
  pendingCompletions,
  explorationRanks,  // ADD
  // Getters
  // ... existing ...
  // Actions
  getExplorationNode,
  getExplorationRank,  // ADD
  getRankMultiplier,   // ADD
  // ... rest ...
}
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/explorations-ranks.test.js`
Expected: PASS (5 tests)

**Step 7: Commit**

```bash
git add src/stores/explorations.js src/stores/__tests__/explorations-ranks.test.js
git commit -m "feat: add exploration rank state and getters"
```

---

### Task 4: Add canUpgradeExploration Function

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations-ranks.test.js`

**Step 1: Add tests for canUpgradeExploration**

Append to the test file:

```js
describe('canUpgradeExploration', () => {
  it('returns canUpgrade false if exploration is active', () => {
    store.activeExplorations['cave_exploration'] = { nodeId: 'cave_exploration' }
    const result = store.canUpgradeExploration('cave_exploration')
    expect(result.canUpgrade).toBe(false)
    expect(result.reason).toBe('Exploration in progress')
  })

  it('returns canUpgrade false if already rank S', () => {
    store.explorationRanks['cave_exploration'] = 'S'
    const result = store.canUpgradeExploration('cave_exploration')
    expect(result.canUpgrade).toBe(false)
    expect(result.reason).toBe('Already max rank')
  })

  it('returns cost info for valid upgrade check', () => {
    const result = store.canUpgradeExploration('cave_exploration')
    expect(result.currentRank).toBe('E')
    expect(result.nextRank).toBe('D')
    expect(result.crestId).toBe('valinar_crest')
    expect(result.crestsNeeded).toBe(1)
    expect(result.goldNeeded).toBe(1000)
  })

  it('returns canUpgrade false if not enough crests', () => {
    // No crests in inventory by default
    const result = store.canUpgradeExploration('cave_exploration')
    expect(result.canUpgrade).toBe(false)
    expect(result.crestsHave).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/explorations-ranks.test.js`
Expected: FAIL with "store.canUpgradeExploration is not a function"

**Step 3: Implement canUpgradeExploration**

Add after `getRankMultiplier`:

```js
// Check if upgrade is possible and return cost info
function canUpgradeExploration(nodeId) {
  const inventoryStore = useInventoryStore()
  const gachaStore = useGachaStore()

  const node = getExplorationNode(nodeId)
  if (!node) return { canUpgrade: false, reason: 'Invalid node' }

  // Can't upgrade if active
  if (activeExplorations.value[nodeId]) {
    return { canUpgrade: false, reason: 'Exploration in progress' }
  }

  const currentRank = getExplorationRank(nodeId)
  if (currentRank === 'S') {
    return { canUpgrade: false, reason: 'Already max rank' }
  }

  const cost = RANK_UPGRADE_COSTS[currentRank]
  const crestId = node.explorationConfig.requiredCrestId
  const crestsHave = inventoryStore.getItemCount(crestId)
  const goldHave = gachaStore.gold

  return {
    canUpgrade: crestsHave >= cost.crests && goldHave >= cost.gold,
    currentRank,
    nextRank: EXPLORATION_RANKS[EXPLORATION_RANKS.indexOf(currentRank) + 1],
    crestId,
    crestsNeeded: cost.crests,
    crestsHave,
    goldNeeded: cost.gold,
    goldHave
  }
}
```

**Step 4: Export the function**

Add `canUpgradeExploration` to the return statement.

**Step 5: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/explorations-ranks.test.js`
Expected: PASS (9 tests)

**Step 6: Commit**

```bash
git add src/stores/explorations.js src/stores/__tests__/explorations-ranks.test.js
git commit -m "feat: add canUpgradeExploration function"
```

---

### Task 5: Add upgradeExploration Function

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations-ranks.test.js`

**Step 1: Add tests for upgradeExploration**

Append to the test file (need to import inventory and gacha stores):

```js
import { useInventoryStore } from '../inventory.js'
import { useGachaStore } from '../gacha.js'

describe('upgradeExploration', () => {
  it('returns error if exploration is active', () => {
    store.activeExplorations['cave_exploration'] = { nodeId: 'cave_exploration' }
    const result = store.upgradeExploration('cave_exploration')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Exploration in progress')
  })

  it('successfully upgrades when requirements met', () => {
    const inventoryStore = useInventoryStore()
    const gachaStore = useGachaStore()

    // Give player required resources
    inventoryStore.addItem('valinar_crest', 1)
    gachaStore.gold = 5000

    const result = store.upgradeExploration('cave_exploration')
    expect(result.success).toBe(true)
    expect(result.newRank).toBe('D')
    expect(store.getExplorationRank('cave_exploration')).toBe('D')
  })

  it('deducts crests and gold on upgrade', () => {
    const inventoryStore = useInventoryStore()
    const gachaStore = useGachaStore()

    inventoryStore.addItem('valinar_crest', 5)
    gachaStore.gold = 5000

    store.upgradeExploration('cave_exploration')

    expect(inventoryStore.getItemCount('valinar_crest')).toBe(4)
    expect(gachaStore.gold).toBe(4000)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/explorations-ranks.test.js`
Expected: FAIL with "store.upgradeExploration is not a function"

**Step 3: Implement upgradeExploration**

Add after `canUpgradeExploration`:

```js
// Perform the upgrade
function upgradeExploration(nodeId) {
  const inventoryStore = useInventoryStore()
  const gachaStore = useGachaStore()

  const check = canUpgradeExploration(nodeId)
  if (!check.canUpgrade) {
    return { success: false, error: check.reason }
  }

  // Deduct costs
  inventoryStore.removeItem(check.crestId, check.crestsNeeded)
  gachaStore.spendGold(check.goldNeeded)

  // Increase rank
  explorationRanks.value[nodeId] = check.nextRank

  return { success: true, newRank: check.nextRank }
}
```

**Step 4: Export the function**

Add `upgradeExploration` to the return statement.

**Step 5: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/explorations-ranks.test.js`
Expected: PASS (12 tests)

**Step 6: Commit**

```bash
git add src/stores/explorations.js src/stores/__tests__/explorations-ranks.test.js
git commit -m "feat: add upgradeExploration function"
```

---

### Task 6: Update claimCompletion to Apply Rank Multiplier

**Files:**
- Modify: `src/stores/explorations.js`
- Modify: `src/stores/__tests__/explorations.test.js`

**Step 1: Add test for rank multiplier in rewards**

Add to existing explorations.test.js:

```js
describe('claimCompletion with rank bonus', () => {
  it('applies rank multiplier to rewards', () => {
    // Setup: start and complete an exploration at rank C (+10%)
    const store = useExplorationsStore()
    const heroesStore = useHeroesStore()
    const gachaStore = useGachaStore()

    // Create 5 heroes
    for (let i = 0; i < 5; i++) {
      heroesStore.addHero('militia_soldier')
    }
    const heroIds = heroesStore.collection.map(h => h.instanceId)

    // Set rank to C
    store.explorationRanks['cave_exploration'] = 'C'

    // Start exploration
    store.startExploration('cave_exploration', heroIds)

    // Force completion
    store.activeExplorations['cave_exploration'].fightCount = 50

    // Record starting gold
    const startGold = gachaStore.gold

    // Claim
    const result = store.claimCompletion('cave_exploration')

    // Base gold is 500, rank C = 1.10, no party bonus = 550
    expect(result.gold).toBe(550)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/explorations.test.js`
Expected: FAIL (gold should be 500, not 550 - rank not applied yet)

**Step 3: Update claimCompletion**

Find the reward calculation section (around line 218-225) and update:

```js
// OLD:
const bonusMultiplier = exploration.partyRequestMet ? 1.10 : 1.0

// NEW:
const rankMultiplier = getRankMultiplier(nodeId)
const partyMultiplier = exploration.partyRequestMet ? 1.10 : 1.0
const bonusMultiplier = rankMultiplier * partyMultiplier
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/explorations.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/explorations.js src/stores/__tests__/explorations.test.js
git commit -m "feat: apply rank multiplier to exploration rewards"
```

---

### Task 7: Update Persistence for Exploration Ranks

**Files:**
- Modify: `src/stores/explorations.js`

**Step 1: Update saveState**

Find `saveState` function and update:

```js
function saveState() {
  return {
    activeExplorations: activeExplorations.value,
    completedHistory: completedHistory.value,
    explorationRanks: explorationRanks.value
  }
}
```

**Step 2: Update loadState**

Find `loadState` function and update:

```js
function loadState(savedState) {
  if (!savedState) return
  if (savedState.activeExplorations) {
    activeExplorations.value = savedState.activeExplorations
  }
  if (savedState.completedHistory) {
    completedHistory.value = savedState.completedHistory
  }
  if (savedState.explorationRanks) {
    explorationRanks.value = savedState.explorationRanks
  }
}
```

**Step 3: Commit**

```bash
git add src/stores/explorations.js
git commit -m "feat: persist exploration ranks in save state"
```

---

### Task 8: Add Rank Badge to ExplorationsScreen

**Files:**
- Modify: `src/screens/ExplorationsScreen.vue`

**Step 1: Import rank data and add helper**

In the script section, add import:

```js
import { EXPLORATION_RANKS } from '../data/explorationRanks.js'
```

Add helper function:

```js
function getExplorationRank(nodeId) {
  return explorationsStore.getExplorationRank(nodeId)
}
```

**Step 2: Add rank badge to template**

Find the exploration card header (around line 98-101) and add the badge:

```html
<div class="card-header">
  <span class="compass-icon">🧭</span>
  <h3>{{ node.name }}</h3>
  <span :class="['rank-badge', `rank-${getExplorationRank(node.id)}`]">
    {{ getExplorationRank(node.id) }}
  </span>
</div>
```

**Step 3: Add CSS for rank badges**

Add to the style section:

```css
.rank-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
}

.rank-badge.rank-E {
  background: #4b5563;
  color: #9ca3af;
}

.rank-badge.rank-D {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.rank-badge.rank-C {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.rank-badge.rank-B {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.rank-badge.rank-A {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.rank-badge.rank-S {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 179, 8, 0.3) 100%);
  color: #fbbf24;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}
```

**Step 4: Commit**

```bash
git add src/screens/ExplorationsScreen.vue
git commit -m "feat: add rank badge to exploration cards"
```

---

### Task 9: Add Enhance Button to ExplorationsScreen

**Files:**
- Modify: `src/screens/ExplorationsScreen.vue`

**Step 1: Add state for enhance modal**

```js
const showEnhanceModal = ref(false)
const enhanceNodeId = ref(null)

function openEnhanceModal(nodeId) {
  enhanceNodeId.value = nodeId
  showEnhanceModal.value = true
}

function closeEnhanceModal() {
  showEnhanceModal.value = false
  enhanceNodeId.value = null
}
```

**Step 2: Add Enhance button to card**

After the card-action div (around line 140-143), add:

```html
<div class="card-actions">
  <span v-if="isActive(node.id)" class="status-badge active">In Progress</span>
  <span v-else class="status-badge available">Available</span>
  <button
    class="enhance-btn"
    :disabled="isActive(node.id)"
    @click.stop="openEnhanceModal(node.id)"
  >
    Enhance
  </button>
</div>
```

**Step 3: Add CSS for enhance button**

```css
.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.enhance-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  border: 1px solid #6b7280;
  border-radius: 6px;
  color: #d1d5db;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.enhance-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border-color: #9ca3af;
}

.enhance-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Step 4: Commit**

```bash
git add src/screens/ExplorationsScreen.vue
git commit -m "feat: add enhance button to exploration cards"
```

---

### Task 10: Add Enhance Modal to ExplorationsScreen

**Files:**
- Modify: `src/screens/ExplorationsScreen.vue`

**Step 1: Add computed for enhance info**

```js
import { useGachaStore, useInventoryStore } from '../stores'
import { getItem } from '../data/items.js'

const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

const enhanceInfo = computed(() => {
  if (!enhanceNodeId.value) return null
  return explorationsStore.canUpgradeExploration(enhanceNodeId.value)
})

const enhanceCrestItem = computed(() => {
  if (!enhanceInfo.value?.crestId) return null
  return getItem(enhanceInfo.value.crestId)
})

function confirmEnhance() {
  if (!enhanceNodeId.value) return
  const result = explorationsStore.upgradeExploration(enhanceNodeId.value)
  if (result.success) {
    closeEnhanceModal()
  }
}
```

**Step 2: Add modal template**

Add before the closing `</div>` of explorations-screen:

```html
<!-- Enhance Modal -->
<div v-if="showEnhanceModal" class="modal-backdrop" @click="closeEnhanceModal"></div>
<div v-if="showEnhanceModal && enhanceInfo" class="enhance-modal">
  <div class="modal-header">
    <h3>Enhance Exploration</h3>
    <button class="close-btn" @click="closeEnhanceModal">×</button>
  </div>

  <div class="modal-body">
    <div class="rank-transition">
      <span :class="['rank-badge', 'large', `rank-${enhanceInfo.currentRank}`]">
        {{ enhanceInfo.currentRank }}
      </span>
      <span class="arrow">→</span>
      <span :class="['rank-badge', 'large', `rank-${enhanceInfo.nextRank}`]">
        {{ enhanceInfo.nextRank }}
      </span>
    </div>

    <div class="bonus-info">
      +5% reward bonus
    </div>

    <div class="requirements">
      <div class="requirement-row">
        <span class="req-label">{{ enhanceCrestItem?.name || 'Crest' }}</span>
        <span :class="['req-value', enhanceInfo.crestsHave >= enhanceInfo.crestsNeeded ? 'met' : 'unmet']">
          {{ enhanceInfo.crestsHave }} / {{ enhanceInfo.crestsNeeded }}
        </span>
      </div>
      <div class="requirement-row">
        <span class="req-label">🪙 Gold</span>
        <span :class="['req-value', enhanceInfo.goldHave >= enhanceInfo.goldNeeded ? 'met' : 'unmet']">
          {{ enhanceInfo.goldHave.toLocaleString() }} / {{ enhanceInfo.goldNeeded.toLocaleString() }}
        </span>
      </div>
    </div>
  </div>

  <div class="modal-footer">
    <button class="cancel-btn" @click="closeEnhanceModal">Cancel</button>
    <button
      class="confirm-btn"
      :disabled="!enhanceInfo.canUpgrade"
      @click="confirmEnhance"
    >
      Enhance
    </button>
  </div>
</div>
```

**Step 3: Add modal CSS**

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
}

.enhance-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 20px;
  min-width: 300px;
  z-index: 101;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #f3f4f6;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
}

.rank-transition {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.rank-badge.large {
  font-size: 1.5rem;
  padding: 8px 16px;
}

.arrow {
  font-size: 1.5rem;
  color: #6b7280;
}

.bonus-info {
  text-align: center;
  color: #22c55e;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.requirements {
  background: #111827;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.requirement-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.req-label {
  color: #9ca3af;
}

.req-value {
  font-weight: 600;
}

.req-value.met {
  color: #22c55e;
}

.req-value.unmet {
  color: #ef4444;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 10px 20px;
  background: #374151;
  border: none;
  border-radius: 8px;
  color: #d1d5db;
  font-weight: 600;
  cursor: pointer;
}

.confirm-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
}
```

**Step 4: Commit**

```bash
git add src/screens/ExplorationsScreen.vue
git commit -m "feat: add enhance modal to explorations screen"
```

---

### Task 11: Add Rank Display to ExplorationDetailView

**Files:**
- Modify: `src/components/ExplorationDetailView.vue`

**Step 1: Import rank data**

Add import:

```js
import { RANK_BONUS_PER_LEVEL } from '../data/explorationRanks.js'
```

**Step 2: Add computed for rank info**

```js
const currentRank = computed(() => {
  return explorationsStore.getExplorationRank(props.nodeId)
})

const rankBonusPercent = computed(() => {
  const rankIndex = ['E', 'D', 'C', 'B', 'A', 'S'].indexOf(currentRank.value)
  return rankIndex * RANK_BONUS_PER_LEVEL
})
```

**Step 3: Add rank badge to header**

Update the detail-header section:

```html
<header class="detail-header">
  <button class="close-button" @click="emit('close')">×</button>
  <h2>{{ node?.name }}</h2>
  <span :class="['rank-badge', `rank-${currentRank}`]">{{ currentRank }}</span>
</header>
```

**Step 4: Add rank bonus display**

After the party-request section, add:

```html
<div v-if="rankBonusPercent > 0" class="rank-bonus">
  Rank {{ currentRank }}: +{{ rankBonusPercent }}% rewards
</div>
```

**Step 5: Add CSS**

```css
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #1f2937;
}

.rank-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
}

/* Same rank-badge color classes as ExplorationsScreen */
.rank-badge.rank-E { background: #4b5563; color: #9ca3af; }
.rank-badge.rank-D { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.rank-badge.rank-C { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.rank-badge.rank-B { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
.rank-badge.rank-A { background: rgba(249, 115, 22, 0.2); color: #f97316; }
.rank-badge.rank-S {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 179, 8, 0.3) 100%);
  color: #fbbf24;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.rank-bonus {
  text-align: center;
  color: #22c55e;
  font-size: 0.85rem;
  padding: 8px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
}
```

**Step 6: Commit**

```bash
git add src/components/ExplorationDetailView.vue
git commit -m "feat: add rank badge and bonus display to detail view"
```

---

### Task 12: Add Enhance Button and Modal to ExplorationDetailView

**Files:**
- Modify: `src/components/ExplorationDetailView.vue`

**Step 1: Add imports and state**

```js
import { useGachaStore, useInventoryStore } from '../stores'
import { getItem } from '../data/items.js'

const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

const showEnhanceModal = ref(false)

const enhanceInfo = computed(() => {
  return explorationsStore.canUpgradeExploration(props.nodeId)
})

const enhanceCrestItem = computed(() => {
  if (!enhanceInfo.value?.crestId) return null
  return getItem(enhanceInfo.value.crestId)
})

function openEnhanceModal() {
  showEnhanceModal.value = true
}

function closeEnhanceModal() {
  showEnhanceModal.value = false
}

function confirmEnhance() {
  const result = explorationsStore.upgradeExploration(props.nodeId)
  if (result.success) {
    closeEnhanceModal()
  }
}
```

**Step 2: Add Enhance button**

In the template, after the start-button (when not active), add:

```html
<button
  v-if="!isActive && currentRank !== 'S'"
  class="enhance-btn"
  @click="openEnhanceModal"
>
  Enhance Exploration
</button>
```

**Step 3: Add modal template**

Same modal structure as ExplorationsScreen (copy from Task 10).

**Step 4: Add CSS**

```css
.enhance-btn {
  width: 100%;
  padding: 14px;
  margin-top: 12px;
  background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
  border: 1px solid #6b7280;
  border-radius: 12px;
  color: #d1d5db;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.enhance-btn:hover {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border-color: #9ca3af;
}

/* Modal styles same as ExplorationsScreen */
```

**Step 5: Commit**

```bash
git add src/components/ExplorationDetailView.vue
git commit -m "feat: add enhance button and modal to detail view"
```

---

### Task 13: Manual Testing

**Steps:**

1. Run `npm run dev`
2. Navigate to Explorations screen
3. Verify rank badge shows "E" on exploration card
4. Click "Enhance" button - verify modal opens
5. Verify modal shows correct crest and gold requirements
6. Give yourself resources via console:
   ```js
   // In browser console
   const inv = window.__stores.inventory
   inv.addItem('valinar_crest', 10)
   window.__stores.gacha.gold = 50000
   ```
7. Confirm enhance - verify rank updates to "D"
8. Click into exploration detail view
9. Verify rank badge and bonus text display
10. Start an exploration
11. Verify Enhance button is disabled while active
12. Complete exploration, verify rewards include rank bonus

**Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```

---

Plan complete and saved to `docs/plans/2026-01-24-exploration-ranks-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?

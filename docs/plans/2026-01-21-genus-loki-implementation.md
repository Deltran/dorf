# Genus Loki Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Genus Loki endgame boss challenge system with Valinar as the first boss.

**Architecture:** New data file for boss definitions, new Pinia store for progress tracking, integration with existing inventory/battle/quest systems. Home screen gets a new Genus Loki panel. World map handles special genusLoki node type.

**Tech Stack:** Vue 3, Pinia, Vitest

---

## Task 1: Add Key and Unique Drop Items

**Files:**
- Modify: `src/data/items.js`

**Step 1: Write the test**

Create test file `src/data/__tests__/items-genus-loki.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getItem, getItemsByType } from '../items.js'

describe('Genus Loki items', () => {
  describe('Lake Tower Key', () => {
    it('exists and has correct properties', () => {
      const key = getItem('lake_tower_key')
      expect(key).not.toBeNull()
      expect(key.name).toBe('Lake Tower Key')
      expect(key.type).toBe('key')
      expect(key.rarity).toBe(3)
    })
  })

  describe("Valinar's Crest", () => {
    it('exists and has correct properties', () => {
      const crest = getItem('valinar_crest')
      expect(crest).not.toBeNull()
      expect(crest.name).toBe("Valinar's Crest")
      expect(crest.type).toBe('genusLoki')
      expect(crest.rarity).toBe(4)
    })
  })

  describe('getItemsByType', () => {
    it('returns key items', () => {
      const keys = getItemsByType('key')
      expect(keys.length).toBeGreaterThanOrEqual(1)
      expect(keys.some(k => k.id === 'lake_tower_key')).toBe(true)
    })

    it('returns genusLoki items', () => {
      const drops = getItemsByType('genusLoki')
      expect(drops.length).toBeGreaterThanOrEqual(1)
      expect(drops.some(d => d.id === 'valinar_crest')).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/items-genus-loki.test.js`
Expected: FAIL - items not found

**Step 3: Add items to items.js**

Add to the `items` object in `src/data/items.js`:

```js
  lake_tower_key: {
    id: 'lake_tower_key',
    name: 'Lake Tower Key',
    description: 'An ancient key that grants passage to the Lake Tower. Used to challenge Valinar.',
    type: 'key',
    rarity: 3
  },
  valinar_crest: {
    id: 'valinar_crest',
    name: "Valinar's Crest",
    description: 'A battle-worn crest pried from the Lake Tower Guardian. Its purpose remains unknown.',
    type: 'genusLoki',
    rarity: 4
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/items-genus-loki.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/items.js src/data/__tests__/items-genus-loki.test.js
git commit -m "feat: add Lake Tower Key and Valinar's Crest items"
```

---

## Task 2: Create Genus Loki Data File

**Files:**
- Create: `src/data/genusLoki.js`
- Create: `src/data/__tests__/genusLoki.test.js`

**Step 1: Write the test**

Create `src/data/__tests__/genusLoki.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { genusLokiData, getGenusLoki, getAllGenusLoki, getGenusLokiByRegion } from '../genusLoki.js'

describe('Genus Loki data', () => {
  describe('getGenusLoki', () => {
    it('returns Valinar by id', () => {
      const valinar = getGenusLoki('valinar')
      expect(valinar).not.toBeNull()
      expect(valinar.name).toBe('Valinar, Lake Tower Guardian')
      expect(valinar.region).toBe('whisper_lake')
      expect(valinar.keyItemId).toBe('lake_tower_key')
      expect(valinar.maxPowerLevel).toBe(20)
    })

    it('returns null for unknown id', () => {
      expect(getGenusLoki('nonexistent')).toBeNull()
    })
  })

  describe('getAllGenusLoki', () => {
    it('returns array of all bosses', () => {
      const all = getAllGenusLoki()
      expect(Array.isArray(all)).toBe(true)
      expect(all.length).toBeGreaterThanOrEqual(1)
      expect(all.some(g => g.id === 'valinar')).toBe(true)
    })
  })

  describe('getGenusLokiByRegion', () => {
    it('returns Valinar for whisper_lake', () => {
      const boss = getGenusLokiByRegion('whisper_lake')
      expect(boss).not.toBeNull()
      expect(boss.id).toBe('valinar')
    })

    it('returns null for region without boss', () => {
      expect(getGenusLokiByRegion('whispering_woods')).toBeNull()
    })
  })

  describe('Valinar stats and abilities', () => {
    it('has correct base stats', () => {
      const valinar = getGenusLoki('valinar')
      expect(valinar.baseStats.hp).toBe(5000)
      expect(valinar.baseStats.atk).toBe(150)
      expect(valinar.baseStats.def).toBe(100)
      expect(valinar.baseStats.spd).toBe(80)
    })

    it('has 6 abilities with correct unlock levels', () => {
      const valinar = getGenusLoki('valinar')
      expect(valinar.abilities.length).toBe(6)
      expect(valinar.abilities.filter(a => a.unlocksAt === 1).length).toBe(2)
      expect(valinar.abilities.find(a => a.id === 'shield_bash').unlocksAt).toBe(5)
      expect(valinar.abilities.find(a => a.id === 'towers_wrath').unlocksAt).toBe(10)
      expect(valinar.abilities.find(a => a.id === 'counterattack_stance').unlocksAt).toBe(15)
      expect(valinar.abilities.find(a => a.id === 'judgment_of_ages').unlocksAt).toBe(20)
    })

    it('has correct reward structure', () => {
      const valinar = getGenusLoki('valinar')
      expect(valinar.firstClearBonus.gems).toBe(20)
      expect(valinar.currencyRewards.base.gold).toBe(100)
      expect(valinar.currencyRewards.perLevel.gold).toBe(25)
      expect(valinar.uniqueDrop.itemId).toBe('valinar_crest')
      expect(valinar.uniqueDrop.guaranteed).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/genusLoki.test.js`
Expected: FAIL - module not found

**Step 3: Create genusLoki.js**

Create `src/data/genusLoki.js`:

```js
// src/data/genusLoki.js

export const genusLokiData = {
  valinar: {
    id: 'valinar',
    name: 'Valinar, Lake Tower Guardian',
    description: 'A corrupted sentinel who guards the ancient lake tower.',
    region: 'whisper_lake',
    nodeId: 'whisper_lake_genus_loki',
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
}

export function getGenusLoki(id) {
  return genusLokiData[id] || null
}

export function getAllGenusLoki() {
  return Object.values(genusLokiData)
}

export function getGenusLokiByRegion(regionId) {
  return Object.values(genusLokiData).find(g => g.region === regionId) || null
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/genusLoki.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/genusLoki.js src/data/__tests__/genusLoki.test.js
git commit -m "feat: add Genus Loki data file with Valinar"
```

---

## Task 3: Create Genus Loki Store

**Files:**
- Create: `src/stores/genusLoki.js`
- Create: `src/stores/__tests__/genusLoki.test.js`
- Modify: `src/stores/index.js`

**Step 1: Write the test**

Create `src/stores/__tests__/genusLoki.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGenusLokiStore } from '../genusLoki.js'

describe('genusLoki store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has empty progress', () => {
      const store = useGenusLokiStore()
      expect(store.progress).toEqual({})
    })
  })

  describe('isUnlocked', () => {
    it('returns false for never-beaten boss', () => {
      const store = useGenusLokiStore()
      expect(store.isUnlocked('valinar')).toBe(false)
    })

    it('returns true after first victory', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      expect(store.isUnlocked('valinar')).toBe(true)
    })
  })

  describe('getHighestCleared', () => {
    it('returns 0 for unbeaten boss', () => {
      const store = useGenusLokiStore()
      expect(store.getHighestCleared('valinar')).toBe(0)
    })

    it('returns highest cleared level', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      store.recordVictory('valinar', 2)
      store.recordVictory('valinar', 3)
      expect(store.getHighestCleared('valinar')).toBe(3)
    })

    it('does not decrease on lower level clear', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 5)
      store.recordVictory('valinar', 2)
      expect(store.getHighestCleared('valinar')).toBe(5)
    })
  })

  describe('getAvailableLevels', () => {
    it('returns [1] for unbeaten boss', () => {
      const store = useGenusLokiStore()
      expect(store.getAvailableLevels('valinar')).toEqual([1])
    })

    it('returns levels up to highest + 1', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 3)
      expect(store.getAvailableLevels('valinar')).toEqual([1, 2, 3, 4])
    })

    it('caps at maxPowerLevel', () => {
      const store = useGenusLokiStore()
      store.progress.valinar = { unlocked: true, highestCleared: 20, firstClearClaimed: true }
      expect(store.getAvailableLevels('valinar')).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1)
      )
    })
  })

  describe('recordVictory', () => {
    it('marks boss as unlocked', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      expect(store.progress.valinar.unlocked).toBe(true)
    })

    it('updates highestCleared', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      expect(store.progress.valinar.highestCleared).toBe(1)
    })

    it('returns firstClear true on first victory', () => {
      const store = useGenusLokiStore()
      const result = store.recordVictory('valinar', 1)
      expect(result.isFirstClear).toBe(true)
      expect(store.progress.valinar.firstClearClaimed).toBe(true)
    })

    it('returns firstClear false on subsequent victories', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      const result = store.recordVictory('valinar', 2)
      expect(result.isFirstClear).toBe(false)
    })
  })

  describe('unlockedBosses', () => {
    it('returns empty array initially', () => {
      const store = useGenusLokiStore()
      expect(store.unlockedBosses).toEqual([])
    })

    it('returns unlocked bosses with progress', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 5)
      expect(store.unlockedBosses.length).toBe(1)
      expect(store.unlockedBosses[0].id).toBe('valinar')
      expect(store.unlockedBosses[0].highestCleared).toBe(5)
    })
  })

  describe('persistence', () => {
    it('saves and loads state', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 7)

      const saved = store.saveState()
      expect(saved.progress.valinar.highestCleared).toBe(7)

      // Create new store and load
      const store2 = useGenusLokiStore()
      store2.loadState(saved)
      expect(store2.getHighestCleared('valinar')).toBe(7)
      expect(store2.isUnlocked('valinar')).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/genusLoki.test.js`
Expected: FAIL - module not found

**Step 3: Create genusLoki store**

Create `src/stores/genusLoki.js`:

```js
// src/stores/genusLoki.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getGenusLoki, getAllGenusLoki } from '../data/genusLoki.js'

export const useGenusLokiStore = defineStore('genusLoki', () => {
  // State - progress per boss: { [id]: { unlocked, highestCleared, firstClearClaimed } }
  const progress = ref({})

  // Getters
  const unlockedBosses = computed(() => {
    return getAllGenusLoki()
      .filter(boss => progress.value[boss.id]?.unlocked)
      .map(boss => ({
        ...boss,
        highestCleared: progress.value[boss.id]?.highestCleared || 0
      }))
  })

  // Actions
  function isUnlocked(genusLokiId) {
    return progress.value[genusLokiId]?.unlocked || false
  }

  function getHighestCleared(genusLokiId) {
    return progress.value[genusLokiId]?.highestCleared || 0
  }

  function getAvailableLevels(genusLokiId) {
    const boss = getGenusLoki(genusLokiId)
    if (!boss) return []

    const highest = getHighestCleared(genusLokiId)
    const maxAvailable = Math.min(highest + 1, boss.maxPowerLevel)
    return Array.from({ length: maxAvailable }, (_, i) => i + 1)
  }

  function recordVictory(genusLokiId, powerLevel) {
    if (!progress.value[genusLokiId]) {
      progress.value[genusLokiId] = {
        unlocked: false,
        highestCleared: 0,
        firstClearClaimed: false
      }
    }

    const bossProgress = progress.value[genusLokiId]
    const isFirstClear = !bossProgress.firstClearClaimed

    bossProgress.unlocked = true
    bossProgress.highestCleared = Math.max(bossProgress.highestCleared, powerLevel)

    if (isFirstClear) {
      bossProgress.firstClearClaimed = true
    }

    return { isFirstClear }
  }

  // Persistence
  function saveState() {
    return { progress: progress.value }
  }

  function loadState(savedState) {
    if (savedState?.progress) {
      progress.value = savedState.progress
    }
  }

  return {
    // State
    progress,
    // Getters
    unlockedBosses,
    // Actions
    isUnlocked,
    getHighestCleared,
    getAvailableLevels,
    recordVictory,
    // Persistence
    saveState,
    loadState
  }
})
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/genusLoki.test.js`
Expected: PASS

**Step 5: Export from stores/index.js**

Add to `src/stores/index.js`:

```js
export { useGenusLokiStore } from './genusLoki.js'
```

**Step 6: Commit**

```bash
git add src/stores/genusLoki.js src/stores/__tests__/genusLoki.test.js src/stores/index.js
git commit -m "feat: add Genus Loki store for progress tracking"
```

---

## Task 4: Add Genus Loki Node to Whisper Lake

**Files:**
- Modify: `src/data/questNodes.js`

**Step 1: Add the Lake Tower node**

After the `lake_02` node definition in `src/data/questNodes.js`, add:

```js
  lake_genus_loki: {
    id: 'lake_genus_loki',
    name: 'Lake Tower',
    region: 'Whisper Lake',
    x: 250,
    y: 400,
    type: 'genusLoki',
    genusLokiId: 'valinar',
    connections: ['lake_02']
  },
```

Also update `lake_02` to include connection to the new node:

```js
connections: ['lake_genus_loki'],
```

**Step 2: Add Lake Tower Key drops to lake_02**

Add to `lake_02`'s `itemDrops` array:

```js
{ itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.25 }
```

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat: add Lake Tower node and key drops to Whisper Lake"
```

---

## Task 5: Add Genus Loki Panel to Home Screen

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Step 1: Import the store**

Add to imports:

```js
import { useGenusLokiStore } from '../stores'
```

Add store initialization:

```js
const genusLokiStore = useGenusLokiStore()
```

**Step 2: Add computed for unlocked bosses**

```js
const unlockedGenusLoki = computed(() => genusLokiStore.unlockedBosses)
const hasAnyGenusLoki = computed(() => unlockedGenusLoki.value.length > 0)
```

**Step 3: Add Genus Loki section to template**

After the party-preview section, add:

```html
<!-- Genus Loki Section -->
<section class="genus-loki-section">
  <div class="genus-loki-header">
    <span class="genus-loki-title">Genus Loki</span>
  </div>

  <div v-if="hasAnyGenusLoki" class="genus-loki-grid">
    <div
      v-for="boss in unlockedGenusLoki"
      :key="boss.id"
      class="genus-loki-card"
      @click="emit('navigate', 'genusLoki', boss.id)"
    >
      <div class="boss-icon">👹</div>
      <div class="boss-info">
        <span class="boss-name">{{ boss.name }}</span>
        <span class="boss-level">Highest: Lv.{{ boss.highestCleared }}</span>
      </div>
    </div>
  </div>

  <div v-else class="genus-loki-empty" @click="emit('navigate', 'worldmap')">
    <div class="empty-icon">🏰</div>
    <p class="empty-text">Powerful guardians await in the world.</p>
    <p class="empty-hint">Seek them out on your quest.</p>
  </div>
</section>
```

**Step 4: Add styles**

```css
/* ===== Genus Loki Section ===== */
.genus-loki-section {
  position: relative;
  z-index: 1;
}

.genus-loki-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.genus-loki-title {
  font-size: 0.85rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.genus-loki-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.genus-loki-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #2a1f3d 0%, #1f2937 100%);
  border: 1px solid #6b21a8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.genus-loki-card:hover {
  transform: translateX(4px);
  border-color: #9333ea;
  box-shadow: 0 0 12px rgba(147, 51, 234, 0.3);
}

.boss-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.2);
  border-radius: 8px;
}

.boss-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.boss-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f3f4f6;
}

.boss-level {
  font-size: 0.75rem;
  color: #9ca3af;
}

.genus-loki-empty {
  text-align: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px dashed #374151;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.genus-loki-empty:hover {
  border-color: #6b21a8;
  background: linear-gradient(135deg, #2a1f3d 0%, #0f172a 100%);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  opacity: 0.6;
}

.empty-text {
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0 0 4px 0;
}

.empty-hint {
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0;
}
```

**Step 5: Commit**

```bash
git add src/screens/HomeScreen.vue
git commit -m "feat: add Genus Loki panel to home screen"
```

---

## Task 6: Create Genus Loki Selection Screen

**Files:**
- Create: `src/screens/GenusLokiScreen.vue`
- Modify: `src/App.vue` (add route)
- Modify: `src/screens/index.js` (export)

**Step 1: Create GenusLokiScreen.vue**

```vue
<script setup>
import { ref, computed } from 'vue'
import { useGenusLokiStore, useInventoryStore } from '../stores'
import { getGenusLoki, getAllGenusLoki } from '../data/genusLoki.js'

const emit = defineEmits(['navigate', 'startGenusLokiBattle'])

const props = defineProps({
  selectedBossId: {
    type: String,
    default: null
  }
})

const genusLokiStore = useGenusLokiStore()
const inventoryStore = useInventoryStore()

const selectedBoss = computed(() => {
  if (props.selectedBossId) {
    return getGenusLoki(props.selectedBossId)
  }
  return null
})

const selectedLevel = ref(null)

const availableLevels = computed(() => {
  if (!selectedBoss.value) return []
  return genusLokiStore.getAvailableLevels(selectedBoss.value.id)
})

const highestCleared = computed(() => {
  if (!selectedBoss.value) return 0
  return genusLokiStore.getHighestCleared(selectedBoss.value.id)
})

const keyCount = computed(() => {
  if (!selectedBoss.value) return 0
  return inventoryStore.getItemCount(selectedBoss.value.keyItemId)
})

const canChallenge = computed(() => {
  return selectedLevel.value && keyCount.value > 0
})

function selectLevel(level) {
  selectedLevel.value = level
}

function startBattle() {
  if (!canChallenge.value) return
  emit('startGenusLokiBattle', {
    genusLokiId: selectedBoss.value.id,
    powerLevel: selectedLevel.value
  })
}

function calculateGoldReward(level) {
  if (!selectedBoss.value) return 0
  const { base, perLevel } = selectedBoss.value.currencyRewards
  return base.gold + perLevel.gold * (level - 1)
}

function goBack() {
  emit('navigate', 'home')
}
</script>

<template>
  <div class="genus-loki-screen">
    <header class="screen-header">
      <button class="back-btn" @click="goBack">← Back</button>
      <h1>Genus Loki</h1>
    </header>

    <div v-if="selectedBoss" class="boss-detail">
      <div class="boss-header">
        <div class="boss-icon">👹</div>
        <div class="boss-title">
          <h2>{{ selectedBoss.name }}</h2>
          <p class="boss-description">{{ selectedBoss.description }}</p>
        </div>
      </div>

      <div class="key-status">
        <span class="key-icon">🔑</span>
        <span class="key-count">{{ keyCount }}</span>
        <span class="key-label">Keys Available</span>
      </div>

      <div class="level-selection">
        <h3>Select Power Level</h3>
        <div class="level-grid">
          <button
            v-for="level in availableLevels"
            :key="level"
            :class="['level-btn', { selected: selectedLevel === level, cleared: level <= highestCleared }]"
            @click="selectLevel(level)"
          >
            <span class="level-number">{{ level }}</span>
            <span class="level-reward">🪙 {{ calculateGoldReward(level) }}</span>
          </button>
        </div>
        <div v-if="availableLevels.length < selectedBoss.maxPowerLevel" class="locked-hint">
          Defeat Lv.{{ availableLevels[availableLevels.length - 1] }} to unlock Lv.{{ availableLevels[availableLevels.length - 1] + 1 }}
        </div>
      </div>

      <button
        class="challenge-btn"
        :disabled="!canChallenge"
        @click="startBattle"
      >
        <span v-if="keyCount === 0">No Keys</span>
        <span v-else-if="!selectedLevel">Select Level</span>
        <span v-else>Challenge (🔑 x1)</span>
      </button>
    </div>

    <div v-else class="no-boss-selected">
      <p>Select a Genus Loki from the home screen.</p>
      <button class="back-btn-large" @click="goBack">Return Home</button>
    </div>
  </div>
</template>

<style scoped>
.genus-loki-screen {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #1a1025 0%, #0f172a 100%);
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.screen-header h1 {
  font-size: 1.5rem;
  color: #f3f4f6;
  margin: 0;
}

.back-btn {
  background: none;
  border: 1px solid #4b5563;
  color: #9ca3af;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: #6b7280;
  color: #f3f4f6;
}

.boss-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.boss-header {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #2a1f3d 0%, #1f2937 100%);
  border-radius: 16px;
  border: 1px solid #6b21a8;
}

.boss-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(147, 51, 234, 0.2);
  border-radius: 12px;
}

.boss-title h2 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  color: #f3f4f6;
}

.boss-description {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9rem;
}

.key-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #1f2937;
  border-radius: 8px;
}

.key-icon {
  font-size: 1.2rem;
}

.key-count {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fbbf24;
}

.key-label {
  color: #6b7280;
  font-size: 0.85rem;
}

.level-selection {
  background: #1f2937;
  border-radius: 12px;
  padding: 16px;
}

.level-selection h3 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.level-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #374151;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-btn:hover {
  background: #4b5563;
}

.level-btn.selected {
  border-color: #9333ea;
  background: rgba(147, 51, 234, 0.2);
}

.level-btn.cleared {
  background: rgba(34, 197, 94, 0.1);
}

.level-btn.cleared .level-number {
  color: #22c55e;
}

.level-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
}

.level-reward {
  font-size: 0.7rem;
  color: #f59e0b;
  margin-top: 4px;
}

.locked-hint {
  margin-top: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 0.8rem;
}

.challenge-btn {
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.challenge-btn:disabled {
  background: #374151;
  color: #6b7280;
  cursor: not-allowed;
}

.challenge-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
}

.no-boss-selected {
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
}

.back-btn-large {
  margin-top: 16px;
  padding: 12px 24px;
  background: #374151;
  border: none;
  border-radius: 8px;
  color: #f3f4f6;
  cursor: pointer;
}
</style>
```

**Step 2: Export from screens/index.js**

Add to `src/screens/index.js`:

```js
export { default as GenusLokiScreen } from './GenusLokiScreen.vue'
```

**Step 3: Add route to App.vue**

In App.vue, add to the screen switch/conditional and handle the `startGenusLokiBattle` event.

**Step 4: Commit**

```bash
git add src/screens/GenusLokiScreen.vue src/screens/index.js
git commit -m "feat: add Genus Loki selection screen"
```

---

## Task 7: Handle Genus Loki Node in World Map

**Files:**
- Modify: `src/components/NodeMarker.vue`
- Modify: `src/screens/WorldMapScreen.vue`

**Step 1: Update NodeMarker to handle genusLoki type**

Add conditional styling for `type === 'genusLoki'` nodes:
- Purple/special coloring
- Different icon (skull or tower)

**Step 2: Update WorldMapScreen node click handler**

When clicking a genusLoki node:
- Check if player has key item
- If first time (not unlocked), show confirmation and start level 1 battle
- If previously beaten, navigate to GenusLokiScreen for level selection

**Step 3: Commit**

```bash
git add src/components/NodeMarker.vue src/screens/WorldMapScreen.vue
git commit -m "feat: handle Genus Loki nodes on world map"
```

---

## Task 8: Implement Genus Loki Battle Logic

**Files:**
- Modify: `src/stores/battle.js`
- Create: `src/data/genusLokiAbilities.js`

**Step 1: Create ability definitions**

Create `src/data/genusLokiAbilities.js` with Valinar's 6 abilities:
- iron_guard: Self DEF buff + shield
- heavy_strike: High single-target damage
- shield_bash: Stun, damage scales with DEF buff
- towers_wrath: AoE at 50% HP
- counterattack_stance: Passive retaliate when DEF buffed
- judgment_of_ages: AoE + dispel party buffs

**Step 2: Add Genus Loki enemy generation**

Add function to generate boss stats at power level:
```js
function generateGenusLokiBoss(genusLokiId, powerLevel) {
  const boss = getGenusLoki(genusLokiId)
  // Calculate scaled stats
  // Filter abilities by unlocksAt <= powerLevel
  // Return enemy object compatible with battle store
}
```

**Step 3: Handle genusLoki battle type in initBattle**

Add support for `battleType: 'genusLoki'` with metadata `{ genusLokiId, powerLevel }`.

**Step 4: Commit**

```bash
git add src/stores/battle.js src/data/genusLokiAbilities.js
git commit -m "feat: implement Genus Loki battle generation"
```

---

## Task 9: Handle Genus Loki Victory/Defeat

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Detect genusLoki battle type**

Check for genusLoki battle context when handling victory.

**Step 2: On victory:**
- Consume key (already done before battle)
- Call `genusLokiStore.recordVictory()`
- Award gold based on power level
- Award first-clear gems if applicable
- Award unique drop item
- Show modified victory screen with Genus Loki rewards

**Step 3: On defeat:**
- Key already consumed, no additional penalty
- Return to world map or home

**Step 4: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "feat: handle Genus Loki victory and defeat"
```

---

## Task 10: Integrate App.vue Navigation

**Files:**
- Modify: `src/App.vue`

**Step 1: Add genusLoki screen to navigation**

Handle `navigate('genusLoki', bossId)` to show GenusLokiScreen with selectedBossId prop.

**Step 2: Handle startGenusLokiBattle event**

- Consume key item from inventory
- Set up battle context with genusLoki type
- Navigate to battle screen

**Step 3: Ensure genusLoki store is persisted**

Add to save/load state alongside other stores.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/App.vue
git commit -m "feat: integrate Genus Loki navigation in App"
```

---

## Task 11: Final Integration Testing

**Step 1: Manual testing checklist**

- [ ] Lake Tower Key appears in Whisper Lake drops
- [ ] Lake Tower node appears on Whisper Lake map
- [ ] Home screen shows Genus Loki panel (empty state)
- [ ] Clicking empty panel navigates to world map
- [ ] With key, can click Lake Tower node
- [ ] First attempt goes directly to level 1 battle
- [ ] After victory, boss appears in home screen panel
- [ ] Can select power levels on GenusLokiScreen
- [ ] Key consumed on battle start
- [ ] Victory awards correct gold and unique drop
- [ ] First clear awards 20 gems
- [ ] Progress persists across refresh

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Genus Loki system implementation"
```

---

## Summary

| Task | Description | Estimated Complexity |
|------|-------------|---------------------|
| 1 | Add key and unique drop items | Simple |
| 2 | Create Genus Loki data file | Simple |
| 3 | Create Genus Loki store | Medium |
| 4 | Add node to Whisper Lake | Simple |
| 5 | Add home screen panel | Medium |
| 6 | Create selection screen | Medium |
| 7 | Handle nodes on world map | Medium |
| 8 | Implement battle logic | Complex |
| 9 | Handle victory/defeat | Medium |
| 10 | Integrate App.vue navigation | Medium |
| 11 | Final integration testing | Simple |

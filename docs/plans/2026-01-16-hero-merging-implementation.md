# Hero Merging System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow players to merge duplicate heroes to increase star level, improving stat growth multipliers and making lower-rarity heroes stat-competitive with higher-rarity ones.

**Architecture:** Add `starLevel` to hero instances (separate from template `rarity`). Modify stat calculation to use star-based growth multipliers. Create merge logic in heroes store with gold cost. Add merge UI to hero detail panel and create dedicated merge screen.

**Tech Stack:** Vue 3, Pinia stores, existing component patterns

---

## Task 1: Add Star Level to Hero Data Model

**Files:**
- Modify: `src/stores/heroes.js:35-50` (createHeroInstance function)
- Modify: `src/stores/heroes.js:168-184` (calculateHeroStats function)

**Step 1: Update createHeroInstance to include starLevel**

In `src/stores/heroes.js`, find the `createHeroInstance` function and add `starLevel`:

```javascript
function createHeroInstance(templateId) {
  const template = heroTemplates.find(h => h.id === templateId)
  if (!template) return null

  return {
    instanceId: crypto.randomUUID(),
    templateId,
    level: 1,
    exp: 0,
    starLevel: template.rarity  // NEW: starts at base rarity
  }
}
```

**Step 2: Run the app to verify no errors**

Run: `npm run dev`
Expected: App loads without errors

**Step 3: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat(merge): add starLevel to hero instances"
```

---

## Task 2: Implement Star-Based Stat Growth Multipliers

**Files:**
- Modify: `src/stores/heroes.js:168-184` (calculateHeroStats function)

**Step 1: Define star growth multipliers**

Add this constant near the top of `src/stores/heroes.js` (after MAX_LEVEL):

```javascript
const MAX_LEVEL = 250

// Stat growth multiplier per star level (applied per level-up)
const STAR_GROWTH_MULTIPLIERS = {
  1: 1.00,
  2: 1.10,
  3: 1.20,
  4: 1.35,
  5: 1.50
}
```

**Step 2: Update calculateHeroStats to use star-based growth**

Replace the existing `calculateHeroStats` function:

```javascript
function calculateHeroStats(hero) {
  const template = heroTemplates.find(h => h.id === hero.templateId)
  if (!template) return null

  const starLevel = hero.starLevel || template.rarity
  const starMultiplier = STAR_GROWTH_MULTIPLIERS[starLevel] || 1
  const starBonus = starLevel - template.rarity  // +1 base stats per star gained

  // Base level multiplier: 5% per level
  const baseLevelGrowth = 0.05
  // Star level increases growth rate
  const levelMultiplier = 1 + (baseLevelGrowth * starMultiplier) * (hero.level - 1)

  return {
    hp: Math.floor((template.baseStats.hp + starBonus) * levelMultiplier),
    atk: Math.floor((template.baseStats.atk + starBonus) * levelMultiplier),
    def: Math.floor((template.baseStats.def + starBonus) * levelMultiplier),
    spd: Math.floor((template.baseStats.spd + starBonus) * levelMultiplier),
    mp: Math.floor((template.baseStats.mp + starBonus) * levelMultiplier)
  }
}
```

**Step 3: Run the app and verify stats display correctly**

Run: `npm run dev`
Expected: Heroes display stats, existing heroes work (fallback to template.rarity)

**Step 4: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat(merge): implement star-based stat growth multipliers"
```

---

## Task 3: Add Gold Currency to Player State

**Files:**
- Modify: `src/stores/gacha.js` (add gold alongside gems)

**Step 1: Check if gold already exists**

Open `src/stores/gacha.js` and search for `gold`. If it exists, skip to Task 4.

**Step 2: Add gold state**

In `src/stores/gacha.js`, add gold ref near gems:

```javascript
const gems = ref(1000)
const gold = ref(10000)  // NEW: starting gold
```

**Step 3: Add gold manipulation functions**

Add these functions in the store:

```javascript
function addGold(amount) {
  gold.value += amount
}

function spendGold(amount) {
  if (gold.value >= amount) {
    gold.value -= amount
    return true
  }
  return false
}
```

**Step 4: Update saveState and loadState**

In `saveState()`:
```javascript
function saveState() {
  return {
    gems: gems.value,
    gold: gold.value,  // NEW
    // ... rest of state
  }
}
```

In `loadState()`:
```javascript
function loadState(savedState) {
  if (savedState.gems !== undefined) gems.value = savedState.gems
  if (savedState.gold !== undefined) gold.value = savedState.gold  // NEW
  // ... rest of loading
}
```

**Step 5: Export gold in return statement**

```javascript
return {
  gems,
  gold,  // NEW
  addGems,
  spendGems,
  addGold,  // NEW
  spendGold,  // NEW
  // ... rest of exports
}
```

**Step 6: Commit**

```bash
git add src/stores/gacha.js
git commit -m "feat(merge): add gold currency to gacha store"
```

---

## Task 4: Implement Core Merge Logic

**Files:**
- Modify: `src/stores/heroes.js`

**Step 1: Add merge cost constant**

Near the top of `src/stores/heroes.js`:

```javascript
const MERGE_GOLD_COST_PER_STAR = 1000  // Cost = targetStar * this value
```

**Step 2: Add canMerge computed helper**

Add this function inside the store (before the return statement):

```javascript
function canMergeHero(instanceId) {
  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) return { canMerge: false, reason: 'Hero not found' }

  const starLevel = hero.starLevel || heroTemplates.find(h => h.id === hero.templateId)?.rarity || 1

  if (starLevel >= 5) {
    return { canMerge: false, reason: 'Already at max star level' }
  }

  // Find duplicates (same templateId, different instanceId)
  const duplicates = collection.value.filter(
    h => h.templateId === hero.templateId && h.instanceId !== instanceId
  )

  const copiesNeeded = starLevel
  if (duplicates.length < copiesNeeded) {
    return {
      canMerge: false,
      reason: `Need ${copiesNeeded} copies (have ${duplicates.length})`,
      copiesNeeded,
      copiesHave: duplicates.length
    }
  }

  const goldCost = (starLevel + 1) * MERGE_GOLD_COST_PER_STAR

  return {
    canMerge: true,
    copiesNeeded,
    copiesHave: duplicates.length,
    duplicates,
    goldCost,
    targetStarLevel: starLevel + 1
  }
}
```

**Step 3: Add getMergeCandidates function**

This returns the auto-selected lowest-level duplicates:

```javascript
function getMergeCandidates(instanceId, count) {
  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) return []

  // Get all duplicates sorted by level (ascending)
  const duplicates = collection.value
    .filter(h => h.templateId === hero.templateId && h.instanceId !== instanceId)
    .sort((a, b) => a.level - b.level)

  return duplicates.slice(0, count)
}
```

**Step 4: Add mergeHero function**

```javascript
function mergeHero(baseInstanceId, fodderInstanceIds) {
  const gachaStore = useGachaStore()

  const hero = collection.value.find(h => h.instanceId === baseInstanceId)
  if (!hero) return { success: false, error: 'Base hero not found' }

  const template = heroTemplates.find(h => h.id === hero.templateId)
  const currentStar = hero.starLevel || template?.rarity || 1

  if (currentStar >= 5) {
    return { success: false, error: 'Already at max star level' }
  }

  const copiesNeeded = currentStar
  if (fodderInstanceIds.length !== copiesNeeded) {
    return { success: false, error: `Need exactly ${copiesNeeded} copies` }
  }

  // Validate all fodder heroes exist and are same template
  const fodderHeroes = fodderInstanceIds.map(id =>
    collection.value.find(h => h.instanceId === id)
  )

  if (fodderHeroes.some(h => !h)) {
    return { success: false, error: 'One or more fodder heroes not found' }
  }

  if (fodderHeroes.some(h => h.templateId !== hero.templateId)) {
    return { success: false, error: 'All heroes must be the same type' }
  }

  // Check gold cost
  const goldCost = (currentStar + 1) * MERGE_GOLD_COST_PER_STAR
  if (gachaStore.gold < goldCost) {
    return { success: false, error: `Not enough gold (need ${goldCost})` }
  }

  // Find highest level among all heroes (base + fodder)
  const allHeroes = [hero, ...fodderHeroes]
  const highestLevel = Math.max(...allHeroes.map(h => h.level))
  const highestExp = allHeroes.find(h => h.level === highestLevel)?.exp || 0

  // Remove fodder from party if present
  fodderInstanceIds.forEach(id => {
    const slotIndex = party.value.indexOf(id)
    if (slotIndex !== -1) {
      party.value[slotIndex] = null
    }
    if (partyLeader.value === id) {
      partyLeader.value = null
    }
  })

  // Remove fodder heroes from collection
  collection.value = collection.value.filter(
    h => !fodderInstanceIds.includes(h.instanceId)
  )

  // Upgrade base hero
  hero.starLevel = currentStar + 1
  hero.level = highestLevel
  hero.exp = highestExp

  // Deduct gold
  gachaStore.spendGold(goldCost)

  return {
    success: true,
    newStarLevel: hero.starLevel,
    goldSpent: goldCost
  }
}
```

**Step 5: Export new functions**

Add to the return statement:

```javascript
return {
  // ... existing exports
  canMergeHero,
  getMergeCandidates,
  mergeHero,
  MERGE_GOLD_COST_PER_STAR
}
```

**Step 6: Add import for useGachaStore**

At the top of the file, ensure useGachaStore is imported:

```javascript
import { useGachaStore } from './gacha'
```

**Step 7: Run the app and verify no errors**

Run: `npm run dev`
Expected: App loads without errors

**Step 8: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat(merge): implement core merge logic with gold cost"
```

---

## Task 5: Update Persistence for Star Level

**Files:**
- Modify: `src/stores/heroes.js` (loadState function)

**Step 1: Ensure starLevel is preserved in saveState**

Check `saveState()` - it should already save the full collection array which includes starLevel.

**Step 2: Add migration for existing saves without starLevel**

In `loadState()`, add migration logic to ensure old saves get starLevel:

```javascript
function loadState(savedState) {
  if (savedState.collection) {
    collection.value = savedState.collection.map(hero => ({
      ...hero,
      // Migration: add starLevel if missing (defaults to template rarity)
      starLevel: hero.starLevel || heroTemplates.find(h => h.id === hero.templateId)?.rarity || 1
    }))
  }
  // ... rest of loadState
}
```

**Step 3: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat(merge): add save migration for starLevel"
```

---

## Task 6: Display Star Level in HeroCard

**Files:**
- Modify: `src/components/HeroCard.vue`

**Step 1: Find the rarity stars display**

Look for where rarity stars are rendered (likely using `hero.template.rarity` or similar).

**Step 2: Update to show starLevel instead of base rarity**

Find the star display section and update it to use starLevel:

```vue
<div class="rarity-stars">
  <span v-for="n in (hero.starLevel || hero.template.rarity)" :key="n">★</span>
</div>
```

**Step 3: Add base rarity indicator**

Add a small indicator showing the hero's origin rarity (e.g., a badge or text):

```vue
<div class="base-rarity" v-if="hero.starLevel > hero.template.rarity">
  {{ getRarityName(hero.template.rarity) }} origin
</div>
```

Add helper in script:

```javascript
const rarityNames = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary'
}

function getRarityName(rarity) {
  return rarityNames[rarity] || 'Unknown'
}
```

**Step 4: Style the base rarity indicator**

```css
.base-rarity {
  font-size: 0.65rem;
  opacity: 0.7;
  font-style: italic;
}
```

**Step 5: Verify display works**

Run: `npm run dev`
Expected: Heroes show star level, merged heroes show origin badge

**Step 6: Commit**

```bash
git add src/components/HeroCard.vue
git commit -m "feat(merge): display star level and origin rarity in HeroCard"
```

---

## Task 7: Add Merge Button to Hero Detail Panel

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Import heroes store merge functions**

Ensure these are available in the component:

```javascript
const heroesStore = useHeroesStore()
// Destructure: canMergeHero, getMergeCandidates, mergeHero
```

**Step 2: Add merge state refs**

```javascript
const showMergeModal = ref(false)
const mergeInfo = ref(null)
const selectedFodder = ref([])
```

**Step 3: Add merge button to detail panel**

Find the hero detail panel section and add a merge button:

```vue
<button
  v-if="selectedHero && canShowMergeButton"
  class="merge-btn"
  :disabled="!mergeInfo?.canMerge"
  @click="openMergeModal"
>
  {{ mergeInfo?.canMerge ? 'Merge' : mergeInfo?.reason }}
</button>
```

**Step 4: Add computed for merge button visibility**

```javascript
const canShowMergeButton = computed(() => {
  if (!selectedHero.value) return false
  const starLevel = selectedHero.value.starLevel || selectedHero.value.template.rarity
  return starLevel < 5
})

// Watch selectedHero to update mergeInfo
watch(selectedHero, (hero) => {
  if (hero) {
    mergeInfo.value = heroesStore.canMergeHero(hero.instanceId)
  } else {
    mergeInfo.value = null
  }
}, { immediate: true })
```

**Step 5: Add openMergeModal function**

```javascript
function openMergeModal() {
  if (!selectedHero.value || !mergeInfo.value?.canMerge) return

  const candidates = heroesStore.getMergeCandidates(
    selectedHero.value.instanceId,
    mergeInfo.value.copiesNeeded
  )
  selectedFodder.value = candidates.map(h => h.instanceId)
  showMergeModal.value = true
}
```

**Step 6: Style the merge button**

```css
.merge-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.merge-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
}
```

**Step 7: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(merge): add merge button to hero detail panel"
```

---

## Task 8: Create Merge Confirmation Modal

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Add merge modal template**

Add this modal template (near other modals or at end of template):

```vue
<div v-if="showMergeModal" class="modal-overlay" @click.self="closeMergeModal">
  <div class="merge-modal">
    <h3>Merge {{ selectedHero?.template.name }}</h3>

    <div class="merge-preview">
      <div class="merge-base">
        <span class="label">Base Hero</span>
        <div class="hero-preview">
          <span class="stars">{{ '★'.repeat(selectedHero?.starLevel || selectedHero?.template.rarity) }}</span>
          <span class="name">Lv.{{ selectedHero?.level }} {{ selectedHero?.template.name }}</span>
        </div>
      </div>

      <div class="merge-arrow">→</div>

      <div class="merge-result">
        <span class="label">Result</span>
        <div class="hero-preview result">
          <span class="stars">{{ '★'.repeat(mergeInfo?.targetStarLevel) }}</span>
          <span class="name">{{ selectedHero?.template.name }}</span>
        </div>
      </div>
    </div>

    <div class="fodder-section">
      <h4>Select {{ mergeInfo?.copiesNeeded }} copies to consume:</h4>
      <div class="fodder-grid">
        <div
          v-for="hero in availableFodder"
          :key="hero.instanceId"
          class="fodder-item"
          :class="{
            selected: selectedFodder.includes(hero.instanceId),
            'in-party': isInParty(hero.instanceId)
          }"
          @click="toggleFodder(hero.instanceId)"
        >
          <span class="level">Lv.{{ hero.level }}</span>
          <span v-if="isInParty(hero.instanceId)" class="party-warning">⚠️ In Party</span>
        </div>
      </div>
    </div>

    <div class="merge-cost">
      <span>Cost: {{ mergeInfo?.goldCost }} Gold</span>
      <span :class="{ insufficient: !hasEnoughGold }">
        (You have: {{ gachaStore.gold }})
      </span>
    </div>

    <div class="modal-actions">
      <button class="cancel-btn" @click="closeMergeModal">Cancel</button>
      <button
        class="confirm-btn"
        :disabled="!canConfirmMerge"
        @click="confirmMerge"
      >
        Merge
      </button>
    </div>
  </div>
</div>
```

**Step 2: Add supporting computed and methods**

```javascript
const gachaStore = useGachaStore()

const availableFodder = computed(() => {
  if (!selectedHero.value) return []
  return heroesStore.collection
    .filter(h =>
      h.templateId === selectedHero.value.templateId &&
      h.instanceId !== selectedHero.value.instanceId
    )
    .sort((a, b) => a.level - b.level)
})

const hasEnoughGold = computed(() => {
  return gachaStore.gold >= (mergeInfo.value?.goldCost || 0)
})

const canConfirmMerge = computed(() => {
  return selectedFodder.value.length === mergeInfo.value?.copiesNeeded && hasEnoughGold.value
})

function isInParty(instanceId) {
  return heroesStore.party.includes(instanceId)
}

function toggleFodder(instanceId) {
  const index = selectedFodder.value.indexOf(instanceId)
  if (index === -1) {
    if (selectedFodder.value.length < mergeInfo.value?.copiesNeeded) {
      selectedFodder.value.push(instanceId)
    }
  } else {
    selectedFodder.value.splice(index, 1)
  }
}

function closeMergeModal() {
  showMergeModal.value = false
  selectedFodder.value = []
}

function confirmMerge() {
  if (!canConfirmMerge.value) return

  // Show party warning if any fodder is in party
  const partyFodder = selectedFodder.value.filter(id => isInParty(id))
  if (partyFodder.length > 0) {
    if (!confirm('Some selected heroes are in your party and will be removed. Continue?')) {
      return
    }
  }

  const result = heroesStore.mergeHero(selectedHero.value.instanceId, selectedFodder.value)

  if (result.success) {
    closeMergeModal()
    // Refresh merge info
    mergeInfo.value = heroesStore.canMergeHero(selectedHero.value.instanceId)
  } else {
    alert(result.error)
  }
}
```

**Step 3: Add modal styles**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.merge-modal {
  background: #1f2937;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
}

.merge-modal h3 {
  margin: 0 0 1rem;
  color: #f59e0b;
}

.merge-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #111827;
  border-radius: 4px;
}

.merge-base, .merge-result {
  text-align: center;
}

.merge-arrow {
  font-size: 1.5rem;
  color: #f59e0b;
}

.hero-preview .stars {
  color: #f59e0b;
  display: block;
}

.hero-preview.result {
  color: #22c55e;
}

.fodder-section h4 {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.fodder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
}

.fodder-item {
  padding: 0.5rem;
  background: #374151;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
}

.fodder-item.selected {
  border-color: #f59e0b;
  background: #4b5563;
}

.fodder-item.in-party {
  background: #7c2d12;
}

.party-warning {
  display: block;
  font-size: 0.7rem;
  color: #fbbf24;
}

.merge-cost {
  margin: 1rem 0;
  text-align: center;
}

.merge-cost .insufficient {
  color: #ef4444;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: #4b5563;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.confirm-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
}
```

**Step 4: Verify modal works**

Run: `npm run dev`
Expected: Clicking merge opens modal, can select fodder, merge executes

**Step 5: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(merge): add merge confirmation modal with fodder selection"
```

---

## Task 9: Create Dedicated Merge Screen

**Files:**
- Create: `src/screens/MergeScreen.vue`
- Modify: `src/App.vue`

**Step 1: Create MergeScreen.vue**

Create `src/screens/MergeScreen.vue`:

```vue
<template>
  <div class="merge-screen">
    <header class="screen-header">
      <button class="back-btn" @click="emit('navigate', 'heroes')">← Back</button>
      <h2>Hero Fusion</h2>
      <div class="gold-display">{{ gachaStore.gold }} Gold</div>
    </header>

    <div class="hero-groups">
      <div
        v-for="group in heroGroups"
        :key="group.templateId"
        class="hero-group"
        :class="{ 'can-merge': group.canMerge }"
        @click="selectGroup(group)"
      >
        <div class="group-header">
          <span class="hero-name">{{ group.template.name }}</span>
          <span class="hero-stars">{{ '★'.repeat(group.highestStar) }}</span>
        </div>

        <div class="group-info">
          <span class="copy-count">{{ group.copies.length }} copies</span>
          <span v-if="group.canMerge" class="merge-ready">Ready to merge!</span>
          <span v-else class="merge-progress">
            {{ group.copiesHave }}/{{ group.copiesNeeded }} for next ★
          </span>
        </div>
      </div>

      <div v-if="heroGroups.length === 0" class="empty-state">
        No heroes to merge. Pull more duplicates!
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHeroesStore } from '../stores/heroes'
import { useGachaStore } from '../stores/gacha'
import heroTemplates from '../data/heroTemplates'

const emit = defineEmits(['navigate'])

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()

const heroGroups = computed(() => {
  // Group heroes by templateId
  const groups = {}

  heroesStore.collection.forEach(hero => {
    if (!groups[hero.templateId]) {
      groups[hero.templateId] = {
        templateId: hero.templateId,
        template: heroTemplates.find(t => t.id === hero.templateId),
        copies: []
      }
    }
    groups[hero.templateId].copies.push(hero)
  })

  // Calculate merge info for each group
  return Object.values(groups)
    .map(group => {
      // Sort copies by star level desc, then level desc
      group.copies.sort((a, b) => {
        const starA = a.starLevel || group.template.rarity
        const starB = b.starLevel || group.template.rarity
        if (starB !== starA) return starB - starA
        return b.level - a.level
      })

      const highestHero = group.copies[0]
      const highestStar = highestHero.starLevel || group.template.rarity
      const mergeInfo = heroesStore.canMergeHero(highestHero.instanceId)

      return {
        ...group,
        highestStar,
        highestHero,
        canMerge: mergeInfo.canMerge,
        copiesNeeded: mergeInfo.copiesNeeded || highestStar,
        copiesHave: group.copies.length - 1  // Exclude the base
      }
    })
    .filter(g => g.highestStar < 5)  // Hide maxed heroes
    .sort((a, b) => {
      // Sort: mergeable first, then by star level desc
      if (a.canMerge !== b.canMerge) return a.canMerge ? -1 : 1
      return b.highestStar - a.highestStar
    })
})

function selectGroup(group) {
  // Navigate to heroes screen with this hero selected
  // For now, just navigate back - full implementation would pass selection
  emit('navigate', 'heroes')
}
</script>

<style scoped>
.merge-screen {
  min-height: 100vh;
  background: #111827;
  color: white;
}

.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #1f2937;
  border-bottom: 1px solid #374151;
}

.back-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1rem;
}

.gold-display {
  color: #f59e0b;
  font-weight: bold;
}

.hero-groups {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hero-group {
  background: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #4b5563;
  cursor: pointer;
  transition: transform 0.1s;
}

.hero-group:active {
  transform: scale(0.98);
}

.hero-group.can-merge {
  border-left-color: #f59e0b;
  background: linear-gradient(90deg, #302a1f, #1f2937);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.hero-name {
  font-weight: bold;
}

.hero-stars {
  color: #f59e0b;
}

.group-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #9ca3af;
}

.merge-ready {
  color: #22c55e;
  font-weight: bold;
}

.merge-progress {
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
</style>
```

**Step 2: Add MergeScreen to App.vue**

In `src/App.vue`, import the screen:

```javascript
import MergeScreen from './screens/MergeScreen.vue'
```

Add the route in the template:

```vue
<MergeScreen
  v-else-if="currentScreen === 'merge'"
  @navigate="navigate"
/>
```

**Step 3: Add navigation to merge screen**

In `src/screens/HeroesScreen.vue`, add a button to access the merge screen:

```vue
<button class="merge-screen-btn" @click="emit('navigate', 'merge')">
  Hero Fusion
</button>
```

Style it:

```css
.merge-screen-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
```

**Step 4: Verify navigation works**

Run: `npm run dev`
Expected: Can navigate to merge screen and back

**Step 5: Commit**

```bash
git add src/screens/MergeScreen.vue src/App.vue src/screens/HeroesScreen.vue
git commit -m "feat(merge): add dedicated merge screen with grouped hero view"
```

---

## Task 10: Display Gold in UI

**Files:**
- Modify: `src/screens/HomeScreen.vue` or appropriate header component

**Step 1: Find where gems are displayed**

Search for where gems are shown in the UI (likely HomeScreen or a header).

**Step 2: Add gold display next to gems**

```vue
<div class="currency-display">
  <span class="gems">💎 {{ gachaStore.gems }}</span>
  <span class="gold">🪙 {{ gachaStore.gold }}</span>
</div>
```

**Step 3: Style gold display**

```css
.gold {
  color: #f59e0b;
}
```

**Step 4: Verify gold appears**

Run: `npm run dev`
Expected: Gold shows in currency display

**Step 5: Commit**

```bash
git add .
git commit -m "feat(merge): display gold currency in UI"
```

---

## Task 11: Add Gold Rewards to Battles

**Files:**
- Modify: `src/stores/battle.js` or quest rewards handling

**Step 1: Find where battle rewards are given**

Search for where exp/gems are rewarded after battles.

**Step 2: Add gold to battle rewards**

In quest node data or battle reward logic, add gold rewards:

```javascript
// Example: Add gold reward proportional to node difficulty
const goldReward = battleDifficulty * 100
gachaStore.addGold(goldReward)
```

**Step 3: Show gold in victory screen**

Update the victory/reward display to include gold earned.

**Step 4: Verify gold is earned**

Run: `npm run dev`
Expected: Winning battles awards gold

**Step 5: Commit**

```bash
git add .
git commit -m "feat(merge): add gold rewards to battle victories"
```

---

## Task 12: Final Testing & Polish

**Step 1: Test full merge flow**

1. Start fresh or with existing save
2. Pull duplicate heroes
3. Navigate to hero detail, verify merge button state
4. Execute merge, verify:
   - Star level increases
   - Stats recalculate correctly
   - Gold is deducted
   - Fodder heroes are removed
   - Party members are handled correctly

**Step 2: Test edge cases**

- Try merging with insufficient gold
- Try merging hero already at 5-star
- Try merging with party member as fodder
- Verify save/load preserves star levels

**Step 3: Test merge screen**

- Verify grouping is correct
- Verify progress indicators are accurate
- Verify navigation works

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(merge): complete hero merging system implementation"
```

---

## Summary

This implementation adds:

1. **Data model**: `starLevel` on hero instances, star-based growth multipliers
2. **Core logic**: `canMergeHero`, `getMergeCandidates`, `mergeHero` in heroes store
3. **Gold economy**: New currency with merge costs
4. **UI**: Merge button in detail panel, confirmation modal, dedicated merge screen
5. **Persistence**: Migration for existing saves

The system allows players to merge duplicate heroes to increase their star level, with retroactive stat recalculation and gold costs that scale with progression.

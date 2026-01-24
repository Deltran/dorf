# Merge Component Heroes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Build Copies" feature that lets players bulk-merge lower-star heroes to build up fodder for higher-tier merges.

**Architecture:** New MergePlannerModal component, helper functions in heroes store, "Build Copies" buttons added to HeroesScreen and MergeScreen. Uses existing mergeHero() function internally.

**Tech Stack:** Vue 3 Composition API, Pinia stores, existing modal/button patterns

**Design Doc:** `docs/plans/2026-01-24-merge-component-heroes-design.md`

---

### Task 1: Add Helper Functions to Heroes Store

**Files:**
- Modify: `src/stores/heroes.js`

**Step 1: Add getLowerTierCopies function**

Add after the `getMergeCandidates` function (around line 403):

```javascript
function getLowerTierCopies(templateId, belowStarLevel) {
  // Get all copies of this template with star level below the specified level
  // Excludes heroes in party or on expedition
  return collection.value.filter(h => {
    if (h.templateId !== templateId) return false
    const heroStar = getHeroStarLevel(h)
    if (heroStar >= belowStarLevel) return false
    // Exclude heroes in party
    if (party.value.includes(h.instanceId)) return false
    // Exclude heroes on expedition
    if (h.explorationNodeId) return false
    return true
  })
}

function hasLowerTierCopies(templateId, belowStarLevel) {
  return getLowerTierCopies(templateId, belowStarLevel).length > 0
}
```

**Step 2: Add bulk merge execution function**

Add after the helper functions:

```javascript
function executeBulkMerge(templateId, mergeConfig) {
  // mergeConfig = { tier1: 5, tier2: 3, tier3: 0, tier4: 0 }
  // tier1 = number of 1*->2* merges, tier2 = 2*->3* merges, etc.
  const gachaStore = useGachaStore()
  const inventoryStore = useInventoryStore()

  const results = {
    success: true,
    mergesCompleted: { tier1: 0, tier2: 0, tier3: 0, tier4: 0 },
    totalGoldSpent: 0,
    errors: []
  }

  // Calculate total costs upfront
  const totalGold =
    (mergeConfig.tier1 || 0) * 2000 +  // 1*->2* costs 2000
    (mergeConfig.tier2 || 0) * 3000 +  // 2*->3* costs 3000
    (mergeConfig.tier3 || 0) * 4000 +  // 3*->4* costs 4000
    (mergeConfig.tier4 || 0) * 5000    // 4*->5* costs 5000

  // Check gold
  if (gachaStore.gold < totalGold) {
    return { success: false, error: `Not enough gold (need ${totalGold}, have ${gachaStore.gold})` }
  }

  // Check materials for tier3 (3*->4*) merges
  const tier3Materials = mergeConfig.tier3 || 0
  if (tier3Materials > 0) {
    const shardCount = inventoryStore.getItemCount('shard_dragon_heart')
    if (shardCount < tier3Materials) {
      return { success: false, error: `Not enough Dragon Heart Shards (need ${tier3Materials}, have ${shardCount})` }
    }
  }

  // Check materials for tier4 (4*->5*) merges
  const tier4Materials = mergeConfig.tier4 || 0
  if (tier4Materials > 0) {
    const heartCount = inventoryStore.getItemCount('dragon_heart')
    if (heartCount < tier4Materials) {
      return { success: false, error: `Not enough Dragon Hearts (need ${tier4Materials}, have ${heartCount})` }
    }
  }

  // Execute merges bottom-up (1*->2* first, then 2*->3*, etc.)
  const tiers = [
    { key: 'tier1', fromStar: 1, toStar: 2, copiesNeeded: 1 },
    { key: 'tier2', fromStar: 2, toStar: 3, copiesNeeded: 2 },
    { key: 'tier3', fromStar: 3, toStar: 4, copiesNeeded: 3 },
    { key: 'tier4', fromStar: 4, toStar: 5, copiesNeeded: 4 }
  ]

  for (const tier of tiers) {
    const mergeCount = mergeConfig[tier.key] || 0
    if (mergeCount === 0) continue

    for (let i = 0; i < mergeCount; i++) {
      // Get available copies at this star level (fresh each iteration)
      const available = collection.value.filter(h =>
        h.templateId === templateId &&
        getHeroStarLevel(h) === tier.fromStar &&
        !party.value.includes(h.instanceId) &&
        !h.explorationNodeId
      ).sort((a, b) => a.level - b.level) // Lowest level first

      if (available.length < tier.copiesNeeded + 1) {
        results.errors.push(`Not enough ${tier.fromStar}-star copies for merge ${i + 1}`)
        results.success = false
        break
      }

      // Pick base (first one) and fodder (next N)
      const baseHero = available[0]
      const fodder = available.slice(1, 1 + tier.copiesNeeded)

      const mergeResult = mergeHero(baseHero.instanceId, fodder.map(h => h.instanceId))

      if (!mergeResult.success) {
        results.errors.push(`Tier ${tier.fromStar}->${tier.toStar} merge ${i + 1}: ${mergeResult.error}`)
        results.success = false
        break
      }

      results.mergesCompleted[tier.key]++
      results.totalGoldSpent += (tier.toStar) * MERGE_GOLD_COST_PER_STAR
    }

    if (!results.success) break
  }

  return results
}
```

**Step 3: Export the new functions**

Find the return statement of the store and add the exports:

```javascript
return {
  // ... existing exports ...
  getLowerTierCopies,
  hasLowerTierCopies,
  executeBulkMerge
}
```

**Step 4: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat(heroes): add bulk merge helper functions"
```

---

### Task 2: Create MergePlannerModal Component

**Files:**
- Create: `src/components/MergePlannerModal.vue`

**Step 1: Create the component file**

```vue
<script setup>
import { ref, computed, watch } from 'vue'
import { useHeroesStore, useGachaStore, useInventoryStore } from '../stores'
import { getHeroTemplate } from '../data/heroTemplates.js'
import StarRating from './StarRating.vue'

const props = defineProps({
  show: Boolean,
  heroInstanceId: String
})

const emit = defineEmits(['close', 'complete'])

const heroesStore = useHeroesStore()
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

// Merge counts per tier
const tier1Count = ref(0)
const tier2Count = ref(0)
const tier3Count = ref(0)
const tier4Count = ref(0)

// Reset counts when hero changes
watch(() => props.heroInstanceId, () => {
  tier1Count.value = 0
  tier2Count.value = 0
  tier3Count.value = 0
  tier4Count.value = 0
})

const targetHero = computed(() => {
  if (!props.heroInstanceId) return null
  return heroesStore.getHeroFull(props.heroInstanceId)
})

const targetStarLevel = computed(() => {
  if (!targetHero.value) return 1
  return targetHero.value.starLevel || targetHero.value.template.rarity
})

const templateId = computed(() => targetHero.value?.template?.id)

// Get existing copies at each star level (excluding target, party, expedition)
const existingCopies = computed(() => {
  if (!templateId.value) return { tier1: 0, tier2: 0, tier3: 0, tier4: 0 }

  const copies = heroesStore.collection.filter(h =>
    h.templateId === templateId.value &&
    h.instanceId !== props.heroInstanceId &&
    !heroesStore.party.includes(h.instanceId) &&
    !h.explorationNodeId
  )

  return {
    tier1: copies.filter(h => heroesStore.getHeroStarLevel(h) === 1).length,
    tier2: copies.filter(h => heroesStore.getHeroStarLevel(h) === 2).length,
    tier3: copies.filter(h => heroesStore.getHeroStarLevel(h) === 3).length,
    tier4: copies.filter(h => heroesStore.getHeroStarLevel(h) === 4).length
  }
})

// Calculate available copies at each tier (existing + created from below)
const availableCopies = computed(() => {
  const result = { tier1: existingCopies.value.tier1, tier2: 0, tier3: 0, tier4: 0 }

  // Tier 1: just existing 1* copies
  // After tier1 merges, remaining 1* = existing - (tier1Count * 2) since each merge needs 2 (1 base + 1 fodder)
  const tier1Remaining = existingCopies.value.tier1 - (tier1Count.value * 2)

  // Tier 2: existing 2* + created from tier1 merges
  result.tier2 = existingCopies.value.tier2 + tier1Count.value
  const tier2Used = tier2Count.value * 3 // Each 2*->3* needs 3 copies (1 base + 2 fodder)
  const tier2Remaining = result.tier2 - tier2Used

  // Tier 3: existing 3* + created from tier2 merges
  result.tier3 = existingCopies.value.tier3 + tier2Count.value
  const tier3Used = tier3Count.value * 4 // Each 3*->4* needs 4 copies (1 base + 3 fodder)
  const tier3Remaining = result.tier3 - tier3Used

  // Tier 4: existing 4* + created from tier3 merges
  result.tier4 = existingCopies.value.tier4 + tier3Count.value

  return result
})

// Max merges possible at each tier
const maxMerges = computed(() => {
  return {
    // 1*->2* needs 2 copies (1 base + 1 fodder)
    tier1: Math.floor(existingCopies.value.tier1 / 2),
    // 2*->3* needs 3 copies (1 base + 2 fodder)
    tier2: Math.floor(availableCopies.value.tier2 / 3),
    // 3*->4* needs 4 copies (1 base + 3 fodder)
    tier3: Math.floor(availableCopies.value.tier3 / 4),
    // 4*->5* needs 5 copies (1 base + 4 fodder)
    tier4: Math.floor(availableCopies.value.tier4 / 5)
  }
})

// Copies created at each tier
const copiesCreated = computed(() => ({
  tier1: tier1Count.value,      // 1*->2* creates one 2* per merge
  tier2: tier2Count.value,      // 2*->3* creates one 3* per merge
  tier3: tier3Count.value,      // 3*->4* creates one 4* per merge
  tier4: tier4Count.value       // 4*->5* creates one 5* per merge
}))

// Total gold cost
const totalGoldCost = computed(() => {
  return (tier1Count.value * 2000) +
         (tier2Count.value * 3000) +
         (tier3Count.value * 4000) +
         (tier4Count.value * 5000)
})

// Material requirements
const materialsNeeded = computed(() => ({
  shards: tier3Count.value,
  hearts: tier4Count.value
}))

const materialsAvailable = computed(() => ({
  shards: inventoryStore.getItemCount('shard_dragon_heart'),
  hearts: inventoryStore.getItemCount('dragon_heart')
}))

// Validation
const canConfirm = computed(() => {
  const totalMerges = tier1Count.value + tier2Count.value + tier3Count.value + tier4Count.value
  if (totalMerges === 0) return false
  if (gachaStore.gold < totalGoldCost.value) return false
  if (materialsNeeded.value.shards > materialsAvailable.value.shards) return false
  if (materialsNeeded.value.hearts > materialsAvailable.value.hearts) return false
  return true
})

const validationMessage = computed(() => {
  const totalMerges = tier1Count.value + tier2Count.value + tier3Count.value + tier4Count.value
  if (totalMerges === 0) return 'Select merges to perform'
  if (gachaStore.gold < totalGoldCost.value) return `Need ${totalGoldCost.value - gachaStore.gold} more gold`
  if (materialsNeeded.value.shards > materialsAvailable.value.shards) return 'Not enough Dragon Heart Shards'
  if (materialsNeeded.value.hearts > materialsAvailable.value.hearts) return 'Not enough Dragon Hearts'
  return ''
})

// Which tiers to show (only tiers below target star level)
const visibleTiers = computed(() => {
  const tiers = []
  if (targetStarLevel.value > 1 && existingCopies.value.tier1 > 0) {
    tiers.push({ key: 'tier1', fromStar: 1, toStar: 2, copiesNeeded: 1 })
  }
  if (targetStarLevel.value > 2 && (existingCopies.value.tier2 > 0 || tier1Count.value > 0)) {
    tiers.push({ key: 'tier2', fromStar: 2, toStar: 3, copiesNeeded: 2 })
  }
  if (targetStarLevel.value > 3 && (existingCopies.value.tier3 > 0 || tier2Count.value > 0)) {
    tiers.push({ key: 'tier3', fromStar: 3, toStar: 4, copiesNeeded: 3 })
  }
  if (targetStarLevel.value > 4 && (existingCopies.value.tier4 > 0 || tier3Count.value > 0)) {
    tiers.push({ key: 'tier4', fromStar: 4, toStar: 5, copiesNeeded: 4 })
  }
  return tiers
})

// Increment/decrement handlers
function increment(tier) {
  const max = maxMerges.value[tier]
  if (tier === 'tier1' && tier1Count.value < max) tier1Count.value++
  else if (tier === 'tier2' && tier2Count.value < max) tier2Count.value++
  else if (tier === 'tier3' && tier3Count.value < max) tier3Count.value++
  else if (tier === 'tier4' && tier4Count.value < max) tier4Count.value++
}

function decrement(tier) {
  if (tier === 'tier1' && tier1Count.value > 0) tier1Count.value--
  else if (tier === 'tier2' && tier2Count.value > 0) tier2Count.value--
  else if (tier === 'tier3' && tier3Count.value > 0) tier3Count.value--
  else if (tier === 'tier4' && tier4Count.value > 0) tier4Count.value--
}

function getCount(tier) {
  if (tier === 'tier1') return tier1Count.value
  if (tier === 'tier2') return tier2Count.value
  if (tier === 'tier3') return tier3Count.value
  if (tier === 'tier4') return tier4Count.value
  return 0
}

// Execute merges
const isExecuting = ref(false)

async function confirmMerges() {
  if (!canConfirm.value || isExecuting.value) return

  isExecuting.value = true

  const config = {
    tier1: tier1Count.value,
    tier2: tier2Count.value,
    tier3: tier3Count.value,
    tier4: tier4Count.value
  }

  const result = heroesStore.executeBulkMerge(templateId.value, config)

  isExecuting.value = false

  if (result.success) {
    const totalCreated =
      result.mergesCompleted.tier1 +
      result.mergesCompleted.tier2 +
      result.mergesCompleted.tier3 +
      result.mergesCompleted.tier4

    emit('complete', {
      success: true,
      totalCreated,
      details: result.mergesCompleted
    })
  } else {
    emit('complete', {
      success: false,
      error: result.error || result.errors?.join(', ')
    })
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click="close"></div>
    <div v-if="show" class="merge-planner-modal">
      <div class="modal-header">
        <h3>Build Copies</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body" v-if="targetHero">
        <div class="target-info">
          <span class="target-label">Building for:</span>
          <StarRating :rating="targetStarLevel" />
          <span class="target-name">{{ targetHero.template.name }}</span>
        </div>

        <div class="tier-sections">
          <div
            v-for="tier in visibleTiers"
            :key="tier.key"
            class="tier-section"
          >
            <div class="tier-header">
              <span class="tier-label">
                {{ '★'.repeat(tier.fromStar) }} → {{ '★'.repeat(tier.toStar) }}
              </span>
              <span class="copies-needed">({{ tier.copiesNeeded + 1 }} copies each)</span>
            </div>

            <div class="tier-info">
              <span class="available">
                Available: {{ existingCopies[tier.key] }}×
                <template v-if="tier.key !== 'tier1' && copiesCreated[`tier${tier.fromStar - 1}`] > 0">
                  (+{{ copiesCreated[`tier${tier.fromStar - 1}`] }} from above)
                </template>
              </span>
            </div>

            <div class="tier-controls">
              <button
                class="control-btn minus"
                @click="decrement(tier.key)"
                :disabled="getCount(tier.key) === 0"
              >－</button>
              <span class="count">{{ getCount(tier.key) }}</span>
              <button
                class="control-btn plus"
                @click="increment(tier.key)"
                :disabled="getCount(tier.key) >= maxMerges[tier.key]"
              >＋</button>
              <span class="creates">→ Creates {{ getCount(tier.key) }}× {{ '★'.repeat(tier.toStar) }}</span>
            </div>
          </div>

          <div v-if="visibleTiers.length === 0" class="no-tiers">
            No lower-star copies available to merge.
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="cost-summary">
          <div class="cost-row">
            <span class="cost-icon">🪙</span>
            <span class="cost-label">Total Cost:</span>
            <span class="cost-value" :class="{ insufficient: gachaStore.gold < totalGoldCost }">
              {{ totalGoldCost.toLocaleString() }}
            </span>
            <span class="cost-have">(have {{ gachaStore.gold.toLocaleString() }})</span>
          </div>

          <div v-if="materialsNeeded.shards > 0" class="cost-row">
            <span class="cost-icon">💎</span>
            <span class="cost-label">Dragon Heart Shards:</span>
            <span class="cost-value" :class="{ insufficient: materialsNeeded.shards > materialsAvailable.shards }">
              {{ materialsNeeded.shards }}
            </span>
            <span class="cost-have">(have {{ materialsAvailable.shards }})</span>
          </div>

          <div v-if="materialsNeeded.hearts > 0" class="cost-row">
            <span class="cost-icon">❤️</span>
            <span class="cost-label">Dragon Hearts:</span>
            <span class="cost-value" :class="{ insufficient: materialsNeeded.hearts > materialsAvailable.hearts }">
              {{ materialsNeeded.hearts }}
            </span>
            <span class="cost-have">(have {{ materialsAvailable.hearts }})</span>
          </div>
        </div>

        <div v-if="validationMessage" class="validation-message">
          {{ validationMessage }}
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="close">Cancel</button>
          <button
            class="confirm-btn"
            :disabled="!canConfirm || isExecuting"
            @click="confirmMerges"
          >
            {{ isExecuting ? 'Merging...' : 'Confirm Merges' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 200;
}

.merge-planner-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 420px;
  max-height: 85vh;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  overflow: hidden;
  z-index: 201;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #374151;
  background: rgba(55, 65, 81, 0.3);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f59e0b;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.close-btn:hover {
  color: #f3f4f6;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.target-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
}

.target-label {
  color: #9ca3af;
  font-size: 0.85rem;
}

.target-name {
  color: #f3f4f6;
  font-weight: 600;
}

.tier-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tier-section {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 10px;
  padding: 14px;
  border-left: 3px solid #60a5fa;
}

.tier-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tier-label {
  font-weight: 600;
  color: #f59e0b;
  font-size: 0.95rem;
}

.copies-needed {
  color: #6b7280;
  font-size: 0.8rem;
}

.tier-info {
  margin-bottom: 10px;
}

.available {
  color: #9ca3af;
  font-size: 0.85rem;
}

.tier-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #4b5563;
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.count {
  min-width: 32px;
  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #f3f4f6;
}

.creates {
  color: #22c55e;
  font-size: 0.85rem;
  margin-left: auto;
}

.no-tiers {
  text-align: center;
  padding: 24px;
  color: #6b7280;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #374151;
  background: rgba(0, 0, 0, 0.2);
}

.cost-summary {
  margin-bottom: 12px;
}

.cost-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 0.9rem;
}

.cost-icon {
  font-size: 1rem;
}

.cost-label {
  color: #9ca3af;
}

.cost-value {
  font-weight: 600;
  color: #f3f4f6;
}

.cost-value.insufficient {
  color: #ef4444;
}

.cost-have {
  color: #6b7280;
  font-size: 0.8rem;
}

.validation-message {
  color: #fbbf24;
  font-size: 0.85rem;
  text-align: center;
  padding: 8px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 6px;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 10px 20px;
  background: #4b5563;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #6b7280;
}

.confirm-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.confirm-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
}
</style>
```

**Step 2: Commit**

```bash
git add src/components/MergePlannerModal.vue
git commit -m "feat: add MergePlannerModal component"
```

---

### Task 3: Add getHeroStarLevel Export to Heroes Store

**Files:**
- Modify: `src/stores/heroes.js`

**Step 1: Ensure getHeroStarLevel is exported**

The `getHeroStarLevel` function already exists but may not be exported. Find the return statement and add it to exports:

```javascript
return {
  // ... existing exports ...
  getHeroStarLevel,
  getLowerTierCopies,
  hasLowerTierCopies,
  executeBulkMerge
}
```

**Step 2: Commit**

```bash
git add src/stores/heroes.js
git commit -m "feat(heroes): export getHeroStarLevel function"
```

---

### Task 4: Add Build Copies Button to HeroesScreen

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Import the MergePlannerModal**

Add to imports at the top of the script section:

```javascript
import MergePlannerModal from '../components/MergePlannerModal.vue'
```

**Step 2: Add state for the modal**

Add after existing refs:

```javascript
// Build Copies modal state
const showBuildCopiesModal = ref(false)
const buildCopiesHeroId = ref(null)
```

**Step 3: Add computed for showing the Build Copies button**

Add after existing computed properties:

```javascript
// Can show Build Copies button (hero is below 5* and has lower-tier copies)
const canShowBuildCopies = computed(() => {
  if (!selectedHero.value) return false
  const starLevel = selectedHero.value.starLevel || selectedHero.value.template.rarity
  if (starLevel >= 5) return false
  return heroesStore.hasLowerTierCopies(selectedHero.value.template.id, starLevel)
})
```

**Step 4: Add handler functions**

Add after existing functions:

```javascript
function openBuildCopies() {
  if (!selectedHero.value) return
  buildCopiesHeroId.value = selectedHero.value.instanceId
  showBuildCopiesModal.value = true
}

function closeBuildCopies() {
  showBuildCopiesModal.value = false
  buildCopiesHeroId.value = null
}

function onBuildCopiesComplete(result) {
  closeBuildCopies()
  if (result.success) {
    // Refresh selected hero data
    if (selectedHero.value) {
      selectedHero.value = heroesStore.getHeroFull(selectedHero.value.instanceId)
      mergeInfo.value = heroesStore.canMergeHero(selectedHero.value.instanceId)
    }
    // Could add a toast notification here
  }
}
```

**Step 5: Add the button to the template**

Find the merge section in the template (around the merge-btn) and add the Build Copies button after it:

```html
<!-- Build Copies Button -->
<div v-if="canShowBuildCopies" class="build-copies-section">
  <button
    class="build-copies-btn"
    :disabled="!!selectedHeroExplorationInfo"
    @click="openBuildCopies"
  >
    <span class="btn-icon">🔨</span>
    <span>Build Copies</span>
  </button>
</div>
```

**Step 6: Add the modal to the template**

Add before the closing `</template>` tag:

```html
<!-- Build Copies Modal -->
<MergePlannerModal
  :show="showBuildCopiesModal"
  :heroInstanceId="buildCopiesHeroId"
  @close="closeBuildCopies"
  @complete="onBuildCopiesComplete"
/>
```

**Step 7: Add styles**

Add to the style section:

```css
/* ===== Build Copies Section ===== */
.build-copies-section {
  margin-top: 12px;
}

.build-copies-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.build-copies-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.build-copies-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.build-copies-btn .btn-icon {
  font-size: 1.1rem;
}
```

**Step 8: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "feat(heroes): add Build Copies button to hero detail panel"
```

---

### Task 5: Add Build Copies Button to MergeScreen

**Files:**
- Modify: `src/screens/MergeScreen.vue`

**Step 1: Import the MergePlannerModal**

Add to imports:

```javascript
import MergePlannerModal from '../components/MergePlannerModal.vue'
```

**Step 2: Add state for the modal**

Add after existing refs/computed:

```javascript
// Build Copies modal state
const showBuildCopiesModal = ref(false)
const buildCopiesHeroId = ref(null)
```

**Step 3: Add helper functions**

```javascript
function canBuildCopies(group) {
  if (group.highestStar >= 5) return false
  return heroesStore.hasLowerTierCopies(group.templateId, group.highestStar)
}

function openBuildCopies(group, event) {
  event.stopPropagation() // Don't trigger selectGroup
  buildCopiesHeroId.value = group.highestHero.instanceId
  showBuildCopiesModal.value = true
}

function closeBuildCopies() {
  showBuildCopiesModal.value = false
  buildCopiesHeroId.value = null
}

function onBuildCopiesComplete(result) {
  closeBuildCopies()
  // heroGroups will auto-update since it's computed from the store
}
```

**Step 4: Add the button to hero groups in template**

Inside the hero-group div, after the existing content, add:

```html
<button
  v-if="canBuildCopies(group)"
  class="build-copies-btn-small"
  @click="openBuildCopies(group, $event)"
  title="Build lower-star copies"
>
  🔨
</button>
```

**Step 5: Add the modal to template**

Add before closing `</template>`:

```html
<MergePlannerModal
  :show="showBuildCopiesModal"
  :heroInstanceId="buildCopiesHeroId"
  @close="closeBuildCopies"
  @complete="onBuildCopiesComplete"
/>
```

**Step 6: Add ref import**

Update the import to include ref:

```javascript
import { ref, computed } from 'vue'
```

**Step 7: Add styles**

```css
.build-copies-btn-small {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: rgba(59, 130, 246, 0.2);
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
}

.build-copies-btn-small:hover {
  background: rgba(59, 130, 246, 0.4);
  border-color: #3b82f6;
  transform: scale(1.1);
}
```

**Step 8: Ensure hero-group has position relative**

Find `.hero-group` style and ensure it has `position: relative;`

**Step 9: Commit**

```bash
git add src/screens/MergeScreen.vue
git commit -m "feat(merge): add Build Copies button to fusion screen"
```

---

### Task 6: Test and Final Polish

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Manual testing checklist**

- [ ] Open HeroesScreen, select a hero with lower-star copies → "Build Copies" button appears
- [ ] Click "Build Copies" → Modal opens with correct tiers
- [ ] Adjust tier counts with +/- buttons → Available counts update correctly
- [ ] Check gold/material validation → Button disabled when insufficient
- [ ] Confirm merges → Merges execute, modal closes, hero data refreshes
- [ ] Open MergeScreen → "🔨" button appears on groups with lower-star copies
- [ ] Click "🔨" → Same modal opens and works correctly

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Build Copies feature

- Add bulk merge planner modal for chaining lower-star merges
- Add Build Copies button to HeroesScreen hero detail panel
- Add Build Copies button to MergeScreen hero groups
- Add helper functions to heroes store"
```

---

## Summary

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add helper functions to heroes store | `feat(heroes): add bulk merge helper functions` |
| 2 | Create MergePlannerModal component | `feat: add MergePlannerModal component` |
| 3 | Export getHeroStarLevel | `feat(heroes): export getHeroStarLevel function` |
| 4 | Add to HeroesScreen | `feat(heroes): add Build Copies button to hero detail panel` |
| 5 | Add to MergeScreen | `feat(merge): add Build Copies button to fusion screen` |
| 6 | Test and polish | `feat: complete Build Copies feature` |

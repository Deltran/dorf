# Shard System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a shard-based hero skill upgrade system that rewards quest grinding in Aquaria+ regions.

**Architecture:** New `shards.js` store manages hunting loadout and unlock state. Hero instances gain `shards` and `shardTier` fields. Battle store applies shard bonus to percentage-based skill effects. New `ShardsScreen.vue` for hunting configuration and progress display.

**Tech Stack:** Vue 3, Pinia stores, existing component patterns (HeroCard, sequential reveal animation)

---

## Task 1: Add Shard Fields to Hero Instances

**Files:**
- Modify: `src/stores/heroes.js:40-57` (addHero function)
- Modify: `src/stores/heroes.js:228-246` (loadState/saveState)

**Step 1: Add shard fields to hero creation**

In `addHero()`, add `shards: 0` and `shardTier: 0` to the hero instance:

```js
const heroInstance = {
  instanceId: crypto.randomUUID(),
  templateId,
  level: 1,
  exp: 0,
  starLevel: template.rarity,
  shards: 0,      // Current shard count (resets after upgrade)
  shardTier: 0    // 0 = none, 1/2/3 = upgraded tiers
}
```

**Step 2: Add migration in loadState**

Add migration for existing heroes missing shard fields:

```js
function loadState(savedState) {
  if (savedState.collection) {
    collection.value = savedState.collection.map(hero => ({
      ...hero,
      starLevel: hero.starLevel || getHeroTemplate(hero.templateId)?.rarity || 1,
      shards: hero.shards ?? 0,
      shardTier: hero.shardTier ?? 0
    }))
  }
  // ... rest unchanged
}
```

**Step 3: Verify saveState includes fields**

The existing `saveState()` already returns `collection.value` which will include the new fields.

**Step 4: Commit**

```bash
git add src/stores/heroes.js
git commit -m "$(cat <<'EOF'
feat(shards): add shard fields to hero instances

Add shards and shardTier fields to hero creation and migration
for existing saves.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create Shards Store

**Files:**
- Create: `src/stores/shards.js`
- Modify: `src/stores/index.js` (add export)

**Step 1: Create the shards store**

```js
// src/stores/shards.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHeroesStore } from './heroes.js'
import { useQuestsStore } from './quests.js'

export const useShardsStore = defineStore('shards', () => {
  // State
  const huntingSlots = ref([null, null, null, null, null]) // templateId or null for random
  const unlocked = ref(false) // Set true when player reaches Aquaria

  // Getters
  const isUnlocked = computed(() => unlocked.value)

  // Actions
  function setHuntingSlot(index, templateId) {
    if (index < 0 || index > 4) return false
    huntingSlots.value[index] = templateId
    return true
  }

  function clearHuntingSlot(index) {
    if (index < 0 || index > 4) return false
    huntingSlots.value[index] = null
    return true
  }

  function unlock() {
    unlocked.value = true
  }

  // Roll for shard drop - returns { templateId, count } or null
  function rollShardDrop() {
    if (!unlocked.value) return null

    const heroesStore = useHeroesStore()
    const ownedTemplateIds = [...new Set(heroesStore.collection.map(h => h.templateId))]

    if (ownedTemplateIds.length === 0) return null

    // Pick a random slot
    const slotIndex = Math.floor(Math.random() * 5)
    const slotValue = huntingSlots.value[slotIndex]

    let targetTemplateId
    if (slotValue && ownedTemplateIds.includes(slotValue)) {
      // Slot has a valid hero assigned
      targetTemplateId = slotValue
    } else {
      // Empty slot or hero no longer owned - random from roster
      targetTemplateId = ownedTemplateIds[Math.floor(Math.random() * ownedTemplateIds.length)]
    }

    // Roll 3-7 shards
    const count = Math.floor(Math.random() * 5) + 3

    return { templateId: targetTemplateId, count }
  }

  // Add shards to a hero by templateId
  function addShards(templateId, count) {
    const heroesStore = useHeroesStore()
    // Find all heroes with this templateId and add shards to each
    // (In case player has multiple copies, all get shards)
    const matchingHeroes = heroesStore.collection.filter(h => h.templateId === templateId)
    for (const hero of matchingHeroes) {
      hero.shards = (hero.shards || 0) + count
    }
    return matchingHeroes.length > 0
  }

  // Persistence
  function saveState() {
    return {
      huntingSlots: huntingSlots.value,
      unlocked: unlocked.value
    }
  }

  function loadState(savedState) {
    if (savedState.huntingSlots) huntingSlots.value = savedState.huntingSlots
    if (savedState.unlocked !== undefined) unlocked.value = savedState.unlocked
  }

  return {
    // State
    huntingSlots,
    unlocked,
    // Getters
    isUnlocked,
    // Actions
    setHuntingSlot,
    clearHuntingSlot,
    unlock,
    rollShardDrop,
    addShards,
    // Persistence
    saveState,
    loadState
  }
})
```

**Step 2: Export from stores/index.js**

Add to the exports in `src/stores/index.js`:

```js
export { useShardsStore } from './shards.js'
```

**Step 3: Commit**

```bash
git add src/stores/shards.js src/stores/index.js
git commit -m "$(cat <<'EOF'
feat(shards): create shards store for hunting loadout

Manages 5-slot hunting configuration and shard drop rolling.
Includes persistence support.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add Shard Upgrade Functions to Heroes Store

**Files:**
- Modify: `src/stores/heroes.js`

**Step 1: Add shard tier thresholds constant**

Add near the top with other constants:

```js
const SHARD_TIER_COSTS = [50, 100, 200] // Costs for tier 1, 2, 3
```

**Step 2: Add canUpgradeShardTier function**

```js
function canUpgradeShardTier(instanceId) {
  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) return { canUpgrade: false, reason: 'Hero not found' }

  const currentTier = hero.shardTier || 0
  if (currentTier >= 3) {
    return { canUpgrade: false, reason: 'Already at max shard tier' }
  }

  const cost = SHARD_TIER_COSTS[currentTier]
  const currentShards = hero.shards || 0

  if (currentShards < cost) {
    return {
      canUpgrade: false,
      reason: `Need ${cost} shards (have ${currentShards})`,
      shardsNeeded: cost,
      shardsHave: currentShards,
      nextTier: currentTier + 1
    }
  }

  return {
    canUpgrade: true,
    shardsNeeded: cost,
    shardsHave: currentShards,
    nextTier: currentTier + 1,
    bonusPercent: (currentTier + 1) * 5 // +5%, +10%, +15%
  }
}
```

**Step 3: Add upgradeShardTier function**

```js
function upgradeShardTier(instanceId) {
  const checkResult = canUpgradeShardTier(instanceId)
  if (!checkResult.canUpgrade) {
    return { success: false, error: checkResult.reason }
  }

  const hero = collection.value.find(h => h.instanceId === instanceId)
  const cost = SHARD_TIER_COSTS[hero.shardTier || 0]

  hero.shards -= cost
  hero.shardTier = (hero.shardTier || 0) + 1

  return {
    success: true,
    newTier: hero.shardTier,
    bonusPercent: hero.shardTier * 5,
    shardsRemaining: hero.shards
  }
}
```

**Step 4: Add getShardBonus helper**

```js
function getShardBonus(instanceId) {
  const hero = collection.value.find(h => h.instanceId === instanceId)
  if (!hero) return 0
  return (hero.shardTier || 0) * 5 // 0, 5, 10, or 15
}
```

**Step 5: Export new functions**

Add to the return statement:

```js
return {
  // ... existing exports
  // Shards
  canUpgradeShardTier,
  upgradeShardTier,
  getShardBonus,
  SHARD_TIER_COSTS
}
```

**Step 6: Commit**

```bash
git add src/stores/heroes.js
git commit -m "$(cat <<'EOF'
feat(shards): add shard tier upgrade functions

Add canUpgradeShardTier, upgradeShardTier, and getShardBonus
to heroes store. Tier costs: 50, 100, 200 shards.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Integrate Shard Drops into Quest Completion

**Files:**
- Modify: `src/stores/quests.js:156-210` (completeRun function)
- Modify: `src/data/questNodes.js` (add shardDropChance to Aquaria+ nodes)

**Step 1: Import shards store in quests.js**

Add import at top:

```js
import { useShardsStore } from './shards.js'
```

**Step 2: Modify completeRun to roll shard drops**

After rolling item drops, add shard drop logic:

```js
function completeRun() {
  if (!currentRun.value) return null

  const node = getQuestNode(currentRun.value.nodeId)
  if (!node) return null

  const isFirstClear = !completedNodes.value.includes(node.id)

  // Mark as completed
  if (!completedNodes.value.includes(node.id)) {
    completedNodes.value.push(node.id)
  }

  // Unlock connected nodes
  for (const connectedId of node.connections) {
    if (!unlockedNodes.value.includes(connectedId)) {
      unlockedNodes.value.push(connectedId)
    }
  }

  // Unlock Coral Depths when aqua_08 is completed
  if (node.id === 'aqua_08' && !unlockedNodes.value.includes('coral_01')) {
    unlockedNodes.value.push('coral_01')
  }

  // Roll item drops
  const itemDrops = rollItemDrops(node)

  // Grant items
  const inventoryStore = useInventoryStore()
  for (const drop of itemDrops) {
    inventoryStore.addItem(drop.itemId, drop.count)
  }

  // Roll shard drops (only for nodes with shardDropChance)
  let shardDrop = null
  if (node.shardDropChance && Math.random() < node.shardDropChance) {
    const shardsStore = useShardsStore()
    shardDrop = shardsStore.rollShardDrop()
    if (shardDrop) {
      shardsStore.addShards(shardDrop.templateId, shardDrop.count)
    }
  }

  // Calculate rewards
  const baseGold = node.rewards.gold || Math.floor(node.rewards.exp * 2)
  const rewards = {
    gems: node.rewards.gems,
    exp: node.rewards.exp,
    gold: baseGold,
    isFirstClear,
    items: itemDrops,
    shardDrop // { templateId, count } or null
  }

  if (isFirstClear && node.firstClearBonus) {
    rewards.gems += node.firstClearBonus.gems || 0
    rewards.exp += node.firstClearBonus.exp || 0
    rewards.gold += node.firstClearBonus.gold || Math.floor(baseGold * 0.5)
  }

  // Clear current run
  currentRun.value = null

  return rewards
}
```

**Step 3: Add shardDropChance to Aquaria nodes**

In `src/data/questNodes.js`, add `shardDropChance: 0.25` (25%) to all `aqua_*` and `coral_*` nodes. Example for aqua_01:

```js
aqua_01: {
  id: 'aqua_01',
  name: 'Tidepool Entrance',
  region: 'Gate to Aquaria',
  // ... existing properties
  shardDropChance: 0.25
}
```

Repeat for all Aquaria and Coral Depths nodes.

**Step 4: Commit**

```bash
git add src/stores/quests.js src/data/questNodes.js
git commit -m "$(cat <<'EOF'
feat(shards): integrate shard drops into quest completion

Nodes with shardDropChance roll for shard drops on completion.
Added 25% shard drop chance to all Aquaria+ region nodes.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Unlock Shards When Reaching Aquaria

**Files:**
- Modify: `src/stores/quests.js`

**Step 1: Trigger unlock on first Aquaria node completion**

In `completeRun()`, after the existing unlock logic for coral_01, add:

```js
// Unlock shards system when first Aquaria node is completed
const shardsStore = useShardsStore()
if (node.region === 'Gate to Aquaria' && !shardsStore.isUnlocked) {
  shardsStore.unlock()
}
```

**Step 2: Commit**

```bash
git add src/stores/quests.js
git commit -m "$(cat <<'EOF'
feat(shards): unlock shards system on reaching Aquaria

Completing any Gate to Aquaria node unlocks the shard system.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Apply Shard Bonus in Battle

**Files:**
- Modify: `src/stores/battle.js`

**Step 1: Add getShardBonus helper import**

The heroes store is already imported. We'll call `heroesStore.getShardBonus()`.

**Step 2: Create applyShardBonus function**

Add this function near the damage calculation helpers:

```js
// Apply shard tier bonus to a percentage value
function applyShardBonus(basePercent, hero) {
  const heroesStore = useHeroesStore()
  const bonus = heroesStore.getShardBonus(hero.instanceId)
  return basePercent + bonus
}
```

**Step 3: Modify parseSkillMultiplier calls**

In `executePlayerAction()`, when calculating damage/heal percentages from skill descriptions, apply the shard bonus. Find calls like:

```js
const multiplier = parseSkillMultiplier(skill.description)
```

And wrap them:

```js
const baseMultiplier = parseSkillMultiplier(skill.description)
const multiplier = applyShardBonus(baseMultiplier * 100, hero) / 100
```

Apply this pattern to:
- Single-target damage skills
- Multi-hit skills
- AoE skills (all_enemies)
- Healing skills (calculateHeal)
- Buff/debuff effect values (effect.value)

**Step 4: Modify calculateHeal to accept shard bonus**

Change the function signature and apply bonus:

```js
function calculateHeal(atk, description, shardBonus = 0) {
  const match = description.match(/(\d+)%/)
  if (match) {
    const basePercent = parseInt(match[1])
    return Math.floor(atk * (basePercent + shardBonus) / 100)
  }
  return Math.floor(atk)
}
```

And update calls to pass the bonus.

**Step 5: Apply bonus to effect values**

When applying effects like ATK_UP, DEF_UP, etc., add the shard bonus:

```js
const effectValue = resolveEffectValue(effect, hero, effectiveAtk) + heroesStore.getShardBonus(hero.instanceId)
```

**Step 6: Commit**

```bash
git add src/stores/battle.js
git commit -m "$(cat <<'EOF'
feat(shards): apply shard tier bonus in combat

Shard bonus (+5/10/15%) is added to all percentage-based
skill effects: damage, healing, buff values, debuff values.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create ShardsScreen Component

**Files:**
- Create: `src/screens/ShardsScreen.vue`
- Modify: `src/App.vue` (add route)

**Step 1: Create ShardsScreen.vue**

```vue
<script setup>
import { ref, computed } from 'vue'
import { useShardsStore, useHeroesStore } from '../stores'
import HeroCard from '../components/HeroCard.vue'
import { getHeroTemplate, getAllHeroTemplates } from '../data/heroTemplates.js'

const emit = defineEmits(['navigate'])

const shardsStore = useShardsStore()
const heroesStore = useHeroesStore()

const showHeroPicker = ref(false)
const selectedSlot = ref(null)

// Get unique owned hero templates for picker
const ownedTemplates = computed(() => {
  const templateIds = [...new Set(heroesStore.collection.map(h => h.templateId))]
  return templateIds.map(id => getHeroTemplate(id)).filter(Boolean)
})

// Get heroes with their shard data, sorted by shards desc
const heroesWithShards = computed(() => {
  return heroesStore.collection
    .map(hero => ({
      ...heroesStore.getHeroFull(hero.instanceId),
      shards: hero.shards || 0,
      shardTier: hero.shardTier || 0
    }))
    .sort((a, b) => b.shards - a.shards)
})

// Get hunting slot data
const huntingSlotData = computed(() => {
  return shardsStore.huntingSlots.map((templateId, index) => {
    if (!templateId) return { index, template: null }
    return { index, template: getHeroTemplate(templateId) }
  })
})

function openSlotPicker(index) {
  selectedSlot.value = index
  showHeroPicker.value = true
}

function selectHeroForSlot(templateId) {
  if (selectedSlot.value !== null) {
    shardsStore.setHuntingSlot(selectedSlot.value, templateId)
  }
  showHeroPicker.value = false
  selectedSlot.value = null
}

function clearSlot(index) {
  shardsStore.clearHuntingSlot(index)
}

function getNextTierCost(hero) {
  const tier = hero.shardTier || 0
  if (tier >= 3) return null
  return heroesStore.SHARD_TIER_COSTS[tier]
}

function navigateToHero(hero) {
  emit('navigate', 'heroes', hero.instanceId)
}
</script>

<template>
  <div class="shards-screen">
    <header class="screen-header">
      <button class="back-btn" @click="emit('navigate', 'home')">Back</button>
      <h1>Shards</h1>
    </header>

    <!-- Locked state -->
    <div v-if="!shardsStore.isUnlocked" class="locked-overlay">
      <div class="locked-content">
        <div class="lock-icon">🔒</div>
        <h2>Shards Locked</h2>
        <p>Reach <strong>Gate to Aquaria</strong> to unlock the Shard system.</p>
        <p class="hint">Complete the Western Veros regions to discover the path to Aquaria.</p>
      </div>
    </div>

    <!-- Unlocked content -->
    <template v-else>
      <!-- Hunting Loadout Section -->
      <section class="hunting-section">
        <h2>Shard Hunting</h2>
        <p class="section-desc">Select up to 5 heroes to hunt shards for. Empty slots roll random heroes.</p>

        <div class="hunting-slots">
          <div
            v-for="slot in huntingSlotData"
            :key="slot.index"
            class="hunting-slot"
            @click="openSlotPicker(slot.index)"
          >
            <template v-if="slot.template">
              <div class="slot-hero">
                <span class="hero-name">{{ slot.template.name }}</span>
                <button class="clear-btn" @click.stop="clearSlot(slot.index)">×</button>
              </div>
            </template>
            <template v-else>
              <div class="slot-empty">
                <span class="random-icon">?</span>
                <span class="random-text">Random</span>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- Shard Progress Section -->
      <section class="progress-section">
        <h2>Shard Progress</h2>

        <div class="hero-shard-list">
          <div
            v-for="hero in heroesWithShards"
            :key="hero.instanceId"
            class="hero-shard-row"
            @click="navigateToHero(hero)"
          >
            <div class="hero-info">
              <span class="hero-name">{{ hero.template.name }}</span>
              <span class="hero-level">Lv.{{ hero.level }}</span>
            </div>
            <div class="shard-info">
              <span class="shard-count">{{ hero.shards }} shards</span>
              <div class="tier-pips">
                <span
                  v-for="i in 3"
                  :key="i"
                  :class="['pip', { filled: hero.shardTier >= i }]"
                />
              </div>
            </div>
            <div class="upgrade-hint" v-if="getNextTierCost(hero)">
              {{ hero.shards }}/{{ getNextTierCost(hero) }}
            </div>
            <div class="upgrade-hint max" v-else>MAX</div>
          </div>
        </div>
      </section>
    </template>

    <!-- Hero Picker Modal -->
    <div v-if="showHeroPicker" class="modal-overlay" @click="showHeroPicker = false">
      <div class="modal" @click.stop>
        <h3>Select Hero</h3>
        <div class="hero-picker-list">
          <div
            v-for="template in ownedTemplates"
            :key="template.id"
            class="picker-item"
            @click="selectHeroForSlot(template.id)"
          >
            {{ template.name }}
          </div>
        </div>
        <button class="cancel-btn" @click="showHeroPicker = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shards-screen {
  min-height: 100vh;
  background: #111827;
  padding: 1rem;
}

.screen-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.screen-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.back-btn {
  background: #374151;
  border: none;
  color: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

/* Locked state */
.locked-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.locked-content {
  text-align: center;
  padding: 2rem;
}

.lock-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.locked-content h2 {
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.locked-content p {
  color: #6b7280;
}

.hint {
  font-size: 0.875rem;
  margin-top: 1rem;
}

/* Hunting section */
.hunting-section {
  margin-bottom: 2rem;
}

.hunting-section h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.section-desc {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.hunting-slots {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.hunting-slot {
  flex: 1;
  min-width: 100px;
  background: #1f2937;
  border: 2px dashed #374151;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  text-align: center;
}

.hunting-slot:hover {
  border-color: #4b5563;
}

.slot-hero {
  position: relative;
}

.slot-hero .hero-name {
  font-size: 0.75rem;
  color: #f3f4f6;
}

.clear-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: #ef4444;
  border: none;
  color: white;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  line-height: 1;
}

.slot-empty {
  color: #6b7280;
}

.random-icon {
  font-size: 1.5rem;
  display: block;
}

.random-text {
  font-size: 0.75rem;
}

/* Progress section */
.progress-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.hero-shard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hero-shard-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #1f2937;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}

.hero-shard-row:hover {
  background: #374151;
}

.hero-info {
  flex: 1;
}

.hero-info .hero-name {
  display: block;
  font-weight: 500;
}

.hero-info .hero-level {
  font-size: 0.75rem;
  color: #6b7280;
}

.shard-info {
  text-align: right;
}

.shard-count {
  font-size: 0.875rem;
  color: #a855f7;
}

.tier-pips {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 4px;
}

.pip {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #374151;
}

.pip.filled {
  background: #a855f7;
}

.upgrade-hint {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 60px;
  text-align: right;
}

.upgrade-hint.max {
  color: #22c55e;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #1f2937;
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 280px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 1rem 0;
}

.hero-picker-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.picker-item {
  padding: 0.75rem;
  background: #374151;
  border-radius: 6px;
  cursor: pointer;
}

.picker-item:hover {
  background: #4b5563;
}

.cancel-btn {
  width: 100%;
  padding: 0.75rem;
  background: #374151;
  border: none;
  color: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
}
</style>
```

**Step 2: Add route in App.vue**

Import the component:

```js
import ShardsScreen from './screens/ShardsScreen.vue'
```

Add to template after InventoryScreen:

```vue
<ShardsScreen
  v-else-if="currentScreen === 'shards'"
  @navigate="navigate"
/>
```

**Step 3: Commit**

```bash
git add src/screens/ShardsScreen.vue src/App.vue
git commit -m "$(cat <<'EOF'
feat(shards): create ShardsScreen component

New screen with hunting loadout configuration and shard progress.
Shows locked state before reaching Aquaria.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add Shards Navigation to HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Step 1: Add Shards button to nav**

Find the navigation buttons section and add:

```vue
<button class="nav-btn" @click="emit('navigate', 'shards')">
  <span class="nav-icon">💎</span>
  <span class="nav-label">Shards</span>
</button>
```

**Step 2: Commit**

```bash
git add src/screens/HomeScreen.vue
git commit -m "$(cat <<'EOF'
feat(shards): add Shards navigation to HomeScreen

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Add Shard Section to Hero Detail Panel

**Files:**
- Modify: `src/screens/HeroesScreen.vue`

**Step 1: Import heroes store constants**

The store is already imported. Access `SHARD_TIER_COSTS` from it.

**Step 2: Add computed for selected hero shard data**

```js
const selectedHeroShardInfo = computed(() => {
  if (!selectedHero.value) return null
  const hero = heroesStore.collection.find(h => h.instanceId === selectedHero.value.instanceId)
  if (!hero) return null

  const tier = hero.shardTier || 0
  const shards = hero.shards || 0
  const canUpgrade = heroesStore.canUpgradeShardTier(hero.instanceId)

  return {
    shards,
    tier,
    canUpgrade,
    nextCost: tier < 3 ? heroesStore.SHARD_TIER_COSTS[tier] : null,
    bonusPercent: tier * 5
  }
})
```

**Step 3: Add upgrade handler**

```js
function upgradeShardTier() {
  if (!selectedHero.value) return
  const result = heroesStore.upgradeShardTier(selectedHero.value.instanceId)
  if (result.success) {
    // Refresh selected hero data
    selectedHero.value = heroesStore.getHeroFull(selectedHero.value.instanceId)
  }
}
```

**Step 4: Add shard section to template**

In the hero detail panel section (after stats or skills), add:

```vue
<!-- Shard Tier Section -->
<div class="detail-section" v-if="selectedHeroShardInfo">
  <h3>Shard Power</h3>
  <div class="shard-tier-display">
    <div class="tier-pips">
      <span
        v-for="i in 3"
        :key="i"
        :class="['tier-pip', { active: selectedHeroShardInfo.tier >= i }]"
      >★</span>
    </div>
    <span class="tier-bonus" v-if="selectedHeroShardInfo.bonusPercent > 0">
      +{{ selectedHeroShardInfo.bonusPercent }}% to all skills
    </span>
  </div>

  <div class="shard-progress" v-if="selectedHeroShardInfo.nextCost">
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: `${Math.min(100, (selectedHeroShardInfo.shards / selectedHeroShardInfo.nextCost) * 100)}%` }"
      />
    </div>
    <span class="progress-text">
      {{ selectedHeroShardInfo.shards }} / {{ selectedHeroShardInfo.nextCost }} shards
    </span>
  </div>
  <div class="shard-max" v-else>
    <span class="max-badge">MAX TIER</span>
  </div>

  <button
    v-if="selectedHeroShardInfo.canUpgrade.canUpgrade"
    class="upgrade-btn"
    @click="upgradeShardTier"
  >
    Upgrade (+{{ selectedHeroShardInfo.canUpgrade.bonusPercent }}%)
  </button>
</div>
```

**Step 5: Add styles**

```css
/* Shard tier styles */
.shard-tier-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.tier-pips {
  display: flex;
  gap: 4px;
}

.tier-pip {
  font-size: 1.25rem;
  color: #374151;
}

.tier-pip.active {
  color: #a855f7;
}

.tier-bonus {
  color: #a855f7;
  font-size: 0.875rem;
}

.shard-progress {
  margin-bottom: 0.75rem;
}

.progress-bar {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: #a855f7;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
}

.shard-max {
  margin-bottom: 0.75rem;
}

.max-badge {
  background: #22c55e;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.upgrade-btn {
  width: 100%;
  padding: 0.75rem;
  background: #a855f7;
  border: none;
  color: white;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.upgrade-btn:hover {
  background: #9333ea;
}
```

**Step 6: Commit**

```bash
git add src/screens/HeroesScreen.vue
git commit -m "$(cat <<'EOF'
feat(shards): add shard upgrade section to hero detail panel

Shows shard count, tier progress, and upgrade button when ready.
Displays +5/10/15% bonus indicator.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Display Shard Drops in Victory Screen

**Files:**
- Modify: `src/screens/BattleScreen.vue`

**Step 1: Import getHeroTemplate**

Add to imports:

```js
import { getHeroTemplate } from '../data/heroTemplates.js'
```

**Step 2: Add shardDrop to rewards display**

In the watch that handles rewards, capture shard drops:

```js
const shardDropDisplay = ref(null)
```

In `handleVictory` or wherever rewards are processed:

```js
if (rewards.shardDrop) {
  shardDropDisplay.value = {
    template: getHeroTemplate(rewards.shardDrop.templateId),
    count: rewards.shardDrop.count
  }
}
```

**Step 3: Add shard drop to victory modal template**

After item drops section in victory modal:

```vue
<!-- Shard Drop -->
<div v-if="shardDropDisplay" class="shard-drop-section">
  <div class="shard-drop">
    <span class="shard-icon">💎</span>
    <span class="shard-hero">{{ shardDropDisplay.template.name }}</span>
    <span class="shard-count">×{{ shardDropDisplay.count }}</span>
  </div>
</div>
```

**Step 4: Add styles**

```css
.shard-drop-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #374151;
}

.shard-drop {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #1f2937, #2a2340);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #a855f7;
}

.shard-icon {
  font-size: 1.25rem;
}

.shard-hero {
  flex: 1;
  color: #a855f7;
  font-weight: 500;
}

.shard-count {
  color: #a855f7;
}
```

**Step 5: Commit**

```bash
git add src/screens/BattleScreen.vue
git commit -m "$(cat <<'EOF'
feat(shards): display shard drops in victory screen

Shows hero name and shard count with purple theme styling.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Add Persistence for Shards Store

**Files:**
- Modify: `src/utils/storage.js`
- Modify: `src/App.vue`

**Step 1: Update storage.js saveGame/loadGame**

Add shards store to the save/load functions:

```js
export function saveGame({ heroes, gacha, quests, inventory, shards }) {
  const data = {
    heroes: heroes.saveState(),
    gacha: gacha.saveState(),
    quests: quests.saveState(),
    inventory: inventory.saveState(),
    shards: shards?.saveState() || { huntingSlots: [null,null,null,null,null], unlocked: false }
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(data))
}

export function loadGame({ heroes, gacha, quests, inventory, shards }) {
  const data = localStorage.getItem(SAVE_KEY)
  if (!data) return false

  const parsed = JSON.parse(data)
  if (parsed.heroes) heroes.loadState(parsed.heroes)
  if (parsed.gacha) gacha.loadState(parsed.gacha)
  if (parsed.quests) quests.loadState(parsed.quests)
  if (parsed.inventory) inventory.loadState(parsed.inventory)
  if (parsed.shards && shards) shards.loadState(parsed.shards)

  return true
}
```

**Step 2: Update App.vue to include shards store**

Import and use shards store:

```js
import { useHeroesStore, useGachaStore, useQuestsStore, useInventoryStore, useShardsStore } from './stores'

// In setup:
const shardsStore = useShardsStore()

// Update saveGame call:
saveGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore })

// Update loadGame call:
loadGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore })
```

**Step 3: Add shards to auto-save watch**

```js
watch(
  () => [
    // ... existing watchers
    shardsStore.huntingSlots,
    shardsStore.unlocked
  ],
  // ... rest unchanged
)
```

**Step 4: Commit**

```bash
git add src/utils/storage.js src/App.vue
git commit -m "$(cat <<'EOF'
feat(shards): add persistence for shards store

Hunting loadout and unlock state persist across sessions.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Final Testing & Cleanup

**Step 1: Manual testing checklist**

- [ ] New heroes have shards: 0 and shardTier: 0
- [ ] Existing saves migrate correctly (shards/shardTier default to 0)
- [ ] ShardsScreen shows locked state before Aquaria
- [ ] Completing first Aquaria node unlocks shards
- [ ] Shard drops appear at ~25% rate in Aquaria
- [ ] Hunting loadout affects which hero gets shards
- [ ] Shard drops show in victory screen
- [ ] Hero detail shows shard progress
- [ ] Upgrade button appears at 50/100/200 shards
- [ ] Upgrading consumes shards and increases tier
- [ ] Combat damage/healing increases by +5/10/15% per tier
- [ ] State persists across page refresh

**Step 2: Run build**

```bash
npm run build
```

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(shards): address testing feedback

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add shard fields to hero instances |
| 2 | Create shards store |
| 3 | Add shard upgrade functions |
| 4 | Integrate shard drops into quests |
| 5 | Unlock on reaching Aquaria |
| 6 | Apply shard bonus in battle |
| 7 | Create ShardsScreen component |
| 8 | Add navigation to HomeScreen |
| 9 | Add shard section to hero detail |
| 10 | Display drops in victory screen |
| 11 | Add persistence |
| 12 | Final testing |

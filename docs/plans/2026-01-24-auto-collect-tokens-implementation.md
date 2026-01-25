# Auto-Collect Tokens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add region-specific tokens that let players instantly collect rewards from completed quests without re-running battles.

**Architecture:** New token items in items.js, collectWithToken() function in quests store, "Use Token" button in WorldMapScreen quest popup, token drops added to questNodes.js.

**Tech Stack:** Vue 3 Composition API, Pinia stores, existing item/quest patterns

**Design Doc:** `docs/plans/2026-01-24-auto-collect-tokens-design.md`

---

### Task 1: Add Token Item Definitions

**Files:**
- Modify: `src/data/items.js`

**Step 1: Add the 5 token items after the existing key items**

```javascript
// Region tokens - auto-collect rewards from completed quests
token_whispering_woods: {
  id: 'token_whispering_woods',
  name: 'Whispering Woods Token',
  description: 'Instantly collect rewards from a completed Whispering Woods quest.',
  type: 'token',
  rarity: 3,
  region: 'Whispering Woods'
},
token_whisper_lake: {
  id: 'token_whisper_lake',
  name: 'Whisper Lake Token',
  description: 'Instantly collect rewards from a completed Whisper Lake quest.',
  type: 'token',
  rarity: 3,
  region: 'Whisper Lake'
},
token_echoing_caverns: {
  id: 'token_echoing_caverns',
  name: 'Echoing Caverns Token',
  description: 'Instantly collect rewards from a completed Echoing Caverns quest.',
  type: 'token',
  rarity: 3,
  region: 'Echoing Caverns'
},
token_stormwind_peaks: {
  id: 'token_stormwind_peaks',
  name: 'Stormwind Peaks Token',
  description: 'Instantly collect rewards from a completed Stormwind Peaks quest.',
  type: 'token',
  rarity: 3,
  region: 'Stormwind Peaks'
},
token_blistering_cliffs: {
  id: 'token_blistering_cliffs',
  name: 'Blistering Cliffs Token',
  description: 'Instantly collect rewards from a completed Blistering Cliffsides quest.',
  type: 'token',
  rarity: 3,
  region: 'Blistering Cliffsides'
},
```

**Step 2: Add helper function to get token for a region**

```javascript
export function getTokenForRegion(regionName) {
  return Object.values(items).find(item =>
    item.type === 'token' && item.region === regionName
  )
}
```

**Step 3: Commit**

```bash
git add src/data/items.js
git commit -m "feat(items): add region token items for auto-collect"
```

---

### Task 2: Add collectWithToken Function to Quests Store

**Files:**
- Modify: `src/stores/quests.js`

**Step 1: Add the collectWithToken function after completeRun()**

```javascript
function collectWithToken(nodeId) {
  const node = getQuestNode(nodeId)
  if (!node) {
    return { success: false, error: 'Quest not found' }
  }

  // Must be completed
  if (!completedNodes.value.includes(nodeId)) {
    return { success: false, error: 'Quest not yet completed' }
  }

  // Cannot use on Genus Loci or Exploration
  if (node.type === 'genusLoci' || node.type === 'exploration') {
    return { success: false, error: 'Cannot use token on this quest type' }
  }

  // Find matching token for this region
  const { getTokenForRegion } = require('../data/items.js')
  const token = getTokenForRegion(node.region)
  if (!token) {
    return { success: false, error: 'No token exists for this region' }
  }

  // Check if player has the token
  const inventoryStore = useInventoryStore()
  if (inventoryStore.getItemCount(token.id) <= 0) {
    return { success: false, error: 'No token available' }
  }

  // Consume token
  inventoryStore.removeItem(token.id, 1)

  // Roll item drops (reuse existing function)
  const itemDrops = rollItemDrops(node)

  // Grant items
  for (const drop of itemDrops) {
    inventoryStore.addItem(drop.itemId, drop.count)
  }

  // Roll shard drops
  const shardsStore = useShardsStore()
  let shardDrop = null
  if (node.shardDropChance && Math.random() < node.shardDropChance) {
    shardDrop = shardsStore.rollShardDrop()
    if (shardDrop) {
      shardsStore.addShards(shardDrop.templateId, shardDrop.count)
    }
  }

  // Calculate rewards (no first clear bonus)
  const baseGold = node.rewards.gold || Math.floor(node.rewards.exp * 2)
  const rewards = {
    gems: node.rewards.gems,
    exp: node.rewards.exp,
    gold: baseGold,
    items: itemDrops,
    shardDrop,
    usedToken: token.name
  }

  return { success: true, rewards }
}
```

**Step 2: Export the function in the return statement**

Add `collectWithToken` to the return object.

**Step 3: Commit**

```bash
git add src/stores/quests.js
git commit -m "feat(quests): add collectWithToken function for token auto-collect"
```

---

### Task 3: Add Token Drops to Quest Nodes

**Files:**
- Modify: `src/data/questNodes.js`

**Step 1: Add token drops to Whisper Lake quests (drops Whispering Woods token)**

Find all `region: 'Whisper Lake'` quests and add to their itemDrops:
```javascript
{ itemId: 'token_whispering_woods', min: 1, max: 1, chance: 0.1 }
```

**Step 2: Add token drops to Echoing Caverns quests (drops Whisper Lake token)**

Find all `region: 'Echoing Caverns'` quests and add:
```javascript
{ itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
```

**Step 3: Add token drops to Stormwind Peaks quests (drops Echoing Caverns token)**

Find all `region: 'Stormwind Peaks'` quests and add:
```javascript
{ itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
```

**Step 4: Add token drops to Blistering Cliffsides quests (drops Stormwind Peaks token)**

Find all `region: 'Blistering Cliffsides'` quests and add:
```javascript
{ itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
```

**Step 5: Commit**

```bash
git add src/data/questNodes.js
git commit -m "feat(quests): add token drops to quest nodes"
```

---

### Task 4: Add Use Token Button to WorldMapScreen

**Files:**
- Modify: `src/screens/WorldMapScreen.vue`

**Step 1: Import inventory store and items helper**

Add to imports:
```javascript
import { useInventoryStore } from '../stores'
import { getTokenForRegion } from '../data/items.js'
```

**Step 2: Add inventory store to setup**

```javascript
const inventoryStore = useInventoryStore()
```

**Step 3: Add computed for token availability**

```javascript
const selectedNodeToken = computed(() => {
  if (!selectedNode.value) return null
  if (!selectedNode.value.isCompleted) return null
  if (selectedNode.value.isGenusLoci || selectedNode.value.isExploration) return null

  const token = getTokenForRegion(selectedNode.value.region)
  if (!token) return null

  return {
    ...token,
    count: inventoryStore.getItemCount(token.id)
  }
})
```

**Step 4: Add state for token results**

```javascript
const showTokenResults = ref(false)
const tokenResults = ref(null)
```

**Step 5: Add useToken function**

```javascript
function useToken() {
  if (!selectedNode.value || !selectedNodeToken.value) return

  const result = questsStore.collectWithToken(selectedNode.value.id)
  if (result.success) {
    // Grant currency rewards
    gachaStore.addGems(result.rewards.gems)
    gachaStore.addGold(result.rewards.gold)
    heroesStore.addExpToParty(result.rewards.exp)

    tokenResults.value = result.rewards
    showTokenResults.value = true
  }
}

function closeTokenResults() {
  showTokenResults.value = false
  tokenResults.value = null
  selectedNode.value = null
}
```

**Step 6: Add Use Token button to regular quest preview (before Start Quest button)**

```html
<!-- Use Token Button (for completed quests) -->
<button
  v-if="selectedNodeToken"
  class="use-token-btn"
  :disabled="selectedNodeToken.count <= 0"
  @click="useToken"
>
  <span class="btn-icon">🎫</span>
  <span v-if="selectedNodeToken.count > 0">Use Token ({{ selectedNodeToken.count }})</span>
  <span v-else>No Token</span>
</button>
```

**Step 7: Commit**

```bash
git add src/screens/WorldMapScreen.vue
git commit -m "feat(map): add Use Token button for completed quests"
```

---

### Task 5: Add Token Results Modal to WorldMapScreen

**Files:**
- Modify: `src/screens/WorldMapScreen.vue`

**Step 1: Add token results modal template (after the node-preview aside)**

```html
<!-- Token Results Modal -->
<Transition name="fade">
  <div v-if="showTokenResults" class="token-results-backdrop" @click="closeTokenResults"></div>
</Transition>
<Transition name="slide-up">
  <div v-if="showTokenResults && tokenResults" class="token-results-modal">
    <div class="token-results-header">
      <h3>Token Rewards Collected</h3>
      <span class="token-node-name">{{ selectedNode?.name }}</span>
    </div>

    <div class="token-results-body">
      <div class="token-currency-rewards">
        <div class="currency-item">
          <span class="currency-icon">🪙</span>
          <span class="currency-value">{{ tokenResults.gold }}</span>
        </div>
        <div class="currency-item">
          <span class="currency-icon">💎</span>
          <span class="currency-value">{{ tokenResults.gems }}</span>
        </div>
        <div class="currency-item">
          <span class="currency-icon">⭐</span>
          <span class="currency-value">{{ tokenResults.exp }} XP</span>
        </div>
      </div>

      <div v-if="tokenResults.items.length > 0" class="token-item-drops">
        <h4>Items</h4>
        <div class="token-items-grid">
          <div v-for="(item, index) in tokenResults.items" :key="index" class="token-item">
            <span class="item-name">{{ getItem(item.itemId)?.name }}</span>
            <span class="item-count">x{{ item.count }}</span>
          </div>
        </div>
      </div>
      <div v-else class="no-items-dropped">
        No items dropped
      </div>
    </div>

    <button class="collect-btn" @click="closeTokenResults">
      Collect
    </button>
  </div>
</Transition>
```

**Step 2: Import getItem helper**

```javascript
import { getItem, getTokenForRegion } from '../data/items.js'
```

**Step 3: Add styles for token results modal and use token button**

```css
/* Use Token Button */
.use-token-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.use-token-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.use-token-btn:disabled {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Token Results Modal */
.token-results-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
}

.token-results-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 360px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 20px;
  z-index: 301;
}

.token-results-header {
  text-align: center;
  margin-bottom: 20px;
}

.token-results-header h3 {
  margin: 0 0 4px 0;
  color: #a78bfa;
  font-size: 1.1rem;
}

.token-node-name {
  color: #9ca3af;
  font-size: 0.9rem;
}

.token-currency-rewards {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.currency-icon {
  font-size: 1.2rem;
}

.currency-value {
  font-weight: 700;
  color: #f3f4f6;
}

.token-item-drops h4 {
  margin: 0 0 12px 0;
  color: #9ca3af;
  font-size: 0.85rem;
  text-align: center;
}

.token-items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.token-item {
  background: rgba(55, 65, 81, 0.5);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  color: #d1d5db;
  font-size: 0.85rem;
}

.item-count {
  color: #22c55e;
  font-weight: 600;
}

.no-items-dropped {
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  padding: 12px;
}

.collect-btn {
  width: 100%;
  margin-top: 20px;
  padding: 14px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.collect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}
```

**Step 4: Commit**

```bash
git add src/screens/WorldMapScreen.vue
git commit -m "feat(map): add token results modal"
```

---

### Task 6: Test and Verify

**Step 1: Run build to verify no errors**

```bash
npm run build
```

**Step 2: Manual testing checklist**

- [ ] Token items appear in items.js with correct properties
- [ ] Token drops appear in quest nodes for correct regions
- [ ] Use Token button appears on completed quest nodes
- [ ] Use Token button is disabled when no tokens available
- [ ] Using token consumes it and shows results modal
- [ ] Results modal shows correct gold/gems/exp/items
- [ ] Collect button closes modal and clears selection

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete auto-collect tokens feature"
```

---

## Summary

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add token item definitions | `feat(items): add region token items for auto-collect` |
| 2 | Add collectWithToken to quests store | `feat(quests): add collectWithToken function for token auto-collect` |
| 3 | Add token drops to quest nodes | `feat(quests): add token drops to quest nodes` |
| 4 | Add Use Token button to WorldMapScreen | `feat(map): add Use Token button for completed quests` |
| 5 | Add token results modal | `feat(map): add token results modal` |
| 6 | Test and verify | `feat: complete auto-collect tokens feature` |

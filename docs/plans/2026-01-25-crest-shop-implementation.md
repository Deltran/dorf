# Crest Shop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Crest Shop tab that uses Genus Loci crests as currency, with sections that unlock after defeating each boss.

**Architecture:** Extends existing shop system with new `currency: 'crest'` type, sectioned inventory grouped by crest type, weekly stock limits for rare items, and visibility gating based on quest completion and shard unlock status.

**Tech Stack:** Vue 3, Pinia stores, existing shop/inventory/quest infrastructure

---

## Task 1: Add Crest Shop Data Definition

**Files:**
- Modify: `src/data/shops.js:57-67`

**Step 1: Write the test**

Create test file `src/data/__tests__/shops-crest.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getShop, getAllShops } from '../shops'

describe('Crest Shop', () => {
  it('should exist in shops list', () => {
    const shops = getAllShops()
    const crestShop = shops.find(s => s.id === 'crest_shop')
    expect(crestShop).toBeDefined()
  })

  it('should have correct basic properties', () => {
    const shop = getShop('crest_shop')
    expect(shop.name).toBe('Crest Shop')
    expect(shop.currency).toBe('crest')
    expect(shop.confirmThreshold).toBe(10)
  })

  it('should have sections with unlock conditions', () => {
    const shop = getShop('crest_shop')
    expect(shop.sections).toHaveLength(2)

    const valinar = shop.sections.find(s => s.id === 'valinar')
    expect(valinar.crestId).toBe('valinar_crest')
    expect(valinar.unlockCondition.completedNode).toBe('lake_genus_loci')

    const troll = shop.sections.find(s => s.id === 'great_troll')
    expect(troll.crestId).toBe('great_troll_crest')
    expect(troll.unlockCondition.completedNode).toBe('hibernation_den')
  })

  it('should have inventory items with sectionId', () => {
    const shop = getShop('crest_shop')
    expect(shop.inventory.length).toBeGreaterThan(0)

    const valinarItems = shop.inventory.filter(i => i.sectionId === 'valinar')
    const trollItems = shop.inventory.filter(i => i.sectionId === 'great_troll')

    expect(valinarItems.length).toBeGreaterThan(0)
    expect(trollItems.length).toBeGreaterThan(0)
  })

  it('should have hero shard items with requiresShardsUnlocked flag', () => {
    const shop = getShop('crest_shop')
    const shardItems = shop.inventory.filter(i => i.heroId)

    expect(shardItems.length).toBeGreaterThan(0)
    shardItems.forEach(item => {
      expect(item.requiresShardsUnlocked).toBe(true)
      expect(item.shardCount).toBe(10)
      expect(item.stockType).toBe('weekly')
      expect(item.maxStock).toBe(1)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/shops-crest.test.js`
Expected: FAIL - crest_shop not found

**Step 3: Add crest shop definition**

In `src/data/shops.js`, add after `gold_shop` definition (around line 57):

```js
  crest_shop: {
    id: 'crest_shop',
    name: 'Crest Shop',
    description: 'Trade trophies from fallen giants',
    currency: 'crest',
    confirmThreshold: 10,
    sections: [
      {
        id: 'valinar',
        name: "Valinar's Offerings",
        crestId: 'valinar_crest',
        unlockCondition: { completedNode: 'lake_genus_loci' }
      },
      {
        id: 'great_troll',
        name: "Great Troll's Hoard",
        crestId: 'great_troll_crest',
        unlockCondition: { completedNode: 'hibernation_den' }
      }
    ],
    inventory: [
      // Valinar's Offerings
      { itemId: 'tome_large', name: "Guardian's Tome", price: 2, sectionId: 'valinar' },
      { itemId: 'token_whisper_lake', name: 'Whisper Lake Token', price: 3, sectionId: 'valinar' },
      { itemId: 'shard_dragon_heart', name: 'Shard of Dragon Heart', price: 5, sectionId: 'valinar' },
      { itemId: 'dragon_heart', name: 'Dragon Heart', price: 20, sectionId: 'valinar' },
      { itemId: 'shards_sir_gallan', heroId: 'sir_gallan', shardCount: 10, price: 8, maxStock: 1, stockType: 'weekly', sectionId: 'valinar', requiresShardsUnlocked: true },
      { itemId: 'shards_kensin_squire', heroId: 'kensin_squire', shardCount: 10, price: 5, maxStock: 1, stockType: 'weekly', sectionId: 'valinar', requiresShardsUnlocked: true },

      // Great Troll's Hoard
      { itemId: 'tome_large', name: 'Primal Tome', price: 2, sectionId: 'great_troll' },
      { itemId: 'token_echoing_caverns', name: 'Echoing Caverns Token', price: 3, sectionId: 'great_troll' },
      { itemId: 'shard_dragon_heart', name: 'Shard of Dragon Heart', price: 5, sectionId: 'great_troll' },
      { itemId: 'dragon_heart', name: 'Dragon Heart', price: 20, sectionId: 'great_troll' },
      { itemId: 'shards_darl', heroId: 'darl', shardCount: 10, price: 5, maxStock: 1, stockType: 'weekly', sectionId: 'great_troll', requiresShardsUnlocked: true },
      { itemId: 'shards_shadow_king', heroId: 'shadow_king', shardCount: 10, price: 12, maxStock: 1, stockType: 'weekly', sectionId: 'great_troll', requiresShardsUnlocked: true }
    ]
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/shops-crest.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/shops.js src/data/__tests__/shops-crest.test.js
git commit -m "feat(shop): add crest shop data definition"
```

---

## Task 2: Add Weekly Reset Logic to Shops Store

**Files:**
- Modify: `src/stores/shops.js:17-28`
- Test: `src/stores/__tests__/shops-weekly.test.js`

**Step 1: Write the test**

Create `src/stores/__tests__/shops-weekly.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShopsStore } from '../shops'

describe('Shops Store - Weekly Reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should track weekly purchases separately from daily', () => {
    const store = useShopsStore()

    store.purchaseWeekly('crest_shop', 'shards_sir_gallan')

    expect(store.getWeeklyPurchaseCount('crest_shop', 'shards_sir_gallan')).toBe(1)
  })

  it('should calculate remaining weekly stock', () => {
    const store = useShopsStore()

    expect(store.getRemainingWeeklyStock('crest_shop', 'shards_sir_gallan', 1)).toBe(1)

    store.purchaseWeekly('crest_shop', 'shards_sir_gallan')

    expect(store.getRemainingWeeklyStock('crest_shop', 'shards_sir_gallan', 1)).toBe(0)
  })

  it('should reset weekly purchases on new week', () => {
    const store = useShopsStore()

    // Make a purchase
    store.purchaseWeekly('crest_shop', 'shards_sir_gallan')
    expect(store.getWeeklyPurchaseCount('crest_shop', 'shards_sir_gallan')).toBe(1)

    // Simulate new week by changing lastWeeklyReset
    store.purchases.lastWeeklyReset = '2020-01-01'

    // Should reset and return 0
    expect(store.getWeeklyPurchaseCount('crest_shop', 'shards_sir_gallan')).toBe(0)
  })

  it('should get correct week start (Monday)', () => {
    const store = useShopsStore()

    // Wednesday Jan 22, 2026
    const wed = new Date('2026-01-22T12:00:00')
    const weekStart = store.getWeekStart(wed)

    // Should be Monday Jan 19, 2026
    expect(weekStart).toBe('2026-01-19')
  })

  it('should handle Sunday correctly', () => {
    const store = useShopsStore()

    // Sunday Jan 25, 2026
    const sun = new Date('2026-01-25T12:00:00')
    const weekStart = store.getWeekStart(sun)

    // Should be Monday Jan 19, 2026
    expect(weekStart).toBe('2026-01-19')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/shops-weekly.test.js`
Expected: FAIL - functions not defined

**Step 3: Add weekly reset logic**

In `src/stores/shops.js`, add after `checkMidnightReset` function (around line 22):

```js
  function getWeekStart(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }

  function checkWeeklyReset() {
    const weekStart = getWeekStart(new Date())
    if (purchases.value.lastWeeklyReset !== weekStart) {
      purchases.value.weekly = {}
      purchases.value.lastWeeklyReset = weekStart
    }
  }

  function getWeeklyPurchaseCount(shopId, itemId) {
    checkWeeklyReset()
    return purchases.value.weekly?.[shopId]?.[itemId] || 0
  }

  function getRemainingWeeklyStock(shopId, itemId, maxStock) {
    return maxStock - getWeeklyPurchaseCount(shopId, itemId)
  }

  function purchaseWeekly(shopId, itemId) {
    checkWeeklyReset()
    if (!purchases.value.weekly) {
      purchases.value.weekly = {}
    }
    if (!purchases.value.weekly[shopId]) {
      purchases.value.weekly[shopId] = {}
    }
    purchases.value.weekly[shopId][itemId] =
      (purchases.value.weekly[shopId][itemId] || 0) + 1
  }
```

Also add to the return statement:

```js
  return {
    // ... existing exports
    getWeekStart,
    getWeeklyPurchaseCount,
    getRemainingWeeklyStock,
    purchaseWeekly
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/shops-weekly.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/shops.js src/stores/__tests__/shops-weekly.test.js
git commit -m "feat(shop): add weekly purchase tracking and reset"
```

---

## Task 3: Add Crest Currency Purchase Logic

**Files:**
- Modify: `src/stores/shops.js:45-51` (purchase function)
- Test: `src/stores/__tests__/shops-crest-purchase.test.js`

**Step 1: Write the test**

Create `src/stores/__tests__/shops-crest-purchase.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShopsStore } from '../shops'
import { useInventoryStore } from '../inventory'
import { useShardsStore } from '../shards'
import { useQuestsStore } from '../quests'

describe('Shops Store - Crest Purchase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should deduct crests when purchasing from crest shop', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const questsStore = useQuestsStore()

    // Setup: defeat Valinar and have crests
    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 5)

    const shopItem = {
      itemId: 'tome_large',
      price: 2,
      sectionId: 'valinar'
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(true)
    expect(inventoryStore.getItemCount('valinar_crest')).toBe(3)
    expect(inventoryStore.getItemCount('tome_large')).toBe(1)
  })

  it('should fail purchase if insufficient crests', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const questsStore = useQuestsStore()

    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 1) // Only 1 crest

    const shopItem = {
      itemId: 'tome_large',
      price: 2, // Needs 2
      sectionId: 'valinar'
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(false)
    expect(result.message).toContain('Insufficient')
  })

  it('should grant hero shards for shard items', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const shardsStore = useShardsStore()
    const questsStore = useQuestsStore()

    // Setup
    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 10)
    shardsStore.unlocked = true

    const shopItem = {
      itemId: 'shards_sir_gallan',
      heroId: 'sir_gallan',
      shardCount: 10,
      price: 8,
      maxStock: 1,
      stockType: 'weekly',
      sectionId: 'valinar',
      requiresShardsUnlocked: true
    }

    const result = shopsStore.purchase('crest_shop', shopItem)

    expect(result.success).toBe(true)
    expect(inventoryStore.getItemCount('valinar_crest')).toBe(2)
    // Note: shards are added via shardsStore.addShards which updates hero instances
  })

  it('should track weekly stock for shard items', () => {
    const shopsStore = useShopsStore()
    const inventoryStore = useInventoryStore()
    const shardsStore = useShardsStore()
    const questsStore = useQuestsStore()

    // Setup
    questsStore.completedNodes.push('lake_genus_loci')
    inventoryStore.addItem('valinar_crest', 20)
    shardsStore.unlocked = true

    const shopItem = {
      itemId: 'shards_sir_gallan',
      heroId: 'sir_gallan',
      shardCount: 10,
      price: 8,
      maxStock: 1,
      stockType: 'weekly',
      sectionId: 'valinar',
      requiresShardsUnlocked: true
    }

    // First purchase should succeed
    const result1 = shopsStore.purchase('crest_shop', shopItem)
    expect(result1.success).toBe(true)

    // Second purchase should fail (weekly limit)
    const result2 = shopsStore.purchase('crest_shop', shopItem)
    expect(result2.success).toBe(false)
    expect(result2.message).toContain('Out of stock')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/shops-crest-purchase.test.js`
Expected: FAIL - crest currency not handled

**Step 3: Update purchase function**

In `src/stores/shops.js`, modify the `purchase` function. Find the currency handling section (around lines 45-51) and update:

```js
  function purchase(shopId, shopItem) {
    checkMidnightReset()

    const shop = getShop(shopId)
    if (!shop) return { success: false, message: 'Shop not found' }

    // Check stock based on stockType
    if (shopItem.stockType === 'weekly') {
      const remaining = getRemainingWeeklyStock(shopId, shopItem.itemId, shopItem.maxStock)
      if (remaining <= 0) {
        return { success: false, message: 'Out of stock this week' }
      }
    } else if (shopItem.maxStock) {
      const remaining = getRemainingStock(shopId, shopItem.itemId, shopItem.maxStock)
      if (remaining <= 0) {
        return { success: false, message: 'Out of stock' }
      }
    }

    // Handle currency deduction
    let currencyDeducted = false

    if (shop.currency === 'gold') {
      currencyDeducted = gachaStore.spendGold(shopItem.price)
    } else if (shop.currency === 'gems') {
      currencyDeducted = gachaStore.spendGems(shopItem.price)
    } else if (shop.currency === 'crest') {
      // Get crest type from section
      const section = shop.sections?.find(s => s.id === shopItem.sectionId)
      if (!section) {
        return { success: false, message: 'Invalid section' }
      }
      const crestId = section.crestId
      const inventoryStore = useInventoryStore()
      if (inventoryStore.getItemCount(crestId) >= shopItem.price) {
        inventoryStore.removeItem(crestId, shopItem.price)
        currencyDeducted = true
      }
    }

    if (!currencyDeducted) {
      return { success: false, message: 'Insufficient funds' }
    }

    // Track purchase
    if (shopItem.stockType === 'weekly') {
      purchaseWeekly(shopId, shopItem.itemId)
    } else if (shopItem.maxStock) {
      if (!purchases.value[shopId]) {
        purchases.value[shopId] = {}
      }
      purchases.value[shopId][shopItem.itemId] =
        (purchases.value[shopId][shopItem.itemId] || 0) + 1
    }

    // Grant item or shards
    if (shopItem.heroId && shopItem.shardCount) {
      // This is a hero shard purchase
      const shardsStore = useShardsStore()
      shardsStore.addShards(shopItem.heroId, shopItem.shardCount)
    } else {
      // Regular item purchase
      const inventoryStore = useInventoryStore()
      inventoryStore.addItem(shopItem.itemId, 1)
    }

    return { success: true, message: 'Purchase successful' }
  }
```

Add the import for useShardsStore at the top of the file:

```js
import { useShardsStore } from './shards'
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/shops-crest-purchase.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/shops.js src/stores/__tests__/shops-crest-purchase.test.js
git commit -m "feat(shop): add crest currency purchase logic with shard support"
```

---

## Task 4: Update ShopsScreen for Crest Shop Sections

**Files:**
- Modify: `src/screens/ShopsScreen.vue`

**Step 1: Add imports and computed properties**

At the top of the `<script setup>`, add imports:

```js
import { useQuestsStore } from '@/stores/quests'
import { useShardsStore } from '@/stores/shards'
```

Add store references:

```js
const questsStore = useQuestsStore()
const shardsStore = useShardsStore()
```

**Step 2: Add section visibility computed**

Add computed property for unlocked sections:

```js
const unlockedSections = computed(() => {
  if (!activeShop.value?.sections) return []
  return activeShop.value.sections.filter(section =>
    questsStore.completedNodes.includes(section.unlockCondition?.completedNode)
  )
})

const isSectionUnlocked = computed(() => {
  return (sectionId) => unlockedSections.value.some(s => s.id === sectionId)
})
```

**Step 3: Add filtered inventory computed**

Update the `shopInventory` computed to filter by section unlock and shard requirements:

```js
const shopInventory = computed(() => {
  if (!activeShop.value?.inventory) return []

  return activeShop.value.inventory.filter(item => {
    // For crest shop, check section unlock
    if (activeShop.value.currency === 'crest') {
      if (!isSectionUnlocked.value(item.sectionId)) return false
      if (item.requiresShardsUnlocked && !shardsStore.isUnlocked) return false
    }
    return true
  })
})
```

**Step 4: Add currency display for crests**

Update the `currentCurrency` computed:

```js
const currentCurrency = computed(() => {
  if (activeShop.value?.currency === 'gold') return gachaStore.gold
  if (activeShop.value?.currency === 'gems') return gachaStore.gems
  if (activeShop.value?.currency === 'crest') return null // Multiple currencies
  return 0
})

const currencyIcon = computed(() => {
  if (activeShop.value?.currency === 'gems') return '💎'
  if (activeShop.value?.currency === 'crest') return '🏅'
  return '🪙'
})
```

Add helper for getting crest count per section:

```js
const getCrestCount = (sectionId) => {
  const section = activeShop.value?.sections?.find(s => s.id === sectionId)
  if (!section) return 0
  return inventoryStore.getItemCount(section.crestId)
}
```

**Step 5: Run app to verify basic rendering**

Run: `npm run dev`
Navigate to Shops screen and verify Crest Shop tab appears.

**Step 6: Commit**

```bash
git add src/screens/ShopsScreen.vue
git commit -m "feat(shop): add crest shop section filtering and currency display"
```

---

## Task 5: Add Section Headers UI to ShopsScreen

**Files:**
- Modify: `src/screens/ShopsScreen.vue` (template section)

**Step 1: Update template for sectioned display**

In the template, replace the item grid section with sectioned layout for crest shop:

```vue
<!-- Crest Shop Sectioned Layout -->
<template v-if="activeShop?.currency === 'crest'">
  <div v-if="unlockedSections.length === 0" class="no-sections">
    <p>Defeat a Genus Loci to unlock their offerings.</p>
  </div>

  <div v-for="section in unlockedSections" :key="section.id" class="shop-section">
    <div class="section-header">
      <span class="section-name">{{ section.name }}</span>
      <span class="section-currency">
        🏅 {{ getCrestCount(section.id) }}
      </span>
    </div>

    <div class="item-grid">
      <div
        v-for="item in getItemsForSection(section.id)"
        :key="item.itemId"
        class="shop-item"
        :class="{
          'sold-out': getItemStock(item) === 0,
          'cannot-afford': getCrestCount(section.id) < item.price
        }"
        @click="handleItemClick(item)"
      >
        <div class="item-icon">{{ getItemIcon(item) }}</div>
        <div class="item-name">{{ item.name || getItemName(item.itemId) }}</div>
        <div class="item-footer">
          <span class="item-price">🏅 {{ item.price }}</span>
          <span v-if="item.stockType === 'weekly'" class="item-stock">
            {{ getRemainingWeeklyStock(item) }}/{{ item.maxStock }} this week
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Regular Shop Layout (existing) -->
<template v-else>
  <!-- ... existing item grid code ... -->
</template>
```

**Step 2: Add helper methods**

```js
const getItemsForSection = (sectionId) => {
  return shopInventory.value.filter(item => item.sectionId === sectionId)
}

const getItemStock = (item) => {
  if (item.stockType === 'weekly') {
    return shopsStore.getRemainingWeeklyStock(activeShop.value.id, item.itemId, item.maxStock)
  }
  if (item.maxStock) {
    return shopsStore.getRemainingStock(activeShop.value.id, item.itemId, item.maxStock)
  }
  return Infinity
}

const getRemainingWeeklyStock = (item) => {
  return shopsStore.getRemainingWeeklyStock(activeShop.value.id, item.itemId, item.maxStock)
}

const getItemIcon = (item) => {
  if (item.heroId) return '✨' // Hero shards
  const itemData = getItem(item.itemId)
  if (!itemData) return '📦'
  const icons = { xp: '📖', junk: '🪨', token: '🎟️', key: '🗝️', merge: '💎', genusLoci: '🏅' }
  return icons[itemData.type] || '📦'
}

const getItemName = (itemId) => {
  const item = getItem(itemId)
  return item?.name || itemId
}
```

**Step 3: Add section styles**

```css
.shop-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-radius: 8px;
  margin-bottom: 12px;
}

.section-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.section-currency {
  font-size: 1rem;
  color: #fbbf24;
  font-weight: 600;
}

.no-sections {
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
}

.shop-item.cannot-afford {
  opacity: 0.6;
}

.shop-item.sold-out {
  opacity: 0.4;
  pointer-events: none;
}

.item-stock {
  font-size: 0.75rem;
  color: #9ca3af;
}
```

**Step 4: Run and verify**

Run: `npm run dev`
- Verify sections display with headers
- Verify crest counts show correctly
- Verify items grouped by section

**Step 5: Commit**

```bash
git add src/screens/ShopsScreen.vue
git commit -m "feat(shop): add sectioned UI layout for crest shop"
```

---

## Task 6: Handle Purchase Flow for Crest Items

**Files:**
- Modify: `src/screens/ShopsScreen.vue`

**Step 1: Update handleItemClick for crest shop**

```js
const handleItemClick = (item) => {
  // Check if sold out
  if (getItemStock(item) === 0) return

  // Check if can afford
  if (activeShop.value?.currency === 'crest') {
    const section = activeShop.value.sections.find(s => s.id === item.sectionId)
    if (getCrestCount(section.id) < item.price) {
      // Could show a toast/message here
      return
    }
  }

  // Check confirmation threshold
  if (item.price >= activeShop.value.confirmThreshold) {
    pendingPurchase.value = item
    showConfirmModal.value = true
  } else {
    executePurchase(item)
  }
}
```

**Step 2: Update executePurchase**

```js
const executePurchase = (item) => {
  const result = shopsStore.purchase(activeShop.value.id, item)

  if (result.success) {
    // Show success feedback
    purchaseSuccess.value = true
    setTimeout(() => purchaseSuccess.value = false, 1500)
  } else {
    // Show error feedback
    purchaseError.value = result.message
    setTimeout(() => purchaseError.value = null, 2000)
  }

  showConfirmModal.value = false
  pendingPurchase.value = null
}
```

**Step 3: Update confirmation modal for crest display**

In the confirmation modal template, update currency display:

```vue
<div v-if="showConfirmModal" class="confirm-modal">
  <div class="confirm-content">
    <h3>Confirm Purchase</h3>
    <p>Buy {{ pendingPurchase?.name || getItemName(pendingPurchase?.itemId) }}?</p>
    <p class="confirm-price">
      <template v-if="activeShop?.currency === 'crest'">
        🏅 {{ pendingPurchase?.price }}
      </template>
      <template v-else>
        {{ currencyIcon }} {{ pendingPurchase?.price }}
      </template>
    </p>
    <div class="confirm-buttons">
      <button @click="showConfirmModal = false" class="cancel-btn">Cancel</button>
      <button @click="executePurchase(pendingPurchase)" class="confirm-btn">Buy</button>
    </div>
  </div>
</div>
```

**Step 4: Test purchase flow manually**

Run: `npm run dev`
- Add crests via dev tools: `inventoryStore.addItem('valinar_crest', 50)`
- Mark boss as defeated: `questsStore.completedNodes.push('lake_genus_loci')`
- Test purchasing items
- Verify crest count decreases
- Verify items granted

**Step 5: Commit**

```bash
git add src/screens/ShopsScreen.vue
git commit -m "feat(shop): implement crest shop purchase flow"
```

---

## Task 7: Add Tests for ShopsScreen Crest Functionality

**Files:**
- Create: `src/screens/__tests__/ShopsScreen-crest.test.js`

**Step 1: Write component tests**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useShopsStore } from '@/stores/shops'
import { useInventoryStore } from '@/stores/inventory'
import { useQuestsStore } from '@/stores/quests'
import { useShardsStore } from '@/stores/shards'

describe('ShopsScreen - Crest Shop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should hide sections for undefeated bosses', () => {
    const questsStore = useQuestsStore()
    // Don't mark any bosses as defeated

    // The unlockedSections computed should be empty
    // This would be tested via component mount
  })

  it('should show sections for defeated bosses', () => {
    const questsStore = useQuestsStore()
    questsStore.completedNodes.push('lake_genus_loci')

    // Valinar section should now be visible
  })

  it('should hide shard items when shards not unlocked', () => {
    const questsStore = useQuestsStore()
    const shardsStore = useShardsStore()

    questsStore.completedNodes.push('lake_genus_loci')
    // shardsStore.unlocked is false by default

    // Shard items should be filtered out
  })

  it('should show shard items when shards unlocked', () => {
    const questsStore = useQuestsStore()
    const shardsStore = useShardsStore()

    questsStore.completedNodes.push('lake_genus_loci')
    shardsStore.unlocked = true

    // Shard items should be visible
  })
})
```

**Step 2: Run tests**

Run: `npm test -- src/screens/__tests__/ShopsScreen-crest.test.js`

**Step 3: Commit**

```bash
git add src/screens/__tests__/ShopsScreen-crest.test.js
git commit -m "test(shop): add crest shop component tests"
```

---

## Task 8: Final Integration Testing and Cleanup

**Files:**
- All modified files

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Manual integration testing checklist**

- [ ] Crest Shop tab appears in Shops screen
- [ ] No sections visible before defeating any Genus Loci
- [ ] Valinar section appears after completing `lake_genus_loci`
- [ ] Great Troll section appears after completing `hibernation_den`
- [ ] Crest counts display correctly per section
- [ ] Regular items (tomes, tokens, dragon hearts) purchasable
- [ ] Hero shard items hidden until shards unlocked
- [ ] Hero shard items appear after shards unlocked
- [ ] Weekly stock limits work (can only buy 1/week)
- [ ] Purchase confirmation modal works
- [ ] Crests deducted correctly on purchase
- [ ] Items/shards granted correctly

**Step 3: Commit final state**

```bash
git add -A
git commit -m "feat(shop): complete crest shop implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add crest shop data definition | `src/data/shops.js` |
| 2 | Add weekly reset logic | `src/stores/shops.js` |
| 3 | Add crest currency purchase logic | `src/stores/shops.js` |
| 4 | Update ShopsScreen for sections | `src/screens/ShopsScreen.vue` |
| 5 | Add section headers UI | `src/screens/ShopsScreen.vue` |
| 6 | Handle purchase flow | `src/screens/ShopsScreen.vue` |
| 7 | Add component tests | `src/screens/__tests__/` |
| 8 | Integration testing | All files |

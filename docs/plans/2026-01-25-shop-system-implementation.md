# Shop System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a configurable shop system where players spend gold on items with daily stock limits that reset at midnight.

**Architecture:** Create shops data file defining inventory, a Pinia store tracking purchases and resets, a hub screen replacing "Store Room", and a shop screen with tabs and item grid.

**Tech Stack:** Vue 3 Composition API, Pinia stores, existing ItemCard styling patterns

---

## Task 1: Create Shop Definitions Data File

**Files:**
- Create: `src/data/shops.js`

**Step 1: Create the shops data file**

```js
// src/data/shops.js

export const shops = {
  gold_shop: {
    id: 'gold_shop',
    name: 'Gold Shop',
    description: 'Basic supplies for adventurers',
    currency: 'gold',
    confirmThreshold: 5000,
    inventory: [
      {
        itemId: 'tome_small',
        price: 100,
        maxStock: 5
      },
      {
        itemId: 'tome_medium',
        price: 400,
        maxStock: 3
      },
      {
        itemId: 'tome_large',
        price: 1000,
        maxStock: 1
      },
      {
        itemId: 'token_whispering_woods',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_whisper_lake',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_echoing_caverns',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_stormwind_peaks',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_blistering_cliffs',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_summit',
        price: 800,
        maxStock: 2
      }
    ]
  }
}

export function getShop(shopId) {
  return shops[shopId] || null
}

export function getAllShops() {
  return Object.values(shops)
}
```

**Step 2: Commit**

```bash
git add src/data/shops.js
git commit -m "feat(shops): add shop definitions data file

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Shops Store

**Files:**
- Create: `src/stores/shops.js`
- Modify: `src/stores/index.js`

**Step 1: Create the shops store**

```js
// src/stores/shops.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getShop } from '../data/shops.js'
import { getItem } from '../data/items.js'
import { useGachaStore } from './gacha.js'
import { useInventoryStore } from './inventory.js'

export const useShopsStore = defineStore('shops', () => {
  // State - tracks purchases: { shopId: { itemId: purchaseCount }, lastReset: 'YYYY-MM-DD' }
  const purchases = ref({})

  function getTodayDate() {
    return new Date().toISOString().split('T')[0]
  }

  function checkMidnightReset() {
    const today = getTodayDate()
    if (purchases.value.lastReset !== today) {
      purchases.value = { lastReset: today }
    }
  }

  function getRemainingStock(shopId, itemId, maxStock) {
    checkMidnightReset()
    const purchased = purchases.value[shopId]?.[itemId] || 0
    return maxStock - purchased
  }

  function purchase(shopId, shopItem) {
    checkMidnightReset()

    const shop = getShop(shopId)
    if (!shop) return { success: false, message: 'Shop not found' }

    const item = getItem(shopItem.itemId)
    if (!item) return { success: false, message: 'Item not found' }

    const remaining = getRemainingStock(shopId, shopItem.itemId, shopItem.maxStock)
    if (remaining <= 0) return { success: false, message: 'Sold out' }

    const gachaStore = useGachaStore()
    const inventoryStore = useInventoryStore()

    // Spend currency
    let spent = false
    if (shop.currency === 'gold') {
      spent = gachaStore.spendGold(shopItem.price)
    } else if (shop.currency === 'gems') {
      spent = gachaStore.spendGems(shopItem.price)
    }

    if (!spent) return { success: false, message: 'Insufficient funds' }

    // Track purchase
    if (!purchases.value[shopId]) {
      purchases.value[shopId] = {}
    }
    purchases.value[shopId][shopItem.itemId] =
      (purchases.value[shopId][shopItem.itemId] || 0) + 1

    // Grant item
    inventoryStore.addItem(shopItem.itemId, 1)

    return { success: true, message: 'Purchase successful' }
  }

  function getSecondsUntilReset() {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return Math.floor((midnight - now) / 1000)
  }

  // Persistence
  function saveState() {
    return { purchases: purchases.value }
  }

  function loadState(savedState) {
    if (savedState.purchases) {
      purchases.value = savedState.purchases
    }
    checkMidnightReset()
  }

  return {
    purchases,
    checkMidnightReset,
    getRemainingStock,
    purchase,
    getSecondsUntilReset,
    saveState,
    loadState
  }
})
```

**Step 2: Export from stores index**

In `src/stores/index.js`, add the export:

```js
export { useShopsStore } from './shops.js'
```

**Step 3: Commit**

```bash
git add src/stores/shops.js src/stores/index.js
git commit -m "feat(shops): add shops store with purchase tracking and midnight reset

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Shops to Save/Load System

**Files:**
- Modify: `src/utils/storage.js`
- Modify: `src/App.vue`

**Step 1: Update storage.js**

Bump `SAVE_VERSION` to 6 and add shops to save/load:

In the `saveGame` function, add `shops` parameter and save it:
```js
const SAVE_VERSION = 6

export function saveGame(stores) {
  const { heroes, gacha, quests, inventory, shards, genusLoci, explorations, shops } = stores

  const saveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    heroes: heroes.saveState(),
    gacha: gacha.saveState(),
    quests: quests.saveState(),
    inventory: inventory?.saveState() || { items: {} },
    shards: shards?.saveState() || { huntingSlots: [null, null, null, null, null], unlocked: false },
    genusLoci: genusLoci?.saveState() || { progress: {} },
    explorations: explorations?.saveState() || { activeExplorations: {}, completedHistory: [] },
    shops: shops?.saveState() || { purchases: {} }
  }
  // ... rest unchanged
}
```

In the `loadGame` function, add shops parameter and load it:
```js
export function loadGame(stores) {
  const { heroes, gacha, quests, inventory, shards, genusLoci, explorations, shops } = stores
  // ... existing code ...
  if (saveData.shops && shops) shops.loadState(saveData.shops)
  // ... rest unchanged
}
```

**Step 2: Update App.vue to include shops store**

Add import and use shops store, then include in save/load calls:

```js
import { useShopsStore } from './stores'

const shopsStore = useShopsStore()
```

Update the `loadGame` call in `onMounted`:
```js
loadGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore, genusLoci: genusLociStore, explorations: explorationsStore, shops: shopsStore })
```

Update the `saveGame` call in the watch:
```js
saveGame({ heroes: heroesStore, gacha: gachaStore, quests: questsStore, inventory: inventoryStore, shards: shardsStore, genusLoci: genusLociStore, explorations: explorationsStore, shops: shopsStore })
```

Add `shopsStore.purchases` to the watch array.

**Step 3: Commit**

```bash
git add src/utils/storage.js src/App.vue
git commit -m "feat(shops): integrate shops store with save/load system

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create GoodsAndMarketsScreen (Hub)

**Files:**
- Create: `src/screens/GoodsAndMarketsScreen.vue`

**Step 1: Create the hub screen**

```vue
<script setup>
import storeRoomBg from '../assets/backgrounds/store_room.png'

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="goods-markets-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'home')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Goods & Markets</h1>
      <div class="spacer"></div>
    </header>

    <div class="options-grid">
      <button
        class="option-card inventory-card"
        @click="emit('navigate', 'inventory')"
      >
        <div class="option-icon-wrapper inventory">
          <span class="option-icon">📦</span>
        </div>
        <div class="option-content">
          <span class="option-label">Inventory</span>
          <span class="option-hint">View and sell items</span>
        </div>
        <div class="option-arrow">›</div>
      </button>

      <button
        class="option-card shops-card"
        @click="emit('navigate', 'shops')"
      >
        <div class="option-icon-wrapper shops">
          <span class="option-icon">🏪</span>
        </div>
        <div class="option-content">
          <span class="option-label">Shops</span>
          <span class="option-hint">Buy items with gold</span>
        </div>
        <div class="option-arrow">›</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.goods-markets-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e3a5f 25%,
    #1e1b4b 50%,
    #1e3a5f 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.spacer {
  width: 80px;
}

/* Options Grid */
.options-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
  flex: 1;
  padding-top: 20px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.option-card:hover {
  border-color: #4b5563;
  transform: translateX(6px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.option-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-icon-wrapper.inventory {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.option-icon-wrapper.shops {
  background: linear-gradient(135deg, #854d0e 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.option-icon {
  font-size: 1.8rem;
}

.option-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.option-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #f3f4f6;
}

.option-hint {
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 2px;
}

.option-arrow {
  font-size: 1.5rem;
  color: #4b5563;
  transition: transform 0.3s ease, color 0.3s ease;
}

.option-card:hover .option-arrow {
  transform: translateX(4px);
  color: #6b7280;
}
</style>
```

**Step 2: Commit**

```bash
git add src/screens/GoodsAndMarketsScreen.vue
git commit -m "feat(shops): add GoodsAndMarketsScreen hub

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create ShopsScreen

**Files:**
- Create: `src/screens/ShopsScreen.vue`

**Step 1: Create the shops screen**

```vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShopsStore, useGachaStore, useInventoryStore } from '../stores'
import { getAllShops, getShop } from '../data/shops.js'
import { getItem } from '../data/items.js'
import StarRating from '../components/StarRating.vue'

const emit = defineEmits(['navigate'])

const shopsStore = useShopsStore()
const gachaStore = useGachaStore()
const inventoryStore = useInventoryStore()

const shops = getAllShops()
const activeShopId = ref(shops[0]?.id || null)
const purchaseMessage = ref(null)
const confirmingItem = ref(null)

const activeShop = computed(() => getShop(activeShopId.value))

const shopInventory = computed(() => {
  if (!activeShop.value) return []
  return activeShop.value.inventory.map(shopItem => {
    const item = getItem(shopItem.itemId)
    const remaining = shopsStore.getRemainingStock(
      activeShopId.value,
      shopItem.itemId,
      shopItem.maxStock
    )
    return {
      ...shopItem,
      item,
      remaining,
      soldOut: remaining <= 0
    }
  })
})

const currentCurrency = computed(() => {
  if (!activeShop.value) return 0
  if (activeShop.value.currency === 'gold') return gachaStore.gold
  if (activeShop.value.currency === 'gems') return gachaStore.gems
  return 0
})

const currencyIcon = computed(() => {
  if (!activeShop.value) return '🪙'
  return activeShop.value.currency === 'gems' ? '💎' : '🪙'
})

// Reset timer
const resetTimer = ref('')
let timerInterval = null

function updateResetTimer() {
  const seconds = shopsStore.getSecondsUntilReset()
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  resetTimer.value = `${hours}h ${minutes}m`
}

onMounted(() => {
  updateResetTimer()
  timerInterval = setInterval(updateResetTimer, 60000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function handleItemClick(shopItem) {
  if (shopItem.soldOut) return

  if (shopItem.price >= activeShop.value.confirmThreshold) {
    confirmingItem.value = shopItem
  } else {
    executePurchase(shopItem)
  }
}

function executePurchase(shopItem) {
  const result = shopsStore.purchase(activeShopId.value, shopItem)
  purchaseMessage.value = result

  if (result.success) {
    setTimeout(() => {
      purchaseMessage.value = null
    }, 1500)
  } else {
    setTimeout(() => {
      purchaseMessage.value = null
    }, 2500)
  }

  confirmingItem.value = null
}

function cancelConfirm() {
  confirmingItem.value = null
}

function typeIcon(type) {
  switch (type) {
    case 'xp': return '📖'
    case 'junk': return '🪨'
    case 'token': return '🎟️'
    case 'key': return '🗝️'
    default: return '📦'
  }
}
</script>

<template>
  <div class="shops-screen">
    <!-- Animated background -->
    <div class="bg-layer bg-gradient"></div>
    <div class="bg-layer bg-pattern"></div>
    <div class="bg-vignette"></div>

    <header class="screen-header">
      <button class="back-button" @click="emit('navigate', 'goodsAndMarkets')">
        <span class="back-arrow">‹</span>
        <span>Back</span>
      </button>
      <h1 class="screen-title">Shops</h1>
      <div class="currency-display">
        <span class="currency-icon">{{ currencyIcon }}</span>
        <span class="currency-count">{{ currentCurrency.toLocaleString() }}</span>
      </div>
    </header>

    <!-- Shop Tabs -->
    <div class="shop-tabs">
      <button
        v-for="shop in shops"
        :key="shop.id"
        :class="['shop-tab', { active: activeShopId === shop.id }]"
        @click="activeShopId = shop.id"
      >
        {{ shop.name }}
      </button>
    </div>

    <!-- Shop Info -->
    <div v-if="activeShop" class="shop-info">
      <div class="shop-name">{{ activeShop.name }}</div>
      <div class="shop-description">{{ activeShop.description }}</div>
      <div class="reset-timer">
        <span class="timer-icon">🕐</span>
        <span>Resets in {{ resetTimer }}</span>
      </div>
    </div>

    <!-- Item Grid -->
    <div class="item-grid">
      <div
        v-for="shopItem in shopInventory"
        :key="shopItem.itemId"
        :class="['shop-item', `rarity-${shopItem.item?.rarity || 1}`, { 'sold-out': shopItem.soldOut }]"
        @click="handleItemClick(shopItem)"
      >
        <div class="item-header">
          <span class="item-type-icon">{{ typeIcon(shopItem.item?.type) }}</span>
        </div>
        <div class="item-body">
          <div class="item-name">{{ shopItem.item?.name }}</div>
          <StarRating v-if="shopItem.item" :rating="shopItem.item.rarity" size="sm" />
        </div>
        <div class="item-footer">
          <div class="item-price">
            <span class="price-icon">{{ currencyIcon }}</span>
            <span class="price-value">{{ shopItem.price }}</span>
          </div>
          <div :class="['item-stock', { 'out': shopItem.soldOut }]">
            {{ shopItem.soldOut ? 'SOLD OUT' : `${shopItem.remaining} left` }}
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase Message -->
    <div v-if="purchaseMessage" :class="['purchase-message', purchaseMessage.success ? 'success' : 'error']">
      {{ purchaseMessage.message }}
    </div>

    <!-- Confirmation Modal -->
    <div v-if="confirmingItem" class="confirm-backdrop" @click="cancelConfirm">
      <div class="confirm-modal" @click.stop>
        <h3>Confirm Purchase</h3>
        <p>Buy <strong>{{ confirmingItem.item?.name }}</strong> for <strong>{{ confirmingItem.price }} {{ currencyIcon }}</strong>?</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="cancelConfirm">Cancel</button>
          <button class="confirm-btn" @click="executePurchase(confirmingItem)">Buy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shops-screen {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.bg-gradient {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #302a1f 25%,
    #1e1b4b 50%,
    #302a1f 75%,
    #0f172a 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.bg-pattern {
  opacity: 0.03;
  background-image:
    radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-vignette {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  z-index: -1;
}

/* Header */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #f3f4f6;
  border-color: #4b5563;
}

.back-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.screen-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
}

.currency-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #302a1f 0%, #1f2937 100%);
  padding: 10px 14px;
  border-radius: 24px;
  border: 1px solid #f59e0b33;
}

.currency-icon {
  font-size: 1rem;
}

.currency-count {
  font-size: 1rem;
  font-weight: 700;
  color: #f59e0b;
}

/* Shop Tabs */
.shop-tabs {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.shop-tab {
  padding: 10px 20px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shop-tab:hover {
  background: rgba(30, 41, 59, 0.8);
  color: #f3f4f6;
}

.shop-tab.active {
  background: linear-gradient(135deg, #854d0e 0%, #92400e 100%);
  border-color: #f59e0b;
  color: #f3f4f6;
}

/* Shop Info */
.shop-info {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.shop-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 4px;
}

.shop-description {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-bottom: 8px;
}

.reset-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #6b7280;
}

.timer-icon {
  font-size: 0.9rem;
}

/* Item Grid */
.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  position: relative;
  z-index: 1;
}

.shop-item {
  background: #1f2937;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  user-select: none;
}

.shop-item:hover:not(.sold-out) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.shop-item.sold-out {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Rarity borders */
.shop-item.rarity-1 { border-left: 3px solid #9ca3af; background: linear-gradient(135deg, #1f2937 0%, #262d36 100%); }
.shop-item.rarity-2 { border-left: 3px solid #22c55e; background: linear-gradient(135deg, #1f2937 0%, #1f3329 100%); }
.shop-item.rarity-3 { border-left: 3px solid #3b82f6; background: linear-gradient(135deg, #1f2937 0%, #1f2a3d 100%); }
.shop-item.rarity-4 { border-left: 3px solid #a855f7; background: linear-gradient(135deg, #1f2937 0%, #2a2340 100%); }
.shop-item.rarity-5 { border-left: 3px solid #f59e0b; background: linear-gradient(135deg, #1f2937 0%, #302a1f 100%); }

.item-header {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.item-type-icon {
  font-size: 1.4rem;
}

.item-body {
  text-align: center;
  margin-bottom: 8px;
}

.item-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.item-footer {
  text-align: center;
}

.item-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.price-icon {
  font-size: 0.9rem;
}

.price-value {
  font-weight: 700;
  color: #f59e0b;
  font-size: 0.9rem;
}

.item-stock {
  font-size: 0.7rem;
  color: #6b7280;
}

.item-stock.out {
  color: #ef4444;
  font-weight: 700;
}

/* Purchase Message */
.purchase-message {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  z-index: 100;
  animation: slideUp 0.3s ease;
}

.purchase-message.success {
  background: linear-gradient(135deg, #065f46 0%, #047857 100%);
  color: #d1fae5;
}

.purchase-message.error {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  color: #fecaca;
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

/* Confirmation Modal */
.confirm-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.confirm-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  text-align: center;
}

.confirm-modal h3 {
  color: #f3f4f6;
  margin: 0 0 12px 0;
}

.confirm-modal p {
  color: #9ca3af;
  margin: 0 0 20px 0;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(55, 65, 81, 0.5);
  color: #f3f4f6;
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #854d0e 0%, #f59e0b 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}
</style>
```

**Step 2: Commit**

```bash
git add src/screens/ShopsScreen.vue
git commit -m "feat(shops): add ShopsScreen with item grid and purchase flow

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Wire Up Navigation in App.vue

**Files:**
- Modify: `src/App.vue`

**Step 1: Import new screens**

Add imports at top of script:
```js
import GoodsAndMarketsScreen from './screens/GoodsAndMarketsScreen.vue'
import ShopsScreen from './screens/ShopsScreen.vue'
```

**Step 2: Add screen components in template**

Add after InventoryScreen:
```vue
<GoodsAndMarketsScreen
  v-else-if="currentScreen === 'goodsAndMarkets'"
  @navigate="navigate"
/>
<ShopsScreen
  v-else-if="currentScreen === 'shops'"
  @navigate="navigate"
/>
```

**Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat(shops): wire up GoodsAndMarkets and Shops screens in App.vue

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update HomeScreen Navigation

**Files:**
- Modify: `src/screens/HomeScreen.vue`

**Step 1: Change Store Room button to navigate to goodsAndMarkets**

Find the store-room-button and change:
- Label from "Store Room" to "Goods & Markets"
- Navigate target from `'inventory'` to `'goodsAndMarkets'`
- Hint from "Items" to "Buy and sell"

Change:
```vue
<button
  class="room-button store-room-button"
  :style="{ backgroundImage: `url(${storeRoomBg})` }"
  @click="emit('navigate', 'goodsAndMarkets')"
>
  <div class="room-icon-wrapper store">
    <span class="room-icon">📦</span>
  </div>
  <span class="room-label">Goods & Markets</span>
  <span class="room-hint">Buy and sell</span>
</button>
```

**Step 2: Commit**

```bash
git add src/screens/HomeScreen.vue
git commit -m "feat(shops): update Home screen button to Goods & Markets hub

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update InventoryScreen Back Navigation

**Files:**
- Modify: `src/screens/InventoryScreen.vue`

**Step 1: Change back button to navigate to goodsAndMarkets**

Find the back-button and change the navigate target from `'home'` to `'goodsAndMarkets'`:
```vue
<button class="back-button" @click="emit('navigate', 'goodsAndMarkets')">
```

**Step 2: Commit**

```bash
git add src/screens/InventoryScreen.vue
git commit -m "feat(shops): update Inventory back navigation to Goods & Markets

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Manual Testing

**Step 1: Run the app**

```bash
npm run dev
```

**Step 2: Test the flow**

1. Click "Goods & Markets" on home screen - should open hub
2. Click "Inventory" - should open inventory, back goes to hub
3. Click "Shops" from hub - should open shops screen
4. Verify Gold Shop shows items with prices and stock
5. Buy a cheap item (under 5000g) - should purchase instantly
6. Buy an expensive item (1000g tome) - should show confirmation
7. Verify stock decreases after purchase
8. Verify gold balance decreases
9. Verify item appears in inventory
10. Refresh page - verify purchases persist
11. Verify reset timer shows time until midnight

**Step 3: Commit any fixes if needed**

---

## Summary

The shop system is now fully implemented with:
- Shop data definitions (`src/data/shops.js`)
- Purchase tracking store with midnight reset (`src/stores/shops.js`)
- Hub screen for Inventory/Shops (`src/screens/GoodsAndMarketsScreen.vue`)
- Shop screen with item grid and purchase flow (`src/screens/ShopsScreen.vue`)
- Save/load persistence
- Updated navigation flow from Home → Goods & Markets → Shops/Inventory

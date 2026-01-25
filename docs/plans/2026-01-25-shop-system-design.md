# Shop System Design

## Overview

A configurable shop system where players can spend gold (and other currencies in the future) on items. Shops have limited daily stock that replenishes at midnight.

## Navigation Structure

**Home Screen Change:**
- "Store Room" button becomes "Goods and Markets"
- This is a hub screen with two options:
  - **Inventory** - Current inventory functionality (unchanged)
  - **Shops** - New shop system

**Screen Flow:**
```
Home → Goods and Markets → Inventory
                        → Shops → [Gold Shop tab] [Future tabs...]
```

## Shop Screen Layout

```
┌──────────────────────────────────┐
│  ←  Shops              💰 12500  │  ← Header with currency display
├──────────────────────────────────┤
│ [Gold Shop] [Gem Shop] [...]     │  ← Tabs (only Gold Shop initially)
├──────────────────────────────────┤
│  Gold Shop                       │
│  "Basic supplies for adventurers"│
│  🕐 Resets in 5h 23m             │  ← Countdown to midnight
├──────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │ Faded  │ │Knowledge│ │Ancient │ │
│ │ Tome   │ │ Tome   │ │ Codex  │ │
│ │ 100g   │ │ 400g   │ │ 1000g  │ │
│ │ 3 left │ │ 2 left │ │SOLD OUT│ │
│ └────────┘ └────────┘ └────────┘ │
│ ┌────────┐ ┌────────┐            │
│ │ Woods  │ │ Lake   │    ...     │  ← Region tokens
│ │ Token  │ │ Token  │            │
│ │ 800g   │ │ 800g   │            │
│ │ 1 left │ │SOLD OUT│            │
│ └────────┘ └────────┘            │
└──────────────────────────────────┘
```

**Item Cards Display:**
- Item icon/image (reuse ItemCard styling)
- Item name
- Price with currency icon
- Stock remaining OR "SOLD OUT" (greyed out, not tappable)

**Purchase Behavior:**
- Under confirmation threshold: Instant purchase with brief success flash
- Over threshold: Confirmation popup first
- Threshold is configurable per shop

## Data Structure

### Shop Definitions: `src/data/shops.js`

```js
export const shops = {
  gold_shop: {
    id: 'gold_shop',
    name: 'Gold Shop',
    description: 'Basic supplies for adventurers',
    currency: 'gold',                // 'gold' | 'gems' | itemId for future
    confirmThreshold: 5000,          // Show confirmation above this price
    inventory: [
      {
        itemId: 'tome_small',
        name: 'Faded Tome',
        description: 'A worn book of basic knowledge.',
        price: 100,
        maxStock: 5
      },
      {
        itemId: 'tome_medium',
        name: 'Knowledge Tome',
        description: 'A well-preserved collection of teachings.',
        price: 400,
        maxStock: 3
      },
      {
        itemId: 'tome_large',
        name: 'Ancient Codex',
        description: 'Centuries of wisdom bound in leather.',
        price: 1000,
        maxStock: 1
      },
      {
        itemId: 'token_whispering_woods',
        name: 'Whispering Woods Token',
        description: 'Instantly collect rewards from a completed quest.',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_whisper_lake',
        name: 'Whisper Lake Token',
        description: 'Instantly collect rewards from a completed quest.',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_echoing_caverns',
        name: 'Echoing Caverns Token',
        description: 'Instantly collect rewards from a completed quest.',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_stormwind_peaks',
        name: 'Stormwind Peaks Token',
        description: 'Instantly collect rewards from a completed quest.',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_blistering_cliffs',
        name: 'Blistering Cliffs Token',
        description: 'Instantly collect rewards from a completed quest.',
        price: 800,
        maxStock: 2
      },
      {
        itemId: 'token_summit',
        name: 'Summit Token',
        description: 'Instantly collect rewards from a completed quest.',
        price: 800,
        maxStock: 2
      }
    ]
  }
}
```

**Inventory Item Fields:**
- `itemId` - Links to items.js for granting on purchase
- `name` - Display name (can differ from items.js)
- `description` - Display description (can differ from items.js)
- `price` - Cost in the shop's currency
- `maxStock` - Daily limit, resets at midnight

**Pricing Convention:** Items cost 2x their sell value (configurable per item).

### Shop Store: `src/stores/shops.js`

```js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShopsStore = defineStore('shops', () => {
  // Tracks purchases: { shopId: { itemId: purchaseCount }, lastReset: 'YYYY-MM-DD' }
  const purchases = ref({})

  // Check and reset at midnight
  function checkMidnightReset() {
    const today = new Date().toISOString().split('T')[0]
    if (purchases.value.lastReset !== today) {
      purchases.value = { lastReset: today }
    }
  }

  function getRemainingStock(shopId, itemId, maxStock) {
    checkMidnightReset()
    const purchased = purchases.value[shopId]?.[itemId] || 0
    return maxStock - purchased
  }

  function purchase(shopId, itemId) {
    checkMidnightReset()
    if (!purchases.value[shopId]) {
      purchases.value[shopId] = {}
    }
    purchases.value[shopId][itemId] =
      (purchases.value[shopId][itemId] || 0) + 1
  }

  function getSecondsUntilReset() {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return Math.floor((midnight - now) / 1000)
  }

  return {
    purchases,
    checkMidnightReset,
    getRemainingStock,
    purchase,
    getSecondsUntilReset
  }
})
```

## Purchase Flow

1. Player taps item in shop
2. Check `getRemainingStock() > 0` (else show "Sold Out")
3. If price >= confirmThreshold, show confirmation popup
4. Check currency with `gachaStore.spendGold(price)` (or appropriate currency)
5. If successful:
   - Call `shopsStore.purchase(shopId, itemId)`
   - Call `inventoryStore.addItem(itemId, 1)`
   - Show success feedback (brief flash/animation)
6. If insufficient funds, show error message

## New Files

| File | Purpose |
|------|---------|
| `src/data/shops.js` | Shop definitions with inventory |
| `src/stores/shops.js` | Purchase tracking, midnight reset logic |
| `src/screens/GoodsAndMarketsScreen.vue` | Hub screen with Inventory/Shops options |
| `src/screens/ShopsScreen.vue` | Shop display with tabs, item grid, timer |

## App.vue Changes

- Add `'goodsAndMarkets'` and `'shops'` to screen navigation
- Update Home screen button: "Store Room" → "Goods and Markets"

## Future Extensibility

- **New shops:** Add to `shops` object with different `currency` (e.g., 'gems', or an itemId for item-based currency)
- **Unlimited stock:** Set `maxStock: null` or `maxStock: Infinity`
- **Different reset schedules:** Could add `resetSchedule` field per shop (weekly, monthly, never)

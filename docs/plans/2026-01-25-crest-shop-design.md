# Crest Shop Design

## Overview

A new shop tab where players spend Genus Loci crests on rare items. Each item requires a specific crest type. Sections unlock after defeating the corresponding boss.

## Shop Structure

The Crest Shop is a new tab in the existing Shops screen. Items are grouped by Genus Loci, with each section requiring that boss's crest as currency.

### Shop Definition (`src/data/shops.js`)

```js
crest_shop: {
  id: 'crest_shop',
  name: 'Crest Shop',
  description: 'Trade trophies from fallen giants',
  currency: 'crest',  // Special type indicating item-based currency per section
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

## Inventory Summary

### Valinar's Offerings

| Item | Price | Stock | Notes |
|------|-------|-------|-------|
| Guardian's Tome | 2 crests | Unlimited | XP tome (large) |
| Whisper Lake Token | 3 crests | Unlimited | Region auto-collect |
| Shard of Dragon Heart | 5 crests | Unlimited | Merge material (3★→4★) |
| Dragon Heart | 20 crests | Unlimited | Merge material (4★→5★) |
| Sir Gallan Shards (x10) | 8 crests | 1/week | Requires shards unlocked |
| Kensin Squire Shards (x10) | 5 crests | 1/week | Requires shards unlocked |

### Great Troll's Hoard

| Item | Price | Stock | Notes |
|------|-------|-------|-------|
| Primal Tome | 2 crests | Unlimited | XP tome (large) |
| Echoing Caverns Token | 3 crests | Unlimited | Region auto-collect |
| Shard of Dragon Heart | 5 crests | Unlimited | Merge material (3★→4★) |
| Dragon Heart | 20 crests | Unlimited | Merge material (4★→5★) |
| Darl Shards (x10) | 5 crests | 1/week | Requires shards unlocked |
| Shadow King Shards (x10) | 12 crests | 1/week | Requires shards unlocked |

## UI Layout

```
┌──────────────────────────────────────┐
│  ←  Shops                            │
├──────────────────────────────────────┤
│ [Gold Shop] [Crest Shop]             │
├──────────────────────────────────────┤
│  Crest Shop                          │
│  "Trade trophies from fallen giants" │
├──────────────────────────────────────┤
│  ▼ Valinar's Offerings    🏅 7       │
│  ┌────────┐ ┌────────┐ ┌────────┐    │
│  │Guardian│ │ Lake   │ │ Dragon │    │
│  │ Tome   │ │ Token  │ │ Shard  │    │
│  │ 🏅 2   │ │ 🏅 3   │ │ 🏅 5   │    │
│  └────────┘ └────────┘ └────────┘    │
│  ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ Dragon │ │Gallan  │ │Kensin  │    │
│  │ Heart  │ │Shards  │ │Shards  │    │
│  │ 🏅 20  │ │ 🏅 8   │ │ 🏅 5   │    │
│  │        │ │1/week  │ │1/week  │    │
│  └────────┘ └────────┘ └────────┘    │
├──────────────────────────────────────┤
│  ▼ Great Troll's Hoard   🏅 3        │
│  ...                                 │
└──────────────────────────────────────┘
```

**Section Headers:**
- Genus Loci name
- Current crest count for that type

**Item Cards:**
- Item icon/image
- Item name
- Price with crest icon
- Stock indicator for weekly items (e.g., "1/week", "SOLD OUT")

## Visibility Rules

| Condition | Behavior |
|-----------|----------|
| Genus Loci not defeated | Section hidden entirely |
| Shards not unlocked | Hero shard items hidden |
| Weekly stock exhausted | Item shows "SOLD OUT", greyed out |
| Insufficient crests | Item still visible, purchase blocked |

## Implementation

### Shop Store Changes (`src/stores/shops.js`)

Add weekly reset logic alongside existing daily reset:

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
  if (!purchases.value.weekly[shopId]) {
    purchases.value.weekly[shopId] = {}
  }
  purchases.value.weekly[shopId][itemId] =
    (purchases.value.weekly[shopId][itemId] || 0) + 1
}
```

### Purchase Flow

1. Player taps item in Crest Shop
2. Determine item's section via `sectionId`
3. Get required crest from section's `crestId`
4. Check stock:
   - Unlimited items: always available
   - Weekly items: `getRemainingWeeklyStock() > 0`
5. Check currency: `inventoryStore.getItemCount(crestId) >= price`
6. If price >= confirmThreshold (10), show confirmation popup
7. On confirm:
   - Deduct crests: `inventoryStore.removeItem(crestId, price)`
   - Grant item: `inventoryStore.addItem(itemId, 1)` or `shardsStore.addShards(heroId, shardCount)`
   - Track purchase: `purchaseWeekly()` for weekly items
8. Show success feedback

### ShopsScreen Changes

- Add "Crest Shop" tab
- Render sections with headers showing crest type and count
- Filter sections by unlock condition (`questsStore.completedNodes.includes(section.unlockCondition.completedNode)`)
- Filter hero shard items by `shardsStore.unlocked`
- Display weekly stock remaining on applicable items

## Files Modified

| File | Changes |
|------|---------|
| `src/data/shops.js` | Add `crest_shop` definition |
| `src/stores/shops.js` | Add weekly reset logic |
| `src/screens/ShopsScreen.vue` | Render sections, handle crest currency |

## Future Extensibility

- New Genus Loci bosses add new sections with their own crests
- Different stock types could be added (monthly, one-time)
- Section-specific themed items maintain boss identity

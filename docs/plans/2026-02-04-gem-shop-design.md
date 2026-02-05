# Gem Shop Design

## Overview

A daily rotating shop that offers 2 items for gems. Items are drawn from the player's pool of "accessible" drops based on quest progression.

## Core Mechanics

### Daily Slots
- **Cheap slot**: One random rarity 1-2 item
- **Expensive slot**: One random rarity 3+ item
- **Fallback**: If no rarity 3+ items available, show 2 cheap items instead

### Item Eligibility
Items are only eligible if they drop from quest nodes the player has completed:
- Check `questsStore.completedNodes`
- Gather all `itemDrops[].itemId` from those nodes
- Deduplicate into eligible item pool
- Split by rarity into cheap (1-2) and expensive (3+) pools

### Pricing Formula
```
price = sellReward × 3
```
- If sellReward is in gold, convert at 5 gold = 1 gem first
- Example: Faded Tome (50 gold sell) → 10 gem base → 30 gem price

### Daily Rotation
- Use current date string (e.g., `'2026-02-04'`) as seed for deterministic random
- Pure random selection, can repeat from previous day
- All players at same progression see same items

## Data Changes

### Missing sellReward Values (items.js)

Add `sellReward: { gems: X }` to these items:

| Item | Rarity | Sell Value (gems) | Shop Price |
|------|--------|-------------------|------------|
| lake_tower_key | 3 | 50 | 150 |
| valinar_crest | 4 | 150 | 450 |
| den_key | 3 | 50 | 150 |
| great_troll_crest | 4 | 150 | 450 |
| eruption_vent_key | 3 | 50 | 150 |
| pyroclast_crest | 4 | 150 | 450 |
| token_* (all) | 3 | 30 | 90 |
| common_*_* (tier 1) | 1 | 10 | 30 |
| uncommon_*_* (tier 2) | 2 | 25 | 75 |
| rare_*_* (tier 3) | 3 | 60 | 180 |
| epic_*_* (tier 4) | 4 | 150 | 450 |

## Store Implementation

### New Store: `gemShop.js`

```js
// State
const lastPurchaseDate = ref(null)  // 'YYYY-MM-DD'
const purchasedToday = ref([])      // [itemId, itemId]

// Computed
function getEligibleItems() {
  // Get completed nodes from questsStore
  // Gather all itemDrops from those nodes
  // Return deduplicated item list split by rarity
}

function getTodaysItems() {
  // Use date-seeded random to pick 1 cheap + 1 expensive
  // Return with calculated prices
}

function purchaseItem(itemId) {
  // Validate item is in today's selection
  // Validate not already purchased
  // Validate sufficient gems
  // Deduct gems, add item to inventory
  // Track in purchasedToday
}

// Persistence
function saveState() / loadState()
```

### Integration with storage.js
Add gemShop to the central save/load system.

## UI Implementation

### Location
New "Gem Shop" tab in ShopsScreen alongside:
- Gold Shop
- Crest Shop
- Laurel Shop
- Blacksmith

### Tab Styling
Blue/purple theme:
```css
.shop-tab.gem-tab {
  border-color: #8b5cf6;
}
.shop-tab.gem-tab.active {
  background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%);
  border-color: #a78bfa;
}
```

### Section Layout
- Header with gem balance display
- "Refreshes in Xh Ym" countdown timer
- Two item cards side by side
- Each card shows:
  - Item icon (based on type)
  - Item name
  - Rarity stars
  - Price in gems
  - Buy button (disabled if purchased/can't afford)
  - "SOLD" overlay if purchased today

### Background
Use `gem_shop_bg.png` with standard treatment:
- `background-size: contain`
- `background-position: center center`
- `background-repeat: no-repeat`
- `opacity: 0.6`
- Vignette overlay

## Files to Create/Modify

### Create
- `src/stores/gemShop.js` - New store for gem shop state

### Modify
- `src/data/items.js` - Add missing sellReward values
- `src/screens/ShopsScreen.vue` - Add Gem Shop tab and section
- `src/utils/storage.js` - Add gemShop to save/load
- `src/App.vue` - Add gemShop store to save/load calls

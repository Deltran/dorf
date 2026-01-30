# Black Market Summon Design

## Overview

A hidden premium gacha tab offering time-shifted access to monthly banners at double cost. Unlocks after 135 total pulls, revealing a shady underground dealer experience.

## What It Shows

Up to 3 banners (hidden if not defined):

| Slot | Source | Label |
|------|--------|-------|
| 1 | Previous month's monthly banner | "LAST MONTH" |
| 2 | Next month's monthly banner | "NEXT MONTH" |
| 3 | Random historical monthly banner (changes daily) | "VAULT" |

If a slot's banner doesn't exist, that slot is hidden. If no banners exist, show empty state with dealer text: *"Shelves are empty... check back later."*

## Economics

| Pull Type | Normal Cost | Black Market Cost |
|-----------|-------------|-------------------|
| Single | 100 gems | 200 gems |
| 10-pull | 900 gems | 1800 gems |

**Pity system:**
- Separate counter from normal gacha (persisted)
- Shared across all Black Market banners
- Same thresholds: 4-star at 10, soft pity at 50, hard pity at 90

## Unlock Experience

**Trigger:** `totalPulls >= 135`

**One-time tip popup:**
```js
black_market_unlock: {
  title: 'A Whisper in the Dark',
  message: "Psst... looking for something special? I've got wares you won't find on the regular shelves. Come find me.",
  anchor: 'black-market-tab'
}
```

**Behavior:**
- After any pull that brings `totalPulls` to 135+, show tip if not already seen
- Tab becomes visible simultaneously
- Once unlocked, always visible (no re-locking)

## Visual Design

### Background
- Deep dark purple/black gradient (darker than normal gacha)
- Subtle smoke/fog effect instead of twinkling stars
- More pronounced vignette - back alley feel

### Dealer Character
- Space reserved in upper-right corner for hooded goblin art
- Goblin clings to the top-most element
- Rotating flavor text:
  - *"These fell off a caravan, if you catch my meaning..."*
  - *"No refunds. No questions. No witnesses."*
  - *"You didn't get this from me."*
  - *"Premium goods for discerning customers..."*

### Banner Display
- Vertical stack (not horizontal carousel)
- Each banner card shows:
  - Banner name
  - Slot label (LAST MONTH / NEXT MONTH / VAULT)
  - Hero pool preview
- Empty slots don't render

### Pull Buttons
- Same layout as normal gacha
- Red/crimson accent instead of purple
- Cost prominently displayed

### Tab Styling
- Darker/moodier than normal Summon tab
- Subtle icon (hooded figure or moon)

## Data Model

### Banner Structure

Monthly banners include a `monthlySchedule` field:

```js
{
  id: 'flames_of_war_2026_01',
  name: 'Flames of War',
  description: 'A limited banner featuring offensive heroes.',
  permanent: false,
  monthlySchedule: {
    year: 2026,
    month: 1  // January (1-indexed)
  },
  heroPool: {
    5: ['shadow_king'],
    4: ['ember_witch', 'swift_arrow'],
    // ...
  }
}
```

Rotating banners (10-day cycle) do not have `monthlySchedule`.

### Helper Functions (banners.js)

```js
/**
 * Get banners available in the Black Market.
 * Returns 0-3 banners: last month, next month, random vault.
 */
export function getBlackMarketBanners() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const lastMonth = getMonthlyBanner(currentYear, currentMonth - 1)
  const nextMonth = getMonthlyBanner(currentYear, currentMonth + 1)
  const vault = getRandomVaultBanner(currentYear, currentMonth)

  return [
    lastMonth && { ...lastMonth, blackMarketSlot: 'last' },
    nextMonth && { ...nextMonth, blackMarketSlot: 'next' },
    vault && { ...vault, blackMarketSlot: 'vault' }
  ].filter(Boolean)
}

/**
 * Get monthly banner for a specific year/month.
 * Handles year wraparound.
 */
function getMonthlyBanner(year, month) {
  // Handle wraparound
  if (month < 1) { year--; month = 12 }
  if (month > 12) { year++; month = 1 }

  return banners.find(b =>
    b.monthlySchedule?.year === year &&
    b.monthlySchedule?.month === month
  )
}

/**
 * Get a random vault banner (seeded by day for daily rotation).
 * Excludes last month and next month.
 */
function getRandomVaultBanner(currentYear, currentMonth) {
  const excluded = new Set()

  // Exclude last and next month
  const lastKey = `${currentYear}-${currentMonth - 1}`
  const nextKey = `${currentYear}-${currentMonth + 1}`
  excluded.add(lastKey)
  excluded.add(nextKey)

  const candidates = banners.filter(b => {
    if (!b.monthlySchedule) return false
    const key = `${b.monthlySchedule.year}-${b.monthlySchedule.month}`
    return !excluded.has(key)
  })

  if (candidates.length === 0) return null

  // Seed random by day of year for daily rotation
  const dayOfYear = getDayOfYear()
  const index = dayOfYear % candidates.length
  return candidates[index]
}
```

### Gacha Store Additions

```js
// New persisted state
const blackMarketPullsSince4Star = ref(0)
const blackMarketPullsSince5Star = ref(0)
const blackMarketTotalPulls = ref(0)

// Computed
const blackMarketUnlocked = computed(() => totalPulls.value >= 135)

// Constants
const BLACK_MARKET_SINGLE_COST = 200
const BLACK_MARKET_TEN_COST = 1800

// Actions
function blackMarketSinglePull(bannerId) {
  if (gems.value < BLACK_MARKET_SINGLE_COST) return null
  gems.value -= BLACK_MARKET_SINGLE_COST
  // Use blackMarket pity counters, otherwise same logic
  // ...
}

function blackMarketTenPull(bannerId) {
  if (gems.value < BLACK_MARKET_TEN_COST) return null
  gems.value -= BLACK_MARKET_TEN_COST
  // ...
}

// Persistence additions
function loadState(savedState) {
  // ... existing ...
  if (savedState.blackMarketPullsSince4Star !== undefined)
    blackMarketPullsSince4Star.value = savedState.blackMarketPullsSince4Star
  if (savedState.blackMarketPullsSince5Star !== undefined)
    blackMarketPullsSince5Star.value = savedState.blackMarketPullsSince5Star
  if (savedState.blackMarketTotalPulls !== undefined)
    blackMarketTotalPulls.value = savedState.blackMarketTotalPulls
}

function saveState() {
  return {
    // ... existing ...
    blackMarketPullsSince4Star: blackMarketPullsSince4Star.value,
    blackMarketPullsSince5Star: blackMarketPullsSince5Star.value,
    blackMarketTotalPulls: blackMarketTotalPulls.value
  }
}
```

## Component Structure

### GachaScreen.vue Changes

- Add `activeTab` ref: `'summon'` | `'black-market'`
- Tab bar below header, Black Market tab hidden until `blackMarketUnlocked`
- Conditionally render content based on `activeTab`
- Trigger unlock tip when threshold crossed

### New: BlackMarketContent.vue

Responsibilities:
- Fetch banners from `getBlackMarketBanners()`
- Banner selection (separate from normal gacha)
- Dealer flavor text area with space for goblin art
- Vertical banner stack
- Pull buttons with doubled costs
- Pity display using `blackMarket*` counters
- Empty state handling

### Shared Components (Reused)

- `StarRating` - rarity display
- `HeroCard` - results display
- Results modal - same sequential reveal animation
- Pool modal - view banner contents

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/data/banners.js` | Add `monthlySchedule` field, `getBlackMarketBanners()` |
| `src/data/tips.js` | Add `black_market_unlock` tip |
| `src/stores/gacha.js` | Add Black Market pity state and pull actions |
| `src/screens/GachaScreen.vue` | Add tab system, trigger unlock tip |
| `src/components/BlackMarketContent.vue` | New component |

## Out of Scope

- Actual monthly banner definitions (added incrementally)
- Goblin dealer art asset (user-provided)

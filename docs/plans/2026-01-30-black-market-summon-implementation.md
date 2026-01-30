# Black Market Summon Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a hidden premium gacha tab with time-shifted monthly banner access at double cost.

**Architecture:** New tab in GachaScreen with separate pity tracking. Banner selection logic in banners.js determines which monthly banners appear (last month, next month, random vault). BlackMarketContent component handles the shady dealer UI.

**Tech Stack:** Vue 3, Pinia, Vitest

---

### Task 1: Banner Helper Functions

**Files:**
- Modify: `src/data/banners.js`
- Create: `src/data/__tests__/banners.test.js`

**Step 1: Write tests for getMonthlyBanner**

```js
// src/data/__tests__/banners.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getBlackMarketBanners, getMonthlyBanner, banners } from '../banners.js'

describe('getMonthlyBanner', () => {
  it('returns banner matching year and month', () => {
    // Assuming no monthly banners exist yet, this returns undefined
    const result = getMonthlyBanner(2026, 1)
    expect(result).toBeUndefined()
  })

  it('handles month wraparound to previous year', () => {
    const result = getMonthlyBanner(2026, 0) // Should look for Dec 2025
    expect(result).toBeUndefined() // No banner exists
  })

  it('handles month wraparound to next year', () => {
    const result = getMonthlyBanner(2025, 13) // Should look for Jan 2026
    expect(result).toBeUndefined()
  })
})

describe('getBlackMarketBanners', () => {
  it('returns empty array when no monthly banners exist', () => {
    const result = getBlackMarketBanners()
    expect(result).toEqual([])
  })

  it('filters out undefined slots', () => {
    const result = getBlackMarketBanners()
    expect(result.every(b => b !== undefined)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/data/__tests__/banners.test.js`
Expected: FAIL - functions not exported

**Step 3: Implement getMonthlyBanner and getBlackMarketBanners**

Add to `src/data/banners.js` after the existing exports:

```js
/**
 * Get monthly banner for a specific year/month.
 * Handles year wraparound.
 * @param {number} year
 * @param {number} month - 1-indexed (1 = January)
 * @returns {object|undefined}
 */
export function getMonthlyBanner(year, month) {
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
 * Excludes current month, last month, and next month.
 * @param {number} currentYear
 * @param {number} currentMonth
 * @returns {object|undefined}
 */
function getRandomVaultBanner(currentYear, currentMonth) {
  // Build set of excluded year-month keys
  const excluded = new Set()

  // Exclude current, last, and next month
  for (let offset = -1; offset <= 1; offset++) {
    let y = currentYear
    let m = currentMonth + offset
    if (m < 1) { y--; m = 12 }
    if (m > 12) { y++; m = 1 }
    excluded.add(`${y}-${m}`)
  }

  const candidates = banners.filter(b => {
    if (!b.monthlySchedule) return false
    const key = `${b.monthlySchedule.year}-${b.monthlySchedule.month}`
    return !excluded.has(key)
  })

  if (candidates.length === 0) return undefined

  // Seed random by day of year for daily rotation
  const dayOfYear = getDayOfYear()
  const index = dayOfYear % candidates.length
  return candidates[index]
}

/**
 * Get banners available in the Black Market.
 * Returns 0-3 banners: last month, next month, random vault.
 * @returns {Array}
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/data/__tests__/banners.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/data/banners.js src/data/__tests__/banners.test.js
git commit -m "feat(banners): add Black Market banner helper functions"
```

---

### Task 2: Gacha Store - Black Market State

**Files:**
- Modify: `src/stores/gacha.js`
- Modify: `src/stores/__tests__/gacha.test.js` (create if doesn't exist)

**Step 1: Write tests for Black Market state**

```js
// src/stores/__tests__/gacha-blackmarket.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGachaStore } from '../gacha.js'

describe('gacha store - black market state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has blackMarketUnlocked computed based on totalPulls', () => {
    const store = useGachaStore()
    expect(store.blackMarketUnlocked).toBe(false)
  })

  it('unlocks black market at 135 pulls', () => {
    const store = useGachaStore()
    store.loadState({ totalPulls: 135 })
    expect(store.blackMarketUnlocked).toBe(true)
  })

  it('persists black market pity counters', () => {
    const store = useGachaStore()
    store.loadState({
      blackMarketPullsSince4Star: 5,
      blackMarketPullsSince5Star: 20,
      blackMarketTotalPulls: 25
    })
    expect(store.blackMarketPullsSince4Star).toBe(5)
    expect(store.blackMarketPullsSince5Star).toBe(20)
    expect(store.blackMarketTotalPulls).toBe(25)
  })

  it('includes black market state in saveState', () => {
    const store = useGachaStore()
    store.loadState({
      blackMarketPullsSince4Star: 3,
      blackMarketPullsSince5Star: 10,
      blackMarketTotalPulls: 15
    })
    const saved = store.saveState()
    expect(saved.blackMarketPullsSince4Star).toBe(3)
    expect(saved.blackMarketPullsSince5Star).toBe(10)
    expect(saved.blackMarketTotalPulls).toBe(15)
  })

  it('exposes BLACK_MARKET costs', () => {
    const store = useGachaStore()
    expect(store.BLACK_MARKET_SINGLE_COST).toBe(200)
    expect(store.BLACK_MARKET_TEN_COST).toBe(1800)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/gacha-blackmarket.test.js`
Expected: FAIL - properties not defined

**Step 3: Add Black Market state to gacha store**

In `src/stores/gacha.js`, add after existing constants:

```js
// Black Market cost constants
const BLACK_MARKET_SINGLE_COST = 200
const BLACK_MARKET_TEN_COST = 1800
const BLACK_MARKET_UNLOCK_THRESHOLD = 135
```

Add after existing state refs:

```js
// Black Market state
const blackMarketPullsSince4Star = ref(0)
const blackMarketPullsSince5Star = ref(0)
const blackMarketTotalPulls = ref(0)
```

Add computed:

```js
const blackMarketUnlocked = computed(() => totalPulls.value >= BLACK_MARKET_UNLOCK_THRESHOLD)
```

Update `loadState`:

```js
if (savedState.blackMarketPullsSince4Star !== undefined)
  blackMarketPullsSince4Star.value = savedState.blackMarketPullsSince4Star
if (savedState.blackMarketPullsSince5Star !== undefined)
  blackMarketPullsSince5Star.value = savedState.blackMarketPullsSince5Star
if (savedState.blackMarketTotalPulls !== undefined)
  blackMarketTotalPulls.value = savedState.blackMarketTotalPulls
```

Update `saveState` return:

```js
blackMarketPullsSince4Star: blackMarketPullsSince4Star.value,
blackMarketPullsSince5Star: blackMarketPullsSince5Star.value,
blackMarketTotalPulls: blackMarketTotalPulls.value
```

Update the return statement to export new state:

```js
// State
blackMarketPullsSince4Star,
blackMarketPullsSince5Star,
blackMarketTotalPulls,
// Getters
blackMarketUnlocked,
// Constants
BLACK_MARKET_SINGLE_COST,
BLACK_MARKET_TEN_COST,
BLACK_MARKET_UNLOCK_THRESHOLD
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/gacha-blackmarket.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/gacha.js src/stores/__tests__/gacha-blackmarket.test.js
git commit -m "feat(gacha): add Black Market state and persistence"
```

---

### Task 3: Gacha Store - Black Market Pull Actions

**Files:**
- Modify: `src/stores/gacha.js`
- Modify: `src/stores/__tests__/gacha-blackmarket.test.js`

**Step 1: Write tests for Black Market pull actions**

Add to `src/stores/__tests__/gacha-blackmarket.test.js`:

```js
describe('gacha store - black market pulls', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('blackMarketSinglePull deducts 200 gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 500 })
    store.blackMarketSinglePull('standard')
    expect(store.gems).toBe(300)
  })

  it('blackMarketSinglePull returns null if insufficient gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 100 })
    const result = store.blackMarketSinglePull('standard')
    expect(result).toBeNull()
    expect(store.gems).toBe(100)
  })

  it('blackMarketSinglePull increments black market pity counters', () => {
    const store = useGachaStore()
    store.loadState({ gems: 500 })
    store.blackMarketSinglePull('standard')
    expect(store.blackMarketTotalPulls).toBe(1)
    expect(store.blackMarketPullsSince4Star).toBeGreaterThanOrEqual(0)
    expect(store.blackMarketPullsSince5Star).toBeGreaterThanOrEqual(0)
  })

  it('blackMarketTenPull deducts 1800 gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 2000 })
    store.blackMarketTenPull('standard')
    expect(store.gems).toBe(200)
  })

  it('blackMarketTenPull returns null if insufficient gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 1000 })
    const result = store.blackMarketTenPull('standard')
    expect(result).toBeNull()
    expect(store.gems).toBe(1000)
  })

  it('blackMarketTenPull returns array of 10 results', () => {
    const store = useGachaStore()
    store.loadState({ gems: 2000 })
    const results = store.blackMarketTenPull('standard')
    expect(results).toHaveLength(10)
  })

  it('black market pity is separate from normal pity', () => {
    const store = useGachaStore()
    store.loadState({ gems: 5000, pullsSince5Star: 50 })
    store.blackMarketSinglePull('standard')
    // Normal pity unchanged
    expect(store.pullsSince5Star).toBe(50)
    // Black market pity incremented
    expect(store.blackMarketPullsSince5Star).toBeGreaterThanOrEqual(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/gacha-blackmarket.test.js`
Expected: FAIL - functions not defined

**Step 3: Implement Black Market pull actions**

In `src/stores/gacha.js`, add helper for black market pity:

```js
// Internal: Calculate rates with Black Market pity
function getBlackMarketRatesWithPity(guarantee4Star = false) {
  const rates = { ...BASE_RATES }

  if (blackMarketPullsSince5Star.value >= HARD_PITY - 1) {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1.0 }
  }

  if (blackMarketPullsSince5Star.value >= SOFT_PITY_START) {
    const extraPulls = blackMarketPullsSince5Star.value - SOFT_PITY_START
    const bonus = extraPulls * SOFT_PITY_RATE_INCREASE
    rates[5] = Math.min(BASE_RATES[5] + bonus, 1.0)

    const totalReduction = rates[5] - BASE_RATES[5]
    const lowerTotal = rates[1] + rates[2] + rates[3]
    rates[1] -= totalReduction * (rates[1] / lowerTotal)
    rates[2] -= totalReduction * (rates[2] / lowerTotal)
    rates[3] -= totalReduction * (rates[3] / lowerTotal)
  }

  if (guarantee4Star || blackMarketPullsSince4Star.value >= FOUR_STAR_PITY - 1) {
    const lowRates = rates[1] + rates[2] + rates[3]
    rates[4] += lowRates * 0.9
    rates[5] += lowRates * 0.1
    rates[1] = 0
    rates[2] = 0
    rates[3] = 0
  }

  return rates
}

// Internal: Perform single Black Market pull
function performBlackMarketPull(bannerId, guarantee4Star = false) {
  const rates = getBlackMarketRatesWithPity(guarantee4Star)
  const rarity = rollRarity(rates)

  // Get hero from specified banner
  const banner = getBannerById(bannerId)
  let heroTemplate
  if (banner && banner.heroPool[rarity] && banner.heroPool[rarity].length > 0) {
    const heroIds = banner.heroPool[rarity]
    const heroId = heroIds[Math.floor(Math.random() * heroIds.length)]
    heroTemplate = getHeroTemplate(heroId)
  } else {
    heroTemplate = getHeroTemplatesByRarity(rarity)[Math.floor(Math.random() * getHeroTemplatesByRarity(rarity).length)]
  }

  // Update Black Market pity counters
  blackMarketPullsSince4Star.value++
  blackMarketPullsSince5Star.value++
  blackMarketTotalPulls.value++

  if (rarity >= 4) {
    blackMarketPullsSince4Star.value = 0
  }
  if (rarity >= 5) {
    blackMarketPullsSince5Star.value = 0
  }

  return heroTemplate
}
```

Add the public actions:

```js
function blackMarketSinglePull(bannerId) {
  if (gems.value < BLACK_MARKET_SINGLE_COST) return null

  gems.value -= BLACK_MARKET_SINGLE_COST

  const heroTemplate = performBlackMarketPull(bannerId)
  const heroesStore = useHeroesStore()
  const heroInstance = heroesStore.addHero(heroTemplate.id)

  return {
    template: heroTemplate,
    instance: heroInstance
  }
}

function blackMarketTenPull(bannerId) {
  if (gems.value < BLACK_MARKET_TEN_COST) return null

  gems.value -= BLACK_MARKET_TEN_COST

  const results = []
  const heroesStore = useHeroesStore()

  for (let i = 0; i < 10; i++) {
    const guarantee4Star = i === 9 && !results.some(r => r.template.rarity >= 4)
    const heroTemplate = performBlackMarketPull(bannerId, guarantee4Star)
    const heroInstance = heroesStore.addHero(heroTemplate.id)

    results.push({
      template: heroTemplate,
      instance: heroInstance
    })
  }

  return results
}
```

Add to return statement:

```js
blackMarketSinglePull,
blackMarketTenPull
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/gacha-blackmarket.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/gacha.js src/stores/__tests__/gacha-blackmarket.test.js
git commit -m "feat(gacha): add Black Market pull actions with separate pity"
```

---

### Task 4: Unlock Tip

**Files:**
- Modify: `src/data/tips.js`

**Step 1: Add the Black Market unlock tip**

```js
// Add to tips object in src/data/tips.js
black_market_unlock: {
  title: 'A Whisper in the Dark',
  message: "Psst... looking for something special? I've got wares you won't find on the regular shelves. Come find me.",
  anchor: 'black-market-tab'
}
```

**Step 2: Verify tip loads**

Run: `npm run dev` and check console for errors

**Step 3: Commit**

```bash
git add src/data/tips.js
git commit -m "feat(tips): add Black Market unlock tip"
```

---

### Task 5: GachaScreen Tab System

**Files:**
- Modify: `src/screens/GachaScreen.vue`

**Step 1: Add tab state and computed**

In `<script setup>`, add:

```js
import { useTipsStore } from '../stores'

const tipsStore = useTipsStore()

const activeTab = ref('summon')

// Check for unlock and show tip
watch(() => gachaStore.blackMarketUnlocked, (unlocked) => {
  if (unlocked) {
    tipsStore.showTip('black_market_unlock')
  }
}, { immediate: true })
```

**Step 2: Add tab bar to template**

After the header, before banner-area section:

```html
<div class="tab-bar">
  <button
    class="tab"
    :class="{ active: activeTab === 'summon' }"
    @click="activeTab = 'summon'"
  >
    Summon
  </button>
  <button
    v-if="gachaStore.blackMarketUnlocked"
    id="black-market-tab"
    class="tab tab-black-market"
    :class="{ active: activeTab === 'black-market' }"
    @click="activeTab = 'black-market'"
  >
    <span class="tab-icon">🌑</span>
    Black Market
  </button>
</div>
```

**Step 3: Wrap existing content in v-if**

Wrap all existing content (banner-area through pull-buttons) in:

```html
<template v-if="activeTab === 'summon'">
  <!-- existing summon content -->
</template>

<template v-else-if="activeTab === 'black-market'">
  <BlackMarketContent
    @pull-results="handleBlackMarketResults"
  />
</template>
```

**Step 4: Add tab bar styles**

```css
/* ===== Tab Bar ===== */
.tab-bar {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid #334155;
  border-radius: 10px;
  color: #9ca3af;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab:hover {
  background: rgba(55, 65, 81, 0.6);
  color: #d1d5db;
}

.tab.active {
  background: rgba(139, 92, 246, 0.2);
  border-color: #7c3aed;
  color: #c4b5fd;
}

.tab-black-market {
  background: rgba(20, 10, 30, 0.8);
  border-color: #4a1942;
}

.tab-black-market:hover {
  background: rgba(40, 20, 50, 0.8);
  border-color: #6b2158;
}

.tab-black-market.active {
  background: rgba(60, 20, 40, 0.6);
  border-color: #991b1b;
  color: #fca5a5;
}

.tab-icon {
  font-size: 1rem;
}
```

**Step 5: Import BlackMarketContent (placeholder)**

```js
import BlackMarketContent from '../components/BlackMarketContent.vue'
```

**Step 6: Add results handler**

```js
function handleBlackMarketResults(results) {
  pullResults.value = results
  showResults.value = true
}
```

**Step 7: Verify tabs render**

Run: `npm run dev` and navigate to Gacha screen

**Step 8: Commit**

```bash
git add src/screens/GachaScreen.vue
git commit -m "feat(gacha): add tab system for Black Market"
```

---

### Task 6: BlackMarketContent Component

**Files:**
- Create: `src/components/BlackMarketContent.vue`

**Step 1: Create the component**

```vue
<script setup>
import { ref, computed } from 'vue'
import { useGachaStore } from '../stores'
import { getBlackMarketBanners, getBannerImageUrl } from '../data/banners.js'
import { getHeroTemplate } from '../data/heroes/index.js'
import StarRating from './StarRating.vue'

const emit = defineEmits(['pull-results'])

const gachaStore = useGachaStore()

const selectedBannerId = ref(null)
const isAnimating = ref(false)

const blackMarketBanners = computed(() => getBlackMarketBanners())

const selectedBanner = computed(() => {
  if (!selectedBannerId.value) return blackMarketBanners.value[0] || null
  return blackMarketBanners.value.find(b => b.id === selectedBannerId.value)
})

const canSinglePull = computed(() =>
  gachaStore.gems >= gachaStore.BLACK_MARKET_SINGLE_COST && selectedBanner.value
)
const canTenPull = computed(() =>
  gachaStore.gems >= gachaStore.BLACK_MARKET_TEN_COST && selectedBanner.value
)

const dealerQuotes = [
  "These fell off a caravan, if you catch my meaning...",
  "No refunds. No questions. No witnesses.",
  "You didn't get this from me.",
  "Premium goods for discerning customers..."
]

const currentQuote = computed(() => {
  const index = Math.floor(Date.now() / 60000) % dealerQuotes.length
  return dealerQuotes[index]
})

const slotLabels = {
  last: 'LAST MONTH',
  next: 'NEXT MONTH',
  vault: 'VAULT'
}

const pityInfo = computed(() => ({
  pullsSince4Star: gachaStore.blackMarketPullsSince4Star,
  pullsSince5Star: gachaStore.blackMarketPullsSince5Star,
  until4StarPity: Math.max(0, gachaStore.FOUR_STAR_PITY - gachaStore.blackMarketPullsSince4Star),
  until5StarHardPity: Math.max(0, gachaStore.HARD_PITY - gachaStore.blackMarketPullsSince5Star),
  pity4Percent: Math.min(100, (gachaStore.blackMarketPullsSince4Star / gachaStore.FOUR_STAR_PITY) * 100),
  pity5HardPercent: Math.min(100, (gachaStore.blackMarketPullsSince5Star / gachaStore.HARD_PITY) * 100)
}))

function selectBanner(bannerId) {
  selectedBannerId.value = bannerId
}

async function doSinglePull() {
  if (!canSinglePull.value || isAnimating.value) return

  isAnimating.value = true
  await new Promise(r => setTimeout(r, 800))

  const result = gachaStore.blackMarketSinglePull(selectedBanner.value.id)
  if (result) {
    emit('pull-results', [result])
  }

  isAnimating.value = false
}

async function doTenPull() {
  if (!canTenPull.value || isAnimating.value) return

  isAnimating.value = true
  await new Promise(r => setTimeout(r, 1200))

  const results = gachaStore.blackMarketTenPull(selectedBanner.value.id)
  if (results) {
    emit('pull-results', results)
  }

  isAnimating.value = false
}

function getPoolPreview(banner) {
  if (!banner?.heroPool) return []
  const heroes5 = (banner.heroPool[5] || []).map(id => getHeroTemplate(id)).filter(Boolean)
  return heroes5.slice(0, 3)
}
</script>

<template>
  <div class="black-market">
    <!-- Dealer area with space for goblin art -->
    <div class="dealer-area">
      <div class="dealer-quote">
        <span class="quote-mark">"</span>
        {{ currentQuote }}
        <span class="quote-mark">"</span>
      </div>
      <!-- Space for goblin art in upper right -->
      <div class="goblin-space"></div>
    </div>

    <!-- Empty state -->
    <div v-if="blackMarketBanners.length === 0" class="empty-state">
      <p class="empty-text">Shelves are empty... check back later.</p>
    </div>

    <!-- Banner list -->
    <div v-else class="banner-list">
      <div
        v-for="banner in blackMarketBanners"
        :key="banner.id"
        class="banner-card"
        :class="{ selected: selectedBanner?.id === banner.id }"
        @click="selectBanner(banner.id)"
      >
        <div class="banner-slot-label">{{ slotLabels[banner.blackMarketSlot] }}</div>
        <div class="banner-info">
          <h3 class="banner-name">{{ banner.name }}</h3>
          <div class="banner-preview">
            <span
              v-for="hero in getPoolPreview(banner)"
              :key="hero.id"
              class="preview-hero"
            >
              {{ hero.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pity info -->
    <div class="pity-section" v-if="blackMarketBanners.length > 0">
      <div class="pity-header">
        <span class="pity-label">Black Market Pity</span>
      </div>
      <div class="pity-bars">
        <div class="pity-item">
          <span class="pity-text">4★: {{ pityInfo.pullsSince4Star }}/{{ gachaStore.FOUR_STAR_PITY }}</span>
          <div class="pity-bar">
            <div class="pity-fill pity-4" :style="{ width: pityInfo.pity4Percent + '%' }"></div>
          </div>
        </div>
        <div class="pity-item">
          <span class="pity-text">5★: {{ pityInfo.pullsSince5Star }}/{{ gachaStore.HARD_PITY }}</span>
          <div class="pity-bar">
            <div class="pity-fill pity-5" :style="{ width: pityInfo.pity5HardPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pull buttons -->
    <div class="pull-buttons" v-if="blackMarketBanners.length > 0">
      <button
        class="pull-button single"
        :disabled="!canSinglePull || isAnimating"
        @click="doSinglePull"
      >
        <div class="pull-content">
          <span class="pull-label">Single</span>
          <span class="pull-cost">
            <span class="cost-icon">💎</span>
            {{ gachaStore.BLACK_MARKET_SINGLE_COST }}
          </span>
        </div>
      </button>

      <button
        class="pull-button ten"
        :disabled="!canTenPull || isAnimating"
        @click="doTenPull"
      >
        <div class="pull-content">
          <span class="pull-label">10 Pull</span>
          <span class="pull-cost">
            <span class="cost-icon">💎</span>
            {{ gachaStore.BLACK_MARKET_TEN_COST }}
          </span>
        </div>
        <span class="pull-bonus">Guaranteed 4★+</span>
      </button>
    </div>

    <!-- Animation overlay -->
    <div v-if="isAnimating" class="animation-overlay">
      <div class="summon-effect">
        <div class="summon-ring ring-1"></div>
        <div class="summon-ring ring-2"></div>
        <div class="summon-core"></div>
      </div>
      <p class="summon-text">Summoning...</p>
    </div>
  </div>
</template>

<style scoped>
.black-market {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== Dealer Area ===== */
.dealer-area {
  position: relative;
  background: linear-gradient(135deg, rgba(20, 10, 30, 0.9) 0%, rgba(40, 15, 35, 0.9) 100%);
  border: 1px solid #4a1942;
  border-radius: 12px;
  padding: 20px;
  min-height: 80px;
}

.dealer-quote {
  color: #d4a5a5;
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 70%;
}

.quote-mark {
  color: #991b1b;
  font-size: 1.2rem;
}

.goblin-space {
  position: absolute;
  top: -20px;
  right: -10px;
  width: 100px;
  height: 100px;
  /* Space reserved for goblin art */
}

/* ===== Empty State ===== */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-text {
  color: #6b7280;
  font-style: italic;
}

/* ===== Banner List ===== */
.banner-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.banner-card {
  background: linear-gradient(135deg, rgba(30, 20, 40, 0.8) 0%, rgba(20, 10, 25, 0.8) 100%);
  border: 1px solid #4a1942;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-card:hover {
  border-color: #6b2158;
  transform: translateX(4px);
}

.banner-card.selected {
  border-color: #991b1b;
  background: linear-gradient(135deg, rgba(50, 20, 40, 0.9) 0%, rgba(30, 10, 25, 0.9) 100%);
  box-shadow: 0 0 20px rgba(153, 27, 27, 0.3);
}

.banner-slot-label {
  font-size: 0.65rem;
  color: #991b1b;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.banner-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.banner-name {
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.banner-preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-hero {
  font-size: 0.75rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
}

/* ===== Pity Section ===== */
.pity-section {
  background: rgba(20, 10, 30, 0.6);
  border: 1px solid #3a1232;
  border-radius: 10px;
  padding: 12px 16px;
}

.pity-header {
  margin-bottom: 10px;
}

.pity-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pity-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pity-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pity-text {
  font-size: 0.8rem;
  color: #d1d5db;
  min-width: 70px;
}

.pity-bar {
  flex: 1;
  height: 6px;
  background: #374151;
  border-radius: 3px;
  overflow: hidden;
}

.pity-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.pity-fill.pity-4 {
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
}

.pity-fill.pity-5 {
  background: linear-gradient(90deg, #991b1b 0%, #dc2626 100%);
}

/* ===== Pull Buttons ===== */
.pull-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.pull-button {
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #4a1942;
  background: linear-gradient(135deg, #2d1a2e 0%, #1a0f1a 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.pull-button:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: #991b1b;
  box-shadow: 0 6px 20px rgba(153, 27, 27, 0.4);
}

.pull-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pull-button.ten {
  border-color: #991b1b;
  background: linear-gradient(135deg, #3d1a2e 0%, #2a0f1a 100%);
}

.pull-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pull-label {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.pull-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.95rem;
  color: #60a5fa;
}

.cost-icon {
  font-size: 0.85rem;
}

.pull-bonus {
  font-size: 0.65rem;
  color: #fca5a5;
  background: rgba(220, 38, 38, 0.2);
  padding: 3px 8px;
  border-radius: 8px;
}

/* ===== Animation Overlay ===== */
.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.summon-effect {
  position: relative;
  width: 150px;
  height: 150px;
}

.summon-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 80px;
  height: 80px;
  border-color: #991b1b;
  animation: ringPulse 1.5s ease-in-out infinite;
}

.ring-2 {
  width: 120px;
  height: 120px;
  border-color: #dc2626;
  animation: ringPulse 1.5s ease-in-out infinite 0.2s;
}

@keyframes ringPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.5; }
}

.summon-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #dc2626 0%, #991b1b 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: corePulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 25px rgba(220, 38, 38, 0.6);
}

@keyframes corePulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

.summon-text {
  color: #fca5a5;
  font-size: 1.1rem;
  margin-top: 24px;
  letter-spacing: 2px;
}
</style>
```

**Step 2: Verify component renders**

Run: `npm run dev` and navigate to Gacha screen, click Black Market tab

**Step 3: Commit**

```bash
git add src/components/BlackMarketContent.vue
git commit -m "feat: add BlackMarketContent component with shady dealer UI"
```

---

### Task 7: Integration & Polish

**Files:**
- Modify: `src/screens/GachaScreen.vue`
- Modify: `src/stores/index.js` (if tipsStore not exported)

**Step 1: Ensure tipsStore is exported from stores index**

Check `src/stores/index.js` includes:
```js
export { useTipsStore } from './tips.js'
```

**Step 2: Test full flow**

1. Set `totalPulls` to 134 via dev tools or admin
2. Do one more pull
3. Verify unlock tip appears
4. Verify Black Market tab appears
5. Click tab, verify dealer UI loads
6. If banners exist, test pull flow

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Black Market Summon integration"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Banner helper functions (getBlackMarketBanners) |
| 2 | Gacha store - Black Market state & persistence |
| 3 | Gacha store - Black Market pull actions |
| 4 | Unlock tip in tips.js |
| 5 | GachaScreen tab system |
| 6 | BlackMarketContent component |
| 7 | Integration & polish |

**Total estimated commits:** 7

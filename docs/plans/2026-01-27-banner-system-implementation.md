# Banner System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multiple gacha banners with curated hero pools, date-driven rotation, and a banner selector UI.

**Architecture:** New `src/data/banners.js` defines banner configs with explicit hero pools and month-day schedules. Gacha store gains `selectedBannerId` and pulls from the selected banner's pool instead of the global `getHeroTemplatesByRarity()`. GachaScreen adds left/right arrow navigation between active banners with dynamic header and availability text.

**Tech Stack:** Vue 3, Pinia, Vitest, Vite glob imports

**Design doc:** `docs/plans/2026-01-27-banner-system-design.md`

---

### Task 1: Create banner data module with tests

**Files:**
- Create: `src/data/banners.js`
- Create: `src/data/__tests__/banners.test.js`

**Context:** The design doc specifies each banner as an object with `id`, `name`, `description`, `permanent`, `startMonth`/`startDay`/`endMonth`/`endDay`, and a `heroPool` keyed by rarity (1-5). A helper `getActiveBanners()` filters by current date. A helper `isDateInRange()` handles year-boundary wrapping. The standard banner is permanent and includes every hero.

**Step 1: Write failing tests**

Create `src/data/__tests__/banners.test.js`:

```js
import { describe, it, expect, vi, afterEach } from 'vitest'
import { banners, getActiveBanners, isDateInRange, getBannerById } from '../banners'

describe('banner data', () => {
  it('standard banner is permanent and has heroes at all 5 rarities', () => {
    const standard = banners.find(b => b.id === 'standard')
    expect(standard).toBeDefined()
    expect(standard.permanent).toBe(true)
    for (let r = 1; r <= 5; r++) {
      expect(standard.heroPool[r].length).toBeGreaterThan(0)
    }
  })

  it('standard banner includes every hero in the game', () => {
    const standard = banners.find(b => b.id === 'standard')
    const allHeroIds = Object.values(standard.heroPool).flat()
    // Should include at least all 18 heroes
    expect(allHeroIds.length).toBeGreaterThanOrEqual(18)
  })

  it('every banner has heroes at all 5 rarities', () => {
    for (const banner of banners) {
      for (let r = 1; r <= 5; r++) {
        expect(banner.heroPool[r]?.length, `${banner.id} missing rarity ${r}`).toBeGreaterThan(0)
      }
    }
  })

  it('getBannerById returns correct banner', () => {
    const standard = getBannerById('standard')
    expect(standard).toBeDefined()
    expect(standard.id).toBe('standard')
  })

  it('getBannerById returns undefined for unknown id', () => {
    expect(getBannerById('nonexistent')).toBeUndefined()
  })
})

describe('isDateInRange', () => {
  it('returns true when date is within non-wrapping range', () => {
    expect(isDateInRange(1, 5, 1, 1, 1, 15)).toBe(true)
  })

  it('returns false when date is outside non-wrapping range', () => {
    expect(isDateInRange(2, 1, 1, 1, 1, 15)).toBe(false)
  })

  it('returns true for start boundary', () => {
    expect(isDateInRange(1, 1, 1, 1, 1, 15)).toBe(true)
  })

  it('returns true for end boundary', () => {
    expect(isDateInRange(1, 15, 1, 1, 1, 15)).toBe(true)
  })

  it('handles year-boundary wrapping (Dec-Jan)', () => {
    // Dec 20 - Jan 5 range
    expect(isDateInRange(12, 25, 12, 20, 1, 5)).toBe(true)
    expect(isDateInRange(1, 3, 12, 20, 1, 5)).toBe(true)
    expect(isDateInRange(6, 15, 12, 20, 1, 5)).toBe(false)
  })
})

describe('getActiveBanners', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('always includes permanent banners', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15)) // June 15
    const active = getActiveBanners()
    expect(active.some(b => b.permanent)).toBe(true)
    vi.useRealTimers()
  })

  it('includes rotating banners when date is in range', () => {
    vi.useFakeTimers()
    // Find a non-permanent banner to test against
    const rotating = banners.find(b => !b.permanent)
    if (rotating) {
      // Set date to middle of banner's range
      vi.setSystemTime(new Date(2026, rotating.startMonth - 1, rotating.startDay))
      const active = getActiveBanners()
      expect(active.some(b => b.id === rotating.id)).toBe(true)
    }
    vi.useRealTimers()
  })

  it('excludes rotating banners when date is out of range', () => {
    vi.useFakeTimers()
    const rotating = banners.find(b => !b.permanent)
    if (rotating) {
      // Pick a month definitely outside the range
      const safeMonth = rotating.endMonth + 3 > 12
        ? rotating.endMonth - 3
        : rotating.endMonth + 3
      vi.setSystemTime(new Date(2026, safeMonth - 1, 15))
      const active = getActiveBanners()
      expect(active.some(b => b.id === rotating.id)).toBe(false)
    }
    vi.useRealTimers()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/__tests__/banners.test.js`
Expected: FAIL (module not found)

**Step 3: Implement banner data module**

Create `src/data/banners.js`:

```js
// Banner definitions
// Each banner has an explicit hero pool keyed by rarity (1-5).
// Every banner must have at least one hero per rarity tier.

export const banners = [
  {
    id: 'standard',
    name: 'Standard Banner',
    description: 'All heroes available.',
    permanent: true,
    heroPool: {
      5: ['aurora_the_dawn', 'shadow_king', 'yggra_world_root'],
      4: ['sir_gallan', 'ember_witch', 'lady_moonwhisper', 'swift_arrow'],
      3: ['town_guard', 'hedge_wizard', 'village_healer', 'wandering_bard'],
      2: ['militia_soldier', 'apprentice_mage', 'herb_gatherer', 'fennick'],
      1: ['farm_hand', 'street_urchin', 'beggar_monk', 'street_busker']
    }
  },
  {
    id: 'shields_of_valor',
    name: 'Shields of Valor',
    description: 'Defenders and protectors step forward.',
    permanent: false,
    startMonth: 1, startDay: 1,
    endMonth: 1, endDay: 15,
    heroPool: {
      5: ['aurora_the_dawn'],
      4: ['sir_gallan', 'lady_moonwhisper'],
      3: ['town_guard', 'village_healer'],
      2: ['militia_soldier', 'herb_gatherer'],
      1: ['beggar_monk', 'street_busker']
    }
  },
  {
    id: 'flames_of_war',
    name: 'Flames of War',
    description: 'Unleash destruction upon your enemies.',
    permanent: false,
    startMonth: 2, startDay: 1,
    endMonth: 2, endDay: 15,
    heroPool: {
      5: ['shadow_king'],
      4: ['ember_witch', 'swift_arrow'],
      3: ['hedge_wizard', 'wandering_bard'],
      2: ['apprentice_mage', 'fennick'],
      1: ['farm_hand', 'street_urchin']
    }
  },
  {
    id: 'natures_call',
    name: "Nature's Call",
    description: 'The wilds answer those who listen.',
    permanent: false,
    startMonth: 3, startDay: 1,
    endMonth: 3, endDay: 15,
    heroPool: {
      5: ['yggra_world_root'],
      4: ['lady_moonwhisper', 'swift_arrow'],
      3: ['village_healer', 'wandering_bard'],
      2: ['herb_gatherer', 'fennick'],
      1: ['beggar_monk', 'street_urchin']
    }
  }
]

/**
 * Check if a month-day falls within a date range.
 * Handles year-boundary wrapping (e.g., Dec 20 - Jan 5).
 */
export function isDateInRange(month, day, startMonth, startDay, endMonth, endDay) {
  const current = month * 100 + day
  const start = startMonth * 100 + startDay
  const end = endMonth * 100 + endDay

  if (start <= end) {
    return current >= start && current <= end
  }
  // Wraps around year boundary
  return current >= start || current <= end
}

/**
 * Get all currently active banners (permanent + in-range rotating).
 */
export function getActiveBanners() {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  return banners.filter(b => {
    if (b.permanent) return true
    return isDateInRange(month, day, b.startMonth, b.startDay, b.endMonth, b.endDay)
  })
}

/**
 * Get a banner by its ID.
 */
export function getBannerById(bannerId) {
  return banners.find(b => b.id === bannerId)
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/banners.test.js`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/data/banners.js src/data/__tests__/banners.test.js
git commit -m "feat: add banner data module with schedule helpers"
```

---

### Task 2: Modify gacha store to support banner selection

**Files:**
- Modify: `src/stores/gacha.js`
- Create: `src/stores/__tests__/gacha-banners.test.js`

**Context:** Currently `getRandomHeroOfRarity(rarity)` calls `getHeroTemplatesByRarity(rarity)` which returns ALL heroes of that rarity. We need to:
1. Add `selectedBannerId` ref (defaults to `'standard'`)
2. Add `activeBanners` computed (calls `getActiveBanners()`)
3. Add `selectedBanner` computed (returns full banner object)
4. Add `selectBanner(bannerId)` action
5. Modify `performPull` to accept a banner's hero pool and pick from it
6. Persist `selectedBannerId` in save/load

**Step 1: Write failing tests**

Create `src/stores/__tests__/gacha-banners.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGachaStore } from '../gacha'

describe('gacha banner support', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useGachaStore()
  })

  it('defaults selectedBannerId to standard', () => {
    expect(store.selectedBannerId).toBe('standard')
  })

  it('selectBanner changes selectedBannerId', () => {
    store.selectBanner('shields_of_valor')
    expect(store.selectedBannerId).toBe('shields_of_valor')
  })

  it('selectedBanner returns the full banner object', () => {
    expect(store.selectedBanner).toBeDefined()
    expect(store.selectedBanner.id).toBe('standard')
    expect(store.selectedBanner.heroPool).toBeDefined()
  })

  it('activeBanners always includes the standard banner', () => {
    expect(store.activeBanners.some(b => b.id === 'standard')).toBe(true)
  })

  it('singlePull returns a hero from the selected banner pool', () => {
    store.addGems(10000)
    // Pull from standard banner — any hero is valid
    const result = store.singlePull()
    expect(result).not.toBeNull()
    expect(result.template).toBeDefined()
    expect(result.template.id).toBeDefined()
  })

  it('tenPull returns 10 heroes from the selected banner pool', () => {
    store.addGems(10000)
    const results = store.tenPull()
    expect(results).not.toBeNull()
    expect(results.length).toBe(10)
  })

  it('persists selectedBannerId in saveState', () => {
    store.selectBanner('flames_of_war')
    const saved = store.saveState()
    expect(saved.selectedBannerId).toBe('flames_of_war')
  })

  it('restores selectedBannerId from loadState', () => {
    store.loadState({ selectedBannerId: 'natures_call' })
    expect(store.selectedBannerId).toBe('natures_call')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/stores/__tests__/gacha-banners.test.js`
Expected: FAIL (selectedBannerId not exported, etc.)

**Step 3: Modify gacha store**

In `src/stores/gacha.js`:

1. Add imports at top:
```js
import { getActiveBanners, getBannerById } from '../data/banners.js'
```

2. Inside the store, add state:
```js
const selectedBannerId = ref('standard')
```

3. Add computeds:
```js
const activeBanners = computed(() => getActiveBanners())
const selectedBanner = computed(() => getBannerById(selectedBannerId.value))
```

4. Add action:
```js
function selectBanner(bannerId) {
  selectedBannerId.value = bannerId
}
```

5. Modify `getRandomHeroOfRarity` to accept a hero pool:
```js
function getRandomHeroOfRarity(rarity) {
  const banner = getBannerById(selectedBannerId.value)
  if (banner && banner.heroPool[rarity] && banner.heroPool[rarity].length > 0) {
    const heroIds = banner.heroPool[rarity]
    const heroId = heroIds[Math.floor(Math.random() * heroIds.length)]
    return getHeroTemplate(heroId)
  }
  // Fallback to global pool
  const heroes = getHeroTemplatesByRarity(rarity)
  if (heroes.length === 0) {
    return getRandomHeroOfRarity(Math.max(1, rarity - 1))
  }
  return heroes[Math.floor(Math.random() * heroes.length)]
}
```

6. Update import to include `getHeroTemplate`:
```js
import { getHeroTemplatesByRarity, getHeroTemplate } from '../data/heroTemplates.js'
```

7. Add `selectedBannerId` to `saveState()`:
```js
function saveState() {
  return {
    gems: gems.value,
    gold: gold.value,
    pullsSince4Star: pullsSince4Star.value,
    pullsSince5Star: pullsSince5Star.value,
    totalPulls: totalPulls.value,
    selectedBannerId: selectedBannerId.value
  }
}
```

8. Add `selectedBannerId` to `loadState()`:
```js
if (savedState.selectedBannerId !== undefined) selectedBannerId.value = savedState.selectedBannerId
```

9. Add to return object:
```js
selectedBannerId,
activeBanners,
selectedBanner,
selectBanner,
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/stores/__tests__/gacha-banners.test.js`
Expected: All PASS

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All existing tests still pass

**Step 6: Commit**

```bash
git add src/stores/gacha.js src/stores/__tests__/gacha-banners.test.js
git commit -m "feat: add banner selection to gacha store"
```

---

### Task 3: Add availability display helpers

**Files:**
- Modify: `src/data/banners.js`
- Modify: `src/data/__tests__/banners.test.js`

**Context:** The design specifies three display modes:
- Permanent banners: "Always Available"
- Rotating banners: Date range like "Jan 1 - Jan 15"
- Near expiry (3 days or less): Countdown like "2 days remaining"

**Step 1: Write failing tests**

Add to `src/data/__tests__/banners.test.js`:

```js
import { getBannerAvailabilityText } from '../banners'

describe('getBannerAvailabilityText', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Always Available" for permanent banners', () => {
    const standard = banners.find(b => b.id === 'standard')
    expect(getBannerAvailabilityText(standard)).toBe('Always Available')
  })

  it('returns date range for rotating banners not near expiry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 2)) // Jan 2
    const banner = banners.find(b => b.id === 'shields_of_valor')
    const text = getBannerAvailabilityText(banner)
    expect(text).toBe('Jan 1 – Jan 15')
    vi.useRealTimers()
  })

  it('returns countdown when 3 or fewer days remaining', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 13)) // Jan 13 — 2 days until Jan 15
    const banner = banners.find(b => b.id === 'shields_of_valor')
    const text = getBannerAvailabilityText(banner)
    expect(text).toBe('2 days remaining')
    vi.useRealTimers()
  })

  it('returns "Last day!" when 0 days remaining', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // Jan 15 — last day
    const banner = banners.find(b => b.id === 'shields_of_valor')
    const text = getBannerAvailabilityText(banner)
    expect(text).toBe('Last day!')
    vi.useRealTimers()
  })

  it('returns "1 day remaining" on the day before end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 14)) // Jan 14
    const banner = banners.find(b => b.id === 'shields_of_valor')
    const text = getBannerAvailabilityText(banner)
    expect(text).toBe('1 day remaining')
    vi.useRealTimers()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/__tests__/banners.test.js`
Expected: FAIL (getBannerAvailabilityText not found)

**Step 3: Implement availability text helper**

Add to `src/data/banners.js`:

```js
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Get human-readable availability text for a banner.
 * - Permanent: "Always Available"
 * - Near expiry (≤3 days): "X days remaining" or "Last day!"
 * - Otherwise: "Jan 1 – Jan 15"
 */
export function getBannerAvailabilityText(banner) {
  if (banner.permanent) return 'Always Available'

  const now = new Date()
  const currentYear = now.getFullYear()

  // Calculate end date for this year's occurrence
  let endDate = new Date(currentYear, banner.endMonth - 1, banner.endDay)

  // If banner wraps year boundary and we're in the start portion (Dec side),
  // the end is in the next year
  if (banner.startMonth > banner.endMonth && now.getMonth() + 1 >= banner.startMonth) {
    endDate = new Date(currentYear + 1, banner.endMonth - 1, banner.endDay)
  }

  const diffMs = endDate - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Last day!'
  if (diffDays <= 3) {
    return diffDays === 1 ? '1 day remaining' : `${diffDays} days remaining`
  }

  const startStr = `${MONTH_NAMES[banner.startMonth - 1]} ${banner.startDay}`
  const endStr = `${MONTH_NAMES[banner.endMonth - 1]} ${banner.endDay}`
  return `${startStr} – ${endStr}`
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/__tests__/banners.test.js`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/data/banners.js src/data/__tests__/banners.test.js
git commit -m "feat: add banner availability display text helper"
```

---

### Task 4: Add banner header image loading

**Files:**
- Create: `src/assets/banners/standard.png` (placeholder)
- Modify: `src/data/banners.js`

**Context:** The design specifies header images in `src/assets/banners/{banner_id}.png`, loaded via Vite glob import. For now we just need the loading function — actual artwork is separate work. We'll create a simple placeholder image and the glob loader.

**Step 1: Create placeholder banner images**

Create minimal placeholder PNG files for each banner. Use a simple 1x1 pixel transparent PNG or a small colored rectangle. The actual artwork will be created separately.

```bash
# Create the banners directory
mkdir -p src/assets/banners
# Create placeholder files (1x1 transparent PNGs)
# We'll use ImageMagick or just copy a tiny PNG
```

Since we may not have ImageMagick, we can create the directory and add the image loader function that gracefully handles missing images.

**Step 2: Add image loader to banners.js**

Add to `src/data/banners.js`:

```js
const bannerImages = import.meta.glob('../assets/banners/*.png', { eager: true, import: 'default' })

/**
 * Get the header image URL for a banner.
 * Returns null if no image exists.
 */
export function getBannerImageUrl(bannerId) {
  const path = `../assets/banners/${bannerId}.png`
  return bannerImages[path] || null
}
```

**Step 3: Commit**

```bash
mkdir -p src/assets/banners
git add src/data/banners.js src/assets/banners/
git commit -m "feat: add banner image loader with glob import"
```

---

### Task 5: Update GachaScreen with banner selector UI

**Files:**
- Modify: `src/screens/GachaScreen.vue`

**Context:** The existing GachaScreen has a static "Standard Banner" / "Hero Summoning" header. We need to:
1. Import gacha store's new banner properties
2. Replace static banner content with dynamic content from `selectedBanner`
3. Add left/right arrow buttons to cycle between `activeBanners`
4. Show availability text below the banner header
5. Show banner header image when available

The pull buttons, animation, results modal, rates, and pity sections remain unchanged.

**Step 1: Update script section**

Add imports and reactive state:

```js
import { getBannerAvailabilityText, getBannerImageUrl } from '../data/banners.js'
```

Add computed properties:

```js
const activeBanners = computed(() => gachaStore.activeBanners)
const selectedBanner = computed(() => gachaStore.selectedBanner)
const bannerAvailability = computed(() => {
  if (!selectedBanner.value) return ''
  return getBannerAvailabilityText(selectedBanner.value)
})
const bannerImageUrl = computed(() => {
  if (!selectedBanner.value) return null
  return getBannerImageUrl(selectedBanner.value.id)
})
const currentBannerIndex = computed(() => {
  return activeBanners.value.findIndex(b => b.id === gachaStore.selectedBannerId)
})
```

Add navigation functions:

```js
function prevBanner() {
  const banners = activeBanners.value
  if (banners.length <= 1) return
  const idx = (currentBannerIndex.value - 1 + banners.length) % banners.length
  gachaStore.selectBanner(banners[idx].id)
}

function nextBanner() {
  const banners = activeBanners.value
  if (banners.length <= 1) return
  const idx = (currentBannerIndex.value + 1) % banners.length
  gachaStore.selectBanner(banners[idx].id)
}
```

**Step 2: Update banner-area template section**

Replace the existing `<section class="banner-area">` block with:

```html
<section class="banner-area">
  <div class="banner" :style="bannerImageUrl ? { backgroundImage: `url(${bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}">
    <div class="banner-glow"></div>
    <div class="banner-nav" v-if="activeBanners.length > 1">
      <button class="banner-arrow banner-arrow-left" @click="prevBanner">‹</button>
      <button class="banner-arrow banner-arrow-right" @click="nextBanner">›</button>
    </div>
    <div class="banner-content">
      <span class="banner-label">{{ selectedBanner?.name || 'Standard Banner' }}</span>
      <h2>{{ selectedBanner?.name || 'Hero Summoning' }}</h2>
      <p>{{ selectedBanner?.description || 'Call forth powerful heroes to join your party!' }}</p>
    </div>
    <div class="banner-stars">
      <span>✦</span><span>✦</span><span>✦</span>
    </div>
  </div>
  <div class="banner-availability">
    <span class="availability-text" :class="{ 'availability-urgent': bannerAvailability.includes('remaining') || bannerAvailability.includes('Last') }">
      {{ bannerAvailability }}
    </span>
    <div class="banner-dots" v-if="activeBanners.length > 1">
      <span
        v-for="(b, i) in activeBanners"
        :key="b.id"
        class="banner-dot"
        :class="{ active: i === currentBannerIndex }"
        @click="gachaStore.selectBanner(b.id)"
      ></span>
    </div>
  </div>
</section>
```

**Step 3: Add CSS for new elements**

Add these styles to the `<style scoped>` section:

```css
/* Banner navigation arrows */
.banner-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  pointer-events: none;
}

.banner-arrow {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f3f4f6;
  font-size: 1.8rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin: 0 8px;
  line-height: 1;
}

.banner-arrow:hover {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

/* Banner availability + dots row */
.banner-availability {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px 0;
}

.availability-text {
  font-size: 0.8rem;
  color: #9ca3af;
  letter-spacing: 0.5px;
}

.availability-text.availability-urgent {
  color: #f59e0b;
  font-weight: 600;
}

.banner-dots {
  display: flex;
  gap: 8px;
}

.banner-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-dot.active {
  background: #a78bfa;
  box-shadow: 0 0 6px rgba(167, 139, 250, 0.5);
}

.banner-dot:hover {
  background: #6b7280;
}
```

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (no test changes for UI, verified by existing suite)

**Step 5: Commit**

```bash
git add src/screens/GachaScreen.vue
git commit -m "feat: add banner selector UI to GachaScreen"
```

---

### Task 6: Persist selectedBannerId and bump save version

**Files:**
- Modify: `src/utils/storage.js`

**Context:** The gacha store now saves/loads `selectedBannerId`. The storage utility needs its save version bumped so existing saves trigger a migration warning (existing saves will work fine since `loadState` handles missing fields with `!== undefined` checks).

**Step 1: Bump save version**

In `src/utils/storage.js`, change:
```js
const SAVE_VERSION = 6  // Bump version for shops addition
```
to:
```js
const SAVE_VERSION = 7  // Bump version for banner system
```

**Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All pass

**Step 3: Commit**

```bash
git add src/utils/storage.js
git commit -m "chore: bump save version for banner system"
```

---

### Task 7: Final verification

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (baseline 363 + new banner tests)

**Step 2: Manual smoke check list**

Verify in browser (`npm run dev`):
- [ ] Gacha screen loads with Standard Banner selected
- [ ] Left/right arrows appear (if multiple banners active)
- [ ] Clicking arrows cycles banners
- [ ] Banner name and description update
- [ ] Availability text shows (Always Available for standard)
- [ ] Pull buttons still work
- [ ] Pity progress unchanged
- [ ] Results modal still works
- [ ] Dot indicators work

**Step 3: Final commit (if any fixes needed)**

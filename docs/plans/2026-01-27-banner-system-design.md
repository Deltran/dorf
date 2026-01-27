# Banner System Design

## Problem

The gacha screen has a single "Standard Banner" with all heroes in a unified pool. There's no variety, no reason to save gems strategically, and the summon screen feels static. Players have no choices beyond "pull or don't pull."

## Solution

Multiple banners with curated hero pools. A permanent standard banner stays always available. Rotating banners appear on a date-driven schedule with themed hero selections. Each banner has a custom header image and displays its availability dates.

## Banner Data Model

Each banner is a configuration object in `src/data/banners.js`:

```js
{
  id: 'shields_of_valor',
  name: 'Shields of Valor',
  description: 'Defenders and protectors step forward.',
  headerImage: shieldsOfValorBanner,   // imported from src/assets/banners/
  permanent: false,
  startDate: '2026-01-01',            // ISO date string
  endDate: '2026-01-15',              // ISO date string
  heroPool: {
    5: ['aurora_the_dawn'],
    4: ['sir_gallan', 'lady_moonwhisper'],
    3: ['kensin_squire', 'grandma_helga'],
    2: ['sorju_gate_guard', 'bertan_gatherer'],
    1: ['beggar_monk', 'street_busker']
  }
}
```

### Standard Banner

```js
{
  id: 'standard',
  name: 'Standard Banner',
  description: 'All heroes available.',
  headerImage: standardBanner,
  permanent: true,
  heroPool: {
    5: ['aurora_the_dawn', 'shadow_king', 'yggra_world_root'],
    4: ['sir_gallan', 'shasha_ember_witch', 'lady_moonwhisper', 'swift_arrow'],
    3: ['kensin_squire', 'knarly_zeek', 'grandma_helga', 'harl_the_handsom'],
    2: ['sorju_gate_guard', 'calisus', 'bertan_gatherer', 'fennick'],
    1: ['darl', 'street_urchin', 'beggar_monk', 'street_busker']
  }
}
```

### Constraints

- Every banner must have at least one hero per rarity (1-5 star). No empty rarity tiers.
- Hero pools are explicit — no dynamic filtering. Each banner hand-picks its heroes.
- Standard banner always includes every hero in the game.

## Banner Schedule

Rotating banners use real date ranges (`startDate` / `endDate`). A helper function returns active banners:

```js
export function getActiveBanners() {
  const now = new Date()
  return banners.filter(b => {
    if (b.permanent) return true
    const start = new Date(b.startDate)
    const end = new Date(b.endDate)
    return now >= start && now <= end
  })
}
```

New banner runs are added to the data file as entries with specific dates. Banner entries can reuse the same `id` with different date ranges to create recurring appearances.

## Availability Display

Each banner shows its availability on the summon screen:

- **Permanent banners:** "Always Available"
- **Rotating banners:** Date range, e.g., "Jan 1 – Jan 15"
- **Near expiry (3 days or less):** Countdown, e.g., "2 days remaining"

## Header Images

Located in `src/assets/banners/{banner_id}.png`. Loaded via Vite glob import:

```js
const bannerImages = import.meta.glob('../assets/banners/*.png', { eager: true, import: 'default' })

function getBannerImageUrl(bannerId) {
  const path = `../assets/banners/${bannerId}.png`
  return bannerImages[path] || null
}
```

Recommended size: match the existing GachaScreen header area width. The image displays in the current "Standard Banner" header position and swaps when the player selects a different banner.

## Pity System

**Shared pity.** One set of counters across all banners:
- `pullsSince4Star` — shared, resets on any 4+ star pull from any banner
- `pullsSince5Star` — shared, resets on any 5 star pull from any banner
- `totalPulls` — shared lifetime counter

Switching banners does not reset pity. Progress is never wasted.

## Gacha Store Changes

### New state
- `selectedBannerId` (ref) — which banner the player is currently pulling from

### Modified functions
- `performPull(bannerId)` — uses the banner's `heroPool` instead of the global template pool
  - Gets active banner by ID
  - Rolls rarity (unchanged logic)
  - Picks random hero from `banner.heroPool[rarity]` instead of `getHeroTemplatesByRarity(rarity)`
- `singlePull()` and `tenPull()` — read from `selectedBannerId`

### New exports
- `selectedBannerId` — for UI binding
- `selectBanner(bannerId)` — sets the active banner
- `activeBanners` — computed, calls `getActiveBanners()`
- `selectedBanner` — computed, returns the full banner object

## GachaScreen UI Changes

### Layout (minimal rework)
The existing screen layout is preserved. Changes:

1. **Header area** — The static "Standard Banner" / "Hero Summoning" title is replaced with the selected banner's `headerImage`. Banner name and description overlay on the image.

2. **Banner selector** — Left/right arrows (or dots) on the header to flip between active banners. Tapping switches `selectedBannerId`.

3. **Availability line** — Below the header, display "Always Available" or date range / countdown.

4. **Everything else unchanged** — Rates display, pity progress bars, pull buttons, animation, results modal all stay as-is. Pull buttons pull from the currently selected banner.

### Banner selector behavior
- On screen load, default to standard banner (or last selected)
- Arrows cycle through `activeBanners`
- Selected banner highlighted (dot indicator or border)
- Switching banner updates header image, description, and availability text

## File Summary

| File | Change |
|------|--------|
| `src/data/banners.js` | New — banner definitions, `getActiveBanners()` helper |
| `src/assets/banners/*.png` | New — header images per banner |
| `src/stores/gacha.js` | Modify — `selectedBannerId`, pull from banner pool, `activeBanners` computed |
| `src/screens/GachaScreen.vue` | Modify — banner selector, dynamic header image, availability display |

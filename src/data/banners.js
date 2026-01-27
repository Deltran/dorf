/**
 * Banner definitions for the gacha system.
 *
 * Each banner has a hero pool keyed by rarity (1-5) and is either
 * permanent (always available) or rotating (active during a date range).
 */

const bannerImages = import.meta.glob('../assets/banners/*.png', { eager: true, import: 'default' })

/**
 * Get the header image URL for a banner.
 * Returns null if no image exists.
 */
export function getBannerImageUrl(bannerId) {
  const path = `../assets/banners/${bannerId}.png`
  return bannerImages[path] || null
}

export const banners = [
  {
    id: 'standard',
    name: 'Standard Banner',
    description: 'The standard summoning banner featuring all available heroes.',
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
    description: 'A limited banner featuring defensive heroes who protect their allies.',
    permanent: false,
    startMonth: 1,
    startDay: 1,
    endMonth: 1,
    endDay: 15,
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
    description: 'A limited banner featuring offensive heroes who devastate their foes.',
    permanent: false,
    startMonth: 2,
    startDay: 1,
    endMonth: 2,
    endDay: 15,
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
    description: 'A limited banner featuring nature and support heroes in tune with the wild.',
    permanent: false,
    startMonth: 3,
    startDay: 1,
    endMonth: 3,
    endDay: 15,
    heroPool: {
      5: ['yggra_world_root'],
      4: ['lady_moonwhisper', 'swift_arrow'],
      3: ['village_healer', 'wandering_bard'],
      2: ['herb_gatherer', 'fennick'],
      1: ['beggar_monk', 'street_urchin']
    }
  }
]

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Check whether a given month/day falls within a date range.
 * Handles year-boundary wrapping (e.g., Dec 20 – Jan 5).
 *
 * @param {number} month - Current month (1-12)
 * @param {number} day - Current day (1-31)
 * @param {number} startMonth - Range start month
 * @param {number} startDay - Range start day
 * @param {number} endMonth - Range end month
 * @param {number} endDay - Range end day
 * @returns {boolean}
 */
export function isDateInRange(month, day, startMonth, startDay, endMonth, endDay) {
  const current = month * 100 + day
  const start = startMonth * 100 + startDay
  const end = endMonth * 100 + endDay

  if (start <= end) {
    // Normal range (no year wrap)
    return current >= start && current <= end
  }
  // Year-boundary wrapping (e.g., Dec 20 – Jan 5)
  return current >= start || current <= end
}

/**
 * Return all banners that are currently active.
 * Permanent banners are always included. Rotating banners are included
 * only when the current system date falls within their date range.
 *
 * @returns {Array} Active banner objects
 */
export function getActiveBanners() {
  const now = new Date()
  const month = now.getMonth() + 1 // getMonth() is 0-indexed
  const day = now.getDate()

  return banners.filter(banner => {
    if (banner.permanent) return true
    return isDateInRange(month, day, banner.startMonth, banner.startDay, banner.endMonth, banner.endDay)
  })
}

/**
 * Find a banner by its id.
 *
 * @param {string} bannerId
 * @returns {object|undefined}
 */
export function getBannerById(bannerId) {
  return banners.find(b => b.id === bannerId)
}

/**
 * Return human-readable availability text for a banner.
 *
 * Permanent banners always say "Always Available". Rotating banners
 * show a countdown when close to expiry, or a date range otherwise.
 *
 * @param {object} banner
 * @returns {string}
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

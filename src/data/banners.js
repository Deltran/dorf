/**
 * Banner definitions for the gacha system.
 *
 * Each banner has a hero pool keyed by rarity (1-5) and is either
 * permanent (always available) or rotating (cycles on a 10-day schedule).
 *
 * Rotating banners take turns in array order. With 3 rotating banners
 * and 10-day chunks, the cycle is 30 days. The active banner is
 * determined by: dayOfYear % (ROTATION_CHUNK_DAYS * rotatingCount).
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

/** Number of days each rotating banner is active before the next one starts. */
export const ROTATION_CHUNK_DAYS = 10

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
 * Get the day of the year (1-366) for a given date.
 * @param {Date} [date]
 * @returns {number}
 */
export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / (1000 * 60 * 60 * 24))
}

/**
 * Return all banners that are currently active.
 * The standard banner is always active. Exactly one rotating banner
 * is active at any time, determined by a 10-day rotation cycle.
 *
 * @returns {Array} Active banner objects
 */
export function getActiveBanners() {
  const rotatingBanners = banners.filter(b => !b.permanent)
  const cycleLength = ROTATION_CHUNK_DAYS * rotatingBanners.length
  const dayOfYear = getDayOfYear()
  const cyclePosition = (dayOfYear - 1) % cycleLength
  const activeIndex = Math.floor(cyclePosition / ROTATION_CHUNK_DAYS)
  const activeRotating = rotatingBanners[activeIndex]

  return banners.filter(b => b.permanent || b.id === activeRotating.id)
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
 * Permanent banners say "Always Available". The active rotating banner
 * shows how many days remain in its 10-day window.
 *
 * @param {object} banner
 * @returns {string}
 */
export function getBannerAvailabilityText(banner) {
  if (banner.permanent) return 'Always Available'

  const rotatingBanners = banners.filter(b => !b.permanent)
  const cycleLength = ROTATION_CHUNK_DAYS * rotatingBanners.length
  const dayOfYear = getDayOfYear()
  const cyclePosition = (dayOfYear - 1) % cycleLength
  const positionInChunk = cyclePosition % ROTATION_CHUNK_DAYS
  const daysRemaining = ROTATION_CHUNK_DAYS - positionInChunk - 1

  if (daysRemaining <= 0) return 'Last day!'
  if (daysRemaining === 1) return '1 day remaining'
  return `${daysRemaining} days remaining`
}

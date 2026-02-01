/**
 * Banner definitions for the gacha system.
 *
 * Banner types:
 * - Permanent: Always available (permanent: true)
 * - Rotating: Cycle on a 10-day schedule (permanent: false, no date fields)
 * - Date-range: Active during specific dates (startMonth/startDay/endMonth/endDay)
 *
 * Rotating banners take turns in array order. With 3 rotating banners
 * and 10-day chunks, the cycle is 30 days. The active banner is
 * determined by: dayOfYear % (ROTATION_CHUNK_DAYS * rotatingCount).
 *
 * Date-range banners run alongside the rotation cycle during their window.
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
  },
  {
    id: 'musical_mayhem',
    name: 'Musical Mayhem',
    description: 'A cacophony of bardic talent! Featuring Cacophon and musical heroes.',
    permanent: false,
    monthlySchedule: { month: 2 },
    heroPool: {
      5: ['cacophon'],
      4: ['chroma', 'lady_moonwhisper'],
      3: ['wandering_bard', 'hedge_wizard', 'village_healer'],
      2: ['militia_soldier', 'apprentice_mage', 'herb_gatherer', 'fennick'],
      1: ['street_busker', 'farm_hand', 'street_urchin', 'beggar_monk']
    }
  },
  {
    id: 'civil_rights',
    name: 'Voices of Change',
    description: 'Heroes who stood firm against injustice. Featuring Rosara the Unmoved and allies.',
    permanent: false,
    monthlySchedule: { month: 1 },
    heroPool: {
      5: ['rosara_the_unmoved'],
      4: ['zina_the_desperate', 'sir_gallan'],
      3: ['vashek_the_unrelenting', 'town_guard', 'village_healer'],
      2: ['militia_soldier', 'herb_gatherer', 'fennick'],
      1: ['beggar_monk', 'street_urchin', 'farm_hand']
    }
  },
  {
    id: 'oriental_fighters',
    name: 'Oriental Fighters',
    description: 'Warriors from the East bring ancient techniques to battle. Featuring Onibaba and martial heroes.',
    permanent: false,
    monthlySchedule: { month: 3 },
    heroPool: {
      5: ['onibaba'],
      4: ['shinobi_jin', 'swift_arrow'],
      3: ['matsuda', 'town_guard', 'hedge_wizard'],
      2: ['militia_soldier', 'apprentice_mage', 'fennick'],
      1: ['farm_hand', 'street_urchin', 'beggar_monk']
    }
  },
  {
    id: 'golden_showers',
    name: 'Golden Showers',
    description: 'Roll the dice on fate itself! Featuring gambling heroes who thrive on risk and reward.',
    permanent: false,
    monthlySchedule: { month: 4 },
    heroPool: {
      5: ['fortuna_inversus'],
      4: ['copper_jack', 'sir_gallan'],
      3: ['bones_mccready', 'town_guard', 'village_healer'],
      2: ['militia_soldier', 'apprentice_mage', 'herb_gatherer', 'fennick'],
      1: ['farm_hand', 'street_urchin', 'beggar_monk', 'street_busker']
    }
  },
  {
    id: 'deplorable_companions',
    name: 'Deplorable Companions',
    description: 'Unlikely allies emerge from the shadows. Featuring anti-heroes, reluctant saviors, and those who found their own equilibrium with darkness.',
    permanent: false,
    monthlySchedule: { month: 5 },
    heroPool: {
      5: ['grandmother_rot'],
      4: ['penny_dreadful', 'zina_the_desperate'],
      3: ['the_grateful_dead', 'vashek_the_unrelenting', 'village_healer'],
      2: ['militia_soldier', 'herb_gatherer', 'fennick'],
      1: ['beggar_monk', 'street_urchin', 'farm_hand']
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
 * Check if a date is within a month-day range.
 * Handles year-boundary wrapping (e.g., Dec 20 – Jan 10).
 *
 * @param {number} month - Current month (1-12)
 * @param {number} day - Current day
 * @param {number} startMonth - Range start month (1-12)
 * @param {number} startDay - Range start day
 * @param {number} endMonth - Range end month (1-12)
 * @param {number} endDay - Range end day
 * @returns {boolean}
 */
export function isDateInRange(month, day, startMonth, startDay, endMonth, endDay) {
  const current = month * 100 + day
  const start = startMonth * 100 + startDay
  const end = endMonth * 100 + endDay

  if (start <= end) {
    return current >= start && current <= end
  }
  // Wraps around year boundary (e.g., Dec 20 – Jan 10)
  return current >= start || current <= end
}

/**
 * Check if a banner has date-range fields.
 * @param {object} banner
 * @returns {boolean}
 */
function isDateRangeBanner(banner) {
  return banner.startMonth !== undefined && banner.endMonth !== undefined
}

/**
 * Check if a banner has a monthly schedule (for Black Market).
 * @param {object} banner
 * @returns {boolean}
 */
function isMonthlyBanner(banner) {
  return banner.monthlySchedule !== undefined
}

/**
 * Return all banners that are currently active.
 * - Permanent banners are always active
 * - Exactly one rotating banner is active at a time (10-day cycle)
 * - Date-range banners are active during their specified window
 *
 * @returns {Array} Active banner objects
 */
export function getActiveBanners() {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const day = now.getDate()

  // Rotating banners (non-permanent, non-date-range, non-monthly)
  const rotatingBanners = banners.filter(b => !b.permanent && !isDateRangeBanner(b) && !isMonthlyBanner(b))
  const cycleLength = ROTATION_CHUNK_DAYS * rotatingBanners.length
  const dayOfYear = getDayOfYear()
  const cyclePosition = (dayOfYear - 1) % cycleLength
  const activeIndex = Math.floor(cyclePosition / ROTATION_CHUNK_DAYS)
  const activeRotating = rotatingBanners[activeIndex]

  return banners.filter(b => {
    if (b.permanent) return true
    if (isDateRangeBanner(b)) {
      return isDateInRange(month, day, b.startMonth, b.startDay, b.endMonth, b.endDay)
    }
    return b.id === activeRotating.id
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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Calculate days remaining until a date-range banner ends.
 * @param {object} banner - Banner with startMonth/endMonth/startDay/endDay
 * @returns {number} Days remaining (0 = last day, negative = expired)
 */
function getDaysRemainingForDateRange(banner) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  // Determine which year the end date falls in
  let endYear = currentYear
  if (banner.endMonth < banner.startMonth) {
    // Wraps around year (e.g., Dec-Jan)
    if (month >= banner.startMonth) {
      endYear = currentYear + 1
    }
  }

  const endDate = new Date(endYear, banner.endMonth - 1, banner.endDay)
  const todayStart = new Date(currentYear, month - 1, day)
  const diffMs = endDate - todayStart
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Return human-readable availability text for a banner.
 *
 * - Permanent banners: "Always Available"
 * - Date-range banners: Date range or countdown if near end
 * - Rotating banners: Days remaining in rotation window
 *
 * @param {object} banner
 * @returns {string}
 */
export function getBannerAvailabilityText(banner) {
  if (banner.permanent) return 'Always Available'

  // Date-range banner
  if (isDateRangeBanner(banner)) {
    const daysRemaining = getDaysRemainingForDateRange(banner)
    if (daysRemaining <= 0) return 'Last day!'
    if (daysRemaining <= 3) {
      if (daysRemaining === 1) return '1 day remaining'
      return `${daysRemaining} days remaining`
    }
    // Show date range
    const startMonth = MONTH_NAMES[banner.startMonth - 1]
    const endMonth = MONTH_NAMES[banner.endMonth - 1]
    return `${startMonth} ${banner.startDay} – ${endMonth} ${banner.endDay}`
  }

  // Rotating banner
  const rotatingBanners = banners.filter(b => !b.permanent && !isDateRangeBanner(b))
  const cycleLength = ROTATION_CHUNK_DAYS * rotatingBanners.length
  const dayOfYear = getDayOfYear()
  const cyclePosition = (dayOfYear - 1) % cycleLength
  const positionInChunk = cyclePosition % ROTATION_CHUNK_DAYS
  const daysRemaining = ROTATION_CHUNK_DAYS - positionInChunk - 1

  if (daysRemaining <= 0) return 'Last day!'
  if (daysRemaining === 1) return '1 day remaining'
  return `${daysRemaining} days remaining`
}

/**
 * Get monthly banner for a specific month.
 * Handles month wraparound.
 * @param {number} _year - Ignored (kept for API compatibility)
 * @param {number} month - 1-indexed (1 = January)
 * @returns {object|undefined}
 */
export function getMonthlyBanner(_year, month) {
  // Handle wraparound
  if (month < 1) { month = 12 }
  if (month > 12) { month = 1 }

  return banners.find(b => b.monthlySchedule?.month === month)
}

/**
 * Get a random vault banner (seeded by day for daily rotation).
 * Excludes current month, last month, and next month.
 * @param {number} _currentYear - Ignored (kept for API compatibility)
 * @param {number} currentMonth
 * @returns {object|undefined}
 */
function getRandomVaultBanner(_currentYear, currentMonth) {
  const excluded = new Set()

  // Exclude current, last, and next month
  for (let offset = -1; offset <= 1; offset++) {
    let m = currentMonth + offset
    if (m < 1) { m = 12 }
    if (m > 12) { m = 1 }
    excluded.add(m)
  }

  const candidates = banners.filter(b => {
    if (!b.monthlySchedule) return false
    return !excluded.has(b.monthlySchedule.month)
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

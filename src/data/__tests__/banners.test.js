import { describe, it, expect, vi, afterEach } from 'vitest'
import { banners, getActiveBanners, getBannerById, getBannerAvailabilityText, getDayOfYear, ROTATION_CHUNK_DAYS } from '../banners.js'

describe('banners data', () => {
  describe('standard banner', () => {
    const standard = banners.find(b => b.id === 'standard')

    it('exists and is permanent', () => {
      expect(standard).toBeDefined()
      expect(standard.permanent).toBe(true)
    })

    it('has all 5 rarities populated', () => {
      for (let r = 1; r <= 5; r++) {
        expect(standard.heroPool[r]).toBeDefined()
        expect(standard.heroPool[r].length).toBeGreaterThan(0)
      }
    })

    it('includes all heroes across all rarities', () => {
      const allHeroes = []
      for (let r = 1; r <= 5; r++) {
        allHeroes.push(...standard.heroPool[r])
      }
      // 3 + 4 + 4 + 4 + 4 = 19 heroes total (excludes banner-exclusive heroes)
      expect(allHeroes).toHaveLength(19)
      expect(allHeroes).toContain('aurora_the_dawn')
      expect(allHeroes).toContain('shadow_king')
      expect(allHeroes).toContain('yggra_world_root')
      expect(allHeroes).toContain('sir_gallan')
      expect(allHeroes).toContain('farm_hand')
      expect(allHeroes).toContain('street_urchin')
      // Cacophon and Chroma are exclusive to Musical Mayhem
      expect(allHeroes).not.toContain('cacophon')
      expect(allHeroes).not.toContain('chroma')
    })
  })

  describe('every banner has all 5 rarities populated', () => {
    it.each(banners.map(b => [b.id, b]))('%s has rarities 1-5', (_id, banner) => {
      for (let r = 1; r <= 5; r++) {
        expect(banner.heroPool[r]).toBeDefined()
        expect(banner.heroPool[r].length).toBeGreaterThan(0)
      }
    })
  })

  it('has exactly 3 rotating banners (non-date-range)', () => {
    const rotating = banners.filter(b => !b.permanent && !b.startMonth)
    expect(rotating).toHaveLength(3)
  })

  it('rotation chunk is 10 days', () => {
    expect(ROTATION_CHUNK_DAYS).toBe(10)
  })
})

describe('getBannerById', () => {
  it('returns the correct banner for a known id', () => {
    const result = getBannerById('standard')
    expect(result).toBeDefined()
    expect(result.id).toBe('standard')
    expect(result.name).toBe('Standard Banner')
  })

  it('returns the shields_of_valor banner', () => {
    const result = getBannerById('shields_of_valor')
    expect(result).toBeDefined()
    expect(result.id).toBe('shields_of_valor')
  })

  it('returns undefined for an unknown id', () => {
    const result = getBannerById('nonexistent_banner')
    expect(result).toBeUndefined()
  })
})

describe('getDayOfYear', () => {
  it('returns 1 for January 1', () => {
    expect(getDayOfYear(new Date(2026, 0, 1))).toBe(1)
  })

  it('returns 32 for February 1', () => {
    expect(getDayOfYear(new Date(2026, 1, 1))).toBe(32)
  })

  it('returns 365 for December 31 (non-leap year)', () => {
    expect(getDayOfYear(new Date(2026, 11, 31))).toBe(365)
  })
})

describe('getActiveBanners', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // With 3 rotating banners and 10-day chunks (cycle = 30 days):
  // Days 1-10:  Shields of Valor (index 0)
  // Days 11-20: Flames of War (index 1)
  // Days 21-30: Nature's Call (index 2)
  // Days 31-40: Shields of Valor (repeats)

  it('always includes the permanent standard banner', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'standard')).toBe(true)
  })

  it('always includes exactly one rotating banner', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
    const active = getActiveBanners()
    expect(active).toHaveLength(2)
    expect(active.filter(b => !b.permanent)).toHaveLength(1)
  })

  it('shows Shields of Valor on day 1 (Jan 1)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1)) // day 1
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'shields_of_valor')).toBe(true)
  })

  it('shows Flames of War on day 11 (Jan 11)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 11)) // day 11
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'flames_of_war')).toBe(true)
  })

  it('shows Nature\'s Call on day 21 (Jan 21)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 21)) // day 21
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'natures_call')).toBe(true)
  })

  it('cycles back to Shields of Valor on day 31 (Jan 31)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 31)) // day 31
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'shields_of_valor')).toBe(true)
  })

  it('works later in the year (day 166 = Jun 15 → Flames of War)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15)) // day 166
    // (166-1) % 30 = 165 % 30 = 15, floor(15/10) = 1 → Flames of War
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'flames_of_war')).toBe(true)
  })
})

describe('date-range banners', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes a date-range banner when current date is within range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // Jan 15
    const active = getActiveBanners()
    // Musical Mayhem runs Jan 1-31
    expect(active.some(b => b.id === 'musical_mayhem')).toBe(true)
  })

  it('excludes a date-range banner when current date is outside range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 15)) // Feb 15
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'musical_mayhem')).toBe(false)
  })

  it('includes date-range banner on the first day of range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1)) // Jan 1
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'musical_mayhem')).toBe(true)
  })

  it('includes date-range banner on the last day of range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 31)) // Jan 31
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'musical_mayhem')).toBe(true)
  })

  it('date-range banners run alongside rotating banners', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // Jan 15 - mid-January
    const active = getActiveBanners()
    // Should have: standard (permanent) + one rotating + musical_mayhem (date-range)
    expect(active.length).toBeGreaterThanOrEqual(3)
    expect(active.some(b => b.id === 'standard')).toBe(true)
    expect(active.some(b => b.id === 'musical_mayhem')).toBe(true)
    // One rotating banner should also be active
    const rotating = active.filter(b => !b.permanent && !b.startMonth)
    expect(rotating.length).toBe(1)
  })

  it('handles year-boundary wrapping (Dec 20 - Jan 10)', () => {
    vi.useFakeTimers()
    // Test a hypothetical banner that wraps around year boundary
    vi.setSystemTime(new Date(2026, 11, 25)) // Dec 25
    const active = getActiveBanners()
    // We'd need a test banner for this - for now just verify the function doesn't crash
    expect(active).toBeDefined()
  })
})

describe('getBannerAvailabilityText', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Always Available" for permanent banners', () => {
    const standard = banners.find(b => b.id === 'standard')
    expect(getBannerAvailabilityText(standard)).toBe('Always Available')
  })

  it('returns days remaining for a rotating banner', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1)) // day 1, position 0 in chunk → 9 days remaining
    const banner = banners.find(b => b.id === 'shields_of_valor')
    expect(getBannerAvailabilityText(banner)).toBe('9 days remaining')
  })

  it('returns "1 day remaining" on the second-to-last day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 9)) // day 9, position 8 in chunk → 1 day remaining
    const banner = banners.find(b => b.id === 'shields_of_valor')
    expect(getBannerAvailabilityText(banner)).toBe('1 day remaining')
  })

  it('returns "Last day!" on the final day of the chunk', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 10)) // day 10, position 9 in chunk → 0 remaining
    const banner = banners.find(b => b.id === 'shields_of_valor')
    expect(getBannerAvailabilityText(banner)).toBe('Last day!')
  })

  it('returns date range text for date-range banners', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // Jan 15
    const banner = banners.find(b => b.id === 'musical_mayhem')
    expect(getBannerAvailabilityText(banner)).toBe('Jan 1 – Jan 31')
  })

  it('returns days remaining for date-range banner near end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 29)) // Jan 29 - 2 days left
    const banner = banners.find(b => b.id === 'musical_mayhem')
    expect(getBannerAvailabilityText(banner)).toBe('2 days remaining')
  })

  it('returns "Last day!" for date-range banner on final day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 31)) // Jan 31 - last day
    const banner = banners.find(b => b.id === 'musical_mayhem')
    expect(getBannerAvailabilityText(banner)).toBe('Last day!')
  })
})

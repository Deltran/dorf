import { describe, it, expect, vi, afterEach } from 'vitest'
import { banners, isDateInRange, getActiveBanners, getBannerById } from '../banners.js'

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
      // 3 + 4 + 4 + 4 + 4 = 19 heroes total
      expect(allHeroes).toHaveLength(19)
      expect(allHeroes).toContain('aurora_the_dawn')
      expect(allHeroes).toContain('shadow_king')
      expect(allHeroes).toContain('yggra_world_root')
      expect(allHeroes).toContain('sir_gallan')
      expect(allHeroes).toContain('farm_hand')
      expect(allHeroes).toContain('street_urchin')
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

describe('isDateInRange', () => {
  it('returns true when date is within range', () => {
    expect(isDateInRange(1, 10, 1, 1, 1, 15)).toBe(true)
  })

  it('returns false when date is outside range', () => {
    expect(isDateInRange(2, 10, 1, 1, 1, 15)).toBe(false)
  })

  it('returns true on the start boundary', () => {
    expect(isDateInRange(1, 1, 1, 1, 1, 15)).toBe(true)
  })

  it('returns true on the end boundary', () => {
    expect(isDateInRange(1, 15, 1, 1, 1, 15)).toBe(true)
  })

  it('handles year-boundary wrapping (Dec 20 – Jan 5)', () => {
    expect(isDateInRange(12, 25, 12, 20, 1, 5)).toBe(true)
    expect(isDateInRange(1, 3, 12, 20, 1, 5)).toBe(true)
    expect(isDateInRange(11, 15, 12, 20, 1, 5)).toBe(false)
    expect(isDateInRange(2, 1, 12, 20, 1, 5)).toBe(false)
  })
})

describe('getActiveBanners', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('always includes the permanent standard banner', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'standard')).toBe(true)
  })

  it('includes shields_of_valor during Jan 1-15', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 10))
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'shields_of_valor')).toBe(true)
  })

  it('excludes shields_of_valor outside its date range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 10))
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'shields_of_valor')).toBe(false)
  })

  it('includes flames_of_war during Feb 1-15', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 5))
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'flames_of_war')).toBe(true)
  })

  it('excludes flames_of_war outside its date range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 10))
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'flames_of_war')).toBe(false)
  })

  it('includes natures_call during Mar 1-15', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 8))
    const active = getActiveBanners()
    expect(active.some(b => b.id === 'natures_call')).toBe(true)
  })

  it('excludes all rotating banners when none are in season', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15))
    const active = getActiveBanners()
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe('standard')
  })
})

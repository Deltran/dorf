import { describe, it, expect } from 'vitest'
import { banners, getBannerById, getMonthlyBanner } from '../banners'

describe('Golden Showers Banner', () => {
  const banner = banners.find(b => b.id === 'golden_showers')

  it('should exist', () => {
    expect(banner).toBeDefined()
  })

  it('should have correct name and description', () => {
    expect(banner.name).toBe('Golden Showers')
    expect(banner.description).toContain('gambl')
  })

  it('should be a monthly banner for April (repeats yearly)', () => {
    expect(banner.permanent).toBe(false)
    expect(banner.monthlySchedule).toEqual({ month: 4 })
  })

  it('should have all three gambler heroes', () => {
    expect(banner.heroPool[5]).toContain('fortuna_inversus')
    expect(banner.heroPool[4]).toContain('copper_jack')
    expect(banner.heroPool[3]).toContain('bones_mccready')
  })

  it('should be findable by id', () => {
    expect(getBannerById('golden_showers')).toBe(banner)
  })

  it('should be findable as April 2026 monthly banner', () => {
    expect(getMonthlyBanner(2026, 4)).toBe(banner)
  })
})

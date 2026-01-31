import { describe, it, expect } from 'vitest'
import { banners, getBannerById, getMonthlyBanner } from '../banners'

describe('Deplorable Companions Banner', () => {
  const banner = banners.find(b => b.id === 'deplorable_companions')

  it('should exist', () => {
    expect(banner).toBeDefined()
  })

  it('should have correct name and description', () => {
    expect(banner.name).toBe('Deplorable Companions')
    expect(banner.description).toContain('anti-heroes')
  })

  it('should be a monthly banner for May (repeats yearly)', () => {
    expect(banner.permanent).toBe(false)
    expect(banner.monthlySchedule).toEqual({ month: 5 })
  })

  it('should have all three deplorable heroes', () => {
    expect(banner.heroPool[5]).toContain('grandmother_rot')
    expect(banner.heroPool[4]).toContain('penny_dreadful')
    expect(banner.heroPool[3]).toContain('the_grateful_dead')
  })

  it('should be findable by id', () => {
    expect(getBannerById('deplorable_companions')).toBe(banner)
  })

  it('should be findable as May monthly banner', () => {
    expect(getMonthlyBanner(2026, 5)).toBe(banner)
  })

  it('should have a balanced hero pool across rarities', () => {
    expect(banner.heroPool[5]).toHaveLength(1)
    expect(banner.heroPool[4].length).toBeGreaterThanOrEqual(2)
    expect(banner.heroPool[3].length).toBeGreaterThanOrEqual(2)
    expect(banner.heroPool[2].length).toBeGreaterThanOrEqual(2)
    expect(banner.heroPool[1].length).toBeGreaterThanOrEqual(2)
  })
})

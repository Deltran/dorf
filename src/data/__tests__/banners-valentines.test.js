// src/data/__tests__/banners-valentines.test.js
import { describe, it, expect } from 'vitest'
import { banners } from '../banners/index.js'

describe('Valentine\'s Day banner', () => {
  const banner = banners.find(b => b.id === 'valentines_heartbreak')

  it('exists with correct identity', () => {
    expect(banner).toBeDefined()
    expect(banner.name).toBe("Love's Thorny Path")
  })

  it('features Mara and Philemon', () => {
    expect(banner.featuredHeroes).toContain('mara_thornheart')
    expect(banner.featuredHeroes).toContain('philemon_the_ardent')
  })

  it('has correct date range for February', () => {
    expect(banner.startDate).toBe('2026-02-01')
    expect(banner.endDate).toBe('2026-02-28')
  })

  it('is a limited banner', () => {
    expect(banner.bannerType).toBe('limited')
  })
})

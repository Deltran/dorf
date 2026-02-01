import { describe, it, expect } from 'vitest'
import { banners, getMonthlyBanner } from '../banners.js'

describe('Drums of the Old Blood banner', () => {
  const banner = banners.find(b => b.id === 'drums_of_old_blood')

  it('exists with correct properties', () => {
    expect(banner).toBeDefined()
    expect(banner.name).toBe('Drums of the Old Blood')
    expect(banner.permanent).toBe(false)
  })

  it('is scheduled for June (month 6)', () => {
    expect(banner.monthlySchedule).toBeDefined()
    expect(banner.monthlySchedule.month).toBe(6)
  })

  it('has all 5 rarities populated', () => {
    for (let r = 1; r <= 5; r++) {
      expect(banner.heroPool[r]).toBeDefined()
      expect(banner.heroPool[r].length).toBeGreaterThan(0)
    }
  })

  it('features Korrath as 5-star', () => {
    expect(banner.heroPool[5]).toContain('korrath_hollow_ear')
  })

  it('features Vraxx as 4-star', () => {
    expect(banner.heroPool[4]).toContain('vraxx_thunderskin')
  })

  it('features Torga as 3-star', () => {
    expect(banner.heroPool[3]).toContain('torga_bloodbeat')
  })

  it('is returned by getMonthlyBanner for June', () => {
    const juneBanner = getMonthlyBanner(2026, 6)
    expect(juneBanner).toBeDefined()
    expect(juneBanner.id).toBe('drums_of_old_blood')
  })

  it('has thematic description', () => {
    expect(banner.description).toContain('Drumcaller')
  })
})

import { describe, it, expect } from 'vitest'
import { banners, getBannerById, isDateInRange } from '../banners'

describe("Fortune's Fools Banner", () => {
  const banner = banners.find(b => b.id === 'fortunes_fools')

  it('should exist', () => {
    expect(banner).toBeDefined()
  })

  it('should have correct name and description', () => {
    expect(banner.name).toBe("Fortune's Fools")
    expect(banner.description).toContain('gambl')
  })

  it('should be a date-range banner for February', () => {
    expect(banner.permanent).toBe(false)
    expect(banner.startMonth).toBe(2)
    expect(banner.startDay).toBe(1)
    expect(banner.endMonth).toBe(2)
    expect(banner.endDay).toBe(28)
  })

  it('should have all three gambler heroes', () => {
    expect(banner.heroPool[5]).toContain('fortuna_inversus')
    expect(banner.heroPool[4]).toContain('copper_jack')
    expect(banner.heroPool[3]).toContain('bones_mccready')
  })

  it('should be findable by id', () => {
    expect(getBannerById('fortunes_fools')).toBe(banner)
  })

  describe('date range checks', () => {
    it('should be active on Feb 1', () => {
      expect(isDateInRange(2, 1, 2, 1, 2, 28)).toBe(true)
    })

    it('should be active on Feb 28', () => {
      expect(isDateInRange(2, 28, 2, 1, 2, 28)).toBe(true)
    })

    it('should not be active on Jan 31', () => {
      expect(isDateInRange(1, 31, 2, 1, 2, 28)).toBe(false)
    })

    it('should not be active on Mar 1', () => {
      expect(isDateInRange(3, 1, 2, 1, 2, 28)).toBe(false)
    })
  })
})

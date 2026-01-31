// src/data/__tests__/banners-valentines.test.js
import { describe, it, expect } from 'vitest'
import { banners } from '../banners/index.js'

describe('Valentine\'s Day banner', () => {
  const banner = banners.find(b => b.id === 'valentines_heartbreak')

  it('exists with correct identity', () => {
    expect(banner).toBeDefined()
    expect(banner.name).toBe("Love's Thorny Path")
  })

  it('is active around Valentine\'s Day (Feb 7-21)', () => {
    expect(banner.startMonth).toBe(2)
    expect(banner.startDay).toBe(7)
    expect(banner.endMonth).toBe(2)
    expect(banner.endDay).toBe(21)
  })

  it('has limited hero pool', () => {
    expect(banner.heroPool[5]).toContain('mara_thornheart')
    expect(banner.heroPool[4]).toContain('philemon_the_ardent')
  })
})

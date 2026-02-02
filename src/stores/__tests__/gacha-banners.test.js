import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGachaStore } from '../gacha'
import { getBannerById } from '../../data/banners'

describe('gacha banner support', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useGachaStore()
  })

  it('defaults selectedBannerId to standard', () => {
    expect(store.selectedBannerId).toBe('standard')
  })

  it('selectBanner changes selectedBannerId', () => {
    store.selectBanner('shields_of_valor')
    expect(store.selectedBannerId).toBe('shields_of_valor')
  })

  it('selectedBanner returns the full banner object', () => {
    expect(store.selectedBanner).toBeDefined()
    expect(store.selectedBanner.id).toBe('standard')
    expect(store.selectedBanner.heroPool).toBeDefined()
  })

  it('activeBanners always includes the standard banner', () => {
    expect(store.activeBanners.some(b => b.id === 'standard')).toBe(true)
  })

  it('singlePull returns a hero from the selected banner pool', () => {
    store.addGems(10000)
    const result = store.singlePull()
    expect(result).not.toBeNull()
    expect(result.template).toBeDefined()
    expect(result.template.id).toBeDefined()
  })

  it('tenPull returns 10 heroes from the selected banner pool', () => {
    store.addGems(10000)
    const results = store.tenPull()
    expect(results).not.toBeNull()
    expect(results.length).toBe(10)
  })

  it('persists selectedBannerId in saveState', () => {
    store.selectBanner('flames_of_war')
    const saved = store.saveState()
    expect(saved.selectedBannerId).toBe('flames_of_war')
  })

  it('restores selectedBannerId from loadState if banner is active', () => {
    // Standard is always active (permanent)
    store.loadState({ selectedBannerId: 'standard' })
    expect(store.selectedBannerId).toBe('standard')
  })

  it('falls back to standard if saved banner is no longer active', () => {
    // musical_mayhem is only active in January, so unless it's January,
    // this should fall back to standard
    const now = new Date()
    const isJanuary = now.getMonth() === 0
    store.loadState({ selectedBannerId: 'musical_mayhem' })
    if (isJanuary) {
      expect(store.selectedBannerId).toBe('musical_mayhem')
    } else {
      expect(store.selectedBannerId).toBe('standard')
    }
  })
})

describe('Oriental Fighters banner', () => {
  it('should have oriental_fighters banner defined', () => {
    const banner = getBannerById('oriental_fighters')
    expect(banner).toBeDefined()
    expect(banner.name).toBe('Oriental Fighters')
  })

  it('should feature Onibaba as 5-star', () => {
    const banner = getBannerById('oriental_fighters')
    expect(banner.heroPool[5]).toContain('onibaba')
  })

  it('should feature Shinobi Jin as 4-star', () => {
    const banner = getBannerById('oriental_fighters')
    expect(banner.heroPool[4]).toContain('shinobi_jin')
  })

  it('should feature Matsuda as 3-star', () => {
    const banner = getBannerById('oriental_fighters')
    expect(banner.heroPool[3]).toContain('matsuda')
  })

  it('should have March monthly schedule (repeats yearly)', () => {
    const banner = getBannerById('oriental_fighters')
    expect(banner.monthlySchedule).toEqual({ month: 3 })
  })
})

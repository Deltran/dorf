import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGachaStore } from '../gacha'

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

  it('restores selectedBannerId from loadState', () => {
    store.loadState({ selectedBannerId: 'natures_call' })
    expect(store.selectedBannerId).toBe('natures_call')
  })
})

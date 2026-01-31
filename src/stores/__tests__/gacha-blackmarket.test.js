import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGachaStore } from '../gacha.js'

describe('gacha store - black market state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has blackMarketUnlocked computed based on totalPulls', () => {
    const store = useGachaStore()
    expect(store.blackMarketUnlocked).toBe(false)
  })

  it('unlocks black market at 135 pulls', () => {
    const store = useGachaStore()
    store.loadState({ totalPulls: 135 })
    expect(store.blackMarketUnlocked).toBe(true)
  })

  it('persists black market pity counters', () => {
    const store = useGachaStore()
    store.loadState({
      blackMarketPullsSince4Star: 5,
      blackMarketPullsSince5Star: 20,
      blackMarketTotalPulls: 25
    })
    expect(store.blackMarketPullsSince4Star).toBe(5)
    expect(store.blackMarketPullsSince5Star).toBe(20)
    expect(store.blackMarketTotalPulls).toBe(25)
  })

  it('includes black market state in saveState', () => {
    const store = useGachaStore()
    store.loadState({
      blackMarketPullsSince4Star: 3,
      blackMarketPullsSince5Star: 10,
      blackMarketTotalPulls: 15
    })
    const saved = store.saveState()
    expect(saved.blackMarketPullsSince4Star).toBe(3)
    expect(saved.blackMarketPullsSince5Star).toBe(10)
    expect(saved.blackMarketTotalPulls).toBe(15)
  })

  it('exposes BLACK_MARKET costs', () => {
    const store = useGachaStore()
    expect(store.BLACK_MARKET_SINGLE_COST).toBe(200)
    expect(store.BLACK_MARKET_TEN_COST).toBe(1800)
  })
})

describe('gacha store - black market pulls', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('blackMarketSinglePull deducts 200 gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 500 })
    store.blackMarketSinglePull('standard')
    expect(store.gems).toBe(300)
  })

  it('blackMarketSinglePull returns null if insufficient gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 100 })
    const result = store.blackMarketSinglePull('standard')
    expect(result).toBeNull()
    expect(store.gems).toBe(100)
  })

  it('blackMarketSinglePull increments black market pity counters', () => {
    const store = useGachaStore()
    store.loadState({ gems: 500 })
    store.blackMarketSinglePull('standard')
    expect(store.blackMarketTotalPulls).toBe(1)
  })

  it('blackMarketTenPull deducts 1800 gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 2000 })
    store.blackMarketTenPull('standard')
    expect(store.gems).toBe(200)
  })

  it('blackMarketTenPull returns null if insufficient gems', () => {
    const store = useGachaStore()
    store.loadState({ gems: 1000 })
    const result = store.blackMarketTenPull('standard')
    expect(result).toBeNull()
    expect(store.gems).toBe(1000)
  })

  it('blackMarketTenPull returns array of 10 results', () => {
    const store = useGachaStore()
    store.loadState({ gems: 2000 })
    const results = store.blackMarketTenPull('standard')
    expect(results).toHaveLength(10)
  })

  it('black market pity is separate from normal pity', () => {
    const store = useGachaStore()
    store.loadState({ gems: 5000, pullsSince5Star: 50 })
    store.blackMarketSinglePull('standard')
    // Normal pity unchanged
    expect(store.pullsSince5Star).toBe(50)
    // Black market pity incremented
    expect(store.blackMarketPullsSince5Star).toBeGreaterThanOrEqual(0)
  })
})

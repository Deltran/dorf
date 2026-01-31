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

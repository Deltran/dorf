import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShopsStore } from '../shops'

describe('Shops Store - Weekly Reset', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should track weekly purchases separately from daily', () => {
    const store = useShopsStore()

    store.purchaseWeekly('crest_shop', 'shards_sir_gallan')

    expect(store.getWeeklyPurchaseCount('crest_shop', 'shards_sir_gallan')).toBe(1)
  })

  it('should calculate remaining weekly stock', () => {
    const store = useShopsStore()

    expect(store.getRemainingWeeklyStock('crest_shop', 'shards_sir_gallan', 1)).toBe(1)

    store.purchaseWeekly('crest_shop', 'shards_sir_gallan')

    expect(store.getRemainingWeeklyStock('crest_shop', 'shards_sir_gallan', 1)).toBe(0)
  })

  it('should reset weekly purchases on new week', () => {
    const store = useShopsStore()

    // Make a purchase
    store.purchaseWeekly('crest_shop', 'shards_sir_gallan')
    expect(store.getWeeklyPurchaseCount('crest_shop', 'shards_sir_gallan')).toBe(1)

    // Simulate new week by changing lastWeeklyReset
    store.purchases.lastWeeklyReset = '2020-01-01'

    // Should reset and return 0
    expect(store.getWeeklyPurchaseCount('crest_shop', 'shards_sir_gallan')).toBe(0)
  })

  it('should get correct week start (Monday)', () => {
    const store = useShopsStore()

    // Wednesday Jan 22, 2026
    const wed = new Date('2026-01-22T12:00:00')
    const weekStart = store.getWeekStart(wed)

    // Should be Monday Jan 19, 2026
    expect(weekStart).toBe('2026-01-19')
  })

  it('should handle Sunday correctly', () => {
    const store = useShopsStore()

    // Sunday Jan 25, 2026
    const sun = new Date('2026-01-25T12:00:00')
    const weekStart = store.getWeekStart(sun)

    // Should be Monday Jan 19, 2026
    expect(weekStart).toBe('2026-01-19')
  })
})

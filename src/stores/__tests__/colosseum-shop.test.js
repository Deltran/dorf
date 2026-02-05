import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useColosseumStore } from '../colosseum.js'

describe('Colosseum Shop', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useColosseumStore()
  })

  describe('purchaseColosseumItem', () => {
    it('deducts laurels on successful purchase', () => {
      store.addLaurels(500)
      const result = store.purchaseColosseumItem('tome_large')
      expect(result.success).toBe(true)
      expect(store.laurels).toBe(350) // 500 - 150
    })

    it('fails with insufficient laurels', () => {
      store.addLaurels(100)
      const result = store.purchaseColosseumItem('dragon_heart') // costs 3000
      expect(result.success).toBe(false)
      expect(result.message).toContain('Insufficient')
      expect(store.laurels).toBe(100) // unchanged
    })

    it('fails with invalid item id', () => {
      store.addLaurels(5000)
      const result = store.purchaseColosseumItem('nonexistent_item')
      expect(result.success).toBe(false)
    })

    it('allows unlimited purchases for consumables', () => {
      store.addLaurels(10000)
      // Buy multiple tomes - should always succeed (no stock limit)
      for (let i = 0; i < 10; i++) {
        const result = store.purchaseColosseumItem('tome_large')
        expect(result.success).toBe(true)
      }
      // Stock should still be infinite
      const remaining = store.getColosseumItemStock('tome_large')
      expect(remaining).toBe(Infinity)
    })

    it('rejects placeholder hero purchases', () => {
      store.addLaurels(20000)
      const result = store.purchaseColosseumItem('colosseum_hero_5star')
      expect(result.success).toBe(false)
      expect(result.message).toContain('available')
    })
  })

  describe('getColosseumItemStock', () => {
    it('returns Infinity for unlimited items', () => {
      const stock = store.getColosseumItemStock('dragon_heart_shard')
      expect(stock).toBe(Infinity)
    })

    it('returns maxStock for limited items (exclusive heroes)', () => {
      const stock = store.getColosseumItemStock('colosseum_hero_3star')
      expect(stock).toBe(1) // maxStock: 1 for exclusive heroes
    })

    it('returns 0 for unknown items', () => {
      const stock = store.getColosseumItemStock('fake_item')
      expect(stock).toBe(0)
    })
  })

  describe('getColosseumShopDisplay', () => {
    it('returns all shop items with current stock', () => {
      const items = store.getColosseumShopDisplay()
      expect(items.length).toBeGreaterThan(0)
      items.forEach(item => {
        expect(item.id).toBeTruthy()
        expect(typeof item.remainingStock).toBe('number')
      })
    })
  })
})

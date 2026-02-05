import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGemShopStore } from '../gemShop.js'
import { useQuestsStore } from '../quests.js'
import { useGachaStore } from '../gacha.js'
import { useInventoryStore } from '../inventory.js'

describe('Gem Shop Store', () => {
  let gemShopStore
  let questsStore
  let gachaStore
  let inventoryStore

  beforeEach(() => {
    setActivePinia(createPinia())
    gemShopStore = useGemShopStore()
    questsStore = useQuestsStore()
    gachaStore = useGachaStore()
    inventoryStore = useInventoryStore()
  })

  describe('getEligibleItems', () => {
    it('returns empty arrays when no nodes completed', () => {
      const { cheap, expensive } = gemShopStore.getEligibleItems()
      expect(cheap).toEqual([])
      expect(expensive).toEqual([])
    })

    it('returns cheap items (rarity 1-2) from completed nodes', () => {
      // forest_01 drops tome_small (rarity 1) and tome_medium (rarity 2)
      questsStore.completedNodes.push('forest_01')
      const { cheap } = gemShopStore.getEligibleItems()
      expect(cheap.some(item => item.id === 'tome_small')).toBe(true)
    })

    it('returns expensive items (rarity 3+) from completed nodes', () => {
      // cave_05 drops shard_dragon_heart (rarity 3) and lake_tower_key (rarity 3)
      questsStore.completedNodes.push('cave_05')
      const { expensive } = gemShopStore.getEligibleItems()
      expect(expensive.some(item => item.id === 'shard_dragon_heart' || item.id === 'lake_tower_key')).toBe(true)
    })

    it('deduplicates items from multiple nodes', () => {
      questsStore.completedNodes.push('forest_01', 'forest_02')
      const { cheap } = gemShopStore.getEligibleItems()
      const tomeSmallCount = cheap.filter(item => item.id === 'tome_small').length
      expect(tomeSmallCount).toBe(1)
    })
  })

  describe('calculatePrice', () => {
    it('calculates price as sellReward * 3 for gem rewards', () => {
      // useless_rock has sellReward: { gems: 5 }
      const price = gemShopStore.calculatePrice('useless_rock')
      expect(price).toBe(15) // 5 * 3
    })

    it('converts gold to gems at 5:1 ratio then multiplies by 3', () => {
      // tome_small has sellReward: { gold: 50 }
      const price = gemShopStore.calculatePrice('tome_small')
      expect(price).toBe(30) // (50 / 5) * 3 = 30
    })

    it('returns 0 for items without sellReward', () => {
      const price = gemShopStore.calculatePrice('nonexistent_item')
      expect(price).toBe(0)
    })
  })

  describe('getTodaysItems', () => {
    beforeEach(() => {
      // Set up some completed nodes with various items
      questsStore.completedNodes.push('forest_01', 'forest_02', 'cave_05')
    })

    it('returns exactly 2 items when both pools have items', () => {
      const items = gemShopStore.getTodaysItems()
      expect(items.length).toBe(2)
    })

    it('returns items with calculated prices', () => {
      const items = gemShopStore.getTodaysItems()
      items.forEach(item => {
        expect(item.price).toBeGreaterThan(0)
      })
    })

    it('returns same items for same date (deterministic)', () => {
      const items1 = gemShopStore.getTodaysItems()
      const items2 = gemShopStore.getTodaysItems()
      expect(items1[0].id).toBe(items2[0].id)
      expect(items1[1].id).toBe(items2[1].id)
    })

    it('returns 2 cheap items when no expensive items available', () => {
      // Reset to only have cheap items
      questsStore.completedNodes.splice(0)
      questsStore.completedNodes.push('forest_01') // Only has rarity 1-2 items
      const items = gemShopStore.getTodaysItems()
      expect(items.length).toBe(2)
      items.forEach(item => {
        expect(item.item.rarity).toBeLessThanOrEqual(2)
      })
    })

    it('returns empty array when no items available', () => {
      questsStore.completedNodes.splice(0)
      const items = gemShopStore.getTodaysItems()
      expect(items).toEqual([])
    })
  })

  describe('purchaseItem', () => {
    beforeEach(() => {
      questsStore.completedNodes.push('forest_01', 'cave_05')
      gachaStore.addGems(1000)
    })

    it('deducts gems on successful purchase', () => {
      const items = gemShopStore.getTodaysItems()
      const item = items[0]
      const startGems = gachaStore.gems

      gemShopStore.purchaseItem(item.id)

      expect(gachaStore.gems).toBe(startGems - item.price)
    })

    it('adds item to inventory on successful purchase', () => {
      const items = gemShopStore.getTodaysItems()
      const item = items[0]
      const startCount = inventoryStore.getItemCount(item.id)

      gemShopStore.purchaseItem(item.id)

      expect(inventoryStore.getItemCount(item.id)).toBe(startCount + 1)
    })

    it('tracks purchased item for today', () => {
      const items = gemShopStore.getTodaysItems()
      const item = items[0]

      gemShopStore.purchaseItem(item.id)

      expect(gemShopStore.purchasedToday).toContain(item.id)
    })

    it('fails if item already purchased today', () => {
      const items = gemShopStore.getTodaysItems()
      const item = items[0]

      gemShopStore.purchaseItem(item.id)
      const result = gemShopStore.purchaseItem(item.id)

      expect(result.success).toBe(false)
      expect(result.message).toContain('already purchased')
    })

    it('fails if insufficient gems', () => {
      gachaStore.gems = 0
      const items = gemShopStore.getTodaysItems()
      const item = items[0]

      const result = gemShopStore.purchaseItem(item.id)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Insufficient')
    })

    it('fails if item not in todays selection', () => {
      const result = gemShopStore.purchaseItem('dragon_heart')

      expect(result.success).toBe(false)
      expect(result.message).toContain('not available')
    })
  })

  describe('daily reset', () => {
    it('resets purchasedToday when date changes', () => {
      questsStore.completedNodes.push('forest_01', 'cave_05')
      gachaStore.addGems(1000)

      const items = gemShopStore.getTodaysItems()
      gemShopStore.purchaseItem(items[0].id)
      expect(gemShopStore.purchasedToday.length).toBe(1)

      // Simulate date change
      gemShopStore.lastPurchaseDate = '2020-01-01'
      gemShopStore.checkDailyReset()

      expect(gemShopStore.purchasedToday).toEqual([])
    })
  })

  describe('getTimeUntilReset', () => {
    it('returns time until midnight', () => {
      const time = gemShopStore.getTimeUntilReset()
      expect(time.hours).toBeGreaterThanOrEqual(0)
      expect(time.hours).toBeLessThanOrEqual(23)
      expect(time.minutes).toBeGreaterThanOrEqual(0)
      expect(time.minutes).toBeLessThanOrEqual(59)
    })
  })

  describe('persistence', () => {
    it('saveState returns all persisted fields', () => {
      gemShopStore.lastPurchaseDate = '2026-02-04'
      gemShopStore.purchasedToday = ['tome_small']

      const saved = gemShopStore.saveState()

      expect(saved.lastPurchaseDate).toBe('2026-02-04')
      expect(saved.purchasedToday).toEqual(['tome_small'])
    })

    it('loadState restores all fields', () => {
      // Use today's date so checkDailyReset doesn't clear purchases
      const today = new Date().toISOString().split('T')[0]
      gemShopStore.loadState({
        lastPurchaseDate: today,
        purchasedToday: ['tome_small', 'tome_medium']
      })

      expect(gemShopStore.lastPurchaseDate).toBe(today)
      expect(gemShopStore.purchasedToday).toEqual(['tome_small', 'tome_medium'])
    })

    it('loadState triggers daily reset if date changed', () => {
      gemShopStore.loadState({
        lastPurchaseDate: '2020-01-01',
        purchasedToday: ['tome_small']
      })

      // Should reset because loaded date is old
      expect(gemShopStore.purchasedToday).toEqual([])
    })
  })
})

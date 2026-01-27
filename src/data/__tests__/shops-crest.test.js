import { describe, it, expect } from 'vitest'
import { getShop, getAllShops } from '../shops'

describe('Crest Shop', () => {
  it('should exist in shops list', () => {
    const shops = getAllShops()
    const crestShop = shops.find(s => s.id === 'crest_shop')
    expect(crestShop).toBeDefined()
  })

  it('should have correct basic properties', () => {
    const shop = getShop('crest_shop')
    expect(shop.name).toBe('Crest Shop')
    expect(shop.currency).toBe('crest')
    expect(shop.confirmThreshold).toBe(10)
  })

  it('should have sections with unlock conditions', () => {
    const shop = getShop('crest_shop')
    expect(shop.sections).toHaveLength(3)

    const valinar = shop.sections.find(s => s.id === 'valinar')
    expect(valinar.crestId).toBe('valinar_crest')
    expect(valinar.unlockCondition.completedNode).toBe('lake_genus_loci')

    const troll = shop.sections.find(s => s.id === 'great_troll')
    expect(troll.crestId).toBe('great_troll_crest')
    expect(troll.unlockCondition.completedNode).toBe('hibernation_den')

    const pyroclast = shop.sections.find(s => s.id === 'pyroclast')
    expect(pyroclast.crestId).toBe('pyroclast_crest')
    expect(pyroclast.unlockCondition.completedNode).toBe('eruption_vent_gl')
  })

  it('should have inventory items with sectionId', () => {
    const shop = getShop('crest_shop')
    expect(shop.inventory.length).toBeGreaterThan(0)

    const valinarItems = shop.inventory.filter(i => i.sectionId === 'valinar')
    const trollItems = shop.inventory.filter(i => i.sectionId === 'great_troll')
    const pyroclastItems = shop.inventory.filter(i => i.sectionId === 'pyroclast')

    expect(valinarItems.length).toBeGreaterThan(0)
    expect(trollItems.length).toBeGreaterThan(0)
    expect(pyroclastItems.length).toBeGreaterThan(0)
  })

  it('should have hero shard items with requiresShardsUnlocked flag', () => {
    const shop = getShop('crest_shop')
    const shardItems = shop.inventory.filter(i => i.heroId)

    expect(shardItems.length).toBeGreaterThan(0)
    shardItems.forEach(item => {
      expect(item.requiresShardsUnlocked).toBe(true)
      expect(item.shardCount).toBe(10)
      expect(item.stockType).toBe('weekly')
      expect(item.maxStock).toBe(1)
    })
  })
})

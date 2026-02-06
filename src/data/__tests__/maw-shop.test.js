// src/data/__tests__/maw-shop.test.js
import { describe, it, expect } from 'vitest'
import { getMawShopItems, getMawShopItem } from '../maw/shop.js'

describe('Maw Shop Items', () => {
  it('exports a non-empty shop item list', () => {
    const items = getMawShopItems()
    expect(items.length).toBeGreaterThan(0)
  })

  it('each item has required fields', () => {
    const items = getMawShopItems()
    for (const item of items) {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.cost).toBeGreaterThan(0)
      expect(item.type).toBeTruthy()
    }
  })

  it('getMawShopItem returns item by id', () => {
    const items = getMawShopItems()
    const first = items[0]
    expect(getMawShopItem(first.id)).toEqual(first)
  })

  it('getMawShopItem returns null for unknown id', () => {
    expect(getMawShopItem('fake_item')).toBeNull()
  })

  it('all item ids are unique', () => {
    const items = getMawShopItems()
    const ids = items.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

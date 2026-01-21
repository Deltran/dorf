import { describe, it, expect } from 'vitest'
import { getItem, getItemsByType } from '../items.js'

describe('Genus Loki items', () => {
  describe('Lake Tower Key', () => {
    it('exists and has correct properties', () => {
      const key = getItem('lake_tower_key')
      expect(key).not.toBeNull()
      expect(key.name).toBe('Lake Tower Key')
      expect(key.type).toBe('key')
      expect(key.rarity).toBe(3)
    })
  })

  describe("Valinar's Crest", () => {
    it('exists and has correct properties', () => {
      const crest = getItem('valinar_crest')
      expect(crest).not.toBeNull()
      expect(crest.name).toBe("Valinar's Crest")
      expect(crest.type).toBe('genusLoki')
      expect(crest.rarity).toBe(4)
    })
  })

  describe('getItemsByType', () => {
    it('returns key items', () => {
      const keys = getItemsByType('key')
      expect(keys.length).toBeGreaterThanOrEqual(1)
      expect(keys.some(k => k.id === 'lake_tower_key')).toBe(true)
    })

    it('returns genusLoki items', () => {
      const drops = getItemsByType('genusLoki')
      expect(drops.length).toBeGreaterThanOrEqual(1)
      expect(drops.some(d => d.id === 'valinar_crest')).toBe(true)
    })
  })
})

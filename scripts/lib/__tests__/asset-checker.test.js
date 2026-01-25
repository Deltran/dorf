import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the file system checks before importing the module
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn()
    },
    existsSync: vi.fn()
  }
})

import fs from 'fs'
import { getMissingEnemies, getMissingBackgrounds, getEnemySize } from '../asset-checker.js'

describe('asset-checker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMissingEnemies', () => {
    it('returns enemies that have no image file', () => {
      // Simulate: cave_leech.png does not exist, goblin_scout.png exists
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('goblin_scout')) return true
        if (path.includes('cave_leech')) return false
        return true
      })

      const missing = getMissingEnemies()

      expect(missing.some(e => e.id === 'cave_leech')).toBe(true)
      expect(missing.some(e => e.id === 'goblin_scout')).toBe(false)
    })
  })

  describe('getMissingBackgrounds', () => {
    it('returns quest nodes that have no background file', () => {
      fs.existsSync.mockImplementation((path) => {
        if (path.includes('forest_01')) return true
        if (path.includes('cliffs_01')) return false
        return true
      })

      const missing = getMissingBackgrounds()

      expect(missing.some(b => b.id === 'cliffs_01')).toBe(true)
      expect(missing.some(b => b.id === 'forest_01')).toBe(false)
    })
  })

  describe('getEnemySize', () => {
    it('returns 128 for enemies with imageSize property', () => {
      const enemy = { id: 'goblin_commander', imageSize: 140 }
      expect(getEnemySize(enemy)).toBe(128)
    })

    it('returns 128 for enemies with size keywords in name', () => {
      expect(getEnemySize({ id: 'mountain_giant', name: 'Mountain Giant' })).toBe(128)
      expect(getEnemySize({ id: 'cave_troll', name: 'Cave Troll' })).toBe(128)
      expect(getEnemySize({ id: 'rock_golem', name: 'Rock Golem' })).toBe(128)
      expect(getEnemySize({ id: 'kraken', name: 'Kraken' })).toBe(128)
    })

    it('returns 64 for regular enemies', () => {
      expect(getEnemySize({ id: 'goblin_scout', name: 'Goblin Scout' })).toBe(64)
      expect(getEnemySize({ id: 'cave_bat', name: 'Cave Bat' })).toBe(64)
    })
  })
})

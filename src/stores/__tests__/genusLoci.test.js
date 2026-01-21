import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGenusLokiStore } from '../genusLoki.js'

describe('genusLoki store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has empty progress', () => {
      const store = useGenusLokiStore()
      expect(store.progress).toEqual({})
    })
  })

  describe('isUnlocked', () => {
    it('returns false for never-beaten boss', () => {
      const store = useGenusLokiStore()
      expect(store.isUnlocked('valinar')).toBe(false)
    })

    it('returns true after first victory', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      expect(store.isUnlocked('valinar')).toBe(true)
    })
  })

  describe('getHighestCleared', () => {
    it('returns 0 for unbeaten boss', () => {
      const store = useGenusLokiStore()
      expect(store.getHighestCleared('valinar')).toBe(0)
    })

    it('returns highest cleared level', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      store.recordVictory('valinar', 2)
      store.recordVictory('valinar', 3)
      expect(store.getHighestCleared('valinar')).toBe(3)
    })

    it('does not decrease on lower level clear', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 5)
      store.recordVictory('valinar', 2)
      expect(store.getHighestCleared('valinar')).toBe(5)
    })
  })

  describe('getAvailableLevels', () => {
    it('returns [1] for unbeaten boss', () => {
      const store = useGenusLokiStore()
      expect(store.getAvailableLevels('valinar')).toEqual([1])
    })

    it('returns levels up to highest + 1', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 3)
      expect(store.getAvailableLevels('valinar')).toEqual([1, 2, 3, 4])
    })

    it('caps at maxPowerLevel', () => {
      const store = useGenusLokiStore()
      store.progress.valinar = { unlocked: true, highestCleared: 20, firstClearClaimed: true }
      expect(store.getAvailableLevels('valinar')).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1)
      )
    })
  })

  describe('recordVictory', () => {
    it('marks boss as unlocked', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      expect(store.progress.valinar.unlocked).toBe(true)
    })

    it('updates highestCleared', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      expect(store.progress.valinar.highestCleared).toBe(1)
    })

    it('returns firstClear true on first victory', () => {
      const store = useGenusLokiStore()
      const result = store.recordVictory('valinar', 1)
      expect(result.isFirstClear).toBe(true)
      expect(store.progress.valinar.firstClearClaimed).toBe(true)
    })

    it('returns firstClear false on subsequent victories', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 1)
      const result = store.recordVictory('valinar', 2)
      expect(result.isFirstClear).toBe(false)
    })
  })

  describe('unlockedBosses', () => {
    it('returns empty array initially', () => {
      const store = useGenusLokiStore()
      expect(store.unlockedBosses).toEqual([])
    })

    it('returns unlocked bosses with progress', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 5)
      expect(store.unlockedBosses.length).toBe(1)
      expect(store.unlockedBosses[0].id).toBe('valinar')
      expect(store.unlockedBosses[0].highestCleared).toBe(5)
    })
  })

  describe('persistence', () => {
    it('saves and loads state', () => {
      const store = useGenusLokiStore()
      store.recordVictory('valinar', 7)

      const saved = store.saveState()
      expect(saved.progress.valinar.highestCleared).toBe(7)

      // Create new store and load
      const store2 = useGenusLokiStore()
      store2.loadState(saved)
      expect(store2.getHighestCleared('valinar')).toBe(7)
      expect(store2.isUnlocked('valinar')).toBe(true)
    })
  })
})

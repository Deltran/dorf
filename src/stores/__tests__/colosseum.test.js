import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useColosseumStore } from '../colosseum.js'

describe('Colosseum Store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useColosseumStore()
  })

  describe('initial state', () => {
    it('starts with highestBout at 0', () => {
      expect(store.highestBout).toBe(0)
    })

    it('starts with 0 laurels', () => {
      expect(store.laurels).toBe(0)
    })

    it('starts unlocked as false', () => {
      expect(store.colosseumUnlocked).toBe(false)
    })
  })

  describe('unlockColosseum', () => {
    it('sets colosseumUnlocked to true', () => {
      store.unlockColosseum()
      expect(store.colosseumUnlocked).toBe(true)
    })
  })

  describe('getCurrentBout', () => {
    it('returns bout 1 when no bouts cleared', () => {
      const bout = store.getCurrentBout()
      expect(bout.bout).toBe(1)
    })

    it('returns next bout after clearing one', () => {
      store.completeBout(1)
      const bout = store.getCurrentBout()
      expect(bout.bout).toBe(2)
    })

    it('returns null when all 50 bouts cleared', () => {
      for (let i = 1; i <= 50; i++) {
        store.completeBout(i)
      }
      const bout = store.getCurrentBout()
      expect(bout).toBeNull()
    })
  })

  describe('completeBout', () => {
    it('advances highestBout', () => {
      store.completeBout(1)
      expect(store.highestBout).toBe(1)
    })

    it('awards first-clear laurels', () => {
      store.completeBout(1)
      expect(store.laurels).toBe(10) // bout 1 first-clear is 10
    })

    it('does not advance if bout is not the next one', () => {
      store.completeBout(5) // can't skip to bout 5
      expect(store.highestBout).toBe(0)
      expect(store.laurels).toBe(0)
    })

    it('does not re-award first-clear on replay', () => {
      store.completeBout(1)
      const laurelsAfterFirst = store.laurels
      store.completeBout(1) // replay bout 1
      expect(store.laurels).toBe(laurelsAfterFirst) // no extra laurels
    })

    it('tracks cleared bouts individually', () => {
      store.completeBout(1)
      store.completeBout(2)
      expect(store.highestBout).toBe(2)
      expect(store.laurels).toBeGreaterThan(10) // 10 + bout 2 reward
    })

    it('returns success result with reward info', () => {
      const result = store.completeBout(1)
      expect(result.success).toBe(true)
      expect(result.firstClear).toBe(true)
      expect(result.laurelsEarned).toBe(10)
    })

    it('returns replay result without first-clear bonus', () => {
      store.completeBout(1)
      const result = store.completeBout(1)
      expect(result.success).toBe(true)
      expect(result.firstClear).toBe(false)
      expect(result.laurelsEarned).toBe(0)
    })
  })

  describe('getDailyIncome', () => {
    it('returns 0 when no bouts cleared', () => {
      expect(store.getDailyIncome()).toBe(0)
    })

    it('returns 2 after clearing bout 1', () => {
      store.completeBout(1)
      expect(store.getDailyIncome()).toBe(2)
    })

    it('returns cumulative income for bouts 1-10 at 2/bout', () => {
      for (let i = 1; i <= 10; i++) store.completeBout(i)
      expect(store.getDailyIncome()).toBe(20) // 10 * 2
    })

    it('returns correct income crossing rate boundary', () => {
      for (let i = 1; i <= 11; i++) store.completeBout(i)
      expect(store.getDailyIncome()).toBe(23) // 10*2 + 1*3
    })

    it('returns 65 at bout 25', () => {
      for (let i = 1; i <= 25; i++) store.completeBout(i)
      expect(store.getDailyIncome()).toBe(65) // 10*2 + 15*3
    })

    it('returns 125 at bout 40', () => {
      for (let i = 1; i <= 40; i++) store.completeBout(i)
      expect(store.getDailyIncome()).toBe(125) // 10*2 + 15*3 + 15*4
    })

    it('returns 175 at bout 50', () => {
      for (let i = 1; i <= 50; i++) store.completeBout(i)
      expect(store.getDailyIncome()).toBe(175) // 10*2 + 15*3 + 15*4 + 10*5
    })
  })

  describe('collectDailyLaurels', () => {
    it('awards daily income based on highestBout', () => {
      for (let i = 1; i <= 10; i++) store.completeBout(i)
      const startLaurels = store.laurels
      store.collectDailyLaurels()
      expect(store.laurels).toBe(startLaurels + 20)
    })

    it('does not collect twice on the same day', () => {
      for (let i = 1; i <= 5; i++) store.completeBout(i)
      const startLaurels = store.laurels
      store.collectDailyLaurels()
      const afterFirst = store.laurels
      store.collectDailyLaurels()
      expect(store.laurels).toBe(afterFirst) // no double collection
    })

    it('returns 0 income with no bouts cleared', () => {
      const result = store.collectDailyLaurels()
      expect(result.collected).toBe(0)
    })

    it('returns the amount collected', () => {
      for (let i = 1; i <= 5; i++) store.completeBout(i)
      const result = store.collectDailyLaurels()
      expect(result.collected).toBe(10) // 5 * 2
    })
  })

  describe('spendLaurels', () => {
    it('deducts laurels when sufficient', () => {
      store.completeBout(1) // gives 10 laurels
      const result = store.spendLaurels(5)
      expect(result).toBe(true)
      expect(store.laurels).toBe(5)
    })

    it('returns false when insufficient', () => {
      store.completeBout(1) // gives 10 laurels
      const result = store.spendLaurels(15)
      expect(result).toBe(false)
      expect(store.laurels).toBe(10) // unchanged
    })

    it('returns false for zero or negative', () => {
      store.completeBout(1)
      expect(store.spendLaurels(0)).toBe(false)
      expect(store.spendLaurels(-5)).toBe(false)
    })
  })

  describe('addLaurels', () => {
    it('adds laurels', () => {
      store.addLaurels(100)
      expect(store.laurels).toBe(100)
    })
  })
})

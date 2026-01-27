import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('desperation heal scaling', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('calculateDesperationHeal', () => {
    it('returns base heal when target is at full HP', () => {
      const result = store.calculateDesperationHeal(100, 40, 80, 0)
      // 40 + 80 * 0 = 40% of 100 ATK = 40
      expect(result).toBe(40)
    })

    it('returns boosted heal when target is at 50% HP', () => {
      const result = store.calculateDesperationHeal(100, 40, 80, 0.5)
      // 40 + 80 * 0.5 = 80% of 100 ATK = 80
      expect(result).toBe(80)
    })

    it('returns max heal when target is near death', () => {
      const result = store.calculateDesperationHeal(100, 40, 80, 0.9)
      // 40 + 80 * 0.9 = 112% of 100 ATK = 112
      expect(result).toBe(112)
    })

    it('applies shard bonus', () => {
      const result = store.calculateDesperationHeal(100, 40, 80, 0, 10)
      // (40 + 10) + 80 * 0 = 50% of 100 ATK = 50
      expect(result).toBe(50)
    })
  })

  describe('calculatePartyMissingHpPercent', () => {
    it('returns 0 when all heroes are at full HP', () => {
      const heroes = [
        { currentHp: 100, maxHp: 100 },
        { currentHp: 200, maxHp: 200 }
      ]
      expect(store.calculatePartyMissingHpPercent(heroes)).toBe(0)
    })

    it('returns 0.5 when party is at 50% average HP', () => {
      const heroes = [
        { currentHp: 50, maxHp: 100 },
        { currentHp: 100, maxHp: 200 }
      ]
      expect(store.calculatePartyMissingHpPercent(heroes)).toBe(0.5)
    })

    it('returns 1 when all heroes are at 0 HP', () => {
      const heroes = [
        { currentHp: 0, maxHp: 100 },
        { currentHp: 0, maxHp: 200 }
      ]
      expect(store.calculatePartyMissingHpPercent(heroes)).toBe(1)
    })
  })
})

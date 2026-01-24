// src/stores/__tests__/explorations-ranks.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExplorationsStore } from '../explorations.js'

describe('explorations store - ranks', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useExplorationsStore()
  })

  describe('getExplorationRank', () => {
    it('returns E for exploration with no rank set', () => {
      expect(store.getExplorationRank('cave_exploration')).toBe('E')
    })

    it('returns stored rank when set', () => {
      store.explorationRanks['cave_exploration'] = 'C'
      expect(store.getExplorationRank('cave_exploration')).toBe('C')
    })
  })

  describe('getRankMultiplier', () => {
    it('returns 1.0 for rank E', () => {
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.0)
    })

    it('returns 1.05 for rank D', () => {
      store.explorationRanks['cave_exploration'] = 'D'
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.05)
    })

    it('returns 1.10 for rank C', () => {
      store.explorationRanks['cave_exploration'] = 'C'
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.10)
    })

    it('returns 1.25 for rank S', () => {
      store.explorationRanks['cave_exploration'] = 'S'
      expect(store.getRankMultiplier('cave_exploration')).toBe(1.25)
    })
  })

  describe('canUpgradeExploration', () => {
    it('returns canUpgrade false if exploration is active', () => {
      store.activeExplorations['cave_exploration'] = { nodeId: 'cave_exploration' }
      const result = store.canUpgradeExploration('cave_exploration')
      expect(result.canUpgrade).toBe(false)
      expect(result.reason).toBe('Exploration in progress')
    })

    it('returns canUpgrade false if already rank S', () => {
      store.explorationRanks['cave_exploration'] = 'S'
      const result = store.canUpgradeExploration('cave_exploration')
      expect(result.canUpgrade).toBe(false)
      expect(result.reason).toBe('Already max rank')
    })

    it('returns cost info for valid upgrade check', () => {
      const result = store.canUpgradeExploration('cave_exploration')
      expect(result.currentRank).toBe('E')
      expect(result.nextRank).toBe('D')
      expect(result.crestId).toBe('valinar_crest')
      expect(result.crestsNeeded).toBe(1)
      expect(result.goldNeeded).toBe(1000)
    })

    it('returns canUpgrade false if not enough crests', () => {
      // No crests in inventory by default
      const result = store.canUpgradeExploration('cave_exploration')
      expect(result.canUpgrade).toBe(false)
      expect(result.crestsHave).toBe(0)
    })
  })
})

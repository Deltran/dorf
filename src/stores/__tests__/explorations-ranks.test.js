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
})

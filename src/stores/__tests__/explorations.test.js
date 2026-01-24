import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExplorationsStore } from '../explorations'
import { useHeroesStore } from '../heroes'

describe('explorations store', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useExplorationsStore()
    heroesStore = useHeroesStore()
  })

  describe('initial state', () => {
    it('has empty activeExplorations', () => {
      expect(store.activeExplorations).toEqual({})
    })

    it('has empty completedHistory', () => {
      expect(store.completedHistory).toEqual([])
    })

    it('has empty pendingCompletions', () => {
      expect(store.pendingCompletions).toEqual([])
    })
  })

  describe('getExplorationNode', () => {
    it('returns exploration node by id', () => {
      const node = store.getExplorationNode('cave_exploration')
      expect(node).toBeDefined()
      expect(node.type).toBe('exploration')
      expect(node.explorationConfig.requiredFights).toBe(50)
    })

    it('returns null for non-exploration node', () => {
      const node = store.getExplorationNode('cave_01')
      expect(node).toBeNull()
    })
  })

  describe('unlockedExplorations', () => {
    it('returns empty when no nodes completed', () => {
      expect(store.unlockedExplorations).toEqual([])
    })
  })

  describe('activeExplorationCount', () => {
    it('returns 0 when no active explorations', () => {
      expect(store.activeExplorationCount).toBe(0)
    })
  })
})

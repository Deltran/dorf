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

  describe('startExploration', () => {
    it('creates active exploration with 5 heroes', () => {
      // Add 5 heroes
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)

      const result = store.startExploration('cave_exploration', heroIds)

      expect(result.success).toBe(true)
      expect(store.activeExplorations['cave_exploration']).toBeDefined()
      expect(store.activeExplorations['cave_exploration'].heroes).toEqual(heroIds)
      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(0)
    })

    it('locks all heroes to the exploration', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)

      store.startExploration('cave_exploration', heroIds)

      heroIds.forEach(id => {
        expect(heroesStore.isHeroLocked(id)).toBe(true)
      })
    })

    it('fails with less than 5 heroes', () => {
      const heroes = []
      for (let i = 0; i < 3; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)

      const result = store.startExploration('cave_exploration', heroIds)

      expect(result.success).toBe(false)
      expect(result.error).toContain('5 heroes')
    })

    it('fails if exploration already active', () => {
      const heroes1 = []
      const heroes2 = []
      for (let i = 0; i < 5; i++) {
        heroes1.push(heroesStore.addHero('militia_soldier'))
        heroes2.push(heroesStore.addHero('militia_soldier'))
      }

      store.startExploration('cave_exploration', heroes1.map(h => h.instanceId))
      const result = store.startExploration('cave_exploration', heroes2.map(h => h.instanceId))

      expect(result.success).toBe(false)
      expect(result.error).toContain('already active')
    })

    it('fails if hero is already locked', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      heroesStore.lockHeroToExploration(heroes[0].instanceId, 'other_exploration')

      const result = store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      expect(result.success).toBe(false)
      expect(result.error).toContain('unavailable')
    })

    it('records startedAt timestamp', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const before = Date.now()

      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      const after = Date.now()
      const startedAt = store.activeExplorations['cave_exploration'].startedAt
      expect(startedAt).toBeGreaterThanOrEqual(before)
      expect(startedAt).toBeLessThanOrEqual(after)
    })
  })
})

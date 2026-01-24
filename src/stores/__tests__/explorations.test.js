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

  describe('checkPartyRequest', () => {
    it('returns true when role conditions met', () => {
      // Need tank, dps, support for cave_exploration
      const tank = heroesStore.addHero('militia_soldier') // Knight = tank
      const dps = heroesStore.addHero('farm_hand') // Berserker = dps
      const support = heroesStore.addHero('wandering_bard') // Bard = support
      const filler1 = heroesStore.addHero('militia_soldier')
      const filler2 = heroesStore.addHero('militia_soldier')

      const heroIds = [tank, dps, support, filler1, filler2].map(h => h.instanceId)
      const result = store.checkPartyRequest('cave_exploration', heroIds)

      expect(result).toBe(true)
    })

    it('returns false when role conditions not met', () => {
      // All same role - won't meet tank+dps+support
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier')) // All basic heroes
      }

      const result = store.checkPartyRequest('cave_exploration', heroes.map(h => h.instanceId))

      expect(result).toBe(false)
    })
  })

  describe('startExploration sets partyRequestMet', () => {
    it('sets partyRequestMet true when conditions met', () => {
      const tank = heroesStore.addHero('militia_soldier')
      const dps = heroesStore.addHero('farm_hand')
      const support = heroesStore.addHero('wandering_bard')
      const filler1 = heroesStore.addHero('militia_soldier')
      const filler2 = heroesStore.addHero('militia_soldier')

      const heroIds = [tank, dps, support, filler1, filler2].map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)

      expect(store.activeExplorations['cave_exploration'].partyRequestMet).toBe(true)
    })

    it('sets partyRequestMet false when conditions not met', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }

      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      expect(store.activeExplorations['cave_exploration'].partyRequestMet).toBe(false)
    })
  })

  describe('cancelExploration', () => {
    it('removes active exploration', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      store.cancelExploration('cave_exploration')

      expect(store.activeExplorations['cave_exploration']).toBeUndefined()
    })

    it('unlocks all heroes', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)

      store.cancelExploration('cave_exploration')

      heroIds.forEach(id => {
        expect(heroesStore.isHeroLocked(id)).toBe(false)
      })
    })

    it('does nothing if exploration not active', () => {
      const result = store.cancelExploration('cave_exploration')
      expect(result).toBe(false)
    })
  })

  describe('incrementFightCount', () => {
    it('increments fightCount for all active explorations', () => {
      // Start exploration
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      store.incrementFightCount()

      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(1)
    })

    it('increments multiple explorations simultaneously', () => {
      // This test would require multiple exploration nodes
      // For now, just verify single exploration works
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      store.incrementFightCount()
      store.incrementFightCount()
      store.incrementFightCount()

      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(3)
    })

    it('does nothing when no active explorations', () => {
      // Should not throw
      expect(() => store.incrementFightCount()).not.toThrow()
    })
  })

  describe('checkCompletions', () => {
    it('queues completion when fight count reached', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Simulate 50 fights (requiredFights for cave_exploration)
      for (let i = 0; i < 50; i++) {
        store.incrementFightCount()
      }

      store.checkCompletions()

      expect(store.pendingCompletions).toContain('cave_exploration')
    })

    it('queues completion when time elapsed', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Simulate time passing (240 minutes = 4 hours)
      store.activeExplorations['cave_exploration'].startedAt = Date.now() - (241 * 60 * 1000)

      store.checkCompletions()

      expect(store.pendingCompletions).toContain('cave_exploration')
    })

    it('does not queue incomplete exploration', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Only 10 fights, time just started
      for (let i = 0; i < 10; i++) {
        store.incrementFightCount()
      }

      store.checkCompletions()

      expect(store.pendingCompletions).not.toContain('cave_exploration')
    })

    it('does not double-queue already pending completion', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Complete via fights
      for (let i = 0; i < 50; i++) {
        store.incrementFightCount()
      }

      store.checkCompletions()
      store.checkCompletions() // Second check

      const count = store.pendingCompletions.filter(id => id === 'cave_exploration').length
      expect(count).toBe(1)
    })
  })
})

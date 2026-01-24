import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExplorationsStore } from '../explorations'
import { useHeroesStore } from '../heroes'
import { useGachaStore } from '../gacha'
import { useInventoryStore } from '../inventory'

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

  describe('claimCompletion', () => {
    let gachaStore
    let inventoryStore

    beforeEach(() => {
      gachaStore = useGachaStore()
      inventoryStore = useInventoryStore()
    })

    it('adds gold and gems to gacha store', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      const initialGold = gachaStore.gold
      const initialGems = gachaStore.gems

      store.claimCompletion('cave_exploration')

      // Base rewards: gold 500, gems 20
      expect(gachaStore.gold).toBe(initialGold + 500)
      expect(gachaStore.gems).toBe(initialGems + 20)
    })

    it('applies +10% bonus when partyRequestMet', () => {
      // Create party that meets request (tank, dps, support)
      // militia_soldier = knight = tank
      // farm_hand = berserker = dps
      // wandering_bard = bard = support
      const tank = heroesStore.addHero('militia_soldier')
      const dps = heroesStore.addHero('farm_hand')
      const support = heroesStore.addHero('wandering_bard')
      const filler1 = heroesStore.addHero('militia_soldier')
      const filler2 = heroesStore.addHero('militia_soldier')

      const heroIds = [tank, dps, support, filler1, filler2].map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      const initialGold = gachaStore.gold

      store.claimCompletion('cave_exploration')

      // 500 * 1.10 = 550
      expect(gachaStore.gold).toBe(initialGold + 550)
    })

    it('distributes XP to heroes', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      // XP 300 / 5 heroes = 60 each
      heroIds.forEach(id => {
        const hero = heroesStore.collection.find(h => h.instanceId === id)
        expect(hero.exp).toBeGreaterThan(0)
      })
    })

    it('unlocks heroes', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      heroIds.forEach(id => {
        expect(heroesStore.isHeroLocked(id)).toBe(false)
      })
    })

    it('removes from pendingCompletions', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.pendingCompletions).not.toContain('cave_exploration')
    })

    it('removes from activeExplorations', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.activeExplorations['cave_exploration']).toBeUndefined()
    })

    it('adds to completedHistory', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      const heroIds = heroes.map(h => h.instanceId)
      store.startExploration('cave_exploration', heroIds)
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.completedHistory.length).toBe(1)
      expect(store.completedHistory[0].nodeId).toBe('cave_exploration')
      expect(store.completedHistory[0].heroes).toEqual(heroIds)
    })

    it('limits completedHistory to 10 entries', () => {
      // Add 10 entries manually
      for (let i = 0; i < 10; i++) {
        store.completedHistory.push({ nodeId: `old_${i}`, heroes: [], completedAt: Date.now() })
      }

      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      for (let i = 0; i < 50; i++) store.incrementFightCount()
      store.checkCompletions()

      store.claimCompletion('cave_exploration')

      expect(store.completedHistory.length).toBe(10)
      expect(store.completedHistory[9].nodeId).toBe('cave_exploration')
    })
  })

  describe('nextCompletion', () => {
    it('returns null when no active explorations', () => {
      expect(store.nextCompletion).toBeNull()
    })

    it('returns exploration closest to completion by fights', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // 40 fights done, 10 remaining
      for (let i = 0; i < 40; i++) store.incrementFightCount()

      const next = store.nextCompletion
      expect(next).toBeDefined()
      expect(next.nodeId).toBe('cave_exploration')
      expect(next.fightsRemaining).toBe(10)
    })

    it('calculates time remaining', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))

      // Started 60 minutes ago (1 hour), timeLimit is 240 minutes
      store.activeExplorations['cave_exploration'].startedAt = Date.now() - (60 * 60 * 1000)

      const next = store.nextCompletion
      // ~180 minutes remaining (3 hours)
      expect(next.timeRemainingMs).toBeGreaterThan(179 * 60 * 1000)
      expect(next.timeRemainingMs).toBeLessThan(181 * 60 * 1000)
    })
  })

  describe('claimCompletion with rank bonus', () => {
    it('applies rank multiplier to rewards', () => {
      // Setup: start and complete an exploration at rank C (+10%)
      const store = useExplorationsStore()
      const heroesStore = useHeroesStore()
      const gachaStore = useGachaStore()

      // Create 5 heroes
      for (let i = 0; i < 5; i++) {
        heroesStore.addHero('militia_soldier')
      }
      const heroIds = heroesStore.collection.map(h => h.instanceId)

      // Set rank to C
      store.explorationRanks['cave_exploration'] = 'C'

      // Start exploration
      store.startExploration('cave_exploration', heroIds)

      // Force completion
      store.activeExplorations['cave_exploration'].fightCount = 50

      // Record starting gold
      const startGold = gachaStore.gold

      // Claim
      const result = store.claimCompletion('cave_exploration')

      // Base gold is 500, rank C = 1.10, no party bonus = 550
      expect(result.gold).toBe(550)
    })
  })

  describe('persistence', () => {
    it('saves and loads activeExplorations', () => {
      const heroes = []
      for (let i = 0; i < 5; i++) {
        heroes.push(heroesStore.addHero('militia_soldier'))
      }
      store.startExploration('cave_exploration', heroes.map(h => h.instanceId))
      store.incrementFightCount()

      const saved = store.saveState()

      // Reset and reload
      store.activeExplorations = {}
      store.loadState(saved)

      expect(store.activeExplorations['cave_exploration']).toBeDefined()
      expect(store.activeExplorations['cave_exploration'].fightCount).toBe(1)
    })

    it('saves and loads completedHistory', () => {
      store.completedHistory.push({
        nodeId: 'cave_exploration',
        heroes: ['a', 'b', 'c', 'd', 'e'],
        completedAt: 12345,
        rewards: { gold: 500, gems: 20, xp: 300 }
      })

      const saved = store.saveState()

      store.completedHistory = []
      store.loadState(saved)

      expect(store.completedHistory.length).toBe(1)
      expect(store.completedHistory[0].nodeId).toBe('cave_exploration')
    })
  })
})

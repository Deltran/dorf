import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHeroesStore } from '../heroes'

describe('heroes store - exploration locking', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useHeroesStore()
  })

  describe('isHeroLocked', () => {
    it('returns false for hero not on exploration', () => {
      const hero = store.addHero('militia_soldier')
      expect(store.isHeroLocked(hero.instanceId)).toBe(false)
    })

    it('returns true for hero on exploration', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      expect(store.isHeroLocked(hero.instanceId)).toBe(true)
    })
  })

  describe('lockHeroToExploration', () => {
    it('sets explorationNodeId on hero', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      const updated = store.collection.find(h => h.instanceId === hero.instanceId)
      expect(updated.explorationNodeId).toBe('cave_exploration')
    })

    it('fails if hero already locked', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      const result = store.lockHeroToExploration(hero.instanceId, 'other_exploration')
      expect(result).toBe(false)
    })
  })

  describe('unlockHeroFromExploration', () => {
    it('clears explorationNodeId on hero', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      store.unlockHeroFromExploration(hero.instanceId)
      const updated = store.collection.find(h => h.instanceId === hero.instanceId)
      expect(updated.explorationNodeId).toBeNull()
    })
  })

  describe('availableForExploration', () => {
    it('excludes heroes in party', () => {
      const hero1 = store.addHero('militia_soldier')
      const hero2 = store.addHero('apprentice_mage')
      store.setPartySlot(0, hero1.instanceId)

      const available = store.availableForExploration
      expect(available.some(h => h.instanceId === hero1.instanceId)).toBe(false)
      expect(available.some(h => h.instanceId === hero2.instanceId)).toBe(true)
    })

    it('excludes heroes already on exploration', () => {
      const hero1 = store.addHero('militia_soldier')
      const hero2 = store.addHero('apprentice_mage')
      store.lockHeroToExploration(hero1.instanceId, 'cave_exploration')

      const available = store.availableForExploration
      expect(available.some(h => h.instanceId === hero1.instanceId)).toBe(false)
      expect(available.some(h => h.instanceId === hero2.instanceId)).toBe(true)
    })
  })

  describe('party assignment blocks locked heroes', () => {
    it('setPartySlot fails for locked hero', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')
      const result = store.setPartySlot(0, hero.instanceId)
      expect(result).toBe(false)
      expect(store.party[0]).toBeNull()
    })
  })

  describe('persistence', () => {
    it('saves and loads explorationNodeId', () => {
      const hero = store.addHero('militia_soldier')
      store.lockHeroToExploration(hero.instanceId, 'cave_exploration')

      const saved = store.saveState()

      // Create new store and load
      const newStore = useHeroesStore()
      newStore.loadState(saved)

      expect(newStore.isHeroLocked(hero.instanceId)).toBe(true)
    })
  })
})

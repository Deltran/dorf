import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('battle store - Blood Tempo tracking', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('getBloodTempoUses', () => {
    it('returns 0 for hero with no Blood Tempo uses', () => {
      expect(store.getBloodTempoUses('hero_123')).toBe(0)
    })

    it('returns tracked count for hero with Blood Tempo uses', () => {
      store.incrementBloodTempoUses('hero_123')
      store.incrementBloodTempoUses('hero_123')
      expect(store.getBloodTempoUses('hero_123')).toBe(2)
    })
  })

  describe('incrementBloodTempoUses', () => {
    it('increments the counter for a hero', () => {
      store.incrementBloodTempoUses('hero_abc')
      expect(store.getBloodTempoUses('hero_abc')).toBe(1)
    })

    it('increments independently per hero', () => {
      store.incrementBloodTempoUses('hero_1')
      store.incrementBloodTempoUses('hero_1')
      store.incrementBloodTempoUses('hero_2')

      expect(store.getBloodTempoUses('hero_1')).toBe(2)
      expect(store.getBloodTempoUses('hero_2')).toBe(1)
    })
  })

  describe('initBattle - bloodTempoUses reset', () => {
    it('resets bloodTempoUses to empty on new battle', () => {
      // Simulate some Blood Tempo uses from a previous battle
      store.incrementBloodTempoUses('old_hero_1')
      store.incrementBloodTempoUses('old_hero_2')
      store.incrementBloodTempoUses('old_hero_2')

      expect(store.getBloodTempoUses('old_hero_1')).toBe(1)
      expect(store.getBloodTempoUses('old_hero_2')).toBe(2)

      // Add a hero to party for initBattle
      const hero = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, hero.instanceId)

      // Initialize new battle
      store.initBattle(null, ['goblin_scout'])

      // Old tracking should be reset
      expect(store.getBloodTempoUses('old_hero_1')).toBe(0)
      expect(store.getBloodTempoUses('old_hero_2')).toBe(0)
    })

    it('starts with 0 Blood Tempo uses for all heroes', () => {
      const hero = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, hero.instanceId)

      store.initBattle(null, ['goblin_scout'])

      const battleHero = store.heroes[0]
      expect(store.getBloodTempoUses(battleHero.instanceId)).toBe(0)
    })
  })
})

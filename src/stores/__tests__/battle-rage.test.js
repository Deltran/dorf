import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('battle store - rage helpers', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('isBerserker', () => {
    it('returns true for units with rage resourceType', () => {
      const berserker = { class: { resourceType: 'rage' } }
      expect(store.isBerserker(berserker)).toBe(true)
    })

    it('returns false for non-berserkers', () => {
      const knight = { class: { resourceType: undefined } }
      expect(store.isBerserker(knight)).toBe(false)
    })

    it('returns false for rangers', () => {
      const ranger = { class: { resourceType: 'focus' } }
      expect(store.isBerserker(ranger)).toBe(false)
    })
  })

  describe('gainRage', () => {
    it('increases currentRage by specified amount', () => {
      const unit = { currentRage: 0 }
      store.gainRage(unit, 5)
      expect(unit.currentRage).toBe(5)
    })

    it('caps rage at 100', () => {
      const unit = { currentRage: 98 }
      store.gainRage(unit, 10)
      expect(unit.currentRage).toBe(100)
    })

    it('does nothing if unit has no currentRage property', () => {
      const unit = {}
      store.gainRage(unit, 5)
      expect(unit.currentRage).toBeUndefined()
    })
  })

  describe('spendRage', () => {
    it('decreases currentRage by specified amount', () => {
      const unit = { currentRage: 50 }
      store.spendRage(unit, 25)
      expect(unit.currentRage).toBe(25)
    })

    it('does not go below 0', () => {
      const unit = { currentRage: 10 }
      store.spendRage(unit, 25)
      expect(unit.currentRage).toBe(0)
    })
  })

  describe('initBattle - berserker initialization', () => {
    it('initializes berserkers with currentRage 0', () => {
      // Add a berserker hero to the collection and party
      const hero = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, hero.instanceId)

      store.initBattle(null, [])

      const battleHero = store.heroes[0]
      expect(battleHero.currentRage).toBe(0)
    })

    it('does not add currentRage to non-berserkers', () => {
      // Add a knight hero to the collection and party
      const hero = heroesStore.addHero('sir_gallan')
      heroesStore.setPartySlot(0, hero.instanceId)

      store.initBattle(null, [])

      const battleHero = store.heroes[0]
      expect(battleHero.currentRage).toBeUndefined()
    })

    it('preserves existing currentRage from saved state', () => {
      // Add a berserker hero to the collection and party
      const hero = heroesStore.addHero('shadow_king')
      heroesStore.setPartySlot(0, hero.instanceId)

      // Create saved state with existing rage
      const partyState = {
        [hero.instanceId]: {
          currentHp: 100,
          currentMp: 50,
          currentRage: 45
        }
      }

      store.initBattle(partyState, [])

      const battleHero = store.heroes[0]
      expect(battleHero.currentRage).toBe(45)
    })
  })
})

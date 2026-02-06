// src/stores/__tests__/battle-essence.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { classes } from '../../data/classes'

describe('battle store - Essence resource system', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('Alchemist class', () => {
    it('has Essence resource type defined', () => {
      expect(classes.alchemist.resourceType).toBe('essence')
      expect(classes.alchemist.resourceName).toBe('Essence')
    })
  })

  describe('Essence initialization', () => {
    it('initializes Alchemist with currentEssence', () => {
      const hero = {
        instanceId: 'alch1',
        class: { resourceType: 'essence' },
        template: { baseStats: { mp: 60 } }
      }

      store.initializeEssence(hero)

      expect(hero.currentEssence).toBe(20) // 50% minus 10
      expect(hero.maxEssence).toBe(60)
    })
  })

  describe('Essence regeneration', () => {
    it('regenerates 10 Essence per turn', () => {
      const hero = {
        instanceId: 'alch1',
        class: { resourceType: 'essence' },
        currentEssence: 20,
        maxEssence: 60
      }

      store.regenerateEssence(hero)

      expect(hero.currentEssence).toBe(30)
    })

    it('caps at maxEssence', () => {
      const hero = {
        instanceId: 'alch1',
        class: { resourceType: 'essence' },
        currentEssence: 55,
        maxEssence: 60
      }

      store.regenerateEssence(hero)

      expect(hero.currentEssence).toBe(60)
    })
  })

  describe('Volatility tiers', () => {
    it('returns Stable for 0-20 Essence', () => {
      const hero = { currentEssence: 15, class: { resourceType: 'essence' } }
      expect(store.getVolatilityTier(hero)).toBe('stable')
    })

    it('returns Reactive for 21-40 Essence', () => {
      const hero = { currentEssence: 30, class: { resourceType: 'essence' } }
      expect(store.getVolatilityTier(hero)).toBe('reactive')
    })

    it('returns Volatile for 41-60 Essence', () => {
      const hero = { currentEssence: 50, class: { resourceType: 'essence' } }
      expect(store.getVolatilityTier(hero)).toBe('volatile')
    })
  })

  describe('Volatility damage bonus', () => {
    it('returns 0% bonus for Stable', () => {
      const hero = { currentEssence: 15, class: { resourceType: 'essence' } }
      expect(store.getVolatilityDamageBonus(hero)).toBe(0)
    })

    it('returns 15% bonus for Reactive', () => {
      const hero = { currentEssence: 30, class: { resourceType: 'essence' } }
      expect(store.getVolatilityDamageBonus(hero)).toBe(15)
    })

    it('returns 30% bonus for Volatile', () => {
      const hero = { currentEssence: 50, class: { resourceType: 'essence' } }
      expect(store.getVolatilityDamageBonus(hero)).toBe(30)
    })
  })

  describe('Volatility self-damage', () => {
    it('returns 0 for non-Volatile', () => {
      const hero = { currentEssence: 30, maxHp: 100, class: { resourceType: 'essence' } }
      expect(store.getVolatilitySelfDamage(hero)).toBe(0)
    })

    it('returns 5% max HP for Volatile', () => {
      const hero = { currentEssence: 50, maxHp: 100, class: { resourceType: 'essence' } }
      expect(store.getVolatilitySelfDamage(hero)).toBe(5)
    })
  })

  describe('Essence in battle flow (integration)', () => {
    let heroesStore

    beforeEach(async () => {
      const { useHeroesStore } = await import('../heroes')
      heroesStore = useHeroesStore()
    })

    it('initializes Essence when Alchemist enters battle via initBattle', () => {
      // Add Zina (an Alchemist) to the party
      const zina = heroesStore.addHero('zina_the_desperate')
      heroesStore.setPartySlot(0, zina.instanceId)

      // Start a battle
      store.initBattle({}, ['goblin_scout'])

      // Verify Essence was initialized
      const battleZina = store.heroes.find(h => h.templateId === 'zina_the_desperate')
      expect(battleZina).toBeDefined()
      expect(battleZina.maxEssence).toBe(60) // Zina's MP stat
      expect(battleZina.currentEssence).toBe(20) // 50% of maxEssence minus 10
    })

    it('does not initialize Essence for non-Alchemist heroes', () => {
      // Add Aurora (a Paladin) to the party
      const aurora = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, aurora.instanceId)

      // Start a battle
      store.initBattle({}, ['goblin_scout'])

      // Verify Essence was NOT initialized
      const battleAurora = store.heroes.find(h => h.templateId === 'aurora_the_dawn')
      expect(battleAurora).toBeDefined()
      expect(battleAurora.maxEssence).toBeUndefined()
      expect(battleAurora.currentEssence).toBeUndefined()
    })
  })
})

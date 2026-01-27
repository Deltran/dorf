import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('battle store - valor consumption (valorCost: all)', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('resolveValorCost', () => {
    it('consumes all valor and returns correct damagePercent at 100 Valor', () => {
      const hero = {
        currentValor: 100,
        class: { resourceType: 'valor' }
      }
      const skill = {
        valorCost: 'all',
        baseDamage: 50,
        damagePerValor: 2
      }

      const result = store.resolveValorCost(hero, skill)

      expect(result.valorConsumed).toBe(100)
      expect(result.damagePercent).toBe(250) // 50 + (100 * 2)
      expect(hero.currentValor).toBe(0)
    })

    it('consumes all valor and returns correct damagePercent at 50 Valor', () => {
      const hero = {
        currentValor: 50,
        class: { resourceType: 'valor' }
      }
      const skill = {
        valorCost: 'all',
        baseDamage: 50,
        damagePerValor: 2
      }

      const result = store.resolveValorCost(hero, skill)

      expect(result.valorConsumed).toBe(50)
      expect(result.damagePercent).toBe(150) // 50 + (50 * 2)
      expect(hero.currentValor).toBe(0)
    })

    it('consumes all valor and returns correct damagePercent at 75 Valor', () => {
      const hero = {
        currentValor: 75,
        class: { resourceType: 'valor' }
      }
      const skill = {
        valorCost: 'all',
        baseDamage: 50,
        damagePerValor: 2
      }

      const result = store.resolveValorCost(hero, skill)

      expect(result.valorConsumed).toBe(75)
      expect(result.damagePercent).toBe(200) // 50 + (75 * 2)
      expect(hero.currentValor).toBe(0)
    })

    it('returns zero values for non-valorCost skills', () => {
      const hero = {
        currentValor: 100,
        class: { resourceType: 'valor' }
      }
      const skill = {
        damagePercent: 120,
        targetType: 'enemy'
      }

      const result = store.resolveValorCost(hero, skill)

      expect(result.valorConsumed).toBe(0)
      expect(result.damagePercent).toBe(0)
      // Valor should NOT be consumed
      expect(hero.currentValor).toBe(100)
    })

    it('returns zero values for non-knight units', () => {
      const hero = {
        currentRage: 100,
        class: { resourceType: 'rage' }
      }
      const skill = {
        valorCost: 'all',
        baseDamage: 50,
        damagePerValor: 2
      }

      const result = store.resolveValorCost(hero, skill)

      expect(result.valorConsumed).toBe(0)
      expect(result.damagePercent).toBe(0)
    })

    it('handles hero with 0 valor (edge case)', () => {
      const hero = {
        currentValor: 0,
        class: { resourceType: 'valor' }
      }
      const skill = {
        valorCost: 'all',
        baseDamage: 50,
        damagePerValor: 2
      }

      const result = store.resolveValorCost(hero, skill)

      expect(result.valorConsumed).toBe(0)
      expect(result.damagePercent).toBe(50) // 50 + (0 * 2) = baseDamage only
      expect(hero.currentValor).toBe(0)
    })

    it('handles hero with undefined currentValor', () => {
      const hero = {
        class: { resourceType: 'valor' }
      }
      const skill = {
        valorCost: 'all',
        baseDamage: 50,
        damagePerValor: 2
      }

      const result = store.resolveValorCost(hero, skill)

      expect(result.valorConsumed).toBe(0)
      expect(result.damagePercent).toBe(50) // baseDamage only
      expect(hero.currentValor).toBe(0)
    })
  })

  describe('canUseSkill - knight valorCost: all', () => {
    it('allows skill when currentValor >= valorRequired', () => {
      const hero = heroesStore.addHero('sir_gallan')
      heroesStore.setPartySlot(0, hero.instanceId)
      store.initBattle({}, ['goblin_scout'])

      const knight = store.heroes[0]
      store.gainValor(knight, 100)
      knight.skill = { valorCost: 'all', valorRequired: 50, baseDamage: 50, damagePerValor: 2 }

      expect(store.canUseSkill(knight)).toBe(true)
    })

    it('blocks skill when currentValor < valorRequired', () => {
      const hero = heroesStore.addHero('sir_gallan')
      heroesStore.setPartySlot(0, hero.instanceId)
      store.initBattle({}, ['goblin_scout'])

      const knight = store.heroes[0]
      store.gainValor(knight, 30)
      knight.skill = { valorCost: 'all', valorRequired: 50, baseDamage: 50, damagePerValor: 2 }

      expect(store.canUseSkill(knight)).toBe(false)
    })

    it('allows skill at exactly valorRequired', () => {
      const hero = heroesStore.addHero('sir_gallan')
      heroesStore.setPartySlot(0, hero.instanceId)
      store.initBattle({}, ['goblin_scout'])

      const knight = store.heroes[0]
      store.gainValor(knight, 50)
      knight.skill = { valorCost: 'all', valorRequired: 50, baseDamage: 50, damagePerValor: 2 }

      expect(store.canUseSkill(knight)).toBe(true)
    })

    it('allows regular knight skills without valorCost', () => {
      const hero = heroesStore.addHero('sir_gallan')
      heroesStore.setPartySlot(0, hero.instanceId)
      store.initBattle({}, ['goblin_scout'])

      const knight = store.heroes[0]
      // Knight with 0 valor should still be able to use regular skills
      knight.skill = { damagePercent: 120, targetType: 'enemy' }

      expect(store.canUseSkill(knight)).toBe(true)
    })
  })
})

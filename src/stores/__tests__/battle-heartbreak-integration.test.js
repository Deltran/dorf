// src/stores/__tests__/battle-heartbreak-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('Heartbreak integration with battle flow', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('initBattle initialization', () => {
    it('initializes Mara with heartbreakStacks in initBattle', () => {
      // Add Mara to the roster and party
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      // Start a battle
      store.initBattle({}, ['goblin_scout'])

      // Check that Mara has heartbreakStacks initialized
      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      expect(battleMara).toBeDefined()
      expect(battleMara.heartbreakStacks).toBe(0)
    })

    it('does not add heartbreakStacks to heroes without heartbreakPassive', () => {
      // Add a regular hero (not Mara)
      const hero = heroesStore.addHero('aurora_the_dawn')
      heroesStore.setPartySlot(0, hero.instanceId)

      // Start a battle
      store.initBattle({}, ['goblin_scout'])

      // Check that Aurora doesn't have heartbreakStacks
      const battleHero = store.heroes.find(h => h.templateId === 'aurora_the_dawn')
      expect(battleHero).toBeDefined()
      expect(battleHero.heartbreakStacks).toBeUndefined()
    })
  })

  describe('getHeartbreakBonuses', () => {
    it('applies Heartbreak ATK bonus to damage calculation', () => {
      const mara = {
        instanceId: 'mara1',
        template: {
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3
          }
        },
        heartbreakStacks: 3,
        stats: { atk: 100 }
      }

      const bonuses = store.getHeartbreakBonuses(mara)
      expect(bonuses.atkBonus).toBe(12) // 3 stacks * 4% = 12%
      expect(bonuses.lifestealBonus).toBe(9) // 3 stacks * 3% = 9%

      // Verify effective ATK calculation
      const effectiveAtk = 100 * (1 + bonuses.atkBonus / 100)
      expect(effectiveAtk).toBeCloseTo(112)
    })

    it('returns zero bonuses for hero without heartbreakPassive', () => {
      const regularHero = {
        instanceId: 'hero1',
        template: { id: 'some_hero' },
        heartbreakStacks: undefined
      }

      const bonuses = store.getHeartbreakBonuses(regularHero)
      expect(bonuses.atkBonus).toBe(0)
      expect(bonuses.lifestealBonus).toBe(0)
    })
  })

  describe('applyDamage Heartbreak triggers', () => {
    it('triggers Heartbreak when ally drops below 50% HP', () => {
      // Manually set up battle state with Mara and an ally
      const mara = {
        instanceId: 'mara1',
        templateId: 'mara_thornheart',
        template: {
          id: 'mara_thornheart',
          name: 'Mara Thornheart',
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3,
            triggers: { allyBelowHalfHp: true, heavyDamagePercent: 15, allyDeath: true }
          }
        },
        currentHp: 500,
        maxHp: 500,
        heartbreakStacks: 0,
        statusEffects: []
      }

      const ally = {
        instanceId: 'ally1',
        templateId: 'test_ally',
        template: { id: 'test_ally', name: 'Test Ally' },
        currentHp: 600, // Will drop below 50% of 1000
        maxHp: 1000,
        heartbreakStacks: undefined,
        statusEffects: [],
        triggeredHeartbreak: false
      }

      // Set up battle state
      store.heroes.push(mara)
      store.heroes.push(ally)
      store.enemies.push({
        id: 'enemy1',
        templateId: 'goblin_scout',
        template: { id: 'goblin_scout', name: 'Goblin Scout' },
        currentHp: 100,
        maxHp: 100,
        stats: { atk: 20, def: 5, spd: 10 },
        statusEffects: []
      })

      // Apply damage to ally that drops them below 50%
      // Ally at 600/1000, we deal 200 damage -> 400/1000 = 40% HP
      store.applyDamage(ally, 200, 'attack')

      // Mara should have gained a stack
      expect(mara.heartbreakStacks).toBe(1)
      expect(ally.triggeredHeartbreak).toBe(true)
    })

    it('triggers Heartbreak when Mara takes heavy damage (15%+ max HP)', () => {
      const mara = {
        instanceId: 'mara1',
        templateId: 'mara_thornheart',
        template: {
          id: 'mara_thornheart',
          name: 'Mara Thornheart',
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3,
            triggers: { allyBelowHalfHp: true, heavyDamagePercent: 15, allyDeath: true }
          }
        },
        currentHp: 500,
        maxHp: 500,
        heartbreakStacks: 0,
        statusEffects: []
      }

      // Set up battle state
      store.heroes.push(mara)
      store.enemies.push({
        id: 'enemy1',
        templateId: 'goblin_scout',
        template: { id: 'goblin_scout', name: 'Goblin Scout' },
        currentHp: 100,
        maxHp: 100,
        stats: { atk: 20, def: 5, spd: 10 },
        statusEffects: []
      })

      // Apply heavy damage to Mara (80 damage = 16% of 500 max HP)
      store.applyDamage(mara, 80, 'attack')

      // Mara should have gained a stack from heavy damage
      expect(mara.heartbreakStacks).toBe(1)
    })

    it('triggers Heartbreak when ally dies', () => {
      const mara = {
        instanceId: 'mara1',
        templateId: 'mara_thornheart',
        template: {
          id: 'mara_thornheart',
          name: 'Mara Thornheart',
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3,
            triggers: { allyBelowHalfHp: true, heavyDamagePercent: 15, allyDeath: true }
          }
        },
        currentHp: 500,
        maxHp: 500,
        heartbreakStacks: 0,
        statusEffects: []
      }

      const ally = {
        instanceId: 'ally1',
        templateId: 'test_ally',
        template: { id: 'test_ally', name: 'Test Ally' },
        currentHp: 50, // Will die from damage
        maxHp: 1000,
        heartbreakStacks: undefined,
        statusEffects: [],
        triggeredHeartbreak: false
      }

      // Set up battle state
      store.heroes.push(mara)
      store.heroes.push(ally)
      store.enemies.push({
        id: 'enemy1',
        templateId: 'goblin_scout',
        template: { id: 'goblin_scout', name: 'Goblin Scout' },
        currentHp: 100,
        maxHp: 100,
        stats: { atk: 20, def: 5, spd: 10 },
        statusEffects: []
      })

      // Apply lethal damage to ally
      store.applyDamage(ally, 100, 'attack')

      // Ally should be dead
      expect(ally.currentHp).toBe(0)
      // Mara should have gained a stack from ally death
      expect(mara.heartbreakStacks).toBe(1)
    })

    it('does not trigger Heartbreak when Mara herself dies', () => {
      const mara = {
        instanceId: 'mara1',
        templateId: 'mara_thornheart',
        template: {
          id: 'mara_thornheart',
          name: 'Mara Thornheart',
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3,
            triggers: { allyBelowHalfHp: true, heavyDamagePercent: 15, allyDeath: true }
          }
        },
        currentHp: 50, // Will die from damage
        maxHp: 500,
        heartbreakStacks: 2,
        statusEffects: []
      }

      // Set up battle state
      store.heroes.push(mara)
      store.enemies.push({
        id: 'enemy1',
        templateId: 'goblin_scout',
        template: { id: 'goblin_scout', name: 'Goblin Scout' },
        currentHp: 100,
        maxHp: 100,
        stats: { atk: 20, def: 5, spd: 10 },
        statusEffects: []
      })

      // Apply lethal damage to Mara
      store.applyDamage(mara, 100, 'attack')

      // Mara should be dead
      expect(mara.currentHp).toBe(0)
      // Mara should NOT have gained a stack (dead heroes don't trigger ally death for themselves)
      expect(mara.heartbreakStacks).toBe(2)
    })

    it('does not duplicate Heartbreak triggers on same ally HP threshold', () => {
      const mara = {
        instanceId: 'mara1',
        templateId: 'mara_thornheart',
        template: {
          id: 'mara_thornheart',
          name: 'Mara Thornheart',
          heartbreakPassive: {
            maxStacks: 5,
            atkPerStack: 4,
            lifestealPerStack: 3,
            triggers: { allyBelowHalfHp: true, heavyDamagePercent: 15, allyDeath: true }
          }
        },
        currentHp: 500,
        maxHp: 500,
        heartbreakStacks: 0,
        statusEffects: []
      }

      const ally = {
        instanceId: 'ally1',
        templateId: 'test_ally',
        template: { id: 'test_ally', name: 'Test Ally' },
        currentHp: 600, // Will drop below 50% of 1000
        maxHp: 1000,
        heartbreakStacks: undefined,
        statusEffects: [],
        triggeredHeartbreak: false
      }

      // Set up battle state
      store.heroes.push(mara)
      store.heroes.push(ally)
      store.enemies.push({
        id: 'enemy1',
        templateId: 'goblin_scout',
        template: { id: 'goblin_scout', name: 'Goblin Scout' },
        currentHp: 100,
        maxHp: 100,
        stats: { atk: 20, def: 5, spd: 10 },
        statusEffects: []
      })

      // Apply damage to ally that drops them below 50%
      store.applyDamage(ally, 200, 'attack')
      expect(mara.heartbreakStacks).toBe(1)
      expect(ally.triggeredHeartbreak).toBe(true)

      // Apply more damage to ally (still below 50%)
      store.applyDamage(ally, 100, 'attack')

      // Should NOT trigger again
      expect(mara.heartbreakStacks).toBe(1)
    })
  })
})

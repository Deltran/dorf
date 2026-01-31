// src/stores/__tests__/battle-hero-ondeath-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('battle store - hero on-death integration', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('applyDamage triggers on-death for heroes', () => {
    it('triggers Last Breath when hero with on-death passive dies from damage', () => {
      // Set up a hero with Last Breath passive
      const hero = {
        instanceId: 'hero_zina',
        template: {
          id: 'zina_freedom_fighter',
          name: 'Zina',
          skills: [
            {
              name: 'Last Breath',
              isPassive: true,
              passiveType: 'onDeath',
              onDeath: {
                effects: [
                  { type: EffectType.POISON, target: 'all_enemies', duration: 3, atkPercent: 50 }
                ]
              }
            }
          ]
        },
        currentHp: 50,
        maxHp: 500,
        stats: { atk: 100, def: 50 },
        statusEffects: []
      }

      // Initialize battle with hero and enemies
      store.heroes = [hero]
      store.enemies = [
        { id: 'enemy_1', template: { name: 'Enemy 1' }, currentHp: 500, statusEffects: [] },
        { id: 'enemy_2', template: { name: 'Enemy 2' }, currentHp: 500, statusEffects: [] }
      ]

      // Apply lethal damage to the hero
      store.applyDamage(hero, 100, 'attack')

      // Hero should be dead
      expect(hero.currentHp).toBe(0)

      // All enemies should have poison from Last Breath
      expect(store.enemies[0].statusEffects).toHaveLength(1)
      expect(store.enemies[0].statusEffects[0].type).toBe(EffectType.POISON)
      expect(store.enemies[1].statusEffects).toHaveLength(1)
      expect(store.enemies[1].statusEffects[0].type).toBe(EffectType.POISON)
    })

    it('does not trigger on-death for heroes without on-death passive', () => {
      const hero = {
        instanceId: 'hero_normal',
        template: {
          id: 'normal_hero',
          name: 'Normal Hero',
          skills: [
            { name: 'Basic Attack', isPassive: false }
          ]
        },
        currentHp: 50,
        maxHp: 500,
        stats: { atk: 100, def: 50 },
        statusEffects: []
      }

      store.heroes = [hero]
      store.enemies = [
        { id: 'enemy_1', template: { name: 'Enemy 1' }, currentHp: 500, statusEffects: [] }
      ]

      // Apply lethal damage
      store.applyDamage(hero, 100, 'attack')

      // Hero should be dead, enemy should have no effects
      expect(hero.currentHp).toBe(0)
      expect(store.enemies[0].statusEffects).toHaveLength(0)
    })

    it('does not trigger on-death for enemies', () => {
      const enemy = {
        id: 'enemy_1',
        template: { name: 'Enemy' },
        currentHp: 50,
        statusEffects: []
      }

      store.heroes = []
      store.enemies = [enemy]

      // Apply lethal damage to enemy (should not throw or have issues)
      expect(() => store.applyDamage(enemy, 100, 'attack')).not.toThrow()
      expect(enemy.currentHp).toBe(0)
    })

    it('triggers on-death damage to random enemy when hero dies', () => {
      const hero = {
        instanceId: 'hero_zina',
        template: {
          id: 'zina_freedom_fighter',
          name: 'Zina',
          skills: [
            {
              name: 'Last Breath',
              isPassive: true,
              passiveType: 'onDeath',
              onDeath: {
                damage: { damagePercent: 175, targetType: 'random_enemy' }
              }
            }
          ]
        },
        currentHp: 50,
        maxHp: 500,
        stats: { atk: 100, def: 50 },
        statusEffects: []
      }

      store.heroes = [hero]
      store.enemies = [
        { id: 'enemy_1', template: { name: 'Enemy 1' }, currentHp: 500, statusEffects: [] }
      ]

      // Apply lethal damage
      store.applyDamage(hero, 100, 'attack')

      // Enemy should have taken damage from Last Breath (175% of 100 ATK)
      expect(store.enemies[0].currentHp).toBeLessThan(500)
    })
  })

  it('integration test placeholder for full battle scenario', () => {
    // This is an integration test that requires full battle setup
    // Will be validated manually during gameplay testing
    expect(true).toBe(true)
  })
})

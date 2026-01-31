// src/stores/__tests__/battle-hero-ondeath.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - hero on-death triggers', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('getHeroOnDeathPassive', () => {
    it('returns null for hero without on-death passive', () => {
      const hero = {
        template: {
          skills: [
            { name: 'Normal Skill', isPassive: false }
          ]
        }
      }
      expect(store.getHeroOnDeathPassive(hero)).toBeNull()
    })

    it('returns null for hero with no skills', () => {
      const hero = {
        template: {}
      }
      expect(store.getHeroOnDeathPassive(hero)).toBeNull()
    })

    it('returns null for hero with passive that is not onDeath type', () => {
      const hero = {
        template: {
          skills: [
            {
              name: 'Some Other Passive',
              isPassive: true,
              passiveType: 'otherType'
            }
          ]
        }
      }
      expect(store.getHeroOnDeathPassive(hero)).toBeNull()
    })

    it('returns on-death config for hero with Last Breath', () => {
      const hero = {
        template: {
          skills: [
            {
              name: 'Last Breath',
              isPassive: true,
              passiveType: 'onDeath',
              onDeath: {
                damage: { damagePercent: 175, targetType: 'random_enemy' },
                effects: [
                  { type: EffectType.POISON, target: 'all_enemies', duration: 3, atkPercent: 50 }
                ]
              }
            }
          ]
        }
      }
      const result = store.getHeroOnDeathPassive(hero)
      expect(result).toBeDefined()
      expect(result.damage.damagePercent).toBe(175)
      expect(result.damage.targetType).toBe('random_enemy')
      expect(result.effects).toHaveLength(1)
      expect(result.effects[0].type).toBe(EffectType.POISON)
    })

    it('finds on-death passive among multiple skills', () => {
      const hero = {
        template: {
          skills: [
            { name: 'Active Skill 1', isPassive: false },
            { name: 'Active Skill 2', isPassive: false },
            {
              name: 'Last Breath',
              isPassive: true,
              passiveType: 'onDeath',
              onDeath: {
                damage: { damagePercent: 200, targetType: 'random_enemy' }
              }
            }
          ]
        }
      }
      const result = store.getHeroOnDeathPassive(hero)
      expect(result).toBeDefined()
      expect(result.damage.damagePercent).toBe(200)
    })
  })

  describe('processHeroDeathTrigger', () => {
    it('does nothing for hero without on-death passive', () => {
      const hero = {
        instanceId: 'hero_1',
        template: {
          name: 'Regular Hero',
          skills: [{ name: 'Normal Skill', isPassive: false }]
        },
        stats: { atk: 100 }
      }

      // Should not throw
      expect(() => store.processHeroDeathTrigger(hero)).not.toThrow()
    })

    it('deals damage to random enemy when on-death has damage config', () => {
      // Initialize battle with enemies
      store.enemies = [
        { id: 'enemy_1', template: { name: 'Enemy 1' }, currentHp: 500, statusEffects: [] },
        { id: 'enemy_2', template: { name: 'Enemy 2' }, currentHp: 500, statusEffects: [] }
      ]

      const hero = {
        instanceId: 'hero_1',
        template: {
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
        stats: { atk: 100 }
      }

      store.processHeroDeathTrigger(hero)

      // One of the enemies should have taken damage (175% of 100 ATK = 175 damage)
      const totalDamage = (500 - store.enemies[0].currentHp) + (500 - store.enemies[1].currentHp)
      expect(totalDamage).toBeGreaterThan(0)
    })

    it('applies effects to all enemies when on-death has effects config', () => {
      // Initialize battle with enemies
      store.enemies = [
        { id: 'enemy_1', template: { name: 'Enemy 1' }, currentHp: 500, statusEffects: [] },
        { id: 'enemy_2', template: { name: 'Enemy 2' }, currentHp: 500, statusEffects: [] }
      ]

      const hero = {
        instanceId: 'hero_1',
        template: {
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
        stats: { atk: 100 }
      }

      store.processHeroDeathTrigger(hero)

      // Both enemies should have poison
      expect(store.enemies[0].statusEffects).toHaveLength(1)
      expect(store.enemies[0].statusEffects[0].type).toBe(EffectType.POISON)
      expect(store.enemies[1].statusEffects).toHaveLength(1)
      expect(store.enemies[1].statusEffects[0].type).toBe(EffectType.POISON)
    })

    it('does not apply effects to dead enemies', () => {
      // Initialize battle with one alive and one dead enemy
      store.enemies = [
        { id: 'enemy_1', template: { name: 'Enemy 1' }, currentHp: 500, statusEffects: [] },
        { id: 'enemy_2', template: { name: 'Enemy 2' }, currentHp: 0, statusEffects: [] }
      ]

      const hero = {
        instanceId: 'hero_1',
        template: {
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
        stats: { atk: 100 }
      }

      store.processHeroDeathTrigger(hero)

      // Only the alive enemy should have poison
      expect(store.enemies[0].statusEffects).toHaveLength(1)
      expect(store.enemies[1].statusEffects).toHaveLength(0)
    })
  })
})

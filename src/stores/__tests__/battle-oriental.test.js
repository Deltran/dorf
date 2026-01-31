import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType, effectDefinitions, createEffect } from '../../data/statusEffects'

describe('Oriental Fighters Battle Mechanics', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Reluctance healing reduction', () => {
    it('should reduce healing by 10% per stack', () => {
      // Setup hero with 3 Reluctance stacks (should receive 70% healing)
      const hero = {
        instanceId: 'test-hero',
        currentHp: 30,
        maxHp: 200,
        statusEffects: [
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 })
        ],
        template: { name: 'Test Hero' }
      }

      // Apply heal of 100 - should only receive 70 (3 stacks = 30% reduction)
      const actualHeal = battleStore.applyHeal(hero, 100)

      expect(actualHeal).toBe(70)
      expect(hero.currentHp).toBe(100) // 30 + 70 = 100
    })

    it('should cap at 50% reduction with 5 stacks', () => {
      // Setup hero with 6 stacks (should still only reduce by 50%)
      const hero = {
        instanceId: 'test-hero',
        currentHp: 50,
        maxHp: 200,
        statusEffects: [
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }) // 6th stack shouldn't count
        ],
        template: { name: 'Test Hero' }
      }

      // Apply heal of 100 - should receive 50 (capped at 50% reduction)
      const actualHeal = battleStore.applyHeal(hero, 100)

      expect(actualHeal).toBe(50)
      expect(hero.currentHp).toBe(100) // 50 + 50 = 100
    })

    it('should not reduce healing without Reluctance stacks', () => {
      const hero = {
        instanceId: 'test-hero',
        currentHp: 50,
        maxHp: 200,
        statusEffects: [],
        template: { name: 'Test Hero' }
      }

      const actualHeal = battleStore.applyHeal(hero, 100)

      expect(actualHeal).toBe(100)
      expect(hero.currentHp).toBe(150)
    })
  })

  describe('Stealth targeting', () => {
    it('should prevent enemy targeting of stealthed hero', () => {
      // Setup battle state with heroes array
      battleStore.heroes.push({
        instanceId: 'hero-1',
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          createEffect(EffectType.STEALTH, { duration: 2 })
        ],
        template: { name: 'Stealthy Hero' }
      })
      battleStore.heroes.push({
        instanceId: 'hero-2',
        currentHp: 100,
        maxHp: 100,
        statusEffects: [],
        template: { name: 'Normal Hero' }
      })

      // Get valid targets for enemy attack
      const validTargets = battleStore.getValidEnemyTargets()

      expect(validTargets).toHaveLength(1)
      expect(validTargets[0].instanceId).toBe('hero-2')
    })

    it('should allow ally targeting of stealthed hero', () => {
      battleStore.heroes.push({
        instanceId: 'hero-1',
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          createEffect(EffectType.STEALTH, { duration: 2 })
        ],
        template: { name: 'Stealthy Hero' }
      })
      battleStore.heroes.push({
        instanceId: 'hero-2',
        currentHp: 100,
        maxHp: 100,
        statusEffects: [],
        template: { name: 'Normal Hero' }
      })

      // Get valid ally targets (for healing/support skills)
      const validTargets = battleStore.getValidAllyTargets('hero-2')

      expect(validTargets).toHaveLength(2)
      expect(validTargets.some(h => h.instanceId === 'hero-1')).toBe(true)
    })

    it('STEALTH should be different from UNTARGETABLE', () => {
      // Verify effect definitions are different
      expect(EffectType.STEALTH).not.toBe(EffectType.UNTARGETABLE)
      expect(effectDefinitions[EffectType.STEALTH].isStealth).toBe(true)
      expect(effectDefinitions[EffectType.UNTARGETABLE].isUntargetable).toBe(true)
    })
  })

  describe('Bushido passive', () => {
    it('should grant ATK bonus based on missing HP', () => {
      // Hero at 50% HP with Bushido passive should have +25% effective ATK
      const hero = {
        instanceId: 'test-hero',
        currentHp: 50,
        maxHp: 100,
        stats: { atk: 100 },
        statusEffects: [],
        template: {
          name: 'Samurai',
          passives: [{ type: 'bushido' }]
        }
      }

      const effectiveAtk = battleStore.getEffectiveStatWithPassives(hero, 'atk')

      // At 50% HP, missing 50%, so bonus = 50 * 0.5 = 25%
      // Effective ATK = 100 * 1.25 = 125
      expect(effectiveAtk).toBe(125)
    })

    it('should cap ATK bonus at 50%', () => {
      // Hero at 0% HP (technically 0 out of 100) should have max +50% ATK
      // Use 0.1 HP to simulate near-death without division issues
      const hero = {
        instanceId: 'test-hero',
        currentHp: 0,
        maxHp: 100,
        stats: { atk: 100 },
        statusEffects: [],
        template: {
          name: 'Samurai',
          passives: [{ type: 'bushido' }]
        }
      }

      const effectiveAtk = battleStore.getEffectiveStatWithPassives(hero, 'atk')

      // At 0% HP, missing 100%, but bonus capped at 50%
      // Effective ATK = 100 * 1.5 = 150
      expect(effectiveAtk).toBe(150)
    })

    it('should not grant bonus at full HP', () => {
      const hero = {
        instanceId: 'test-hero',
        currentHp: 100,
        maxHp: 100,
        stats: { atk: 100 },
        statusEffects: [],
        template: {
          name: 'Samurai',
          passives: [{ type: 'bushido' }]
        }
      }

      const effectiveAtk = battleStore.getEffectiveStatWithPassives(hero, 'atk')

      // At full HP, no bonus
      expect(effectiveAtk).toBe(100)
    })

    it('should not affect heroes without Bushido passive', () => {
      const hero = {
        instanceId: 'test-hero',
        currentHp: 50,
        maxHp: 100,
        stats: { atk: 100 },
        statusEffects: [],
        template: {
          name: 'Regular Hero',
          passives: []
        }
      }

      const effectiveAtk = battleStore.getEffectiveStatWithPassives(hero, 'atk')

      expect(effectiveAtk).toBe(100)
    })

    // Critical fix tests: handle passive object format (not just passives array)
    describe('passive object format support', () => {
      it('should handle passive: { atkPerMissingHpPercent } format from hero templates', () => {
        // This is how Matsuda defines his Bushido passive
        const hero = {
          instanceId: 'matsuda',
          currentHp: 50,
          maxHp: 100,
          stats: { atk: 100 },
          statusEffects: [],
          template: {
            name: 'Matsuda the Masterless',
            passive: {
              name: 'Bushido',
              atkPerMissingHpPercent: 0.5,
              maxAtkBonus: 50
            }
          }
        }

        const effectiveAtk = battleStore.getEffectiveStatWithPassives(hero, 'atk')

        // At 50% HP, missing 50%, bonus = 50 * 0.5 = 25%
        // Effective ATK = 100 * 1.25 = 125
        expect(effectiveAtk).toBe(125)
      })

      it('should respect maxAtkBonus cap from passive object', () => {
        const hero = {
          instanceId: 'matsuda',
          currentHp: 0,
          maxHp: 100,
          stats: { atk: 100 },
          statusEffects: [],
          template: {
            name: 'Matsuda the Masterless',
            passive: {
              name: 'Bushido',
              atkPerMissingHpPercent: 0.5,
              maxAtkBonus: 50
            }
          }
        }

        const effectiveAtk = battleStore.getEffectiveStatWithPassives(hero, 'atk')

        // At 0% HP, missing 100%, bonus would be 50%, capped at 50%
        // Effective ATK = 100 * 1.5 = 150
        expect(effectiveAtk).toBe(150)
      })

      it('should handle unit without passive or passives', () => {
        const hero = {
          instanceId: 'regular-hero',
          currentHp: 50,
          maxHp: 100,
          stats: { atk: 100 },
          statusEffects: [],
          template: {
            name: 'Regular Hero'
          }
        }

        const effectiveAtk = battleStore.getEffectiveStatWithPassives(hero, 'atk')
        expect(effectiveAtk).toBe(100)
      })
    })

    // Critical fix tests: Bushido must work in actual combat damage calculations
    describe('integration with getEffectiveStat (combat damage)', () => {
      it('should apply Bushido ATK bonus in getEffectiveStat for damage calculations', () => {
        // The actual damage code uses getEffectiveStat, not getEffectiveStatWithPassives
        // This test verifies Bushido is integrated into getEffectiveStat
        const hero = {
          instanceId: 'matsuda',
          currentHp: 50,
          maxHp: 100,
          stats: { atk: 100 },
          statusEffects: [],
          template: {
            name: 'Matsuda the Masterless',
            passive: {
              name: 'Bushido',
              atkPerMissingHpPercent: 0.5,
              maxAtkBonus: 50
            }
          }
        }

        // Add hero to battle store
        battleStore.heroes.push(hero)

        // getEffectiveStat is the function used in damage calculations
        // It should now include Bushido passive bonus
        const effectiveAtk = battleStore.getEffectiveStat(hero, 'atk')

        // At 50% HP, missing 50%, bonus = 25%
        expect(effectiveAtk).toBe(125)
      })

      it('should combine Bushido passive with ATK_UP status effects', () => {
        const hero = {
          instanceId: 'matsuda',
          currentHp: 50,
          maxHp: 100,
          stats: { atk: 100 },
          statusEffects: [
            createEffect(EffectType.ATK_UP, { duration: 2, value: 20 })
          ],
          template: {
            name: 'Matsuda the Masterless',
            passive: {
              name: 'Bushido',
              atkPerMissingHpPercent: 0.5,
              maxAtkBonus: 50
            }
          }
        }

        battleStore.heroes.push(hero)

        const effectiveAtk = battleStore.getEffectiveStat(hero, 'atk')

        // Base: 100
        // ATK_UP +20%: 100 * 1.2 = 120
        // Bushido +25% (at 50% HP): 120 * 1.25 = 150
        expect(effectiveAtk).toBe(150)
      })
    })
  })

  describe('Kill heal bypass', () => {
    it('should bypass Reluctance when bypassReluctance flag is set', () => {
      // Hero with 3 Reluctance stacks receiving heal with bypassReluctance: true
      const hero = {
        instanceId: 'test-hero',
        currentHp: 50,
        maxHp: 200,
        statusEffects: [
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 })
        ],
        template: { name: 'Test Hero' }
      }

      // Apply heal with bypass flag - should receive full healing
      const actualHeal = battleStore.applyHeal(hero, 100, { bypassReluctance: true })

      expect(actualHeal).toBe(100)
      expect(hero.currentHp).toBe(150)
    })

    it('should still be reduced without bypass flag', () => {
      const hero = {
        instanceId: 'test-hero',
        currentHp: 50,
        maxHp: 200,
        statusEffects: [
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 }),
          createEffect(EffectType.RELUCTANCE, { duration: 2, value: 1 })
        ],
        template: { name: 'Test Hero' }
      }

      const actualHeal = battleStore.applyHeal(hero, 100, { bypassReluctance: false })

      expect(actualHeal).toBe(70)
      expect(hero.currentHp).toBe(120)
    })
  })
})

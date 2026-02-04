import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { EffectType } from '../../data/statusEffects'

describe('counter-based stacking in applyEffect', () => {
  let battleStore
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function makeUnit() {
    return {
      instanceId: 'test_hero_1',
      templateId: 'swift_arrow',
      template: { name: 'Swift Arrow', classId: 'ranger' },
      currentHp: 100,
      maxHp: 100,
      stats: { hp: 100, atk: 42, def: 22, spd: 20 },
      statusEffects: []
    }
  }

  describe('first application', () => {
    it('creates effect with stacks: 1', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].type).toBe('swift_momentum')
      expect(unit.statusEffects[0].stacks).toBe(1)
      expect(unit.statusEffects[0].value).toBe(5)
      expect(unit.statusEffects[0].duration).toBe(999)
    })
  })

  describe('subsequent applications', () => {
    it('increments stacks on second application', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].stacks).toBe(2)
    })

    it('increments stacks up to maxStacks (6)', () => {
      const unit = makeUnit()
      for (let i = 0; i < 6; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].stacks).toBe(6)
    })

    it('does not exceed maxStacks', () => {
      const unit = makeUnit()
      for (let i = 0; i < 10; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].stacks).toBe(6)
    })
  })

  describe('duration refresh', () => {
    it('refreshes duration when adding a stack', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 3, value: 5 })
      unit.statusEffects[0].duration = 1
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 3, value: 5 })

      expect(unit.statusEffects[0].stacks).toBe(2)
      expect(unit.statusEffects[0].duration).toBe(3)
    })

    it('refreshes duration even at maxStacks', () => {
      const unit = makeUnit()
      for (let i = 0; i < 6; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }
      unit.statusEffects[0].duration = 1
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      expect(unit.statusEffects[0].stacks).toBe(6)
      expect(unit.statusEffects[0].duration).toBe(999)
    })
  })

  describe('value consistency', () => {
    it('preserves value per stack (does not take max)', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      expect(unit.statusEffects[0].value).toBe(5)
      expect(unit.statusEffects[0].stacks).toBe(2)
    })
  })

  describe('does not interfere with existing effect modes', () => {
    it('non-stackable effects still refresh duration and take higher value', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.ATK_UP, { duration: 2, value: 10 })
      battleStore.applyEffect(unit, EffectType.ATK_UP, { duration: 3, value: 20 })

      expect(unit.statusEffects).toHaveLength(1)
      expect(unit.statusEffects[0].value).toBe(20)
      expect(unit.statusEffects[0].duration).toBe(3)
      expect(unit.statusEffects[0].stacks).toBeUndefined()
    })

    it('old-style stackable effects (poison) still add separate instances', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.POISON, { duration: 3, value: 10 })
      battleStore.applyEffect(unit, EffectType.POISON, { duration: 3, value: 10 })

      expect(unit.statusEffects).toHaveLength(2)
      expect(unit.statusEffects[0].stacks).toBeUndefined()
      expect(unit.statusEffects[1].stacks).toBeUndefined()
    })
  })

  describe('cleanse removes all stacks', () => {
    it('removing the effect removes all stacks at once', () => {
      const unit = makeUnit()
      for (let i = 0; i < 4; i++) {
        battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      }
      expect(unit.statusEffects[0].stacks).toBe(4)

      unit.statusEffects = unit.statusEffects.filter(e => e.type !== EffectType.SWIFT_MOMENTUM)
      expect(unit.statusEffects).toHaveLength(0)
    })
  })

  describe('debuff immunity does not block buff stacks', () => {
    it('SWIFT_MOMENTUM (a buff) is not blocked by DEBUFF_IMMUNE', () => {
      const unit = makeUnit()
      battleStore.applyEffect(unit, EffectType.DEBUFF_IMMUNE, { duration: 3 })
      battleStore.applyEffect(unit, EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })

      const momentum = unit.statusEffects.find(e => e.type === EffectType.SWIFT_MOMENTUM)
      expect(momentum).toBeDefined()
      expect(momentum.stacks).toBe(1)
    })
  })
})

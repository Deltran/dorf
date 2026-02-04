import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects'

describe('counter-based stacking', () => {
  describe('effect definitions', () => {
    it('existing effects have no maxStacks', () => {
      expect(effectDefinitions[EffectType.ATK_UP].maxStacks).toBeUndefined()
      expect(effectDefinitions[EffectType.POISON].maxStacks).toBeUndefined()
      expect(effectDefinitions[EffectType.SPD_UP].maxStacks).toBeUndefined()
    })

    it('SWIFT_MOMENTUM is defined with maxStacks', () => {
      expect(EffectType.SWIFT_MOMENTUM).toBe('swift_momentum')
      const def = effectDefinitions[EffectType.SWIFT_MOMENTUM]
      expect(def).toBeDefined()
      expect(def.name).toBe('Momentum')
      expect(def.icon).toBe('🏹')
      expect(def.isBuff).toBe(true)
      expect(def.stat).toBe('spd')
      expect(def.maxStacks).toBe(6)
    })
  })

  describe('createEffect with stacks', () => {
    it('creates a SWIFT_MOMENTUM effect with stacks property', () => {
      const effect = createEffect(EffectType.SWIFT_MOMENTUM, { duration: 999, value: 5 })
      expect(effect).not.toBeNull()
      expect(effect.type).toBe('swift_momentum')
      expect(effect.value).toBe(5)
      expect(effect.duration).toBe(999)
      expect(effect.definition.maxStacks).toBe(6)
    })

    it('existing effects do not get stacks property from createEffect', () => {
      const effect = createEffect(EffectType.ATK_UP, { duration: 2, value: 20 })
      expect(effect.stacks).toBeUndefined()
    })
  })
})

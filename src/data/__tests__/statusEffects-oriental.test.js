import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects.js'

describe('Oriental Fighters Status Effects', () => {
  describe('RELUCTANCE', () => {
    it('should exist in EffectType', () => {
      expect(EffectType.RELUCTANCE).toBe('reluctance')
    })

    it('should have effect definition with correct properties', () => {
      const def = effectDefinitions[EffectType.RELUCTANCE]
      expect(def).toBeDefined()
      expect(def.name).toBe('Reluctance')
      expect(def.icon).toBe('\u{1F6AB}') // Prohibited sign emoji
      expect(def.color).toBe('#9ca3af')
    })

    it('should be a debuff that stacks', () => {
      const def = effectDefinitions[EffectType.RELUCTANCE]
      expect(def.isBuff).toBe(false)
      expect(def.stackable).toBe(true)
      expect(def.isReluctance).toBe(true)
    })

    it('should create effect with stack count', () => {
      const effect = createEffect(EffectType.RELUCTANCE, {
        duration: 99,
        value: 10,
        stacks: 1
      })
      expect(effect.type).toBe('reluctance')
      expect(effect.duration).toBe(99)
      expect(effect.value).toBe(10)
      expect(effect.stacks).toBe(1)
    })

    it('should support multiple stacks up to 5', () => {
      const effect = createEffect(EffectType.RELUCTANCE, {
        duration: 99,
        value: 10,
        stacks: 5
      })
      expect(effect.stacks).toBe(5)
    })
  })

  describe('STEALTH', () => {
    it('should exist in EffectType', () => {
      expect(EffectType.STEALTH).toBe('stealth')
    })

    it('should have effect definition with correct properties', () => {
      const def = effectDefinitions[EffectType.STEALTH]
      expect(def).toBeDefined()
      expect(def.name).toBe('Stealth')
      expect(def.icon).toBe('\u{1F32B}\u{FE0F}') // Fog emoji
      expect(def.color).toBe('#6366f1')
    })

    it('should be a buff that allows ally targeting', () => {
      const def = effectDefinitions[EffectType.STEALTH]
      expect(def.isBuff).toBe(true)
      expect(def.isStealth).toBe(true)
      expect(def.stackable).toBe(false)
    })

    it('should create effect with duration', () => {
      const effect = createEffect(EffectType.STEALTH, {
        duration: 2
      })
      expect(effect.type).toBe('stealth')
      expect(effect.duration).toBe(2)
    })
  })
})

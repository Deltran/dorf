import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects'

describe('MARKED status effect', () => {
  it('has MARKED in EffectType enum', () => {
    expect(EffectType.MARKED).toBe('marked')
  })

  it('has MARKED definition with correct properties', () => {
    const def = effectDefinitions[EffectType.MARKED]
    expect(def).toBeDefined()
    expect(def.name).toBe('Marked')
    expect(def.isBuff).toBe(false)
    expect(def.isMarked).toBe(true)
  })

  it('creates MARKED effect with value', () => {
    const effect = createEffect(EffectType.MARKED, { duration: 3, value: 20 })
    expect(effect.type).toBe('marked')
    expect(effect.duration).toBe(3)
    expect(effect.value).toBe(20)
  })
})

describe('FLAME_SHIELD status effect', () => {
  it('has FLAME_SHIELD in EffectType enum', () => {
    expect(EffectType.FLAME_SHIELD).toBe('flame_shield')
  })

  it('has FLAME_SHIELD definition with correct properties', () => {
    const def = effectDefinitions[EffectType.FLAME_SHIELD]
    expect(def).toBeDefined()
    expect(def.name).toBe('Flame Shield')
    expect(def.isBuff).toBe(true)
    expect(def.isFlameShield).toBe(true)
  })
})

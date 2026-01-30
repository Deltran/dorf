import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects.js'

describe('VICIOUS status effect', () => {
  it('should have VICIOUS effect type defined', () => {
    expect(EffectType.VICIOUS).toBe('vicious')
  })

  it('should have effect definition with correct properties', () => {
    const def = effectDefinitions[EffectType.VICIOUS]
    expect(def).toBeDefined()
    expect(def.name).toBe('Vicious')
    expect(def.isBuff).toBe(true)
    expect(def.isVicious).toBe(true)
  })

  it('should create effect with bonusDamagePercent', () => {
    const effect = createEffect(EffectType.VICIOUS, {
      duration: 2,
      bonusDamagePercent: 30
    })
    expect(effect.type).toBe('vicious')
    expect(effect.duration).toBe(2)
    expect(effect.bonusDamagePercent).toBe(30)
  })
})

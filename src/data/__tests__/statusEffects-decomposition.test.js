import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, getEffectDefinition } from '../statusEffects'

describe('DECOMPOSITION status effect', () => {
  it('should exist in EffectType enum', () => {
    expect(EffectType.DECOMPOSITION).toBe('decomposition')
  })

  it('should have effect definition', () => {
    const def = getEffectDefinition(EffectType.DECOMPOSITION)
    expect(def).toBeDefined()
    expect(def.name).toBe('Decomposition')
    expect(def.isBuff).toBe(true)
    expect(def.isDecomposition).toBe(true)
  })

  it('should have appropriate icon and color', () => {
    const def = effectDefinitions[EffectType.DECOMPOSITION]
    expect(def.icon).toBe('🍂')
    expect(def.color).toBe('#84cc16')
  })
})

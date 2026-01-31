import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions } from '../statusEffects.js'

describe('SEATED status effect', () => {
  it('exists in EffectType enum', () => {
    expect(EffectType.SEATED).toBe('seated')
  })

  it('has correct effect definition', () => {
    const def = effectDefinitions[EffectType.SEATED]
    expect(def).toBeDefined()
    expect(def.name).toBe('Bulwark')
    expect(def.isBuff).toBe(true)
    expect(def.isSeated).toBe(true)
    expect(def.stackable).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects.js'

describe('ECHOING status effect', () => {
  it('should have ECHOING effect type defined', () => {
    expect(EffectType.ECHOING).toBe('echoing')
  })

  it('should have effect definition with correct properties', () => {
    const def = effectDefinitions[EffectType.ECHOING]
    expect(def).toBeDefined()
    expect(def.name).toBe('Echoing')
    expect(def.isBuff).toBe(true)
    expect(def.isEchoing).toBe(true)
  })

  it('should create effect with splashPercent', () => {
    const effect = createEffect(EffectType.ECHOING, {
      duration: 1,
      splashPercent: 50
    })
    expect(effect.type).toBe('echoing')
    expect(effect.duration).toBe(1)
    expect(effect.splashPercent).toBe(50)
  })
})

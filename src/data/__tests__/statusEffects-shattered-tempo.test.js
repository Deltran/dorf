import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects.js'

describe('SHATTERED_TEMPO status effect', () => {
  it('should have SHATTERED_TEMPO effect type defined', () => {
    expect(EffectType.SHATTERED_TEMPO).toBe('shattered_tempo')
  })

  it('should have effect definition with correct properties', () => {
    const def = effectDefinitions[EffectType.SHATTERED_TEMPO]
    expect(def).toBeDefined()
    expect(def.name).toBe('Shattered Tempo')
    expect(def.isBuff).toBe(true)
    expect(def.isShatteredTempo).toBe(true)
  })

  it('should create effect with turnOrderPriority', () => {
    const effect = createEffect(EffectType.SHATTERED_TEMPO, {
      duration: 1,
      turnOrderPriority: 2
    })
    expect(effect.type).toBe('shattered_tempo')
    expect(effect.duration).toBe(1)
    expect(effect.turnOrderPriority).toBe(2)
  })
})

import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects.js'

describe('DISCORDANT_RESONANCE status effect', () => {
  it('should have DISCORDANT_RESONANCE effect type defined', () => {
    expect(EffectType.DISCORDANT_RESONANCE).toBe('discordant_resonance')
  })

  it('should have effect definition marked as debuff', () => {
    const def = effectDefinitions[EffectType.DISCORDANT_RESONANCE]
    expect(def).toBeDefined()
    expect(def.name).toBe('Discordant Resonance')
    expect(def.isBuff).toBe(false) // It's a debuff!
    expect(def.isDiscordantResonance).toBe(true)
  })

  it('should create effect with damageBonus and healingPenalty', () => {
    const effect = createEffect(EffectType.DISCORDANT_RESONANCE, {
      duration: 99, // Lasts entire battle
      damageBonus: 15,
      healingPenalty: 30
    })
    expect(effect.type).toBe('discordant_resonance')
    expect(effect.damageBonus).toBe(15)
    expect(effect.healingPenalty).toBe(30)
  })
})

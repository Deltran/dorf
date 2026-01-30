import { describe, it, expect } from 'vitest'
import { chroma } from '../4star/chroma'
import { EffectType } from '../../statusEffects'

describe('Chroma, the Curious', () => {
  it('should have correct base stats', () => {
    expect(chroma.baseStats).toEqual({
      hp: 82,
      atk: 22,
      def: 18,
      spd: 17,
      mp: 60
    })
  })

  it('should be a 4-star bard', () => {
    expect(chroma.rarity).toBe(4)
    expect(chroma.classId).toBe('bard')
  })

  it('should have 5 skills', () => {
    expect(chroma.skills).toHaveLength(5)
  })

  it('should have Ink Flare with 50% blind at level 1', () => {
    const inkFlare = chroma.skills.find(s => s.name === 'Ink Flare')
    expect(inkFlare.skillUnlockLevel).toBe(1)
    expect(inkFlare.effects[0].type).toBe(EffectType.BLIND)
    expect(inkFlare.effects[0].value).toBe(50)
  })

  it('should have Resonance with 20 resource restore at level 1', () => {
    const resonance = chroma.skills.find(s => s.name === 'Resonance')
    expect(resonance.skillUnlockLevel).toBe(1)
    expect(resonance.resourceRestore).toBe(20)
  })

  it('should have Fixation Pattern with Taunt at level 3', () => {
    const fixation = chroma.skills.find(s => s.name === 'Fixation Pattern')
    expect(fixation.skillUnlockLevel).toBe(3)
    expect(fixation.effects[0].type).toBe(EffectType.TAUNT)
  })

  it('should have Chromatic Fade with 75% self Evasion at level 6', () => {
    const fade = chroma.skills.find(s => s.name === 'Chromatic Fade')
    expect(fade.skillUnlockLevel).toBe(6)
    expect(fade.effects[0].type).toBe(EffectType.EVASION)
    expect(fade.effects[0].value).toBe(75)
    expect(fade.targetType).toBe('self')
  })

  it('should have Refraction with 50% ally Evasion at level 12', () => {
    const refraction = chroma.skills.find(s => s.name === 'Refraction')
    expect(refraction.skillUnlockLevel).toBe(12)
    expect(refraction.effects[0].type).toBe(EffectType.EVASION)
    expect(refraction.effects[0].value).toBe(50)
    expect(refraction.targetType).toBe('ally')
  })

  it('should have The Dazzling finale with 30% AoE blind', () => {
    expect(chroma.finale.name).toBe('The Dazzling')
    expect(chroma.finale.target).toBe('all_enemies')
    expect(chroma.finale.effects[0].type).toBe(EffectType.BLIND)
    expect(chroma.finale.effects[0].value).toBe(30)
  })
})

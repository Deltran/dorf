import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'
import { chroma } from '../../data/heroes/4star/chroma.js'

describe('Chroma Battle Integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Chroma hero data', () => {
    it('should have valid skill structure', () => {
      expect(chroma.skills).toHaveLength(5)
      chroma.skills.forEach(skill => {
        expect(skill.name).toBeDefined()
        expect(skill.targetType).toBeDefined()
      })
    })

    it('should have valid finale structure', () => {
      expect(chroma.finale).toBeDefined()
      expect(chroma.finale.name).toBe('The Dazzling')
      expect(chroma.finale.effects).toHaveLength(1)
      expect(chroma.finale.effects[0].type).toBe(EffectType.BLIND)
    })
  })

  describe('Ink Flare skill', () => {
    it('should have correct Blind effect configuration', () => {
      const inkFlare = chroma.skills.find(s => s.name === 'Ink Flare')
      expect(inkFlare.effects[0].type).toBe(EffectType.BLIND)
      expect(inkFlare.effects[0].value).toBe(50)
      expect(inkFlare.effects[0].duration).toBe(1)
      expect(inkFlare.targetType).toBe('enemy')
    })
  })

  describe('Fixation Pattern skill', () => {
    it('should apply Taunt to ally', () => {
      const fixation = chroma.skills.find(s => s.name === 'Fixation Pattern')
      expect(fixation.effects[0].type).toBe(EffectType.TAUNT)
      expect(fixation.targetType).toBe('ally')
      expect(fixation.effects[0].duration).toBe(1)
    })
  })

  describe('Chromatic Fade skill', () => {
    it('should grant self Evasion', () => {
      const fade = chroma.skills.find(s => s.name === 'Chromatic Fade')
      expect(fade.effects[0].type).toBe(EffectType.EVASION)
      expect(fade.effects[0].value).toBe(75)
      expect(fade.targetType).toBe('self')
    })
  })

  describe('Refraction skill', () => {
    it('should grant ally Evasion', () => {
      const refraction = chroma.skills.find(s => s.name === 'Refraction')
      expect(refraction.effects[0].type).toBe(EffectType.EVASION)
      expect(refraction.effects[0].value).toBe(50)
      expect(refraction.targetType).toBe('ally')
    })
  })

  describe('Resonance skill', () => {
    it('should have resource restore property', () => {
      const resonance = chroma.skills.find(s => s.name === 'Resonance')
      expect(resonance.resourceRestore).toBe(20)
      expect(resonance.targetType).toBe('ally')
    })
  })

  describe('The Dazzling finale', () => {
    it('should apply AoE Blind with correct values', () => {
      expect(chroma.finale.target).toBe('all_enemies')
      expect(chroma.finale.effects[0].value).toBe(30)
      expect(chroma.finale.effects[0].duration).toBe(1)
    })
  })

  describe('Blind miss mechanic', () => {
    it('should have checkBlindMiss function exported', () => {
      expect(typeof battleStore.checkBlindMiss).toBe('function')
    })

    it('should cause blinded attacker to potentially miss', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 100 }]
      }

      // With 100% blind, should always miss
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      expect(battleStore.checkBlindMiss(attacker)).toBe(true)
      vi.restoreAllMocks()
    })
  })
})

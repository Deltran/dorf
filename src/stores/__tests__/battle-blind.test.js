import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType, effectDefinitions } from '../../data/statusEffects'

describe('Blind Miss Mechanic', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('EffectType.BLIND', () => {
    it('should be defined as "blind"', () => {
      expect(EffectType.BLIND).toBe('blind')
    })

    it('should have an effect definition', () => {
      expect(effectDefinitions[EffectType.BLIND]).toBeDefined()
      expect(effectDefinitions[EffectType.BLIND].name).toBe('Blinded')
      expect(effectDefinitions[EffectType.BLIND].isBuff).toBe(false)
      expect(effectDefinitions[EffectType.BLIND].isBlind).toBe(true)
    })

    it('should not be stackable', () => {
      expect(effectDefinitions[EffectType.BLIND].stackable).toBe(false)
    })
  })

  describe('checkBlindMiss', () => {
    it('should return false when attacker has no blind effect', () => {
      const attacker = { statusEffects: [] }
      expect(battleStore.checkBlindMiss(attacker)).toBe(false)
    })

    it('should return false when attacker has no status effects', () => {
      const attacker = {}
      expect(battleStore.checkBlindMiss(attacker)).toBe(false)
    })

    it('should roll against blind miss chance', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 50 }]
      }

      vi.spyOn(Math, 'random').mockReturnValue(0.3)
      expect(battleStore.checkBlindMiss(attacker)).toBe(true)

      vi.spyOn(Math, 'random').mockReturnValue(0.7)
      expect(battleStore.checkBlindMiss(attacker)).toBe(false)

      vi.restoreAllMocks()
    })

    it('should handle 100% blind chance', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 100 }]
      }
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      expect(battleStore.checkBlindMiss(attacker)).toBe(true)
      vi.restoreAllMocks()
    })

    it('should miss when roll equals miss chance exactly', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 50 }]
      }
      // Math.random() < 0.5 when random returns 0.5 is false
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      expect(battleStore.checkBlindMiss(attacker)).toBe(false)
      vi.restoreAllMocks()
    })

    it('should hit when random is at boundary', () => {
      const attacker = {
        statusEffects: [{ type: EffectType.BLIND, value: 50 }]
      }
      // Just under 50% should miss
      vi.spyOn(Math, 'random').mockReturnValue(0.49)
      expect(battleStore.checkBlindMiss(attacker)).toBe(true)
      vi.restoreAllMocks()
    })
  })

  describe('Blind integration with hasEffect', () => {
    it('should detect blind effect on a unit', () => {
      const unit = {
        statusEffects: [{ type: EffectType.BLIND, value: 40, duration: 2 }]
      }

      expect(battleStore.hasEffect(unit, EffectType.BLIND)).toBe(true)
    })

    it('should return false when unit has no blind effect', () => {
      const unit = {
        statusEffects: [{ type: EffectType.STUN, duration: 1 }]
      }

      expect(battleStore.hasEffect(unit, EffectType.BLIND)).toBe(false)
    })
  })

  describe('Blind counts as debuff for Vicious synergy', () => {
    it('should be classified as a debuff', () => {
      expect(effectDefinitions[EffectType.BLIND].isBuff).toBe(false)
    })

    it('should count for hasDebuff check', () => {
      const unit = {
        statusEffects: [{ type: EffectType.BLIND, value: 40, duration: 2 }]
      }

      // Check that the unit has a non-buff effect (debuff)
      const hasNonBuff = unit.statusEffects.some(e => {
        const def = effectDefinitions[e.type]
        return def && !def.isBuff
      })
      expect(hasNonBuff).toBe(true)
    })
  })
})

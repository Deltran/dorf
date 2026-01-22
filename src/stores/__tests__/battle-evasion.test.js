import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType, effectDefinitions } from '../../data/statusEffects'

describe('battle store - evasion effect', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('EffectType.EVASION', () => {
    it('should be defined as "evasion"', () => {
      expect(EffectType.EVASION).toBe('evasion')
    })

    it('should have an effect definition', () => {
      expect(effectDefinitions[EffectType.EVASION]).toBeDefined()
      expect(effectDefinitions[EffectType.EVASION].name).toBe('Evasion')
      expect(effectDefinitions[EffectType.EVASION].isBuff).toBe(true)
      expect(effectDefinitions[EffectType.EVASION].isEvasion).toBe(true)
    })
  })

  describe('hasEffect', () => {
    it('detects evasion effect on unit', () => {
      const unit = {
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ]
      }
      expect(store.hasEffect(unit, EffectType.EVASION)).toBe(true)
    })
  })

  describe('applyDamage with evasion', () => {
    it('can evade damage when evasion check succeeds', () => {
      // Mock Math.random to always return 0 (will be < 0.4 evasion chance)
      const originalRandom = Math.random
      Math.random = () => 0

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(0) // No damage dealt
      expect(unit.currentHp).toBe(100) // HP unchanged

      Math.random = originalRandom
    })

    it('takes damage when evasion check fails', () => {
      // Mock Math.random to always return 0.5 (will be >= 0.4 evasion chance)
      const originalRandom = Math.random
      Math.random = () => 0.5

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(50) // Full damage dealt
      expect(unit.currentHp).toBe(50) // HP reduced

      Math.random = originalRandom
    })
  })
})

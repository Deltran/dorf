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
})

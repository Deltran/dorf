import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - MARKED effect', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('getMarkedDamageMultiplier', () => {
    it('returns 1 when target has no MARKED effect', () => {
      const target = { statusEffects: [] }
      expect(store.getMarkedDamageMultiplier(target)).toBe(1)
    })

    it('returns amplified multiplier when target is MARKED', () => {
      const target = {
        statusEffects: [
          { type: EffectType.MARKED, duration: 3, value: 20 }
        ]
      }
      expect(store.getMarkedDamageMultiplier(target)).toBe(1.2)
    })

    it('returns 1 when target has no statusEffects array', () => {
      const target = {}
      expect(store.getMarkedDamageMultiplier(target)).toBe(1)
    })
  })
})

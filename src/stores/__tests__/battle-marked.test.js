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

  describe('applyMarkedDamage (integration)', () => {
    it('applies MARKED multiplier to calculateDamage result', () => {
      // Base damage: 100 ATK * 1.0 multiplier - 50 DEF * 0.5 = 75
      const baseDamage = store.calculateDamageWithMarked(100, 1.0, 50, 1)
      expect(baseDamage).toBe(75)

      // With 20% MARKED: 75 * 1.2 = 90
      const markedDamage = store.calculateDamageWithMarked(100, 1.0, 50, 1.2)
      expect(markedDamage).toBe(90)
    })
  })
})

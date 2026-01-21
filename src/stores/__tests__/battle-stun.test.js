import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - stun effect', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('hasEffect', () => {
    it('detects stun effect on unit', () => {
      const unit = {
        statusEffects: [
          { type: EffectType.STUN, duration: 1 }
        ]
      }
      expect(store.hasEffect(unit, EffectType.STUN)).toBe(true)
    })

    it('returns false when unit has no stun', () => {
      const unit = { statusEffects: [] }
      expect(store.hasEffect(unit, EffectType.STUN)).toBe(false)
    })
  })
})

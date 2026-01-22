import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - death prevention', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('checkDeathPrevention', () => {
    it('returns false when unit has no DEATH_PREVENTION effect', () => {
      const unit = { currentHp: 10, statusEffects: [] }
      expect(store.checkDeathPrevention(unit, 50)).toBe(false)
    })

    it('returns false when damage would not kill unit', () => {
      const unit = {
        currentHp: 100,
        statusEffects: [{ type: EffectType.DEATH_PREVENTION, duration: 2, healOnTrigger: 50 }]
      }
      expect(store.checkDeathPrevention(unit, 50)).toBe(false)
    })

    it('returns true and prevents death when damage would kill unit with DEATH_PREVENTION', () => {
      const unit = {
        currentHp: 30,
        maxHp: 100,
        statusEffects: [{ type: EffectType.DEATH_PREVENTION, duration: 2, healOnTrigger: 50, casterAtk: 40 }]
      }
      const result = store.checkDeathPrevention(unit, 50)
      expect(result).toBe(true)
      expect(unit.currentHp).toBe(21) // 1 HP + 50% of 40 ATK = 1 + 20 = 21
    })

    it('removes DEATH_PREVENTION effect after triggering', () => {
      const unit = {
        currentHp: 30,
        maxHp: 100,
        statusEffects: [{ type: EffectType.DEATH_PREVENTION, duration: 2, healOnTrigger: 50, casterAtk: 40 }]
      }
      store.checkDeathPrevention(unit, 50)
      expect(unit.statusEffects.find(e => e.type === EffectType.DEATH_PREVENTION)).toBeUndefined()
    })
  })
})

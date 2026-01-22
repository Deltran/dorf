import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - healAlliesPercent', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('healAlliesFromDamage', () => {
    it('heals all allies for percentage of damage dealt', () => {
      const allies = [
        { instanceId: 1, currentHp: 50, maxHp: 100 },
        { instanceId: 2, currentHp: 60, maxHp: 100 }
      ]

      // 200 damage dealt, 35% heal = 70 HP to each ally
      store.healAlliesFromDamage(allies, 200, 35)

      expect(allies[0].currentHp).toBe(100) // capped at max
      expect(allies[1].currentHp).toBe(100) // 60 + 70 = 130, capped at 100
    })

    it('does not overheal past maxHp', () => {
      const allies = [
        { instanceId: 1, currentHp: 95, maxHp: 100 }
      ]

      store.healAlliesFromDamage(allies, 200, 35)

      expect(allies[0].currentHp).toBe(100)
    })

    it('handles zero damage', () => {
      const allies = [
        { instanceId: 1, currentHp: 50, maxHp: 100 }
      ]

      store.healAlliesFromDamage(allies, 0, 35)

      expect(allies[0].currentHp).toBe(50)
    })
  })
})

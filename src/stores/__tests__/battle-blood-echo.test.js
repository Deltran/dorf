import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - Blood Echo damage calculation', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('calculateBloodEchoDamage', () => {
    it('returns 90% damage with 0 Blood Tempo uses', () => {
      const result = store.calculateBloodEchoDamage(100, 0)
      expect(result.damagePercent).toBe(90)
    })

    it('returns 120% damage with 1 Blood Tempo use', () => {
      const result = store.calculateBloodEchoDamage(100, 1)
      expect(result.damagePercent).toBe(120)
    })

    it('returns 150% damage with 2 Blood Tempo uses', () => {
      const result = store.calculateBloodEchoDamage(100, 2)
      expect(result.damagePercent).toBe(150)
    })

    it('returns 180% damage with 3 Blood Tempo uses (capped)', () => {
      const result = store.calculateBloodEchoDamage(100, 3)
      expect(result.damagePercent).toBe(180)
    })

    it('caps at 180% damage with more than 3 Blood Tempo uses', () => {
      const result = store.calculateBloodEchoDamage(100, 5)
      expect(result.damagePercent).toBe(180)
    })

    it('caps at 180% damage with many Blood Tempo uses', () => {
      const result = store.calculateBloodEchoDamage(100, 10)
      expect(result.damagePercent).toBe(180)
    })
  })
})

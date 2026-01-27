import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('Percentage-based damage formula', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('calculateDamage', () => {
    it('uses percentage-based DEF reduction: atk * multiplier * (100 / (100 + def))', () => {
      // 100 ATK * 1.0 multiplier * (100 / (100 + 50)) = 100 * 0.6667 = 66
      const damage = store.calculateDamageWithMarked(100, 1.0, 50, 1)
      expect(damage).toBe(66)
    })

    it('multi-hit at same total multiplier equals single-hit damage', () => {
      const def = 50
      const singleHit = store.calculateDamageWithMarked(100, 1.2, def, 1)
      const perHit = store.calculateDamageWithMarked(100, 0.3, def, 1)
      const multiHit = perHit * 4
      // With percentage formula, 4 * (100 * 0.3 * 100/150) = 4 * 20 = 80
      // And 100 * 1.2 * 100/150 = 80
      expect(multiHit).toBe(singleHit)
    })

    it('low-ATK heroes deal proportional damage, not minimum 1', () => {
      // Darl (25 ATK) vs Rock Golem (35 DEF) at 30% multiplier
      // Old formula: 25 * 0.3 - 35 * 0.5 = -10 -> clamped to 1
      // New formula: 25 * 0.3 * (100/135) = 7.5 * 0.7407 = 5
      const damage = store.calculateDamageWithMarked(25, 0.3, 35, 1)
      expect(damage).toBe(5)
      expect(damage).toBeGreaterThan(1) // Not clamped to minimum
    })

    it('DEF provides diminishing returns', () => {
      const atk = 100
      const mult = 1.0
      const dmgAt0 = store.calculateDamageWithMarked(atk, mult, 0, 1)
      const dmgAt50 = store.calculateDamageWithMarked(atk, mult, 50, 1)
      const dmgAt100 = store.calculateDamageWithMarked(atk, mult, 100, 1)
      const dmgAt200 = store.calculateDamageWithMarked(atk, mult, 200, 1)

      // 0 DEF: 100, 50 DEF: 66, 100 DEF: 50, 200 DEF: 33
      expect(dmgAt0).toBe(100)
      expect(dmgAt50).toBe(66)
      expect(dmgAt100).toBe(50)
      expect(dmgAt200).toBe(33)

      // Each 50 DEF reduces less than the previous 50
      const reduction1 = dmgAt0 - dmgAt50    // 34
      const reduction2 = dmgAt50 - dmgAt100  // 16
      const reduction3 = dmgAt100 - dmgAt200 // 17
      expect(reduction1).toBeGreaterThan(reduction2)
    })

    it('minimum damage is 1', () => {
      const damage = store.calculateDamageWithMarked(1, 0.1, 9999, 1)
      expect(damage).toBe(1)
    })
  })

  describe('calculateDamageWithMarked', () => {
    it('applies marked multiplier after DEF reduction', () => {
      // Base: 100 * 1.0 * (100/150) = 66
      // Marked 1.2x: floor(66 * 1.2) = 79
      const base = store.calculateDamageWithMarked(100, 1.0, 50, 1)
      const marked = store.calculateDamageWithMarked(100, 1.0, 50, 1.2)
      expect(base).toBe(66)
      expect(marked).toBe(79)
    })
  })
})

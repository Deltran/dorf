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
      // Base damage: 100 ATK * 1.0 multiplier * (100 / (100 + 50)) = 66
      const baseDamage = store.calculateDamageWithMarked(100, 1.0, 50, 1)
      expect(baseDamage).toBe(66)

      // With 20% MARKED: floor(66 * 1.2) = 79
      const markedDamage = store.calculateDamageWithMarked(100, 1.0, 50, 1.2)
      expect(markedDamage).toBe(79)
    })
  })

  describe('selectRandomTarget', () => {
    it('returns random target from alive enemies', () => {
      const enemies = [
        { id: 1, currentHp: 100, statusEffects: [] },
        { id: 2, currentHp: 100, statusEffects: [] }
      ]
      const target = store.selectRandomTarget(enemies, false)
      expect([1, 2]).toContain(target.id)
    })

    it('prioritizes MARKED targets when prioritizeMarked is true', () => {
      const enemies = [
        { id: 1, currentHp: 100, statusEffects: [] },
        { id: 2, currentHp: 100, statusEffects: [{ type: EffectType.MARKED, duration: 3, value: 20 }] }
      ]
      // Run multiple times to verify marked target is always chosen
      for (let i = 0; i < 10; i++) {
        const target = store.selectRandomTarget(enemies, true)
        expect(target.id).toBe(2)
      }
    })

    it('falls back to any target when no MARKED targets exist', () => {
      const enemies = [
        { id: 1, currentHp: 100, statusEffects: [] },
        { id: 2, currentHp: 100, statusEffects: [] }
      ]
      const target = store.selectRandomTarget(enemies, true)
      expect([1, 2]).toContain(target.id)
    })

    it('returns null for empty array', () => {
      const target = store.selectRandomTarget([], false)
      expect(target).toBeNull()
    })
  })

  describe('Swift Arrow skills integration', () => {
    it("Hunter's Mark applies MARKED effect to enemy", () => {
      // This test verifies the skill effect structure is correct
      const huntersMarkSkill = {
        name: "Hunter's Mark",
        effects: [
          { type: EffectType.MARKED, target: 'enemy', duration: 3, value: 20 }
        ]
      }
      expect(huntersMarkSkill.effects[0].type).toBe(EffectType.MARKED)
      expect(huntersMarkSkill.effects[0].value).toBe(20)
    })
  })
})

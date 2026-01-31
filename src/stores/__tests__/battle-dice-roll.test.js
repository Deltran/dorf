import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('Dice Roll System', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('rollDice', () => {
    it('should roll a single d6 returning 1-6', () => {
      const results = []
      for (let i = 0; i < 100; i++) {
        const roll = battleStore.rollDice(1, 6)
        results.push(roll.total)
      }
      expect(results.every(r => r >= 1 && r <= 6)).toBe(true)
    })

    it('should roll multiple dice and return individual rolls and total', () => {
      const result = battleStore.rollDice(3, 6)
      expect(result.rolls).toHaveLength(3)
      expect(result.total).toBe(result.rolls.reduce((a, b) => a + b, 0))
    })

    it('should detect doubles on 2d6', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const result = battleStore.rollDice(2, 6)
      expect(result.isDoubles).toBe(true)
      vi.restoreAllMocks()
    })
  })

  describe('getDiceTier', () => {
    const tiers = [
      { min: 1, max: 2, healPercent: 50 },
      { min: 3, max: 4, healPercent: 100 },
      { min: 5, max: 6, healPercent: 150, applyRegen: true }
    ]

    it('should return correct tier for roll 1', () => {
      const tier = battleStore.getDiceTier(1, tiers)
      expect(tier.healPercent).toBe(50)
    })

    it('should return correct tier for roll 4', () => {
      const tier = battleStore.getDiceTier(4, tiers)
      expect(tier.healPercent).toBe(100)
    })

    it('should return correct tier for roll 6', () => {
      const tier = battleStore.getDiceTier(6, tiers)
      expect(tier.healPercent).toBe(150)
      expect(tier.applyRegen).toBe(true)
    })
  })

  describe('checkLoadedDice', () => {
    it('should return true and consume effect if target has LOADED_DICE', () => {
      const target = {
        instanceId: 'hero_1',
        statusEffects: [{ type: 'loaded_dice', duration: 99 }]
      }
      const result = battleStore.checkLoadedDice(target)
      expect(result).toBe(true)
      expect(target.statusEffects).toHaveLength(0)
    })

    it('should return false if target has no LOADED_DICE', () => {
      const target = {
        instanceId: 'hero_1',
        statusEffects: []
      }
      expect(battleStore.checkLoadedDice(target)).toBe(false)
    })
  })
})

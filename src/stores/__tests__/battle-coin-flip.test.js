import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('Coin Flip System', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('flipCoin', () => {
    it('should return heads or tails', () => {
      const results = new Set()
      for (let i = 0; i < 100; i++) {
        results.add(battleStore.flipCoin())
      }
      expect(results.has('heads')).toBe(true)
      expect(results.has('tails')).toBe(true)
    })

    it('should return heads when Math.random < 0.5', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.3)
      expect(battleStore.flipCoin()).toBe('heads')
      vi.restoreAllMocks()
    })

    it('should return tails when Math.random >= 0.5', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.7)
      expect(battleStore.flipCoin()).toBe('tails')
      vi.restoreAllMocks()
    })
  })

  describe('applyCoinFlipResult', () => {
    it('should apply COIN_FLIP_HEADS effect for heads', () => {
      const hero = {
        instanceId: 'jack_1',
        currentHp: 100,
        template: {
          coinFlipEffects: {
            heads: { damageMultiplier: 2.5, firstHitOnly: true },
            tails: { selfDamagePercent: 15, rageGain: 25 }
          }
        },
        statusEffects: [],
        currentRage: 0
      }
      battleStore.applyCoinFlipResult(hero, 'heads')
      expect(hero.statusEffects).toContainEqual(
        expect.objectContaining({ type: 'coin_flip_heads' })
      )
    })

    it('should deal self damage and gain rage for tails', () => {
      const hero = {
        instanceId: 'jack_1',
        currentHp: 100,
        maxHp: 100,
        template: {
          coinFlipEffects: {
            heads: { damageMultiplier: 2.5, firstHitOnly: true },
            tails: { selfDamagePercent: 15, rageGain: 25 }
          }
        },
        statusEffects: [],
        currentRage: 0
      }
      battleStore.applyCoinFlipResult(hero, 'tails')
      expect(hero.currentHp).toBe(85)
      expect(hero.currentRage).toBe(25)
      expect(hero.tookSelfDamageThisTurn).toBe(true)
    })
  })

  describe('consumeCoinFlipBonus', () => {
    it('should return multiplier and remove effect', () => {
      const hero = {
        statusEffects: [{ type: 'coin_flip_heads', value: 2.5 }]
      }
      const multiplier = battleStore.consumeCoinFlipBonus(hero)
      expect(multiplier).toBe(2.5)
      expect(hero.statusEffects).toHaveLength(0)
    })

    it('should return 1 if no bonus present', () => {
      const hero = { statusEffects: [] }
      expect(battleStore.consumeCoinFlipBonus(hero)).toBe(1)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { EffectType, effectDefinitions, createEffect } from '../statusEffects'

describe('Gambler Status Effects', () => {
  describe('COIN_FLIP_HEADS', () => {
    it('should exist as an effect type', () => {
      expect(EffectType.COIN_FLIP_HEADS).toBe('coin_flip_heads')
    })

    it('should have correct definition', () => {
      const def = effectDefinitions[EffectType.COIN_FLIP_HEADS]
      expect(def.name).toBe('Lucky Flip')
      expect(def.icon).toBe('🪙')
      expect(def.isBuff).toBe(true)
      expect(def.isCoinFlip).toBe(true)
    })

    it('should be creatable with createEffect', () => {
      const effect = createEffect(EffectType.COIN_FLIP_HEADS, { duration: 1, value: 150 })
      expect(effect.type).toBe('coin_flip_heads')
      expect(effect.duration).toBe(1)
      expect(effect.value).toBe(150)
    })
  })

  describe('LOADED_DICE', () => {
    it('should exist as an effect type', () => {
      expect(EffectType.LOADED_DICE).toBe('loaded_dice')
    })

    it('should have correct definition', () => {
      const def = effectDefinitions[EffectType.LOADED_DICE]
      expect(def.name).toBe('Loaded Dice')
      expect(def.icon).toBe('🎲')
      expect(def.isBuff).toBe(true)
      expect(def.isLoadedDice).toBe(true)
    })
  })

  describe('FORTUNE_SWAPPED', () => {
    it('should exist as an effect type', () => {
      expect(EffectType.FORTUNE_SWAPPED).toBe('fortune_swapped')
    })

    it('should have correct definition', () => {
      const def = effectDefinitions[EffectType.FORTUNE_SWAPPED]
      expect(def.name).toBe('Fate Reversed')
      expect(def.icon).toBe('🎡')
      expect(def.isTracker).toBe(true)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('VICIOUS damage bonus', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have getViciousDamageMultiplier function', () => {
    expect(typeof battleStore.getViciousDamageMultiplier).toBe('function')
  })

  it('should return 1.0 when attacker has no VICIOUS effect', () => {
    const attacker = { statusEffects: [] }
    const target = { statusEffects: [{ type: EffectType.POISON }] }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.0)
  })

  it('should return 1.0 when target has no debuffs', () => {
    const attacker = {
      statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }]
    }
    const target = { statusEffects: [] }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.0)
  })

  it('should return bonus multiplier when attacker has VICIOUS and target has debuffs', () => {
    const attacker = {
      statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }]
    }
    const target = {
      statusEffects: [{ type: EffectType.POISON, definition: { isBuff: false } }]
    }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.3)
  })

  it('should work with any debuff type', () => {
    const attacker = {
      statusEffects: [{ type: EffectType.VICIOUS, bonusDamagePercent: 30 }]
    }
    const target = {
      statusEffects: [{ type: EffectType.DEF_DOWN, definition: { isBuff: false } }]
    }

    expect(battleStore.getViciousDamageMultiplier(attacker, target)).toBe(1.3)
  })
})

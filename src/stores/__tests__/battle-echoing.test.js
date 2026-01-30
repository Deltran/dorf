import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('ECHOING AoE conversion', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have checkAndApplyEchoing function', () => {
    expect(typeof battleStore.checkAndApplyEchoing).toBe('function')
  })

  it('should return false when hero has no ECHOING effect', () => {
    const hero = { statusEffects: [] }
    const skill = { damagePercent: 100 }

    expect(battleStore.checkAndApplyEchoing(hero, skill)).toBe(false)
  })

  it('should return false for multi-hit skills', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }
    const skill = { damagePercent: 100, multiHit: 3 }

    expect(battleStore.checkAndApplyEchoing(hero, skill)).toBe(false)
  })

  it('should return true for single-hit damaging skills with ECHOING', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }
    const skill = { damagePercent: 100 }

    expect(battleStore.checkAndApplyEchoing(hero, skill)).toBe(true)
  })

  it('should return splash percent from effect', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }

    expect(battleStore.getEchoingSplashPercent(hero)).toBe(50)
  })

  it('should consume ECHOING effect after use', () => {
    const hero = {
      statusEffects: [{ type: EffectType.ECHOING, splashPercent: 50 }]
    }

    battleStore.consumeEchoingEffect(hero)

    expect(hero.statusEffects.find(e => e.type === EffectType.ECHOING)).toBeUndefined()
  })
})

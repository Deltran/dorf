import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'

describe('shieldPercentMaxHp calculation', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have calculateShieldFromPercentMaxHp function', () => {
    expect(typeof battleStore.calculateShieldFromPercentMaxHp).toBe('function')
  })

  it('should calculate shield as percentage of max HP', () => {
    const target = { maxHp: 1000 }
    const effect = { shieldPercentMaxHp: 25 }

    const shieldHp = battleStore.calculateShieldFromPercentMaxHp(target, effect)

    expect(shieldHp).toBe(250) // 25% of 1000
  })

  it('should return 0 if no shieldPercentMaxHp', () => {
    const target = { maxHp: 1000 }
    const effect = {}

    const shieldHp = battleStore.calculateShieldFromPercentMaxHp(target, effect)

    expect(shieldHp).toBe(0)
  })

  it('should floor the result', () => {
    const target = { maxHp: 333 }
    const effect = { shieldPercentMaxHp: 25 }

    const shieldHp = battleStore.calculateShieldFromPercentMaxHp(target, effect)

    expect(shieldHp).toBe(83) // floor(333 * 0.25)
  })
})

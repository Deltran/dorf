import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'

describe("Suffering's Crescendo Finale", () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should calculate bonus based on HP lost', () => {
    // Simulate 1500 HP lost
    battleStore.totalAllyHpLost = 1500

    const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)

    // 1500 / 150 = 10% bonus, capped at 25
    // Total: 10 base + 10 bonus = 20%
    expect(bonus).toBe(20)
  })

  it('should cap bonus at maxBonus', () => {
    // Simulate 6000 HP lost
    battleStore.totalAllyHpLost = 6000

    const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)

    // 6000 / 150 = 40% bonus, but capped at 25
    // Total: 10 base + 25 bonus = 35%
    expect(bonus).toBe(35)
  })

  it('should reset HP tracking after Finale triggers', () => {
    battleStore.totalAllyHpLost = 1000

    battleStore.processSufferingCrescendoFinale([], { baseBuff: 10, hpPerPercent: 150, maxBonus: 25, duration: 3 })

    expect(battleStore.totalAllyHpLost).toBe(0)
  })

  it('should apply ATK_UP and DEF_UP to all allies', () => {
    battleStore.totalAllyHpLost = 1500

    const heroes = [
      { instanceId: 'h1', currentHp: 100, statusEffects: [] },
      { instanceId: 'h2', currentHp: 100, statusEffects: [] }
    ]

    battleStore.processSufferingCrescendoFinale(heroes, { baseBuff: 10, hpPerPercent: 150, maxBonus: 25, duration: 3 })

    // Each hero should have ATK_UP and DEF_UP
    expect(heroes[0].statusEffects).toHaveLength(2)
    expect(heroes[0].statusEffects[0].type).toBe('atk_up')
    expect(heroes[0].statusEffects[0].value).toBe(20)
    expect(heroes[0].statusEffects[1].type).toBe('def_up')
    expect(heroes[0].statusEffects[1].value).toBe(20)
  })
})

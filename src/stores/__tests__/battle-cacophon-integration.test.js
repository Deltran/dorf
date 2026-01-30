import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { cacophon } from '../../data/heroes/5star/cacophon.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Cacophon integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should load Cacophon hero data correctly', () => {
    expect(cacophon.skills).toHaveLength(5)
    expect(cacophon.finale).toBeDefined()
    expect(cacophon.leaderSkill).toBeDefined()
  })

  it('should have all required effect types defined', () => {
    expect(EffectType.VICIOUS).toBeDefined()
    expect(EffectType.SHATTERED_TEMPO).toBeDefined()
    expect(EffectType.ECHOING).toBeDefined()
    expect(EffectType.DISCORDANT_RESONANCE).toBeDefined()
  })

  it('should track HP cost through multiple skill uses', () => {
    const hero1 = { instanceId: 'h1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 }
    const hero2 = { instanceId: 'h2', templateId: 'aurora', currentHp: 1000, maxHp: 1000 }

    // Simulate Discordant Anthem (5% to all)
    battleStore.applyAllyHpCost(hero1, 5, true)
    battleStore.applyAllyHpCost(hero2, 5, true)

    // Simulate Vicious Verse on hero1 (5%)
    battleStore.applyAllyHpCost(hero1, 5, true)

    // Total: 50 + 50 + 50 = 150 HP lost
    expect(battleStore.totalAllyHpLost).toBe(150)
  })

  it('should calculate correct Finale buff after typical rotation', () => {
    // Simulate a fight where 1800 HP was lost
    battleStore.totalAllyHpLost = 1800

    // baseBuff: 10, hpPerPercent: 150, maxBonus: 25
    // 1800 / 150 = 12% bonus
    // Total: 10 + 12 = 22%
    const bonus = battleStore.calculateSufferingCrescendoBonus(10, 150, 25)
    expect(bonus).toBe(22)
  })
})

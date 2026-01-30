import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Cacophon Finale integration', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have processFinaleEffects function', () => {
    expect(typeof battleStore.processFinaleEffects).toBe('function')
  })

  it('should process suffering_crescendo finale effect', () => {
    // Simulate some HP lost
    battleStore.totalAllyHpLost = 1500

    const heroes = [
      { instanceId: 'h1', currentHp: 500, statusEffects: [] },
      { instanceId: 'h2', currentHp: 500, statusEffects: [] }
    ]

    const finaleEffect = {
      type: 'suffering_crescendo',
      baseBuff: 10,
      hpPerPercent: 150,
      maxBonus: 25,
      duration: 3
    }

    battleStore.processFinaleEffects(heroes, [finaleEffect])

    // 1500 / 150 = 10% bonus, 10 base + 10 = 20%
    expect(heroes[0].statusEffects).toHaveLength(2)
    expect(heroes[0].statusEffects[0].type).toBe(EffectType.ATK_UP)
    expect(heroes[0].statusEffects[0].value).toBe(20)
    expect(heroes[0].statusEffects[1].type).toBe(EffectType.DEF_UP)
    expect(heroes[0].statusEffects[1].value).toBe(20)
  })

  it('should reset HP tracking after processing finale', () => {
    battleStore.totalAllyHpLost = 1500

    const heroes = [{ instanceId: 'h1', currentHp: 500, statusEffects: [] }]
    const finaleEffect = {
      type: 'suffering_crescendo',
      baseBuff: 10,
      hpPerPercent: 150,
      maxBonus: 25,
      duration: 3
    }

    battleStore.processFinaleEffects(heroes, [finaleEffect])

    expect(battleStore.totalAllyHpLost).toBe(0)
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'

describe('Cacophon skill execution with HP cost', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have processAllyHpCostForSkill function', () => {
    expect(typeof battleStore.processAllyHpCostForSkill).toBe('function')
  })

  it('should apply HP cost to single target', () => {
    const caster = { instanceId: 'cacophon', templateId: 'cacophon' }
    const target = { instanceId: 'ally1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 }
    const skill = { allyHpCostPercent: 5, targetType: 'ally' }

    battleStore.processAllyHpCostForSkill(caster, skill, [target])

    expect(target.currentHp).toBe(950)
    expect(battleStore.totalAllyHpLost).toBe(50)
  })

  it('should apply HP cost to all allies for all_allies skills', () => {
    const caster = { instanceId: 'cacophon', templateId: 'cacophon' }
    const allies = [
      { instanceId: 'ally1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 },
      { instanceId: 'ally2', templateId: 'aurora', currentHp: 800, maxHp: 800 }
    ]
    const skill = { allyHpCostPercent: 5, targetType: 'all_allies' }

    battleStore.processAllyHpCostForSkill(caster, skill, allies)

    expect(allies[0].currentHp).toBe(950) // -50
    expect(allies[1].currentHp).toBe(760) // -40
    expect(battleStore.totalAllyHpLost).toBe(90) // 50 + 40
  })

  it('should skip Cacophon when applying HP cost', () => {
    const caster = { instanceId: 'cacophon', templateId: 'cacophon', currentHp: 500, maxHp: 500 }
    const allies = [
      caster,
      { instanceId: 'ally1', templateId: 'shadow_king', currentHp: 1000, maxHp: 1000 }
    ]
    const skill = { allyHpCostPercent: 5, targetType: 'all_allies' }

    battleStore.processAllyHpCostForSkill(caster, skill, allies)

    expect(caster.currentHp).toBe(500) // Unchanged
    expect(allies[1].currentHp).toBe(950) // -50
  })
})

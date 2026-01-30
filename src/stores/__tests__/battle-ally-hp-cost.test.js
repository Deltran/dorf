import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'

describe('Ally HP Cost mechanic', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should have applyAllyHpCost function', () => {
    expect(typeof battleStore.applyAllyHpCost).toBe('function')
  })

  it('should deal percentage of max HP as damage to ally', () => {
    // Setup a mock hero with 1000 max HP
    const mockHero = {
      instanceId: 'hero1',
      currentHp: 1000,
      maxHp: 1000
    }

    // Apply 5% HP cost
    const damage = battleStore.applyAllyHpCost(mockHero, 5)

    expect(damage).toBe(50) // 5% of 1000
    expect(mockHero.currentHp).toBe(950)
  })

  it('should not reduce HP below 1', () => {
    const mockHero = {
      instanceId: 'hero1',
      currentHp: 30,
      maxHp: 1000
    }

    // Apply 5% HP cost (50 damage) when hero only has 30 HP
    const damage = battleStore.applyAllyHpCost(mockHero, 5)

    expect(mockHero.currentHp).toBe(1) // Minimum 1 HP
  })

  it('should track HP lost for Finale calculation', () => {
    const mockHero = {
      instanceId: 'hero1',
      currentHp: 1000,
      maxHp: 1000
    }

    battleStore.applyAllyHpCost(mockHero, 5)
    battleStore.applyAllyHpCost(mockHero, 6)

    expect(battleStore.totalAllyHpLost).toBe(110) // 50 + 60
  })

  it('should not apply HP cost to Cacophon herself', () => {
    const cacophon = {
      instanceId: 'cacophon1',
      templateId: 'cacophon',
      currentHp: 500,
      maxHp: 500
    }

    const damage = battleStore.applyAllyHpCost(cacophon, 5, true) // true = isCacophonSkill

    expect(damage).toBe(0)
    expect(cacophon.currentHp).toBe(500) // Unchanged
  })
})

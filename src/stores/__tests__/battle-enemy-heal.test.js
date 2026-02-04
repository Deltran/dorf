// src/stores/__tests__/battle-enemy-heal.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('battle store - Enemy healAllAllies', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  function setupBattleForEnemyTurn(healerOverrides = {}, extraEnemies = []) {
    const hero = {
      instanceId: 'hero_1',
      templateId: 'farm_hand',
      template: {
        id: 'farm_hand',
        name: 'Farm Hand',
        classId: 'berserker',
        skills: [],
        baseStats: { hp: 500, atk: 100, def: 50, spd: 10, mp: 0 }
      },
      class: { id: 'berserker', resourceType: 'rage', resourceName: 'Rage' },
      stats: { hp: 500, atk: 100, def: 50, spd: 10 },
      currentHp: 500,
      maxHp: 500,
      currentRage: 0,
      level: 1,
      statusEffects: [],
      currentCooldowns: {}
    }

    const healer = {
      id: 'enemy_0',
      templateId: 'test_healer',
      template: {
        id: 'test_healer',
        name: 'Test Healer',
        skill: {
          name: 'Dark Blessing',
          description: 'Heal all allies for 20% of max HP',
          cooldown: 4,
          noDamage: true,
          healAllAllies: 20,
          effects: []
        }
      },
      stats: { hp: 100, atk: 20, def: 12, spd: 10 },
      currentHp: 60,
      maxHp: 100,
      statusEffects: [],
      currentCooldowns: { 'Dark Blessing': 0 },
      ...healerOverrides
    }

    store.heroes.push(hero)
    store.enemies.push(healer)
    for (const e of extraEnemies) {
      store.enemies.push(e)
    }
    store.turnOrder.push({ type: 'enemy', id: healer.id })
    store.turnOrder.push({ type: 'hero', id: hero.instanceId })
    store.currentTurnIndex = 0
    store.state = 'enemy_turn'

    return { hero, healer }
  }

  function makeDamagedEnemy(index, currentHp = 50) {
    return {
      id: `enemy_${index}`,
      templateId: 'goblin_warrior',
      template: {
        id: 'goblin_warrior',
        name: 'Goblin Warrior',
        skills: []
      },
      stats: { hp: 100, atk: 18, def: 10, spd: 9 },
      currentHp,
      maxHp: 100,
      statusEffects: [],
      currentCooldowns: {}
    }
  }

  it('heals the caster for healAllAllies % of their max HP', async () => {
    const { healer } = setupBattleForEnemyTurn()
    expect(healer.currentHp).toBe(60) // starts damaged

    store.executeEnemyTurn(healer)
    await new Promise(r => setTimeout(r, 800))

    // Should heal for 20% of maxHp = 20
    expect(healer.currentHp).toBe(80)
  })

  it('heals all alive allies for healAllAllies % of their max HP', async () => {
    const ally1 = makeDamagedEnemy(1, 50) // 100 maxHp, 50 currentHp
    const ally2 = makeDamagedEnemy(2, 30) // 100 maxHp, 30 currentHp
    const { healer } = setupBattleForEnemyTurn({}, [ally1, ally2])

    store.executeEnemyTurn(healer)
    await new Promise(r => setTimeout(r, 800))

    // Each should heal for 20% of their own maxHp = 20
    expect(ally1.currentHp).toBe(70)
    expect(ally2.currentHp).toBe(50)
    expect(healer.currentHp).toBe(80) // healer heals self too
  })

  it('does not heal above max HP', async () => {
    const ally = makeDamagedEnemy(1, 95) // 100 maxHp, 95 currentHp
    const { healer } = setupBattleForEnemyTurn({ currentHp: 100 }, [ally])

    store.executeEnemyTurn(healer)
    await new Promise(r => setTimeout(r, 800))

    // Healer at full HP stays at full
    expect(healer.currentHp).toBe(100)
    // Ally at 95 would heal 20, but caps at 100
    expect(ally.currentHp).toBe(100)
  })

  it('does not heal dead enemies', async () => {
    const deadAlly = makeDamagedEnemy(1, 0) // dead
    const aliveAlly = makeDamagedEnemy(2, 50)
    const { healer } = setupBattleForEnemyTurn({}, [deadAlly, aliveAlly])

    store.executeEnemyTurn(healer)
    await new Promise(r => setTimeout(r, 800))

    expect(deadAlly.currentHp).toBe(0) // should remain dead
    expect(aliveAlly.currentHp).toBe(70) // healed for 20
  })

  it('logs the heal', async () => {
    const { healer } = setupBattleForEnemyTurn()

    store.executeEnemyTurn(healer)
    await new Promise(r => setTimeout(r, 800))

    const healLog = store.battleLog.find(l =>
      l.message.includes('Test Healer') && l.message.includes('heal')
    )
    expect(healLog).toBeDefined()
  })

  it('also applies effects alongside healAllAllies', async () => {
    const ally = makeDamagedEnemy(1, 50)
    const { healer } = setupBattleForEnemyTurn({
      template: {
        id: 'test_healer',
        name: 'Test Healer',
        skill: {
          name: 'Spite Totem',
          description: 'Heal all allies for 15% of max HP and grant REGEN for 2 turns',
          cooldown: 4,
          noDamage: true,
          healAllAllies: 15,
          effects: [
            { type: 'regen', target: 'all_allies', duration: 2, value: 5 }
          ]
        }
      },
      currentCooldowns: { 'Spite Totem': 0 }
    }, [ally])

    store.executeEnemyTurn(healer)
    await new Promise(r => setTimeout(r, 800))

    // Healer should have healed (15% of 100 = 15, from 60 to 75)
    // REGEN also ticks at end of turn (+5), so 75 + 5 = 80
    expect(healer.currentHp).toBe(80)
    // Ally should have healed (15% of 100 = 15, from 50 to 65)
    // REGEN doesn't tick yet — only the acting enemy runs processEndOfTurnEffects
    expect(ally.currentHp).toBe(65)

    // Both should have REGEN effect
    expect(healer.statusEffects.some(e => e.type === 'regen')).toBe(true)
    expect(ally.statusEffects.some(e => e.type === 'regen')).toBe(true)
  })
})

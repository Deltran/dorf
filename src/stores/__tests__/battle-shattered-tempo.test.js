import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('SHATTERED_TEMPO turn order', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  it('should prioritize units with SHATTERED_TEMPO in turn order', () => {
    // Setup: hero with 10 SPD but SHATTERED_TEMPO should act before enemy with 100 SPD
    battleStore.heroes = [
      {
        instanceId: 'slow_hero',
        currentHp: 100,
        stats: { spd: 10 },
        template: { baseStats: { spd: 10 } },
        statusEffects: [{
          type: EffectType.SHATTERED_TEMPO,
          turnOrderPriority: 2,
          definition: { isBuff: true, isShatteredTempo: true }
        }]
      },
      {
        instanceId: 'normal_hero',
        currentHp: 100,
        stats: { spd: 50 },
        template: { baseStats: { spd: 50 } },
        statusEffects: []
      }
    ]
    battleStore.enemies = [
      {
        id: 'fast_enemy',
        currentHp: 100,
        stats: { spd: 100 },
        statusEffects: []
      }
    ]

    battleStore.calculateTurnOrder()

    // slow_hero should be in top 2 due to SHATTERED_TEMPO
    const order = battleStore.turnOrder
    const slowHeroIndex = order.findIndex(u => u.id === 'slow_hero')
    expect(slowHeroIndex).toBeLessThan(2)
  })

  it('should sort multiple SHATTERED_TEMPO units by their actual SPD', () => {
    battleStore.heroes = [
      {
        instanceId: 'hero_a',
        currentHp: 100,
        stats: { spd: 20 },
        template: { baseStats: { spd: 20 } },
        statusEffects: [{
          type: EffectType.SHATTERED_TEMPO,
          turnOrderPriority: 2,
          definition: { isBuff: true, isShatteredTempo: true }
        }]
      },
      {
        instanceId: 'hero_b',
        currentHp: 100,
        stats: { spd: 30 },
        template: { baseStats: { spd: 30 } },
        statusEffects: [{
          type: EffectType.SHATTERED_TEMPO,
          turnOrderPriority: 2,
          definition: { isBuff: true, isShatteredTempo: true }
        }]
      }
    ]
    battleStore.enemies = []

    battleStore.calculateTurnOrder()

    const order = battleStore.turnOrder
    // hero_b (30 SPD) should be before hero_a (20 SPD) among priority units
    expect(order[0].id).toBe('hero_b')
    expect(order[1].id).toBe('hero_a')
  })
})

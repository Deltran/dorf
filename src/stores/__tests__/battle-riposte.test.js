import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - Riposte noDefCheck', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  it('triggers riposte with noDefCheck even when enemy DEF is higher', () => {
    const hero = {
      instanceId: 'kensin1',
      template: { name: 'Kensin' },
      currentHp: 100,
      maxHp: 110,
      stats: { hp: 110, atk: 22, def: 35, spd: 8 },
      statusEffects: [
        {
          type: EffectType.RIPOSTE,
          duration: 2,
          value: 80,
          noDefCheck: true,
          definition: { isRiposte: true }
        }
      ],
      leaderBonuses: {}
    }

    const enemy = {
      id: 'e1',
      template: { name: 'Iron Golem' },
      currentHp: 200,
      maxHp: 200,
      stats: { hp: 200, atk: 50, def: 80, spd: 10 },
      statusEffects: [],
      baseStats: { def: 80 }
    }

    store.heroes = [hero]
    store.enemies = [enemy]

    // Enemy DEF (80) > Hero DEF (35) — old riposte would NOT trigger
    // With noDefCheck: true, it SHOULD trigger
    const result = store.checkRiposte(hero, enemy)
    expect(result.triggered).toBe(true)
    // damage = floor(22 * 80 / 100) = 17
    expect(result.damage).toBe(17)
  })

  it('does not trigger without noDefCheck when enemy DEF is higher', () => {
    const hero = {
      instanceId: 'hero1',
      template: { name: 'Old Knight' },
      currentHp: 100,
      maxHp: 110,
      stats: { hp: 110, atk: 22, def: 35, spd: 8 },
      statusEffects: [
        {
          type: EffectType.RIPOSTE,
          duration: 2,
          value: 100,
          definition: { isRiposte: true }
        }
      ],
      leaderBonuses: {}
    }

    const enemy = {
      id: 'e1',
      template: { name: 'Iron Golem' },
      currentHp: 200,
      maxHp: 200,
      stats: { hp: 200, atk: 50, def: 80, spd: 10 },
      statusEffects: [],
      baseStats: { def: 80 }
    }

    store.heroes = [hero]
    store.enemies = [enemy]

    // Enemy DEF (80) > Hero DEF (35), no noDefCheck — should NOT trigger
    const result = store.checkRiposte(hero, enemy)
    expect(result.triggered).toBe(false)
  })

  it('triggers old-style riposte when enemy DEF is lower', () => {
    const hero = {
      instanceId: 'hero1',
      template: { name: 'Old Knight' },
      currentHp: 100,
      maxHp: 110,
      stats: { hp: 110, atk: 22, def: 35, spd: 8 },
      statusEffects: [
        {
          type: EffectType.RIPOSTE,
          duration: 2,
          value: 100,
          definition: { isRiposte: true }
        }
      ],
      leaderBonuses: {}
    }

    const enemy = {
      id: 'e1',
      template: { name: 'Weak Goblin' },
      currentHp: 50,
      maxHp: 50,
      stats: { hp: 50, atk: 15, def: 10, spd: 12 },
      statusEffects: [],
      baseStats: { def: 10 }
    }

    store.heroes = [hero]
    store.enemies = [enemy]

    // Enemy DEF (10) < Hero DEF (35) — old riposte triggers normally
    const result = store.checkRiposte(hero, enemy)
    expect(result.triggered).toBe(true)
    // damage = floor(22 * 100 / 100) = 22
    expect(result.damage).toBe(22)
  })

  it('does not trigger when hero has no riposte effect', () => {
    const hero = {
      instanceId: 'hero1',
      template: { name: 'Plain Knight' },
      currentHp: 100,
      maxHp: 110,
      stats: { hp: 110, atk: 22, def: 35, spd: 8 },
      statusEffects: [],
      leaderBonuses: {}
    }

    const enemy = {
      id: 'e1',
      template: { name: 'Goblin' },
      currentHp: 50,
      maxHp: 50,
      stats: { hp: 50, atk: 15, def: 10, spd: 12 },
      statusEffects: [],
      baseStats: { def: 10 }
    }

    store.heroes = [hero]
    store.enemies = [enemy]

    const result = store.checkRiposte(hero, enemy)
    expect(result.triggered).toBe(false)
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'

describe('FLE Phase 2 — heal_percent_damage', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function makeHero(overrides = {}) {
    return {
      instanceId: 'hero_1',
      templateId: 'militia_soldier',
      template: { name: 'Militia Soldier', classId: 'knight' },
      currentHp: 500,
      maxHp: 500,
      stats: { hp: 500, atk: 100, def: 50, spd: 30 },
      statusEffects: [],
      ...overrides
    }
  }

  function makeEnemy(overrides = {}) {
    return {
      id: 0,
      name: 'Goblin Scout',
      template: { name: 'Goblin Scout' },
      currentHp: 200,
      maxHp: 200,
      stats: { hp: 200, atk: 60, def: 20, spd: 25 },
      statusEffects: [],
      ...overrides
    }
  }

  it('heals attacker after dealing damage', () => {
    const hero = makeHero({ currentHp: 50, maxHp: 500 })
    const enemy = makeEnemy({ currentHp: 500, maxHp: 500 })
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', type: 'heal_percent_damage', scope: 'heroes', value: 50 }
    ])

    // Hero deals 100 damage to enemy, should heal 50% of actual damage
    battleStore.applyDamage(enemy, 100, 'attack', hero)

    // Hero started at 50 HP, dealt 100 damage, 50% lifesteal = 50 heal → 100 HP
    expect(hero.currentHp).toBe(100)
  })

  it('does not overheal past maxHp', () => {
    const hero = makeHero({ currentHp: 490, maxHp: 500 })
    const enemy = makeEnemy({ currentHp: 500, maxHp: 500 })
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', type: 'heal_percent_damage', scope: 'heroes', value: 100 }
    ])

    // Hero deals 100 damage, 100% lifesteal = 100 heal, but only 10 room → 500
    battleStore.applyDamage(enemy, 100, 'attack', hero)

    expect(hero.currentHp).toBe(500)
  })

  it('does not heal dead attacker', () => {
    const hero = makeHero({ currentHp: 0, maxHp: 500 })
    const enemy = makeEnemy({ currentHp: 500, maxHp: 500 })
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', type: 'heal_percent_damage', scope: 'heroes', value: 50 }
    ])

    battleStore.applyDamage(enemy, 100, 'attack', hero)

    // Dead attacker should NOT be healed
    expect(hero.currentHp).toBe(0)
  })

  it('respects scope — enemies scope heals enemy attacker', () => {
    const hero = makeHero({ currentHp: 500, maxHp: 500 })
    const enemy = makeEnemy({ currentHp: 50, maxHp: 200 })
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', type: 'heal_percent_damage', scope: 'enemies', value: 50 }
    ])

    // Enemy attacks hero for 100 damage, 50% lifesteal = 50 heal
    battleStore.applyDamage(hero, 100, 'attack', enemy)

    expect(enemy.currentHp).toBe(100) // 50 + 50
  })

  it('does not fire when attacker is out of scope', () => {
    const hero = makeHero({ currentHp: 50, maxHp: 500 })
    const enemy = makeEnemy({ currentHp: 500, maxHp: 500 })
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', type: 'heal_percent_damage', scope: 'enemies', value: 50 }
    ])

    // Hero attacks enemy — but scope is 'enemies', hero shouldn't get lifesteal
    battleStore.applyDamage(enemy, 100, 'attack', hero)

    expect(hero.currentHp).toBe(50)
  })

  it('scope all heals both hero and enemy attackers', () => {
    const hero = makeHero({ currentHp: 100, maxHp: 500 })
    const enemy = makeEnemy({ currentHp: 100, maxHp: 200 })
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', type: 'heal_percent_damage', scope: 'all', value: 50 }
    ])

    // Hero attacks enemy for 80 damage, 50% lifesteal = 40 heal
    battleStore.applyDamage(enemy, 80, 'attack', hero)
    expect(hero.currentHp).toBe(140) // 100 + 40

    // Enemy attacks hero for 60 damage, 50% lifesteal = 30 heal
    battleStore.applyDamage(hero, 60, 'attack', enemy)
    expect(enemy.currentHp).toBe(50) // 100 - 80 = 20, + 30 = 50
  })

  it('does not fire when no damage was dealt', () => {
    const hero = makeHero({ currentHp: 50, maxHp: 500 })
    const enemy = makeEnemy({ currentHp: 500, maxHp: 500 })
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_post_damage', type: 'heal_percent_damage', scope: 'heroes', value: 50 }
    ])

    // 0 damage should not trigger lifesteal
    battleStore.applyDamage(enemy, 0, 'attack', hero)

    expect(hero.currentHp).toBe(50)
  })
})

describe('FLE Phase 2 — grant_shield', () => {
  let battleStore, heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function makeHero(overrides = {}) {
    return {
      instanceId: 'hero_1',
      templateId: 'militia_soldier',
      template: { name: 'Militia Soldier', classId: 'knight' },
      currentHp: 500,
      maxHp: 500,
      stats: { hp: 500, atk: 100, def: 50, spd: 30 },
      statusEffects: [],
      ...overrides
    }
  }

  function makeEnemy(overrides = {}) {
    return {
      id: 0,
      name: 'Goblin Scout',
      template: { name: 'Goblin Scout' },
      currentHp: 200,
      maxHp: 200,
      stats: { hp: 200, atk: 60, def: 20, spd: 25 },
      statusEffects: [],
      ...overrides
    }
  }

  it('gives shield at turn start', () => {
    const hero = makeHero()
    battleStore.heroes = [hero]
    battleStore.enemies = [makeEnemy()]

    battleStore.setFightLevelEffects([
      { hook: 'on_turn_start', type: 'grant_shield', scope: 'heroes', value: 10 }
    ])

    battleStore.processTurnStartEffects(hero)

    const shieldEffect = (hero.statusEffects || []).find(e => e.type === 'shield')
    expect(shieldEffect).toBeTruthy()
    expect(shieldEffect.shieldHp).toBe(Math.floor(hero.maxHp * 0.10))
  })

  it('respects scope — does not shield heroes with enemies scope', () => {
    const hero = makeHero()
    battleStore.heroes = [hero]
    battleStore.enemies = [makeEnemy()]

    battleStore.setFightLevelEffects([
      { hook: 'on_turn_start', type: 'grant_shield', scope: 'enemies', value: 10 }
    ])

    battleStore.processTurnStartEffects(hero)

    // Hero is not in 'enemies' scope, should NOT get shield
    const shieldEffect = (hero.statusEffects || []).find(e => e.type === 'shield')
    expect(shieldEffect).toBeFalsy()
  })

  it('applies to enemies with enemies scope', () => {
    const enemy = makeEnemy()
    battleStore.heroes = [makeHero()]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_turn_start', type: 'grant_shield', scope: 'enemies', value: 15 }
    ])

    battleStore.processTurnStartEffects(enemy)

    const shieldEffect = (enemy.statusEffects || []).find(e => e.type === 'shield')
    expect(shieldEffect).toBeTruthy()
    expect(shieldEffect.shieldHp).toBe(Math.floor(enemy.maxHp * 0.15))
  })

  it('scope all applies to both heroes and enemies', () => {
    const hero = makeHero()
    const enemy = makeEnemy()
    battleStore.heroes = [hero]
    battleStore.enemies = [enemy]

    battleStore.setFightLevelEffects([
      { hook: 'on_turn_start', type: 'grant_shield', scope: 'all', value: 10 }
    ])

    battleStore.processTurnStartEffects(hero)
    battleStore.processTurnStartEffects(enemy)

    const heroShield = (hero.statusEffects || []).find(e => e.type === 'shield')
    const enemyShield = (enemy.statusEffects || []).find(e => e.type === 'shield')
    expect(heroShield).toBeTruthy()
    expect(enemyShield).toBeTruthy()
  })

  it('shield amount is based on unit maxHp', () => {
    const hero = makeHero({ maxHp: 1000 })
    battleStore.heroes = [hero]
    battleStore.enemies = [makeEnemy()]

    battleStore.setFightLevelEffects([
      { hook: 'on_turn_start', type: 'grant_shield', scope: 'heroes', value: 20 }
    ])

    battleStore.processTurnStartEffects(hero)

    const shieldEffect = (hero.statusEffects || []).find(e => e.type === 'shield')
    expect(shieldEffect).toBeTruthy()
    expect(shieldEffect.shieldHp).toBe(200) // 20% of 1000
  })
})

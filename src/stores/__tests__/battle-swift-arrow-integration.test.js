import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

describe('Swift Arrow bonusIfTargetHas', () => {
  let battleStore

  function createHero(overrides = {}) {
    return {
      instanceId: overrides.instanceId || 'swift_arrow_1',
      templateId: 'swift_arrow',
      template: {
        name: 'Swift Arrow',
        classId: 'ranger',
        skills: [
          { name: 'Quick Shot', targetType: 'enemy', damagePercent: 90 },
          { name: 'Pinning Volley', targetType: 'all_enemies', damagePercent: 60 },
          { name: 'Nimble Reposition', targetType: 'self', noDamage: true },
          {
            name: 'Precision Strike',
            targetType: 'enemy',
            damagePercent: 140,
            bonusIfTargetHas: [
              { effectType: EffectType.DEF_DOWN, ignoreDef: 20 },
              { effectType: EffectType.SPD_DOWN, damagePercent: 180 }
            ]
          }
        ]
      },
      class: { resourceType: 'focus', resourceName: 'Focus' },
      stats: { hp: 500, atk: 100, def: 50, spd: 20, mp: 55 },
      currentHp: 500,
      maxHp: 500,
      currentMp: 55,
      maxMp: 55,
      hasFocus: true,
      statusEffects: [],
      level: 6,
      leaderBonuses: {},
      ...overrides
    }
  }

  function createEnemy(overrides = {}) {
    return {
      id: overrides.id || 'enemy_1',
      template: { name: overrides.name || 'Test Goblin' },
      currentHp: overrides.currentHp || 1000,
      maxHp: overrides.maxHp || 1000,
      stats: { atk: 30, def: overrides.def ?? 50, spd: 5 },
      statusEffects: [],
      ...overrides
    }
  }

  function setupBattle(heroOverrides = {}, enemyOverrides = {}) {
    const hero = createHero(heroOverrides)
    const enemy = createEnemy(enemyOverrides)

    battleStore.heroes.push(hero)
    battleStore.enemies.push(enemy)
    battleStore.turnOrder.push({ type: 'hero', id: hero.instanceId })
    battleStore.currentTurnIndex = 0
    battleStore.state = BattleState.PLAYER_TURN

    return { hero, enemy }
  }

  function executePrecisionStrike(enemyId) {
    battleStore.selectAction('skill_3')
    battleStore.selectTarget(enemyId, 'enemy')
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('Precision Strike bonusIfTargetHas', () => {
    it('deals base damage (140%) when target has no debuffs', () => {
      const { hero, enemy } = setupBattle({}, { def: 50 })

      const effectiveAtk = battleStore.getEffectiveStat(hero, 'atk')
      const effectiveDef = battleStore.getEffectiveStat(enemy, 'def')
      const baseDamage = battleStore.calculateDamageWithMarked(effectiveAtk, 140 / 100, effectiveDef, 1)

      const enemyHpBefore = enemy.currentHp
      executePrecisionStrike(enemy.id)
      const actualDamage = enemyHpBefore - enemy.currentHp

      // With no debuffs, should use base 140% and full DEF
      expect(actualDamage).toBe(baseDamage)
    })

    it('uses upgraded damagePercent (180%) when target has SPD_DOWN', () => {
      const { hero, enemy } = setupBattle({}, { def: 50 })

      // Apply SPD_DOWN to enemy
      battleStore.applyEffect(enemy, EffectType.SPD_DOWN, { duration: 2, value: 15 })

      const effectiveAtk = battleStore.getEffectiveStat(hero, 'atk')
      const effectiveDef = battleStore.getEffectiveStat(enemy, 'def')

      // Expected: 180% damagePercent (upgraded from 140%), full DEF
      const expectedWithBonus = battleStore.calculateDamageWithMarked(effectiveAtk, 180 / 100, effectiveDef, 1)
      // Without bonus, would be 140%
      const expectedWithoutBonus = battleStore.calculateDamageWithMarked(effectiveAtk, 140 / 100, effectiveDef, 1)

      const enemyHpBefore = enemy.currentHp
      executePrecisionStrike(enemy.id)
      const actualDamage = enemyHpBefore - enemy.currentHp

      expect(actualDamage).toBe(expectedWithBonus)
      expect(actualDamage).toBeGreaterThan(expectedWithoutBonus)
    })

    it('applies extra ignoreDef (20%) when target has DEF_DOWN', () => {
      const { hero, enemy } = setupBattle({}, { def: 100 })

      // Apply DEF_DOWN to enemy
      battleStore.applyEffect(enemy, EffectType.DEF_DOWN, { duration: 2, value: 15 })

      const effectiveAtk = battleStore.getEffectiveStat(hero, 'atk')
      const effectiveDef = battleStore.getEffectiveStat(enemy, 'def')

      // Expected: 140% damagePercent, 20% ignoreDef
      const reducedDef = effectiveDef * (1 - 0.20)
      const expectedWithBonus = battleStore.calculateDamageWithMarked(effectiveAtk, 140 / 100, reducedDef, 1)
      // Without bonus, full effective DEF
      const expectedWithoutBonus = battleStore.calculateDamageWithMarked(effectiveAtk, 140 / 100, effectiveDef, 1)

      const enemyHpBefore = enemy.currentHp
      executePrecisionStrike(enemy.id)
      const actualDamage = enemyHpBefore - enemy.currentHp

      expect(actualDamage).toBe(expectedWithBonus)
      expect(actualDamage).toBeGreaterThan(expectedWithoutBonus)
    })

    it('applies BOTH bonuses when target has both DEF_DOWN and SPD_DOWN', () => {
      const { hero, enemy } = setupBattle({}, { def: 100 })

      // Apply both debuffs
      battleStore.applyEffect(enemy, EffectType.DEF_DOWN, { duration: 2, value: 15 })
      battleStore.applyEffect(enemy, EffectType.SPD_DOWN, { duration: 2, value: 15 })

      const effectiveAtk = battleStore.getEffectiveStat(hero, 'atk')
      const effectiveDef = battleStore.getEffectiveStat(enemy, 'def')

      // Expected: 180% damagePercent + 20% ignoreDef
      const reducedDef = effectiveDef * (1 - 0.20)
      const expectedWithBothBonuses = battleStore.calculateDamageWithMarked(effectiveAtk, 180 / 100, reducedDef, 1)
      // Without bonuses: 140% and full DEF
      const expectedWithoutBonuses = battleStore.calculateDamageWithMarked(effectiveAtk, 140 / 100, effectiveDef, 1)

      const enemyHpBefore = enemy.currentHp
      executePrecisionStrike(enemy.id)
      const actualDamage = enemyHpBefore - enemy.currentHp

      expect(actualDamage).toBe(expectedWithBothBonuses)
      expect(actualDamage).toBeGreaterThan(expectedWithoutBonuses)
    })

    it('does NOT apply bonus when target has unrelated debuffs', () => {
      const { hero, enemy } = setupBattle({}, { def: 50 })

      // Apply ATK_DOWN (not DEF_DOWN or SPD_DOWN)
      battleStore.applyEffect(enemy, EffectType.ATK_DOWN, { duration: 2, value: 15 })

      const effectiveAtk = battleStore.getEffectiveStat(hero, 'atk')
      const effectiveDef = battleStore.getEffectiveStat(enemy, 'def')

      // Should use base 140% with no ignoreDef bonus
      const expectedBaseDamage = battleStore.calculateDamageWithMarked(effectiveAtk, 140 / 100, effectiveDef, 1)

      const enemyHpBefore = enemy.currentHp
      executePrecisionStrike(enemy.id)
      const actualDamage = enemyHpBefore - enemy.currentHp

      expect(actualDamage).toBe(expectedBaseDamage)
    })
  })
})

describe('Swift Arrow conditionalEffects (Pinning Volley)', () => {
  let battleStore

  function createHero(overrides = {}) {
    return {
      instanceId: overrides.instanceId || 'swift_arrow_1',
      templateId: 'swift_arrow',
      template: {
        name: 'Swift Arrow',
        classId: 'ranger',
        skills: [
          { name: 'Quick Shot', targetType: 'enemy', damagePercent: 90 },
          {
            name: 'Pinning Volley',
            targetType: 'all_enemies',
            damagePercent: 60,
            conditionalEffects: [
              {
                condition: 'target_has_debuff',
                type: EffectType.DEF_DOWN,
                target: 'enemy',
                duration: 2,
                value: 15
              }
            ]
          },
          { name: 'Nimble Reposition', targetType: 'self', noDamage: true },
          {
            name: 'Precision Strike',
            targetType: 'enemy',
            damagePercent: 140,
            bonusIfTargetHas: [
              { effectType: EffectType.DEF_DOWN, ignoreDef: 20 },
              { effectType: EffectType.SPD_DOWN, damagePercent: 180 }
            ]
          }
        ]
      },
      class: { resourceType: 'focus', resourceName: 'Focus' },
      stats: { hp: 500, atk: 100, def: 50, spd: 20, mp: 55 },
      currentHp: 500,
      maxHp: 500,
      currentMp: 55,
      maxMp: 55,
      hasFocus: true,
      statusEffects: [],
      level: 6,
      leaderBonuses: {},
      ...overrides
    }
  }

  function createEnemy(overrides = {}) {
    return {
      id: overrides.id || 'enemy_1',
      template: { name: overrides.name || 'Test Goblin' },
      currentHp: overrides.currentHp || 1000,
      maxHp: overrides.maxHp || 1000,
      stats: { atk: 30, def: overrides.def ?? 50, spd: 5 },
      statusEffects: [],
      ...overrides
    }
  }

  function setupBattleWithTwoEnemies() {
    const hero = createHero()
    const enemy0 = createEnemy({ id: 'enemy_0', name: 'Goblin A' })
    const enemy1 = createEnemy({ id: 'enemy_1', name: 'Goblin B' })

    battleStore.heroes.push(hero)
    battleStore.enemies.push(enemy0, enemy1)
    battleStore.turnOrder.push({ type: 'hero', id: hero.instanceId })
    battleStore.currentTurnIndex = 0
    battleStore.state = BattleState.PLAYER_TURN

    return { hero, enemies: [enemy0, enemy1] }
  }

  function executePinningVolley() {
    // all_enemies skills auto-execute on selectAction
    battleStore.selectAction('skill_1')
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('applies DEF_DOWN to enemies that already have a debuff', () => {
    const { hero, enemies } = setupBattleWithTwoEnemies()

    // Apply SPD_DOWN to enemy 0 (giving it a debuff)
    battleStore.applyEffect(enemies[0], EffectType.SPD_DOWN, { duration: 2, value: 15 })

    // Enemy 1 has no debuffs

    // Verify skill is Pinning Volley
    const skill = hero.template.skills[1]
    expect(skill.name).toBe('Pinning Volley')

    executePinningVolley()

    // Enemy 0 should have DEF_DOWN (had a debuff)
    const enemy0DefDown = enemies[0].statusEffects.find(e => e.type === EffectType.DEF_DOWN)
    expect(enemy0DefDown).toBeDefined()
    expect(enemy0DefDown.value).toBe(15)
    expect(enemy0DefDown.duration).toBe(2)

    // Enemy 1 should NOT have DEF_DOWN (had no debuff)
    const enemy1DefDown = enemies[1].statusEffects.find(e => e.type === EffectType.DEF_DOWN)
    expect(enemy1DefDown).toBeUndefined()
  })

  it('does not apply DEF_DOWN to enemies with no debuffs', () => {
    const { hero, enemies } = setupBattleWithTwoEnemies()

    // No debuffs on anyone
    const skill = hero.template.skills[1]
    expect(skill.name).toBe('Pinning Volley')

    executePinningVolley()

    // Neither enemy should have DEF_DOWN
    for (const enemy of enemies) {
      const defDown = enemy.statusEffects.find(e => e.type === EffectType.DEF_DOWN)
      expect(defDown).toBeUndefined()
    }
  })

  it('applies DEF_DOWN to ALL enemies that have debuffs', () => {
    const { hero, enemies } = setupBattleWithTwoEnemies()

    // Apply debuffs to both enemies
    battleStore.applyEffect(enemies[0], EffectType.SPD_DOWN, { duration: 2, value: 15 })
    battleStore.applyEffect(enemies[1], EffectType.POISON, { duration: 3, value: 10 })

    const skill = hero.template.skills[1]
    expect(skill.name).toBe('Pinning Volley')

    executePinningVolley()

    // Both enemies should have DEF_DOWN
    for (const enemy of enemies) {
      const defDown = enemy.statusEffects.find(e => e.type === EffectType.DEF_DOWN)
      expect(defDown).toBeDefined()
      expect(defDown.value).toBe(15)
    }
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle.js'
import { cacophon } from '../../data/heroes/5star/cacophon.js'
import { EffectType } from '../../data/statusEffects.js'

/**
 * Integration tests for Cacophon's allyHpCostPercent mechanic.
 *
 * These tests verify that when Cacophon uses a skill with allyHpCostPercent,
 * the target ally actually loses HP during the skill execution flow.
 *
 * Bug context: processAllyHpCostForSkill exists but was never called
 * in executePlayerAction, causing HP cost to not be applied.
 */
describe('Cacophon HP cost during skill execution', () => {
  let battleStore

  // Helper to create a test hero with proper structure
  function createTestHero(overrides = {}) {
    const hp = overrides.currentHp ?? overrides.maxHp ?? 1000
    const maxHp = overrides.maxHp ?? 1000
    const base = {
      instanceId: overrides.instanceId || 'test_hero',
      templateId: overrides.templateId || 'shadow_king',
      template: {
        name: overrides.name || 'Test Hero',
        classId: overrides.classId || 'berserker',
        skills: overrides.skills || [{ name: 'Basic', targetType: 'enemy', damagePercent: 100 }]
      },
      class: { resourceType: overrides.resourceType || null, resourceName: 'MP' },
      stats: {
        hp: maxHp,
        atk: overrides.atk ?? 100,
        def: overrides.def ?? 50,
        spd: overrides.spd ?? 10,
        mp: overrides.mp ?? 100
      },
      currentHp: hp,
      maxHp: maxHp,
      currentMp: overrides.currentMp ?? 100,
      maxMp: overrides.maxMp ?? 100,
      currentRage: overrides.currentRage ?? 0,
      hasFocus: overrides.hasFocus ?? true,
      currentVerses: overrides.currentVerses ?? 0,
      lastSkillName: null,
      statusEffects: [],
      level: 1
    }
    return { ...base, ...overrides }
  }

  // Helper to create Cacophon hero for tests
  function createCacophonHero() {
    return createTestHero({
      instanceId: 'cacophon_test',
      templateId: 'cacophon',
      name: 'Cacophon',
      classId: 'bard',
      resourceType: 'verse',
      skills: cacophon.skills,
      currentVerses: 0
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('single target ally skills', () => {
    it('should apply HP cost when Cacophon uses Vicious Verse on ally', () => {
      // Setup: Cacophon and an ally
      const cacophonHero = createCacophonHero()
      const ally = createTestHero({
        instanceId: 'ally_1',
        templateId: 'shadow_king',
        name: 'Shadow King',
        currentHp: 1000,
        maxHp: 1000
      })

      // Set up battle state
      battleStore.heroes.push(cacophonHero, ally)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100 })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally.instanceId }
      )
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Cacophon selects Vicious Verse (skill index 1, 5% HP cost)
      battleStore.selectAction('skill_1')
      battleStore.selectTarget(ally.instanceId, 'ally')

      // Verify ally took 5% HP damage (50 damage from 1000 max HP)
      expect(ally.currentHp).toBe(950)
      expect(battleStore.totalAllyHpLost).toBe(50)
    })

    it('should apply HP cost when Cacophon uses Warding Noise on ally', () => {
      // Setup: Cacophon and an ally
      const cacophonHero = createCacophonHero()
      const ally = createTestHero({
        instanceId: 'ally_1',
        templateId: 'aurora',
        name: 'Aurora',
        currentHp: 800,
        maxHp: 800
      })

      // Set up battle state
      battleStore.heroes.push(cacophonHero, ally)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100 })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally.instanceId }
      )
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Cacophon selects Warding Noise (skill index 4, 5% HP cost)
      battleStore.selectAction('skill_4')
      battleStore.selectTarget(ally.instanceId, 'ally')

      // Verify ally took 5% HP damage (40 damage from 800 max HP)
      expect(ally.currentHp).toBe(760)
      expect(battleStore.totalAllyHpLost).toBe(40)
    })

    it('should apply 6% HP cost for Tempo Shatter', () => {
      // Setup: Cacophon and an ally
      const cacophonHero = createCacophonHero()
      const ally = createTestHero({
        instanceId: 'ally_1',
        templateId: 'shadow_king',
        name: 'Shadow King',
        currentHp: 1000,
        maxHp: 1000
      })

      // Set up battle state
      battleStore.heroes.push(cacophonHero, ally)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100 })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally.instanceId }
      )
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Cacophon selects Tempo Shatter (skill index 2, 6% HP cost)
      battleStore.selectAction('skill_2')
      battleStore.selectTarget(ally.instanceId, 'ally')

      // Verify ally took 6% HP damage (60 damage from 1000 max HP)
      expect(ally.currentHp).toBe(940)
      expect(battleStore.totalAllyHpLost).toBe(60)
    })
  })

  describe('all_allies skills', () => {
    it('should apply HP cost to all allies except Cacophon for Discordant Anthem', () => {
      // Setup: Cacophon and two allies
      const cacophonHero = createCacophonHero()
      cacophonHero.currentHp = 500
      cacophonHero.maxHp = 500

      const ally1 = createTestHero({
        instanceId: 'ally_1',
        templateId: 'shadow_king',
        name: 'Shadow King',
        currentHp: 1000,
        maxHp: 1000
      })
      const ally2 = createTestHero({
        instanceId: 'ally_2',
        templateId: 'aurora',
        name: 'Aurora',
        currentHp: 800,
        maxHp: 800
      })

      // Set up battle state
      battleStore.heroes.push(cacophonHero, ally1, ally2)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100 })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally1.instanceId },
        { type: 'hero', id: ally2.instanceId }
      )
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Cacophon selects Discordant Anthem (skill index 0, 5% HP cost to all_allies)
      // all_allies skills execute immediately without target selection
      battleStore.selectAction('skill_0')

      // Verify Cacophon did NOT take damage (caster is exempt)
      expect(cacophonHero.currentHp).toBe(500)

      // Verify allies took 5% HP damage
      expect(ally1.currentHp).toBe(950) // -50 from 1000
      expect(ally2.currentHp).toBe(760) // -40 from 800

      // Total HP lost: 50 + 40 = 90
      expect(battleStore.totalAllyHpLost).toBe(90)
    })
  })

  describe('HP cost accumulation for Suffering\'s Crescendo', () => {
    it('should accumulate HP cost across multiple skill uses', () => {
      const cacophonHero = createCacophonHero()
      const ally = createTestHero({
        instanceId: 'ally_1',
        templateId: 'shadow_king',
        name: 'Shadow King',
        currentHp: 1000,
        maxHp: 1000
      })

      // Set up battle state
      battleStore.heroes.push(cacophonHero, ally)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100 })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally.instanceId }
      )
      battleStore.state = BattleState.PLAYER_TURN

      // First skill use: Vicious Verse (5% = 50 HP)
      battleStore.currentTurnIndex = 0
      battleStore.selectAction('skill_1')
      battleStore.selectTarget(ally.instanceId, 'ally')

      // Reset for next turn (simulate turn passing)
      cacophonHero.lastSkillName = null
      cacophonHero.currentVerses = 0
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Second skill use: Tempo Shatter (6% of 950 = 57 HP)
      battleStore.selectAction('skill_2')
      battleStore.selectTarget(ally.instanceId, 'ally')

      // Verify cumulative HP loss (HP cost is % of maxHp, not currentHp)
      expect(ally.currentHp).toBe(890) // 1000 - 50 - 60
      expect(battleStore.totalAllyHpLost).toBe(110) // 50 + 60
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle.js'
import { cacophon } from '../../data/heroes/5star/cacophon.js'
import { EffectType } from '../../data/statusEffects.js'

/**
 * Integration tests for Cacophon's Warding Noise shield mechanic.
 *
 * Bug context:
 * 1. shieldPercentMaxHp wasn't being converted to shieldHp when effect applied
 * 2. applyDamage wasn't checking for SHIELD effects to absorb damage
 */
describe('Cacophon Warding Noise shield', () => {
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

  describe('shield effect creation', () => {
    it('should create shield with shieldHp calculated from shieldPercentMaxHp', () => {
      // Setup: Cacophon and an ally with 1000 max HP
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
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, stats: { atk: 50, def: 10 } })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally.instanceId }
      )
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Cacophon uses Warding Noise (skill index 4, grants 25% max HP shield)
      battleStore.selectAction('skill_4')
      battleStore.selectTarget(ally.instanceId, 'ally')

      // Verify shield effect was applied with correct shieldHp
      const shieldEffect = ally.statusEffects.find(e => e.type === EffectType.SHIELD)
      expect(shieldEffect).toBeDefined()
      expect(shieldEffect.shieldHp).toBe(250) // 25% of 1000 max HP
    })

    it('should create shield proportional to target max HP', () => {
      const cacophonHero = createCacophonHero()
      const ally = createTestHero({
        instanceId: 'ally_1',
        templateId: 'aurora',
        name: 'Aurora',
        currentHp: 800,
        maxHp: 800
      })

      battleStore.heroes.push(cacophonHero, ally)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, stats: { atk: 50, def: 10 } })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally.instanceId }
      )
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      battleStore.selectAction('skill_4')
      battleStore.selectTarget(ally.instanceId, 'ally')

      const shieldEffect = ally.statusEffects.find(e => e.type === EffectType.SHIELD)
      expect(shieldEffect).toBeDefined()
      expect(shieldEffect.shieldHp).toBe(200) // 25% of 800 max HP
    })
  })

  describe('shield damage absorption', () => {
    it('should absorb damage with shield before HP', () => {
      const ally = createTestHero({
        instanceId: 'ally_1',
        currentHp: 500,
        maxHp: 500
      })

      // Manually apply a shield effect
      ally.statusEffects = [{
        type: EffectType.SHIELD,
        duration: 2,
        shieldHp: 100,
        definition: { name: 'Shield', isBuff: true }
      }]

      battleStore.heroes.push(ally)

      // Apply 50 damage - should be absorbed by shield
      const damageDealt = battleStore.applyDamage(ally, 50, 'attack')

      expect(ally.currentHp).toBe(500) // HP unchanged
      expect(ally.statusEffects[0].shieldHp).toBe(50) // Shield reduced by 50
    })

    it('should fully absorb damage when shield is larger', () => {
      const ally = createTestHero({
        instanceId: 'ally_1',
        currentHp: 500,
        maxHp: 500
      })

      ally.statusEffects = [{
        type: EffectType.SHIELD,
        duration: 2,
        shieldHp: 200,
        definition: { name: 'Shield', isBuff: true }
      }]

      battleStore.heroes.push(ally)

      // Apply 150 damage - should be fully absorbed by shield
      battleStore.applyDamage(ally, 150, 'attack')

      expect(ally.currentHp).toBe(500) // HP unchanged
      expect(ally.statusEffects[0].shieldHp).toBe(50) // Shield reduced to 50
    })

    it('should apply overflow damage to HP when shield breaks', () => {
      const ally = createTestHero({
        instanceId: 'ally_1',
        currentHp: 500,
        maxHp: 500
      })

      ally.statusEffects = [{
        type: EffectType.SHIELD,
        duration: 2,
        shieldHp: 50,
        definition: { name: 'Shield', isBuff: true }
      }]

      battleStore.heroes.push(ally)

      // Apply 150 damage - 50 absorbed by shield, 100 to HP
      battleStore.applyDamage(ally, 150, 'attack')

      expect(ally.currentHp).toBe(400) // 500 - 100 overflow
      // Shield should be removed when broken
      const shieldEffect = ally.statusEffects.find(e => e.type === EffectType.SHIELD)
      expect(shieldEffect).toBeUndefined()
    })

    it('should remove shield effect when fully depleted', () => {
      const ally = createTestHero({
        instanceId: 'ally_1',
        currentHp: 500,
        maxHp: 500
      })

      ally.statusEffects = [{
        type: EffectType.SHIELD,
        duration: 2,
        shieldHp: 100,
        definition: { name: 'Shield', isBuff: true }
      }]

      battleStore.heroes.push(ally)

      // Apply exactly 100 damage - shield fully depleted
      battleStore.applyDamage(ally, 100, 'attack')

      expect(ally.currentHp).toBe(500) // HP unchanged
      const shieldEffect = ally.statusEffects.find(e => e.type === EffectType.SHIELD)
      expect(shieldEffect).toBeUndefined() // Shield removed
    })
  })

  describe('full integration: Warding Noise protects from attack', () => {
    it('should protect ally from enemy damage after Warding Noise', () => {
      const cacophonHero = createCacophonHero()
      const ally = createTestHero({
        instanceId: 'ally_1',
        templateId: 'shadow_king',
        name: 'Shadow King',
        currentHp: 1000,
        maxHp: 1000
      })

      battleStore.heroes.push(cacophonHero, ally)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, stats: { atk: 50, def: 10 } })
      battleStore.turnOrder.push(
        { type: 'hero', id: cacophonHero.instanceId },
        { type: 'hero', id: ally.instanceId }
      )
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Cacophon uses Warding Noise - ally gets 250 HP shield (25% of 1000)
      // But also takes 5% HP cost = 50 damage, leaving ally at 950 HP
      battleStore.selectAction('skill_4')
      battleStore.selectTarget(ally.instanceId, 'ally')

      // Verify shield was applied
      const shieldEffect = ally.statusEffects.find(e => e.type === EffectType.SHIELD)
      expect(shieldEffect).toBeDefined()
      expect(shieldEffect.shieldHp).toBe(250)

      // Verify HP cost was applied
      expect(ally.currentHp).toBe(950) // 1000 - 50 (5% HP cost)

      // Apply 100 damage from enemy attack
      battleStore.applyDamage(ally, 100, 'attack')

      // Shield should absorb the damage
      expect(ally.currentHp).toBe(950) // HP unchanged
      expect(shieldEffect.shieldHp).toBe(150) // 250 - 100
    })
  })
})

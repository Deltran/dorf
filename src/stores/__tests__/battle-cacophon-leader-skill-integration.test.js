import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle.js'
import { useHeroesStore } from '../heroes.js'
import { cacophon } from '../../data/heroes/5star/cacophon.js'
import { EffectType } from '../../data/statusEffects.js'

/**
 * Integration tests for Cacophon's Harmonic Bleeding leader skill.
 *
 * Bug context: applyBattleStartDebuffLeaderEffect exists but was never called
 * in applyPassiveLeaderEffects, so Cacophon's leader skill never activated.
 */
describe('Cacophon Harmonic Bleeding leader skill', () => {
  let battleStore
  let heroesStore

  function createTestHero(overrides = {}) {
    const hp = overrides.currentHp ?? overrides.maxHp ?? 1000
    const maxHp = overrides.maxHp ?? 1000
    return {
      instanceId: overrides.instanceId || 'test_hero',
      templateId: overrides.templateId || 'shadow_king',
      template: {
        name: overrides.name || 'Test Hero',
        classId: overrides.classId || 'berserker',
        leaderSkill: overrides.leaderSkill || null,
        skills: overrides.skills || []
      },
      class: { resourceType: overrides.resourceType || null, resourceName: 'MP' },
      stats: { hp: maxHp, atk: overrides.atk ?? 100, def: 50, spd: 10, mp: 100 },
      currentHp: hp,
      maxHp: maxHp,
      currentMp: 100,
      maxMp: 100,
      statusEffects: [],
      level: 1,
      ...overrides
    }
  }

  function createCacophonHero() {
    return createTestHero({
      instanceId: 'cacophon_test',
      templateId: 'cacophon',
      name: 'Cacophon',
      classId: 'bard',
      resourceType: 'verse',
      leaderSkill: cacophon.leaderSkill,
      skills: cacophon.skills
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('leader skill activation at battle start', () => {
    it('should apply DISCORDANT_RESONANCE to all allies when Cacophon is leader', () => {
      const cacophonHero = createCacophonHero()
      const ally1 = createTestHero({ instanceId: 'ally_1', name: 'Ally 1' })
      const ally2 = createTestHero({ instanceId: 'ally_2', name: 'Ally 2' })

      // Set up heroes store with Cacophon as leader
      heroesStore.ownedHeroes = [cacophonHero, ally1, ally2]
      heroesStore.party = [cacophonHero.instanceId, ally1.instanceId, ally2.instanceId]
      heroesStore.partyLeader = cacophonHero.instanceId

      // Initialize battle
      battleStore.initBattle(
        [cacophonHero, ally1, ally2],
        [{ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, stats: { atk: 50, def: 10, spd: 5 } }]
      )

      // Verify DISCORDANT_RESONANCE was applied to all heroes
      for (const hero of battleStore.heroes) {
        const effect = hero.statusEffects.find(e => e.type === EffectType.DISCORDANT_RESONANCE)
        expect(effect).toBeDefined()
        expect(effect.damageBonus).toBe(15)
        expect(effect.healingPenalty).toBe(30)
      }
    })
  })

  describe('damage bonus from DISCORDANT_RESONANCE', () => {
    it('should return 1.15x damage multiplier when effect is active', () => {
      const hero = createTestHero()
      hero.statusEffects = [{
        type: EffectType.DISCORDANT_RESONANCE,
        duration: 999,
        damageBonus: 15,
        healingPenalty: 30,
        definition: { name: 'Discordant Resonance' }
      }]

      const multiplier = battleStore.getDiscordantDamageBonus(hero)
      expect(multiplier).toBe(1.15)
    })

    it('should return 1.0 when effect is not present', () => {
      const hero = createTestHero()
      const multiplier = battleStore.getDiscordantDamageBonus(hero)
      expect(multiplier).toBe(1.0)
    })
  })

  describe('healing penalty from DISCORDANT_RESONANCE', () => {
    it('should return 0.7x healing multiplier when effect is active', () => {
      const hero = createTestHero()
      hero.statusEffects = [{
        type: EffectType.DISCORDANT_RESONANCE,
        duration: 999,
        damageBonus: 15,
        healingPenalty: 30,
        definition: { name: 'Discordant Resonance' }
      }]

      const multiplier = battleStore.getDiscordantHealingPenalty(hero)
      expect(multiplier).toBe(0.7)
    })

    it('should return 1.0 when effect is not present', () => {
      const hero = createTestHero()
      const multiplier = battleStore.getDiscordantHealingPenalty(hero)
      expect(multiplier).toBe(1.0)
    })
  })

  describe('damage bonus applied in combat', () => {
    it('should deal 15% more damage when DISCORDANT_RESONANCE is active', () => {
      const hero = createTestHero({
        instanceId: 'hero_1',
        name: 'Attacker',
        atk: 100,
        skills: [{ name: 'Strike', targetType: 'enemy', damagePercent: 100 }]
      })

      const enemy = { id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 1000, maxHp: 1000, stats: { atk: 50, def: 0, spd: 5 }, statusEffects: [] }

      // Set up battle - hero WITHOUT discordant resonance first
      battleStore.heroes.push(hero)
      battleStore.enemies.push(enemy)
      battleStore.turnOrder.push({ type: 'hero', id: hero.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Attack without effect
      battleStore.selectAction('skill_0')
      battleStore.selectTarget(enemy.id, 'enemy')

      const damageWithout = 1000 - enemy.currentHp

      // Reset for second attack with effect
      enemy.currentHp = 1000
      hero.statusEffects = [{
        type: EffectType.DISCORDANT_RESONANCE,
        duration: 999,
        damageBonus: 15,
        healingPenalty: 30,
        definition: { name: 'Discordant Resonance', isBuff: false }
      }]
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Attack with effect
      battleStore.selectAction('skill_0')
      battleStore.selectTarget(enemy.id, 'enemy')

      const damageWith = 1000 - enemy.currentHp

      // Damage with effect should be ~15% higher
      expect(damageWith).toBeGreaterThan(damageWithout)
      expect(damageWith).toBeCloseTo(damageWithout * 1.15, -1)
    })
  })

  describe('healing penalty applied in combat', () => {
    it('should receive 30% less healing when DISCORDANT_RESONANCE is active', () => {
      const healer = createTestHero({
        instanceId: 'healer_1',
        name: 'Healer',
        atk: 100,
        classId: 'cleric',
        // Healing skills without noDamage use description parsing - use explicit text
        skills: [{ name: 'Heal', targetType: 'ally', description: 'Heals for 50% ATK' }]
      })

      const target = createTestHero({
        instanceId: 'target_1',
        name: 'Target',
        currentHp: 500,
        maxHp: 1000
      })

      // Set up battle - target WITHOUT discordant resonance first
      battleStore.heroes.push(healer, target)
      battleStore.enemies.push({ id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 100, maxHp: 100, stats: { atk: 50, def: 10, spd: 5 }, statusEffects: [] })
      battleStore.turnOrder.push({ type: 'hero', id: healer.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Heal without effect
      battleStore.selectAction('skill_0')
      battleStore.selectTarget(target.instanceId, 'ally')

      const healWithout = target.currentHp - 500

      // Reset for second heal with effect
      target.currentHp = 500
      target.statusEffects = [{
        type: EffectType.DISCORDANT_RESONANCE,
        duration: 999,
        damageBonus: 15,
        healingPenalty: 30,
        definition: { name: 'Discordant Resonance', isBuff: false }
      }]
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Heal with effect
      battleStore.selectAction('skill_0')
      battleStore.selectTarget(target.instanceId, 'ally')

      const healWith = target.currentHp - 500

      // Healing with effect should be ~30% less
      expect(healWith).toBeLessThan(healWithout)
      expect(healWith).toBeCloseTo(healWithout * 0.7, -1)
    })
  })
})

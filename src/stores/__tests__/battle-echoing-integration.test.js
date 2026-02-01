import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'

/**
 * Integration tests for the ECHOING effect (Screaming Echo).
 *
 * Bug context: checkAndApplyEchoing, getEchoingSplashPercent, and
 * consumeEchoingEffect exist but were never called in skill execution,
 * so ECHOING never caused splash damage.
 */
describe('ECHOING effect integration', () => {
  let battleStore

  function createTestHero(overrides = {}) {
    const hp = overrides.currentHp ?? overrides.maxHp ?? 1000
    const maxHp = overrides.maxHp ?? 1000
    return {
      instanceId: overrides.instanceId || 'test_hero',
      templateId: overrides.templateId || 'shadow_king',
      template: {
        name: overrides.name || 'Test Hero',
        classId: overrides.classId || 'berserker',
        skills: overrides.skills || [
          { name: 'Single Strike', targetType: 'enemy', damagePercent: 100 }
        ]
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

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('splash damage on single-target skill', () => {
    it('should deal splash damage to other enemies when hero has ECHOING', () => {
      const hero = createTestHero({
        instanceId: 'hero_1',
        name: 'Attacker',
        atk: 100,
        skills: [{ name: 'Power Strike', targetType: 'enemy', damagePercent: 100 }]
      })

      // Apply ECHOING effect with 50% splash
      hero.statusEffects = [{
        type: EffectType.ECHOING,
        duration: 1,
        splashPercent: 50,
        definition: { name: 'Echoing', isBuff: true }
      }]

      const enemy1 = { id: 'enemy_1', template: { name: 'Goblin 1' }, currentHp: 500, maxHp: 500, stats: { atk: 50, def: 0, spd: 5 }, statusEffects: [] }
      const enemy2 = { id: 'enemy_2', template: { name: 'Goblin 2' }, currentHp: 500, maxHp: 500, stats: { atk: 50, def: 0, spd: 5 }, statusEffects: [] }
      const enemy3 = { id: 'enemy_3', template: { name: 'Goblin 3' }, currentHp: 500, maxHp: 500, stats: { atk: 50, def: 0, spd: 5 }, statusEffects: [] }

      // Set up battle state
      battleStore.heroes.push(hero)
      battleStore.enemies.push(enemy1, enemy2, enemy3)
      battleStore.turnOrder.push({ type: 'hero', id: hero.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Record starting HP
      const enemy1StartHp = enemy1.currentHp
      const enemy2StartHp = enemy2.currentHp
      const enemy3StartHp = enemy3.currentHp

      // Use single-target skill on enemy1
      battleStore.selectAction('skill_0')
      battleStore.selectTarget(enemy1.id, 'enemy')

      // Primary target should take full damage (100% ATK = 100 damage with 0 DEF)
      expect(enemy1.currentHp).toBeLessThan(enemy1StartHp)
      const primaryDamage = enemy1StartHp - enemy1.currentHp

      // Other enemies should take 50% splash damage
      expect(enemy2.currentHp).toBeLessThan(enemy2StartHp)
      expect(enemy3.currentHp).toBeLessThan(enemy3StartHp)

      const enemy2Damage = enemy2StartHp - enemy2.currentHp
      const enemy3Damage = enemy3StartHp - enemy3.currentHp

      // Splash damage should be approximately 50% of primary damage
      expect(enemy2Damage).toBeCloseTo(primaryDamage * 0.5, -1) // Allow some rounding
      expect(enemy3Damage).toBeCloseTo(primaryDamage * 0.5, -1)
    })

    it('should consume ECHOING effect after use', () => {
      const hero = createTestHero({
        instanceId: 'hero_1',
        name: 'Attacker',
        skills: [{ name: 'Strike', targetType: 'enemy', damagePercent: 100 }]
      })

      hero.statusEffects = [{
        type: EffectType.ECHOING,
        duration: 1,
        splashPercent: 50,
        definition: { name: 'Echoing', isBuff: true }
      }]

      const enemy = { id: 'enemy_1', template: { name: 'Goblin' }, currentHp: 500, maxHp: 500, stats: { atk: 50, def: 0, spd: 5 }, statusEffects: [] }

      battleStore.heroes.push(hero)
      battleStore.enemies.push(enemy)
      battleStore.turnOrder.push({ type: 'hero', id: hero.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Use skill
      battleStore.selectAction('skill_0')
      battleStore.selectTarget(enemy.id, 'enemy')

      // ECHOING effect should be consumed
      const echoingEffect = hero.statusEffects.find(e => e.type === EffectType.ECHOING)
      expect(echoingEffect).toBeUndefined()
    })

    it('should NOT trigger on noDamage skills', () => {
      const hero = createTestHero({
        instanceId: 'hero_1',
        name: 'Buffer',
        skills: [{ name: 'Buff Ally', targetType: 'ally', noDamage: true, effects: [] }]
      })

      hero.statusEffects = [{
        type: EffectType.ECHOING,
        duration: 1,
        splashPercent: 50,
        definition: { name: 'Echoing', isBuff: true }
      }]

      // checkAndApplyEchoing should return false for noDamage skills
      const skill = { name: 'Buff', noDamage: true }
      const shouldEcho = battleStore.checkAndApplyEchoing(hero, skill)
      expect(shouldEcho).toBe(false)
    })

    it('should NOT trigger on multiHit skills', () => {
      const hero = createTestHero({ instanceId: 'hero_1' })

      hero.statusEffects = [{
        type: EffectType.ECHOING,
        duration: 1,
        splashPercent: 50,
        definition: { name: 'Echoing', isBuff: true }
      }]

      const skill = { name: 'Multi Strike', damagePercent: 100, multiHit: true }
      const shouldEcho = battleStore.checkAndApplyEchoing(hero, skill)
      expect(shouldEcho).toBe(false)
    })

    it('should trigger on single-hit damaging skills', () => {
      const hero = createTestHero({ instanceId: 'hero_1' })

      hero.statusEffects = [{
        type: EffectType.ECHOING,
        duration: 1,
        splashPercent: 50,
        definition: { name: 'Echoing', isBuff: true }
      }]

      const skill = { name: 'Power Strike', damagePercent: 100, targetType: 'enemy' }
      const shouldEcho = battleStore.checkAndApplyEchoing(hero, skill)
      expect(shouldEcho).toBe(true)
    })
  })
})

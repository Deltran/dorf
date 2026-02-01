import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore, BattleState } from '../battle.js'
import { EffectType } from '../../data/statusEffects.js'
import { grandmother_rot } from '../../data/heroes/5star/grandmother_rot.js'

/**
 * Integration tests for Grandmother Rot's "The Great Composting" skill.
 *
 * The skill should:
 * 1. Consume all POISON effects from all enemies
 * 2. Grant REGEN to all allies based on poison consumed
 * 3. Baseline: 5% ATK for 2 turns
 * 4. Scaling: +2% ATK per poison stack consumed
 */
describe('The Great Composting', () => {
  let battleStore

  function createTestHero(overrides = {}) {
    const hp = overrides.currentHp ?? overrides.maxHp ?? 1000
    const maxHp = overrides.maxHp ?? 1000
    return {
      instanceId: overrides.instanceId || 'test_hero',
      templateId: overrides.templateId || 'test',
      template: {
        name: overrides.name || 'Test Hero',
        classId: overrides.classId || 'druid',
        skills: overrides.skills || []
      },
      class: { resourceType: null, resourceName: 'MP' },
      stats: { hp: maxHp, atk: overrides.atk ?? 100, def: 50, spd: 10, mp: 100 },
      currentHp: hp,
      maxHp: maxHp,
      currentMp: overrides.currentMp ?? 100,
      maxMp: overrides.maxMp ?? 100,
      statusEffects: [],
      level: 1,
      ...overrides
    }
  }

  function createGrandmotherRot() {
    return createTestHero({
      instanceId: 'grandmother_rot_1',
      templateId: 'grandmother_rot',
      name: 'Grandmother Rot',
      classId: 'druid',
      atk: 100,
      skills: grandmother_rot.skills,
      currentMp: 100
    })
  }

  function createEnemy(overrides = {}) {
    return {
      id: overrides.id || 'enemy_1',
      template: { name: overrides.name || 'Goblin' },
      currentHp: overrides.currentHp ?? 500,
      maxHp: overrides.maxHp ?? 500,
      stats: { atk: 50, def: 10, spd: 5 },
      statusEffects: overrides.statusEffects || [],
      ...overrides
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('poison consumption', () => {
    it('should remove all POISON effects from all enemies', () => {
      const grandma = createGrandmotherRot()
      const ally = createTestHero({ instanceId: 'ally_1', name: 'Ally' })

      const enemy1 = createEnemy({
        id: 'enemy_1',
        name: 'Goblin 1',
        statusEffects: [
          { type: EffectType.POISON, duration: 3, value: 10, definition: { name: 'Poison' } }
        ]
      })
      const enemy2 = createEnemy({
        id: 'enemy_2',
        name: 'Goblin 2',
        statusEffects: [
          { type: EffectType.POISON, duration: 2, value: 15, definition: { name: 'Poison' } },
          { type: EffectType.POISON, duration: 1, value: 5, definition: { name: 'Poison' } }
        ]
      })

      battleStore.heroes.push(grandma, ally)
      battleStore.enemies.push(enemy1, enemy2)
      battleStore.turnOrder.push({ type: 'hero', id: grandma.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      // Use The Great Composting (skill index 4)
      battleStore.selectAction('skill_4')

      // All poison should be removed from enemies
      expect(enemy1.statusEffects.filter(e => e.type === EffectType.POISON)).toHaveLength(0)
      expect(enemy2.statusEffects.filter(e => e.type === EffectType.POISON)).toHaveLength(0)
    })

    it('should preserve non-POISON effects on enemies', () => {
      const grandma = createGrandmotherRot()

      const enemy = createEnemy({
        id: 'enemy_1',
        statusEffects: [
          { type: EffectType.POISON, duration: 3, value: 10, definition: { name: 'Poison' } },
          { type: EffectType.ATK_DOWN, duration: 2, value: 20, definition: { name: 'ATK Down' } }
        ]
      })

      battleStore.heroes.push(grandma)
      battleStore.enemies.push(enemy)
      battleStore.turnOrder.push({ type: 'hero', id: grandma.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      battleStore.selectAction('skill_4')

      // Poison removed, ATK_DOWN preserved
      expect(enemy.statusEffects.filter(e => e.type === EffectType.POISON)).toHaveLength(0)
      expect(enemy.statusEffects.filter(e => e.type === EffectType.ATK_DOWN)).toHaveLength(1)
    })
  })

  describe('regen application', () => {
    it('should apply baseline REGEN to all allies when no poison consumed', () => {
      const grandma = createGrandmotherRot()
      const ally = createTestHero({ instanceId: 'ally_1', name: 'Ally' })

      const enemy = createEnemy({ id: 'enemy_1', statusEffects: [] }) // No poison

      battleStore.heroes.push(grandma, ally)
      battleStore.enemies.push(enemy)
      battleStore.turnOrder.push({ type: 'hero', id: grandma.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      battleStore.selectAction('skill_4')

      // Both heroes should have REGEN with baseline 5% ATK
      const grandmaRegen = grandma.statusEffects.find(e => e.type === EffectType.REGEN)
      const allyRegen = ally.statusEffects.find(e => e.type === EffectType.REGEN)

      expect(grandmaRegen).toBeDefined()
      expect(allyRegen).toBeDefined()
      expect(grandmaRegen.atkPercent).toBe(5)
      // Duration is 1 after end-of-turn processing (applied with 2, decremented at turn end)
      expect(grandmaRegen.duration).toBe(1)
    })

    it('should scale REGEN based on poison consumed (+2% per stack)', () => {
      const grandma = createGrandmotherRot()
      const ally = createTestHero({ instanceId: 'ally_1', name: 'Ally' })

      // 3 poison stacks total
      const enemy1 = createEnemy({
        id: 'enemy_1',
        statusEffects: [
          { type: EffectType.POISON, duration: 3, value: 10, definition: { name: 'Poison' } }
        ]
      })
      const enemy2 = createEnemy({
        id: 'enemy_2',
        statusEffects: [
          { type: EffectType.POISON, duration: 2, value: 15, definition: { name: 'Poison' } },
          { type: EffectType.POISON, duration: 1, value: 5, definition: { name: 'Poison' } }
        ]
      })

      battleStore.heroes.push(grandma, ally)
      battleStore.enemies.push(enemy1, enemy2)
      battleStore.turnOrder.push({ type: 'hero', id: grandma.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      battleStore.selectAction('skill_4')

      // 5% base + (3 stacks * 2%) = 11% ATK regen
      const grandmaRegen = grandma.statusEffects.find(e => e.type === EffectType.REGEN)
      expect(grandmaRegen).toBeDefined()
      expect(grandmaRegen.atkPercent).toBe(11)
    })

    it('should not apply REGEN to dead allies', () => {
      const grandma = createGrandmotherRot()
      const deadAlly = createTestHero({ instanceId: 'dead_ally', name: 'Dead Ally', currentHp: 0 })

      const enemy = createEnemy({ id: 'enemy_1', statusEffects: [] })

      battleStore.heroes.push(grandma, deadAlly)
      battleStore.enemies.push(enemy)
      battleStore.turnOrder.push({ type: 'hero', id: grandma.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      battleStore.selectAction('skill_4')

      // Grandma should have REGEN, dead ally should not
      expect(grandma.statusEffects.find(e => e.type === EffectType.REGEN)).toBeDefined()
      expect(deadAlly.statusEffects.find(e => e.type === EffectType.REGEN)).toBeUndefined()
    })
  })

  describe('integration with battle flow', () => {
    it('should cost 45 MP to use', () => {
      const grandma = createGrandmotherRot()
      grandma.currentMp = 50

      const enemy = createEnemy({ id: 'enemy_1' })

      battleStore.heroes.push(grandma)
      battleStore.enemies.push(enemy)
      battleStore.turnOrder.push({ type: 'hero', id: grandma.instanceId })
      battleStore.currentTurnIndex = 0
      battleStore.state = BattleState.PLAYER_TURN

      battleStore.selectAction('skill_4')

      // 50 - 45 = 5 MP remaining
      expect(grandma.currentMp).toBe(5)
    })
  })
})

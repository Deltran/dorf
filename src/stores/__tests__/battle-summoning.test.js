// src/stores/__tests__/battle-summoning.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - Enemy Summoning', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('MAX_ENEMIES constant', () => {
    it('is 6', () => {
      expect(store.MAX_ENEMIES).toBe(6)
    })
  })

  describe('summonEnemy', () => {
    beforeEach(async () => {
      // Set up a battle with a hero and one enemy so we have valid battle state
      const { useHeroesStore } = await import('../heroes')
      const heroesStore = useHeroesStore()
      const hero = heroesStore.addHero('farm_hand')
      heroesStore.setPartySlot(0, hero.instanceId)
      store.initBattle({}, ['goblin_scout'])
    })

    it('adds an enemy with correct template data', () => {
      const result = store.summonEnemy('goblin_warrior')
      expect(result).toBe(true)

      const summoned = store.enemies.find(e => e.templateId === 'goblin_warrior')
      expect(summoned).toBeDefined()
      expect(summoned.currentHp).toBe(summoned.template.stats.hp)
      expect(summoned.maxHp).toBe(summoned.template.stats.hp)
      expect(summoned.stats).toEqual(summoned.template.stats)
      expect(summoned.template.name).toBe('Goblin Warrior')
    })

    it('assigns unique IDs to summoned enemies', () => {
      store.summonEnemy('goblin_warrior')
      store.summonEnemy('goblin_thrower')

      const ids = store.enemies.map(e => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('IDs do not collide with existing enemies', () => {
      // initBattle created enemy_0 for goblin_scout
      store.summonEnemy('goblin_warrior')

      const ids = store.enemies.map(e => e.id)
      expect(ids).toContain('enemy_0') // original
      expect(ids).toContain('enemy_1') // summoned
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('sets isSummoned flag to true', () => {
      store.summonEnemy('goblin_warrior')

      const summoned = store.enemies.find(e => e.templateId === 'goblin_warrior')
      expect(summoned.isSummoned).toBe(true)
    })

    it('original enemies do not have isSummoned flag', () => {
      const original = store.enemies.find(e => e.templateId === 'goblin_scout')
      expect(original.isSummoned).toBeUndefined()
    })

    it('initializes cooldowns from template with single skill', () => {
      store.summonEnemy('goblin_scout') // goblin_scout has a single `skill`

      const summoned = store.enemies.filter(e => e.templateId === 'goblin_scout')
      // The summoned one is the second goblin_scout (first was from initBattle)
      const summonedEnemy = summoned.find(e => e.isSummoned)
      expect(summonedEnemy.currentCooldowns).toBeDefined()
      expect(summonedEnemy.currentCooldowns['Quick Stab']).toBe(0) // no initialCooldown
    })

    it('initializes cooldowns from template with multiple skills', () => {
      store.summonEnemy('goblin_commander') // goblin_commander has `skills` array

      const summoned = store.enemies.find(e => e.templateId === 'goblin_commander')
      expect(summoned.currentCooldowns).toBeDefined()
      expect(summoned.currentCooldowns['Rally Troops']).toBe(0)
      expect(summoned.currentCooldowns['Commanding Strike']).toBe(0)
    })

    it('initializes empty statusEffects array', () => {
      store.summonEnemy('goblin_warrior')

      const summoned = store.enemies.find(e => e.templateId === 'goblin_warrior')
      expect(summoned.statusEffects).toEqual([])
    })

    it('returns false when template is not found', () => {
      const result = store.summonEnemy('nonexistent_enemy')
      expect(result).toBe(false)

      // Enemy count should not change
      expect(store.enemies.length).toBe(1) // only the original goblin_scout
    })

    it('enforces MAX_ENEMIES cap (returns false when at 6 alive enemies)', () => {
      // We start with 1 enemy (goblin_scout). Add 5 more to reach 6.
      store.summonEnemy('goblin_warrior')
      store.summonEnemy('goblin_thrower')
      store.summonEnemy('goblin_scout')
      store.summonEnemy('goblin_warrior')
      store.summonEnemy('goblin_thrower')

      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)

      // 7th should be rejected
      const result = store.summonEnemy('goblin_scout')
      expect(result).toBe(false)
      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)
    })

    it('allows summoning if dead enemies bring count below cap', () => {
      // Start with 1, add 5 more to reach 6
      store.summonEnemy('goblin_warrior')
      store.summonEnemy('goblin_thrower')
      store.summonEnemy('goblin_scout')
      store.summonEnemy('goblin_warrior')
      store.summonEnemy('goblin_thrower')

      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)

      // Kill one enemy
      store.enemies[0].currentHp = 0

      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(5)

      // Now summoning should work
      const result = store.summonEnemy('goblin_scout')
      expect(result).toBe(true)
      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)
    })

    it('summoned enemy is NOT in current turn order', () => {
      // Turn order was calculated during initBattle. Summoning mid-round should
      // not add the new enemy to the current turn order.
      const turnOrderBefore = [...store.turnOrder]

      store.summonEnemy('goblin_warrior')

      // Turn order should be unchanged
      expect(store.turnOrder).toEqual(turnOrderBefore)
    })

    it('logs a summon message', () => {
      store.summonEnemy('goblin_warrior')

      const lastLog = store.battleLog[store.battleLog.length - 1]
      expect(lastLog.message).toContain('Goblin Warrior')
      expect(lastLog.message).toContain('summoned')
    })
  })

  describe('Summon skill execution in enemy turn', () => {
    // Helper: set up a minimal battle state for enemy turn testing
    function setupBattleForEnemyTurn(enemyOverrides = {}, extraEnemies = []) {
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

      const summoner = {
        id: 'enemy_0',
        templateId: 'test_summoner',
        template: {
          id: 'test_summoner',
          name: 'Test Summoner',
          skills: [
            {
              name: 'Brood Call',
              cooldown: 3,
              noDamage: true,
              summon: { templateId: 'goblin_scout', count: 1 },
              effects: [
                { type: 'def_up', target: 'self', duration: 2, value: 20 }
              ],
              fallbackSkill: {
                name: 'Protective Roost',
                noDamage: true,
                effects: [
                  { type: 'def_up', target: 'self', duration: 2, value: 20 }
                ]
              }
            }
          ]
        },
        stats: { hp: 300, atk: 80, def: 40, spd: 50 },
        currentHp: 300,
        maxHp: 300,
        statusEffects: [],
        currentCooldowns: { 'Brood Call': 0 },
        ...enemyOverrides
      }

      store.heroes.push(hero)
      store.enemies.push(summoner)
      for (const e of extraEnemies) {
        store.enemies.push(e)
      }
      // Set up turn order with enemy going first
      store.turnOrder.push({ type: 'enemy', id: summoner.id })
      store.turnOrder.push({ type: 'hero', id: hero.instanceId })
      store.currentTurnIndex = 0
      store.state = 'enemy_turn'

      return { hero, summoner }
    }

    function makeFillerEnemy(index) {
      return {
        id: `enemy_filler_${index}`,
        templateId: 'goblin_warrior',
        template: {
          id: 'goblin_warrior',
          name: 'Goblin Warrior',
          skills: []
        },
        stats: { hp: 70, atk: 18, def: 10, spd: 9 },
        currentHp: 70,
        maxHp: 70,
        statusEffects: [],
        currentCooldowns: {}
      }
    }

    it('summons an enemy when skill has summon property and room on field', async () => {
      const { summoner } = setupBattleForEnemyTurn()
      const enemyCountBefore = store.enemies.length

      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // Should have summoned a goblin_scout
      expect(store.enemies.length).toBe(enemyCountBefore + 1)
      const summoned = store.enemies.find(e => e.isSummoned && e.templateId === 'goblin_scout')
      expect(summoned).toBeDefined()
    })

    it('announces the summon skill via enemySkillActivation', async () => {
      const { summoner } = setupBattleForEnemyTurn()

      store.executeEnemyTurn(summoner)

      // enemySkillActivation should show the skill name
      expect(store.enemySkillActivation).toEqual({
        enemyId: summoner.id,
        skillName: 'Brood Call'
      })
    })

    it('applies self-targeted effects alongside summon', async () => {
      const { summoner } = setupBattleForEnemyTurn()

      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // Summoner should have DEF_UP from the skill's effects
      // Duration is 1 because processEndOfTurnEffects decrements it by 1 after application
      const defUp = summoner.statusEffects.find(e => e.type === 'def_up')
      expect(defUp).toBeDefined()
      expect(defUp.value).toBe(20)
      expect(defUp.duration).toBe(1)
    })

    it('sets cooldown on the summon skill after use', async () => {
      const { summoner } = setupBattleForEnemyTurn()

      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // cooldown should be set to skill.cooldown + 1 (matching existing pattern)
      expect(summoner.currentCooldowns['Brood Call']).toBe(4) // cooldown 3 + 1
    })

    it('executes fallbackSkill when field is full', async () => {
      // Fill the field to MAX_ENEMIES (6) by adding 5 filler enemies
      const fillers = []
      for (let i = 0; i < 5; i++) {
        fillers.push(makeFillerEnemy(i))
      }
      const { summoner } = setupBattleForEnemyTurn({}, fillers)

      // We now have 6 alive enemies (1 summoner + 5 fillers)
      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)

      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // No new enemy should be added
      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)

      // Fallback skill effects should be applied (DEF_UP on self)
      const defUp = summoner.statusEffects.find(e => e.type === 'def_up')
      expect(defUp).toBeDefined()
      expect(defUp.value).toBe(20)
    })

    it('sets cooldown on the ORIGINAL summon skill when fallback executes', async () => {
      const fillers = []
      for (let i = 0; i < 5; i++) {
        fillers.push(makeFillerEnemy(i))
      }
      const { summoner } = setupBattleForEnemyTurn({}, fillers)

      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // Cooldown should be set on 'Brood Call', not 'Protective Roost'
      expect(summoner.currentCooldowns['Brood Call']).toBe(4) // cooldown 3 + 1
    })

    it('passes turn without crash when field is full and no fallbackSkill', async () => {
      const fillers = []
      for (let i = 0; i < 5; i++) {
        fillers.push(makeFillerEnemy(i))
      }
      // Override skill to have no fallbackSkill
      const { summoner } = setupBattleForEnemyTurn({
        template: {
          id: 'test_summoner',
          name: 'Test Summoner',
          skills: [
            {
              name: 'Brood Call',
              cooldown: 3,
              noDamage: true,
              summon: { templateId: 'goblin_scout', count: 1 },
              effects: [],
              fallbackSkill: null
            }
          ]
        },
        currentCooldowns: { 'Brood Call': 0 }
      }, fillers)

      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)

      // Should not throw
      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // No new enemies
      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)

      // No status effects applied (no fallback)
      expect(summoner.statusEffects.length).toBe(0)

      // Cooldown should still be set so enemy doesn't waste consecutive turns
      expect(summoner.currentCooldowns['Brood Call']).toBe(4) // cooldown 3 + 1
    })

    it('summons multiple enemies when count > 1', async () => {
      const { summoner } = setupBattleForEnemyTurn({
        template: {
          id: 'test_summoner',
          name: 'Test Summoner',
          skills: [
            {
              name: 'Mass Summon',
              cooldown: 4,
              noDamage: true,
              summon: { templateId: 'goblin_scout', count: 2 },
              effects: []
            }
          ]
        },
        currentCooldowns: { 'Mass Summon': 0 }
      })

      const enemyCountBefore = store.enemies.length

      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // Should have summoned 2 goblin_scouts
      expect(store.enemies.length).toBe(enemyCountBefore + 2)
      const summoned = store.enemies.filter(e => e.isSummoned && e.templateId === 'goblin_scout')
      expect(summoned.length).toBe(2)
    })

    it('respects MAX_ENEMIES cap when summoning multiple (partial summon)', async () => {
      // Start with 5 enemies (summoner + 4 fillers) — room for only 1 more
      const fillers = []
      for (let i = 0; i < 4; i++) {
        fillers.push(makeFillerEnemy(i))
      }
      const { summoner } = setupBattleForEnemyTurn({
        template: {
          id: 'test_summoner',
          name: 'Test Summoner',
          skills: [
            {
              name: 'Mass Summon',
              cooldown: 4,
              noDamage: true,
              summon: { templateId: 'goblin_scout', count: 3 },
              effects: []
            }
          ]
        },
        currentCooldowns: { 'Mass Summon': 0 }
      }, fillers)

      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(5)

      store.executeEnemyTurn(summoner)
      await new Promise(r => setTimeout(r, 800))

      // Should have summoned only 1 (capped at 6)
      expect(store.enemies.filter(e => e.currentHp > 0).length).toBe(6)
    })
  })
})

// src/stores/__tests__/battle-summoning.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

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
})

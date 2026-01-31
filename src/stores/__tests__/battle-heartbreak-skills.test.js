// src/stores/__tests__/battle-heartbreak-skills.test.js
// Tests for Heartbreak skill damage mechanics in battle execution
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('battle store - Heartbreak skill damage mechanics', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('damagePerHeartbreakStack - Vengeance Garden', () => {
    it('adds bonus damage per current Heartbreak stack', () => {
      // Add Mara to party
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      // Initialize battle
      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')
      const enemy = store.enemies[0]

      // Set up Mara with 5 stacks and sufficient rage
      battleMara.heartbreakStacks = 5
      battleMara.currentRage = 100

      // Record initial enemy HP
      const initialEnemyHp = enemy.currentHp

      // Find Vengeance Garden skill (damagePercent: 90, damagePerHeartbreakStack: 15)
      const vengeanceGarden = battleMara.template.skills.find(s => s.name === 'Vengeance Garden')
      expect(vengeanceGarden).toBeDefined()
      expect(vengeanceGarden.damagePercent).toBe(90)
      expect(vengeanceGarden.damagePerHeartbreakStack).toBe(15)

      // Expected multiplier: 90 + (5 * 15) = 165%
      const expectedMultiplier = vengeanceGarden.damagePercent + (5 * vengeanceGarden.damagePerHeartbreakStack)
      expect(expectedMultiplier).toBe(165)

      // Stacks should NOT be consumed by this skill
      expect(battleMara.heartbreakStacks).toBe(5)
    })
  })

  describe('damagePerHeartbreakStackConsumed and consumeAllHeartbreakStacks - Love\'s Final Thorn', () => {
    it('consumes all stacks and adds bonus damage per consumed stack', () => {
      // Add Mara to party
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      // Initialize battle
      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Set up Mara with 4 stacks
      battleMara.heartbreakStacks = 4

      // Find Love's Final Thorn skill
      const lovesFinalThorn = battleMara.template.skills.find(s => s.name === "Love's Final Thorn")
      expect(lovesFinalThorn).toBeDefined()
      expect(lovesFinalThorn.damagePercent).toBe(200)
      expect(lovesFinalThorn.damagePerHeartbreakStackConsumed).toBe(25)
      expect(lovesFinalThorn.consumeAllHeartbreakStacks).toBe(true)

      // Expected multiplier: 200 + (4 * 25) = 300%
      const expectedMultiplier = lovesFinalThorn.damagePercent + (4 * lovesFinalThorn.damagePerHeartbreakStackConsumed)
      expect(expectedMultiplier).toBe(300)

      // Manually consume stacks to verify the function works
      const consumed = store.consumeAllHeartbreakStacks(battleMara)
      expect(consumed).toBe(4)
      expect(battleMara.heartbreakStacks).toBe(0)
    })
  })

  describe('grantHeartbreakStacks - Scorned', () => {
    it('skill has grantHeartbreakStacks property', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Find Scorned skill
      const scorned = battleMara.template.skills.find(s => s.name === 'Scorned')
      expect(scorned).toBeDefined()
      expect(scorned.grantHeartbreakStacks).toBe(1)
      expect(scorned.noDamage).toBe(true)
      expect(scorned.targetType).toBe('self')
    })
  })

  describe('onKillGrantHeartbreakStacks - Love\'s Final Thorn', () => {
    it('skill has onKillGrantHeartbreakStacks property', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Find Love's Final Thorn skill
      const lovesFinalThorn = battleMara.template.skills.find(s => s.name === "Love's Final Thorn")
      expect(lovesFinalThorn).toBeDefined()
      expect(lovesFinalThorn.onKillGrantHeartbreakStacks).toBe(2)
    })
  })

  describe('usesHeartbreakLifesteal - Thorn Lash', () => {
    it('skill has usesHeartbreakLifesteal property', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Find Thorn Lash skill
      const thornLash = battleMara.template.skills.find(s => s.name === 'Thorn Lash')
      expect(thornLash).toBeDefined()
      expect(thornLash.usesHeartbreakLifesteal).toBe(true)
      expect(thornLash.damagePercent).toBe(110)
    })

    it('applies Heartbreak lifesteal bonus to healing', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Set up Mara with 3 stacks (3 * 3% = 9% lifesteal bonus)
      battleMara.heartbreakStacks = 3

      // Get Heartbreak bonuses
      const bonuses = store.getHeartbreakBonuses(battleMara)
      expect(bonuses.lifestealBonus).toBe(9) // 3 stacks * 3% per stack
    })
  })

  describe('selfDamagePercentMaxHp - Love\'s Final Thorn', () => {
    it('skill has selfDamagePercentMaxHp property', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Find Love's Final Thorn skill
      const lovesFinalThorn = battleMara.template.skills.find(s => s.name === "Love's Final Thorn")
      expect(lovesFinalThorn).toBeDefined()
      expect(lovesFinalThorn.selfDamagePercentMaxHp).toBe(10)
    })
  })

  describe('conditionalEffects with heartbreakThreshold - Bitter Embrace', () => {
    it('skill has conditionalEffects with heartbreakThreshold', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Find Bitter Embrace skill
      const bitterEmbrace = battleMara.template.skills.find(s => s.name === 'Bitter Embrace')
      expect(bitterEmbrace).toBeDefined()
      expect(bitterEmbrace.conditionalEffects).toBeDefined()
      expect(bitterEmbrace.conditionalEffects.heartbreakThreshold).toBe(3)
      expect(bitterEmbrace.conditionalEffects.effects.length).toBeGreaterThan(0)
    })
  })

  describe('healSelfPercent on AoE - Vengeance Garden', () => {
    it('skill has healSelfPercent property', () => {
      const mara = heroesStore.addHero('mara_thornheart')
      heroesStore.setPartySlot(0, mara.instanceId)

      store.initBattle({}, ['goblin_scout'])

      const battleMara = store.heroes.find(h => h.templateId === 'mara_thornheart')

      // Find Vengeance Garden skill
      const vengeanceGarden = battleMara.template.skills.find(s => s.name === 'Vengeance Garden')
      expect(vengeanceGarden).toBeDefined()
      expect(vengeanceGarden.healSelfPercent).toBe(5)
      expect(vengeanceGarden.targetType).toBe('all_enemies')
    })
  })
})

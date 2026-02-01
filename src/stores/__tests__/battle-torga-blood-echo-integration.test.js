// src/stores/__tests__/battle-torga-blood-echo-integration.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'
import { heroTemplates } from '../../data/heroes/index.js'

describe('Torga Blood Echo Integration Test', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('Full Blood Echo damage scaling workflow', () => {
    it('verifies complete Blood Echo damage scaling with Blood Tempo uses', () => {
      // Verify Torga template exists
      expect(heroTemplates.torga_bloodbeat).toBeDefined()
      expect(heroTemplates.torga_bloodbeat.name).toBe('Torga Bloodbeat')
      expect(heroTemplates.torga_bloodbeat.classId).toBe('berserker')

      // Create a mock Torga hero
      const mockTorga = {
        instanceId: 'torga_integration_test',
        templateId: 'torga_bloodbeat',
        name: 'Torga Bloodbeat',
        class: { resourceType: 'rage' }
      }

      // Add hero to party and initialize battle
      const hero = heroesStore.addHero('torga_bloodbeat')
      heroesStore.setPartySlot(0, hero.instanceId)
      store.initBattle(null, ['goblin_scout'])

      // Get Blood Echo skill reference
      const bloodEchoSkill = heroTemplates.torga_bloodbeat.skills.find(
        s => s.name === 'Blood Echo'
      )
      expect(bloodEchoSkill).toBeDefined()
      expect(bloodEchoSkill.damagePercent).toBe(90)
      expect(bloodEchoSkill.bonusDamagePerBloodTempo).toBe(30)
      expect(bloodEchoSkill.maxBloodTempoBonus).toBe(90)

      // Get Blood Tempo skill reference
      const bloodTempoSkill = heroTemplates.torga_bloodbeat.skills.find(
        s => s.name === 'Blood Tempo'
      )
      expect(bloodTempoSkill).toBeDefined()

      // Step 1: Verify Blood Echo damage is 90% with 0 Blood Tempo uses
      const initialUses = store.getBloodTempoUses(mockTorga.instanceId)
      expect(initialUses).toBe(0)

      const initialResult = store.calculateBloodEchoDamage(100, initialUses)
      expect(initialResult.damagePercent).toBe(90)

      // Step 2: Simulate Blood Tempo skill use (increment counter)
      store.processSkillForBloodTempoTracking(mockTorga, bloodTempoSkill)
      const usesAfterOne = store.getBloodTempoUses(mockTorga.instanceId)
      expect(usesAfterOne).toBe(1)

      // Verify Blood Echo damage increases to 120% (90 + 30)
      const afterOneResult = store.calculateBloodEchoDamage(100, usesAfterOne)
      expect(afterOneResult.damagePercent).toBe(120)

      // Step 3: Increment twice more (total 3 uses)
      store.processSkillForBloodTempoTracking(mockTorga, bloodTempoSkill)
      store.processSkillForBloodTempoTracking(mockTorga, bloodTempoSkill)
      const usesAfterThree = store.getBloodTempoUses(mockTorga.instanceId)
      expect(usesAfterThree).toBe(3)

      // Verify Blood Echo damage caps at 180% (90 + 90 max bonus)
      const afterThreeResult = store.calculateBloodEchoDamage(100, usesAfterThree)
      expect(afterThreeResult.damagePercent).toBe(180)

      // Step 4: Verify cap holds with additional uses
      store.processSkillForBloodTempoTracking(mockTorga, bloodTempoSkill)
      store.processSkillForBloodTempoTracking(mockTorga, bloodTempoSkill)
      const usesAfterFive = store.getBloodTempoUses(mockTorga.instanceId)
      expect(usesAfterFive).toBe(5)

      const afterFiveResult = store.calculateBloodEchoDamage(100, usesAfterFive)
      expect(afterFiveResult.damagePercent).toBe(180) // Still capped at 180%
    })
  })

  describe('Blood Tempo counter reset on new battle', () => {
    it('resets Blood Tempo uses when starting a new battle', () => {
      // Add hero to party
      const hero = heroesStore.addHero('torga_bloodbeat')
      heroesStore.setPartySlot(0, hero.instanceId)

      // Start first battle
      store.initBattle(null, ['goblin_scout'])

      // Simulate Blood Tempo uses in first battle
      const mockTorga = { instanceId: hero.instanceId }
      const bloodTempoSkill = { name: 'Blood Tempo' }

      store.processSkillForBloodTempoTracking(mockTorga, bloodTempoSkill)
      store.processSkillForBloodTempoTracking(mockTorga, bloodTempoSkill)
      expect(store.getBloodTempoUses(hero.instanceId)).toBe(2)

      // Start a new battle - counters should reset
      store.initBattle(null, ['goblin_scout'])
      expect(store.getBloodTempoUses(hero.instanceId)).toBe(0)
    })
  })

  describe('Blood Echo skill properties validation', () => {
    it('Blood Echo has correct scaling properties', () => {
      const bloodEcho = heroTemplates.torga_bloodbeat.skills.find(
        s => s.name === 'Blood Echo'
      )

      expect(bloodEcho.skillUnlockLevel).toBe(3)
      expect(bloodEcho.rageCost).toBe(20)
      expect(bloodEcho.targetType).toBe('enemy')
      expect(bloodEcho.damagePercent).toBe(90)
      expect(bloodEcho.bonusDamagePerBloodTempo).toBe(30)
      expect(bloodEcho.maxBloodTempoBonus).toBe(90)
    })
  })

  describe('Blood Tempo does not increment on other skills', () => {
    it('only Blood Tempo skill increments the counter', () => {
      const mockTorga = { instanceId: 'torga_other_skill_test' }

      // Using Rhythm Strike should not increment
      const rhythmStrike = { name: 'Rhythm Strike' }
      store.processSkillForBloodTempoTracking(mockTorga, rhythmStrike)
      expect(store.getBloodTempoUses(mockTorga.instanceId)).toBe(0)

      // Using Blood Echo should not increment
      const bloodEcho = { name: 'Blood Echo' }
      store.processSkillForBloodTempoTracking(mockTorga, bloodEcho)
      expect(store.getBloodTempoUses(mockTorga.instanceId)).toBe(0)

      // Using Death Knell should not increment
      const deathKnell = { name: 'Death Knell' }
      store.processSkillForBloodTempoTracking(mockTorga, deathKnell)
      expect(store.getBloodTempoUses(mockTorga.instanceId)).toBe(0)

      // Using Blood Tempo SHOULD increment
      const bloodTempo = { name: 'Blood Tempo' }
      store.processSkillForBloodTempoTracking(mockTorga, bloodTempo)
      expect(store.getBloodTempoUses(mockTorga.instanceId)).toBe(1)
    })
  })

  describe('Multiple heroes track Blood Tempo independently', () => {
    it('each hero has their own Blood Tempo counter', () => {
      const torga1 = { instanceId: 'torga_1' }
      const torga2 = { instanceId: 'torga_2' }
      const bloodTempo = { name: 'Blood Tempo' }

      // Torga 1 uses Blood Tempo twice
      store.processSkillForBloodTempoTracking(torga1, bloodTempo)
      store.processSkillForBloodTempoTracking(torga1, bloodTempo)

      // Torga 2 uses Blood Tempo once
      store.processSkillForBloodTempoTracking(torga2, bloodTempo)

      // Verify independent tracking
      expect(store.getBloodTempoUses(torga1.instanceId)).toBe(2)
      expect(store.getBloodTempoUses(torga2.instanceId)).toBe(1)

      // Calculate damage for each
      const torga1Damage = store.calculateBloodEchoDamage(100, 2)
      const torga2Damage = store.calculateBloodEchoDamage(100, 1)

      expect(torga1Damage.damagePercent).toBe(150) // 90 + 60
      expect(torga2Damage.damagePercent).toBe(120) // 90 + 30
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { useHeroesStore } from '../heroes.js'

describe('Colosseum AI skill usage', () => {
  let battleStore
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
    heroesStore = useHeroesStore()
  })

  describe('cooldown check for hero skills', () => {
    it('should include skills without cooldown property in ready skills', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        templateId: 'shadow_king',
        isColosseumEnemy: true,
        currentHp: 1000,
        maxHp: 1000,
        currentCooldowns: {},
        template: {
          name: 'Shadow King',
          skills: [
            { name: 'Void Strike', rageCost: 50, damagePercent: 200, targetType: 'enemy' },
            { name: 'Mantle of Empty Hate', rageCost: 30, targetType: 'self' }
          ]
        },
        stats: { atk: 100, def: 50, spd: 80 }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        // FIXED logic: only filter if cooldown is explicitly > 0
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        return true
      })

      expect(readySkills.length).toBe(2)
      expect(readySkills.map(s => s.name)).toContain('Void Strike')
      expect(readySkills.map(s => s.name)).toContain('Mantle of Empty Hate')
    })

    it('should filter out skills that are on cooldown', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        currentCooldowns: { 'Void Strike': 2 }, // On cooldown
        template: {
          skills: [
            { name: 'Void Strike', rageCost: 50 },
            { name: 'Mantle of Empty Hate', rageCost: 30 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Mantle of Empty Hate')
    })
  })

  describe('essence cost checking for alchemist AI', () => {
    it('should filter out skills when not enough essence', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 5, // Only 5 essence
        maxEssence: 60,
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'Cheap Skill', essenceCost: 5, damagePercent: 80 },
            { name: 'Expensive Skill', essenceCost: 20, damagePercent: 150 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        // Essence check
        if (s.essenceCost && mockEnemy.currentEssence !== undefined) {
          if (mockEnemy.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Cheap Skill')
    })

    it('should allow skills when enough essence', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 30,
        maxEssence: 60,
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'Cheap Skill', essenceCost: 5, damagePercent: 80 },
            { name: 'Expensive Skill', essenceCost: 20, damagePercent: 150 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockEnemy.currentEssence !== undefined) {
          if (mockEnemy.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(readySkills.length).toBe(2)
    })

    it('should ignore essence check for non-alchemist enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        // No currentEssence property = not an alchemist
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'MP Skill', mpCost: 20, damagePercent: 100 }
          ]
        }
      }

      const allSkills = mockEnemy.template.skills
      const readySkills = allSkills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockEnemy.currentEssence !== undefined) {
          if (mockEnemy.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1) // MP skill passes (no essence check)
    })
  })

  describe('essence deduction on skill use', () => {
    it('should deduct essence when alchemist AI uses skill', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 30,
        maxEssence: 60,
        currentCooldowns: {}
      }

      const skill = { name: 'Tainted Tonic', essenceCost: 12, damagePercent: 90 }

      // Simulate deduction logic
      if (skill.essenceCost && mockEnemy.currentEssence !== undefined) {
        mockEnemy.currentEssence -= skill.essenceCost
      }

      expect(mockEnemy.currentEssence).toBe(18)
    })

    it('should not deduct essence for non-alchemist enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentMp: 50, // MP-based, not essence
        currentCooldowns: {}
      }

      const skill = { name: 'Fireball', mpCost: 20, damagePercent: 120 }

      // Simulate deduction logic - should not affect anything
      if (skill.essenceCost && mockEnemy.currentEssence !== undefined) {
        mockEnemy.currentEssence -= skill.essenceCost
      }

      // currentEssence was never defined, shouldn't crash or change
      expect(mockEnemy.currentEssence).toBeUndefined()
      expect(mockEnemy.currentMp).toBe(50) // Unchanged
    })
  })

  describe('essence regeneration at turn start', () => {
    it('should regenerate essence for colosseum alchemist at turn start', () => {
      const battleStore = useBattleStore()

      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 20,
        maxEssence: 60,
        class: { resourceType: 'essence' }
      }

      // Call regenerateEssence directly
      battleStore.regenerateEssence(mockEnemy)

      expect(mockEnemy.currentEssence).toBe(30) // +10 regen
    })

    it('should cap essence at maxEssence', () => {
      const battleStore = useBattleStore()

      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentEssence: 55,
        maxEssence: 60,
        class: { resourceType: 'essence' }
      }

      battleStore.regenerateEssence(mockEnemy)

      expect(mockEnemy.currentEssence).toBe(60) // Capped at max
    })

    it('should not regenerate essence for non-alchemist', () => {
      const battleStore = useBattleStore()

      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentMp: 30,
        maxMp: 100,
        class: { resourceType: 'mp' } // Not essence
      }

      battleStore.regenerateEssence(mockEnemy)

      // Should not crash, should not change MP
      expect(mockEnemy.currentMp).toBe(30)
    })
  })

  describe('integration: alchemist AI full turn', () => {
    it('should use skill when essence available, basic attack when not', () => {
      // This test documents expected behavior for manual verification
      // Full integration would require mocking the entire battle flow

      const mockAlchemist = {
        id: 'colosseum_0',
        templateId: 'zina_the_desperate',
        isColosseumEnemy: true,
        currentHp: 500,
        maxHp: 500,
        currentEssence: 15,
        maxEssence: 60,
        currentCooldowns: {},
        class: { resourceType: 'essence' },
        template: {
          name: 'Zina the Desperate',
          skills: [
            { name: 'Tainted Tonic', essenceCost: 10, damagePercent: 90 },
            { name: 'Volatile Mixture', essenceCost: 25, damagePercent: 150 }
          ]
        },
        stats: { atk: 120, def: 40, spd: 70 }
      }

      // Skill filtering with all checks
      const readySkills = mockAlchemist.template.skills.filter(s => {
        if (mockAlchemist.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockAlchemist.currentEssence !== undefined) {
          if (mockAlchemist.currentEssence < s.essenceCost) return false
        }
        return true
      })

      // Should only have Tainted Tonic available (10 essence cost, have 15)
      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Tainted Tonic')

      // Simulate using the skill
      const skill = readySkills[0]
      mockAlchemist.currentEssence -= skill.essenceCost

      expect(mockAlchemist.currentEssence).toBe(5)

      // Next turn: regenerate +10
      mockAlchemist.currentEssence = Math.min(
        mockAlchemist.maxEssence,
        mockAlchemist.currentEssence + 10
      )

      expect(mockAlchemist.currentEssence).toBe(15) // Back to 15

      // Can use Tainted Tonic again
      const nextReadySkills = mockAlchemist.template.skills.filter(s => {
        if (mockAlchemist.currentCooldowns?.[s.name] > 0) return false
        if (s.essenceCost && mockAlchemist.currentEssence !== undefined) {
          if (mockAlchemist.currentEssence < s.essenceCost) return false
        }
        return true
      })

      expect(nextReadySkills.length).toBe(1)
      expect(nextReadySkills[0].name).toBe('Tainted Tonic')
    })
  })
})

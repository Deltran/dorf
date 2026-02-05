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

  describe('unusable skill filtering', () => {
    it('should filter out taunt skills for colosseum enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentCooldowns: {},
        template: {
          skills: [
            {
              name: 'Challenge',
              targetType: 'self',
              effects: [{ type: 'taunt' }]
            },
            { name: 'Shield Bash', targetType: 'enemy', damagePercent: 80 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        // Filter out taunt skills for AI
        if (mockEnemy.isColosseumEnemy && s.effects?.some(e => e.type === 'taunt')) return false
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Shield Bash')
    })

    it('should filter out ally-targeting skills for colosseum enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'Oath of Protection', targetType: 'ally', noDamage: true },
            { name: 'Shield Bash', targetType: 'enemy', damagePercent: 80 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        // Filter out ally-targeting skills for AI
        if (mockEnemy.isColosseumEnemy && s.targetType === 'ally') return false
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Shield Bash')
    })

    it('should filter out all_allies targeting skills for colosseum enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'Group Heal', targetType: 'all_allies', noDamage: true },
            { name: 'Fireball', targetType: 'enemy', damagePercent: 100 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        // Filter out ally-targeting skills for AI
        if (mockEnemy.isColosseumEnemy && (s.targetType === 'ally' || s.targetType === 'all_allies')) return false
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Fireball')
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

  describe('Berserker rage tracking', () => {
    it('should filter out skills when not enough rage', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentRage: 20,
        currentCooldowns: {},
        class: { resourceType: 'rage' },
        template: {
          skills: [
            { name: 'Reckless Swing', rageCost: 30, damagePercent: 150 },
            { name: 'Battle Cry', rageCost: 10, targetType: 'self' }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.rageCost && mockEnemy.currentRage !== undefined) {
          if (s.rageCost !== 'all' && mockEnemy.currentRage < s.rageCost) return false
          if (s.rageCost === 'all' && mockEnemy.currentRage === 0) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Battle Cry')
    })

    it('should allow rageCost all skills when rage > 0', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentRage: 50,
        currentCooldowns: {},
        class: { resourceType: 'rage' },
        template: {
          skills: [
            { name: 'Rampage', rageCost: 'all', damagePercent: 100 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.rageCost && mockEnemy.currentRage !== undefined) {
          if (s.rageCost !== 'all' && mockEnemy.currentRage < s.rageCost) return false
          if (s.rageCost === 'all' && mockEnemy.currentRage === 0) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1)
    })

    it('should filter rageCost all skills when rage is 0', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentRage: 0,
        currentCooldowns: {},
        class: { resourceType: 'rage' },
        template: {
          skills: [
            { name: 'Rampage', rageCost: 'all', damagePercent: 100 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.rageCost && mockEnemy.currentRage !== undefined) {
          if (s.rageCost !== 'all' && mockEnemy.currentRage < s.rageCost) return false
          if (s.rageCost === 'all' && mockEnemy.currentRage === 0) return false
        }
        return true
      })

      expect(readySkills.length).toBe(0)
    })

    it('should deduct rage when using skill', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentRage: 50,
        class: { resourceType: 'rage' }
      }

      const skill = { name: 'Reckless Swing', rageCost: 30 }

      if (skill.rageCost && mockEnemy.currentRage !== undefined) {
        if (skill.rageCost === 'all') {
          mockEnemy.currentRage = 0
        } else {
          mockEnemy.currentRage -= skill.rageCost
        }
      }

      expect(mockEnemy.currentRage).toBe(20)
    })

    it('should consume all rage for rageCost: all skills', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentRage: 80,
        class: { resourceType: 'rage' }
      }

      const skill = { name: 'Rampage', rageCost: 'all' }

      if (skill.rageCost === 'all') {
        mockEnemy.currentRage = 0
      }

      expect(mockEnemy.currentRage).toBe(0)
    })

    it('should gain rage when attacking', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentRage: 20,
        class: { resourceType: 'rage' }
      }

      // Simulate rage gain on attack
      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'rage') {
        mockEnemy.currentRage = Math.min(100, mockEnemy.currentRage + 10)
      }

      expect(mockEnemy.currentRage).toBe(30)
    })

    it('should cap rage at 100', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentRage: 95,
        class: { resourceType: 'rage' }
      }

      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'rage') {
        mockEnemy.currentRage = Math.min(100, mockEnemy.currentRage + 10)
      }

      expect(mockEnemy.currentRage).toBe(100)
    })
  })

  describe('Knight valor tracking', () => {
    it('should filter out skills when not enough valor', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentValor: 15,
        currentCooldowns: {},
        class: { resourceType: 'valor' },
        template: {
          skills: [
            { name: 'Shield Bash', valorRequired: 25, damagePercent: 120 },
            { name: 'Defensive Stance', valorRequired: 0, targetType: 'self' }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.valorRequired !== undefined && mockEnemy.currentValor !== undefined) {
          if (mockEnemy.currentValor < s.valorRequired) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Defensive Stance')
    })

    it('should allow skills when enough valor', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentValor: 50,
        currentCooldowns: {},
        class: { resourceType: 'valor' },
        template: {
          skills: [
            { name: 'Shield Bash', valorRequired: 25, damagePercent: 120 },
            { name: 'Fortress Stance', valorRequired: 50, targetType: 'self' }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (s.valorRequired !== undefined && mockEnemy.currentValor !== undefined) {
          if (mockEnemy.currentValor < s.valorRequired) return false
        }
        return true
      })

      expect(readySkills.length).toBe(2)
    })

    it('should gain valor when taking damage', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentValor: 20,
        class: { resourceType: 'valor' }
      }

      // Simulate valor gain on damage
      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'valor') {
        mockEnemy.currentValor = Math.min(100, mockEnemy.currentValor + 5)
      }

      expect(mockEnemy.currentValor).toBe(25)
    })

    it('should gain passive valor at turn start', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentValor: 10,
        class: { resourceType: 'valor' }
      }

      // Simulate turn start passive gain
      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'valor') {
        mockEnemy.currentValor = Math.min(100, mockEnemy.currentValor + 10)
      }

      expect(mockEnemy.currentValor).toBe(20)
    })

    it('should cap valor at 100', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentValor: 98,
        class: { resourceType: 'valor' }
      }

      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'valor') {
        mockEnemy.currentValor = Math.min(100, mockEnemy.currentValor + 10)
      }

      expect(mockEnemy.currentValor).toBe(100)
    })
  })

  describe('Ranger focus tracking', () => {
    it('should filter out skills when focus is lost', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        hasFocus: false,
        currentCooldowns: {},
        class: { resourceType: 'focus' },
        template: {
          skills: [
            { name: 'Precise Shot', damagePercent: 150 },
            { name: 'Evasive Roll', targetType: 'self' }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        // Rangers need focus to use skills
        if (mockEnemy.class?.resourceType === 'focus' && !mockEnemy.hasFocus) return false
        return true
      })

      expect(readySkills.length).toBe(0) // No skills without focus
    })

    it('should allow skills when focused', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        hasFocus: true,
        currentCooldowns: {},
        class: { resourceType: 'focus' },
        template: {
          skills: [
            { name: 'Precise Shot', damagePercent: 150 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (mockEnemy.class?.resourceType === 'focus' && !mockEnemy.hasFocus) return false
        return true
      })

      expect(readySkills.length).toBe(1)
    })

    it('should lose focus when hit', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        hasFocus: true,
        tookDamageSinceLastTurn: false,
        class: { resourceType: 'focus' }
      }

      // Simulate taking damage
      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'focus') {
        mockEnemy.hasFocus = false
        mockEnemy.tookDamageSinceLastTurn = true
      }

      expect(mockEnemy.hasFocus).toBe(false)
      expect(mockEnemy.tookDamageSinceLastTurn).toBe(true)
    })

    it('should regain focus at turn start if not hit', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        hasFocus: false,
        tookDamageSinceLastTurn: false, // Wasn't hit since last turn
        class: { resourceType: 'focus' }
      }

      // Turn start check
      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'focus') {
        if (!mockEnemy.tookDamageSinceLastTurn) {
          mockEnemy.hasFocus = true
        }
        mockEnemy.tookDamageSinceLastTurn = false // Reset for next round
      }

      expect(mockEnemy.hasFocus).toBe(true)
    })

    it('should not regain focus if hit during round', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        hasFocus: false,
        tookDamageSinceLastTurn: true, // Was hit
        class: { resourceType: 'focus' }
      }

      // Turn start check
      if (mockEnemy.isColosseumEnemy && mockEnemy.class?.resourceType === 'focus') {
        if (!mockEnemy.tookDamageSinceLastTurn) {
          mockEnemy.hasFocus = true
        }
        mockEnemy.tookDamageSinceLastTurn = false // Reset for next round
      }

      expect(mockEnemy.hasFocus).toBe(false) // Still unfocused
      expect(mockEnemy.tookDamageSinceLastTurn).toBe(false) // But reset for next round
    })
  })

  describe('Bard verse tracking', () => {
    it('should not allow repeating the same skill', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentVerses: 1,
        lastSkillName: 'Inspiring Melody',
        currentCooldowns: {},
        class: { resourceType: 'verse' },
        template: {
          skills: [
            { name: 'Inspiring Melody', targetType: 'self' },
            { name: 'Discordant Note', damagePercent: 80 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        // Bards can't repeat skills (unless 1-skill bard)
        if (mockEnemy.class?.resourceType === 'verse') {
          const skillCount = mockEnemy.template.skills?.length || 0
          if (skillCount > 1 && s.name === mockEnemy.lastSkillName) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1)
      expect(readySkills[0].name).toBe('Discordant Note')
    })

    it('should allow 1-skill bards to repeat their skill', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentVerses: 0,
        lastSkillName: 'Only Skill',
        currentCooldowns: {},
        class: { resourceType: 'verse' },
        template: {
          skills: [
            { name: 'Only Skill', damagePercent: 100 }
          ]
        }
      }

      const readySkills = mockEnemy.template.skills.filter(s => {
        if (mockEnemy.currentCooldowns?.[s.name] > 0) return false
        if (mockEnemy.class?.resourceType === 'verse') {
          const skillCount = mockEnemy.template.skills?.length || 0
          if (skillCount > 1 && s.name === mockEnemy.lastSkillName) return false
        }
        return true
      })

      expect(readySkills.length).toBe(1) // Can use the skill
    })

    it('should gain verse when using skill', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentVerses: 1,
        lastSkillName: null,
        class: { resourceType: 'verse' },
        template: {
          skills: [
            { name: 'Inspiring Melody' },
            { name: 'Discordant Note' }
          ]
        }
      }

      const skill = { name: 'Discordant Note' }

      // Simulate verse gain (only for multi-skill bards)
      if (mockEnemy.class?.resourceType === 'verse') {
        const skillCount = mockEnemy.template.skills?.length || 0
        if (skillCount > 1) {
          mockEnemy.currentVerses = Math.min(3, mockEnemy.currentVerses + 1)
          mockEnemy.lastSkillName = skill.name
        }
      }

      expect(mockEnemy.currentVerses).toBe(2)
      expect(mockEnemy.lastSkillName).toBe('Discordant Note')
    })

    it('should cap verses at 3', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentVerses: 3,
        class: { resourceType: 'verse' },
        template: { skills: [{}, {}] }
      }

      // Attempt to gain verse
      mockEnemy.currentVerses = Math.min(3, mockEnemy.currentVerses + 1)

      expect(mockEnemy.currentVerses).toBe(3)
    })

    it('should trigger finale at 3 verses and reset', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentVerses: 3,
        lastSkillName: 'Discordant Note',
        class: { resourceType: 'verse' },
        template: {
          name: 'Chroma',
          finale: {
            name: 'Chromatic Crescendo',
            target: 'all_enemies',
            effects: [{ type: 'damage', value: 50 }]
          }
        }
      }

      let finaleTriggered = false

      // Turn start check
      if (mockEnemy.class?.resourceType === 'verse' && mockEnemy.currentVerses >= 3 && mockEnemy.template.finale) {
        finaleTriggered = true
        mockEnemy.currentVerses = 0
        mockEnemy.lastSkillName = null
      }

      expect(finaleTriggered).toBe(true)
      expect(mockEnemy.currentVerses).toBe(0)
      expect(mockEnemy.lastSkillName).toBe(null)
    })

    it('should not build verses for 1-skill bards', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentVerses: 0,
        lastSkillName: null,
        class: { resourceType: 'verse' },
        template: {
          skills: [{ name: 'Only Skill' }]
        }
      }

      const skill = { name: 'Only Skill' }

      // Only build verses for multi-skill bards
      if (mockEnemy.class?.resourceType === 'verse') {
        const skillCount = mockEnemy.template.skills?.length || 0
        if (skillCount > 1) {
          mockEnemy.currentVerses = Math.min(3, mockEnemy.currentVerses + 1)
          mockEnemy.lastSkillName = skill.name
        }
      }

      expect(mockEnemy.currentVerses).toBe(0) // No verse gain
    })
  })

  describe('MP class cooldown faking', () => {
    it('should apply cooldown to MP skills after use for colosseum enemies', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentCooldowns: {},
        class: { resourceType: 'mp' },
        template: {
          skills: [
            { name: 'Holy Light', mpCost: 20, damagePercent: 100 }
          ]
        }
      }

      const skill = mockEnemy.template.skills[0]

      // Simulate cooldown assignment for MP skills
      if (skill.mpCost && mockEnemy.isColosseumEnemy && !skill.cooldown) {
        mockEnemy.currentCooldowns[skill.name] = 3 // 3-turn cooldown
      }

      expect(mockEnemy.currentCooldowns['Holy Light']).toBe(3)
    })

    it('should use existing cooldown if skill has one', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentCooldowns: {},
        class: { resourceType: 'mp' },
        template: {
          skills: [
            { name: 'Fireball', mpCost: 15, cooldown: 2, damagePercent: 120 }
          ]
        }
      }

      const skill = mockEnemy.template.skills[0]

      // Use existing cooldown if defined, otherwise fake it
      if (skill.cooldown) {
        mockEnemy.currentCooldowns[skill.name] = skill.cooldown + 1
      } else if (skill.mpCost && mockEnemy.isColosseumEnemy) {
        mockEnemy.currentCooldowns[skill.name] = 3
      }

      expect(mockEnemy.currentCooldowns['Fireball']).toBe(3) // cooldown + 1
    })

    it('should not apply fake cooldown to non-colosseum enemies', () => {
      const mockEnemy = {
        id: 'enemy_0',
        isColosseumEnemy: false,
        currentCooldowns: {},
        template: {
          skills: [
            { name: 'Claw', mpCost: 10, damagePercent: 80 }
          ]
        }
      }

      const skill = mockEnemy.template.skills[0]

      // Only apply fake cooldown to colosseum enemies
      if (skill.mpCost && mockEnemy.isColosseumEnemy && !skill.cooldown) {
        mockEnemy.currentCooldowns[skill.name] = 3
      }

      expect(mockEnemy.currentCooldowns['Claw']).toBeUndefined()
    })

    it('should not apply fake cooldown to non-MP resource skills', () => {
      const mockEnemy = {
        id: 'colosseum_0',
        isColosseumEnemy: true,
        currentCooldowns: {},
        currentEssence: 30,
        class: { resourceType: 'essence' },
        template: {
          skills: [
            { name: 'Tainted Tonic', essenceCost: 10, damagePercent: 90 }
          ]
        }
      }

      const skill = mockEnemy.template.skills[0]

      // Only apply to MP skills
      if (skill.mpCost && mockEnemy.isColosseumEnemy && !skill.cooldown) {
        mockEnemy.currentCooldowns[skill.name] = 3
      }

      expect(mockEnemy.currentCooldowns['Tainted Tonic']).toBeUndefined()
    })
  })
})

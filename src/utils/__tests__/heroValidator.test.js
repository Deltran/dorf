import { describe, it, expect } from 'vitest'
import {
  validateHero,
  validateSkill,
  validateEffect,
  validateLeaderSkill,
  validateFinale,
  DROPDOWN_OPTIONS
} from '../heroValidator.js'
import { EffectType } from '../../data/statusEffects.js'

describe('heroValidator', () => {
  describe('DROPDOWN_OPTIONS', () => {
    it('exports rarities 1-5', () => {
      expect(DROPDOWN_OPTIONS.rarities).toEqual([1, 2, 3, 4, 5])
    })

    it('exports classIds from classes.js', () => {
      expect(DROPDOWN_OPTIONS.classIds).toContain('paladin')
      expect(DROPDOWN_OPTIONS.classIds).toContain('knight')
      expect(DROPDOWN_OPTIONS.classIds).toContain('mage')
      expect(DROPDOWN_OPTIONS.classIds).toContain('berserker')
      expect(DROPDOWN_OPTIONS.classIds).toContain('ranger')
      expect(DROPDOWN_OPTIONS.classIds).toContain('cleric')
      expect(DROPDOWN_OPTIONS.classIds).toContain('druid')
      expect(DROPDOWN_OPTIONS.classIds).toContain('bard')
      expect(DROPDOWN_OPTIONS.classIds).toContain('alchemist')
      expect(DROPDOWN_OPTIONS.classIds.length).toBe(9)
    })

    it('exports targetTypes for skills', () => {
      expect(DROPDOWN_OPTIONS.targetTypes).toEqual([
        'enemy', 'ally', 'self', 'all_enemies', 'all_allies', 'random_enemies'
      ])
    })

    it('exports effectTargets for effects', () => {
      expect(DROPDOWN_OPTIONS.effectTargets).toEqual([
        'enemy', 'ally', 'self', 'all_enemies', 'all_allies'
      ])
    })

    it('exports skillUnlockLevels', () => {
      expect(DROPDOWN_OPTIONS.skillUnlockLevels).toEqual([1, 3, 6, 12])
    })

    it('exports effectTypes from statusEffects.js', () => {
      expect(DROPDOWN_OPTIONS.effectTypes).toContain(EffectType.ATK_UP)
      expect(DROPDOWN_OPTIONS.effectTypes).toContain(EffectType.STUN)
      expect(DROPDOWN_OPTIONS.effectTypes).toContain(EffectType.SHIELD)
      expect(DROPDOWN_OPTIONS.effectTypes).toContain(EffectType.GUARDIAN_LINK)
      expect(DROPDOWN_OPTIONS.effectTypes.length).toBeGreaterThan(10)
    })
  })

  describe('validateHero', () => {
    const validHero = {
      id: 'test_hero',
      name: 'Test Hero',
      rarity: 3,
      classId: 'knight',
      baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
      skills: [
        {
          name: 'Basic Attack',
          description: 'A simple attack',
          skillUnlockLevel: 1,
          targetType: 'enemy',
          damagePercent: 100
        }
      ]
    }

    it('returns empty array for valid hero', () => {
      expect(validateHero(validHero)).toEqual([])
    })

    describe('required fields', () => {
      it('requires id', () => {
        const hero = { ...validHero, id: undefined }
        const errors = validateHero(hero)
        expect(errors).toContain('id is required')
      })

      it('requires id to be non-empty string', () => {
        const hero = { ...validHero, id: '' }
        const errors = validateHero(hero)
        expect(errors).toContain('id is required')
      })

      it('requires name', () => {
        const hero = { ...validHero, name: undefined }
        const errors = validateHero(hero)
        expect(errors).toContain('name is required')
      })

      it('requires name to be non-empty string', () => {
        const hero = { ...validHero, name: '' }
        const errors = validateHero(hero)
        expect(errors).toContain('name is required')
      })

      it('requires rarity', () => {
        const hero = { ...validHero, rarity: undefined }
        const errors = validateHero(hero)
        expect(errors).toContain('rarity is required')
      })

      it('requires rarity to be 1-5', () => {
        let hero = { ...validHero, rarity: 0 }
        expect(validateHero(hero)).toContain('rarity must be between 1 and 5')

        hero = { ...validHero, rarity: 6 }
        expect(validateHero(hero)).toContain('rarity must be between 1 and 5')
      })

      it('requires classId', () => {
        const hero = { ...validHero, classId: undefined }
        const errors = validateHero(hero)
        expect(errors).toContain('classId is required')
      })

      it('requires valid classId', () => {
        const hero = { ...validHero, classId: 'invalid_class' }
        const errors = validateHero(hero)
        expect(errors).toContain('classId must be a valid class')
      })

      it('requires baseStats', () => {
        const hero = { ...validHero, baseStats: undefined }
        const errors = validateHero(hero)
        expect(errors).toContain('baseStats is required')
      })

      it('requires at least one skill', () => {
        const hero = { ...validHero, skills: [] }
        const errors = validateHero(hero)
        expect(errors).toContain('at least one skill is required')
      })

      it('requires skills to be an array', () => {
        const hero = { ...validHero, skills: undefined }
        const errors = validateHero(hero)
        expect(errors).toContain('at least one skill is required')
      })
    })

    describe('baseStats validation', () => {
      it('requires hp to be positive number', () => {
        let hero = { ...validHero, baseStats: { ...validHero.baseStats, hp: 0 } }
        expect(validateHero(hero)).toContain('baseStats.hp must be a positive number')

        hero = { ...validHero, baseStats: { ...validHero.baseStats, hp: -10 } }
        expect(validateHero(hero)).toContain('baseStats.hp must be a positive number')

        hero = { ...validHero, baseStats: { ...validHero.baseStats, hp: undefined } }
        expect(validateHero(hero)).toContain('baseStats.hp must be a positive number')
      })

      it('requires atk to be positive number', () => {
        const hero = { ...validHero, baseStats: { ...validHero.baseStats, atk: 0 } }
        expect(validateHero(hero)).toContain('baseStats.atk must be a positive number')
      })

      it('requires def to be positive number', () => {
        const hero = { ...validHero, baseStats: { ...validHero.baseStats, def: 0 } }
        expect(validateHero(hero)).toContain('baseStats.def must be a positive number')
      })

      it('requires spd to be positive number', () => {
        const hero = { ...validHero, baseStats: { ...validHero.baseStats, spd: 0 } }
        expect(validateHero(hero)).toContain('baseStats.spd must be a positive number')
      })

      it('requires mp to be positive number', () => {
        const hero = { ...validHero, baseStats: { ...validHero.baseStats, mp: 0 } }
        expect(validateHero(hero)).toContain('baseStats.mp must be a positive number')
      })
    })

    describe('skills validation', () => {
      it('validates each skill and prefixes errors with skill index', () => {
        const hero = {
          ...validHero,
          skills: [
            { name: '', description: 'test', skillUnlockLevel: 1, targetType: 'enemy' }
          ]
        }
        const errors = validateHero(hero)
        expect(errors.some(e => e.startsWith('Skill 1:'))).toBe(true)
      })
    })

    describe('leaderSkill validation', () => {
      it('validates leaderSkill if present', () => {
        const hero = {
          ...validHero,
          leaderSkill: { name: '', description: 'test' }
        }
        const errors = validateHero(hero)
        expect(errors.some(e => e.startsWith('Leader Skill:'))).toBe(true)
      })
    })

    describe('finale validation', () => {
      it('validates finale if present', () => {
        const hero = {
          ...validHero,
          finale: { name: '', description: 'test', target: 'all_allies' }
        }
        const errors = validateHero(hero)
        expect(errors.some(e => e.startsWith('Finale:'))).toBe(true)
      })
    })
  })

  describe('validateSkill', () => {
    const validSkill = {
      name: 'Test Skill',
      description: 'A test skill',
      skillUnlockLevel: 1,
      targetType: 'enemy'
    }

    it('returns empty array for valid skill', () => {
      expect(validateSkill(validSkill, 0)).toEqual([])
    })

    it('requires name', () => {
      const skill = { ...validSkill, name: '' }
      expect(validateSkill(skill, 0)).toContain('name is required')
    })

    it('requires description', () => {
      const skill = { ...validSkill, description: '' }
      expect(validateSkill(skill, 0)).toContain('description is required')
    })

    it('requires valid skillUnlockLevel when provided', () => {
      const skill = { ...validSkill, skillUnlockLevel: 2 }
      expect(validateSkill(skill, 0)).toContain('skillUnlockLevel must be 1, 3, 6, or 12')
    })

    it('allows missing skillUnlockLevel (defaults to 1)', () => {
      const skill = { ...validSkill, skillUnlockLevel: undefined }
      expect(validateSkill(skill, 0)).not.toContain('skillUnlockLevel must be 1, 3, 6, or 12')
    })

    it('requires valid targetType', () => {
      const skill = { ...validSkill, targetType: 'invalid' }
      expect(validateSkill(skill, 0)).toContain('targetType must be a valid target type')
    })

    it('requires targetType', () => {
      const skill = { ...validSkill, targetType: undefined }
      expect(validateSkill(skill, 0)).toContain('targetType must be a valid target type')
    })

    it('validates effects if present', () => {
      const skill = {
        ...validSkill,
        effects: [
          { type: 'invalid_type', duration: 2 }
        ]
      }
      const errors = validateSkill(skill, 0)
      expect(errors.some(e => e.includes('Effect 1:'))).toBe(true)
    })
  })

  describe('validateEffect', () => {
    const validEffect = {
      type: EffectType.ATK_UP,
      duration: 2
    }

    it('returns empty array for valid effect', () => {
      expect(validateEffect(validEffect, 'Skill 1')).toEqual([])
    })

    it('requires type', () => {
      const effect = { ...validEffect, type: undefined }
      expect(validateEffect(effect, 'Skill 1')).toContain('type is required')
    })

    it('requires valid effect type', () => {
      const effect = { ...validEffect, type: 'invalid_type' }
      expect(validateEffect(effect, 'Skill 1')).toContain('type must be a valid EffectType')
    })

    it('requires duration to be a number or object', () => {
      const effect = { ...validEffect, duration: undefined }
      expect(validateEffect(effect, 'Skill 1')).toContain('duration is required (number or object)')
    })

    it('accepts duration as number', () => {
      const effect = { ...validEffect, duration: 3 }
      expect(validateEffect(effect, 'Skill 1')).toEqual([])
    })

    it('accepts duration as object', () => {
      const effect = { ...validEffect, duration: { base: 2, perRarity: 1 } }
      expect(validateEffect(effect, 'Skill 1')).toEqual([])
    })

    it('rejects duration as string', () => {
      const effect = { ...validEffect, duration: 'forever' }
      expect(validateEffect(effect, 'Skill 1')).toContain('duration is required (number or object)')
    })
  })

  describe('validateLeaderSkill', () => {
    const validLeaderSkill = {
      name: "Leader's Aura",
      description: 'All allies gain +10% ATK'
    }

    it('returns empty array for valid leader skill', () => {
      expect(validateLeaderSkill(validLeaderSkill)).toEqual([])
    })

    it('requires name', () => {
      const leaderSkill = { ...validLeaderSkill, name: '' }
      expect(validateLeaderSkill(leaderSkill)).toContain('name is required')
    })

    it('requires description', () => {
      const leaderSkill = { ...validLeaderSkill, description: '' }
      expect(validateLeaderSkill(leaderSkill)).toContain('description is required')
    })

    it('allows missing name if undefined', () => {
      const leaderSkill = { description: 'test' }
      expect(validateLeaderSkill(leaderSkill)).toContain('name is required')
    })
  })

  describe('validateFinale', () => {
    const validFinale = {
      name: 'Grand Finale',
      description: 'A powerful finishing move',
      target: 'all_allies'
    }

    it('returns empty array for valid finale', () => {
      expect(validateFinale(validFinale)).toEqual([])
    })

    it('requires name', () => {
      const finale = { ...validFinale, name: '' }
      expect(validateFinale(finale)).toContain('name is required')
    })

    it('requires description', () => {
      const finale = { ...validFinale, description: '' }
      expect(validateFinale(finale)).toContain('description is required')
    })

    it('requires target', () => {
      const finale = { ...validFinale, target: undefined }
      expect(validateFinale(finale)).toContain('target is required')
    })

    it('requires valid target', () => {
      const finale = { ...validFinale, target: 'invalid' }
      expect(validateFinale(finale)).toContain('target must be all_allies or all_enemies')
    })

    it('allows custom effect types in finales', () => {
      const finale = {
        ...validFinale,
        effects: [
          { type: 'custom_finale_effect', duration: 2 }
        ]
      }
      const errors = validateFinale(finale)
      expect(errors).toEqual([])
    })

    it('allows known finale effect types without duration', () => {
      const finale = {
        ...validFinale,
        effects: [
          { type: 'resource_grant', mpAmount: 15 },
          { type: 'heal', value: 10 }
        ]
      }
      const errors = validateFinale(finale)
      expect(errors).toEqual([])
    })

    it('validates effects require type', () => {
      const finale = {
        ...validFinale,
        effects: [
          { duration: 2 }
        ]
      }
      const errors = validateFinale(finale)
      expect(errors.some(e => e.includes('Effect 1:') && e.includes('type is required'))).toBe(true)
    })
  })

  describe('integration with real hero data', () => {
    it('validates Aurora the Dawn successfully', async () => {
      const { aurora_the_dawn } = await import('../../data/heroes/5star/aurora_the_dawn.js')
      const errors = validateHero(aurora_the_dawn)
      expect(errors).toEqual([])
    })

    it('validates Cacophon successfully (bard with finale)', async () => {
      const { cacophon } = await import('../../data/heroes/5star/cacophon.js')
      const errors = validateHero(cacophon)
      expect(errors).toEqual([])
    })

    it('validates Wandering Bard successfully (bard with resource_grant finale)', async () => {
      const { wandering_bard } = await import('../../data/heroes/3star/wandering_bard.js')
      const errors = validateHero(wandering_bard)
      expect(errors).toEqual([])
    })

    it('validates Chroma successfully (bard with standard EffectType finale)', async () => {
      const { chroma } = await import('../../data/heroes/4star/chroma.js')
      const errors = validateHero(chroma)
      expect(errors).toEqual([])
    })
  })
})

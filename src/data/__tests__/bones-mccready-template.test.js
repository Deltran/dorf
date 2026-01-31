import { describe, it, expect } from 'vitest'
import { bones_mccready } from '../heroes/3star/bones_mccready'
import { EffectType } from '../statusEffects'

describe('Bones McCready Hero Template', () => {
  it('should have correct basic properties', () => {
    expect(bones_mccready.id).toBe('bones_mccready')
    expect(bones_mccready.name).toBe('Bones McCready')
    expect(bones_mccready.rarity).toBe(3)
    expect(bones_mccready.classId).toBe('druid')
  })

  it('should have correct base stats', () => {
    expect(bones_mccready.baseStats).toEqual({
      hp: 85, atk: 22, def: 22, spd: 11, mp: 60
    })
  })

  it('should have 5 skills', () => {
    expect(bones_mccready.skills).toHaveLength(5)
  })

  describe('Roll the Bones skill', () => {
    const skill = bones_mccready.skills.find(s => s.name === 'Roll the Bones')

    it('should exist', () => {
      expect(skill).toBeDefined()
    })

    it('should be a dice heal targeting ally', () => {
      expect(skill.targetType).toBe('ally')
      expect(skill.isDiceHeal).toBe(true)
      expect(skill.mpCost).toBe(12)
    })

    it('should have dice tiers defined', () => {
      expect(skill.diceTiers).toEqual([
        { min: 1, max: 2, healPercent: 50 },
        { min: 3, max: 4, healPercent: 100 },
        { min: 5, max: 6, healPercent: 150, applyRegen: true }
      ])
    })
  })

  describe('Snake Eyes skill', () => {
    const skill = bones_mccready.skills.find(s => s.name === 'Snake Eyes')

    it('should exist', () => {
      expect(skill).toBeDefined()
    })

    it('should apply poison effect', () => {
      expect(skill.effects).toContainEqual(
        expect.objectContaining({
          type: EffectType.POISON,
          target: 'enemy',
          duration: 2,
          value: 35
        })
      )
    })

    it('should have doubles bonus', () => {
      expect(skill.onDoubles).toEqual({ extendDuration: 2 })
    })
  })

  describe('Fortune Teller skill', () => {
    const skill = bones_mccready.skills.find(s => s.name === 'Fortune Teller')

    it('should exist', () => {
      expect(skill).toBeDefined()
    })

    it('should target self', () => {
      expect(skill.targetType).toBe('self')
    })

    it('should have fortune_teller effect', () => {
      expect(skill.effects).toContainEqual(
        expect.objectContaining({
          type: 'fortune_teller',
          target: 'self',
          duration: 3
        })
      )
    })
  })

  describe('Loaded Bones skill', () => {
    const skill = bones_mccready.skills.find(s => s.name === 'Loaded Bones')

    it('should exist', () => {
      expect(skill).toBeDefined()
    })

    it('should heal for 80% ATK', () => {
      expect(skill.healPercent).toBe(80)
    })

    it('should grant LOADED_DICE effect', () => {
      expect(skill.effects).toContainEqual(
        expect.objectContaining({
          type: EffectType.LOADED_DICE,
          target: 'ally',
          duration: 99
        })
      )
    })
  })

  describe('Bones Never Lie skill', () => {
    const skill = bones_mccready.skills.find(s => s.name === 'Bones Never Lie')

    it('should exist', () => {
      expect(skill).toBeDefined()
    })

    it('should be AoE dice heal', () => {
      expect(skill.targetType).toBe('all_allies')
      expect(skill.isDiceHeal).toBe(true)
      expect(skill.diceCount).toBe(3)
    })

    it('should have correct dice tiers for 3d6', () => {
      expect(skill.diceTiers).toEqual([
        { min: 3, max: 8, healPercent: 40 },
        { min: 9, max: 14, healPercent: 80 },
        { min: 15, max: 18, healPercent: 120, applyRegen: true }
      ])
    })
  })

  it('does NOT have a leader skill (3-star)', () => {
    expect(bones_mccready.leaderSkill).toBeUndefined()
  })
})

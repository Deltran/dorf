import { describe, it, expect } from 'vitest'
import { grandmother_rot } from '../heroes/5star/grandmother_rot'
import { EffectType } from '../statusEffects'

describe('Grandmother Rot hero template', () => {
  it('exists with correct identity', () => {
    expect(grandmother_rot).toBeDefined()
    expect(grandmother_rot.id).toBe('grandmother_rot')
    expect(grandmother_rot.name).toBe('Grandmother Rot')
    expect(grandmother_rot.rarity).toBe(5)
    expect(grandmother_rot.classId).toBe('druid')
  })

  it('has correct base stats', () => {
    expect(grandmother_rot.baseStats).toEqual({
      hp: 115, atk: 30, def: 32, spd: 11, mp: 80
    })
  })

  it('has 5 skills', () => {
    expect(grandmother_rot.skills).toHaveLength(5)
  })

  it('has leader skill', () => {
    expect(grandmother_rot.leaderSkill).toBeDefined()
    expect(grandmother_rot.leaderSkill.name).toBe('The Circle Continues')
  })

  describe('Mulching Strike skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Mulching Strike')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(15)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(90)
      expect(skill.healSelfPercent).toBe(20)
    })
  })

  describe('Decomposition skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Decomposition')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(20)
      expect(skill.targetType).toBe('ally')
      expect(skill.noDamage).toBe(true)
    })
    it('applies DECOMPOSITION effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DECOMPOSITION)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(3)
      expect(effect.shieldAtkPercent).toBe(10)
      expect(effect.healAtkPercent).toBe(25)
    })
  })

  describe('Blight Bloom skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Blight Bloom')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(25)
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.damagePercent).toBe(60)
      expect(skill.ifPoisoned).toEqual({ damagePercent: 90 })
    })
  })

  describe('Fungal Network skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'Fungal Network')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(32)
      expect(skill.targetType).toBe('all_allies')
      expect(skill.healPercent).toBe(15)
      expect(skill.ifPoisoned).toEqual({ healPercent: 35, removePoisonFromAllies: true })
    })
  })

  describe('The Great Composting skill', () => {
    const skill = grandmother_rot.skills.find(s => s.name === 'The Great Composting')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.mpCost).toBe(45)
      expect(skill.skillUnlockLevel).toBe(12)
      expect(skill.consumesPoisonFromEnemies).toBe(true)
    })
    it('has baseline regen effect', () => {
      expect(skill.baselineRegen).toBeDefined()
      expect(skill.baselineRegen.type).toBe(EffectType.REGEN)
    })
  })

  describe('leader skill: The Circle Continues', () => {
    it('has passive_round_start effect', () => {
      const effect = grandmother_rot.leaderSkill.effects[0]
      expect(effect.type).toBe('passive_round_start')
      expect(effect.condition.hasEffect).toBe('poison')
      expect(effect.heal.atkPercent).toBe(5)
      expect(effect.extendEffect.type).toBe('poison')
      expect(effect.extendEffect.duration).toBe(1)
    })
  })
})

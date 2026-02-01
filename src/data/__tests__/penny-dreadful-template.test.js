import { describe, it, expect } from 'vitest'
import { penny_dreadful } from '../heroes/4star/penny_dreadful'
import { EffectType } from '../statusEffects'

describe('Penny Dreadful hero template', () => {
  it('exists with correct identity', () => {
    expect(penny_dreadful).toBeDefined()
    expect(penny_dreadful.id).toBe('penny_dreadful')
    expect(penny_dreadful.name).toBe('Penny Dreadful')
    expect(penny_dreadful.rarity).toBe(4)
    expect(penny_dreadful.classId).toBe('alchemist')
  })

  it('has correct base stats', () => {
    expect(penny_dreadful.baseStats).toEqual({
      hp: 78, atk: 36, def: 16, spd: 15, mp: 65
    })
  })

  it('has 5 skills', () => {
    expect(penny_dreadful.skills).toHaveLength(5)
  })

  describe('A Spot of Tea skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'A Spot of Tea')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(12)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(80)
      expect(skill.usesVolatility).toBe(true)
    })
    it('applies Poison effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.POISON)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
      expect(effect.atkPercent).toBe(25)
    })
  })

  describe('The Good Silver skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'The Good Silver')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(15)
      expect(skill.damagePercent).toBe(70)
    })
    it('applies SPD_DOWN and ATK_DOWN effects', () => {
      const spdDown = skill.effects.find(e => e.type === EffectType.SPD_DOWN)
      const atkDown = skill.effects.find(e => e.type === EffectType.ATK_DOWN)
      expect(spdDown).toBeDefined()
      expect(spdDown.value).toBe(20)
      expect(atkDown).toBeDefined()
      expect(atkDown.value).toBe(15)
    })
  })

  describe('Poison Cocktail skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'Poison Cocktail')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(20)
      expect(skill.damagePercent).toBe(100)
      expect(skill.skillUnlockLevel).toBe(3)
    })
    it('has debuff thresholds for Marked scaling', () => {
      expect(skill.debuffThresholds).toBeDefined()
      expect(skill.debuffThresholds.at2.type).toBe(EffectType.MARKED)
      expect(skill.debuffThresholds.at2.value).toBe(25)
      expect(skill.debuffThresholds.at3.value).toBe(35)
      expect(skill.debuffThresholds.at4.refreshAllDebuffs).toBe(1)
    })
  })

  describe('Spring Cleaning skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'Spring Cleaning')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(18)
      expect(skill.targetType).toBe('all_allies')
      expect(skill.cleanseDebuffs).toBe(1)
    })
    it('grants DEF_UP if cleansed', () => {
      expect(skill.ifCleansed.type).toBe(EffectType.DEF_UP)
      expect(skill.ifCleansed.value).toBe(15)
    })
  })

  describe('Tidy Up skill', () => {
    const skill = penny_dreadful.skills.find(s => s.name === 'Tidy Up')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.essenceCost).toBe(28)
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.damagePercent).toBe(70)
      expect(skill.skillUnlockLevel).toBe(12)
    })
    it('has debuff scaling with cap', () => {
      expect(skill.bonusDamagePerDebuff).toBe(20)
      expect(skill.maxBonusDamage).toBe(100)
    })
  })
})

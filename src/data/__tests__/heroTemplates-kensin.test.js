import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'
import { EffectType } from '../statusEffects'

describe('Kensin hero template', () => {
  const kensin = heroTemplates.town_guard

  it('exists with correct identity', () => {
    expect(kensin).toBeDefined()
    expect(kensin.id).toBe('town_guard')
    expect(kensin.name).toBe('Kensin')
    expect(kensin.rarity).toBe(3)
    expect(kensin.classId).toBe('knight')
  })

  it('has unchanged base stats', () => {
    expect(kensin.baseStats).toEqual({ hp: 110, atk: 22, def: 35, spd: 8 })
  })

  it('has 5 skills', () => {
    expect(kensin.skills).toHaveLength(5)
  })

  describe('Stand and Fight', () => {
    const skill = kensin.skills.find(s => s.name === 'Stand and Fight')

    it('exists as a self-target taunt at Valor 25', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
      expect(skill.valorRequired).toBe(25)
      expect(skill.skillUnlockLevel).toBe(1)
      expect(skill.noDamage).toBe(true)
    })

    it('applies TAUNT with Valor-scaled duration', () => {
      const taunt = skill.effects.find(e => e.type === EffectType.TAUNT)
      expect(taunt).toBeDefined()
      expect(taunt.duration).toEqual({ base: 2, at50: 3 })
    })

    it('applies DAMAGE_REDUCTION at 75 Valor', () => {
      const dr = skill.effects.find(e => e.type === EffectType.DAMAGE_REDUCTION)
      expect(dr).toBeDefined()
      expect(dr.value).toBe(15)
      expect(dr.valorThreshold).toBe(75)
    })
  })

  describe('Retribution', () => {
    const skill = kensin.skills.find(s => s.name === 'Retribution')

    it('exists as an enemy-target damage skill with no Valor requirement', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
      expect(skill.valorRequired).toBe(0)
      expect(skill.skillUnlockLevel).toBe(1)
    })

    it('has Valor-scaled damage from 100% to 180%', () => {
      expect(skill.damage).toEqual({ base: 100, at25: 120, at50: 140, at75: 160, at100: 180 })
    })
  })

  describe('Reinforce', () => {
    const skill = kensin.skills.find(s => s.name === 'Reinforce')

    it('exists as an ally-target utility at Valor 50', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
      expect(skill.valorRequired).toBe(50)
      expect(skill.skillUnlockLevel).toBe(3)
      expect(skill.noDamage).toBe(true)
    })

    it('cleanses ATK/DEF debuffs with SPD at Valor 100', () => {
      expect(skill.cleanse.types).toEqual(['atk', 'def'])
      expect(skill.cleanse.at100Types).toEqual(['atk', 'def', 'spd'])
    })

    it('heals from DEF stat with Valor scaling', () => {
      expect(skill.healFromStat.stat).toBe('def')
      expect(skill.healFromStat.percent).toEqual({ base: 10, at75: 15 })
    })
  })

  describe('Riposte', () => {
    const skill = kensin.skills.find(s => s.name === 'Riposte')

    it('exists as a self-target buff at no Valor requirement', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
      expect(skill.valorRequired).toBe(0)
      expect(skill.skillUnlockLevel).toBe(6)
      expect(skill.noDamage).toBe(true)
    })

    it('applies RIPOSTE with noDefCheck and Valor-scaled value/duration', () => {
      const riposte = skill.effects.find(e => e.type === EffectType.RIPOSTE)
      expect(riposte).toBeDefined()
      expect(riposte.noDefCheck).toBe(true)
      expect(riposte.value).toEqual({ base: 80, at50: 100 })
      expect(riposte.duration).toEqual({ base: 2, at75: 3 })
    })
  })

  describe('Judgment of Steel', () => {
    const skill = kensin.skills.find(s => s.name === 'Judgment of Steel')

    it('exists as an enemy-target finisher at Valor 50', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
      expect(skill.valorRequired).toBe(50)
      expect(skill.skillUnlockLevel).toBe(12)
    })

    it('consumes all Valor with damage-per-Valor scaling', () => {
      expect(skill.valorCost).toBe('all')
      expect(skill.baseDamage).toBe(50)
      expect(skill.damagePerValor).toBe(2)
    })

    it('applies DEF debuff to target', () => {
      const debuff = skill.effects.find(e => e.type === EffectType.DEF_DOWN)
      expect(debuff).toBeDefined()
      expect(debuff.value).toBe(20)
      expect(debuff.duration).toBe(2)
    })
  })
})

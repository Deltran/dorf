import { describe, it, expect } from 'vitest'
import { the_grateful_dead } from '../3star/the_grateful_dead'
import { EffectType } from '../../statusEffects'

describe('The Grateful Dead hero template', () => {
  it('exists with correct identity', () => {
    expect(the_grateful_dead).toBeDefined()
    expect(the_grateful_dead.id).toBe('the_grateful_dead')
    expect(the_grateful_dead.name).toBe('The Grateful Dead')
    expect(the_grateful_dead.rarity).toBe(3)
    expect(the_grateful_dead.classId).toBe('knight')
  })

  it('has correct base stats (no mp for knight)', () => {
    expect(the_grateful_dead.baseStats).toEqual({
      hp: 105, atk: 24, def: 26, spd: 9
    })
  })

  it('has 5 skills', () => {
    expect(the_grateful_dead.skills).toHaveLength(5)
  })

  describe('Grave Tap skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Grave Tap')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(0)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(85)
      expect(skill.valorGain).toBe(10)
    })
  })

  describe('A Minor Inconvenience skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'A Minor Inconvenience')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(15)
      expect(skill.targetType).toBe('self')
      expect(skill.noDamage).toBe(true)
    })
    it('cleanses stun, sleep, and heal_block', () => {
      expect(skill.cleanseSelf).toContain('stun')
      expect(skill.cleanseSelf).toContain('sleep')
      expect(skill.cleanseSelf).toContain('heal_block')
    })
    it('applies Riposte effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.RIPOSTE)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
    })
  })

  describe('Cold Comfort skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Cold Comfort')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(25)
      expect(skill.targetType).toBe('ally')
      expect(skill.skillUnlockLevel).toBe(3)
    })
    it('applies Shield effect based on max HP', () => {
      const effect = skill.effects.find(e => e.type === EffectType.SHIELD)
      expect(effect).toBeDefined()
      expect(effect.shieldPercentMaxHp).toBe(30)
    })
  })

  describe('Bygone Valor skill', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Bygone Valor')
    it('exists with correct properties', () => {
      expect(skill).toBeDefined()
      expect(skill.valorRequired).toBe(1)
      expect(skill.valorCost).toBe('all')
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.skillUnlockLevel).toBe(6)
    })
    it('has correct damage scaling', () => {
      expect(skill.damagePercent).toBe(60)
      expect(skill.bonusDamagePerValor).toBe(1.0)
      expect(skill.maxBonusDamage).toBe(100)
      expect(skill.healSelfPercent).toBe(50)
    })
    it('applies DEF_DOWN at 100 Valor', () => {
      expect(skill.at100Valor).toBeDefined()
      const effect = skill.at100Valor.effects[0]
      expect(effect.type).toBe(EffectType.DEF_DOWN)
      expect(effect.value).toBe(20)
    })
  })

  describe('Already Dead passive', () => {
    const skill = the_grateful_dead.skills.find(s => s.name === 'Already Dead')
    it('is marked as passive with valorThreshold type', () => {
      expect(skill).toBeDefined()
      expect(skill.isPassive).toBe(true)
      expect(skill.passiveType).toBe('valorThreshold')
      expect(skill.skillUnlockLevel).toBe(12)
    })
    it('has correct thresholds', () => {
      const thresholds = skill.thresholds
      expect(thresholds).toHaveLength(4)
      expect(thresholds[0]).toEqual({ valor: 25, stat: 'def', value: 10 })
      expect(thresholds[1]).toEqual({ valor: 50, stat: 'atk', value: 15 })
      expect(thresholds[2]).toEqual({ valor: 75, riposteLifesteal: 10 })
      expect(thresholds[3]).toEqual({ valor: 100, deathPrevention: true, oncePerBattle: true })
    })
  })
})

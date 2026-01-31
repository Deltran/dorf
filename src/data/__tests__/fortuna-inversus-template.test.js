import { describe, it, expect } from 'vitest'
import { fortuna_inversus } from '../heroes/5star/fortuna_inversus'
import { EffectType } from '../statusEffects'

describe('Fortuna Inversus Hero Template', () => {
  it('should have correct basic properties', () => {
    expect(fortuna_inversus.id).toBe('fortuna_inversus')
    expect(fortuna_inversus.name).toBe('Fortuna Inversus')
    expect(fortuna_inversus.rarity).toBe(5)
    expect(fortuna_inversus.classId).toBe('bard')
  })

  it('should have correct base stats', () => {
    expect(fortuna_inversus.baseStats).toEqual({
      hp: 90, atk: 26, def: 24, spd: 14, mp: 65
    })
  })

  describe('Leader Skill', () => {
    it('should be Fortune Favors the Bold', () => {
      expect(fortuna_inversus.leaderSkill.name).toBe('Fortune Favors the Bold')
    })

    it('should grant +20% ATK to allies below 50% HP', () => {
      const effect = fortuna_inversus.leaderSkill.effects[0]
      expect(effect.type).toBe('passive')
      expect(effect.stat).toBe('atk')
      expect(effect.value).toBe(20)
      expect(effect.condition).toEqual({ hpBelow: 50 })
    })
  })

  describe('Finale', () => {
    it('should be Wheel of Reversal', () => {
      expect(fortuna_inversus.finale.name).toBe('Wheel of Reversal')
    })

    it('should target all units for fortune swap', () => {
      expect(fortuna_inversus.finale.isFortuneSwap).toBe(true)
    })

    it('should have swap pairs defined', () => {
      expect(fortuna_inversus.finale.swapPairs).toBeDefined()
      expect(fortuna_inversus.finale.swapPairs[EffectType.ATK_UP]).toBe(EffectType.ATK_DOWN)
      expect(fortuna_inversus.finale.swapPairs[EffectType.POISON]).toBe(EffectType.REGEN)
    })

    it('should have dispel list defined', () => {
      expect(fortuna_inversus.finale.dispelList).toContain(EffectType.STUN)
      expect(fortuna_inversus.finale.dispelList).toContain(EffectType.SHIELD)
      expect(fortuna_inversus.finale.dispelList).toContain(EffectType.GUARDIAN_LINK)
    })

    it('should have fallback for empty table', () => {
      expect(fortuna_inversus.finale.emptyFallback).toBeDefined()
    })
  })

  it('should have 5 skills', () => {
    expect(fortuna_inversus.skills).toHaveLength(5)
  })

  describe('Fickle Fortune skill', () => {
    const skill = fortuna_inversus.skills.find(s => s.name === 'Fickle Fortune')

    it('should deal damage with random debuff', () => {
      expect(skill.damagePercent).toBe(110)
      expect(skill.randomDebuff).toBeDefined()
    })
  })

  describe('House Always Wins skill', () => {
    const skill = fortuna_inversus.skills.find(s => s.name === 'House Always Wins')

    it('should remove buffs and stack ATK', () => {
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.removeRandomBuff).toBe(1)
      expect(skill.atkStackPerBuff).toBe(5)
    })
  })
})

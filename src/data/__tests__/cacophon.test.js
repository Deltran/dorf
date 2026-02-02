import { describe, it, expect } from 'vitest'
import { cacophon } from '../heroes/5star/cacophon.js'
import { EffectType } from '../statusEffects.js'

describe('Cacophon hero data', () => {
  it('should have correct basic properties', () => {
    expect(cacophon.id).toBe('cacophon')
    expect(cacophon.name).toBe('Cacophon')
    expect(cacophon.rarity).toBe(5)
    expect(cacophon.classId).toBe('bard')
  })

  it('should have correct base stats', () => {
    expect(cacophon.baseStats).toEqual({
      hp: 95,
      atk: 25,
      def: 22,
      spd: 16,
      mp: 60
    })
  })

  it('should have 5 skills', () => {
    expect(cacophon.skills).toHaveLength(5)
  })

  it('should have Discordant Anthem as first skill with allyHpCost', () => {
    const skill = cacophon.skills[0]
    expect(skill.name).toBe('Discordant Anthem')
    expect(skill.allyHpCostPercent).toBe(5)
    expect(skill.targetType).toBe('all_allies')
  })

  it('should have Vicious Verse with VICIOUS effect', () => {
    const skill = cacophon.skills[1]
    expect(skill.name).toBe('Vicious Verse')
    expect(skill.allyHpCostPercent).toBe(5)
    expect(skill.effects[0].type).toBe(EffectType.VICIOUS)
  })

  it('should have Tempo Shatter with SHATTERED_TEMPO effect', () => {
    const skill = cacophon.skills[2]
    expect(skill.name).toBe('Tempo Shatter')
    expect(skill.allyHpCostPercent).toBe(6)
    expect(skill.effects[0].type).toBe(EffectType.SHATTERED_TEMPO)
  })

  it('should have Screaming Echo with ECHOING effect', () => {
    const skill = cacophon.skills[3]
    expect(skill.name).toBe('Screaming Echo')
    expect(skill.allyHpCostPercent).toBe(6)
    expect(skill.effects[0].type).toBe(EffectType.ECHOING)
  })

  it('should have Warding Noise with SHIELD effect', () => {
    const skill = cacophon.skills[4]
    expect(skill.name).toBe('Warding Noise')
    expect(skill.allyHpCostPercent).toBe(5)
    expect(skill.effects[0].type).toBe(EffectType.SHIELD)
  })

  it('should have Suffering\'s Crescendo finale', () => {
    expect(cacophon.finale.name).toBe("Suffering's Crescendo")
    expect(cacophon.finale.target).toBe('all_allies')
    expect(cacophon.finale.effects[0].type).toBe('suffering_crescendo')
    expect(cacophon.finale.effects[0].baseBuff).toBe(10)
    expect(cacophon.finale.effects[0].hpPerPercent).toBe(150)
    expect(cacophon.finale.effects[0].maxBonus).toBe(25)
  })

  it('should have Harmonic Bleeding leader skill', () => {
    expect(cacophon.leaderSkill.name).toBe('Harmonic Bleeding')
    expect(cacophon.leaderSkill.effects[0].type).toBe('battle_start_debuff')
    expect(cacophon.leaderSkill.effects[0].apply.effectType).toBe('discordant_resonance')
    expect(cacophon.leaderSkill.effects[0].apply.damageBonus).toBe(15)
    expect(cacophon.leaderSkill.effects[0].apply.healingPenalty).toBe(30)
  })
})

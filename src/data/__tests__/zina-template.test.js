// src/data/__tests__/zina-template.test.js
import { describe, it, expect } from 'vitest'
import { zina_the_desperate } from '../heroes/4star/zina_the_desperate'
import { EffectType } from '../statusEffects'

describe('Zina the Desperate hero template', () => {
  it('exists with correct identity', () => {
    expect(zina_the_desperate).toBeDefined()
    expect(zina_the_desperate.id).toBe('zina_the_desperate')
    expect(zina_the_desperate.name).toBe('Zina')
    expect(zina_the_desperate.rarity).toBe(4)
    expect(zina_the_desperate.classId).toBe('alchemist')
  })

  it('has correct glass cannon stats', () => {
    expect(zina_the_desperate.baseStats).toEqual({
      hp: 75,
      atk: 38,
      def: 15,
      spd: 16,
      mp: 60
    })
  })

  it('has 5 skills', () => {
    expect(zina_the_desperate.skills).toHaveLength(5)
  })

  it('has Cornered Animal passive', () => {
    const skill = zina_the_desperate.skills.find(s => s.name === 'Cornered Animal')
    expect(skill).toBeDefined()
    expect(skill.isPassive).toBe(true)
    expect(skill.passiveType).toBe('lowHpTrigger')
  })

  it('has Last Breath on-death passive', () => {
    const skill = zina_the_desperate.skills.find(s => s.name === 'Last Breath')
    expect(skill).toBeDefined()
    expect(skill.isPassive).toBe(true)
    expect(skill.passiveType).toBe('onDeath')
  })

  it('does NOT have a leader skill (4-star)', () => {
    expect(zina_the_desperate.leaderSkill).toBeUndefined()
  })
})

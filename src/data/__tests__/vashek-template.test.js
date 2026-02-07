import { describe, it, expect } from 'vitest'
import { vashek_the_unrelenting } from '../heroes/3star/vashek_the_unrelenting'
import { EffectType } from '../statusEffects'

describe('Vashek the Unrelenting hero template', () => {
  it('exists with correct identity', () => {
    expect(vashek_the_unrelenting).toBeDefined()
    expect(vashek_the_unrelenting.id).toBe('vashek_the_unrelenting')
    expect(vashek_the_unrelenting.name).toBe('Vashek')
    expect(vashek_the_unrelenting.rarity).toBe(3)
    expect(vashek_the_unrelenting.classId).toBe('knight')
  })

  it('has correct base stats', () => {
    expect(vashek_the_unrelenting.baseStats).toEqual({
      hp: 110,
      atk: 22,
      def: 28,
      spd: 10
    })
  })

  it('has 5 skills', () => {
    expect(vashek_the_unrelenting.skills).toHaveLength(5)
  })

  it('has Hold the Line with Valor scaling', () => {
    const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Hold the Line')
    expect(skill).toBeDefined()
    expect(skill.damage.base).toBe(80)
    expect(skill.damage.at100).toBe(120)
  })

  it('has Unyielding passive', () => {
    const skill = vashek_the_unrelenting.skills.find(s => s.name === 'Unyielding')
    expect(skill).toBeDefined()
    expect(skill.isPassive).toBe(true)
    expect(skill.passiveType).toBe('allySaveOnce')
  })

  it('does NOT have a leader skill (3-star)', () => {
    expect(vashek_the_unrelenting.leaderSkill).toBeUndefined()
  })
})

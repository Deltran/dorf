import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'
import { EffectType } from '../statusEffects'

describe('Salia skill kit', () => {
  const salia = heroTemplates.street_urchin

  it('has 4 skills', () => {
    expect(salia.skills).toHaveLength(4)
  })

  it('Quick Throw uses damagePercent not damageMultiplier', () => {
    const skill = salia.skills[0]
    expect(skill.name).toBe('Quick Throw')
    expect(skill.damagePercent).toBe(80)
    expect(skill.damageMultiplier).toBeUndefined()
    expect(skill.grantsExtraTurn).toBe(true)
  })

  it('Desperation uses damagePercent not damageMultiplier', () => {
    const skill = salia.skills[1]
    expect(skill.name).toBe('Desperation')
    expect(skill.damagePercent).toBe(150)
    expect(skill.damageMultiplier).toBeUndefined()
    expect(skill.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.DEF_DOWN, target: 'self' })
      ])
    )
  })

  it('But Not Out has conditionalSelfBuff', () => {
    const skill = salia.skills[2]
    expect(skill.name).toBe('But Not Out')
    expect(skill.conditionalSelfBuff).toBeDefined()
    expect(skill.noDamage).toBe(true)
  })

  it('In The Crowd uses damagePercent not damageMultiplier', () => {
    const skill = salia.skills[3]
    expect(skill.name).toBe('In The Crowd')
    expect(skill.damagePercent).toBe(120)
    expect(skill.damageMultiplier).toBeUndefined()
    expect(skill.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EffectType.UNTARGETABLE, target: 'self' })
      ])
    )
  })
})

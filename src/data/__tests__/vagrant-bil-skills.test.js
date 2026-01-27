import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'

describe('Vagrant Bil skills', () => {
  const bil = heroTemplates.beggar_monk

  it('Minor Heal has desperation heal scaling', () => {
    const heal = bil.skills.find(s => s.name === 'Minor Heal')
    expect(heal).toBeDefined()
    expect(heal.healPercent).toBe(40)
    expect(heal.desperationHealBonus).toBe(80)
    expect(heal.skillUnlockLevel).toBe(1)
    expect(heal.targetType).toBe('ally')
  })

  it('Worthless Words has desperation debuff scaling', () => {
    const skill = bil.skills.find(s => s.name === 'Worthless Words')
    expect(skill).toBeDefined()
    expect(skill.effects[0].value).toBe(10)
    expect(skill.effects[0].desperationBonus).toBe(15)
  })

  it("Nobody's Curse has desperation debuff scaling", () => {
    const skill = bil.skills.find(s => s.name === "Nobody's Curse")
    expect(skill).toBeDefined()
    expect(skill.effects[0].value).toBe(10)
    expect(skill.effects[0].desperationBonus).toBe(15)
  })

  it("Beggar's Prayer has desperation heal and debuff scaling", () => {
    const skill = bil.skills.find(s => s.name === "Beggar's Prayer")
    expect(skill).toBeDefined()
    expect(skill.healPercent).toBe(25)
    expect(skill.desperationHealBonus).toBe(50)
    expect(skill.effects[0].desperationBonus).toBe(15)
  })
})

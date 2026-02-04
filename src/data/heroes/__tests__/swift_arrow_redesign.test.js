import { describe, it, expect } from 'vitest'
import { swift_arrow } from '../4star/swift_arrow'
import { EffectType } from '../../statusEffects'

describe('Swift Arrow redesign — Tempo Archer', () => {
  it('has correct base identity', () => {
    expect(swift_arrow.id).toBe('swift_arrow')
    expect(swift_arrow.name).toBe('Swift Arrow')
    expect(swift_arrow.rarity).toBe(4)
    expect(swift_arrow.classId).toBe('ranger')
    expect(swift_arrow.epithet).toBe('The Skirmisher')
  })

  it('has unchanged base stats', () => {
    expect(swift_arrow.baseStats).toEqual({ hp: 90, atk: 42, def: 22, spd: 20, mp: 55 })
  })

  it('has exactly 5 skills', () => {
    expect(swift_arrow.skills).toHaveLength(5)
  })

  describe('Skill 1: Quick Shot', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[0]
      expect(skill.name).toBe('Quick Shot')
      expect(skill.skillUnlockLevel).toBe(1)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(90)
    })

    it('applies SPD_DOWN to target', () => {
      const skill = swift_arrow.skills[0]
      expect(skill.effects).toHaveLength(1)
      expect(skill.effects[0].type).toBe(EffectType.SPD_DOWN)
      expect(skill.effects[0].target).toBe('enemy')
      expect(skill.effects[0].duration).toBe(2)
      expect(skill.effects[0].value).toBe(15)
    })
  })

  describe('Skill 2: Pinning Volley', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[1]
      expect(skill.name).toBe('Pinning Volley')
      expect(skill.skillUnlockLevel).toBe(1)
      expect(skill.targetType).toBe('all_enemies')
      expect(skill.damagePercent).toBe(60)
    })

    it('conditionally applies DEF_DOWN to debuffed enemies', () => {
      const skill = swift_arrow.skills[1]
      expect(skill.conditionalEffects).toBeDefined()
      expect(skill.conditionalEffects[0].condition).toBe('target_has_debuff')
      expect(skill.conditionalEffects[0].type).toBe(EffectType.DEF_DOWN)
      expect(skill.conditionalEffects[0].target).toBe('enemy')
      expect(skill.conditionalEffects[0].duration).toBe(2)
      expect(skill.conditionalEffects[0].value).toBe(15)
    })
  })

  describe('Skill 3: Nimble Reposition', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[2]
      expect(skill.name).toBe('Nimble Reposition')
      expect(skill.skillUnlockLevel).toBe(3)
      expect(skill.targetType).toBe('self')
      expect(skill.noDamage).toBe(true)
    })

    it('grants DEBUFF_IMMUNE and SPD_UP', () => {
      const skill = swift_arrow.skills[2]
      expect(skill.effects).toHaveLength(2)

      const debuffImmune = skill.effects.find(e => e.type === EffectType.DEBUFF_IMMUNE)
      expect(debuffImmune).toBeDefined()
      expect(debuffImmune.duration).toBe(1)

      const spdUp = skill.effects.find(e => e.type === EffectType.SPD_UP)
      expect(spdUp).toBeDefined()
      expect(spdUp.value).toBe(20)
      expect(spdUp.duration).toBe(2)
    })
  })

  describe('Skill 4: Precision Strike', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[3]
      expect(skill.name).toBe('Precision Strike')
      expect(skill.skillUnlockLevel).toBe(6)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(140)
    })

    it('has DEF_DOWN bonus (ignore DEF)', () => {
      const skill = swift_arrow.skills[3]
      expect(skill.bonusIfTargetHas).toBeDefined()
      const defDownBonus = skill.bonusIfTargetHas.find(b => b.effectType === EffectType.DEF_DOWN)
      expect(defDownBonus).toBeDefined()
      expect(defDownBonus.ignoreDef).toBe(20)
    })

    it('has SPD_DOWN bonus (increased damage)', () => {
      const skill = swift_arrow.skills[3]
      const spdDownBonus = skill.bonusIfTargetHas.find(b => b.effectType === EffectType.SPD_DOWN)
      expect(spdDownBonus).toBeDefined()
      expect(spdDownBonus.damagePercent).toBe(180)
    })
  })

  describe('Skill 5: Flurry of Arrows', () => {
    it('has correct properties', () => {
      const skill = swift_arrow.skills[4]
      expect(skill.name).toBe('Flurry of Arrows')
      expect(skill.skillUnlockLevel).toBe(12)
      expect(skill.targetType).toBe('enemy')
      expect(skill.damagePercent).toBe(55)
      expect(skill.multiHit).toBe(3)
    })

    it('grants SWIFT_MOMENTUM stack on hit vs debuffed target', () => {
      const skill = swift_arrow.skills[4]
      expect(skill.onHitDebuffedTarget).toBeDefined()
      expect(skill.onHitDebuffedTarget.applyToSelf).toBeDefined()
      expect(skill.onHitDebuffedTarget.applyToSelf.type).toBe(EffectType.SWIFT_MOMENTUM)
      expect(skill.onHitDebuffedTarget.applyToSelf.value).toBe(5)
      expect(skill.onHitDebuffedTarget.applyToSelf.duration).toBe(999)
    })
  })

  it('does not use MARKED anywhere', () => {
    const allEffects = swift_arrow.skills.flatMap(s => [
      ...(s.effects || []),
      ...(s.conditionalEffects || [])
    ])
    const markedEffects = allEffects.filter(e => e.type === EffectType.MARKED)
    expect(markedEffects).toHaveLength(0)
  })

  it('does not use STEALTH or EVASION anywhere', () => {
    const allEffects = swift_arrow.skills.flatMap(s => [
      ...(s.effects || []),
      ...(s.conditionalEffects || [])
    ])
    const stealthEvasion = allEffects.filter(e =>
      e.type === EffectType.STEALTH || e.type === EffectType.EVASION
    )
    expect(stealthEvasion).toHaveLength(0)
  })
})

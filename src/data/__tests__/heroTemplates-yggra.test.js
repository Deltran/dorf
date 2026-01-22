import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroTemplates'
import { EffectType } from '../statusEffects'

describe('Yggra hero template', () => {
  const yggra = heroTemplates.yggra_world_root

  it('has 5 skills', () => {
    expect(yggra.skills).toHaveLength(5)
  })

  describe('Blessing of the World Root', () => {
    const skill = yggra.skills.find(s => s.name === 'Blessing of the World Root')

    it('exists and targets all allies', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('all_allies')
    })

    it('heals for 75% ATK', () => {
      expect(skill.description).toContain('75%')
    })

    it('costs 19 MP and unlocks at level 1', () => {
      expect(skill.mpCost).toBe(19)
      expect(skill.skillUnlockLevel).toBe(1)
    })
  })

  describe('Grasping Roots', () => {
    const skill = yggra.skills.find(s => s.name === 'Grasping Roots')

    it('exists and applies poison', () => {
      expect(skill).toBeDefined()
      expect(skill.effects[0].type).toBe(EffectType.POISON)
    })

    it('poisons for 50% ATK for 2 turns', () => {
      expect(skill.effects[0].atkPercent).toBe(50)
      expect(skill.effects[0].duration).toBe(2)
    })

    it('costs 15 MP and unlocks at level 1', () => {
      expect(skill.mpCost).toBe(15)
      expect(skill.skillUnlockLevel).toBe(1)
    })
  })

  describe('Bark Shield', () => {
    const skill = yggra.skills.find(s => s.name === 'Bark Shield')

    it('exists and targets ally', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
    })

    it('heals for 50% ATK', () => {
      expect(skill.description).toContain('50% ATK')
    })

    it('grants 50% thorns for 3 turns', () => {
      const thornsEffect = skill.effects.find(e => e.type === EffectType.THORNS)
      expect(thornsEffect).toBeDefined()
      expect(thornsEffect.value).toBe(50)
      expect(thornsEffect.duration).toBe(3)
    })

    it('costs 18 MP and unlocks at level 3', () => {
      expect(skill.mpCost).toBe(18)
      expect(skill.skillUnlockLevel).toBe(3)
    })
  })

  describe("Nature's Reclamation", () => {
    const skill = yggra.skills.find(s => s.name === "Nature's Reclamation")

    it('exists and targets enemy', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
    })

    it('deals 200% ATK damage', () => {
      expect(skill.description).toContain('200%')
    })

    it('heals allies for 35% of damage dealt', () => {
      expect(skill.healAlliesPercent).toBe(35)
    })

    it('costs 28 MP and unlocks at level 6', () => {
      expect(skill.mpCost).toBe(28)
      expect(skill.skillUnlockLevel).toBe(6)
    })
  })

  describe("World Root's Embrace", () => {
    const skill = yggra.skills.find(s => s.name === "World Root's Embrace")

    it('exists and targets all allies', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('all_allies')
    })

    it('applies DEATH_PREVENTION effect', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DEATH_PREVENTION)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
      expect(effect.healOnTrigger).toBe(50)
    })

    it('costs 35 MP and unlocks at level 12', () => {
      expect(skill.mpCost).toBe(35)
      expect(skill.skillUnlockLevel).toBe(12)
    })
  })
})

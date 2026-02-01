import { describe, it, expect } from 'vitest'
import { hedge_wizard } from '../3star/hedge_wizard'
import { EffectType } from '../../statusEffects'

describe('Hedge Wizard (Knarly Zeek)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(hedge_wizard.id).toBe('hedge_wizard')
      expect(hedge_wizard.name).toBe('Knarly Zeek')
    })

    it('should be a 3-star mage', () => {
      expect(hedge_wizard.rarity).toBe(3)
      expect(hedge_wizard.classId).toBe('mage')
    })

    it('should have correct base stats with MP', () => {
      expect(hedge_wizard.baseStats).toEqual({
        hp: 70,
        atk: 35,
        def: 15,
        spd: 12,
        mp: 60
      })
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(hedge_wizard.skills).toHaveLength(5)
    })

    describe('Crumble Curse (L1)', () => {
      it('should cost 14 MP and unlock at level 1', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Crumble Curse')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(14)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target enemy', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Crumble Curse')
        expect(skill.targetType).toBe('enemy')
      })

      it('should apply 10% DEF down for 4 turns', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Crumble Curse')
        const defDownEffect = skill.effects.find(e => e.type === EffectType.DEF_DOWN)
        expect(defDownEffect).toBeDefined()
        expect(defDownEffect.target).toBe('enemy')
        expect(defDownEffect.duration).toBe(4)
        expect(defDownEffect.value).toBe(10)
      })
    })

    describe('Prickly Protection (L1)', () => {
      it('should cost 16 MP and unlock at level 1', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Prickly Protection')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(16)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should be a self-targeting skill with no damage', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Prickly Protection')
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply Thorns (50% ATK damage) for 4 turns', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Prickly Protection')
        const thornsEffect = skill.effects.find(e => e.type === EffectType.THORNS)
        expect(thornsEffect).toBeDefined()
        expect(thornsEffect.target).toBe('self')
        expect(thornsEffect.duration).toBe(4)
        expect(thornsEffect.value).toBe(50)
      })
    })

    describe('Fumblefingers (L3)', () => {
      it('should cost 12 MP and unlock at level 3', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Fumblefingers')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(12)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target enemy with 90% damage multiplier', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Fumblefingers')
        expect(skill.targetType).toBe('enemy')
        expect(skill.damageMultiplier).toBe(0.9)
      })

      it('should have 50% chance to stun for 1 turn', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'Fumblefingers')
        const stunEffect = skill.effects.find(e => e.type === EffectType.STUN)
        expect(stunEffect).toBeDefined()
        expect(stunEffect.target).toBe('enemy')
        expect(stunEffect.duration).toBe(1)
        expect(stunEffect.chance).toBe(50)
      })
    })

    describe('The Ickies (L6)', () => {
      it('should cost 14 MP and unlock at level 6', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'The Ickies')
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(14)
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target enemy with no damage', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'The Ickies')
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply -3 SPD for 3 turns', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'The Ickies')
        const spdDownEffect = skill.effects.find(e => e.type === EffectType.SPD_DOWN)
        expect(spdDownEffect).toBeDefined()
        expect(spdDownEffect.target).toBe('enemy')
        expect(spdDownEffect.duration).toBe(3)
        expect(spdDownEffect.value).toBe(3)
      })

      it('should apply Poison (20% ATK) for 3 turns', () => {
        const skill = hedge_wizard.skills.find(s => s.name === 'The Ickies')
        const poisonEffect = skill.effects.find(e => e.type === EffectType.POISON)
        expect(poisonEffect).toBeDefined()
        expect(poisonEffect.target).toBe('enemy')
        expect(poisonEffect.duration).toBe(3)
        expect(poisonEffect.atkPercent).toBe(20)
      })
    })

    describe("Knarly's Special (L12)", () => {
      it('should cost 22 MP and unlock at level 12', () => {
        const skill = hedge_wizard.skills.find(s => s.name === "Knarly's Special")
        expect(skill).toBeDefined()
        expect(skill.mpCost).toBe(22)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target enemy with 120% damage multiplier', () => {
        const skill = hedge_wizard.skills.find(s => s.name === "Knarly's Special")
        expect(skill.targetType).toBe('enemy')
        expect(skill.damageMultiplier).toBe(1.2)
      })

      it('should deal 30% bonus damage per debuff on target', () => {
        const skill = hedge_wizard.skills.find(s => s.name === "Knarly's Special")
        expect(skill.bonusDamagePerDebuff).toBe(30)
      })

      it('should consume all debuffs on target', () => {
        const skill = hedge_wizard.skills.find(s => s.name === "Knarly's Special")
        expect(skill.consumeDebuffs).toBe(true)
      })
    })
  })
})

import { describe, it, expect } from 'vitest'
import { street_urchin } from '../1star/street_urchin'
import { EffectType } from '../../statusEffects'

describe('Street Urchin (Salia)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(street_urchin.id).toBe('street_urchin')
      expect(street_urchin.name).toBe('Salia')
    })

    it('should be a 1-star ranger', () => {
      expect(street_urchin.rarity).toBe(1)
      expect(street_urchin.classId).toBe('ranger')
    })

    it('should have correct base stats with MP', () => {
      expect(street_urchin.baseStats).toEqual({ hp: 50, atk: 18, def: 8, spd: 14, mp: 30 })
    })
  })

  describe('skills', () => {
    it('should have 4 skills total', () => {
      expect(street_urchin.skills).toHaveLength(4)
    })

    describe('Quick Throw (L1)', () => {
      it('should unlock at level 1 with no explicit cost', () => {
        const skill = street_urchin.skills.find(s => s.name === 'Quick Throw')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
        // Rangers use Focus, not MP - no cost specified means basic attack
        expect(skill.mpCost).toBeUndefined()
      })

      it('should deal 80% ATK damage to enemy', () => {
        const skill = street_urchin.skills.find(s => s.name === 'Quick Throw')
        expect(skill.damagePercent).toBe(80)
        expect(skill.targetType).toBe('enemy')
      })

      it('should grant an extra turn', () => {
        const skill = street_urchin.skills.find(s => s.name === 'Quick Throw')
        expect(skill.grantsExtraTurn).toBe(true)
      })
    })

    describe('Desperation (L3)', () => {
      it('should unlock at level 3', () => {
        const skill = street_urchin.skills.find(s => s.name === 'Desperation')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should deal 150% ATK damage to enemy', () => {
        const skill = street_urchin.skills.find(s => s.name === 'Desperation')
        expect(skill.damagePercent).toBe(150)
        expect(skill.targetType).toBe('enemy')
      })

      it('should apply -15% DEF debuff to self for 2 turns', () => {
        const skill = street_urchin.skills.find(s => s.name === 'Desperation')
        expect(skill.effects).toHaveLength(1)
        const defDownEffect = skill.effects[0]
        expect(defDownEffect.type).toBe(EffectType.DEF_DOWN)
        expect(defDownEffect.target).toBe('self')
        expect(defDownEffect.duration).toBe(2)
        expect(defDownEffect.value).toBe(15)
      })
    })

    describe('But Not Out (L6)', () => {
      it('should unlock at level 6', () => {
        const skill = street_urchin.skills.find(s => s.name === 'But Not Out')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target self with no damage', () => {
        const skill = street_urchin.skills.find(s => s.name === 'But Not Out')
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
      })

      it('should have conditional self buff system', () => {
        const skill = street_urchin.skills.find(s => s.name === 'But Not Out')
        expect(skill.conditionalSelfBuff).toBeDefined()
      })

      it('should have default +20% ATK buff for 2 turns', () => {
        const skill = street_urchin.skills.find(s => s.name === 'But Not Out')
        const defaultBuff = skill.conditionalSelfBuff.default
        expect(defaultBuff.type).toBe(EffectType.ATK_UP)
        expect(defaultBuff.duration).toBe(2)
        expect(defaultBuff.value).toBe(20)
      })

      it('should have conditional +30% ATK buff for 3 turns when below 50% HP', () => {
        const skill = street_urchin.skills.find(s => s.name === 'But Not Out')
        const conditional = skill.conditionalSelfBuff.conditional
        expect(conditional.condition.stat).toBe('hpPercent')
        expect(conditional.condition.below).toBe(50)
        expect(conditional.effect.type).toBe(EffectType.ATK_UP)
        expect(conditional.effect.duration).toBe(3)
        expect(conditional.effect.value).toBe(30)
      })
    })

    describe('In The Crowd (L12)', () => {
      it('should unlock at level 12', () => {
        const skill = street_urchin.skills.find(s => s.name === 'In The Crowd')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should deal 120% ATK damage to enemy', () => {
        const skill = street_urchin.skills.find(s => s.name === 'In The Crowd')
        expect(skill.damagePercent).toBe(120)
        expect(skill.targetType).toBe('enemy')
      })

      it('should make self untargetable for 2 turns', () => {
        const skill = street_urchin.skills.find(s => s.name === 'In The Crowd')
        expect(skill.effects).toHaveLength(1)
        const untargetableEffect = skill.effects[0]
        expect(untargetableEffect.type).toBe(EffectType.UNTARGETABLE)
        expect(untargetableEffect.target).toBe('self')
        expect(untargetableEffect.duration).toBe(2)
      })
    })
  })
})

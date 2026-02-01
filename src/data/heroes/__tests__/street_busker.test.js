import { describe, it, expect } from 'vitest'
import { street_busker } from '../1star/street_busker'
import { EffectType } from '../../statusEffects'

describe('Street Busker (Penny Whistler)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(street_busker.id).toBe('street_busker')
      expect(street_busker.name).toBe('Penny Whistler')
    })

    it('should be a 1-star bard', () => {
      expect(street_busker.rarity).toBe(1)
      expect(street_busker.classId).toBe('bard')
    })

    it('should have correct base stats with MP', () => {
      expect(street_busker.baseStats).toEqual({ hp: 65, atk: 15, def: 18, spd: 14, mp: 55 })
    })
  })

  describe('finale', () => {
    it('should have Discordant Shriek finale', () => {
      expect(street_busker.finale).toBeDefined()
      expect(street_busker.finale.name).toBe('Discordant Shriek')
    })

    it('should target all enemies', () => {
      expect(street_busker.finale.target).toBe('all_enemies')
    })

    it('should have damage and ATK down effects', () => {
      expect(street_busker.finale.effects).toHaveLength(2)
    })

    it('should deal 80% damage', () => {
      const damageEffect = street_busker.finale.effects.find(e => e.type === 'damage')
      expect(damageEffect).toBeDefined()
      expect(damageEffect.damagePercent).toBe(80)
    })

    it('should apply -15% ATK debuff for 2 turns', () => {
      const atkDownEffect = street_busker.finale.effects.find(e => e.type === EffectType.ATK_DOWN)
      expect(atkDownEffect).toBeDefined()
      expect(atkDownEffect.duration).toBe(2)
      expect(atkDownEffect.value).toBe(15)
    })
  })

  describe('skills', () => {
    it('should have 4 skills total', () => {
      expect(street_busker.skills).toHaveLength(4)
    })

    describe('Jarring Whistle (L1)', () => {
      it('should unlock at level 1 with no MP cost (Bard Verse system)', () => {
        const skill = street_busker.skills.find(s => s.name === 'Jarring Whistle')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
        expect(skill.mpCost).toBeUndefined()
      })

      it('should target enemy with no damage', () => {
        const skill = street_busker.skills.find(s => s.name === 'Jarring Whistle')
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply -15% DEF debuff for 2 turns', () => {
        const skill = street_busker.skills.find(s => s.name === 'Jarring Whistle')
        expect(skill.effects).toHaveLength(1)
        const defDownEffect = skill.effects[0]
        expect(defDownEffect.type).toBe(EffectType.DEF_DOWN)
        expect(defDownEffect.target).toBe('enemy')
        expect(defDownEffect.duration).toBe(2)
        expect(defDownEffect.value).toBe(15)
      })
    })

    describe('Street Racket (L3)', () => {
      it('should unlock at level 3', () => {
        const skill = street_busker.skills.find(s => s.name === 'Street Racket')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target enemy', () => {
        const skill = street_busker.skills.find(s => s.name === 'Street Racket')
        expect(skill.targetType).toBe('enemy')
      })

      it('should have 90% base damage multiplier', () => {
        const skill = street_busker.skills.find(s => s.name === 'Street Racket')
        expect(skill.damageMultiplier).toBe(0.9)
      })

      it('should deal +25% bonus damage per debuff on target', () => {
        const skill = street_busker.skills.find(s => s.name === 'Street Racket')
        expect(skill.bonusDamagePerDebuff).toBe(25)
      })
    })

    describe('Distracting Jingle (L6)', () => {
      it('should unlock at level 6', () => {
        const skill = street_busker.skills.find(s => s.name === 'Distracting Jingle')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target enemy with no damage', () => {
        const skill = street_busker.skills.find(s => s.name === 'Distracting Jingle')
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should apply -15% SPD debuff for 2 turns', () => {
        const skill = street_busker.skills.find(s => s.name === 'Distracting Jingle')
        expect(skill.effects).toHaveLength(1)
        const spdDownEffect = skill.effects[0]
        expect(spdDownEffect.type).toBe(EffectType.SPD_DOWN)
        expect(spdDownEffect.target).toBe('enemy')
        expect(spdDownEffect.duration).toBe(2)
        expect(spdDownEffect.value).toBe(15)
      })
    })

    describe('Ear-Splitting Crescendo (L12)', () => {
      it('should unlock at level 12', () => {
        const skill = street_busker.skills.find(s => s.name === 'Ear-Splitting Crescendo')
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target enemy with no damage', () => {
        const skill = street_busker.skills.find(s => s.name === 'Ear-Splitting Crescendo')
        expect(skill.targetType).toBe('enemy')
        expect(skill.noDamage).toBe(true)
      })

      it('should stun if target is debuffed', () => {
        const skill = street_busker.skills.find(s => s.name === 'Ear-Splitting Crescendo')
        expect(skill.stunIfDebuffed).toBe(true)
      })

      it('should apply -20% SPD debuff for 2 turns', () => {
        const skill = street_busker.skills.find(s => s.name === 'Ear-Splitting Crescendo')
        expect(skill.effects).toHaveLength(1)
        const spdDownEffect = skill.effects[0]
        expect(spdDownEffect.type).toBe(EffectType.SPD_DOWN)
        expect(spdDownEffect.target).toBe('enemy')
        expect(spdDownEffect.duration).toBe(2)
        expect(spdDownEffect.value).toBe(20)
      })
    })
  })
})

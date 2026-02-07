import { describe, it, expect } from 'vitest'
import { matsuda } from '../3star/matsuda'
import { EffectType } from '../../statusEffects'

describe('Matsuda the Masterless', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(matsuda.id).toBe('matsuda')
      expect(matsuda.name).toBe('Matsuda the Masterless')
    })

    it('should be a 3-star berserker', () => {
      expect(matsuda.rarity).toBe(3)
      expect(matsuda.classId).toBe('berserker')
    })

    it('should have correct base stats (no MP for berserkers)', () => {
      expect(matsuda.baseStats).toEqual({ hp: 95, atk: 38, def: 18, spd: 14 })
      expect(matsuda.baseStats.mp).toBeUndefined()
    })
  })

  describe('Bushido passive', () => {
    it('should have Bushido passive with correct name', () => {
      expect(matsuda.passive).toBeDefined()
      expect(matsuda.passive.name).toBe('Bushido')
    })

    it('should gain 1% ATK per 2% HP missing (0.5% per 1% missing)', () => {
      expect(matsuda.passive.atkPerMissingHpPercent).toBe(0.5)
    })

    it('should have max ATK bonus of 50%', () => {
      expect(matsuda.passive.maxAtkBonus).toBe(50)
    })

    it('should apply Reluctance stack when healed', () => {
      expect(matsuda.passive.onHealed).toBeDefined()
      expect(matsuda.passive.onHealed.type).toBe(EffectType.RELUCTANCE)
      expect(matsuda.passive.onHealed.stacks).toBe(1)
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(matsuda.skills).toHaveLength(5)
    })

    describe('Desperate Strike (L1)', () => {
      it('should be a 0 rage skill unlocked at level 1', () => {
        const skill = matsuda.skills.find(s => s.name === 'Desperate Strike')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(0)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should deal 90% ATK damage to enemy', () => {
        const skill = matsuda.skills.find(s => s.name === 'Desperate Strike')
        expect(skill.damagePercent).toBe(90)
        expect(skill.targetType).toBe('enemy')
      })
    })

    describe('Last Sake (L1)', () => {
      it('should be a 0 rage skill unlocked at level 1', () => {
        const skill = matsuda.skills.find(s => s.name === 'Last Sake')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(0)
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should deal 80% ATK damage', () => {
        const skill = matsuda.skills.find(s => s.name === 'Last Sake')
        expect(skill.damagePercent).toBe(80)
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 5% max HP recoil', () => {
        const skill = matsuda.skills.find(s => s.name === 'Last Sake')
        expect(skill.selfDamagePercentMaxHp).toBe(5)
      })

      it('should grant 15 rage', () => {
        const skill = matsuda.skills.find(s => s.name === 'Last Sake')
        expect(skill.rageGain).toBe(15)
      })
    })

    describe("Ronin's Pride (L3)", () => {
      it('should cost 20 rage and unlock at level 3', () => {
        const skill = matsuda.skills.find(s => s.name === "Ronin's Pride")
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(20)
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should grant +25% ATK for 2 turns', () => {
        const skill = matsuda.skills.find(s => s.name === "Ronin's Pride")
        expect(skill.targetType).toBe('self')
        expect(skill.noDamage).toBe(true)
        const atkEffect = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkEffect).toBeDefined()
        expect(atkEffect.value).toBe(25)
        expect(atkEffect.duration).toBe(2)
      })
    })

    describe('Death Before Dishonor (L6)', () => {
      it('should cost 40 rage and unlock at level 6', () => {
        const skill = matsuda.skills.find(s => s.name === 'Death Before Dishonor')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(40)
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target enemy', () => {
        const skill = matsuda.skills.find(s => s.name === 'Death Before Dishonor')
        expect(skill.targetType).toBe('enemy')
      })

      it('should have conditional damage based on HP thresholds', () => {
        const skill = matsuda.skills.find(s => s.name === 'Death Before Dishonor')
        expect(skill.conditionalDamage).toBeDefined()
        expect(skill.conditionalDamage.hpBelow50).toBe(180)
        expect(skill.conditionalDamage.hpBelow25).toBe(220)
      })

      it('should grant 30% evasion when below 25% HP', () => {
        const skill = matsuda.skills.find(s => s.name === 'Death Before Dishonor')
        expect(skill.conditionalEvasion).toBeDefined()
        expect(skill.conditionalEvasion.hpBelow25).toBe(30)
      })
    })

    describe('Glorious End (L12)', () => {
      it('should cost 60 rage with 4-turn cooldown and unlock at level 12', () => {
        const skill = matsuda.skills.find(s => s.name === 'Glorious End')
        expect(skill).toBeDefined()
        expect(skill.rageCost).toBe(60)
        expect(skill.cooldown).toBe(4)
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should be an AoE attack', () => {
        const skill = matsuda.skills.find(s => s.name === 'Glorious End')
        expect(skill.targetType).toBe('all_enemies')
      })

      it('should deal 180% base damage plus 1% per 1% HP missing', () => {
        const skill = matsuda.skills.find(s => s.name === 'Glorious End')
        expect(skill.damagePercent).toBe(180)
        expect(skill.bonusDamagePerMissingHpPercent).toBe(1)
      })

      it('should heal 20% on kill, bypassing Reluctance', () => {
        const skill = matsuda.skills.find(s => s.name === 'Glorious End')
        expect(skill.onKill).toBeDefined()
        expect(skill.onKill.healPercent).toBe(20)
        expect(skill.onKill.bypassReluctance).toBe(true)
      })
    })
  })
})

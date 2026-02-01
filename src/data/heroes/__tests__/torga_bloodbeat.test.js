import { describe, it, expect } from 'vitest'
import { torga_bloodbeat } from '../3star/torga_bloodbeat'
import { EffectType } from '../../statusEffects'

describe('Torga Bloodbeat', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(torga_bloodbeat.id).toBe('torga_bloodbeat')
      expect(torga_bloodbeat.name).toBe('Torga Bloodbeat')
    })

    it('should be a 3-star berserker', () => {
      expect(torga_bloodbeat.rarity).toBe(3)
      expect(torga_bloodbeat.classId).toBe('berserker')
    })

    it('should have correct base stats', () => {
      expect(torga_bloodbeat.baseStats).toEqual({
        hp: 85,
        atk: 35,
        def: 15,
        spd: 12
      })
    })

    it('should NOT have a leader skill (3-star)', () => {
      expect(torga_bloodbeat.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(torga_bloodbeat.skills).toHaveLength(5)
    })

    describe('Rhythm Strike', () => {
      const skill = torga_bloodbeat.skills.find(s => s.name === 'Rhythm Strike')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 0 Rage', () => {
        expect(skill.rageCost).toBe(0)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 100% ATK damage', () => {
        expect(skill.damagePercent).toBe(100)
      })

      it('should gain 10 Rage', () => {
        expect(skill.rageGain).toBe(10)
      })
    })

    describe('Blood Tempo', () => {
      const skill = torga_bloodbeat.skills.find(s => s.name === 'Blood Tempo')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should cost 0 Rage', () => {
        expect(skill.rageCost).toBe(0)
      })

      it('should target self', () => {
        expect(skill.targetType).toBe('self')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should sacrifice 15% max HP', () => {
        expect(skill.selfDamagePercentMaxHp).toBe(15)
      })

      it('should gain 30 Rage', () => {
        expect(skill.rageGain).toBe(30)
      })

      it('should grant +20% ATK for 2 turns', () => {
        const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeDefined()
        expect(atkUp.value).toBe(20)
        expect(atkUp.duration).toBe(2)
        expect(atkUp.target).toBe('self')
      })
    })

    describe('Blood Echo', () => {
      const skill = torga_bloodbeat.skills.find(s => s.name === 'Blood Echo')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should cost 20 Rage', () => {
        expect(skill.rageCost).toBe(20)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 90% ATK base damage', () => {
        expect(skill.damagePercent).toBe(90)
      })

      it('should have +30% bonus damage per Blood Tempo usage', () => {
        expect(skill.bonusDamagePerBloodTempo).toBe(30)
      })

      it('should have max +90% Blood Tempo bonus', () => {
        expect(skill.maxBloodTempoBonus).toBe(90)
      })
    })

    describe('Death Knell', () => {
      const skill = torga_bloodbeat.skills.find(s => s.name === 'Death Knell')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should cost 40 Rage', () => {
        expect(skill.rageCost).toBe(40)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 150% ATK base damage', () => {
        expect(skill.damagePercent).toBe(150)
      })

      it('should have execute bonus configuration', () => {
        expect(skill.executeBonus).toBeDefined()
        expect(skill.executeBonus.threshold).toBe(30)
        expect(skill.executeBonus.damagePercent).toBe(250)
        expect(skill.executeBonus.healSelfPercent).toBe(20)
      })
    })

    describe('Finale of Fury', () => {
      const skill = torga_bloodbeat.skills.find(s => s.name === 'Finale of Fury')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should consume all Rage', () => {
        expect(skill.rageCost).toBe('all')
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should have 50% base damage', () => {
        expect(skill.baseDamagePercent).toBe(50)
      })

      it('should have +2% damage per Rage consumed', () => {
        expect(skill.damagePerRage).toBe(2)
      })

      it('should grant 50 Rage on kill', () => {
        expect(skill.onKill).toBeDefined()
        expect(skill.onKill.rageGain).toBe(50)
      })
    })
  })
})

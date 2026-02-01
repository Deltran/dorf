import { describe, it, expect } from 'vitest'
import { vraxx_thunderskin } from '../4star/vraxx_thunderskin'
import { EffectType } from '../../statusEffects'

describe('Vraxx the Thunderskin', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(vraxx_thunderskin.id).toBe('vraxx_thunderskin')
      expect(vraxx_thunderskin.name).toBe('Vraxx the Thunderskin')
    })

    it('should be a 4-star bard', () => {
      expect(vraxx_thunderskin.rarity).toBe(4)
      expect(vraxx_thunderskin.classId).toBe('bard')
    })

    it('should have correct base stats', () => {
      expect(vraxx_thunderskin.baseStats).toEqual({
        hp: 85,
        atk: 28,
        def: 24,
        spd: 18
      })
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(vraxx_thunderskin.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(vraxx_thunderskin.skills).toHaveLength(5)
    })

    describe('Battle Cadence', () => {
      const skill = vraxx_thunderskin.skills.find(s => s.name === 'Battle Cadence')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target all allies', () => {
        expect(skill.targetType).toBe('all_allies')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant +15% ATK to all allies for 2 turns', () => {
        const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeDefined()
        expect(atkUp.value).toBe(15)
        expect(atkUp.duration).toBe(2)
        expect(atkUp.target).toBe('all_allies')
      })
    })

    describe('Fury Beat', () => {
      const skill = vraxx_thunderskin.skills.find(s => s.name === 'Fury Beat')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target all allies', () => {
        expect(skill.targetType).toBe('all_allies')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should have conditional resource or buff effect', () => {
        const effect = skill.effects[0]
        expect(effect.type).toBe('conditional_resource_or_buff')
      })

      it('should grant 15 Rage to Berserker allies', () => {
        const effect = skill.effects[0]
        expect(effect.rageGrant).toBeDefined()
        expect(effect.rageGrant.classCondition).toBe('berserker')
        expect(effect.rageGrant.amount).toBe(15)
      })

      it('should grant +15% ATK buff to non-Berserker allies', () => {
        const effect = skill.effects[0]
        expect(effect.fallbackBuff).toBeDefined()
        expect(effect.fallbackBuff.type).toBe(EffectType.ATK_UP)
        expect(effect.fallbackBuff.value).toBe(15)
        expect(effect.fallbackBuff.duration).toBe(2)
      })
    })

    describe('Warsong Strike', () => {
      const skill = vraxx_thunderskin.skills.find(s => s.name === 'Warsong Strike')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 80% ATK damage', () => {
        expect(skill.damagePercent).toBe(80)
      })

      it('should not have noDamage flag', () => {
        expect(skill.noDamage).toBeUndefined()
      })
    })

    describe('Unbreaking Tempo', () => {
      const skill = vraxx_thunderskin.skills.find(s => s.name === 'Unbreaking Tempo')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target all allies', () => {
        expect(skill.targetType).toBe('all_allies')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant +20% DEF to all allies for 2 turns', () => {
        const defUp = skill.effects.find(e => e.type === EffectType.DEF_UP)
        expect(defUp).toBeDefined()
        expect(defUp.value).toBe(20)
        expect(defUp.duration).toBe(2)
        expect(defUp.target).toBe('all_allies')
      })

      it('should grant Regen to allies below 50% HP', () => {
        const regen = skill.effects.find(e => e.type === EffectType.REGEN)
        expect(regen).toBeDefined()
        expect(regen.atkPercent).toBe(15)
        expect(regen.duration).toBe(2)
        expect(regen.target).toBe('all_allies')
        expect(regen.condition).toBeDefined()
        expect(regen.condition.hpBelow).toBe(50)
      })
    })

    describe('Drums of the Old Blood', () => {
      const skill = vraxx_thunderskin.skills.find(s => s.name === 'Drums of the Old Blood')

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target all allies', () => {
        expect(skill.targetType).toBe('all_allies')
      })

      it('should deal no direct damage', () => {
        expect(skill.noDamage).toBe(true)
      })

      it('should grant +25% ATK to all allies for 3 turns', () => {
        const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeDefined()
        expect(atkUp.value).toBe(25)
        expect(atkUp.duration).toBe(3)
        expect(atkUp.target).toBe('all_allies')
      })

      it('should grant 25 Rage to Berserker allies', () => {
        const rageGrant = skill.effects.find(e => e.type === 'rage_grant')
        expect(rageGrant).toBeDefined()
        expect(rageGrant.classCondition).toBe('berserker')
        expect(rageGrant.amount).toBe(25)
      })
    })
  })

  describe('finale', () => {
    it('should have Thunderclap Crescendo finale', () => {
      expect(vraxx_thunderskin.finale).toBeDefined()
      expect(vraxx_thunderskin.finale.name).toBe('Thunderclap Crescendo')
    })

    it('should have correct description', () => {
      expect(vraxx_thunderskin.finale.description).toContain('Consume excess Rage')
      expect(vraxx_thunderskin.finale.description).toContain('above 50')
    })

    it('should have dynamic target type', () => {
      expect(vraxx_thunderskin.finale.target).toBe('dynamic')
    })

    it('should have consume_excess_rage effect', () => {
      const effect = vraxx_thunderskin.finale.effects[0]
      expect(effect.type).toBe('consume_excess_rage')
    })

    it('should consume Rage above threshold of 50', () => {
      const effect = vraxx_thunderskin.finale.effects[0]
      expect(effect.rageThreshold).toBe(50)
    })

    it('should deal 3% ATK damage per Rage consumed', () => {
      const effect = vraxx_thunderskin.finale.effects[0]
      expect(effect.damagePerRagePercent).toBe(3)
    })

    it('should have fallback buff of +25% ATK for 2 turns when no Rage consumed', () => {
      const effect = vraxx_thunderskin.finale.effects[0]
      expect(effect.fallbackBuff).toBeDefined()
      expect(effect.fallbackBuff.type).toBe('atk_up')
      expect(effect.fallbackBuff.value).toBe(25)
      expect(effect.fallbackBuff.duration).toBe(2)
    })
  })
})

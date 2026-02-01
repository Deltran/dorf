import { describe, it, expect } from 'vitest'
import { zina_the_desperate } from '../4star/zina_the_desperate'
import { EffectType } from '../../statusEffects'

describe('Zina the Desperate', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(zina_the_desperate.id).toBe('zina_the_desperate')
      expect(zina_the_desperate.name).toBe('Zina the Desperate')
    })

    it('should be a 4-star alchemist', () => {
      expect(zina_the_desperate.rarity).toBe(4)
      expect(zina_the_desperate.classId).toBe('alchemist')
    })

    it('should have correct base stats', () => {
      expect(zina_the_desperate.baseStats).toEqual({
        hp: 75,
        atk: 38,
        def: 15,
        spd: 16,
        mp: 60
      })
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(zina_the_desperate.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(zina_the_desperate.skills).toHaveLength(5)
    })

    describe('L1: Tainted Tonic', () => {
      const taintedTonic = () => zina_the_desperate.skills.find(s => s.name === 'Tainted Tonic')

      it('should exist and be unlocked at level 1', () => {
        expect(taintedTonic()).toBeDefined()
        expect(taintedTonic().skillUnlockLevel).toBe(1)
      })

      it('should cost 10 Essence', () => {
        expect(taintedTonic().essenceCost).toBe(10)
      })

      it('should deal 90% ATK damage', () => {
        expect(taintedTonic().damagePercent).toBe(90)
      })

      it('should target a single enemy', () => {
        expect(taintedTonic().targetType).toBe('enemy')
      })

      it('should use Volatility scaling', () => {
        expect(taintedTonic().usesVolatility).toBe(true)
      })

      it('should apply POISON for 2 turns at 35% ATK', () => {
        const poisonEffect = taintedTonic().effects.find(e => e.type === EffectType.POISON)
        expect(poisonEffect).toBeDefined()
        expect(poisonEffect.target).toBe('enemy')
        expect(poisonEffect.duration).toBe(2)
        expect(poisonEffect.atkPercent).toBe(35)
      })
    })

    describe('L1: Tainted Feast', () => {
      const taintedFeast = () => zina_the_desperate.skills.find(s => s.name === 'Tainted Feast')

      it('should exist and be unlocked at level 1', () => {
        expect(taintedFeast()).toBeDefined()
        expect(taintedFeast().skillUnlockLevel).toBe(1)
      })

      it('should cost 20 Essence', () => {
        expect(taintedFeast().essenceCost).toBe(20)
      })

      it('should target all enemies with no direct damage', () => {
        expect(taintedFeast().targetType).toBe('all_enemies')
        expect(taintedFeast().noDamage).toBe(true)
      })

      it('should use Volatility scaling', () => {
        expect(taintedFeast().usesVolatility).toBe(true)
      })

      it('should deal 15% max HP self-damage', () => {
        expect(taintedFeast().selfDamagePercentMaxHp).toBe(15)
      })

      it('should apply POISON for 3 turns at 45% ATK to all enemies', () => {
        const poisonEffect = taintedFeast().effects.find(e => e.type === EffectType.POISON)
        expect(poisonEffect).toBeDefined()
        expect(poisonEffect.target).toBe('all_enemies')
        expect(poisonEffect.duration).toBe(3)
        expect(poisonEffect.atkPercent).toBe(45)
      })
    })

    describe('L3: Cornered Animal (Passive)', () => {
      const corneredAnimal = () => zina_the_desperate.skills.find(s => s.name === 'Cornered Animal')

      it('should exist and be unlocked at level 3', () => {
        expect(corneredAnimal()).toBeDefined()
        expect(corneredAnimal().skillUnlockLevel).toBe(3)
      })

      it('should be a passive skill', () => {
        expect(corneredAnimal().isPassive).toBe(true)
        expect(corneredAnimal().passiveType).toBe('lowHpTrigger')
      })

      it('should trigger below 30% HP', () => {
        expect(corneredAnimal().triggerBelowHpPercent).toBe(30)
      })

      it('should only trigger once per battle', () => {
        expect(corneredAnimal().oncePerBattle).toBe(true)
      })

      it('should grant ATK_UP +40% for 2 turns', () => {
        const atkEffect = corneredAnimal().triggerEffects.find(e => e.type === EffectType.ATK_UP)
        expect(atkEffect).toBeDefined()
        expect(atkEffect.target).toBe('self')
        expect(atkEffect.duration).toBe(2)
        expect(atkEffect.value).toBe(40)
      })

      it('should grant SPD_UP +30% for 2 turns', () => {
        const spdEffect = corneredAnimal().triggerEffects.find(e => e.type === EffectType.SPD_UP)
        expect(spdEffect).toBeDefined()
        expect(spdEffect.target).toBe('self')
        expect(spdEffect.duration).toBe(2)
        expect(spdEffect.value).toBe(30)
      })
    })

    describe("L6: Death's Needle", () => {
      const deathsNeedle = () => zina_the_desperate.skills.find(s => s.name === "Death's Needle")

      it('should exist and be unlocked at level 6', () => {
        expect(deathsNeedle()).toBeDefined()
        expect(deathsNeedle().skillUnlockLevel).toBe(6)
      })

      it('should cost 25 Essence', () => {
        expect(deathsNeedle().essenceCost).toBe(25)
      })

      it('should deal 175% ATK damage', () => {
        expect(deathsNeedle().damagePercent).toBe(175)
      })

      it('should target a single enemy', () => {
        expect(deathsNeedle().targetType).toBe('enemy')
      })

      it('should use Volatility scaling', () => {
        expect(deathsNeedle().usesVolatility).toBe(true)
      })

      it('should have conditional effects at low HP', () => {
        expect(deathsNeedle().conditionalAtLowHp).toBeDefined()
        expect(deathsNeedle().conditionalAtLowHp.hpThreshold).toBe(30)
        expect(deathsNeedle().conditionalAtLowHp.ignoresDef).toBe(true)
        expect(deathsNeedle().conditionalAtLowHp.cannotMiss).toBe(true)
      })
    })

    describe('L12: Last Breath (Passive)', () => {
      const lastBreath = () => zina_the_desperate.skills.find(s => s.name === 'Last Breath')

      it('should exist and be unlocked at level 12', () => {
        expect(lastBreath()).toBeDefined()
        expect(lastBreath().skillUnlockLevel).toBe(12)
      })

      it('should be a passive skill', () => {
        expect(lastBreath().isPassive).toBe(true)
        expect(lastBreath().passiveType).toBe('onDeath')
      })

      it('should deal 175% ATK damage to random enemy on death', () => {
        expect(lastBreath().onDeath).toBeDefined()
        expect(lastBreath().onDeath.damage.damagePercent).toBe(175)
        expect(lastBreath().onDeath.damage.targetType).toBe('random_enemy')
      })

      it('should poison all enemies for 3 turns on death', () => {
        const poisonEffect = lastBreath().onDeath.effects.find(e => e.type === EffectType.POISON)
        expect(poisonEffect).toBeDefined()
        expect(poisonEffect.target).toBe('all_enemies')
        expect(poisonEffect.duration).toBe(3)
        expect(poisonEffect.atkPercent).toBe(50)
      })
    })
  })
})

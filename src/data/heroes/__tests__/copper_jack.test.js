import { describe, it, expect } from 'vitest'
import { copper_jack } from '../4star/copper_jack'
import { EffectType } from '../../statusEffects'

describe('Copper Jack', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(copper_jack.id).toBe('copper_jack')
      expect(copper_jack.name).toBe('Copper Jack')
    })

    it('should be a 4-star berserker', () => {
      expect(copper_jack.rarity).toBe(4)
      expect(copper_jack.classId).toBe('berserker')
    })

    it('should have correct base stats', () => {
      expect(copper_jack.baseStats).toEqual({
        hp: 95,
        atk: 45,
        def: 20,
        spd: 14
      })
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(copper_jack.leaderSkill).toBeUndefined()
    })
  })

  describe('coin flip mechanic', () => {
    it('should have coin flip enabled', () => {
      expect(copper_jack.hasCoinFlip).toBe(true)
    })

    it('should have heads effect with 2.5x damage multiplier on first hit', () => {
      expect(copper_jack.coinFlipEffects.heads).toBeDefined()
      expect(copper_jack.coinFlipEffects.heads.damageMultiplier).toBe(2.5)
      expect(copper_jack.coinFlipEffects.heads.firstHitOnly).toBe(true)
    })

    it('should have tails effect with 15% self-damage and 25 rage gain', () => {
      expect(copper_jack.coinFlipEffects.tails).toBeDefined()
      expect(copper_jack.coinFlipEffects.tails.selfDamagePercent).toBe(15)
      expect(copper_jack.coinFlipEffects.tails.rageGain).toBe(25)
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(copper_jack.skills).toHaveLength(5)
    })

    describe('L1: Weighted Toss', () => {
      const weightedToss = () => copper_jack.skills.find(s => s.name === 'Weighted Toss')

      it('should exist and be unlocked at level 1', () => {
        expect(weightedToss()).toBeDefined()
        expect(weightedToss().skillUnlockLevel).toBe(1)
      })

      it('should cost 20 Rage', () => {
        expect(weightedToss().rageCost).toBe(20)
      })

      it('should deal 120% ATK damage', () => {
        expect(weightedToss().damagePercent).toBe(120)
      })

      it('should target a single enemy', () => {
        expect(weightedToss().targetType).toBe('enemy')
      })

      it('should have +40% bonus damage if coin was flipped', () => {
        expect(weightedToss().coinFlipBonus).toBe(40)
      })
    })

    describe('L1: All In', () => {
      const allIn = () => copper_jack.skills.find(s => s.name === 'All In')

      it('should exist and be unlocked at level 1', () => {
        expect(allIn()).toBeDefined()
        expect(allIn().skillUnlockLevel).toBe(1)
      })

      it('should cost 35 Rage', () => {
        expect(allIn().rageCost).toBe(35)
      })

      it('should deal 90% ATK damage', () => {
        expect(allIn().damagePercent).toBe(90)
      })

      it('should target a single enemy', () => {
        expect(allIn().targetType).toBe('enemy')
      })

      it('should hit twice with independent coin flips', () => {
        expect(allIn().multiHit).toBe(2)
        expect(allIn().perHitCoinFlip).toBe(true)
      })

      it('should have 2x multiplier on heads and 0.5x on tails per hit', () => {
        expect(allIn().headsMultiplier).toBe(2)
        expect(allIn().tailsMultiplier).toBe(0.5)
      })
    })

    describe("L3: Copper's Curse", () => {
      const coppersCurse = () => copper_jack.skills.find(s => s.name === "Copper's Curse")

      it('should exist and be unlocked at level 3', () => {
        expect(coppersCurse()).toBeDefined()
        expect(coppersCurse().skillUnlockLevel).toBe(3)
      })

      it('should consume all Rage', () => {
        expect(coppersCurse().rageCost).toBe('all')
      })

      it('should target self with no damage', () => {
        expect(coppersCurse().targetType).toBe('self')
        expect(coppersCurse().noDamage).toBe(true)
      })

      it('should grant +8% ATK per 10 Rage consumed', () => {
        expect(coppersCurse().atkPerRage).toBe(8)
        expect(coppersCurse().ragePerStack).toBe(10)
      })

      it('should have 3 turn duration for stacks', () => {
        expect(coppersCurse().stackDuration).toBe(3)
      })
    })

    describe('L6: Double Down', () => {
      const doubleDown = () => copper_jack.skills.find(s => s.name === 'Double Down')

      it('should exist and be unlocked at level 6', () => {
        expect(doubleDown()).toBeDefined()
        expect(doubleDown().skillUnlockLevel).toBe(6)
      })

      it('should cost 40 Rage', () => {
        expect(doubleDown().rageCost).toBe(40)
      })

      it('should deal 150% ATK damage normally', () => {
        expect(doubleDown().damagePercent).toBe(150)
      })

      it('should target a single enemy', () => {
        expect(doubleDown().targetType).toBe('enemy')
      })

      it('should deal 250% if self-damage was taken this turn', () => {
        expect(doubleDown().selfDamageBonusPercent).toBe(250)
      })
    })

    describe('L12: Jackpot', () => {
      const jackpot = () => copper_jack.skills.find(s => s.name === 'Jackpot')

      it('should exist and be unlocked at level 12', () => {
        expect(jackpot()).toBeDefined()
        expect(jackpot().skillUnlockLevel).toBe(12)
      })

      it('should cost 50 Rage', () => {
        expect(jackpot().rageCost).toBe(50)
      })

      it('should target a single enemy', () => {
        expect(jackpot().targetType).toBe('enemy')
      })

      it('should flip 5 coins', () => {
        expect(jackpot().jackpotFlips).toBe(5)
      })

      it('should deal 60% ATK per heads', () => {
        expect(jackpot().damagePerHeads).toBe(60)
      })

      it('should grant +15 Rage and +5% ATK per tails', () => {
        expect(jackpot().ragePerTails).toBe(15)
        expect(jackpot().atkPerTails).toBe(5)
        expect(jackpot().atkDuration).toBe(3)
      })
    })
  })
})

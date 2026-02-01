import { describe, it, expect } from 'vitest'
import { penny_dreadful } from '../4star/penny_dreadful'
import { EffectType } from '../../statusEffects'

describe('Penny Dreadful', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(penny_dreadful.id).toBe('penny_dreadful')
      expect(penny_dreadful.name).toBe('Penny Dreadful')
    })

    it('should be a 4-star alchemist', () => {
      expect(penny_dreadful.rarity).toBe(4)
      expect(penny_dreadful.classId).toBe('alchemist')
    })

    it('should have correct base stats', () => {
      expect(penny_dreadful.baseStats).toEqual({
        hp: 78,
        atk: 36,
        def: 16,
        spd: 15,
        mp: 65
      })
    })

    it('should have epithet and intro quote', () => {
      expect(penny_dreadful.epithet).toBe('The Tidy Terror')
      expect(penny_dreadful.introQuote).toBe("Don't you worry, yah! Penny'll sort you out right proper!")
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(penny_dreadful.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(penny_dreadful.skills).toHaveLength(5)
    })

    describe('L1: A Spot of Tea', () => {
      const spotOfTea = () => penny_dreadful.skills.find(s => s.name === 'A Spot of Tea')

      it('should exist and be unlocked at level 1', () => {
        expect(spotOfTea()).toBeDefined()
        expect(spotOfTea().skillUnlockLevel).toBe(1)
      })

      it('should cost 12 Essence', () => {
        expect(spotOfTea().essenceCost).toBe(12)
      })

      it('should deal 80% ATK damage', () => {
        expect(spotOfTea().damagePercent).toBe(80)
      })

      it('should target a single enemy', () => {
        expect(spotOfTea().targetType).toBe('enemy')
      })

      it('should use Volatility scaling', () => {
        expect(spotOfTea().usesVolatility).toBe(true)
      })

      it('should apply POISON for 2 turns at 25% ATK', () => {
        const poisonEffect = spotOfTea().effects.find(e => e.type === EffectType.POISON)
        expect(poisonEffect).toBeDefined()
        expect(poisonEffect.target).toBe('enemy')
        expect(poisonEffect.duration).toBe(2)
        expect(poisonEffect.atkPercent).toBe(25)
      })
    })

    describe('L1: The Good Silver', () => {
      const goodSilver = () => penny_dreadful.skills.find(s => s.name === 'The Good Silver')

      it('should exist and be unlocked at level 1', () => {
        expect(goodSilver()).toBeDefined()
        expect(goodSilver().skillUnlockLevel).toBe(1)
      })

      it('should cost 15 Essence', () => {
        expect(goodSilver().essenceCost).toBe(15)
      })

      it('should deal 70% ATK damage', () => {
        expect(goodSilver().damagePercent).toBe(70)
      })

      it('should target a single enemy', () => {
        expect(goodSilver().targetType).toBe('enemy')
      })

      it('should apply SPD_DOWN -20% for 2 turns', () => {
        const spdDownEffect = goodSilver().effects.find(e => e.type === EffectType.SPD_DOWN)
        expect(spdDownEffect).toBeDefined()
        expect(spdDownEffect.target).toBe('enemy')
        expect(spdDownEffect.duration).toBe(2)
        expect(spdDownEffect.value).toBe(20)
      })

      it('should apply ATK_DOWN -15% for 2 turns', () => {
        const atkDownEffect = goodSilver().effects.find(e => e.type === EffectType.ATK_DOWN)
        expect(atkDownEffect).toBeDefined()
        expect(atkDownEffect.target).toBe('enemy')
        expect(atkDownEffect.duration).toBe(2)
        expect(atkDownEffect.value).toBe(15)
      })
    })

    describe('L3: Poison Cocktail', () => {
      const poisonCocktail = () => penny_dreadful.skills.find(s => s.name === 'Poison Cocktail')

      it('should exist and be unlocked at level 3', () => {
        expect(poisonCocktail()).toBeDefined()
        expect(poisonCocktail().skillUnlockLevel).toBe(3)
      })

      it('should cost 20 Essence', () => {
        expect(poisonCocktail().essenceCost).toBe(20)
      })

      it('should deal 100% ATK damage', () => {
        expect(poisonCocktail().damagePercent).toBe(100)
      })

      it('should target a single enemy', () => {
        expect(poisonCocktail().targetType).toBe('enemy')
      })

      it('should have debuff threshold system', () => {
        expect(poisonCocktail().debuffThresholds).toBeDefined()
      })

      it('should apply Mark at 2+ debuffs with 25% value', () => {
        expect(poisonCocktail().debuffThresholds.at2.type).toBe('marked')
        expect(poisonCocktail().debuffThresholds.at2.duration).toBe(2)
        expect(poisonCocktail().debuffThresholds.at2.value).toBe(25)
      })

      it('should apply stronger Mark at 3+ debuffs with 35% value', () => {
        expect(poisonCocktail().debuffThresholds.at3.type).toBe('marked')
        expect(poisonCocktail().debuffThresholds.at3.duration).toBe(2)
        expect(poisonCocktail().debuffThresholds.at3.value).toBe(35)
      })

      it('should refresh all debuffs by 1 turn at 4+ debuffs', () => {
        expect(poisonCocktail().debuffThresholds.at4.refreshAllDebuffs).toBe(1)
      })
    })

    describe('L6: Spring Cleaning', () => {
      const springCleaning = () => penny_dreadful.skills.find(s => s.name === 'Spring Cleaning')

      it('should exist and be unlocked at level 6', () => {
        expect(springCleaning()).toBeDefined()
        expect(springCleaning().skillUnlockLevel).toBe(6)
      })

      it('should cost 18 Essence', () => {
        expect(springCleaning().essenceCost).toBe(18)
      })

      it('should target all allies with no damage', () => {
        expect(springCleaning().targetType).toBe('all_allies')
        expect(springCleaning().noDamage).toBe(true)
      })

      it('should cleanse 1 debuff from each ally', () => {
        expect(springCleaning().cleanseDebuffs).toBe(1)
      })

      it('should grant DEF_UP +15% for 2 turns if debuff was cleansed', () => {
        expect(springCleaning().ifCleansed).toBeDefined()
        expect(springCleaning().ifCleansed.type).toBe('def_up')
        expect(springCleaning().ifCleansed.duration).toBe(2)
        expect(springCleaning().ifCleansed.value).toBe(15)
      })
    })

    describe('L12: Tidy Up', () => {
      const tidyUp = () => penny_dreadful.skills.find(s => s.name === 'Tidy Up')

      it('should exist and be unlocked at level 12', () => {
        expect(tidyUp()).toBeDefined()
        expect(tidyUp().skillUnlockLevel).toBe(12)
      })

      it('should cost 28 Essence', () => {
        expect(tidyUp().essenceCost).toBe(28)
      })

      it('should deal 70% ATK damage', () => {
        expect(tidyUp().damagePercent).toBe(70)
      })

      it('should target all enemies', () => {
        expect(tidyUp().targetType).toBe('all_enemies')
      })

      it('should have +20% bonus damage per debuff on target', () => {
        expect(tidyUp().bonusDamagePerDebuff).toBe(20)
      })

      it('should cap bonus damage at +100%', () => {
        expect(tidyUp().maxBonusDamage).toBe(100)
      })
    })
  })
})

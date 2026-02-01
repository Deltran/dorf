import { describe, it, expect } from 'vitest'
import { fortuna_inversus } from '../5star/fortuna_inversus'
import { EffectType } from '../../statusEffects'

describe('Fortuna Inversus', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(fortuna_inversus.id).toBe('fortuna_inversus')
      expect(fortuna_inversus.name).toBe('Fortuna Inversus')
    })

    it('should be a 5-star bard', () => {
      expect(fortuna_inversus.rarity).toBe(5)
      expect(fortuna_inversus.classId).toBe('bard')
    })

    it('should have correct base stats', () => {
      expect(fortuna_inversus.baseStats).toEqual({
        hp: 90,
        atk: 26,
        def: 24,
        spd: 14,
        mp: 65
      })
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(fortuna_inversus.skills).toHaveLength(5)
    })

    describe('Fickle Fortune', () => {
      const skill = fortuna_inversus.skills.find(s => s.name === 'Fickle Fortune')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 110% ATK damage', () => {
        expect(skill.damagePercent).toBe(110)
      })

      it('should apply a random debuff with 100% chance', () => {
        expect(skill.randomDebuff).toBeDefined()
        expect(skill.randomDebuff.chance).toBe(1.0)
      })

      it('should have ATK_DOWN and SPD_DOWN as random options', () => {
        const options = skill.randomDebuff.options
        expect(options).toHaveLength(2)

        const atkDown = options.find(o => o.type === EffectType.ATK_DOWN)
        expect(atkDown).toBeDefined()
        expect(atkDown.value).toBe(15)
        expect(atkDown.duration).toBe(2)

        const spdDown = options.find(o => o.type === EffectType.SPD_DOWN)
        expect(spdDown).toBeDefined()
        expect(spdDown.value).toBe(15)
        expect(spdDown.duration).toBe(2)
      })
    })

    describe('Double or Nothing', () => {
      const skill = fortuna_inversus.skills.find(s => s.name === 'Double or Nothing')

      it('should exist and unlock at level 1', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(1)
      })

      it('should target ally with no damage', () => {
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
      })

      it('should grant 20% ATK buff for 2 turns', () => {
        const atkUp = skill.effects.find(e => e.type === EffectType.ATK_UP)
        expect(atkUp).toBeDefined()
        expect(atkUp.value).toBe(20)
        expect(atkUp.duration).toBe(2)
        expect(atkUp.target).toBe('ally')
      })

      it('should have 50% bonus chance for DEF buff', () => {
        expect(skill.bonusChance).toBeDefined()
        expect(skill.bonusChance.chance).toBe(0.5)
        expect(skill.bonusChance.effect.type).toBe(EffectType.DEF_UP)
        expect(skill.bonusChance.effect.value).toBe(20)
        expect(skill.bonusChance.effect.duration).toBe(2)
      })
    })

    describe('Loaded Dice', () => {
      const skill = fortuna_inversus.skills.find(s => s.name === 'Loaded Dice')

      it('should exist and unlock at level 3', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(3)
      })

      it('should target ally with no damage', () => {
        expect(skill.targetType).toBe('ally')
        expect(skill.noDamage).toBe(true)
      })

      it('should cost Fortuna 10% max HP', () => {
        expect(skill.selfDamagePercent).toBe(10)
      })

      it('should grant 25% Evasion for 3 turns', () => {
        const evasion = skill.effects.find(e => e.type === EffectType.EVASION)
        expect(evasion).toBeDefined()
        expect(evasion.value).toBe(25)
        expect(evasion.duration).toBe(3)
        expect(evasion.target).toBe('ally')
      })
    })

    describe('House Always Wins', () => {
      const skill = fortuna_inversus.skills.find(s => s.name === 'House Always Wins')

      it('should exist and unlock at level 6', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(6)
      })

      it('should target all enemies with no damage', () => {
        expect(skill.targetType).toBe('all_enemies')
        expect(skill.noDamage).toBe(true)
      })

      it('should remove 1 random buff from each enemy', () => {
        expect(skill.removeRandomBuff).toBe(1)
      })

      it('should grant Fortuna +5% ATK per buff removed', () => {
        expect(skill.atkStackPerBuff).toBe(5)
        expect(skill.stackDuration).toBe(3)
      })
    })

    describe("Gambler's Ruin", () => {
      const skill = fortuna_inversus.skills.find(s => s.name === "Gambler's Ruin")

      it('should exist and unlock at level 12', () => {
        expect(skill).toBeDefined()
        expect(skill.skillUnlockLevel).toBe(12)
      })

      it('should target enemy', () => {
        expect(skill.targetType).toBe('enemy')
      })

      it('should deal 150% ATK damage normally', () => {
        expect(skill.damagePercent).toBe(150)
      })

      it('should deal 200% ATK damage if target has debuffs', () => {
        expect(skill.debuffBonusPercent).toBe(200)
      })

      it('should extend debuffs by 1 turn', () => {
        expect(skill.extendDebuffs).toBe(1)
      })
    })
  })

  describe('finale', () => {
    it('should have Wheel of Reversal finale', () => {
      expect(fortuna_inversus.finale).toBeDefined()
      expect(fortuna_inversus.finale.name).toBe('Wheel of Reversal')
    })

    it('should be a fortune swap finale', () => {
      expect(fortuna_inversus.finale.isFortuneSwap).toBe(true)
    })

    it('should have swap pairs for stat effects', () => {
      const swapPairs = fortuna_inversus.finale.swapPairs
      expect(swapPairs[EffectType.ATK_UP]).toBe(EffectType.ATK_DOWN)
      expect(swapPairs[EffectType.ATK_DOWN]).toBe(EffectType.ATK_UP)
      expect(swapPairs[EffectType.DEF_UP]).toBe(EffectType.DEF_DOWN)
      expect(swapPairs[EffectType.DEF_DOWN]).toBe(EffectType.DEF_UP)
      expect(swapPairs[EffectType.SPD_UP]).toBe(EffectType.SPD_DOWN)
      expect(swapPairs[EffectType.SPD_DOWN]).toBe(EffectType.SPD_UP)
    })

    it('should have swap pairs for DoT/HoT effects', () => {
      const swapPairs = fortuna_inversus.finale.swapPairs
      expect(swapPairs[EffectType.REGEN]).toBe(EffectType.POISON)
      expect(swapPairs[EffectType.POISON]).toBe(EffectType.REGEN)
      expect(swapPairs[EffectType.BURN]).toBe(EffectType.REGEN)
    })

    it('should have a dispel list for non-swappable effects', () => {
      const dispelList = fortuna_inversus.finale.dispelList
      expect(dispelList).toContain(EffectType.STUN)
      expect(dispelList).toContain(EffectType.SLEEP)
      expect(dispelList).toContain(EffectType.SHIELD)
      expect(dispelList).toContain(EffectType.TAUNT)
      expect(dispelList).toContain(EffectType.DIVINE_SACRIFICE)
      expect(dispelList).toContain(EffectType.DEATH_PREVENTION)
    })

    it('should have empty fallback with random effect options', () => {
      const fallback = fortuna_inversus.finale.emptyFallback
      expect(fallback).toBeDefined()
      expect(fallback.message).toBe('The wheel spins... but fate holds steady')
      expect(fallback.randomEffect).toBe(true)
      expect(fallback.options).toHaveLength(4)
    })
  })

  describe('leader skill', () => {
    it('should have Fortune Favors the Bold leader skill', () => {
      expect(fortuna_inversus.leaderSkill).toBeDefined()
      expect(fortuna_inversus.leaderSkill.name).toBe('Fortune Favors the Bold')
    })

    it('should have correct description', () => {
      expect(fortuna_inversus.leaderSkill.description).toBe('Allies below 50% HP gain +20% ATK')
    })

    it('should be a passive effect', () => {
      const effect = fortuna_inversus.leaderSkill.effects[0]
      expect(effect.type).toBe('passive')
    })

    it('should grant +20% ATK to allies below 50% HP', () => {
      const effect = fortuna_inversus.leaderSkill.effects[0]
      expect(effect.stat).toBe('atk')
      expect(effect.value).toBe(20)
      expect(effect.condition.hpBelow).toBe(50)
    })
  })
})

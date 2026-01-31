import { describe, it, expect } from 'vitest'
import { shinobi_jin } from '../4star/shinobi_jin'
import { EffectType } from '../../statusEffects'

describe('Shinobi Jin', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(shinobi_jin.id).toBe('shinobi_jin')
      expect(shinobi_jin.name).toBe('Shinobi Jin')
    })

    it('should be a 4-star ranger', () => {
      expect(shinobi_jin.rarity).toBe(4)
      expect(shinobi_jin.classId).toBe('ranger')
    })

    it('should have correct base stats', () => {
      expect(shinobi_jin.baseStats).toEqual({
        hp: 85,
        atk: 40,
        def: 18,
        spd: 22,
        mp: 55
      })
    })
  })

  describe('passive: Kage no Mai (Shadow Dance)', () => {
    it('should have Kage no Mai passive', () => {
      expect(shinobi_jin.passive).toBeDefined()
      expect(shinobi_jin.passive.name).toBe('Kage no Mai')
    })

    it('should grant 10% Evasion for 1 turn on skill use', () => {
      expect(shinobi_jin.passive.onSkillUse).toBeDefined()
      expect(shinobi_jin.passive.onSkillUse.type).toBe(EffectType.EVASION)
      expect(shinobi_jin.passive.onSkillUse.value).toBe(10)
      expect(shinobi_jin.passive.onSkillUse.duration).toBe(1)
    })

    it('should stack evasion up to 30%', () => {
      expect(shinobi_jin.passive.onSkillUse.maxStacks).toBe(30)
    })
  })

  describe('skills', () => {
    it('should have 5 skills', () => {
      expect(shinobi_jin.skills).toHaveLength(5)
    })

    describe('L1: Kunai', () => {
      const kunai = () => shinobi_jin.skills.find(s => s.name === 'Kunai')

      it('should exist and be unlocked at level 1', () => {
        expect(kunai()).toBeDefined()
        expect(kunai().skillUnlockLevel).toBe(1)
      })

      it('should cost 0 MP (free skill)', () => {
        expect(kunai().mpCost).toBeFalsy()
        expect(kunai().focusCost).toBeFalsy()
      })

      it('should deal 70% ATK damage', () => {
        expect(kunai().damagePercent).toBe(70)
      })

      it('should target a single enemy', () => {
        expect(kunai().targetType).toBe('enemy')
      })

      it('should apply Poison effect for 2 turns', () => {
        const poisonEffect = kunai().effects.find(e => e.type === EffectType.POISON)
        expect(poisonEffect).toBeDefined()
        expect(poisonEffect.duration).toBe(2)
        expect(poisonEffect.target).toBe('enemy')
      })

      it('should have ifMarked conditional for extended poison duration', () => {
        expect(kunai().ifMarked).toBeDefined()
        expect(kunai().ifMarked.extendDuration).toBe(1)
      })
    })

    describe('L1: Shi no In / Death Mark', () => {
      const deathMark = () => shinobi_jin.skills.find(s => s.name === 'Shi no In')

      it('should exist and be unlocked at level 1', () => {
        expect(deathMark()).toBeDefined()
        expect(deathMark().skillUnlockLevel).toBe(1)
      })

      it('should cost 0 MP (free skill)', () => {
        expect(deathMark().mpCost).toBeFalsy()
        expect(deathMark().focusCost).toBeFalsy()
      })

      it('should deal no damage', () => {
        expect(deathMark().noDamage).toBe(true)
      })

      it('should apply Mark for 3 turns with +15% damage from Jin', () => {
        const markEffect = deathMark().effects.find(e => e.type === EffectType.MARKED)
        expect(markEffect).toBeDefined()
        expect(markEffect.duration).toBe(3)
        expect(markEffect.value).toBe(15)
        expect(markEffect.target).toBe('enemy')
      })

      it('should grant Stealth for 1 turn on kill', () => {
        expect(deathMark().onKill).toBeDefined()
        expect(deathMark().onKill.type).toBe(EffectType.STEALTH)
        expect(deathMark().onKill.duration).toBe(1)
        expect(deathMark().onKill.target).toBe('self')
      })
    })

    describe('L3: Kusari Fundo / Chain Strike', () => {
      const chainStrike = () => shinobi_jin.skills.find(s => s.name === 'Kusari Fundo')

      it('should exist and be unlocked at level 3', () => {
        expect(chainStrike()).toBeDefined()
        expect(chainStrike().skillUnlockLevel).toBe(3)
      })

      it('should cost 25 Focus', () => {
        expect(chainStrike().focusCost).toBe(25)
      })

      it('should deal 70% ATK damage to all enemies', () => {
        expect(chainStrike().damagePercent).toBe(70)
        expect(chainStrike().targetType).toBe('all_enemies')
      })

      it('should deal 90% ATK to Marked enemies', () => {
        expect(chainStrike().ifMarked).toBeDefined()
        expect(chainStrike().ifMarked.damagePercent).toBe(90)
      })
    })

    describe('L6: Ansatsu / Assassinate', () => {
      const assassinate = () => shinobi_jin.skills.find(s => s.name === 'Ansatsu')

      it('should exist and be unlocked at level 6', () => {
        expect(assassinate()).toBeDefined()
        expect(assassinate().skillUnlockLevel).toBe(6)
      })

      it('should cost 35 Focus', () => {
        expect(assassinate().focusCost).toBe(35)
      })

      it('should have 4-turn cooldown', () => {
        expect(assassinate().cooldown).toBe(4)
      })

      it('should deal 180% ATK damage', () => {
        expect(assassinate().damagePercent).toBe(180)
      })

      it('should target a single enemy', () => {
        expect(assassinate().targetType).toBe('enemy')
      })

      it('should execute enemies below 30% HP', () => {
        expect(assassinate().executeThreshold).toBe(30)
      })

      it('should have 35% execute threshold when target is Marked', () => {
        expect(assassinate().ifMarked).toBeDefined()
        expect(assassinate().ifMarked.executeThreshold).toBe(35)
      })

      it('should reset cooldown on execute of Marked target', () => {
        expect(assassinate().ifMarked.onExecute).toBeDefined()
        expect(assassinate().ifMarked.onExecute.resetCooldown).toBe(true)
      })
    })

    describe('L12: Kemuri Dama / Smoke Bomb', () => {
      const smokeBomb = () => shinobi_jin.skills.find(s => s.name === 'Kemuri Dama')

      it('should exist and be unlocked at level 12', () => {
        expect(smokeBomb()).toBeDefined()
        expect(smokeBomb().skillUnlockLevel).toBe(12)
      })

      it('should cost 50 Focus', () => {
        expect(smokeBomb().focusCost).toBe(50)
      })

      it('should have 5-turn cooldown', () => {
        expect(smokeBomb().cooldown).toBe(5)
      })

      it('should deal no damage', () => {
        expect(smokeBomb().noDamage).toBe(true)
      })

      it('should grant 40% Evasion to all allies for 2 turns', () => {
        const evasionEffect = smokeBomb().effects.find(
          e => e.type === EffectType.EVASION && e.target === 'all_allies'
        )
        expect(evasionEffect).toBeDefined()
        expect(evasionEffect.value).toBe(40)
        expect(evasionEffect.duration).toBe(2)
      })

      it('should grant Jin Stealth for 2 turns', () => {
        const stealthEffect = smokeBomb().effects.find(
          e => e.type === EffectType.STEALTH && e.target === 'self'
        )
        expect(stealthEffect).toBeDefined()
        expect(stealthEffect.duration).toBe(2)
      })
    })
  })
})

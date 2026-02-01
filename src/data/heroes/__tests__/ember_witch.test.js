import { describe, it, expect } from 'vitest'
import { ember_witch } from '../4star/ember_witch'
import { EffectType } from '../../statusEffects'

describe('Ember Witch (Shasha)', () => {
  describe('basic properties', () => {
    it('should have correct id and name', () => {
      expect(ember_witch.id).toBe('ember_witch')
      expect(ember_witch.name).toBe('Shasha Ember Witch')
    })

    it('should be a 4-star mage', () => {
      expect(ember_witch.rarity).toBe(4)
      expect(ember_witch.classId).toBe('mage')
    })

    it('should have correct base stats', () => {
      expect(ember_witch.baseStats).toEqual({
        hp: 85,
        atk: 45,
        def: 20,
        spd: 14,
        mp: 70
      })
    })

    it('should NOT have a leader skill (4-star)', () => {
      expect(ember_witch.leaderSkill).toBeUndefined()
    })
  })

  describe('skills', () => {
    it('should have 5 skills total', () => {
      expect(ember_witch.skills).toHaveLength(5)
    })

    describe('L1: Fireball', () => {
      const fireball = () => ember_witch.skills.find(s => s.name === 'Fireball')

      it('should exist and be unlocked at level 1', () => {
        expect(fireball()).toBeDefined()
        expect(fireball().skillUnlockLevel).toBe(1)
      })

      it('should cost 20 MP', () => {
        expect(fireball().mpCost).toBe(20)
      })

      it('should deal 130% ATK damage to primary target', () => {
        expect(fireball().damagePercent).toBe(130)
        expect(fireball().targetType).toBe('enemy')
      })

      it('should splash to 2 other enemies at 50% damage', () => {
        expect(fireball().splashCount).toBe(2)
        expect(fireball().splashDamagePercent).toBe(50)
      })
    })

    describe('L1: Flame Shield', () => {
      const flameShield = () => ember_witch.skills.find(s => s.name === 'Flame Shield')

      it('should exist and be unlocked at level 1', () => {
        expect(flameShield()).toBeDefined()
        expect(flameShield().skillUnlockLevel).toBe(1)
      })

      it('should cost 18 MP', () => {
        expect(flameShield().mpCost).toBe(18)
      })

      it('should target self with no damage', () => {
        expect(flameShield().targetType).toBe('self')
        expect(flameShield().noDamage).toBe(true)
      })

      it('should apply FLAME_SHIELD for 3 turns with 2-turn burn', () => {
        const shieldEffect = flameShield().effects.find(e => e.type === EffectType.FLAME_SHIELD)
        expect(shieldEffect).toBeDefined()
        expect(shieldEffect.target).toBe('self')
        expect(shieldEffect.duration).toBe(3)
        expect(shieldEffect.burnDuration).toBe(2)
      })
    })

    describe('L3: Ignite', () => {
      const ignite = () => ember_witch.skills.find(s => s.name === 'Ignite')

      it('should exist and be unlocked at level 3', () => {
        expect(ignite()).toBeDefined()
        expect(ignite().skillUnlockLevel).toBe(3)
      })

      it('should cost 15 MP', () => {
        expect(ignite().mpCost).toBe(15)
      })

      it('should target enemy with no direct damage', () => {
        expect(ignite().targetType).toBe('enemy')
        expect(ignite().noDamage).toBe(true)
      })

      it('should apply BURN for 3 turns at 50% ATK per turn', () => {
        const burnEffect = ignite().effects.find(e => e.type === EffectType.BURN)
        expect(burnEffect).toBeDefined()
        expect(burnEffect.target).toBe('enemy')
        expect(burnEffect.duration).toBe(3)
        expect(burnEffect.atkPercent).toBe(50)
      })
    })

    describe('L6: Spreading Flames', () => {
      const spreadingFlames = () => ember_witch.skills.find(s => s.name === 'Spreading Flames')

      it('should exist and be unlocked at level 6', () => {
        expect(spreadingFlames()).toBeDefined()
        expect(spreadingFlames().skillUnlockLevel).toBe(6)
      })

      it('should cost 22 MP', () => {
        expect(spreadingFlames().mpCost).toBe(22)
      })

      it('should target a single enemy', () => {
        expect(spreadingFlames().targetType).toBe('enemy')
      })

      it('should have spread burn mechanic', () => {
        expect(spreadingFlames().spreadBurn).toBe(true)
      })
    })

    describe('L12: Conflagration', () => {
      const conflagration = () => ember_witch.skills.find(s => s.name === 'Conflagration')

      it('should exist and be unlocked at level 12', () => {
        expect(conflagration()).toBeDefined()
        expect(conflagration().skillUnlockLevel).toBe(12)
      })

      it('should cost 30 MP', () => {
        expect(conflagration().mpCost).toBe(30)
      })

      it('should target all enemies with no direct damage', () => {
        expect(conflagration().targetType).toBe('all_enemies')
        expect(conflagration().noDamage).toBe(true)
      })

      it('should consume burns and deal bonus damage', () => {
        expect(conflagration().consumeBurns).toBe(true)
        expect(conflagration().consumeBurnAtkBonus).toBe(10)
      })
    })
  })
})

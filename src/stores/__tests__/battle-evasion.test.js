import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType, effectDefinitions } from '../../data/statusEffects'
import { heroTemplates } from '../../data/heroTemplates'

describe('battle store - evasion effect', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('EffectType.EVASION', () => {
    it('should be defined as "evasion"', () => {
      expect(EffectType.EVASION).toBe('evasion')
    })

    it('should have an effect definition', () => {
      expect(effectDefinitions[EffectType.EVASION]).toBeDefined()
      expect(effectDefinitions[EffectType.EVASION].name).toBe('Evasion')
      expect(effectDefinitions[EffectType.EVASION].isBuff).toBe(true)
      expect(effectDefinitions[EffectType.EVASION].isEvasion).toBe(true)
    })

    it('should be stackable', () => {
      expect(effectDefinitions[EffectType.EVASION].stackable).toBe(true)
    })
  })

  describe('hasEffect', () => {
    it('detects evasion effect on unit', () => {
      const unit = {
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ]
      }
      expect(store.hasEffect(unit, EffectType.EVASION)).toBe(true)
    })
  })

  describe('applyDamage with evasion', () => {
    it('can evade damage when evasion check succeeds', () => {
      // Mock Math.random to always return 0 (will be < 0.4 evasion chance)
      const originalRandom = Math.random
      Math.random = () => 0

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(0) // No damage dealt
      expect(unit.currentHp).toBe(100) // HP unchanged

      Math.random = originalRandom
    })

    it('takes damage when evasion check fails', () => {
      // Mock Math.random to always return 0.5 (will be >= 0.4 evasion chance)
      const originalRandom = Math.random
      Math.random = () => 0.5

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 3, value: 40 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(50) // Full damage dealt
      expect(unit.currentHp).toBe(50) // HP reduced

      Math.random = originalRandom
    })
  })

  describe('evasion stacking', () => {
    it('sums multiple evasion effects additively', () => {
      // 30 + 20 = 50% evasion; Math.random returns 0.49 (just under 50%)
      const originalRandom = Math.random
      Math.random = () => 0.49

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 2, value: 30 },
          { type: EffectType.EVASION, duration: 3, value: 20 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(0) // Evaded (0.49 < 0.50)
      expect(unit.currentHp).toBe(100)

      Math.random = originalRandom
    })

    it('fails evasion when roll exceeds summed chance', () => {
      // 30 + 20 = 50% evasion; Math.random returns 0.51 (just over 50%)
      const originalRandom = Math.random
      Math.random = () => 0.51

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 2, value: 30 },
          { type: EffectType.EVASION, duration: 3, value: 20 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(50) // Hit (0.51 >= 0.50)
      expect(unit.currentHp).toBe(50)

      Math.random = originalRandom
    })

    it('caps total evasion at 100%', () => {
      // 60 + 60 = 120%, capped to 100%; Math.random returns 0.99
      const originalRandom = Math.random
      Math.random = () => 0.99

      const unit = {
        currentHp: 100,
        maxHp: 100,
        statusEffects: [
          { type: EffectType.EVASION, duration: 2, value: 60 },
          { type: EffectType.EVASION, duration: 3, value: 60 }
        ],
        template: { name: 'Test Hero' }
      }

      const result = store.applyDamage(unit, 50, 'attack')

      expect(result).toBe(0) // 100% evasion always dodges
      expect(unit.currentHp).toBe(100)

      Math.random = originalRandom
    })
  })

  describe('Fennick skill kit', () => {
    const fennick = heroTemplates.fennick

    it('has 4 skills', () => {
      expect(fennick.skills).toHaveLength(4)
    })

    it('has Come and Get Me at level 1', () => {
      const skill = fennick.skills[0]
      expect(skill.name).toBe('Come and Get Me')
      expect(skill.skillUnlockLevel).toBe(1)
      expect(skill.targetType).toBe('self')
      expect(skill.noDamage).toBe(true)
      expect(skill.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: EffectType.TAUNT, duration: 2 }),
          expect.objectContaining({ type: EffectType.EVASION, duration: 2, value: 30 })
        ])
      )
    })

    it('has Counter-shot at level 3', () => {
      const skill = fennick.skills[1]
      expect(skill.name).toBe('Counter-shot')
      expect(skill.skillUnlockLevel).toBe(3)
      expect(skill.damagePercent).toBe(90)
      expect(skill.targetType).toBe('enemy')
      expect(skill.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: EffectType.THORNS, target: 'self', duration: 2, value: 30 })
        ])
      )
    })

    it("has Fox's Cunning at level 6", () => {
      const skill = fennick.skills[2]
      expect(skill.name).toBe("Fox's Cunning")
      expect(skill.skillUnlockLevel).toBe(6)
      expect(skill.targetType).toBe('self')
      expect(skill.noDamage).toBe(true)
      expect(skill.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: EffectType.EVASION, duration: 3, value: 20 }),
          expect.objectContaining({ type: EffectType.SPD_UP, duration: 3, value: 3 })
        ])
      )
    })

    it('has Pin Down at level 12', () => {
      const skill = fennick.skills[3]
      expect(skill.name).toBe('Pin Down')
      expect(skill.skillUnlockLevel).toBe(12)
      expect(skill.damagePercent).toBe(100)
      expect(skill.targetType).toBe('enemy')
      expect(skill.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: EffectType.STUN, target: 'enemy', duration: 1 })
        ])
      )
    })
  })
})

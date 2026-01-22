import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - Guardian Link', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('calculateGuardianLinkDamage', () => {
    it('redirects damage to guardian when ally has GUARDIAN_LINK', () => {
      const guardian = {
        instanceId: 'aurora1',
        template: { name: 'Aurora' },
        currentHp: 150,
        stats: { hp: 150 },
        statusEffects: []
      }
      const ally = {
        instanceId: 'mage1',
        template: { name: 'Mage' },
        currentHp: 80,
        stats: { hp: 80 },
        statusEffects: [
          {
            type: EffectType.GUARDIAN_LINK,
            duration: 3,
            redirectPercent: 40,
            guardianId: 'aurora1',
            definition: { isGuardianLink: true }
          }
        ]
      }

      // Simulate 100 damage to ally
      // 40% (40) should go to guardian, 60% (60) to ally
      const result = store.calculateGuardianLinkDamage(ally, 100, [guardian])

      expect(result.allyDamage).toBe(60)
      expect(result.guardianDamage).toBe(40)
      expect(result.guardian).toBe(guardian)
    })

    it('does nothing when ally has no GUARDIAN_LINK', () => {
      const ally = {
        instanceId: 'mage1',
        template: { name: 'Mage' },
        currentHp: 80,
        statusEffects: []
      }

      const result = store.calculateGuardianLinkDamage(ally, 100, [])

      expect(result.allyDamage).toBe(100)
      expect(result.guardianDamage).toBe(0)
      expect(result.guardian).toBeNull()
    })

    it('does not redirect if guardian is dead', () => {
      const guardian = {
        instanceId: 'aurora1',
        template: { name: 'Aurora' },
        currentHp: 0,
        statusEffects: []
      }
      const ally = {
        instanceId: 'mage1',
        template: { name: 'Mage' },
        currentHp: 80,
        statusEffects: [
          {
            type: EffectType.GUARDIAN_LINK,
            duration: 3,
            redirectPercent: 40,
            guardianId: 'aurora1',
            definition: { isGuardianLink: true }
          }
        ]
      }

      const result = store.calculateGuardianLinkDamage(ally, 100, [guardian])

      expect(result.allyDamage).toBe(100)
      expect(result.guardianDamage).toBe(0)
    })
  })

  describe('releaseDamageStore', () => {
    it('deals stored damage to all enemies and clears storage', () => {
      const hero = {
        instanceId: 'aurora1',
        template: { name: 'Aurora' },
        currentHp: 100,
        statusEffects: [
          {
            type: EffectType.DAMAGE_STORE,
            duration: 0,
            storedDamage: 150,
            definition: { isDamageStore: true }
          }
        ]
      }
      const enemies = [
        { id: 'e1', template: { name: 'Goblin' }, currentHp: 100, statusEffects: [] },
        { id: 'e2', template: { name: 'Orc' }, currentHp: 100, statusEffects: [] }
      ]

      const result = store.releaseDamageStore(hero, enemies)

      expect(result.totalDamage).toBe(150)
      expect(result.enemiesHit).toBe(2)
    })

    it('returns 0 when no damage stored', () => {
      const hero = {
        instanceId: 'aurora1',
        template: { name: 'Aurora' },
        statusEffects: [
          {
            type: EffectType.DAMAGE_STORE,
            duration: 0,
            storedDamage: 0,
            definition: { isDamageStore: true }
          }
        ]
      }

      const result = store.releaseDamageStore(hero, [])

      expect(result.totalDamage).toBe(0)
    })
  })

  describe('checkDivineSacrifice', () => {
    it('finds hero with DIVINE_SACRIFICE', () => {
      const aurora = {
        instanceId: 'aurora1',
        template: { name: 'Aurora' },
        currentHp: 150,
        statusEffects: [
          {
            type: EffectType.DIVINE_SACRIFICE,
            duration: 2,
            damageReduction: 50,
            healPerTurn: 15,
            definition: { isDivineSacrifice: true }
          }
        ]
      }
      const ally = {
        instanceId: 'mage1',
        template: { name: 'Mage' },
        currentHp: 80,
        statusEffects: []
      }

      const result = store.checkDivineSacrifice(ally, [aurora, ally])

      expect(result).toBe(aurora)
    })

    it('returns null when no hero has DIVINE_SACRIFICE', () => {
      const ally = {
        instanceId: 'mage1',
        template: { name: 'Mage' },
        currentHp: 80,
        statusEffects: []
      }

      const result = store.checkDivineSacrifice(ally, [ally])

      expect(result).toBeNull()
    })

    it('returns null when target is the sacrificer', () => {
      const aurora = {
        instanceId: 'aurora1',
        template: { name: 'Aurora' },
        currentHp: 150,
        statusEffects: [
          {
            type: EffectType.DIVINE_SACRIFICE,
            duration: 2,
            definition: { isDivineSacrifice: true }
          }
        ]
      }

      const result = store.checkDivineSacrifice(aurora, [aurora])

      expect(result).toBeNull()
    })
  })

  describe('calculateHealSelfPercent', () => {
    it('calculates heal amount from damage dealt', () => {
      const result = store.calculateHealSelfPercent(100, 50)
      expect(result).toBe(50)
    })

    it('returns 0 when no percent specified', () => {
      const result = store.calculateHealSelfPercent(100, 0)
      expect(result).toBe(0)
    })

    it('floors the result', () => {
      const result = store.calculateHealSelfPercent(75, 50)
      expect(result).toBe(37)
    })
  })
})

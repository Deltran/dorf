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
})

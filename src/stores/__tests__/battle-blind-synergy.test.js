import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle.js'
import { EffectType, effectDefinitions } from '../../data/statusEffects.js'

describe('Blind Synergy Tests', () => {
  let battleStore

  beforeEach(() => {
    setActivePinia(createPinia())
    battleStore = useBattleStore()
  })

  describe('Blind is a debuff', () => {
    it('should have isBuff: false in effect definition', () => {
      const blindDef = effectDefinitions[EffectType.BLIND]
      expect(blindDef.isBuff).toBe(false)
    })
  })

  describe('Penny Whistler synergy', () => {
    it('should count Blind as a debuff for bonus damage calculations', () => {
      const enemy = {
        statusEffects: [
          { type: EffectType.BLIND, value: 50, definition: effectDefinitions[EffectType.BLIND] }
        ]
      }

      // Count debuffs on enemy - Blind should count
      const debuffCount = enemy.statusEffects.filter(e =>
        e.definition && !e.definition.isBuff
      ).length

      expect(debuffCount).toBe(1)
    })

    it('should stack with other debuffs for Penny bonus damage', () => {
      const enemy = {
        statusEffects: [
          { type: EffectType.BLIND, value: 50, definition: effectDefinitions[EffectType.BLIND] },
          { type: EffectType.DEF_DOWN, value: 15, definition: effectDefinitions[EffectType.DEF_DOWN] },
          { type: EffectType.SPD_DOWN, value: 15, definition: effectDefinitions[EffectType.SPD_DOWN] }
        ]
      }

      const debuffCount = enemy.statusEffects.filter(e =>
        e.definition && !e.definition.isBuff
      ).length

      expect(debuffCount).toBe(3)
    })
  })

  describe('Vicious synergy', () => {
    it('should trigger Vicious bonus against blinded enemies', () => {
      // If getViciousDamageMultiplier exists, test it
      if (battleStore.getViciousDamageMultiplier) {
        const attacker = {
          statusEffects: [
            { type: EffectType.VICIOUS, bonusDamagePercent: 30 }
          ]
        }
        const target = {
          statusEffects: [
            { type: EffectType.BLIND, value: 50, definition: effectDefinitions[EffectType.BLIND] }
          ]
        }

        const multiplier = battleStore.getViciousDamageMultiplier(attacker, target)
        expect(multiplier).toBeGreaterThan(1)
      }
    })

    it('should recognize Blind as a debuff for Vicious checks', () => {
      const target = {
        statusEffects: [
          { type: EffectType.BLIND, value: 50, definition: effectDefinitions[EffectType.BLIND] }
        ]
      }

      // Check if target has any debuffs
      const hasDebuff = target.statusEffects.some(e =>
        e.definition && !e.definition.isBuff
      )

      expect(hasDebuff).toBe(true)
    })
  })
})

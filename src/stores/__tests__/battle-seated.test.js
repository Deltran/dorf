// src/stores/__tests__/battle-seated.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - SEATED stance', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('isSeated helper', () => {
    it('returns true when unit has SEATED effect', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [
          { type: EffectType.SEATED, duration: 2, definition: { isSeated: true } }
        ],
        skill: { name: 'Some Skill', valorRequired: 0 }
      }

      expect(store.isSeated(hero)).toBe(true)
    })

    it('returns false when unit has no SEATED effect', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [],
        skill: { name: 'Some Skill' }
      }

      expect(store.isSeated(hero)).toBe(false)
    })

    it('returns false when unit has no statusEffects array', () => {
      const hero = {
        instanceId: 'hero1',
        skill: { name: 'Some Skill' }
      }

      expect(store.isSeated(hero)).toBe(false)
    })
  })

  describe('canUseSkill with SEATED', () => {
    it('blocks skill use when SEATED', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [
          { type: EffectType.SEATED, duration: 2, definition: { isSeated: true } }
        ],
        skill: { name: 'Some Skill', mpCost: 0 },
        currentMp: 100,
        class: { resourceType: 'mp' }
      }

      expect(store.canUseSkill(hero)).toBe(false)
    })

    it('allows skill use when not SEATED', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [],
        skill: { name: 'Some Skill', mpCost: 0 },
        currentMp: 100,
        class: { resourceType: 'mp' }
      }

      expect(store.canUseSkill(hero)).toBe(true)
    })

    it('blocks Knight skill use when SEATED', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [
          { type: EffectType.SEATED, duration: 2, definition: { isSeated: true } }
        ],
        skill: { name: 'Shield Bash' },
        currentValor: 50,
        class: { resourceType: 'valor' }
      }

      expect(store.canUseSkill(hero)).toBe(false)
    })

    it('blocks Ranger skill use when SEATED', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [
          { type: EffectType.SEATED, duration: 2, definition: { isSeated: true } }
        ],
        skill: { name: 'Power Shot' },
        hasFocus: true,
        class: { resourceType: 'focus' }
      }

      expect(store.canUseSkill(hero)).toBe(false)
    })

    it('blocks Bard skill use when SEATED', () => {
      const hero = {
        instanceId: 'hero1',
        statusEffects: [
          { type: EffectType.SEATED, duration: 2, definition: { isSeated: true } }
        ],
        skill: { name: 'Inspiring Song' },
        currentVerses: 0,
        class: { resourceType: 'verse' }
      }

      expect(store.canUseSkill(hero)).toBe(false)
    })
  })
})

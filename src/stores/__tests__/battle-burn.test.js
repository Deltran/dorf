import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { EffectType } from '../../data/statusEffects'

describe('battle store - Flame Shield', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('triggerFlameShield', () => {
    it('applies burn to attacker when defender has FLAME_SHIELD', () => {
      const defender = {
        instanceId: 'hero1',
        template: { name: 'Shasha' },
        stats: { atk: 45 },
        statusEffects: [
          { type: EffectType.FLAME_SHIELD, duration: 3, burnDuration: 2, definition: { isFlameShield: true } }
        ]
      }
      const attacker = {
        id: 'enemy1',
        template: { name: 'Goblin' },
        currentHp: 100,
        statusEffects: []
      }

      store.triggerFlameShield(defender, attacker)

      const burnEffect = attacker.statusEffects.find(e => e.type === EffectType.BURN)
      expect(burnEffect).toBeDefined()
      expect(burnEffect.duration).toBe(2)
    })

    it('does nothing when defender has no FLAME_SHIELD', () => {
      const defender = {
        instanceId: 'hero1',
        template: { name: 'Knight' },
        statusEffects: []
      }
      const attacker = {
        id: 'enemy1',
        template: { name: 'Goblin' },
        currentHp: 100,
        statusEffects: []
      }

      store.triggerFlameShield(defender, attacker)

      expect(attacker.statusEffects.length).toBe(0)
    })
  })
})

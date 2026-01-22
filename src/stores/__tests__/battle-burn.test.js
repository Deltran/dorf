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

  describe('spreadBurnFromTarget', () => {
    it('spreads burn to all enemies without burn', () => {
      const burnedEnemy = {
        id: 'enemy1',
        template: { name: 'Goblin' },
        currentHp: 100,
        statusEffects: [
          { type: EffectType.BURN, duration: 3, value: 20, definition: { isDot: true } }
        ]
      }
      const cleanEnemy1 = {
        id: 'enemy2',
        template: { name: 'Orc' },
        currentHp: 100,
        statusEffects: []
      }
      const cleanEnemy2 = {
        id: 'enemy3',
        template: { name: 'Troll' },
        currentHp: 100,
        statusEffects: []
      }
      const allEnemies = [burnedEnemy, cleanEnemy1, cleanEnemy2]

      const spreadCount = store.spreadBurnFromTarget(burnedEnemy, allEnemies, 'hero1')

      expect(spreadCount).toBe(2)
      expect(cleanEnemy1.statusEffects.find(e => e.type === EffectType.BURN)).toBeDefined()
      expect(cleanEnemy2.statusEffects.find(e => e.type === EffectType.BURN)).toBeDefined()
    })

    it('does not spread burn if target has no burn', () => {
      const cleanEnemy = {
        id: 'enemy1',
        template: { name: 'Goblin' },
        currentHp: 100,
        statusEffects: []
      }
      const otherEnemy = {
        id: 'enemy2',
        template: { name: 'Orc' },
        currentHp: 100,
        statusEffects: []
      }
      const allEnemies = [cleanEnemy, otherEnemy]

      const spreadCount = store.spreadBurnFromTarget(cleanEnemy, allEnemies, 'hero1')

      expect(spreadCount).toBe(0)
      expect(otherEnemy.statusEffects.length).toBe(0)
    })

    it('does not overwrite existing burns', () => {
      const burnedEnemy = {
        id: 'enemy1',
        template: { name: 'Goblin' },
        currentHp: 100,
        statusEffects: [
          { type: EffectType.BURN, duration: 3, value: 20, definition: { isDot: true } }
        ]
      }
      const alreadyBurning = {
        id: 'enemy2',
        template: { name: 'Orc' },
        currentHp: 100,
        statusEffects: [
          { type: EffectType.BURN, duration: 1, value: 10, definition: { isDot: true } }
        ]
      }
      const allEnemies = [burnedEnemy, alreadyBurning]

      const spreadCount = store.spreadBurnFromTarget(burnedEnemy, allEnemies, 'hero1')

      expect(spreadCount).toBe(0)
      // Original burn should be unchanged
      expect(alreadyBurning.statusEffects[0].duration).toBe(1)
      expect(alreadyBurning.statusEffects[0].value).toBe(10)
    })
  })
})

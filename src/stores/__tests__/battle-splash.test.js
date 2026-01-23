import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'

describe('Splash damage mechanics', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('pickRandom helper', () => {
    it('returns up to count items from array', () => {
      const items = [1, 2, 3, 4, 5]
      const picked = store.pickRandom(items, 2)
      expect(picked.length).toBe(2)
      expect(items).toContain(picked[0])
      expect(items).toContain(picked[1])
    })

    it('returns all items if count exceeds array length', () => {
      const items = [1, 2]
      const picked = store.pickRandom(items, 5)
      expect(picked.length).toBe(2)
    })

    it('returns empty array for empty input', () => {
      const picked = store.pickRandom([], 3)
      expect(picked.length).toBe(0)
    })
  })

  describe('applySplashDamage helper', () => {
    it('deals splash damage to up to splashCount other enemies', () => {
      const attacker = {
        instanceId: 'hero1',
        template: { name: 'Shasha' },
        stats: { atk: 50 }
      }

      const primaryTarget = { id: 'enemy1', template: { name: 'Goblin A' }, stats: { def: 10 }, currentHp: 100, statusEffects: [] }
      const otherEnemies = [
        { id: 'enemy2', template: { name: 'Goblin B' }, stats: { def: 10 }, currentHp: 100, statusEffects: [] },
        { id: 'enemy3', template: { name: 'Goblin C' }, stats: { def: 10 }, currentHp: 100, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      // applySplashDamage(attacker, primaryTarget, otherEnemies, skill)
      store.applySplashDamage(attacker, primaryTarget, otherEnemies, skill)

      // Both other enemies should take splash damage
      expect(otherEnemies[0].currentHp).toBeLessThan(100)
      expect(otherEnemies[1].currentHp).toBeLessThan(100)
    })

    it('deals splash damage to only available enemies when fewer than splashCount exist', () => {
      const attacker = {
        instanceId: 'hero1',
        template: { name: 'Shasha' },
        stats: { atk: 50 }
      }

      const primaryTarget = { id: 'enemy1', template: { name: 'Goblin A' }, stats: { def: 10 }, currentHp: 100, statusEffects: [] }
      const otherEnemies = [
        { id: 'enemy2', template: { name: 'Goblin B' }, stats: { def: 10 }, currentHp: 100, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      store.applySplashDamage(attacker, primaryTarget, otherEnemies, skill)

      // The only other enemy should take splash damage
      expect(otherEnemies[0].currentHp).toBeLessThan(100)
    })

    it('does nothing when no other enemies exist', () => {
      const attacker = {
        instanceId: 'hero1',
        template: { name: 'Shasha' },
        stats: { atk: 50 }
      }

      const primaryTarget = { id: 'enemy1', template: { name: 'Goblin A' }, stats: { def: 10 }, currentHp: 100, statusEffects: [] }
      const otherEnemies = []

      const skill = {
        name: 'Fireball',
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      // Should not throw
      store.applySplashDamage(attacker, primaryTarget, otherEnemies, skill)
    })

    it('splash damage respects target defense', () => {
      const attacker = {
        instanceId: 'hero1',
        template: { name: 'Shasha' },
        stats: { atk: 50 }
      }

      const primaryTarget = { id: 'enemy1', template: { name: 'Goblin' }, stats: { def: 10 }, currentHp: 200, statusEffects: [] }

      // One enemy with high DEF
      const otherEnemies = [
        { id: 'enemy2', template: { name: 'Armored Orc' }, stats: { def: 50 }, currentHp: 200, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      store.applySplashDamage(attacker, primaryTarget, otherEnemies, skill)

      // High DEF enemy should take splash damage reduced by defense
      const highDefDamage = 200 - otherEnemies[0].currentHp
      // Splash damage = 50 ATK * 50% splash = 25 base, minus DEF reduction
      expect(highDefDamage).toBeGreaterThan(0)
      expect(highDefDamage).toBeLessThan(25) // Should be reduced by high DEF
    })

    it('calculates splash damage as percentage of primary damage', () => {
      const attacker = {
        instanceId: 'hero1',
        template: { name: 'Shasha' },
        stats: { atk: 100 }
      }

      const primaryTarget = { id: 'enemy1', template: { name: 'Goblin' }, stats: { def: 0 }, currentHp: 500, statusEffects: [] }

      // Enemy with 0 DEF for clean damage calculation
      const otherEnemies = [
        { id: 'enemy2', template: { name: 'Slime' }, stats: { def: 0 }, currentHp: 500, statusEffects: [] }
      ]

      const skill = {
        name: 'Fireball',
        damagePercent: 100, // 100% ATK = 100 damage
        splashCount: 1,
        splashDamagePercent: 50 // 50% of primary = 50 damage
      }

      store.applySplashDamage(attacker, primaryTarget, otherEnemies, skill)

      // With 0 DEF (min 1 via getEffectiveStat), splash damage = 100*0.5 - 1*0.5 = 49
      const splashDamage = 500 - otherEnemies[0].currentHp
      expect(splashDamage).toBe(49)
    })

    it('allows splash targets to evade', () => {
      const attacker = {
        instanceId: 'hero1',
        template: { name: 'Shasha' },
        stats: { atk: 50 }
      }

      const primaryTarget = { id: 'enemy1', template: { name: 'Goblin A' }, stats: { def: 10 }, currentHp: 100, statusEffects: [] }

      // Enemy with 100% evasion
      const otherEnemies = [
        {
          id: 'enemy2',
          template: { name: 'Dodgy Goblin' },
          stats: { def: 10 },
          currentHp: 100,
          statusEffects: [{ type: 'evasion', value: 100, duration: 5, definition: { name: 'Evasion' } }]
        }
      ]

      const skill = {
        name: 'Fireball',
        damagePercent: 130,
        splashCount: 2,
        splashDamagePercent: 50
      }

      store.applySplashDamage(attacker, primaryTarget, otherEnemies, skill)

      // Evasion enemy should evade (100% evasion means always dodge)
      expect(otherEnemies[0].currentHp).toBe(100)
    })
  })
})

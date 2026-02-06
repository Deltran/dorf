// src/data/__tests__/maw-enemies.test.js
import { describe, it, expect } from 'vitest'
import { generateWaveEnemies } from '../maw/enemies.js'
import { SeededRandom } from '../../utils/seededRandom.js'

describe('Maw Wave Enemy Generation', () => {
  it('generates enemies for a wave', () => {
    const rng = new SeededRandom(42)
    const enemies = generateWaveEnemies(rng, 1, 1) // wave 1, tier 1
    expect(enemies.length).toBeGreaterThan(0)
    enemies.forEach(e => {
      expect(e.templateId).toBeTruthy()
      expect(e.level).toBeGreaterThan(0)
    })
  })

  it('generates more enemies in later phases', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(42)
    const wave1 = generateWaveEnemies(rng1, 1, 1)
    // Advance rng2 past wave 1
    generateWaveEnemies(rng2, 1, 1)
    const wave9 = generateWaveEnemies(rng2, 9, 1)
    expect(wave9.length).toBeGreaterThanOrEqual(wave1.length)
  })

  it('scales enemy level with tier', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(42)
    const tier1 = generateWaveEnemies(rng1, 1, 1)
    const tier3 = generateWaveEnemies(rng2, 1, 3)
    // Tier 3 enemies should have higher levels
    expect(tier3[0].level).toBeGreaterThan(tier1[0].level)
  })

  it('is deterministic with same seed', () => {
    const rng1 = new SeededRandom(42)
    const rng2 = new SeededRandom(42)
    const enemies1 = generateWaveEnemies(rng1, 1, 1)
    const enemies2 = generateWaveEnemies(rng2, 1, 1)
    expect(enemies1.map(e => e.templateId)).toEqual(enemies2.map(e => e.templateId))
  })
})

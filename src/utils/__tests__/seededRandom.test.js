import { describe, it, expect } from 'vitest'
import { SeededRandom, createSeed } from '../seededRandom.js'

describe('SeededRandom', () => {
  it('produces deterministic output for the same seed', () => {
    const rng1 = new SeededRandom(12345)
    const rng2 = new SeededRandom(12345)
    const results1 = Array.from({ length: 10 }, () => rng1.next())
    const results2 = Array.from({ length: 10 }, () => rng2.next())
    expect(results1).toEqual(results2)
  })

  it('produces different output for different seeds', () => {
    const rng1 = new SeededRandom(12345)
    const rng2 = new SeededRandom(54321)
    expect(rng1.next()).not.toEqual(rng2.next())
  })

  it('next() returns values between 0 and 1', () => {
    const rng = new SeededRandom(42)
    for (let i = 0; i < 100; i++) {
      const val = rng.next()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })

  it('int(min, max) returns integers in range (inclusive)', () => {
    const rng = new SeededRandom(99)
    for (let i = 0; i < 100; i++) {
      const val = rng.int(1, 6)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(6)
      expect(Number.isInteger(val)).toBe(true)
    }
  })

  it('pick(array) returns an element from the array', () => {
    const rng = new SeededRandom(42)
    const items = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(rng.pick(items))
    }
  })

  it('shuffle(array) returns all elements', () => {
    const rng = new SeededRandom(42)
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = rng.shuffle([...items])
    expect(shuffled).toHaveLength(items.length)
    expect([...shuffled].sort((a,b) => a-b)).toEqual([...items].sort((a,b) => a-b))
  })

  it('chance(percent) respects 0 and 100', () => {
    const rng = new SeededRandom(42)
    expect(rng.chance(100)).toBe(true)
    expect(rng.chance(0)).toBe(false)
  })

  it('weightedPick selects from weighted options', () => {
    const rng = new SeededRandom(42)
    const options = [
      { item: 'common', weight: 70 },
      { item: 'rare', weight: 25 },
      { item: 'epic', weight: 5 }
    ]
    const result = rng.weightedPick(options)
    expect(['common', 'rare', 'epic']).toContain(result.item)
  })

  it('createSeed generates consistent seed from string', () => {
    const seed1 = createSeed('2026-02-06', 1, 'abc123')
    const seed2 = createSeed('2026-02-06', 1, 'abc123')
    expect(seed1).toBe(seed2)
    const seed3 = createSeed('2026-02-07', 1, 'abc123')
    expect(seed1).not.toBe(seed3)
  })
})

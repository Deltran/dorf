// src/data/__tests__/maw-boons.test.js
import { describe, it, expect } from 'vitest'
import { getAllBoons, getBoon, getBoonsByCategory, getBoonsByRarity, getSeedBoons, getPayoffBoons, getPayoffsForSeed } from '../maw/boons.js'

describe('Maw Boon Definitions', () => {
  it('exports a non-empty boon pool', () => {
    const boons = getAllBoons()
    expect(boons.length).toBeGreaterThan(0)
  })

  it('each boon has required fields', () => {
    const boons = getAllBoons()
    for (const boon of boons) {
      expect(boon.id).toBeTruthy()
      expect(boon.name).toBeTruthy()
      expect(boon.description).toBeTruthy()
      expect(['offensive', 'defensive', 'tactical', 'synergy']).toContain(boon.category)
      expect(['common', 'rare', 'epic']).toContain(boon.rarity)
      expect(['heroes', 'enemies', 'all']).toContain(boon.scope)
      expect(boon.hook).toBeTruthy()
      expect(boon.effect).toBeTruthy()
      expect(boon.effect.type).toBeTruthy()
    }
  })

  it('getBoon returns a boon by id', () => {
    const boons = getAllBoons()
    const first = boons[0]
    expect(getBoon(first.id)).toEqual(first)
  })

  it('getBoon returns null for unknown id', () => {
    expect(getBoon('nonexistent_boon')).toBeNull()
  })

  it('getBoonsByCategory filters correctly', () => {
    const offensive = getBoonsByCategory('offensive')
    offensive.forEach(b => expect(b.category).toBe('offensive'))
  })

  it('getBoonsByRarity filters correctly', () => {
    const commons = getBoonsByRarity('common')
    commons.forEach(b => expect(b.rarity).toBe('common'))
  })

  it('seed boons have seedTags', () => {
    const seeds = getSeedBoons()
    seeds.forEach(b => {
      expect(b.isSeed).toBe(true)
      expect(Array.isArray(b.seedTags)).toBe(true)
      expect(b.seedTags.length).toBeGreaterThan(0)
    })
  })

  it('payoff boons have payoffTags', () => {
    const payoffs = getPayoffBoons()
    payoffs.forEach(b => {
      expect(b.isPayoff).toBe(true)
      expect(Array.isArray(b.payoffTags)).toBe(true)
      expect(b.payoffTags.length).toBeGreaterThan(0)
    })
  })

  it('getPayoffsForSeed returns boons matching seed tags', () => {
    const seeds = getSeedBoons()
    if (seeds.length > 0) {
      const seed = seeds[0]
      const payoffs = getPayoffsForSeed(seed)
      payoffs.forEach(p => {
        const overlap = p.payoffTags.some(t => seed.seedTags.includes(t))
        expect(overlap).toBe(true)
      })
    }
  })

  it('has a reasonable rarity distribution', () => {
    const boons = getAllBoons()
    const commons = boons.filter(b => b.rarity === 'common')
    const rares = boons.filter(b => b.rarity === 'rare')
    const epics = boons.filter(b => b.rarity === 'epic')
    // Should have more commons than rares, more rares than epics
    expect(commons.length).toBeGreaterThan(rares.length)
    expect(rares.length).toBeGreaterThanOrEqual(epics.length)
  })

  it('boon effects use valid FLE effect types', () => {
    const validTypes = [
      'damage_multiplier', 'damage_reduction',
      'damage_percent_max_hp', 'heal_percent_max_hp',
      'apply_status', 'heal_percent_damage',
      'grant_shield', 'grant_resource'
    ]
    const boons = getAllBoons()
    for (const boon of boons) {
      expect(validTypes).toContain(boon.effect.type)
    }
  })

  it('all boon ids are unique', () => {
    const boons = getAllBoons()
    const ids = boons.map(b => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

import { describe, it, expect } from 'vitest'
import { genusLociData, getGenusLoci, getAllGenusLoci, getGenusLociByRegion } from '../genusLoci.js'

describe('Genus Loci data', () => {
  describe('getGenusLoci', () => {
    it('returns Valinar by id', () => {
      const valinar = getGenusLoci('valinar')
      expect(valinar).not.toBeNull()
      expect(valinar.name).toBe('Valinar, Lake Tower Guardian')
      expect(valinar.region).toBe('whisper_lake')
      expect(valinar.keyItemId).toBe('lake_tower_key')
      expect(valinar.maxPowerLevel).toBe(20)
    })

    it('returns null for unknown id', () => {
      expect(getGenusLoci('nonexistent')).toBeNull()
    })
  })

  describe('getAllGenusLoci', () => {
    it('returns array of all bosses', () => {
      const all = getAllGenusLoci()
      expect(Array.isArray(all)).toBe(true)
      expect(all.length).toBeGreaterThanOrEqual(1)
      expect(all.some(g => g.id === 'valinar')).toBe(true)
    })
  })

  describe('getGenusLociByRegion', () => {
    it('returns Valinar for whisper_lake', () => {
      const boss = getGenusLociByRegion('whisper_lake')
      expect(boss).not.toBeNull()
      expect(boss.id).toBe('valinar')
    })

    it('returns null for region without boss', () => {
      expect(getGenusLociByRegion('whispering_woods')).toBeNull()
    })
  })

  describe('Valinar stats and abilities', () => {
    it('has correct base stats', () => {
      const valinar = getGenusLoci('valinar')
      expect(valinar.baseStats.hp).toBe(600)
      expect(valinar.baseStats.atk).toBe(60)
      expect(valinar.baseStats.def).toBe(25)
      expect(valinar.baseStats.spd).toBe(80)
    })

    it('has 6 abilities with correct unlock levels', () => {
      const valinar = getGenusLoci('valinar')
      expect(valinar.abilities.length).toBe(6)
      expect(valinar.abilities.filter(a => a.unlocksAt === 1).length).toBe(2)
      expect(valinar.abilities.find(a => a.id === 'shield_bash').unlocksAt).toBe(5)
      expect(valinar.abilities.find(a => a.id === 'towers_wrath').unlocksAt).toBe(10)
      expect(valinar.abilities.find(a => a.id === 'counterattack_stance').unlocksAt).toBe(15)
      expect(valinar.abilities.find(a => a.id === 'judgment_of_ages').unlocksAt).toBe(20)
    })

    it('has correct reward structure', () => {
      const valinar = getGenusLoci('valinar')
      expect(valinar.firstClearBonus.gems).toBe(20)
      expect(valinar.currencyRewards.base.gold).toBe(100)
      expect(valinar.currencyRewards.perLevel.gold).toBe(25)
      expect(valinar.uniqueDrop.itemId).toBe('valinar_crest')
      expect(valinar.uniqueDrop.guaranteed).toBe(true)
    })
  })
})

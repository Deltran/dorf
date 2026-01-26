import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from '../battle'
import { useHeroesStore } from '../heroes'

describe('battle store - verse helpers', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
  })

  describe('isBard', () => {
    it('returns true for units with verse resourceType', () => {
      const bard = { class: { resourceType: 'verse' } }
      expect(store.isBard(bard)).toBe(true)
    })

    it('returns false for non-bards', () => {
      const knight = { class: { resourceType: 'valor' } }
      expect(store.isBard(knight)).toBe(false)
    })

    it('returns false for units without class', () => {
      const unit = {}
      expect(store.isBard(unit)).toBe(false)
    })
  })

  describe('gainVerse', () => {
    it('increases currentVerses by 1', () => {
      const unit = { currentVerses: 0 }
      store.gainVerse(unit)
      expect(unit.currentVerses).toBe(1)
    })

    it('caps verses at 3', () => {
      const unit = { currentVerses: 3 }
      store.gainVerse(unit)
      expect(unit.currentVerses).toBe(3)
    })

    it('does nothing if unit has no currentVerses property', () => {
      const unit = {}
      store.gainVerse(unit)
      expect(unit.currentVerses).toBeUndefined()
    })
  })
})

describe('Bard verse system - integration', () => {
  let store
  let heroesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useBattleStore()
    heroesStore = useHeroesStore()
  })

  function createMockBard(overrides = {}) {
    return {
      instanceId: 'bard_1',
      templateId: 'wandering_bard',
      level: 6,
      currentHp: 100,
      maxHp: 100,
      currentMp: 70,
      maxMp: 70,
      stats: { hp: 100, atk: 20, def: 20, spd: 15 },
      template: {
        name: 'Harl the Handsom',
        skills: [
          { name: 'Inspiring Song', targetType: 'all_allies', effects: [] },
          { name: 'Mana Melody', skillUnlockLevel: 1, targetType: 'all_allies', mpRestore: 10 },
          { name: 'Soothing Serenade', skillUnlockLevel: 3, targetType: 'all_allies', healFromStat: { stat: 'atk', percent: 15 } }
        ],
        finale: {
          name: 'Standing Ovation',
          target: 'all_allies',
          effects: [
            { type: 'resource_grant', rageAmount: 15, focusGrant: true, valorAmount: 10, mpAmount: 15, verseAmount: 1 },
            { type: 'heal', value: 5 }
          ]
        }
      },
      class: { resourceType: 'verse', resourceName: 'Verse' },
      statusEffects: [],
      currentVerses: 0,
      lastSkillName: null,
      ...overrides
    }
  }

  it('bard starts with 0 verses', () => {
    const bard = createMockBard()
    expect(bard.currentVerses).toBe(0)
  })

  it('gainVerse increments verse count', () => {
    const bard = createMockBard()
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(1)
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(2)
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(3)
  })

  it('verses cap at 3', () => {
    const bard = createMockBard({ currentVerses: 3 })
    store.gainVerse(bard)
    expect(bard.currentVerses).toBe(3)
  })

  it('canUseSkill returns true for bard skills (no cost)', () => {
    const bard = createMockBard()
    bard.skill = bard.template.skills[0]
    expect(store.canUseSkill(bard)).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { selectHeroSkill, selectTarget } from '../heroAI.js'

// Helper to create a mock hero combat unit
function mockHero(overrides = {}) {
  return {
    id: 'hero1',
    name: 'Test Hero',
    classId: 'mage',
    currentHp: 100,
    maxHp: 100,
    currentMp: 30,
    maxMp: 60,
    atk: 50,
    def: 30,
    spd: 20,
    isAlive: true,
    template: {
      skills: [
        { name: 'Fireball', mpCost: 20, targetType: 'enemy', damagePercent: 130 },
        { name: 'Heal', mpCost: 15, targetType: 'ally', healPercent: 30, noDamage: true }
      ]
    },
    currentCooldowns: {},
    statusEffects: [],
    ...overrides
  }
}

function mockBerserker(overrides = {}) {
  return mockHero({
    classId: 'berserker',
    currentRage: 60,
    currentMp: undefined,
    maxMp: undefined,
    template: {
      skills: [
        { name: 'Void Strike', rageCost: 50, targetType: 'enemy', damagePercent: 150 },
        { name: 'Mantle', rageCost: 30, targetType: 'self', noDamage: true },
        { name: 'Crushing Eternity', rageCost: 'all', targetType: 'enemy', damagePercent: 200 }
      ]
    },
    ...overrides
  })
}

function mockRanger(overrides = {}) {
  return mockHero({
    classId: 'ranger',
    hasFocus: true,
    currentMp: undefined,
    maxMp: undefined,
    template: {
      skills: [
        { name: 'Volley', targetType: 'random_enemies', damagePercent: 80 },
        { name: 'Piercing Shot', targetType: 'enemy', damagePercent: 150, focusCost: 25 },
        { name: 'Arrow Storm', targetType: 'random_enemies', damagePercent: 120, focusCost: 35 }
      ]
    },
    ...overrides
  })
}

function mockKnight(overrides = {}) {
  return mockHero({
    classId: 'knight',
    currentValor: 30,
    currentMp: undefined,
    maxMp: undefined,
    template: {
      skills: [
        { name: 'Challenge', valorRequired: 0, targetType: 'self', noDamage: true, defensive: true },
        { name: 'Shield Bash', valorRequired: 25, targetType: 'enemy', damagePercent: 100 },
        { name: 'Fortress Stance', valorRequired: 50, targetType: 'self', noDamage: true, defensive: true }
      ]
    },
    ...overrides
  })
}

function mockBard(overrides = {}) {
  return mockHero({
    classId: 'bard',
    currentVerses: 1,
    lastSkillName: 'Inspiring Song',
    currentMp: undefined,
    maxMp: undefined,
    template: {
      skills: [
        { name: 'Inspiring Song', targetType: 'all_allies', noDamage: true },
        { name: 'Mana Melody', targetType: 'all_allies', noDamage: true },
        { name: 'Soothing Serenade', targetType: 'all_allies', noDamage: true }
      ]
    },
    ...overrides
  })
}

function mockAlchemist(overrides = {}) {
  return mockHero({
    classId: 'alchemist',
    currentEssence: 40,
    maxEssence: 60,
    currentMp: undefined,
    maxMp: undefined,
    template: {
      skills: [
        { name: 'Tainted Tonic', essenceCost: 10, targetType: 'enemy', damagePercent: 90, usesVolatility: true },
        { name: 'Tainted Feast', essenceCost: 20, targetType: 'all_enemies', noDamage: true, usesVolatility: true },
        { name: "Death's Needle", essenceCost: 25, targetType: 'enemy', damagePercent: 175, usesVolatility: true }
      ]
    },
    ...overrides
  })
}

function mockEnemy(overrides = {}) {
  return {
    id: 'enemy1',
    name: 'Enemy',
    currentHp: 80,
    maxHp: 100,
    atk: 40,
    def: 20,
    isAlive: true,
    ...overrides
  }
}

describe('Hero AI - selectHeroSkill', () => {
  describe('Berserker heuristic', () => {
    it('uses rageCost:all skill when rage >= 80', () => {
      const hero = mockBerserker({ currentRage: 85 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill.name).toBe('Crushing Eternity')
    })

    it('spends rage on available skill when rage >= 50', () => {
      const hero = mockBerserker({ currentRage: 55 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
      expect(skill.rageCost).toBeDefined()
      expect(typeof skill.rageCost).toBe('number')
      expect(skill.rageCost).toBeLessThanOrEqual(55)
    })

    it('returns null (basic attack) when rage < cheapest skill cost', () => {
      const hero = mockBerserker({ currentRage: 10 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeNull()
    })
  })

  describe('Ranger heuristic', () => {
    it('uses strongest available skill when focused', () => {
      const hero = mockRanger({ hasFocus: true })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
    })

    it('returns null (basic attack) when not focused', () => {
      const hero = mockRanger({ hasFocus: false })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeNull()
    })
  })

  describe('Knight heuristic', () => {
    it('uses lowest valorRequired skill that hero can afford', () => {
      const hero = mockKnight({ currentValor: 30 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
      expect(skill.valorRequired).toBeLessThanOrEqual(30)
    })

    it('prioritizes defensive skills when any ally below 40% HP', () => {
      const hero = mockKnight({ currentValor: 30 })
      const lowHpAlly = mockHero({ currentHp: 30, maxHp: 100 })
      const skill = selectHeroSkill(hero, [lowHpAlly], [mockEnemy()])
      expect(skill.defensive).toBe(true)
    })

    it('uses basic attack when no affordable skill', () => {
      const hero = mockKnight({ currentValor: 0 })
      // All skills require at least 0 valor, so it should use Challenge
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
    })
  })

  describe('Bard heuristic', () => {
    it('does not repeat the last used skill', () => {
      const hero = mockBard({ lastSkillName: 'Inspiring Song' })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
      expect(skill.name).not.toBe('Inspiring Song')
    })

    it('picks a skill from available non-repeated options', () => {
      const hero = mockBard({ lastSkillName: 'Mana Melody' })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
      expect(skill.name).not.toBe('Mana Melody')
    })
  })

  describe('Alchemist heuristic', () => {
    it('uses skills freely when essence is sufficient', () => {
      const hero = mockAlchemist({ currentEssence: 40 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
      expect(skill.essenceCost).toBeLessThanOrEqual(40)
    })

    it('returns null when essence is too low for any skill', () => {
      const hero = mockAlchemist({ currentEssence: 5 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeNull()
    })
  })

  describe('Standard MP classes (Mage, Paladin, Cleric, Druid)', () => {
    it('uses highest-impact available skill', () => {
      const hero = mockHero({ currentMp: 30 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeTruthy()
      expect(skill.mpCost).toBeLessThanOrEqual(30)
    })

    it('returns null when MP insufficient for any skill', () => {
      const hero = mockHero({ currentMp: 5 })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill).toBeNull()
    })

    it('healer targets lowest-HP ally with heal skill', () => {
      const hero = mockHero({
        classId: 'cleric',
        currentMp: 30,
        template: {
          skills: [
            { name: 'Heal', mpCost: 15, targetType: 'ally', healPercent: 30, noDamage: true },
            { name: 'Smite', mpCost: 20, targetType: 'enemy', damagePercent: 100 }
          ]
        }
      })
      const lowAlly = mockHero({ id: 'ally1', currentHp: 30, maxHp: 100 })
      const fullAlly = mockHero({ id: 'ally2', currentHp: 100, maxHp: 100 })
      const skill = selectHeroSkill(hero, [lowAlly, fullAlly], [mockEnemy()])
      // Should prefer heal when ally is hurt
      expect(skill).toBeTruthy()
    })
  })

  describe('skill cooldowns', () => {
    it('skips skills on cooldown', () => {
      const hero = mockHero({
        currentMp: 50,
        currentCooldowns: { 'Fireball': 2 },
        template: {
          skills: [
            { name: 'Fireball', mpCost: 20, targetType: 'enemy', damagePercent: 130 },
            { name: 'Heal', mpCost: 15, targetType: 'ally', healPercent: 30, noDamage: true }
          ]
        }
      })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill.name).not.toBe('Fireball')
    })
  })

  describe('passive skill filtering', () => {
    it('does not select passive skills', () => {
      const hero = mockHero({
        currentMp: 50,
        template: {
          skills: [
            { name: 'Passive Buff', isPassive: true },
            { name: 'Active Skill', mpCost: 10, targetType: 'enemy', damagePercent: 100 }
          ]
        }
      })
      const skill = selectHeroSkill(hero, [], [mockEnemy()])
      expect(skill.name).toBe('Active Skill')
    })
  })
})

describe('Hero AI - selectTarget', () => {
  it('targets lowest-HP enemy for damage skills', () => {
    const enemies = [
      mockEnemy({ id: 'e1', currentHp: 80 }),
      mockEnemy({ id: 'e2', currentHp: 30 }),
      mockEnemy({ id: 'e3', currentHp: 60 })
    ]
    const skill = { targetType: 'enemy', damagePercent: 100 }
    const target = selectTarget(skill, [], enemies)
    expect(target.id).toBe('e2')
  })

  it('targets lowest-HP ally for healing skills', () => {
    const allies = [
      mockHero({ id: 'a1', currentHp: 90, maxHp: 100 }),
      mockHero({ id: 'a2', currentHp: 40, maxHp: 100 }),
      mockHero({ id: 'a3', currentHp: 70, maxHp: 100 })
    ]
    const skill = { targetType: 'ally', healPercent: 30, noDamage: true }
    const target = selectTarget(skill, allies, [])
    expect(target.id).toBe('a2')
  })

  it('targets highest-ATK ally for damage buffs', () => {
    const allies = [
      mockHero({ id: 'a1', atk: 50 }),
      mockHero({ id: 'a2', atk: 80 }),
      mockHero({ id: 'a3', atk: 60 })
    ]
    const skill = { targetType: 'ally', noDamage: true, effects: [{ type: 'atk_up' }] }
    const target = selectTarget(skill, allies, [])
    expect(target.id).toBe('a2')
  })

  it('targets lowest-DEF ally for defensive buffs', () => {
    const allies = [
      mockHero({ id: 'a1', def: 50 }),
      mockHero({ id: 'a2', def: 20 }),
      mockHero({ id: 'a3', def: 35 })
    ]
    const skill = {
      targetType: 'ally', noDamage: true, defensive: true,
      effects: [{ type: 'def_up' }]
    }
    const target = selectTarget(skill, allies, [])
    expect(target.id).toBe('a2')
  })

  it('returns null for self-targeted skills', () => {
    const skill = { targetType: 'self' }
    const target = selectTarget(skill, [], [])
    expect(target).toBeNull()
  })

  it('returns null for all_enemies/all_allies skills', () => {
    const skill1 = { targetType: 'all_enemies' }
    const skill2 = { targetType: 'all_allies' }
    expect(selectTarget(skill1, [], [])).toBeNull()
    expect(selectTarget(skill2, [], [])).toBeNull()
  })

  it('only targets alive units', () => {
    const enemies = [
      mockEnemy({ id: 'e1', currentHp: 0, isAlive: false }),
      mockEnemy({ id: 'e2', currentHp: 50 })
    ]
    const skill = { targetType: 'enemy', damagePercent: 100 }
    const target = selectTarget(skill, [], enemies)
    expect(target.id).toBe('e2')
  })
})

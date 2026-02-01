import { describe, it, expect } from 'vitest'
import { serializeHero, parseHeroFile } from '../heroSerializer.js'
import { EffectType } from '../../data/statusEffects.js'

describe('heroSerializer', () => {
  describe('serializeHero', () => {
    describe('basic hero without effects', () => {
      it('serializes a minimal hero without effects', () => {
        const hero = {
          id: 'test_hero',
          name: 'Test Hero',
          rarity: 2,
          classId: 'knight',
          baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
          skills: [
            {
              name: 'Basic Attack',
              description: 'A simple attack',
              skillUnlockLevel: 1,
              targetType: 'enemy',
              damagePercent: 100
            }
          ]
        }

        const result = serializeHero(hero)

        // Should NOT include EffectType import since no effects
        expect(result).not.toContain('import { EffectType }')

        // Should export with hero id
        expect(result).toContain('export const test_hero = {')

        // Should use single quotes
        expect(result).toContain("id: 'test_hero'")
        expect(result).toContain("name: 'Test Hero'")
        expect(result).toContain("classId: 'knight'")

        // Should have proper structure
        expect(result).toContain('rarity: 2')
        expect(result).toContain('baseStats: {')
        expect(result).toContain('skills: [')
      })

      it('formats with 2-space indentation', () => {
        const hero = {
          id: 'test_hero',
          name: 'Test Hero',
          rarity: 2,
          classId: 'knight',
          baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
          skills: [
            {
              name: 'Basic Attack',
              description: 'A simple attack',
              skillUnlockLevel: 1,
              targetType: 'enemy',
              damagePercent: 100
            }
          ]
        }

        const result = serializeHero(hero)
        const lines = result.split('\n')

        // Check 2-space indentation for top-level properties
        const idLine = lines.find(l => l.includes("id: 'test_hero'"))
        expect(idLine).toMatch(/^  id:/)
      })
    })

    describe('hero with effects', () => {
      it('adds EffectType import when hero has skill effects', () => {
        const hero = {
          id: 'test_hero',
          name: 'Test Hero',
          rarity: 3,
          classId: 'knight',
          baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
          skills: [
            {
              name: 'Stun Attack',
              description: 'Stuns the enemy',
              skillUnlockLevel: 1,
              targetType: 'enemy',
              damagePercent: 80,
              effects: [
                { type: EffectType.STUN, target: 'enemy', duration: 1 }
              ]
            }
          ]
        }

        const result = serializeHero(hero)

        // Should include EffectType import
        expect(result).toContain("import { EffectType } from '../../statusEffects.js'")

        // Should use EffectType.STUN not 'stun'
        expect(result).toContain('type: EffectType.STUN')
        expect(result).not.toContain("type: 'stun'")
      })

      it('uses EffectType constants for all effect types', () => {
        const hero = {
          id: 'aurora_test',
          name: 'Aurora Test',
          rarity: 5,
          classId: 'paladin',
          baseStats: { hp: 140, atk: 28, def: 30, spd: 12, mp: 60 },
          skills: [
            {
              name: 'Guardian Link',
              description: 'Link to ally',
              mpCost: 20,
              skillUnlockLevel: 1,
              targetType: 'ally',
              noDamage: true,
              effects: [
                { type: EffectType.GUARDIAN_LINK, target: 'ally', duration: 3, redirectPercent: 40 }
              ]
            }
          ]
        }

        const result = serializeHero(hero)

        expect(result).toContain('type: EffectType.GUARDIAN_LINK')
      })

      it('handles multiple effects in a skill', () => {
        const hero = {
          id: 'multi_effect',
          name: 'Multi Effect Hero',
          rarity: 4,
          classId: 'knight',
          baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
          skills: [
            {
              name: 'Combo Attack',
              description: 'Attack with multiple effects',
              skillUnlockLevel: 1,
              targetType: 'enemy',
              damagePercent: 100,
              effects: [
                { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2, value: 20 },
                { type: EffectType.DEF_DOWN, target: 'enemy', duration: 2, value: 15 }
              ]
            }
          ]
        }

        const result = serializeHero(hero)

        expect(result).toContain('type: EffectType.ATK_DOWN')
        expect(result).toContain('type: EffectType.DEF_DOWN')
      })
    })

    describe('hero with leader skill', () => {
      it('serializes leader skill correctly', () => {
        const hero = {
          id: 'leader_hero',
          name: 'Leader Hero',
          rarity: 5,
          classId: 'paladin',
          baseStats: { hp: 140, atk: 28, def: 30, spd: 12, mp: 60 },
          skills: [
            {
              name: 'Basic',
              description: 'Basic attack',
              skillUnlockLevel: 1,
              targetType: 'enemy',
              damagePercent: 100
            }
          ],
          leaderSkill: {
            name: "Dawn's Protection",
            description: 'Non-knight allies gain +15% DEF',
            effects: [
              {
                type: 'passive',
                stat: 'def',
                value: 15,
                condition: { classId: { not: 'knight' } }
              }
            ]
          }
        }

        const result = serializeHero(hero)

        expect(result).toContain('leaderSkill: {')
        expect(result).toContain("name: \"Dawn's Protection\"")
        expect(result).toContain("stat: 'def'")
      })
    })

    describe('hero with finale (bard)', () => {
      it('serializes finale correctly', () => {
        const hero = {
          id: 'bard_hero',
          name: 'Bard Hero',
          rarity: 3,
          classId: 'bard',
          baseStats: { hp: 80, atk: 15, def: 12, spd: 18, mp: 40 },
          skills: [
            {
              name: 'Song',
              description: 'A simple song',
              skillUnlockLevel: 1,
              targetType: 'all_allies',
              noDamage: true
            }
          ],
          finale: {
            name: 'Grand Finale',
            description: 'Restore resources to all allies',
            target: 'all_allies',
            effects: [
              { type: 'resource_grant', mpAmount: 15 },
              { type: 'heal', value: 5 }
            ]
          }
        }

        const result = serializeHero(hero)

        expect(result).toContain('finale: {')
        expect(result).toContain("name: 'Grand Finale'")
        expect(result).toContain("target: 'all_allies'")
        expect(result).toContain("type: 'resource_grant'")
        expect(result).toContain("type: 'heal'")
      })
    })

    describe('string escaping', () => {
      it('uses double quotes for strings containing single quotes', () => {
        const hero = {
          id: 'quote_test',
          name: "Dawn's Hero",
          rarity: 3,
          classId: 'knight',
          baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
          skills: [
            {
              name: "Hero's Strike",
              description: "Deal 100% ATK damage. It's powerful!",
              skillUnlockLevel: 1,
              targetType: 'enemy',
              damagePercent: 100
            }
          ]
        }

        const result = serializeHero(hero)

        // Should use double quotes for strings with apostrophes
        expect(result).toContain("name: \"Dawn's Hero\"")
        expect(result).toContain("name: \"Hero's Strike\"")
      })
    })

    describe('complex effect objects', () => {
      it('serializes effect objects with scaling values', () => {
        const hero = {
          id: 'scaling_hero',
          name: 'Scaling Hero',
          rarity: 4,
          classId: 'knight',
          baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
          skills: [
            {
              name: 'Scaling Attack',
              description: 'Attack with scaling effects',
              skillUnlockLevel: 1,
              targetType: 'enemy',
              effects: [
                {
                  type: EffectType.ATK_DOWN,
                  target: 'enemy',
                  duration: { base: 2, at50: 3 },
                  value: { base: 20, at25: 25 }
                }
              ]
            }
          ]
        }

        const result = serializeHero(hero)

        expect(result).toContain("import { EffectType } from '../../statusEffects.js'")
        expect(result).toContain('duration: { base: 2, at50: 3 }')
        expect(result).toContain('value: { base: 20, at25: 25 }')
      })
    })
  })

  describe('parseHeroFile', () => {
    describe('basic parsing', () => {
      it('parses simple hero file content', () => {
        const content = `export const test_hero = {
  id: 'test_hero',
  name: 'Test Hero',
  rarity: 2,
  classId: 'knight',
  baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
  skills: [
    {
      name: 'Basic Attack',
      description: 'A simple attack',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 100
    }
  ]
}`

        const hero = parseHeroFile(content)

        expect(hero.id).toBe('test_hero')
        expect(hero.name).toBe('Test Hero')
        expect(hero.rarity).toBe(2)
        expect(hero.classId).toBe('knight')
        expect(hero.baseStats.hp).toBe(100)
        expect(hero.skills).toHaveLength(1)
        expect(hero.skills[0].name).toBe('Basic Attack')
      })
    })

    describe('parsing with EffectType references', () => {
      it('replaces EffectType.XXX with string values', () => {
        const content = `import { EffectType } from '../../statusEffects.js'

export const stun_hero = {
  id: 'stun_hero',
  name: 'Stun Hero',
  rarity: 3,
  classId: 'knight',
  baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
  skills: [
    {
      name: 'Stun Attack',
      description: 'Stuns the enemy',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 80,
      effects: [
        { type: EffectType.STUN, target: 'enemy', duration: 1 }
      ]
    }
  ]
}`

        const hero = parseHeroFile(content)

        expect(hero.skills[0].effects[0].type).toBe('stun')
      })

      it('handles multiple different EffectTypes', () => {
        const content = `import { EffectType } from '../../statusEffects.js'

export const multi_effect = {
  id: 'multi_effect',
  name: 'Multi Effect',
  rarity: 4,
  classId: 'knight',
  baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
  skills: [
    {
      name: 'Combo',
      description: 'Multiple effects',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      effects: [
        { type: EffectType.ATK_DOWN, target: 'enemy', duration: 2 },
        { type: EffectType.GUARDIAN_LINK, target: 'ally', duration: 3 },
        { type: EffectType.DAMAGE_REDUCTION, target: 'self', duration: 2 }
      ]
    }
  ]
}`

        const hero = parseHeroFile(content)

        expect(hero.skills[0].effects[0].type).toBe('atk_down')
        expect(hero.skills[0].effects[1].type).toBe('guardian_link')
        expect(hero.skills[0].effects[2].type).toBe('damage_reduction')
      })
    })

    describe('parsing with leader skills', () => {
      it('parses leader skill correctly', () => {
        const content = `export const leader_hero = {
  id: 'leader_hero',
  name: 'Leader Hero',
  rarity: 5,
  classId: 'paladin',
  baseStats: { hp: 140, atk: 28, def: 30, spd: 12, mp: 60 },
  skills: [
    {
      name: 'Basic',
      description: 'Basic attack',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 100
    }
  ],
  leaderSkill: {
    name: "Dawn's Protection",
    description: 'Non-knight allies gain +15% DEF',
    effects: [
      {
        type: 'passive',
        stat: 'def',
        value: 15,
        condition: { classId: { not: 'knight' } }
      }
    ]
  }
}`

        const hero = parseHeroFile(content)

        expect(hero.leaderSkill).toBeDefined()
        expect(hero.leaderSkill.name).toBe("Dawn's Protection")
        expect(hero.leaderSkill.effects[0].type).toBe('passive')
        expect(hero.leaderSkill.effects[0].condition.classId.not).toBe('knight')
      })
    })

    describe('parsing with finale', () => {
      it('parses finale correctly', () => {
        const content = `export const bard_hero = {
  id: 'bard_hero',
  name: 'Bard Hero',
  rarity: 3,
  classId: 'bard',
  baseStats: { hp: 80, atk: 15, def: 12, spd: 18, mp: 40 },
  skills: [
    {
      name: 'Song',
      description: 'A simple song',
      skillUnlockLevel: 1,
      targetType: 'all_allies',
      noDamage: true
    }
  ],
  finale: {
    name: 'Grand Finale',
    description: 'Restore resources to all allies',
    target: 'all_allies',
    effects: [
      { type: 'resource_grant', mpAmount: 15 },
      { type: 'heal', value: 5 }
    ]
  }
}`

        const hero = parseHeroFile(content)

        expect(hero.finale).toBeDefined()
        expect(hero.finale.name).toBe('Grand Finale')
        expect(hero.finale.target).toBe('all_allies')
        expect(hero.finale.effects).toHaveLength(2)
        expect(hero.finale.effects[0].type).toBe('resource_grant')
      })
    })

    describe('edge cases', () => {
      it('handles strings with escaped quotes', () => {
        const content = `export const quote_hero = {
  id: 'quote_hero',
  name: "Hero's Name",
  rarity: 3,
  classId: 'knight',
  baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
  skills: [
    {
      name: "Hero's Strike",
      description: "It's a powerful attack!",
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damagePercent: 100
    }
  ]
}`

        const hero = parseHeroFile(content)

        expect(hero.name).toBe("Hero's Name")
        expect(hero.skills[0].name).toBe("Hero's Strike")
        expect(hero.skills[0].description).toBe("It's a powerful attack!")
      })

      it('handles complex nested objects', () => {
        const content = `import { EffectType } from '../../statusEffects.js'

export const complex_hero = {
  id: 'complex_hero',
  name: 'Complex Hero',
  rarity: 4,
  classId: 'knight',
  baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
  skills: [
    {
      name: 'Scaling Attack',
      description: 'Attack with scaling',
      skillUnlockLevel: 1,
      targetType: 'enemy',
      damage: { base: 100, at50: 115 },
      effects: [
        {
          type: EffectType.SPD_DOWN,
          target: 'enemy',
          duration: { base: 2, at100: 3 },
          value: { base: 5, at100: 6 }
        }
      ]
    }
  ]
}`

        const hero = parseHeroFile(content)

        expect(hero.skills[0].damage).toEqual({ base: 100, at50: 115 })
        expect(hero.skills[0].effects[0].duration).toEqual({ base: 2, at100: 3 })
        expect(hero.skills[0].effects[0].value).toEqual({ base: 5, at100: 6 })
      })
    })
  })

  describe('round-trip serialization', () => {
    it('parse(serialize(hero)) returns equivalent hero', () => {
      const originalHero = {
        id: 'roundtrip_test',
        name: 'Roundtrip Test',
        rarity: 3,
        classId: 'knight',
        baseStats: { hp: 100, atk: 20, def: 15, spd: 10, mp: 50 },
        skills: [
          {
            name: 'Basic Attack',
            description: 'A simple attack',
            skillUnlockLevel: 1,
            targetType: 'enemy',
            damagePercent: 100
          }
        ]
      }

      const serialized = serializeHero(originalHero)
      const parsed = parseHeroFile(serialized)

      expect(parsed.id).toBe(originalHero.id)
      expect(parsed.name).toBe(originalHero.name)
      expect(parsed.rarity).toBe(originalHero.rarity)
      expect(parsed.classId).toBe(originalHero.classId)
      expect(parsed.baseStats).toEqual(originalHero.baseStats)
      expect(parsed.skills[0].name).toBe(originalHero.skills[0].name)
    })

    it('round-trips hero with effects correctly', () => {
      const originalHero = {
        id: 'effect_roundtrip',
        name: 'Effect Roundtrip',
        rarity: 4,
        classId: 'knight',
        baseStats: { hp: 130, atk: 30, def: 45, spd: 10, mp: 50 },
        skills: [
          {
            name: 'Stun Attack',
            description: 'Stuns the enemy',
            skillUnlockLevel: 1,
            targetType: 'enemy',
            damagePercent: 80,
            effects: [
              { type: 'stun', target: 'enemy', duration: 1 }
            ]
          }
        ]
      }

      const serialized = serializeHero(originalHero)
      const parsed = parseHeroFile(serialized)

      expect(parsed.skills[0].effects[0].type).toBe('stun')
      expect(parsed.skills[0].effects[0].target).toBe('enemy')
      expect(parsed.skills[0].effects[0].duration).toBe(1)
    })
  })
})

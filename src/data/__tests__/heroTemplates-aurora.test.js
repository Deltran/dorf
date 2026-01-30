import { describe, it, expect } from 'vitest'
import { heroTemplates } from '../heroes/index.js'
import { EffectType } from '../statusEffects'

describe('Aurora the Dawn hero template', () => {
  const aurora = heroTemplates.aurora_the_dawn

  it('exists with correct identity', () => {
    expect(aurora).toBeDefined()
    expect(aurora.name).toBe('Aurora the Dawn')
    expect(aurora.rarity).toBe(5)
    expect(aurora.classId).toBe('paladin')
  })

  describe('base stats (soak tank budget: 210 combat stats)', () => {
    it('has HP 140 (high pool for damage soaking)', () => {
      expect(aurora.baseStats.hp).toBe(140)
    })

    it('has ATK 28 (tank, not DPS — weakens lifesteal self-heal)', () => {
      expect(aurora.baseStats.atk).toBe(28)
    })

    it('has DEF 30 (below Sir Gallan 45 — soak tank, not mitigation tank)', () => {
      expect(aurora.baseStats.def).toBe(30)
    })

    it('has SPD 12 (unchanged)', () => {
      expect(aurora.baseStats.spd).toBe(12)
    })

    it('has MP 60 (unchanged)', () => {
      expect(aurora.baseStats.mp).toBe(60)
    })

    it('has combat stat total of 210', () => {
      const { hp, atk, def, spd } = aurora.baseStats
      expect(hp + atk + def + spd).toBe(210)
    })
  })

  it('has 5 skills', () => {
    expect(aurora.skills).toHaveLength(5)
  })

  describe('Holy Strike', () => {
    const skill = aurora.skills.find(s => s.name === 'Holy Strike')

    it('exists and targets enemy', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('enemy')
    })

    it('deals 120% ATK with 50% lifesteal', () => {
      expect(skill.damagePercent).toBe(120)
      expect(skill.healSelfPercent).toBe(50)
    })
  })

  describe('Guardian Link', () => {
    const skill = aurora.skills.find(s => s.name === 'Guardian Link')

    it('exists and targets ally', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
    })

    it('redirects 40% damage for 3 turns', () => {
      const effect = skill.effects.find(e => e.type === EffectType.GUARDIAN_LINK)
      expect(effect).toBeDefined()
      expect(effect.redirectPercent).toBe(40)
      expect(effect.duration).toBe(3)
    })
  })

  describe('Consecrated Ground', () => {
    const skill = aurora.skills.find(s => s.name === 'Consecrated Ground')

    it('exists and targets ally', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('ally')
    })

    it('grants 25% damage reduction for 3 turns', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DAMAGE_REDUCTION)
      expect(effect).toBeDefined()
      expect(effect.value).toBe(25)
      expect(effect.duration).toBe(3)
    })
  })

  describe("Judgment's Echo", () => {
    const skill = aurora.skills.find(s => s.name === "Judgment's Echo")

    it('exists and targets self', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
    })

    it('stores damage for 2 turns', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DAMAGE_STORE)
      expect(effect).toBeDefined()
      expect(effect.duration).toBe(2)
    })
  })

  describe('Divine Sacrifice', () => {
    const skill = aurora.skills.find(s => s.name === 'Divine Sacrifice')

    it('exists and targets self', () => {
      expect(skill).toBeDefined()
      expect(skill.targetType).toBe('self')
    })

    it('intercepts ally damage with 50% DR and 15% heal per turn', () => {
      const effect = skill.effects.find(e => e.type === EffectType.DIVINE_SACRIFICE)
      expect(effect).toBeDefined()
      expect(effect.damageReduction).toBe(50)
      expect(effect.healPerTurn).toBe(15)
      expect(effect.duration).toBe(2)
    })
  })

  describe('leader skill', () => {
    it('is Dawn\'s Protection — passive +15% DEF to non-knights', () => {
      expect(aurora.leaderSkill.name).toBe("Dawn's Protection")
      expect(aurora.leaderSkill.effects[0].type).toBe('passive')
      expect(aurora.leaderSkill.effects[0].stat).toBe('def')
      expect(aurora.leaderSkill.effects[0].value).toBe(15)
      expect(aurora.leaderSkill.effects[0].condition).toEqual({ classId: { not: 'knight' } })
    })
  })
})

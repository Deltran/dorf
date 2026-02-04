import { describe, it, expect } from 'vitest'
import { getAllHeroTemplates } from '../index.js'

// Skills that deal damage or heal should have explicit properties
// rather than relying on parseSkillMultiplier(description) fallback.

// Alternative damage properties that indicate damage is explicitly defined
// (not parsed from description text)
const EXPLICIT_DAMAGE_PROPERTIES = [
  'damagePercent',        // Standard: number or Valor-scaled object
  'damage',              // Valor-scaled object (e.g. { base: 100, at50: 140 })
  'damageMultiplier',    // Multiplier-based (e.g. 0.9 for 90%)
  'conditionalDamage',   // HP-threshold conditional (e.g. Matsuda)
  'damagePerHeads',      // Per-coin-flip damage (Copper Jack)
  'dealHpCostAsDamage',  // HP sacrifice as damage (Onibaba)
  'baseDamage',          // Base + scaling (used with damagePerValor/damagePerRage)
  'consumeDebuffs',      // Damage per debuff consumed (Shadow King)
  'damagePerRage',       // Rage-scaling damage (Shadow King)
]

// Alternative heal properties
const EXPLICIT_HEAL_PROPERTIES = [
  'healPercent',         // Standard heal
  'healFromStat',        // Heal from specific stat (e.g. DEF-based heal)
  'isDiceHeal',          // Dice-based random heal (Bones McCready)
]

// Ally-targeted skills that are utility (buffs, MP restore, etc.) not heals
const ALLY_UTILITY_PROPERTIES = [
  'effects',             // Has status effects (buffs)
  'mpRestore',           // Restores MP
  'cleanse',             // Removes debuffs
  'extendBuffs',         // Extends buff durations
]

function hasExplicitDamage(skill) {
  return EXPLICIT_DAMAGE_PROPERTIES.some(prop => skill[prop] !== undefined)
}

function hasExplicitHeal(skill) {
  return EXPLICIT_HEAL_PROPERTIES.some(prop => skill[prop] !== undefined)
}

function isAllyUtility(skill) {
  return ALLY_UTILITY_PROPERTIES.some(prop => skill[prop] !== undefined)
}

describe('Skill explicit properties (no description parsing)', () => {
  const templates = getAllHeroTemplates()

  for (const template of templates) {
    const skills = template.skills || (template.skill ? [template.skill] : [])
    if (skills.length === 0) continue

    // Pre-filter to skills that need testing to avoid empty describe blocks
    const testableSkills = skills.filter(skill => {
      if (skill.isPassive || skill.noDamage) return false
      const isDamage = skill.targetType === 'enemy' || skill.targetType === 'all_enemies' || skill.targetType === 'random_enemies'
      const isHeal = (skill.targetType === 'ally' || skill.targetType === 'all_allies' || skill.targetType === 'dead_ally')
        && !skill.revive && !isAllyUtility(skill)
      return isDamage || isHeal
    })
    if (testableSkills.length === 0) continue

    describe(template.name, () => {
      for (const skill of testableSkills) {
        const isDamageSkill = skill.targetType === 'enemy' || skill.targetType === 'all_enemies' || skill.targetType === 'random_enemies'

        if (isDamageSkill) {
          it(`${skill.name} should have explicit damage property`, () => {
            expect(hasExplicitDamage(skill)).toBe(true)
          })
        } else {
          it(`${skill.name} should have explicit heal property`, () => {
            expect(hasExplicitHeal(skill)).toBe(true)
          })
        }
      }
    })
  }
})

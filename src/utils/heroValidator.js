import { classes } from '../data/classes.js'
import { EffectType } from '../data/statusEffects.js'

// Valid class IDs from classes.js
const validClassIds = Object.keys(classes)

// Classes that use MP (no resourceType means they use standard MP)
const classesUsingMp = Object.entries(classes)
  .filter(([, c]) => !c.resourceType)
  .map(([id]) => id)

// All valid effect types from statusEffects.js
const validEffectTypes = Object.values(EffectType)

// Valid skill target types
const validTargetTypes = ['enemy', 'ally', 'self', 'all_enemies', 'all_allies', 'random_enemies', 'dead_ally']

// Valid effect target types (used within effects)
const validEffectTargets = ['enemy', 'ally', 'self', 'all_enemies', 'all_allies']

// Valid skill unlock levels
const validSkillUnlockLevels = [1, 3, 6, 12]

// Valid finale target types
const validFinaleTargets = ['all_allies', 'all_enemies', 'dynamic']

// Known custom effect types (not in EffectType enum)
// These are special-purpose effects handled by battle.js
const knownCustomEffectTypes = [
  // Finale effects
  'resource_grant',           // Restore MP/Valor/Focus/Rage to allies
  'heal',                     // Heal based on ATK percent
  'damage',                   // Instant damage in finales
  'suffering_crescendo',      // Cacophon's unique scaling buff
  'consume_excess_rage',      // Vraxx's finale - consume Rage from Berserkers
  // Skill effects
  'conditional_resource_or_buff', // Grant resource to specific class, buff to others
  'rage_grant',               // Instant Rage grant to Berserkers
  'fortune_teller'            // Bones McCready's dice-based random buff per turn
]

// Custom effect types that don't require duration (instant/one-time effects)
const durationExemptCustomTypes = [
  'resource_grant',
  'heal',
  'damage',
  'consume_excess_rage',
  'conditional_resource_or_buff',
  'rage_grant'
]

/**
 * Dropdown options for UI forms
 */
export const DROPDOWN_OPTIONS = {
  rarities: [1, 2, 3, 4, 5],
  classIds: validClassIds,
  targetTypes: validTargetTypes,
  effectTargets: validEffectTargets,
  skillUnlockLevels: validSkillUnlockLevels,
  effectTypes: validEffectTypes
}

/**
 * Validates an effect object
 * @param {Object} effect - The effect to validate
 * @param {string} prefix - Prefix for error messages (e.g., "Skill 1")
 * @param {Object} options - Validation options
 * @param {boolean} options.allowCustomTypes - Allow custom effect types (for finales)
 * @returns {string[]} Array of error messages
 */
export function validateEffect(effect, prefix = '', options = {}) {
  const errors = []
  const { allowCustomTypes = false } = options

  if (!effect.type) {
    errors.push('type is required')
  } else if (!allowCustomTypes && !validEffectTypes.includes(effect.type) && !knownCustomEffectTypes.includes(effect.type)) {
    errors.push('type must be a valid EffectType')
  } else if (allowCustomTypes && !validEffectTypes.includes(effect.type) && !knownCustomEffectTypes.includes(effect.type)) {
    // For finales, allow both standard EffectTypes and known custom effect types
    // But still require a non-empty string type
    if (typeof effect.type !== 'string' || effect.type.trim() === '') {
      errors.push('type must be a valid effect type')
    }
  }

  // Duration can be a number or an object (e.g., { base: 2, perRarity: 1 })
  // Some effects don't need duration:
  // - Instant/one-time effects (resource grants, heals, rage consumption)
  // - SHIELD: lasts until broken, uses shieldPercentMaxHp or shieldHp instead
  const durationExemptEffectTypes = [EffectType.SHIELD]
  const requiresDuration = !durationExemptCustomTypes.includes(effect.type) && !durationExemptEffectTypes.includes(effect.type)
  if (requiresDuration) {
    if (effect.duration === undefined || effect.duration === null) {
      errors.push('duration is required (number or object)')
    } else if (typeof effect.duration !== 'number' && typeof effect.duration !== 'object') {
      errors.push('duration is required (number or object)')
    }
  }

  return errors
}

/**
 * Validates a skill object
 * @param {Object} skill - The skill to validate
 * @param {number} index - The skill index (0-based)
 * @returns {string[]} Array of error messages
 */
export function validateSkill(skill, index) {
  const errors = []

  if (!skill.name || typeof skill.name !== 'string' || skill.name.trim() === '') {
    errors.push('name is required')
  }

  if (!skill.description || typeof skill.description !== 'string' || skill.description.trim() === '') {
    errors.push('description is required')
  }

  // skillUnlockLevel can be omitted (defaults to 1) or must be 1, 3, 6, or 12
  if (skill.skillUnlockLevel !== undefined && !validSkillUnlockLevels.includes(skill.skillUnlockLevel)) {
    errors.push('skillUnlockLevel must be 1, 3, 6, or 12')
  }

  // Passive skills don't require targetType - they're automatic effects
  if (!skill.isPassive) {
    if (!skill.targetType || !validTargetTypes.includes(skill.targetType)) {
      errors.push('targetType must be a valid target type')
    }
  }

  // Validate effects if present
  if (skill.effects && Array.isArray(skill.effects)) {
    skill.effects.forEach((effect, effectIndex) => {
      const effectErrors = validateEffect(effect, `Skill ${index + 1}`)
      effectErrors.forEach(err => {
        errors.push(`Effect ${effectIndex + 1}: ${err}`)
      })
    })
  }

  return errors
}

/**
 * Validates a leader skill object
 * @param {Object} leaderSkill - The leader skill to validate
 * @returns {string[]} Array of error messages
 */
export function validateLeaderSkill(leaderSkill) {
  const errors = []

  if (!leaderSkill.name || typeof leaderSkill.name !== 'string' || leaderSkill.name.trim() === '') {
    errors.push('name is required')
  }

  if (!leaderSkill.description || typeof leaderSkill.description !== 'string' || leaderSkill.description.trim() === '') {
    errors.push('description is required')
  }

  return errors
}

/**
 * Validates a finale object (Bard-specific)
 * @param {Object} finale - The finale to validate
 * @returns {string[]} Array of error messages
 */
export function validateFinale(finale) {
  const errors = []

  if (!finale.name || typeof finale.name !== 'string' || finale.name.trim() === '') {
    errors.push('name is required')
  }

  if (!finale.description || typeof finale.description !== 'string' || finale.description.trim() === '') {
    errors.push('description is required')
  }

  // Fortune swap finales don't use target - they affect both allies and enemies
  if (!finale.isFortuneSwap) {
    if (!finale.target) {
      errors.push('target is required')
    } else if (!validFinaleTargets.includes(finale.target)) {
      errors.push('target must be all_allies or all_enemies')
    }
  }

  // Validate effects if present (allow custom types for finales)
  if (finale.effects && Array.isArray(finale.effects)) {
    finale.effects.forEach((effect, effectIndex) => {
      const effectErrors = validateEffect(effect, 'Finale', { allowCustomTypes: true })
      effectErrors.forEach(err => {
        errors.push(`Effect ${effectIndex + 1}: ${err}`)
      })
    })
  }

  return errors
}

/**
 * Validates a complete hero object
 * @param {Object} hero - The hero to validate
 * @returns {string[]} Array of error messages
 */
export function validateHero(hero) {
  const errors = []

  // Required string fields
  if (!hero.id || typeof hero.id !== 'string' || hero.id.trim() === '') {
    errors.push('id is required')
  }

  if (!hero.name || typeof hero.name !== 'string' || hero.name.trim() === '') {
    errors.push('name is required')
  }

  // Rarity validation
  if (hero.rarity === undefined || hero.rarity === null) {
    errors.push('rarity is required')
  } else if (typeof hero.rarity !== 'number' || hero.rarity < 1 || hero.rarity > 5) {
    errors.push('rarity must be between 1 and 5')
  }

  // ClassId validation
  if (!hero.classId) {
    errors.push('classId is required')
  } else if (!validClassIds.includes(hero.classId)) {
    errors.push('classId must be a valid class')
  }

  // BaseStats validation
  if (!hero.baseStats) {
    errors.push('baseStats is required')
  } else {
    // All classes need hp, atk, def, spd
    const coreStats = ['hp', 'atk', 'def', 'spd']
    coreStats.forEach(stat => {
      if (typeof hero.baseStats[stat] !== 'number' || hero.baseStats[stat] <= 0) {
        errors.push(`baseStats.${stat} must be a positive number`)
      }
    })
    // Only MP-using classes (paladin, mage, cleric, druid) require mp stat
    const usesMp = classesUsingMp.includes(hero.classId)
    if (usesMp) {
      if (typeof hero.baseStats.mp !== 'number' || hero.baseStats.mp <= 0) {
        errors.push('baseStats.mp must be a positive number')
      }
    }
  }

  // Skills validation
  if (!hero.skills || !Array.isArray(hero.skills) || hero.skills.length === 0) {
    errors.push('at least one skill is required')
  } else {
    hero.skills.forEach((skill, index) => {
      const skillErrors = validateSkill(skill, index)
      skillErrors.forEach(err => {
        errors.push(`Skill ${index + 1}: ${err}`)
      })
    })
  }

  // Leader skill validation (optional)
  if (hero.leaderSkill) {
    const leaderErrors = validateLeaderSkill(hero.leaderSkill)
    leaderErrors.forEach(err => {
      errors.push(`Leader Skill: ${err}`)
    })
  }

  // Finale validation (optional, for Bards)
  if (hero.finale) {
    const finaleErrors = validateFinale(hero.finale)
    finaleErrors.forEach(err => {
      errors.push(`Finale: ${err}`)
    })
  }

  return errors
}

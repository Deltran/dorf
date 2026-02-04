// src/data/heroAI.js — Heuristic AI for hero-as-enemy combat in colosseum

/**
 * Select a skill for an AI-controlled hero based on class heuristics.
 * Returns the selected skill object, or null for basic attack.
 */
export function selectHeroSkill(hero, allies, enemies) {
  const availableSkills = getAvailableSkills(hero)
  if (availableSkills.length === 0) return null

  switch (hero.classId) {
    case 'berserker':
      return selectBerserkerSkill(hero, availableSkills, allies, enemies)
    case 'ranger':
      return selectRangerSkill(hero, availableSkills)
    case 'knight':
      return selectKnightSkill(hero, availableSkills, allies)
    case 'bard':
      return selectBardSkill(hero, availableSkills)
    case 'alchemist':
      return selectAlchemistSkill(hero, availableSkills)
    default:
      // Paladin, Mage, Cleric, Druid — standard MP classes
      return selectStandardSkill(hero, availableSkills, allies, enemies)
  }
}

/**
 * Select a target for the given skill based on AI heuristics.
 * Returns the selected target unit, or null for self/AoE skills.
 */
export function selectTarget(skill, allies, enemies) {
  const targetType = skill.targetType

  if (targetType === 'self' || targetType === 'all_enemies' || targetType === 'all_allies' || targetType === 'random_enemies') {
    return null
  }

  if (targetType === 'enemy') {
    const alive = enemies.filter(e => e.isAlive)
    if (alive.length === 0) return null
    // Damage skills: target lowest HP enemy
    return alive.reduce((low, e) => e.currentHp < low.currentHp ? e : low)
  }

  if (targetType === 'ally') {
    const alive = allies.filter(a => a.isAlive)
    if (alive.length === 0) return null

    // Healing skills: target lowest HP ally
    if (isHealSkill(skill)) {
      return alive.reduce((low, a) => a.currentHp < low.currentHp ? a : low)
    }

    // Defensive buffs: target lowest DEF ally
    if (skill.defensive) {
      return alive.reduce((low, a) => a.def < low.def ? a : low)
    }

    // Damage buffs: target highest ATK ally
    return alive.reduce((high, a) => a.atk > high.atk ? a : high)
  }

  return null
}

// --- Internal helpers ---

function getAvailableSkills(hero) {
  const skills = hero.template?.skills || []
  return skills.filter(skill => {
    // Skip passives
    if (skill.isPassive) return false
    // Skip skills on cooldown
    if (hero.currentCooldowns && hero.currentCooldowns[skill.name] > 0) return false
    return true
  })
}

function canAffordSkill(hero, skill) {
  // Berserker
  if (skill.rageCost !== undefined) {
    if (skill.rageCost === 'all') return (hero.currentRage || 0) > 0
    return (hero.currentRage || 0) >= skill.rageCost
  }
  // Knight
  if (skill.valorRequired !== undefined) {
    return (hero.currentValor || 0) >= skill.valorRequired
  }
  // Alchemist
  if (skill.essenceCost !== undefined) {
    return (hero.currentEssence || 0) >= skill.essenceCost
  }
  // Ranger (focusCost is optional — rangers need Focus to use any skill)
  if (hero.classId === 'ranger') {
    return hero.hasFocus !== false
  }
  // Bard — skills are free
  if (hero.classId === 'bard') return true
  // Standard MP
  if (skill.mpCost !== undefined) {
    return (hero.currentMp || 0) >= skill.mpCost
  }
  // Free skill
  return true
}

function isHealSkill(skill) {
  return skill.healPercent || skill.selfHealPercent || skill.healFromStat || skill.healAlliesPercent
}

function isAoeSkill(skill) {
  return skill.targetType === 'all_enemies' || skill.targetType === 'random_enemies'
}

// --- Class-specific heuristics ---

function selectBerserkerSkill(hero, skills, allies, enemies) {
  const rage = hero.currentRage || 0
  const affordable = skills.filter(s => canAffordSkill(hero, s))
  if (affordable.length === 0) return null

  // Use rageCost: 'all' when rage >= 80
  if (rage >= 80) {
    const allCostSkill = affordable.find(s => s.rageCost === 'all')
    if (allCostSkill) return allCostSkill
  }

  // Spend rage when above 50 — pick highest-cost affordable skill
  if (rage >= 50) {
    const numbered = affordable.filter(s => typeof s.rageCost === 'number' && s.rageCost > 0)
    if (numbered.length > 0) {
      return numbered.reduce((best, s) => s.rageCost > best.rageCost ? s : best)
    }
  }

  // Low rage — basic attack
  return null
}

function selectRangerSkill(hero, skills) {
  if (!hero.hasFocus) return null

  // Use strongest available skill (prioritize AoE, then highest damage)
  const affordable = skills.filter(s => canAffordSkill(hero, s))
  if (affordable.length === 0) return null

  // Prefer AoE
  const aoe = affordable.filter(s => isAoeSkill(s))
  if (aoe.length > 0) return aoe[0]

  // Pick highest damagePercent
  const damaging = affordable.filter(s => s.damagePercent)
  if (damaging.length > 0) {
    return damaging.reduce((best, s) => (s.damagePercent || 0) > (best.damagePercent || 0) ? s : best)
  }

  return affordable[0]
}

function selectKnightSkill(hero, skills, allies) {
  const valor = hero.currentValor || 0
  const affordable = skills.filter(s => canAffordSkill(hero, s))
  if (affordable.length === 0) return null

  // Check if any ally is below 40% HP
  const allyInDanger = allies.some(a => a.isAlive && (a.currentHp / a.maxHp) < 0.4)

  if (allyInDanger) {
    // Prioritize defensive skills
    const defensive = affordable.filter(s => s.defensive)
    if (defensive.length > 0) {
      // Use lowest valorRequired defensive skill
      return defensive.reduce((best, s) =>
        (s.valorRequired || 0) < (best.valorRequired || 0) ? s : best
      )
    }
  }

  // Use lowest valorRequired skill (save valor, use tier scaling)
  return affordable.reduce((best, s) =>
    (s.valorRequired || 0) < (best.valorRequired || 0) ? s : best
  )
}

function selectBardSkill(hero, skills) {
  const lastUsed = hero.lastSkillName
  // Filter out the last used skill (no repeats)
  const available = skills.filter(s => s.name !== lastUsed)
  if (available.length === 0) {
    // If only one skill and it was the last used, allow it
    return skills.length > 0 ? skills[0] : null
  }
  // Cycle through in order
  return available[0]
}

function selectAlchemistSkill(hero, skills) {
  const essence = hero.currentEssence || 0
  const affordable = skills.filter(s => canAffordSkill(hero, s))
  if (affordable.length === 0) return null

  // Spend essence freely — pick highest cost affordable skill
  return affordable.reduce((best, s) =>
    (s.essenceCost || 0) > (best.essenceCost || 0) ? s : best
  )
}

function selectStandardSkill(hero, skills, allies, enemies) {
  const mp = hero.currentMp || 0
  const affordable = skills.filter(s => canAffordSkill(hero, s))
  if (affordable.length === 0) return null

  // Healers (cleric, druid with heal skills): target lowest-HP ally if ally hurt
  const isHealer = hero.classId === 'cleric' || hero.classId === 'druid'
  if (isHealer) {
    const allyHurt = allies.some(a => a.isAlive && (a.currentHp / a.maxHp) < 0.7)
    if (allyHurt) {
      const healSkills = affordable.filter(s => isHealSkill(s))
      if (healSkills.length > 0) return healSkills[0]
    }
  }

  // Use highest-impact available skill (highest mpCost as proxy for impact)
  return affordable.reduce((best, s) =>
    (s.mpCost || 0) > (best.mpCost || 0) ? s : best
  )
}

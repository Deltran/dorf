import { enemies as forest } from './forest.js'
import { enemies as lake } from './lake.js'
import { enemies as cave } from './cave.js'
import { enemies as mountain } from './mountain.js'
import { enemies as boss } from './boss.js'
import { enemies as summit } from './summit.js'
import { enemies as blistering } from './blistering.js'
import { enemies as janxier } from './janxier.js'
import { enemies as fort } from './fort.js'
import { enemies as catacombs } from './catacombs.js'
import { enemies as morass } from './morass.js'
import { enemies as aquariaGate } from './aquaria_gate.js'
import { enemies as coral } from './coral.js'
// Aquarias main regions
import { enemies as tidewall } from './tidewall.js'
import { enemies as currents } from './currents.js'
import { enemies as murk } from './murk.js'
import { enemies as beggar } from './beggar.js'
import { enemies as pearlgate } from './pearlgate.js'
import { enemies as castle } from './castle.js'
import { enemies as throne } from './throne.js'
import { enemies as scalding } from './scalding.js'
import { enemies as abyss } from './abyss.js'
// Aquarias branch regions
import { enemies as prison } from './prison.js'
import { enemies as shipyard } from './shipyard.js'
import { enemies as blackfin } from './blackfin.js'
import { enemies as archives } from './archives.js'
import { enemies as nursery } from './nursery.js'

export const enemyTemplates = {
  ...forest,
  ...lake,
  ...cave,
  ...mountain,
  ...boss,
  ...summit,
  ...blistering,
  ...janxier,
  ...fort,
  ...catacombs,
  ...morass,
  ...aquariaGate,
  ...coral,
  // Aquarias main regions
  ...tidewall,
  ...currents,
  ...murk,
  ...beggar,
  ...pearlgate,
  ...castle,
  ...throne,
  ...scalding,
  ...abyss,
  // Aquarias branch regions
  ...prison,
  ...shipyard,
  ...blackfin,
  ...archives,
  ...nursery
}

export function getEnemyTemplate(templateId) {
  return enemyTemplates[templateId] || null
}

export function getAllEnemyTemplates() {
  return Object.values(enemyTemplates)
}

/**
 * Extract all enemy IDs that a given enemy can summon via its skills.
 * Covers all summon formats: skill.summon.templateId, skill.summon.enemyId,
 * skill.onKill.summon, and skill.startOfTurn.summon.
 */
export function getSummonedEnemyIds(enemy) {
  const ids = []
  const skills = enemy.skills || (enemy.skill ? [enemy.skill] : [])
  for (const skill of skills) {
    if (skill.summon) {
      const id = skill.summon.templateId || skill.summon.enemyId
      if (id) ids.push(id)
    }
    if (skill.onKill?.summon) ids.push(skill.onKill.summon)
    if (skill.startOfTurn?.summon) ids.push(skill.startOfTurn.summon)
  }
  return ids
}

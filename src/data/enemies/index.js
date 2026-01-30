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
  ...coral
}

export function getEnemyTemplate(templateId) {
  return enemyTemplates[templateId] || null
}

export function getAllEnemyTemplates() {
  return Object.values(enemyTemplates)
}

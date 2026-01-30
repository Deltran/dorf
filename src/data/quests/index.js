import { nodes as whisperingWoodsNodes } from './whispering_woods.js'
import { nodes as echoingCavernsNodes } from './echoing_caverns.js'
import { nodes as whisperLakeNodes } from './whisper_lake.js'
import { nodes as stormwindPeaksNodes } from './stormwind_peaks.js'
import { nodes as hibernationDenNodes } from './hibernation_den.js'
import { nodes as theSummitNodes } from './the_summit.js'
import { nodes as blisteringCliffsides } from './blistering_cliffsides.js'
import { nodes as eruptionVentNodes } from './eruption_vent.js'
import { nodes as janxierFloodplainNodes } from './janxier_floodplain.js'
import { nodes as oldFortCalindashNodes } from './old_fort_calindash.js'
import { nodes as ancientCatacombsNodes } from './ancient_catacombs.js'
import { nodes as undergroundMorassNodes } from './underground_morass.js'
import { nodes as gateToAquariaNodes } from './gate_to_aquaria.js'
import { nodes as coralDepthsNodes } from './coral_depths.js'

export { regions, superRegions } from './regions.js'
import { regions, superRegions } from './regions.js'

export const questNodes = {
  ...whisperingWoodsNodes,
  ...echoingCavernsNodes,
  ...whisperLakeNodes,
  ...stormwindPeaksNodes,
  ...hibernationDenNodes,
  ...theSummitNodes,
  ...blisteringCliffsides,
  ...eruptionVentNodes,
  ...janxierFloodplainNodes,
  ...oldFortCalindashNodes,
  ...ancientCatacombsNodes,
  ...undergroundMorassNodes,
  ...gateToAquariaNodes,
  ...coralDepthsNodes
}

export function getQuestNode(nodeId) {
  return questNodes[nodeId] || null
}

export function getNodesByRegion(regionName) {
  return Object.values(questNodes).filter(n => n.region === regionName)
}

export function getAllQuestNodes() {
  return Object.values(questNodes)
}

export function getRegion(regionId) {
  return regions.find(r => r.id === regionId) || null
}

export function getSuperRegion(superRegionId) {
  return superRegions.find(sr => sr.id === superRegionId) || null
}

export function getRegionsBySuperRegion(superRegionId) {
  return regions.filter(r => r.superRegion === superRegionId)
}

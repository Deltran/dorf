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
// Aquarias main regions
import { nodes as tidewallRuinsNodes } from './tidewall_ruins.js'
import { nodes as outerCurrentsNodes } from './outer_currents.js'
import { nodes as theMurkNodes } from './the_murk.js'
import { nodes as beggarsReefNodes } from './beggars_reef.js'
import { nodes as pearlgatePlazaNodes } from './pearlgate_plaza.js'
import { nodes as coralCastleHallsNodes } from './coral_castle_halls.js'
import { nodes as throneApproachNodes } from './throne_approach.js'
import { nodes as scaldingTraverseNodes } from './scalding_traverse.js'
import { nodes as theAbyssalMawNodes } from './the_abyssal_maw.js'
// Aquarias branch regions
import { nodes as drownedPrisonNodes } from './drowned_prison.js'
import { nodes as sunkenShipyardNodes } from './sunken_shipyard.js'
import { nodes as blackfinDenNodes } from './blackfin_den.js'
import { nodes as forbiddenArchivesNodes } from './forbidden_archives.js'
import { nodes as primordialNurseryNodes } from './primordial_nursery.js'

export { regions, superRegions } from './regions.js'
import { regions, superRegions } from './regions.js'

export const questNodes = {
  // Western Veros
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
  // Aquarias main regions
  ...coralDepthsNodes,
  ...tidewallRuinsNodes,
  ...outerCurrentsNodes,
  ...theMurkNodes,
  ...beggarsReefNodes,
  ...pearlgatePlazaNodes,
  ...coralCastleHallsNodes,
  ...throneApproachNodes,
  ...scaldingTraverseNodes,
  ...theAbyssalMawNodes,
  // Aquarias branch regions
  ...drownedPrisonNodes,
  ...sunkenShipyardNodes,
  ...blackfinDenNodes,
  ...forbiddenArchivesNodes,
  ...primordialNurseryNodes
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

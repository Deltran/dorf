import { regionMeta as whisperingWoods } from './whispering_woods.js'
import { regionMeta as echoingCaverns } from './echoing_caverns.js'
import { regionMeta as whisperLake } from './whisper_lake.js'
import { regionMeta as stormwindPeaks } from './stormwind_peaks.js'
import { regionMeta as hibernationDen } from './hibernation_den.js'
import { regionMeta as theSummit } from './the_summit.js'
import { regionMeta as blisteringCliffsides } from './blistering_cliffsides.js'
import { regionMeta as eruptionVent } from './eruption_vent.js'
import { regionMeta as janxierFloodplain } from './janxier_floodplain.js'
import { regionMeta as oldFortCalindash } from './old_fort_calindash.js'
import { regionMeta as ancientCatacombs } from './ancient_catacombs.js'
import { regionMeta as undergroundMorass } from './underground_morass.js'
import { regionMeta as gateToAquaria } from './gate_to_aquaria.js'
import { regionMeta as coralDepths } from './coral_depths.js'
// Aquarias main regions
import { regionMeta as tidewallRuins } from './tidewall_ruins.js'
import { regionMeta as outerCurrents } from './outer_currents.js'
import { regionMeta as theMurk } from './the_murk.js'
import { regionMeta as beggarsReef } from './beggars_reef.js'
import { regionMeta as pearlgatePlaza } from './pearlgate_plaza.js'
import { regionMeta as coralCastleHalls } from './coral_castle_halls.js'
import { regionMeta as throneApproach } from './throne_approach.js'
import { regionMeta as scaldingTraverse } from './scalding_traverse.js'
import { regionMeta as theAbyssalMaw } from './the_abyssal_maw.js'
// Aquarias branch regions
import { regionMeta as drownedPrison } from './drowned_prison.js'
import { regionMeta as sunkenShipyard } from './sunken_shipyard.js'
import { regionMeta as blackfinDen } from './blackfin_den.js'
import { regionMeta as forbiddenArchives } from './forbidden_archives.js'
import { regionMeta as primordialNursery } from './primordial_nursery.js'

export const superRegions = [
  {
    id: 'western_veros',
    name: 'Western Veros',
    description: 'The familiar lands where your journey began',
    unlockedByDefault: true
  },
  {
    id: 'aquarias',
    name: 'Aquarias',
    description: 'A realm beneath the waves',
    unlockedByDefault: false,
    unlockCondition: { completedNode: 'aqua_08' }
  }
]

export const regions = [
  // Western Veros
  whisperingWoods,
  whisperLake,
  echoingCaverns,
  stormwindPeaks,
  hibernationDen,
  theSummit,
  blisteringCliffsides,
  eruptionVent,
  janxierFloodplain,
  oldFortCalindash,
  ancientCatacombs,
  undergroundMorass,
  gateToAquaria,
  // Aquarias main regions
  coralDepths,
  tidewallRuins,
  outerCurrents,
  theMurk,
  beggarsReef,
  pearlgatePlaza,
  coralCastleHalls,
  throneApproach,
  scaldingTraverse,
  theAbyssalMaw,
  // Aquarias branch regions
  drownedPrison,
  sunkenShipyard,
  blackfinDen,
  forbiddenArchives,
  primordialNursery
]

import whisperingWoodsMap from '../assets/maps/whispering_woods.png'
import whisperLakeMap from '../assets/maps/whisper_lake.png'

export const questNodes = {
  // Whispering Woods (Tutorial / Early Game)
  // Layout: forest_01 -> forest_02 -> (forest_03 OR forest_04) -> forest_05
  forest_01: {
    id: 'forest_01',
    name: 'Dark Thicket',
    region: 'Whispering Woods',
    x: 100,
    y: 320,
    battles: [
      { enemies: ['goblin_scout', 'goblin_scout'] },
      { enemies: ['goblin_scout', 'forest_wolf'] }
    ],
    connections: ['forest_02'],
    rewards: { gems: 50, exp: 80 },
    firstClearBonus: { gems: 30 }
  },
  forest_02: {
    id: 'forest_02',
    name: 'Wolf Den',
    region: 'Whispering Woods',
    x: 280,
    y: 250,
    battles: [
      { enemies: ['forest_wolf', 'forest_wolf'] },
      { enemies: ['forest_wolf', 'goblin_scout', 'goblin_scout'] },
      { enemies: ['dire_wolf'] }
    ],
    connections: ['forest_03', 'forest_04'],
    rewards: { gems: 60, exp: 120 },
    firstClearBonus: { gems: 40 }
  },
  forest_03: {
    id: 'forest_03',
    name: 'Spider Nest',
    region: 'Whispering Woods',
    x: 480,
    y: 400,
    battles: [
      { enemies: ['forest_spider', 'forest_spider', 'forest_spider'] },
      { enemies: ['forest_spider', 'forest_spider', 'goblin_warrior'] },
      { enemies: ['forest_spider', 'forest_spider', 'forest_spider', 'forest_spider'] },
      { enemies: ['spider_queen', 'forest_spider', 'forest_spider'] }
    ],
    connections: ['lake_01'],
    rewards: { gems: 80, exp: 150 },
    firstClearBonus: { gems: 50 }
  },
  forest_04: {
    id: 'forest_04',
    name: 'Goblin Camp',
    region: 'Whispering Woods',
    x: 550,
    y: 270,
    battles: [
      { enemies: ['goblin_scout', 'goblin_warrior', 'goblin_thrower'] },
      { enemies: ['goblin_warrior', 'goblin_warrior', 'goblin_scout', 'goblin_thrower'] },
      { enemies: ['goblin_thrower', 'goblin_thrower', 'goblin_warrior', 'goblin_warrior'] },
      { enemies: ['goblin_chieftain', 'goblin_warrior', 'goblin_thrower'] }
    ],
    connections: ['forest_05'],
    rewards: { gems: 80, exp: 150 },
    firstClearBonus: { gems: 50 }
  },
  forest_05: {
    id: 'forest_05',
    name: 'Goblin Cavern',
    region: 'Whispering Woods',
    x: 570,
    y: 210,
    battles: [
      { enemies: ['goblin_warrior', 'goblin_warrior', 'goblin_shaman'] },
      { enemies: ['goblin_thrower', 'goblin_thrower', 'goblin_bulwark', 'goblin_warrior', 'goblin_trapper'] },
      { enemies: ['goblin_shaman', 'goblin_bulwark', 'goblin_thrower', 'goblin_thrower'] },
      { enemies: ['goblin_warrior', 'goblin_warrior', 'goblin_shaman', 'goblin_bulwark', 'goblin_trapper'] },
      { enemies: ['goblin_commander', 'goblin_shaman', 'goblin_bulwark', 'goblin_trapper', 'goblin_warrior'] }
    ],
    connections: ['cave_01'],
    rewards: { gems: 100, exp: 200 },
    firstClearBonus: { gems: 75 }
  },

  // Echoing Caverns (Mid Game)
  // Layout: cave_01 -> (cave_02 OR cave_03) -> cave_04
  cave_01: {
    id: 'cave_01',
    name: 'Cavern Entrance',
    region: 'Echoing Caverns',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['cave_bat', 'cave_bat', 'cave_bat'] },
      { enemies: ['cave_bat', 'dark_cultist'] },
      { enemies: ['rock_golem'] }
    ],
    connections: ['cave_02', 'cave_03'],
    rewards: { gems: 90, exp: 180 },
    firstClearBonus: { gems: 60 }
  },
  cave_02: {
    id: 'cave_02',
    name: 'Cultist Shrine',
    region: 'Echoing Caverns',
    x: 380,
    y: 100,
    battles: [
      { enemies: ['dark_caster', 'dark_cultist'] },
      { enemies: ['dark_caster', 'dark_cultist', 'cave_bat'] },
      { enemies: ['dark_cultist', 'dark_caster', 'dark_cultist'] }
    ],
    connections: ['cave_04'],
    rewards: { gems: 100, exp: 200 },
    firstClearBonus: { gems: 70 }
  },
  cave_03: {
    id: 'cave_03',
    name: 'Troll Bridge',
    region: 'Echoing Caverns',
    x: 380,
    y: 400,
    battles: [
      { enemies: ['rock_golem', 'cave_bat', 'cave_bat'] },
      { enemies: ['cave_troll'] },
      { enemies: ['cave_troll', 'rock_golem'] }
    ],
    connections: ['cave_04'],
    rewards: { gems: 100, exp: 200 },
    firstClearBonus: { gems: 70 }
  },
  cave_04: {
    id: 'cave_04',
    name: 'Deep Chasm',
    region: 'Echoing Caverns',
    x: 700,
    y: 250,
    battles: [
      { enemies: ['rock_golem', 'rock_golem'] },
      { enemies: ['cave_troll', 'dark_cultist', 'dark_cultist'] },
      { enemies: ['cave_troll', 'cave_troll'] }
    ],
    connections: ['mountain_01'],
    rewards: { gems: 120, exp: 250 },
    firstClearBonus: { gems: 80 }
  },

  // Stormwind Peaks (Late Game)
  // Layout: mountain_01 -> (mountain_02 OR mountain_03) -> mountain_04
  mountain_01: {
    id: 'mountain_01',
    name: 'Mountain Pass',
    region: 'Stormwind Peaks',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['harpy', 'harpy'] },
      { enemies: ['harpy', 'harpy', 'harpy'] },
      { enemies: ['frost_elemental'] }
    ],
    connections: ['mountain_02', 'mountain_03'],
    rewards: { gems: 130, exp: 280 },
    firstClearBonus: { gems: 90 }
  },
  mountain_02: {
    id: 'mountain_02',
    name: 'Frozen Lake',
    region: 'Stormwind Peaks',
    x: 380,
    y: 100,
    battles: [
      { enemies: ['frost_elemental', 'harpy'] },
      { enemies: ['frost_elemental', 'frost_elemental'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'harpy'] }
    ],
    connections: ['mountain_04'],
    rewards: { gems: 150, exp: 320 },
    firstClearBonus: { gems: 100 }
  },
  mountain_03: {
    id: 'mountain_03',
    name: 'Giant\'s Path',
    region: 'Stormwind Peaks',
    x: 380,
    y: 400,
    battles: [
      { enemies: ['mountain_giant'] },
      { enemies: ['harpy', 'harpy', 'harpy', 'harpy'] },
      { enemies: ['mountain_giant', 'frost_elemental'] }
    ],
    connections: ['mountain_04'],
    rewards: { gems: 150, exp: 320 },
    firstClearBonus: { gems: 100 }
  },
  mountain_04: {
    id: 'mountain_04',
    name: 'Dragon\'s Lair',
    region: 'Stormwind Peaks',
    x: 700,
    y: 250,
    battles: [
      { enemies: ['frost_elemental', 'frost_elemental', 'harpy', 'harpy'] },
      { enemies: ['mountain_giant', 'mountain_giant'] },
      { enemies: ['shadow_dragon'] }
    ],
    connections: [],
    rewards: { gems: 200, exp: 500 },
    firstClearBonus: { gems: 150 }
  },

  // Whisper Lake (Branching from Spider Nest)
  // Layout: lake_01 -> lake_02
  lake_01: {
    id: 'lake_01',
    name: 'Misty Shore',
    region: 'Whisper Lake',
    x: 120,
    y: 280,
    battles: [
      { enemies: ['forest_wolf', 'forest_wolf', 'giant_frog'] },
      { enemies: ['lake_serpent', 'lake_serpent'] },
      { enemies: ['dire_wolf', 'giant_frog', 'giant_frog'] }
    ],
    connections: ['lake_02'],
    rewards: { gems: 90, exp: 170 },
    firstClearBonus: { gems: 55 }
  },
  lake_02: {
    id: 'lake_02',
    name: 'Drowned Hollow',
    region: 'Whisper Lake',
    x: 380,
    y: 180,
    battles: [
      { enemies: ['lake_serpent', 'giant_frog', 'giant_frog'] },
      { enemies: ['dire_wolf', 'dire_wolf', 'lake_serpent'] },
      { enemies: ['forest_wolf', 'forest_wolf', 'dire_wolf', 'giant_frog'] },
      { enemies: ['marsh_hag', 'lake_serpent', 'giant_frog'] }
    ],
    connections: [],
    rewards: { gems: 110, exp: 220 },
    firstClearBonus: { gems: 70 }
  }
}

export const regions = [
  {
    id: 'whispering_woods',
    name: 'Whispering Woods',
    startNode: 'forest_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2f1a',
    backgroundImage: whisperingWoodsMap
  },
  {
    id: 'echoing_caverns',
    name: 'Echoing Caverns',
    startNode: 'cave_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a1a2f' // Dark cave blue, placeholder for background image
  },
  {
    id: 'stormwind_peaks',
    name: 'Stormwind Peaks',
    startNode: 'mountain_01',
    width: 800,
    height: 500,
    backgroundColor: '#2a2a3a' // Dark mountain gray, placeholder for background image
  },
  {
    id: 'whisper_lake',
    name: 'Whisper Lake',
    startNode: 'lake_01',
    width: 500,
    height: 450,
    backgroundColor: '#1a2a2f',
    backgroundImage: whisperLakeMap
  }
]

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

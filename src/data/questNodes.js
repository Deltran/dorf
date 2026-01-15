export const questNodes = {
  // Whispering Woods (Tutorial / Early Game)
  forest_01: {
    id: 'forest_01',
    name: 'Dark Thicket',
    region: 'Whispering Woods',
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
    battles: [
      { enemies: ['forest_spider', 'forest_spider', 'forest_spider'] },
      { enemies: ['forest_spider', 'forest_spider', 'goblin_warrior'] },
      { enemies: ['spider_queen'] }
    ],
    connections: ['cave_01'],
    rewards: { gems: 80, exp: 150 },
    firstClearBonus: { gems: 50 }
  },
  forest_04: {
    id: 'forest_04',
    name: 'Goblin Camp',
    region: 'Whispering Woods',
    battles: [
      { enemies: ['goblin_scout', 'goblin_warrior'] },
      { enemies: ['goblin_warrior', 'goblin_warrior', 'goblin_scout'] },
      { enemies: ['goblin_chieftain', 'goblin_warrior'] }
    ],
    connections: ['cave_01'],
    rewards: { gems: 80, exp: 150 },
    firstClearBonus: { gems: 50 }
  },

  // Echoing Caverns (Mid Game)
  cave_01: {
    id: 'cave_01',
    name: 'Cavern Entrance',
    region: 'Echoing Caverns',
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
  mountain_01: {
    id: 'mountain_01',
    name: 'Mountain Pass',
    region: 'Stormwind Peaks',
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
    battles: [
      { enemies: ['frost_elemental', 'frost_elemental', 'harpy', 'harpy'] },
      { enemies: ['mountain_giant', 'mountain_giant'] },
      { enemies: ['shadow_dragon'] }
    ],
    connections: [],
    rewards: { gems: 200, exp: 500 },
    firstClearBonus: { gems: 150 }
  }
}

export const regions = [
  { id: 'whispering_woods', name: 'Whispering Woods', startNode: 'forest_01' },
  { id: 'echoing_caverns', name: 'Echoing Caverns', startNode: 'cave_01' },
  { id: 'stormwind_peaks', name: 'Stormwind Peaks', startNode: 'mountain_01' }
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

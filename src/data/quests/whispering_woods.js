import whisperingWoodsMap from '../../assets/maps/whispering_woods.png'

export const regionMeta = {
  id: 'whispering_woods',
  name: 'Whispering Woods',
  superRegion: 'western_veros',
  startNode: 'forest_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2f1a',
  backgroundImage: whisperingWoodsMap
}

export const nodes = {
  forest_01: {
    id: 'forest_01',
    name: 'Dark Thicket',
    region: 'Whispering Woods',
    x: 41,
    y: 45,
    battles: [
      { enemies: ['goblin_scout', 'goblin_scout'] },
      { enemies: ['goblin_scout', 'forest_wolf'] }
    ],
    connections: ['forest_02'],
    rewards: { gems: 50, gold: 100, exp: 80 },
    firstClearBonus: { gems: 30 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 1, chance: 0.8 },
      { itemId: 'useless_rock', min: 1, max: 1, chance: 0.3 }
    ]
  },
  forest_02: {
    id: 'forest_02',
    name: 'Wolf Den',
    region: 'Whispering Woods',
    x: 182,
    y: 413,
    battles: [
      { enemies: ['forest_wolf', 'forest_wolf'] },
      { enemies: ['forest_wolf', 'goblin_scout', 'goblin_scout'] },
      { enemies: ['dire_wolf'] }
    ],
    connections: ['forest_03', 'forest_04'],
    rewards: { gems: 60, gold: 150, exp: 120 },
    firstClearBonus: { gems: 40 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 0.9 },
      { itemId: 'useless_rock', min: 1, max: 1, chance: 0.25 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.2 }
    ]
  },
  forest_03: {
    id: 'forest_03',
    name: 'Spider Nest',
    region: 'Whispering Woods',
    x: 450,
    y: 292,
    regionLinkPosition: { x: 553, y: 429 },
    battles: [
      { enemies: ['forest_spider', 'forest_spider', 'forest_spider'] },
      { enemies: ['forest_spider', 'forest_spider', 'goblin_warrior'] },
      { enemies: ['forest_spider', 'forest_spider', 'forest_spider', 'forest_spider'] },
      { enemies: ['spider_queen', 'forest_spider', 'forest_spider'] }
    ],
    connections: ['lake_01'],
    rewards: { gems: 80, gold: 200, exp: 150 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.3 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.25 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.15 }
    ]
  },
  forest_04: {
    id: 'forest_04',
    name: 'Goblin Camp',
    region: 'Whispering Woods',
    x: 134,
    y: 607,
    battles: [
      { enemies: ['goblin_scout', 'goblin_warrior', 'goblin_thrower'] },
      { enemies: ['goblin_warrior', 'goblin_warrior', 'goblin_scout', 'goblin_thrower'] },
      { enemies: ['goblin_thrower', 'goblin_thrower', 'goblin_warrior', 'goblin_warrior'] },
      { enemies: ['goblin_chieftain', 'goblin_warrior', 'goblin_thrower'] }
    ],
    connections: ['forest_05'],
    rewards: { gems: 80, gold: 200, exp: 150 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.3 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.4 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.2 }
    ]
  },
  forest_05: {
    id: 'forest_05',
    name: 'Goblin Cavern',
    region: 'Whispering Woods',
    x: 108,
    y: 885,
    regionLinkPosition: { x: 308, y: 801 },
    battles: [
      { enemies: ['goblin_warrior', 'goblin_warrior', 'goblin_shaman'] },
      { enemies: ['goblin_thrower', 'goblin_thrower', 'goblin_bulwark', 'goblin_warrior', 'goblin_trapper'] },
      { enemies: ['goblin_shaman', 'goblin_bulwark', 'goblin_thrower', 'goblin_thrower'] },
      { enemies: ['goblin_warrior', 'goblin_warrior', 'goblin_shaman', 'goblin_bulwark', 'goblin_trapper'] },
      { enemies: ['goblin_commander', 'goblin_shaman', 'goblin_bulwark', 'goblin_trapper', 'goblin_warrior'] }
    ],
    connections: ['cave_01'],
    rewards: { gems: 100, gold: 250, exp: 200 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.5 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.25 }
    ]
  }
}

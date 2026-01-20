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
    x: 280,
    y: 250,
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
    x: 480,
    y: 400,
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
    x: 550,
    y: 270,
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
    rewards: { gems: 100, gold: 250, exp: 200 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.5 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 }
    ]
  },

  // Echoing Caverns (Mid Game)
  // Layout: cave_01 -> (cave_02 OR cave_03) -> cave_05 -> (cave_06 OR cave_07) -> cave_04
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
    rewards: { gems: 90, gold: 220, exp: 180 },
    firstClearBonus: { gems: 60 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.4 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.35 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.2 }
    ]
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
    connections: ['cave_05'],
    rewards: { gems: 100, gold: 250, exp: 200 },
    firstClearBonus: { gems: 70 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.4 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 }
    ]
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
    connections: ['cave_05'],
    rewards: { gems: 100, gold: 250, exp: 200 },
    firstClearBonus: { gems: 70 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.4 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 }
    ]
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
    rewards: { gems: 100, gold: 300, exp: 250 },
    firstClearBonus: { gems: 80 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.2 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.5 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_05: {
    id: 'cave_05',
    name: 'Ritual Chamber',
    region: 'Echoing Caverns',
    x: 480,
    y: 250,
    battles: [
      { enemies: ['cultist_ritualist', 'dark_cultist', 'dark_cultist'] },
      { enemies: ['corrupted_golem', 'dark_caster'] },
      { enemies: ['cultist_ritualist', 'dark_caster', 'dark_cultist', 'dark_cultist'] }
    ],
    connections: ['cave_06', 'cave_07'],
    rewards: { gems: 95, gold: 270, exp: 220 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.45 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.4 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 }
    ]
  },
  cave_06: {
    id: 'cave_06',
    name: 'Blood Altar',
    region: 'Echoing Caverns',
    x: 600,
    y: 120,
    battles: [
      { enemies: ['dark_caster', 'dark_caster', 'cultist_ritualist'] },
      { enemies: ['cultist_ritualist', 'cultist_ritualist', 'dark_cultist', 'dark_cultist'] },
      { enemies: ['dark_caster', 'dark_caster', 'cultist_ritualist', 'corrupted_golem'] }
    ],
    connections: ['cave_04'],
    rewards: { gems: 100, gold: 285, exp: 235 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.25 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.45 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_07: {
    id: 'cave_07',
    name: 'Summoning Circle',
    region: 'Echoing Caverns',
    x: 600,
    y: 380,
    battles: [
      { enemies: ['corrupted_golem', 'corrupted_golem'] },
      { enemies: ['cave_troll', 'cultist_ritualist', 'dark_cultist'] },
      { enemies: ['corrupted_golem', 'cave_troll', 'cultist_ritualist', 'dark_cultist'] }
    ],
    connections: ['cave_04'],
    rewards: { gems: 100, gold: 285, exp: 235 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.25 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.45 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 }
    ]
  },

  // Stormwind Peaks (Late Game)
  // Layout: mountain_01 -> (mountain_02 OR mountain_03) -> mountain_05 -> (mountain_06 OR mountain_07) -> mountain_04
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
    rewards: { gems: 100, gold: 350, exp: 280 },
    firstClearBonus: { gems: 90 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.3 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.5 }
    ]
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
    connections: ['mountain_05'],
    rewards: { gems: 100, gold: 400, exp: 320 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.4 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 }
    ]
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
    connections: ['mountain_05'],
    rewards: { gems: 100, gold: 400, exp: 320 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.4 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 }
    ]
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
    connections: ['summit_01'],
    rewards: { gems: 100, gold: 500, exp: 500 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.6 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.7 }
    ]
  },
  mountain_05: {
    id: 'mountain_05',
    name: 'Storm Plateau',
    region: 'Stormwind Peaks',
    x: 480,
    y: 250,
    battles: [
      { enemies: ['storm_elemental', 'frost_elemental'] },
      { enemies: ['thunder_hawk', 'thunder_hawk', 'harpy'] },
      { enemies: ['storm_elemental', 'storm_elemental', 'thunder_hawk'] }
    ],
    connections: ['mountain_06', 'mountain_07'],
    rewards: { gems: 95, gold: 420, exp: 350 },
    firstClearBonus: { gems: 105 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.35 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.55 }
    ]
  },
  mountain_06: {
    id: 'mountain_06',
    name: 'Lightning Spire',
    region: 'Stormwind Peaks',
    x: 600,
    y: 100,
    battles: [
      { enemies: ['storm_elemental', 'storm_elemental'] },
      { enemies: ['thunder_hawk', 'thunder_hawk', 'thunder_hawk'] },
      { enemies: ['storm_elemental', 'storm_elemental', 'thunder_hawk', 'thunder_hawk'] }
    ],
    connections: ['mountain_04'],
    rewards: { gems: 100, gold: 450, exp: 400 },
    firstClearBonus: { gems: 115 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.45 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 }
    ]
  },
  mountain_07: {
    id: 'mountain_07',
    name: 'Howling Cliffs',
    region: 'Stormwind Peaks',
    x: 600,
    y: 400,
    battles: [
      { enemies: ['mountain_giant', 'storm_elemental'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'thunder_hawk', 'thunder_hawk'] },
      { enemies: ['mountain_giant', 'storm_elemental', 'thunder_hawk'] }
    ],
    connections: ['mountain_04'],
    rewards: { gems: 100, gold: 450, exp: 400 },
    firstClearBonus: { gems: 115 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.45 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 }
    ]
  },

  // Whisper Lake (Branching from Spider Nest)
  // Layout: lake_01 -> lake_02
  lake_01: {
    id: 'lake_01',
    name: 'Misty Shore',
    region: 'Whisper Lake',
    x: 450,
    y: 80,
    battles: [
      { enemies: ['forest_wolf', 'forest_wolf', 'giant_frog'] },
      { enemies: ['lake_serpent', 'lake_serpent'] },
      { enemies: ['dire_wolf', 'giant_frog', 'giant_frog'] }
    ],
    connections: ['lake_02'],
    rewards: { gems: 90, gold: 220, exp: 170 },
    firstClearBonus: { gems: 55 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.35 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.3 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.2 }
    ]
  },
  lake_02: {
    id: 'lake_02',
    name: 'Drowned Hollow',
    region: 'Whisper Lake',
    x: 470,
    y: 280,
    battles: [
      { enemies: ['lake_serpent', 'giant_frog', 'giant_frog'] },
      { enemies: ['dire_wolf', 'dire_wolf', 'lake_serpent'] },
      { enemies: ['forest_wolf', 'forest_wolf', 'dire_wolf', 'giant_frog'] },
      { enemies: ['marsh_hag', 'lake_serpent', 'giant_frog'] }
    ],
    connections: [],
    rewards: { gems: 110, gold: 280, exp: 220 },
    firstClearBonus: { gems: 70 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.45 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.35 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.2 }
    ]
  },

  // The Summit (Ancient Wind Temple) - BOSS: Ancient Titan
  // Layout: summit_01 -> summit_02 -> summit_03 -> (summit_04 OR summit_05) -> summit_06
  summit_01: {
    id: 'summit_01',
    name: 'Windswept Ascent',
    region: 'The Summit',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['wind_spirit', 'wind_spirit'] },
      { enemies: ['frost_elemental', 'wind_spirit'] },
      { enemies: ['wind_spirit', 'wind_spirit', 'ice_wraith'] },
      { enemies: ['storm_elemental', 'wind_spirit'] },
      { enemies: ['ice_wraith', 'ice_wraith', 'wind_spirit'] }
    ],
    connections: ['summit_02'],
    rewards: { gems: 100, gold: 550, exp: 550 },
    firstClearBonus: { gems: 120 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 }
    ]
  },
  summit_02: {
    id: 'summit_02',
    name: 'Frozen Shrine',
    region: 'The Summit',
    x: 250,
    y: 180,
    battles: [
      { enemies: ['ice_wraith', 'ice_wraith', 'ancient_guardian'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'wind_spirit'] },
      { enemies: ['ancient_guardian', 'ice_wraith', 'ice_wraith'] },
      { enemies: ['wind_spirit', 'wind_spirit', 'ice_wraith', 'ice_wraith'] },
      { enemies: ['summit_giant', 'wind_spirit'] }
    ],
    connections: ['summit_03'],
    rewards: { gems: 100, gold: 580, exp: 580 },
    firstClearBonus: { gems: 125 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.55 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.65 }
    ]
  },
  summit_03: {
    id: 'summit_03',
    name: 'Guardian\'s Gate',
    region: 'The Summit',
    x: 400,
    y: 250,
    battles: [
      { enemies: ['ancient_guardian', 'ancient_guardian'] },
      { enemies: ['summit_giant', 'ice_wraith', 'ice_wraith'] },
      { enemies: ['ancient_guardian', 'wind_spirit', 'wind_spirit', 'ice_wraith'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'ancient_guardian'] },
      { enemies: ['summit_giant', 'ancient_guardian'] }
    ],
    connections: ['summit_04', 'summit_05'],
    rewards: { gems: 100, gold: 600, exp: 600 },
    firstClearBonus: { gems: 130 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.6 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.7 }
    ]
  },
  summit_04: {
    id: 'summit_04',
    name: 'Hall of Winds',
    region: 'The Summit',
    x: 550,
    y: 120,
    battles: [
      { enemies: ['wind_spirit', 'wind_spirit', 'wind_spirit', 'wind_spirit'] },
      { enemies: ['storm_elemental', 'storm_elemental', 'wind_spirit'] },
      { enemies: ['wind_spirit', 'wind_spirit', 'storm_elemental', 'ice_wraith'] },
      { enemies: ['ancient_guardian', 'wind_spirit', 'wind_spirit', 'wind_spirit'] },
      { enemies: ['storm_elemental', 'wind_spirit', 'wind_spirit', 'ice_wraith'] },
      { enemies: ['summit_giant', 'storm_elemental'] }
    ],
    connections: ['summit_06'],
    rewards: { gems: 100, gold: 620, exp: 620 },
    firstClearBonus: { gems: 135 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.65 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.7 }
    ]
  },
  summit_05: {
    id: 'summit_05',
    name: 'Frost Sanctum',
    region: 'The Summit',
    x: 550,
    y: 380,
    battles: [
      { enemies: ['ice_wraith', 'ice_wraith', 'ice_wraith'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'ice_wraith'] },
      { enemies: ['ancient_guardian', 'ice_wraith', 'ice_wraith', 'ice_wraith'] },
      { enemies: ['summit_giant', 'frost_elemental'] },
      { enemies: ['ice_wraith', 'ice_wraith', 'frost_elemental', 'frost_elemental'] },
      { enemies: ['ancient_guardian', 'ancient_guardian', 'ice_wraith'] }
    ],
    connections: ['summit_06'],
    rewards: { gems: 100, gold: 620, exp: 620 },
    firstClearBonus: { gems: 135 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.65 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.7 }
    ]
  },
  summit_06: {
    id: 'summit_06',
    name: 'Titan\'s Throne',
    region: 'The Summit',
    x: 700,
    y: 250,
    battles: [
      { enemies: ['summit_giant', 'summit_giant'] },
      { enemies: ['ancient_guardian', 'ancient_guardian', 'ice_wraith', 'ice_wraith'] },
      { enemies: ['summit_giant', 'ancient_guardian', 'wind_spirit', 'wind_spirit'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'storm_elemental', 'storm_elemental'] },
      { enemies: ['summit_giant', 'summit_giant', 'ancient_guardian'] },
      { enemies: ['ancient_titan'] }
    ],
    connections: ['cliffs_01'],
    rewards: { gems: 100, gold: 700, exp: 700 },
    firstClearBonus: { gems: 175 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.8 }
    ]
  },

  // Blistering Cliffsides (Volcanic) - No boss
  // Layout: cliffs_01 -> cliffs_02 -> (cliffs_03 OR cliffs_04) -> cliffs_05 -> cliffs_06
  cliffs_01: {
    id: 'cliffs_01',
    name: 'Scorched Trail',
    region: 'Blistering Cliffsides',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['ash_crawler', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'ash_crawler'] },
      { enemies: ['harpy', 'harpy', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['flame_salamander', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'fire_elemental'] }
    ],
    connections: ['cliffs_02'],
    rewards: { gems: 100, gold: 720, exp: 720 },
    firstClearBonus: { gems: 140 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.7 }
    ]
  },
  cliffs_02: {
    id: 'cliffs_02',
    name: 'Ember Fields',
    region: 'Blistering Cliffsides',
    x: 230,
    y: 180,
    battles: [
      { enemies: ['fire_elemental', 'fire_elemental', 'ash_crawler'] },
      { enemies: ['flame_salamander', 'flame_salamander'] },
      { enemies: ['magma_golem', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'flame_salamander', 'ash_crawler'] },
      { enemies: ['harpy', 'harpy', 'fire_elemental', 'fire_elemental'] }
    ],
    connections: ['cliffs_03', 'cliffs_04'],
    rewards: { gems: 100, gold: 750, exp: 750 },
    firstClearBonus: { gems: 145 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.75 }
    ]
  },
  cliffs_03: {
    id: 'cliffs_03',
    name: 'Magma Pools',
    region: 'Blistering Cliffsides',
    x: 400,
    y: 100,
    battles: [
      { enemies: ['magma_golem', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'flame_salamander'] },
      { enemies: ['magma_golem', 'magma_golem'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'flame_salamander'] },
      { enemies: ['volcanic_drake', 'ash_crawler', 'ash_crawler'] }
    ],
    connections: ['cliffs_05'],
    rewards: { gems: 100, gold: 780, exp: 780 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 }
    ]
  },
  cliffs_04: {
    id: 'cliffs_04',
    name: 'Sulfur Vents',
    region: 'Blistering Cliffsides',
    x: 400,
    y: 400,
    battles: [
      { enemies: ['ash_crawler', 'ash_crawler', 'ash_crawler', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'magma_golem'] },
      { enemies: ['harpy', 'harpy', 'flame_salamander', 'flame_salamander'] },
      { enemies: ['magma_golem', 'fire_elemental', 'fire_elemental'] }
    ],
    connections: ['cliffs_05'],
    rewards: { gems: 100, gold: 780, exp: 780 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 }
    ]
  },
  cliffs_05: {
    id: 'cliffs_05',
    name: 'Caldera Ridge',
    region: 'Blistering Cliffsides',
    x: 570,
    y: 250,
    battles: [
      { enemies: ['volcanic_drake', 'fire_elemental'] },
      { enemies: ['magma_golem', 'magma_golem', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['volcanic_drake', 'flame_salamander'] },
      { enemies: ['magma_golem', 'volcanic_drake'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'magma_golem', 'flame_salamander'] }
    ],
    connections: ['cliffs_06'],
    rewards: { gems: 100, gold: 800, exp: 800 },
    firstClearBonus: { gems: 155 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.8 }
    ]
  },
  cliffs_06: {
    id: 'cliffs_06',
    name: 'Inferno Peak',
    region: 'Blistering Cliffsides',
    x: 700,
    y: 250,
    battles: [
      { enemies: ['volcanic_drake', 'volcanic_drake'] },
      { enemies: ['magma_golem', 'magma_golem', 'flame_salamander'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['volcanic_drake', 'magma_golem', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'volcanic_drake'] },
      { enemies: ['volcanic_drake', 'volcanic_drake', 'magma_golem'] }
    ],
    connections: ['flood_01'],
    rewards: { gems: 100, gold: 850, exp: 850 },
    firstClearBonus: { gems: 160 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 }
    ]
  },

  // Janxier Floodplain (Flooded Plains) - BOSS: Hydra
  // Layout: flood_01 -> flood_02 -> flood_03 -> (flood_04 OR flood_05) -> flood_06 -> flood_07
  flood_01: {
    id: 'flood_01',
    name: 'Muddy Banks',
    region: 'Janxier Floodplain',
    x: 80,
    y: 250,
    battles: [
      { enemies: ['giant_frog', 'giant_frog', 'giant_frog'] },
      { enemies: ['swamp_lurker', 'giant_frog'] },
      { enemies: ['lake_serpent', 'lake_serpent', 'giant_frog'] },
      { enemies: ['mud_elemental', 'giant_frog', 'giant_frog'] },
      { enemies: ['swamp_lurker', 'swamp_lurker'] }
    ],
    connections: ['flood_02'],
    rewards: { gems: 100, gold: 870, exp: 870 },
    firstClearBonus: { gems: 165 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.8 }
    ]
  },
  flood_02: {
    id: 'flood_02',
    name: 'Submerged Path',
    region: 'Janxier Floodplain',
    x: 200,
    y: 180,
    battles: [
      { enemies: ['lake_serpent', 'lake_serpent', 'swamp_lurker'] },
      { enemies: ['mud_elemental', 'mud_elemental'] },
      { enemies: ['water_naga', 'giant_frog', 'giant_frog'] },
      { enemies: ['swamp_lurker', 'swamp_lurker', 'lake_serpent'] },
      { enemies: ['giant_crocodile', 'giant_frog'] }
    ],
    connections: ['flood_03'],
    rewards: { gems: 100, gold: 900, exp: 900 },
    firstClearBonus: { gems: 170 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 }
    ]
  },
  flood_03: {
    id: 'flood_03',
    name: 'Naga Territory',
    region: 'Janxier Floodplain',
    x: 320,
    y: 250,
    battles: [
      { enemies: ['water_naga', 'water_naga'] },
      { enemies: ['water_naga', 'swamp_lurker', 'swamp_lurker'] },
      { enemies: ['mud_elemental', 'water_naga', 'lake_serpent'] },
      { enemies: ['giant_crocodile', 'water_naga'] },
      { enemies: ['water_naga', 'water_naga', 'mud_elemental'] }
    ],
    connections: ['flood_04', 'flood_05'],
    rewards: { gems: 100, gold: 920, exp: 920 },
    firstClearBonus: { gems: 175 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 }
    ]
  },
  flood_04: {
    id: 'flood_04',
    name: 'Crocodile Den',
    region: 'Janxier Floodplain',
    x: 470,
    y: 120,
    battles: [
      { enemies: ['giant_crocodile', 'giant_crocodile'] },
      { enemies: ['giant_crocodile', 'swamp_lurker', 'swamp_lurker'] },
      { enemies: ['mud_elemental', 'giant_crocodile', 'lake_serpent'] },
      { enemies: ['giant_crocodile', 'giant_crocodile', 'giant_frog', 'giant_frog'] },
      { enemies: ['swamp_lurker', 'swamp_lurker', 'giant_crocodile'] },
      { enemies: ['giant_crocodile', 'giant_crocodile', 'water_naga'] }
    ],
    connections: ['flood_06'],
    rewards: { gems: 100, gold: 950, exp: 950 },
    firstClearBonus: { gems: 180 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  flood_05: {
    id: 'flood_05',
    name: 'Murky Depths',
    region: 'Janxier Floodplain',
    x: 470,
    y: 380,
    battles: [
      { enemies: ['mud_elemental', 'mud_elemental', 'mud_elemental'] },
      { enemies: ['lake_serpent', 'lake_serpent', 'lake_serpent', 'lake_serpent'] },
      { enemies: ['water_naga', 'mud_elemental', 'swamp_lurker'] },
      { enemies: ['giant_crocodile', 'mud_elemental'] },
      { enemies: ['swamp_lurker', 'swamp_lurker', 'mud_elemental', 'mud_elemental'] },
      { enemies: ['water_naga', 'water_naga', 'lake_serpent', 'lake_serpent'] }
    ],
    connections: ['flood_06'],
    rewards: { gems: 100, gold: 950, exp: 950 },
    firstClearBonus: { gems: 180 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  flood_06: {
    id: 'flood_06',
    name: 'Serpent\'s Crossing',
    region: 'Janxier Floodplain',
    x: 600,
    y: 250,
    battles: [
      { enemies: ['lake_serpent', 'lake_serpent', 'lake_serpent'] },
      { enemies: ['water_naga', 'water_naga', 'giant_crocodile'] },
      { enemies: ['mud_elemental', 'mud_elemental', 'water_naga'] },
      { enemies: ['giant_crocodile', 'giant_crocodile', 'swamp_lurker'] },
      { enemies: ['water_naga', 'lake_serpent', 'lake_serpent', 'swamp_lurker'] },
      { enemies: ['mud_elemental', 'giant_crocodile', 'water_naga'] }
    ],
    connections: ['flood_07'],
    rewards: { gems: 100, gold: 980, exp: 980 },
    firstClearBonus: { gems: 185 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  flood_07: {
    id: 'flood_07',
    name: 'Hydra\'s Lair',
    region: 'Janxier Floodplain',
    x: 720,
    y: 250,
    battles: [
      { enemies: ['giant_crocodile', 'giant_crocodile', 'giant_crocodile'] },
      { enemies: ['water_naga', 'water_naga', 'mud_elemental', 'mud_elemental'] },
      { enemies: ['swamp_lurker', 'swamp_lurker', 'giant_crocodile', 'water_naga'] },
      { enemies: ['mud_elemental', 'mud_elemental', 'lake_serpent', 'lake_serpent', 'lake_serpent'] },
      { enemies: ['giant_crocodile', 'water_naga', 'water_naga'] },
      { enemies: ['hydra'] }
    ],
    connections: ['fort_01'],
    rewards: { gems: 100, gold: 1050, exp: 1050 },
    firstClearBonus: { gems: 200 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },

  // Old Fort Calindash (Ruined Fort) - No boss
  // Layout: fort_01 -> fort_02 -> (fort_03 OR fort_04) -> fort_05 -> fort_06
  fort_01: {
    id: 'fort_01',
    name: 'Outer Walls',
    region: 'Old Fort Calindash',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['bandit_scout', 'bandit_scout', 'bandit_scout'] },
      { enemies: ['skeletal_soldier', 'skeletal_soldier'] },
      { enemies: ['bandit_scout', 'bandit_brute'] },
      { enemies: ['ghostly_knight', 'skeletal_soldier'] },
      { enemies: ['bandit_scout', 'bandit_scout', 'skeletal_soldier', 'skeletal_soldier'] }
    ],
    connections: ['fort_02'],
    rewards: { gems: 100, gold: 1080, exp: 1080 },
    firstClearBonus: { gems: 190 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 }
    ]
  },
  fort_02: {
    id: 'fort_02',
    name: 'Courtyard',
    region: 'Old Fort Calindash',
    x: 230,
    y: 180,
    battles: [
      { enemies: ['bandit_brute', 'bandit_brute'] },
      { enemies: ['skeletal_soldier', 'skeletal_soldier', 'ghostly_knight'] },
      { enemies: ['bandit_scout', 'bandit_scout', 'bandit_brute', 'fort_specter'] },
      { enemies: ['ghostly_knight', 'ghostly_knight'] },
      { enemies: ['deserter_captain', 'bandit_scout', 'bandit_scout'] }
    ],
    connections: ['fort_03', 'fort_04'],
    rewards: { gems: 100, gold: 1100, exp: 1100 },
    firstClearBonus: { gems: 195 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  fort_03: {
    id: 'fort_03',
    name: 'Barracks',
    region: 'Old Fort Calindash',
    x: 400,
    y: 100,
    battles: [
      { enemies: ['bandit_brute', 'bandit_brute', 'bandit_scout'] },
      { enemies: ['deserter_captain', 'bandit_brute'] },
      { enemies: ['bandit_scout', 'bandit_scout', 'bandit_scout', 'bandit_brute', 'bandit_brute'] },
      { enemies: ['fort_specter', 'bandit_brute', 'bandit_scout'] },
      { enemies: ['deserter_captain', 'bandit_scout', 'bandit_scout', 'bandit_brute'] },
      { enemies: ['bandit_brute', 'bandit_brute', 'bandit_brute'] }
    ],
    connections: ['fort_05'],
    rewards: { gems: 100, gold: 1130, exp: 1130 },
    firstClearBonus: { gems: 200 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  fort_04: {
    id: 'fort_04',
    name: 'Haunted Chapel',
    region: 'Old Fort Calindash',
    x: 400,
    y: 400,
    battles: [
      { enemies: ['ghostly_knight', 'ghostly_knight', 'skeletal_soldier'] },
      { enemies: ['fort_specter', 'fort_specter'] },
      { enemies: ['skeletal_soldier', 'skeletal_soldier', 'skeletal_soldier', 'ghostly_knight'] },
      { enemies: ['fort_specter', 'ghostly_knight', 'skeletal_soldier'] },
      { enemies: ['ghostly_knight', 'ghostly_knight', 'fort_specter'] },
      { enemies: ['fort_specter', 'fort_specter', 'skeletal_soldier', 'skeletal_soldier'] }
    ],
    connections: ['fort_05'],
    rewards: { gems: 100, gold: 1130, exp: 1130 },
    firstClearBonus: { gems: 200 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  fort_05: {
    id: 'fort_05',
    name: 'Commander\'s Hall',
    region: 'Old Fort Calindash',
    x: 570,
    y: 250,
    battles: [
      { enemies: ['deserter_captain', 'ghostly_knight'] },
      { enemies: ['bandit_brute', 'bandit_brute', 'skeletal_soldier', 'skeletal_soldier'] },
      { enemies: ['fort_specter', 'fort_specter', 'ghostly_knight'] },
      { enemies: ['deserter_captain', 'bandit_brute', 'bandit_brute'] },
      { enemies: ['ghostly_knight', 'ghostly_knight', 'fort_specter', 'skeletal_soldier'] },
      { enemies: ['deserter_captain', 'deserter_captain'] }
    ],
    connections: ['fort_06'],
    rewards: { gems: 100, gold: 1150, exp: 1150 },
    firstClearBonus: { gems: 205 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  fort_06: {
    id: 'fort_06',
    name: 'Dungeon Entrance',
    region: 'Old Fort Calindash',
    x: 700,
    y: 250,
    battles: [
      { enemies: ['ghostly_knight', 'ghostly_knight', 'ghostly_knight'] },
      { enemies: ['deserter_captain', 'fort_specter', 'skeletal_soldier', 'skeletal_soldier'] },
      { enemies: ['bandit_brute', 'bandit_brute', 'deserter_captain'] },
      { enemies: ['fort_specter', 'fort_specter', 'ghostly_knight', 'ghostly_knight'] },
      { enemies: ['deserter_captain', 'ghostly_knight', 'fort_specter'] },
      { enemies: ['deserter_captain', 'deserter_captain', 'bandit_brute'] }
    ],
    connections: ['cata_01'],
    rewards: { gems: 100, gold: 1180, exp: 1180 },
    firstClearBonus: { gems: 210 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },

  // Ancient Catacombs (Undead Tombs) - BOSS: Lich King
  // Layout: cata_01 -> cata_02 -> cata_03 -> (cata_04 OR cata_05) -> cata_06 -> cata_07
  cata_01: {
    id: 'cata_01',
    name: 'Tomb Entrance',
    region: 'Ancient Catacombs',
    x: 80,
    y: 250,
    battles: [
      { enemies: ['skeleton_warrior', 'skeleton_warrior', 'skeleton_warrior'] },
      { enemies: ['mummy', 'skeleton_warrior'] },
      { enemies: ['tomb_wraith', 'skeleton_warrior', 'skeleton_warrior'] },
      { enemies: ['tomb_guardian', 'skeleton_warrior'] },
      { enemies: ['skeleton_warrior', 'skeleton_warrior', 'mummy', 'tomb_wraith'] }
    ],
    connections: ['cata_02'],
    rewards: { gems: 100, gold: 1200, exp: 1200 },
    firstClearBonus: { gems: 215 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  cata_02: {
    id: 'cata_02',
    name: 'Hall of Bones',
    region: 'Ancient Catacombs',
    x: 180,
    y: 180,
    battles: [
      { enemies: ['skeleton_warrior', 'skeleton_warrior', 'tomb_guardian'] },
      { enemies: ['mummy', 'mummy', 'skeleton_warrior'] },
      { enemies: ['tomb_wraith', 'tomb_wraith'] },
      { enemies: ['dark_cultist', 'skeleton_warrior', 'skeleton_warrior', 'skeleton_warrior'] },
      { enemies: ['tomb_guardian', 'mummy', 'tomb_wraith'] }
    ],
    connections: ['cata_03'],
    rewards: { gems: 100, gold: 1230, exp: 1230 },
    firstClearBonus: { gems: 220 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  cata_03: {
    id: 'cata_03',
    name: 'Cursed Gallery',
    region: 'Ancient Catacombs',
    x: 300,
    y: 250,
    battles: [
      { enemies: ['mummy', 'mummy', 'mummy'] },
      { enemies: ['tomb_guardian', 'tomb_guardian'] },
      { enemies: ['necromancer', 'skeleton_warrior', 'skeleton_warrior'] },
      { enemies: ['tomb_wraith', 'tomb_wraith', 'mummy'] },
      { enemies: ['dark_cultist', 'dark_cultist', 'tomb_guardian'] }
    ],
    connections: ['cata_04', 'cata_05'],
    rewards: { gems: 100, gold: 1260, exp: 1260 },
    firstClearBonus: { gems: 225 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  cata_04: {
    id: 'cata_04',
    name: 'Sarcophagus Chamber',
    region: 'Ancient Catacombs',
    x: 450,
    y: 120,
    battles: [
      { enemies: ['mummy', 'mummy', 'tomb_guardian'] },
      { enemies: ['tomb_guardian', 'tomb_guardian', 'skeleton_warrior'] },
      { enemies: ['mummy', 'mummy', 'mummy', 'mummy'] },
      { enemies: ['necromancer', 'mummy', 'tomb_guardian'] },
      { enemies: ['tomb_guardian', 'tomb_guardian', 'mummy', 'mummy'] },
      { enemies: ['necromancer', 'tomb_guardian', 'tomb_guardian'] }
    ],
    connections: ['cata_06'],
    rewards: { gems: 100, gold: 1290, exp: 1290 },
    firstClearBonus: { gems: 230 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  cata_05: {
    id: 'cata_05',
    name: 'Wraith Sanctum',
    region: 'Ancient Catacombs',
    x: 450,
    y: 380,
    battles: [
      { enemies: ['tomb_wraith', 'tomb_wraith', 'tomb_wraith'] },
      { enemies: ['necromancer', 'tomb_wraith', 'skeleton_warrior', 'skeleton_warrior'] },
      { enemies: ['dark_cultist', 'dark_cultist', 'tomb_wraith', 'tomb_wraith'] },
      { enemies: ['tomb_wraith', 'tomb_wraith', 'mummy', 'mummy'] },
      { enemies: ['necromancer', 'necromancer', 'tomb_wraith'] },
      { enemies: ['tomb_wraith', 'tomb_wraith', 'tomb_wraith', 'dark_cultist'] }
    ],
    connections: ['cata_06'],
    rewards: { gems: 100, gold: 1290, exp: 1290 },
    firstClearBonus: { gems: 230 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  cata_06: {
    id: 'cata_06',
    name: 'Ritual Chamber',
    region: 'Ancient Catacombs',
    x: 580,
    y: 250,
    battles: [
      { enemies: ['necromancer', 'necromancer', 'tomb_guardian'] },
      { enemies: ['tomb_wraith', 'tomb_wraith', 'mummy', 'tomb_guardian'] },
      { enemies: ['dark_cultist', 'dark_cultist', 'necromancer', 'skeleton_warrior'] },
      { enemies: ['tomb_guardian', 'tomb_guardian', 'necromancer'] },
      { enemies: ['mummy', 'mummy', 'tomb_wraith', 'tomb_wraith'] },
      { enemies: ['necromancer', 'necromancer', 'mummy', 'mummy'] }
    ],
    connections: ['cata_07'],
    rewards: { gems: 100, gold: 1320, exp: 1320 },
    firstClearBonus: { gems: 235 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  cata_07: {
    id: 'cata_07',
    name: 'Lich King\'s Throne',
    region: 'Ancient Catacombs',
    x: 720,
    y: 250,
    battles: [
      { enemies: ['tomb_guardian', 'tomb_guardian', 'tomb_guardian'] },
      { enemies: ['necromancer', 'necromancer', 'tomb_wraith', 'tomb_wraith'] },
      { enemies: ['mummy', 'mummy', 'tomb_guardian', 'tomb_guardian'] },
      { enemies: ['tomb_wraith', 'tomb_wraith', 'necromancer', 'dark_cultist', 'dark_cultist'] },
      { enemies: ['necromancer', 'tomb_guardian', 'tomb_guardian', 'mummy'] },
      { enemies: ['lich_king'] }
    ],
    connections: ['morass_01'],
    rewards: { gems: 100, gold: 1400, exp: 1400 },
    firstClearBonus: { gems: 250 },
    itemDrops: [
      { itemId: 'tome_large', min: 2, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 1.0 }
    ]
  },

  // Underground Morass (Underground Swamp) - No boss
  // Layout: morass_01 -> morass_02 -> (morass_03 OR morass_04) -> morass_05 -> morass_06
  morass_01: {
    id: 'morass_01',
    name: 'Damp Tunnels',
    region: 'Underground Morass',
    x: 100,
    y: 250,
    battles: [
      { enemies: ['cave_leech', 'cave_leech', 'cave_leech'] },
      { enemies: ['cave_bat', 'cave_bat', 'cave_leech', 'cave_leech'] },
      { enemies: ['fungal_zombie', 'cave_leech'] },
      { enemies: ['gloom_stalker', 'cave_bat', 'cave_bat'] },
      { enemies: ['cave_leech', 'cave_leech', 'fungal_zombie'] }
    ],
    connections: ['morass_02'],
    rewards: { gems: 100, gold: 1420, exp: 1420 },
    firstClearBonus: { gems: 240 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 }
    ]
  },
  morass_02: {
    id: 'morass_02',
    name: 'Fungal Grotto',
    region: 'Underground Morass',
    x: 230,
    y: 180,
    battles: [
      { enemies: ['fungal_zombie', 'fungal_zombie'] },
      { enemies: ['gloom_stalker', 'gloom_stalker'] },
      { enemies: ['fungal_zombie', 'cave_leech', 'cave_leech', 'cave_leech'] },
      { enemies: ['swamp_hag', 'fungal_zombie'] },
      { enemies: ['blind_horror', 'cave_leech', 'cave_leech'] }
    ],
    connections: ['morass_03', 'morass_04'],
    rewards: { gems: 100, gold: 1450, exp: 1450 },
    firstClearBonus: { gems: 245 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  morass_03: {
    id: 'morass_03',
    name: 'Stalker\'s Den',
    region: 'Underground Morass',
    x: 400,
    y: 100,
    battles: [
      { enemies: ['gloom_stalker', 'gloom_stalker', 'gloom_stalker'] },
      { enemies: ['gloom_stalker', 'gloom_stalker', 'cave_leech', 'cave_leech'] },
      { enemies: ['blind_horror', 'gloom_stalker'] },
      { enemies: ['swamp_hag', 'gloom_stalker', 'gloom_stalker'] },
      { enemies: ['gloom_stalker', 'gloom_stalker', 'fungal_zombie'] },
      { enemies: ['blind_horror', 'gloom_stalker', 'gloom_stalker'] }
    ],
    connections: ['morass_05'],
    rewards: { gems: 100, gold: 1480, exp: 1480 },
    firstClearBonus: { gems: 250 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  morass_04: {
    id: 'morass_04',
    name: 'Spore Cavern',
    region: 'Underground Morass',
    x: 400,
    y: 400,
    battles: [
      { enemies: ['fungal_zombie', 'fungal_zombie', 'fungal_zombie'] },
      { enemies: ['swamp_hag', 'fungal_zombie', 'cave_leech'] },
      { enemies: ['fungal_zombie', 'fungal_zombie', 'cave_leech', 'cave_leech', 'cave_leech'] },
      { enemies: ['blind_horror', 'fungal_zombie'] },
      { enemies: ['swamp_hag', 'swamp_hag'] },
      { enemies: ['fungal_zombie', 'fungal_zombie', 'swamp_hag'] }
    ],
    connections: ['morass_05'],
    rewards: { gems: 100, gold: 1480, exp: 1480 },
    firstClearBonus: { gems: 250 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  morass_05: {
    id: 'morass_05',
    name: 'Horror\'s Domain',
    region: 'Underground Morass',
    x: 570,
    y: 250,
    battles: [
      { enemies: ['blind_horror', 'blind_horror'] },
      { enemies: ['swamp_hag', 'swamp_hag', 'fungal_zombie'] },
      { enemies: ['gloom_stalker', 'gloom_stalker', 'blind_horror'] },
      { enemies: ['fungal_zombie', 'fungal_zombie', 'swamp_hag', 'cave_leech'] },
      { enemies: ['blind_horror', 'swamp_hag', 'gloom_stalker'] },
      { enemies: ['blind_horror', 'blind_horror', 'fungal_zombie'] }
    ],
    connections: ['morass_06'],
    rewards: { gems: 100, gold: 1510, exp: 1510 },
    firstClearBonus: { gems: 255 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 }
    ]
  },
  morass_06: {
    id: 'morass_06',
    name: 'Abyssal Exit',
    region: 'Underground Morass',
    x: 700,
    y: 250,
    battles: [
      { enemies: ['blind_horror', 'swamp_hag', 'swamp_hag'] },
      { enemies: ['gloom_stalker', 'gloom_stalker', 'gloom_stalker', 'gloom_stalker'] },
      { enemies: ['fungal_zombie', 'fungal_zombie', 'blind_horror'] },
      { enemies: ['swamp_hag', 'swamp_hag', 'gloom_stalker', 'gloom_stalker'] },
      { enemies: ['blind_horror', 'blind_horror', 'swamp_hag'] },
      { enemies: ['blind_horror', 'blind_horror', 'gloom_stalker', 'gloom_stalker'] }
    ],
    connections: ['aqua_01'],
    rewards: { gems: 100, gold: 1550, exp: 1550 },
    firstClearBonus: { gems: 260 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 1.0 }
    ]
  },

  // Gate to Aquaria (Underwater Realm) - BOSS: Kraken
  // Layout: aqua_01 -> aqua_02 -> aqua_03 -> (aqua_04 OR aqua_05) -> aqua_06 -> aqua_07 -> aqua_08
  aqua_01: {
    id: 'aqua_01',
    name: 'Tidal Cave',
    region: 'Gate to Aquaria',
    x: 60,
    y: 250,
    battles: [
      { enemies: ['merfolk_warrior', 'merfolk_warrior'] },
      { enemies: ['lake_serpent', 'lake_serpent', 'lake_serpent'] },
      { enemies: ['merfolk_mage', 'merfolk_warrior'] },
      { enemies: ['coral_golem', 'lake_serpent'] },
      { enemies: ['merfolk_warrior', 'merfolk_warrior', 'merfolk_mage'] }
    ],
    connections: ['aqua_02'],
    rewards: { gems: 100, gold: 1580, exp: 1580 },
    firstClearBonus: { gems: 265 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  aqua_02: {
    id: 'aqua_02',
    name: 'Coral Gardens',
    region: 'Gate to Aquaria',
    x: 160,
    y: 180,
    battles: [
      { enemies: ['coral_golem', 'coral_golem'] },
      { enemies: ['merfolk_mage', 'merfolk_mage', 'merfolk_warrior'] },
      { enemies: ['tide_priest', 'coral_golem'] },
      { enemies: ['sea_serpent', 'merfolk_warrior', 'merfolk_warrior'] },
      { enemies: ['coral_golem', 'merfolk_mage', 'lake_serpent', 'lake_serpent'] }
    ],
    connections: ['aqua_03'],
    rewards: { gems: 100, gold: 1610, exp: 1610 },
    firstClearBonus: { gems: 270 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 }
    ]
  },
  aqua_03: {
    id: 'aqua_03',
    name: 'Merfolk Outpost',
    region: 'Gate to Aquaria',
    x: 270,
    y: 250,
    battles: [
      { enemies: ['merfolk_warrior', 'merfolk_warrior', 'merfolk_warrior'] },
      { enemies: ['merfolk_mage', 'merfolk_mage', 'tide_priest'] },
      { enemies: ['sea_serpent', 'merfolk_mage'] },
      { enemies: ['merfolk_warrior', 'merfolk_warrior', 'merfolk_mage', 'merfolk_mage'] },
      { enemies: ['tide_priest', 'merfolk_warrior', 'merfolk_warrior'] }
    ],
    connections: ['aqua_04', 'aqua_05'],
    rewards: { gems: 100, gold: 1640, exp: 1640 },
    firstClearBonus: { gems: 275 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 }
    ]
  },
  aqua_04: {
    id: 'aqua_04',
    name: 'Serpent Shoals',
    region: 'Gate to Aquaria',
    x: 390,
    y: 120,
    battles: [
      { enemies: ['sea_serpent', 'sea_serpent'] },
      { enemies: ['lake_serpent', 'lake_serpent', 'sea_serpent'] },
      { enemies: ['sea_serpent', 'merfolk_mage', 'merfolk_warrior'] },
      { enemies: ['abyssal_lurker', 'sea_serpent'] },
      { enemies: ['sea_serpent', 'sea_serpent', 'lake_serpent', 'lake_serpent'] },
      { enemies: ['abyssal_lurker', 'sea_serpent', 'merfolk_mage'] }
    ],
    connections: ['aqua_06'],
    rewards: { gems: 100, gold: 1670, exp: 1670 },
    firstClearBonus: { gems: 280 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 }
    ]
  },
  aqua_05: {
    id: 'aqua_05',
    name: 'Sunken Temple',
    region: 'Gate to Aquaria',
    x: 390,
    y: 380,
    battles: [
      { enemies: ['tide_priest', 'tide_priest'] },
      { enemies: ['coral_golem', 'coral_golem', 'tide_priest'] },
      { enemies: ['merfolk_mage', 'merfolk_mage', 'merfolk_mage'] },
      { enemies: ['tide_priest', 'coral_golem', 'merfolk_warrior', 'merfolk_warrior'] },
      { enemies: ['abyssal_lurker', 'tide_priest'] },
      { enemies: ['coral_golem', 'coral_golem', 'merfolk_mage', 'merfolk_mage'] }
    ],
    connections: ['aqua_06'],
    rewards: { gems: 100, gold: 1670, exp: 1670 },
    firstClearBonus: { gems: 280 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 }
    ]
  },
  aqua_06: {
    id: 'aqua_06',
    name: 'Abyssal Trench',
    region: 'Gate to Aquaria',
    x: 520,
    y: 250,
    battles: [
      { enemies: ['abyssal_lurker', 'abyssal_lurker'] },
      { enemies: ['sea_serpent', 'sea_serpent', 'abyssal_lurker'] },
      { enemies: ['abyssal_lurker', 'merfolk_mage', 'merfolk_mage'] },
      { enemies: ['coral_golem', 'coral_golem', 'abyssal_lurker'] },
      { enemies: ['abyssal_lurker', 'abyssal_lurker', 'sea_serpent'] },
      { enemies: ['tide_priest', 'abyssal_lurker', 'abyssal_lurker'] }
    ],
    connections: ['aqua_07'],
    rewards: { gems: 100, gold: 1700, exp: 1700 },
    firstClearBonus: { gems: 285 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 0.95 }
    ]
  },
  aqua_07: {
    id: 'aqua_07',
    name: 'Leviathan\'s Wake',
    region: 'Gate to Aquaria',
    x: 630,
    y: 180,
    battles: [
      { enemies: ['sea_serpent', 'sea_serpent', 'sea_serpent'] },
      { enemies: ['abyssal_lurker', 'abyssal_lurker', 'tide_priest'] },
      { enemies: ['coral_golem', 'coral_golem', 'sea_serpent', 'sea_serpent'] },
      { enemies: ['merfolk_mage', 'merfolk_mage', 'abyssal_lurker', 'abyssal_lurker'] },
      { enemies: ['tide_priest', 'tide_priest', 'coral_golem'] },
      { enemies: ['abyssal_lurker', 'sea_serpent', 'sea_serpent', 'merfolk_mage'] }
    ],
    connections: ['aqua_08'],
    rewards: { gems: 100, gold: 1730, exp: 1730 },
    firstClearBonus: { gems: 290 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 1.0 }
    ]
  },
  aqua_08: {
    id: 'aqua_08',
    name: 'Kraken\'s Domain',
    region: 'Gate to Aquaria',
    x: 740,
    y: 250,
    battles: [
      { enemies: ['abyssal_lurker', 'abyssal_lurker', 'abyssal_lurker'] },
      { enemies: ['sea_serpent', 'sea_serpent', 'coral_golem', 'coral_golem'] },
      { enemies: ['tide_priest', 'tide_priest', 'abyssal_lurker', 'abyssal_lurker'] },
      { enemies: ['merfolk_mage', 'merfolk_mage', 'sea_serpent', 'sea_serpent'] },
      { enemies: ['coral_golem', 'abyssal_lurker', 'abyssal_lurker', 'tide_priest'] },
      { enemies: ['kraken'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 1800, exp: 1800 },
    firstClearBonus: { gems: 300 },
    itemDrops: [
      { itemId: 'tome_large', min: 2, max: 4, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 1.0 }
    ]
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
  },
  {
    id: 'the_summit',
    name: 'The Summit',
    startNode: 'summit_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a1a2a' // Dark wind/ice blue
  },
  {
    id: 'blistering_cliffsides',
    name: 'Blistering Cliffsides',
    startNode: 'cliffs_01',
    width: 800,
    height: 500,
    backgroundColor: '#2f1a1a' // Dark volcanic red
  },
  {
    id: 'janxier_floodplain',
    name: 'Janxier Floodplain',
    startNode: 'flood_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2a1f' // Dark swampy green
  },
  {
    id: 'old_fort_calindash',
    name: 'Old Fort Calindash',
    startNode: 'fort_01',
    width: 800,
    height: 500,
    backgroundColor: '#2a2a2a' // Dark stone gray
  },
  {
    id: 'ancient_catacombs',
    name: 'Ancient Catacombs',
    startNode: 'cata_01',
    width: 800,
    height: 500,
    backgroundColor: '#1f1a2a' // Dark tomb purple
  },
  {
    id: 'underground_morass',
    name: 'Underground Morass',
    startNode: 'morass_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2a1a' // Dark underground green
  },
  {
    id: 'gate_to_aquaria',
    name: 'Gate to Aquaria',
    startNode: 'aqua_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2a3f' // Deep ocean blue
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

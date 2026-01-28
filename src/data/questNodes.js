import whisperingWoodsMap from '../assets/maps/whispering_woods.png'
import echoingCavernsMap from '../assets/maps/echoing_caverns.png'
import whisperLakeMap from '../assets/maps/whisper_lake.png'
import stormwindPeaksMap from '../assets/maps/stormwind_peaks.png'
import hibernationDenMap from '../assets/maps/hibernation_den.png'
import summitMap from '../assets/maps/the_summit.png'
import blisteringCliffsMap from '../assets/maps/blistering_cliffsides.png'
import eruptionVentMap from '../assets/maps/eruption_vent.png'
import janxierFloodplainMap from '../assets/maps/janxier_floodplain.png'
import oldFortCalindashMap from '../assets/maps/old_fort_calindash.png'
import ancientCatacombsMap from '../assets/maps/ancient_catacombs.png'

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
    x: 433,
    y: 355,
    regionLinkPosition: { x: 456, y: 394 },
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
    x: 586,
    y: 164,
    regionLinkPosition: { x: 600, y: 115 },
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
  },

  // Echoing Caverns (Mid Game)
  // Layout: cave_01 -> (cave_02 OR cave_03) -> cave_05 -> (cave_06 OR cave_07) -> cave_04
  cave_01: {
    id: 'cave_01',
    name: 'Cavern Entrance',
    region: 'Echoing Caverns',
    x: 135,
    y: 450,
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
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.2 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_02: {
    id: 'cave_02',
    name: 'Cultist Shrine',
    region: 'Echoing Caverns',
    x: 320,
    y: 350,
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
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_03: {
    id: 'cave_03',
    name: 'Troll Bridge',
    region: 'Echoing Caverns',
    x: 200,
    y: 220,
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
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_04: {
    id: 'cave_04',
    name: 'Deep Chasm',
    region: 'Echoing Caverns',
    x: 600,
    y: 250,
    regionLinkPosition: { x: 574, y: 359 },
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
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_05: {
    id: 'cave_05',
    name: 'Ritual Chamber',
    region: 'Echoing Caverns',
    x: 300,
    y: 80,
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
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_06: {
    id: 'cave_06',
    name: 'Blood Altar',
    region: 'Echoing Caverns',
    x: 600,
    y: 80,
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
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_07: {
    id: 'cave_07',
    name: 'Summoning Circle',
    region: 'Echoing Caverns',
    x: 500,
    y: 180,
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
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },

  // Echoing Caverns Exploration
  cave_exploration: {
    id: 'cave_exploration',
    name: 'Echoing Caverns Exploration',
    region: 'Echoing Caverns',
    x: 80,
    y: 310,
    type: 'exploration',
    unlockedBy: 'cave_01',
    backgroundId: 'cave_01',
    connections: [],
    explorationConfig: {
      requiredFights: 50,
      timeLimit: 240,
      rewards: { gold: 500, gems: 20, xp: 300 },
      requiredCrestId: 'valinar_crest',
      itemDrops: [
        { itemId: 'tome_medium', chance: 0.4 },
        { itemId: 'goblin_trinket', chance: 0.6 },
        { itemId: 'token_whispering_woods', chance: 0.15 },
        { itemId: 'token_echoing_caverns', chance: 0.15 }
      ],
      partyRequest: {
        description: 'A tank, a DPS, and a support',
        conditions: [
          { role: 'tank', count: 1 },
          { role: 'dps', count: 1 },
          { role: 'support', count: 1 }
        ]
      }
    }
  },

  // Stormwind Peaks (Late Game)
  // Layout: mountain_01 -> (mountain_02 OR mountain_03) -> mountain_05 -> (mountain_06 OR mountain_07) -> mountain_04
  mountain_01: {
    id: 'mountain_01',
    name: 'Mountain Pass',
    region: 'Stormwind Peaks',
    x: 80,
    y: 380,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.5 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
    ]
  },
  mountain_02: {
    id: 'mountain_02',
    name: 'Frozen Lake',
    region: 'Stormwind Peaks',
    x: 380,
    y: 550,
    regionLinkPosition: { x: 562, y: 559 },
    battles: [
      { enemies: ['frost_elemental', 'harpy'] },
      { enemies: ['frost_elemental', 'frost_elemental'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'harpy'] }
    ],
    connections: ['mountain_05', 'hibernation_01'],
    rewards: { gems: 100, gold: 400, exp: 320 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.4 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
    ]
  },
  mountain_03: {
    id: 'mountain_03',
    name: 'Giant\'s Path',
    region: 'Stormwind Peaks',
    x: 180,
    y: 310,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
    ]
  },
  mountain_04: {
    id: 'mountain_04',
    name: 'Dragon\'s Lair',
    region: 'Stormwind Peaks',
    x: 378,
    y: 119,
    regionLinkPosition: { x: 432, y: 227 },
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.7 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.25 },
      { itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
    ]
  },
  mountain_05: {
    id: 'mountain_05',
    name: 'Storm Plateau',
    region: 'Stormwind Peaks',
    x: 280,
    y: 350,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.55 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
    ]
  },
  mountain_06: {
    id: 'mountain_06',
    name: 'Lightning Spire',
    region: 'Stormwind Peaks',
    x: 290,
    y: 180,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
    ]
  },
  mountain_07: {
    id: 'mountain_07',
    name: 'Howling Cliffs',
    region: 'Stormwind Peaks',
    x: 370,
    y: 320,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_echoing_caverns', min: 1, max: 1, chance: 0.1 }
    ]
  },

  // Hibernation Den (Great Troll Genus Loci)
  // Layout: hibernation_01 -> hibernation_02 -> hibernation_den
  hibernation_01: {
    id: 'hibernation_01',
    name: 'Troll Warren',
    region: 'Hibernation Den',
    x: 550,
    y: 480,
    battles: [
      { enemies: ['mountain_giant', 'harpy'] },
      { enemies: ['frost_elemental', 'frost_elemental', 'harpy'] },
      { enemies: ['mountain_giant', 'mountain_giant'] }
    ],
    connections: ['hibernation_02'],
    rewards: { gems: 95, gold: 420, exp: 360 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.35 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.5 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  hibernation_02: {
    id: 'hibernation_02',
    name: "Troll Chieftain's Cave",
    region: 'Hibernation Den',
    x: 430,
    y: 300,
    battles: [
      { enemies: ['mountain_giant', 'frost_elemental', 'harpy'] },
      { enemies: ['storm_elemental', 'storm_elemental', 'mountain_giant'] },
      { enemies: ['mountain_giant', 'mountain_giant', 'frost_elemental'] }
    ],
    connections: ['hibernation_den'],
    rewards: { gems: 100, gold: 450, exp: 400 },
    firstClearBonus: { gems: 110 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.45 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.25 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  hibernation_den: {
    id: 'hibernation_den',
    name: 'Hibernation Den',
    region: 'Hibernation Den',
    x: 220,
    y: 120,
    type: 'genusLoci',
    genusLociId: 'great_troll',
    connections: []
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
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.2 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whispering_woods', min: 1, max: 1, chance: 0.1 }
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
      { enemies: ['lake_serpent', 'marsh_hag', 'lake_serpent', 'giant_frog'] }
    ],
    connections: ['lake_genus_loci'],
    rewards: { gems: 110, gold: 280, exp: 220 },
    firstClearBonus: { gems: 70 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.45 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.35 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.2 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.25 },
      { itemId: 'token_whispering_woods', min: 1, max: 1, chance: 0.1 }
    ]
  },
  lake_genus_loci: {
    id: 'lake_genus_loci',
    name: 'Lake Tower',
    region: 'Whisper Lake',
    x: 250,
    y: 400,
    type: 'genusLoci',
    genusLociId: 'valinar',
    connections: ['lake_02']
  },

  // The Summit (Ancient Wind Temple) - BOSS: Ancient Titan
  // Layout: summit_01 -> summit_02 -> summit_03 -> (summit_04 OR summit_05) -> summit_06
  summit_01: {
    id: 'summit_01',
    name: 'Windswept Ascent',
    region: 'The Summit',
    x: 78,
    y: 322,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.6 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.1 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  summit_02: {
    id: 'summit_02',
    name: 'Frozen Shrine',
    region: 'The Summit',
    x: 183,
    y: 262,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.65 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.1 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  summit_03: {
    id: 'summit_03',
    name: 'Guardian\'s Gate',
    region: 'The Summit',
    x: 299,
    y: 188,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.7 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.1 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  summit_04: {
    id: 'summit_04',
    name: 'Hall of Winds',
    region: 'The Summit',
    x: 386,
    y: 70,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.7 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.1 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  summit_05: {
    id: 'summit_05',
    name: 'Frost Sanctum',
    region: 'The Summit',
    x: 416,
    y: 224,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.7 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.1 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  summit_06: {
    id: 'summit_06',
    name: 'Titan\'s Throne',
    region: 'The Summit',
    x: 497,
    y: 152,
    regionLinkPosition: { x: 595, y: 285 },
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'den_key', min: 1, max: 1, chance: 0.1 }
    ]
  },
  summit_exploration: {
    id: 'summit_exploration',
    name: 'Summit Exploration',
    region: 'The Summit',
    x: 275,
    y: 433,
    type: 'exploration',
    unlockedBy: 'summit_03',
    backgroundId: 'summit_01',
    connections: [],
    explorationConfig: {
      requiredFights: 70,
      timeLimit: 300,
      rewards: { gold: 800, gems: 35, xp: 500 },
      requiredCrestId: 'great_troll_crest',
      itemDrops: [
        { itemId: 'tome_large', chance: 0.4 },
        { itemId: 'magical_rocks', chance: 0.5 },
        { itemId: 'token_summit', chance: 0.15 },
        { itemId: 'token_stormwind_peaks', chance: 0.15 }
      ],
      partyRequest: {
        description: 'Swift climbers (2+ DPS)',
        conditions: [
          { role: 'dps', count: 2 }
        ]
      }
    }
  },

  // Blistering Cliffsides (Volcanic) - No boss
  // Layout: cliffs_01 -> cliffs_02 -> (cliffs_03 OR cliffs_04) -> cliffs_05 -> cliffs_06
  cliffs_01: {
    id: 'cliffs_01',
    name: 'Scorched Trail',
    region: 'Blistering Cliffsides',
    x: 170,
    y: 278,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.7 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_02: {
    id: 'cliffs_02',
    name: 'Ember Fields',
    region: 'Blistering Cliffsides',
    x: 54,
    y: 434,
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
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.75 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_03: {
    id: 'cliffs_03',
    name: 'Magma Pools',
    region: 'Blistering Cliffsides',
    x: 225,
    y: 631,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_04: {
    id: 'cliffs_04',
    name: 'Sulfur Vents',
    region: 'Blistering Cliffsides',
    x: 259,
    y: 420,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_05: {
    id: 'cliffs_05',
    name: 'Caldera Ridge',
    region: 'Blistering Cliffsides',
    x: 481,
    y: 323,
    regionLinkPosition: { x: 626, y: 401 },
    battles: [
      { enemies: ['volcanic_drake', 'fire_elemental'] },
      { enemies: ['magma_golem', 'magma_golem', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['volcanic_drake', 'flame_salamander'] },
      { enemies: ['magma_golem', 'volcanic_drake'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'magma_golem', 'flame_salamander'] }
    ],
    connections: ['cliffs_06', 'eruption_vent_01'],
    rewards: { gems: 100, gold: 800, exp: 800 },
    firstClearBonus: { gems: 155 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_06: {
    id: 'cliffs_06',
    name: 'Inferno Peak',
    region: 'Blistering Cliffsides',
    x: 616,
    y: 270,
    regionLinkPosition: { x: 742, y: 202 },
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },

  // Eruption Vent (Pyroclast Genus Loci)
  // Layout: eruption_vent_01 -> eruption_vent_02 -> eruption_vent_gl
  eruption_vent_01: {
    id: 'eruption_vent_01',
    name: 'Basalt Corridor',
    region: 'Eruption Vent',
    x: 694,
    y: 448,
    battles: [
      { enemies: ['magma_golem', 'fire_elemental'] },
      { enemies: ['volcanic_drake', 'flame_salamander', 'ash_crawler'] },
      { enemies: ['magma_golem', 'magma_golem'] }
    ],
    connections: ['eruption_vent_02'],
    rewards: { gems: 95, gold: 780, exp: 780 },
    firstClearBonus: { gems: 145 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.7 },
      { itemId: 'eruption_vent_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  eruption_vent_02: {
    id: 'eruption_vent_02',
    name: 'Molten Chamber',
    region: 'Eruption Vent',
    x: 505,
    y: 373,
    battles: [
      { enemies: ['volcanic_drake', 'volcanic_drake'] },
      { enemies: ['magma_golem', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'magma_golem'] }
    ],
    connections: ['eruption_vent_gl'],
    rewards: { gems: 100, gold: 800, exp: 800 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 },
      { itemId: 'eruption_vent_key', min: 1, max: 1, chance: 0.25 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  eruption_vent_gl: {
    id: 'eruption_vent_gl',
    name: 'Eruption Vent',
    region: 'Eruption Vent',
    x: 429,
    y: 203,
    type: 'genusLoci',
    genusLociId: 'pyroclast',
    connections: []
  },

  // Janxier Floodplain (Flooded Plains) - BOSS: Hydra
  // Layout: flood_01 -> flood_02 -> flood_03 -> (flood_04 OR flood_05) -> flood_06 -> flood_07
  flood_01: {
    id: 'flood_01',
    name: 'Muddy Banks',
    region: 'Janxier Floodplain',
    x: 392,
    y: 482,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  flood_02: {
    id: 'flood_02',
    name: 'Submerged Path',
    region: 'Janxier Floodplain',
    x: 549,
    y: 382,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  flood_03: {
    id: 'flood_03',
    name: 'Naga Territory',
    region: 'Janxier Floodplain',
    x: 572,
    y: 310,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  flood_04: {
    id: 'flood_04',
    name: 'Crocodile Den',
    region: 'Janxier Floodplain',
    x: 491,
    y: 272,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  flood_05: {
    id: 'flood_05',
    name: 'Murky Depths',
    region: 'Janxier Floodplain',
    x: 399,
    y: 307,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  flood_06: {
    id: 'flood_06',
    name: 'Serpent\'s Crossing',
    region: 'Janxier Floodplain',
    x: 322,
    y: 259,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  flood_07: {
    id: 'flood_07',
    name: 'Hydra\'s Lair',
    region: 'Janxier Floodplain',
    x: 419,
    y: 212,
    regionLinkPosition: { x: 614, y: 216 },
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },

  flood_exploration: {
    id: 'flood_exploration',
    name: 'Janxier Floodplain Exploration',
    region: 'Janxier Floodplain',
    x: 620,
    y: 450,
    type: 'exploration',
    unlockedBy: 'flood_03',
    backgroundId: 'flood_01',
    connections: [],
    explorationConfig: {
      requiredFights: 65,
      timeLimit: 300,
      rewards: { gold: 600, gems: 25, xp: 350 },
      requiredCrestId: 'pyroclast_crest',
      itemDrops: [
        { itemId: 'tome_large', chance: 0.4 },
        { itemId: 'token_blistering_cliffs', chance: 0.15 },
        { itemId: 'token_janxier_floodplain', chance: 0.15 }
      ],
      partyRequest: {
        description: 'Diverse scouts (3+ different classes)',
        conditions: [
          { uniqueClasses: 3 }
        ]
      }
    }
  },

  // Old Fort Calindash (Ruined Fort) - No boss
  // Layout: fort_01 -> fort_02 -> (fort_03 OR fort_04) -> fort_05 -> fort_06
  fort_01: {
    id: 'fort_01',
    name: 'Outer Walls',
    region: 'Old Fort Calindash',
    x: 402,
    y: 692,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  fort_02: {
    id: 'fort_02',
    name: 'Courtyard',
    region: 'Old Fort Calindash',
    x: 292,
    y: 564,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  fort_03: {
    id: 'fort_03',
    name: 'Barracks',
    region: 'Old Fort Calindash',
    x: 230,
    y: 325,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  fort_04: {
    id: 'fort_04',
    name: 'Haunted Chapel',
    region: 'Old Fort Calindash',
    x: 428,
    y: 470,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  fort_05: {
    id: 'fort_05',
    name: 'Commander\'s Hall',
    region: 'Old Fort Calindash',
    x: 477,
    y: 233,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  fort_06: {
    id: 'fort_06',
    name: 'Dungeon Entrance',
    region: 'Old Fort Calindash',
    x: 598,
    y: 324,
    regionLinkPosition: { x: 741, y: 331 },
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },

  // Ancient Catacombs (Undead Tombs) - BOSS: Lich King
  // Layout: cata_01 -> cata_02 -> cata_03 -> (cata_04 OR cata_05) -> cata_06 -> cata_07
  cata_01: {
    id: 'cata_01',
    name: 'Tomb Entrance',
    region: 'Ancient Catacombs',
    x: 74,
    y: 177,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  cata_02: {
    id: 'cata_02',
    name: 'Hall of Bones',
    region: 'Ancient Catacombs',
    x: 240,
    y: 105,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  cata_03: {
    id: 'cata_03',
    name: 'Cursed Gallery',
    region: 'Ancient Catacombs',
    x: 219,
    y: 392,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  cata_04: {
    id: 'cata_04',
    name: 'Sarcophagus Chamber',
    region: 'Ancient Catacombs',
    x: 436,
    y: 287,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  cata_05: {
    id: 'cata_05',
    name: 'Wraith Sanctum',
    region: 'Ancient Catacombs',
    x: 499,
    y: 96,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  cata_06: {
    id: 'cata_06',
    name: 'Ritual Chamber',
    region: 'Ancient Catacombs',
    x: 664,
    y: 377,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  cata_07: {
    id: 'cata_07',
    name: 'Lich King\'s Throne',
    region: 'Ancient Catacombs',
    x: 660,
    y: 242,
    regionLinkPosition: { x: 753, y: 199 },
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
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 1.0 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },

  // Underground Morass (Underground Swamp) - No boss
  // Layout: morass_01 -> morass_02 -> (morass_03 OR morass_04) -> morass_05 -> morass_06
  morass_01: {
    id: 'morass_01',
    name: 'Damp Tunnels',
    region: 'Underground Morass',
    x: 672,
    y: 233,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.9 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ]
  },
  morass_02: {
    id: 'morass_02',
    name: 'Fungal Grotto',
    region: 'Underground Morass',
    x: 538,
    y: 163,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ]
  },
  morass_03: {
    id: 'morass_03',
    name: 'Stalker\'s Den',
    region: 'Underground Morass',
    x: 248,
    y: 180,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ]
  },
  morass_04: {
    id: 'morass_04',
    name: 'Spore Cavern',
    region: 'Underground Morass',
    x: 668,
    y: 394,
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ]
  },
  morass_05: {
    id: 'morass_05',
    name: 'Horror\'s Domain',
    region: 'Underground Morass',
    x: 390,
    y: 357,
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
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ]
  },
  morass_06: {
    id: 'morass_06',
    name: 'Abyssal Exit',
    region: 'Underground Morass',
    x: 367,
    y: 456,
    regionLinkPosition: { x: 540, y: 471 },
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
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 1.0 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
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
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
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
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
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
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
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
      { itemId: 'goblin_trinket', min: 2, max: 3, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
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
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 0.95 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
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
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 1.0 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  aqua_08: {
    id: 'aqua_08',
    name: 'Kraken\'s Domain',
    region: 'Gate to Aquaria',
    x: 740,
    y: 250,
    regionLinkPosition: { x: 775, y: 180 },
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
      { itemId: 'goblin_trinket', min: 2, max: 4, chance: 1.0 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ],
    shardDropChance: 0.25
  },
  // Coral Depths (Aquarias) - First region of the underwater realm
  coral_01: {
    id: 'coral_01',
    name: 'Coral Tunnels',
    region: 'Coral Depths',
    x: 100, y: 250,
    battles: [
      { enemies: ['cave_crab', 'moray_eel', 'moray_eel'] },
      { enemies: ['barnacle_cluster', 'cave_crab', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'barnacle_cluster', 'cave_crab'] }
    ],
    connections: ['coral_02'],
    rewards: { gems: 100, gold: 1600, exp: 1600 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 }
    ],
    shardDropChance: 0.25
  },
  coral_02: {
    id: 'coral_02',
    name: 'Barnacle Narrows',
    region: 'Coral Depths',
    x: 250, y: 180,
    battles: [
      { enemies: ['barnacle_cluster', 'barnacle_cluster', 'cave_crab'] },
      { enemies: ['moray_eel', 'moray_eel', 'reef_warden'] },
      { enemies: ['cave_crab', 'cave_crab', 'barnacle_cluster'] },
      { enemies: ['reef_warden', 'moray_eel', 'barnacle_cluster', 'cave_crab'] }
    ],
    connections: ['coral_03'],
    rewards: { gems: 100, gold: 1650, exp: 1650 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 }
    ],
    shardDropChance: 0.25
  },
  coral_03: {
    id: 'coral_03',
    name: 'Eel Hollows',
    region: 'Coral Depths',
    x: 400, y: 300,
    battles: [
      { enemies: ['moray_eel', 'moray_eel', 'moray_eel'] },
      { enemies: ['cave_crab', 'moray_eel', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'barnacle_cluster', 'barnacle_cluster'] },
      { enemies: ['moray_eel', 'moray_eel', 'cave_crab', 'reef_warden'] }
    ],
    connections: ['coral_04'],
    rewards: { gems: 100, gold: 1700, exp: 1700 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 }
    ],
    shardDropChance: 0.25
  },
  coral_04: {
    id: 'coral_04',
    name: 'Collapsed Grotto',
    region: 'Coral Depths',
    x: 500, y: 170,
    battles: [
      { enemies: ['cave_crab', 'cave_crab', 'reef_warden'] },
      { enemies: ['barnacle_cluster', 'moray_eel', 'moray_eel', 'cave_crab'] },
      { enemies: ['reef_warden', 'reef_warden', 'cave_crab'] },
      { enemies: ['moray_eel', 'barnacle_cluster', 'cave_crab', 'cave_crab'] },
      { enemies: ['cave_crab', 'cave_crab', 'reef_warden', 'moray_eel', 'moray_eel'] }
    ],
    connections: ['coral_05'],
    rewards: { gems: 100, gold: 1750, exp: 1750 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 }
    ],
    shardDropChance: 0.25
  },
  coral_05: {
    id: 'coral_05',
    name: 'Reef Labyrinth',
    region: 'Coral Depths',
    x: 620, y: 310,
    battles: [
      { enemies: ['barnacle_cluster', 'barnacle_cluster', 'reef_warden', 'cave_crab'] },
      { enemies: ['moray_eel', 'moray_eel', 'moray_eel', 'barnacle_cluster'] },
      { enemies: ['reef_warden', 'cave_crab', 'cave_crab', 'moray_eel'] },
      { enemies: ['barnacle_cluster', 'reef_warden', 'moray_eel', 'moray_eel'] },
      { enemies: ['cave_crab', 'cave_crab', 'reef_warden', 'barnacle_cluster', 'moray_eel'] }
    ],
    connections: ['coral_06'],
    rewards: { gems: 100, gold: 1800, exp: 1800 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 }
    ],
    shardDropChance: 0.25
  },
  coral_06: {
    id: 'coral_06',
    name: 'The Back Gate',
    region: 'Coral Depths',
    x: 720, y: 200,
    battles: [
      { enemies: ['cave_crab', 'cave_crab', 'barnacle_cluster', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'moray_eel', 'moray_eel'] },
      { enemies: ['reef_warden', 'reef_warden', 'cave_crab', 'cave_crab'] },
      { enemies: ['barnacle_cluster', 'barnacle_cluster', 'moray_eel', 'cave_crab', 'reef_warden'] },
      { enemies: ['cave_crab', 'cave_crab', 'cave_crab', 'reef_warden', 'reef_warden'] },
      { enemies: ['moray_eel', 'moray_eel', 'cave_crab', 'cave_crab', 'reef_warden', 'barnacle_cluster'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 1900, exp: 1900 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      { itemId: 'token_gate_to_aquaria', min: 1, max: 1, chance: 0.1 }
    ],
    shardDropChance: 0.25
  }
}

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
  {
    id: 'whispering_woods',
    name: 'Whispering Woods',
    superRegion: 'western_veros',
    startNode: 'forest_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2f1a',
    backgroundImage: whisperingWoodsMap
  },
  {
    id: 'whisper_lake',
    name: 'Whisper Lake',
    superRegion: 'western_veros',
    startNode: 'lake_01',
    width: 500,
    height: 450,
    backgroundColor: '#1a2a2f',
    backgroundImage: whisperLakeMap
  },
  {
    id: 'echoing_caverns',
    name: 'Echoing Caverns',
    superRegion: 'western_veros',
    startNode: 'cave_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a1a2f',
    backgroundImage: echoingCavernsMap
  },
  {
    id: 'stormwind_peaks',
    name: 'Stormwind Peaks',
    superRegion: 'western_veros',
    startNode: 'mountain_01',
    width: 800,
    height: 800,
    backgroundColor: '#2a2a3a',
    backgroundImage: stormwindPeaksMap
  },
  {
    id: 'hibernation_den',
    name: 'Hibernation Den',
    superRegion: 'western_veros',
    startNode: 'hibernation_01',
    width: 800,
    height: 500,
    backgroundColor: '#2a3a2a',
    backgroundImage: hibernationDenMap
  },
  {
    id: 'the_summit',
    name: 'The Summit',
    superRegion: 'western_veros',
    startNode: 'summit_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a1a2a',
    backgroundImage: summitMap
  },
  {
    id: 'blistering_cliffsides',
    name: 'Blistering Cliffsides',
    superRegion: 'western_veros',
    startNode: 'cliffs_01',
    width: 800,
    height: 800,
    backgroundColor: '#2f1a1a',
    backgroundImage: blisteringCliffsMap
  },
  {
    id: 'eruption_vent',
    name: 'Eruption Vent',
    superRegion: 'western_veros',
    startNode: 'eruption_vent_01',
    width: 800,
    height: 500,
    backgroundColor: '#3f1a0a',
    backgroundImage: eruptionVentMap
  },
  {
    id: 'janxier_floodplain',
    name: 'Janxier Floodplain',
    superRegion: 'western_veros',
    startNode: 'flood_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2a1f', // Dark swampy green
    backgroundImage: janxierFloodplainMap
  },
  {
    id: 'old_fort_calindash',
    name: 'Old Fort Calindash',
    superRegion: 'western_veros',
    startNode: 'fort_01',
    width: 800,
    height: 800,
    backgroundColor: '#2a2a2a', // Dark stone gray
    backgroundImage: oldFortCalindashMap
  },
  {
    id: 'ancient_catacombs',
    name: 'Ancient Catacombs',
    superRegion: 'western_veros',
    startNode: 'cata_01',
    width: 800,
    height: 500,
    backgroundColor: '#1f1a2a', // Dark tomb purple
    backgroundImage: ancientCatacombsMap
  },
  {
    id: 'underground_morass',
    name: 'Underground Morass',
    superRegion: 'western_veros',
    startNode: 'morass_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2a1a' // Dark underground green
  },
  {
    id: 'gate_to_aquaria',
    name: 'Gate to Aquaria',
    superRegion: 'western_veros',
    startNode: 'aqua_01',
    width: 800,
    height: 500,
    backgroundColor: '#1a2a3f' // Deep ocean blue
  },
  {
    id: 'coral_depths',
    name: 'Coral Depths',
    superRegion: 'aquarias',
    startNode: 'coral_01',
    width: 800,
    height: 500,
    backgroundColor: '#0a2a3a'
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

export function getSuperRegion(superRegionId) {
  return superRegions.find(sr => sr.id === superRegionId) || null
}

export function getRegionsBySuperRegion(superRegionId) {
  return regions.filter(r => r.superRegion === superRegionId)
}

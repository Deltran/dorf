import janxierFloodplainMap from '../../assets/maps/janxier_floodplain.png'

export const regionMeta = {
  id: 'janxier_floodplain',
  name: 'Janxier Floodplain',
  superRegion: 'western_veros',
  startNode: 'flood_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2a1f',
  backgroundImage: janxierFloodplainMap
}

export const nodes = {
  flood_01: {
    id: 'flood_01',
    name: 'Muddy Banks',
    region: 'Janxier Floodplain',
    x: 303,
    y: 946,
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
    x: 456,
    y: 755,
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
    x: 158,
    y: 674,
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
    x: 478,
    y: 633,
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
    x: 84,
    y: 459,
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
    name: "Serpent's Crossing",
    region: 'Janxier Floodplain',
    x: 321,
    y: 439,
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
    name: "Hydra's Lair",
    region: 'Janxier Floodplain',
    x: 359,
    y: 312,
    regionLinkPosition: { x: 493, y: 302 },
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
    x: 509,
    y: 702,
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
  }
}

import summitMap from '../../assets/maps/the_summit.png'

export const regionMeta = {
  id: 'the_summit',
  name: 'The Summit',
  description: 'The highest point in Western Veros, where the air thins and the veil between worlds grows brittle. Wind spirits and ice wraiths guard the peak, drawn to a power that pulses from the ancient stones at the summit\'s crown.',
  superRegion: 'western_veros',
  startNode: 'summit_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a1a2a',
  backgroundImage: summitMap
}

export const nodes = {
  summit_01: {
    id: 'summit_01',
    name: 'Windswept Ascent',
    region: 'The Summit',
    x: 438,
    y: 614,
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
    x: 247,
    y: 742,
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
    name: "Guardian's Gate",
    region: 'The Summit',
    x: 175,
    y: 558,
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
    x: 248,
    y: 310,
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
    x: 485,
    y: 360,
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
    name: "Titan's Throne",
    region: 'The Summit',
    x: 315,
    y: 112,
    regionLinkPosition: { x: 482, y: 115 },
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
    x: 97,
    y: 651,
    type: 'exploration',
    unlockedBy: 'summit_03',
    backgroundId: 'summit_01',
    connections: [],
    explorationConfig: {
      requiredFights: 70,
      timeLimit: 300,
      rewards: { gold: 800, gems: 35, exp: 500 },
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
  }
}

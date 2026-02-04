import stormwindPeaksMap from '../../assets/maps/stormwind_peaks.png'

export const regionMeta = {
  id: 'stormwind_peaks',
  name: 'Stormwind Peaks',
  description: 'Jagged mountains where howling gales never cease and lightning splits the sky without warning. Harpies nest among the crags, and frost elementals patrol frozen passes that claim the unprepared.',
  superRegion: 'western_veros',
  startNode: 'mountain_01',
  width: 600,
  height: 1000,
  backgroundColor: '#2a2a3a',
  backgroundImage: stormwindPeaksMap
}

export const nodes = {
  mountain_01: {
    id: 'mountain_01',
    name: 'Mountain Pass',
    region: 'Stormwind Peaks',
    x: 65,
    y: 529,
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
    x: 338,
    y: 521,
    regionLinkPosition: { x: 487, y: 558 },
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
    name: "Giant's Path",
    region: 'Stormwind Peaks',
    x: 101,
    y: 358,
    battles: [
      { enemies: ['mountain_giant'] },
      { enemies: ['nesting_roc', 'harpy', 'harpy'] },
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
    name: "Dragon's Lair",
    region: 'Stormwind Peaks',
    x: 497,
    y: 166,
    regionLinkPosition: { x: 398, y: 145 },
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
    x: 197,
    y: 307,
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
    x: 344,
    y: 273,
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
    x: 430,
    y: 375,
    battles: [
      { enemies: ['mountain_giant', 'storm_elemental'] },
      { enemies: ['nesting_roc', 'frost_elemental', 'thunder_hawk', 'thunder_hawk'] },
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
  }
}

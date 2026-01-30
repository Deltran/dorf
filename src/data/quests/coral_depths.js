// Note: No background image defined in original questNodes.js for this region

export const regionMeta = {
  id: 'coral_depths',
  name: 'Coral Depths',
  superRegion: 'aquarias',
  startNode: 'coral_01',
  width: 800,
  height: 500,
  backgroundColor: '#0a2a3a'
}

export const nodes = {
  coral_01: {
    id: 'coral_01',
    name: 'Coral Tunnels',
    region: 'Coral Depths',
    x: 100,
    y: 250,
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
    x: 250,
    y: 180,
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
    x: 400,
    y: 300,
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
    x: 500,
    y: 170,
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
    x: 620,
    y: 310,
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
    x: 720,
    y: 200,
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

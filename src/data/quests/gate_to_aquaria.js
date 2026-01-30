// Note: No background image defined in original questNodes.js for this region

export const regionMeta = {
  id: 'gate_to_aquaria',
  name: 'Gate to Aquaria',
  superRegion: 'western_veros',
  startNode: 'aqua_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a2a3f'
}

export const nodes = {
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
    name: "Leviathan's Wake",
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
    name: "Kraken's Domain",
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
  }
}

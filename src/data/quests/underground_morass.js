// Note: No background image defined in original questNodes.js for this region

export const regionMeta = {
  id: 'underground_morass',
  name: 'Underground Morass',
  superRegion: 'western_veros',
  startNode: 'morass_01',
  width: 800,
  height: 500,
  backgroundColor: '#1a2a1a'
}

export const nodes = {
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
    name: "Stalker's Den",
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
    name: "Horror's Domain",
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
  }
}

import ancientCatacombsMap from '../../assets/maps/ancient_catacombs.png'

export const regionMeta = {
  id: 'ancient_catacombs',
  name: 'Ancient Catacombs',
  superRegion: 'western_veros',
  startNode: 'cata_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1f1a2a',
  backgroundImage: ancientCatacombsMap
}

export const nodes = {
  cata_01: {
    id: 'cata_01',
    name: 'Tomb Entrance',
    region: 'Ancient Catacombs',
    x: 292,
    y: 116,
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
    x: 150,
    y: 328,
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
    x: 476,
    y: 316,
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
    x: 241,
    y: 534,
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
    x: 428,
    y: 534,
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
    x: 336,
    y: 792,
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
    name: "Lich King's Throne",
    region: 'Ancient Catacombs',
    x: 455,
    y: 690,
    regionLinkPosition: { x: 534, y: 779 },
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
  }
}

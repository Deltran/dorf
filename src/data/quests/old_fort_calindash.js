import oldFortCalindashMap from '../../assets/maps/old_fort_calindash.png'

export const regionMeta = {
  id: 'old_fort_calindash',
  name: 'Old Fort Calindash',
  superRegion: 'western_veros',
  startNode: 'fort_01',
  width: 600,
  height: 1000,
  backgroundColor: '#2a2a2a',
  backgroundImage: oldFortCalindashMap
}

export const nodes = {
  fort_01: {
    id: 'fort_01',
    name: 'Outer Walls',
    region: 'Old Fort Calindash',
    x: 296,
    y: 893,
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
    x: 286,
    y: 721,
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
    x: 481,
    y: 650,
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
    x: 167,
    y: 507,
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
    name: "Commander's Hall",
    region: 'Old Fort Calindash',
    x: 331,
    y: 566,
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
    x: 253,
    y: 478,
    regionLinkPosition: { x: 323, y: 363 },
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
  }
}

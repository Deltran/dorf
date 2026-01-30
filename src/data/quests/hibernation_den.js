import hibernationDenMap from '../../assets/maps/hibernation_den.png'

export const regionMeta = {
  id: 'hibernation_den',
  name: 'Hibernation Den',
  superRegion: 'western_veros',
  startNode: 'hibernation_01',
  width: 800,
  height: 500,
  backgroundColor: '#2a3a2a',
  backgroundImage: hibernationDenMap
}

export const nodes = {
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
  }
}

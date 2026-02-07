import whisperLakeMap from '../../assets/maps/whisper_lake.png'

export const regionMeta = {
  id: 'whisper_lake',
  name: 'Whisper Lake',
  description: 'A cursed body of water where the drowned are said to speak from beneath the surface. Mist clings to the shoreline at all hours, and serpents glide through the shallows waiting for the unwary.',
  superRegion: 'western_veros',
  startNode: 'lake_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a2a2f',
  backgroundImage: whisperLakeMap
}

export const nodes = {
  lake_01: {
    id: 'lake_01',
    name: 'Misty Shore',
    region: 'Whisper Lake',
    x: 71,
    y: 622,
    battles: [
      { enemies: ['forest_wolf', 'forest_wolf', 'giant_frog'] },
      { enemies: ['lake_serpent', 'lake_serpent'] },
      { enemies: ['dire_wolf', 'giant_frog', 'giant_frog'] }
    ],
    connections: ['lake_02', 'lake_colosseum'],
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
    x: 308,
    y: 830,
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
  lake_colosseum: {
    id: 'lake_colosseum',
    name: 'The Colosseum Gate',
    region: 'Whisper Lake',
    x: 200,
    y: 450,
    battles: [
      { enemies: ['dire_wolf', 'dire_wolf', 'lake_serpent', 'lake_serpent'] }
    ],
    connections: [],
    rewards: { gems: 100, gold: 500, exp: 250 },
    firstClearBonus: { gems: 50 },
    unlocks: 'colosseum'
  },
  lake_genus_loci: {
    id: 'lake_genus_loci',
    name: 'Lake Tower',
    region: 'Whisper Lake',
    x: 481,
    y: 531,
    type: 'genusLoci',
    genusLociId: 'valinar',
    connections: ['lake_02']
  }
}

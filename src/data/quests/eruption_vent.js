import eruptionVentMap from '../../assets/maps/eruption_vent.png'

export const regionMeta = {
  id: 'eruption_vent',
  name: 'Eruption Vent',
  superRegion: 'western_veros',
  startNode: 'eruption_vent_01',
  width: 600,
  height: 1000,
  backgroundColor: '#3f1a0a',
  backgroundImage: eruptionVentMap
}

export const nodes = {
  eruption_vent_01: {
    id: 'eruption_vent_01',
    name: 'Basalt Corridor',
    region: 'Eruption Vent',
    x: 303,
    y: 923,
    battles: [
      { enemies: ['magma_golem', 'fire_elemental'] },
      { enemies: ['volcanic_drake', 'flame_salamander', 'ash_crawler'] },
      { enemies: ['magma_golem', 'magma_golem'] }
    ],
    connections: ['eruption_vent_02'],
    rewards: { gems: 95, gold: 780, exp: 780 },
    firstClearBonus: { gems: 145 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.7 },
      { itemId: 'eruption_vent_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  eruption_vent_02: {
    id: 'eruption_vent_02',
    name: 'Molten Chamber',
    region: 'Eruption Vent',
    x: 220,
    y: 667,
    battles: [
      { enemies: ['volcanic_drake', 'volcanic_drake'] },
      { enemies: ['magma_golem', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'magma_golem'] }
    ],
    connections: ['eruption_vent_gl'],
    rewards: { gems: 100, gold: 800, exp: 800 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 },
      { itemId: 'eruption_vent_key', min: 1, max: 1, chance: 0.25 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 }
    ]
  },
  eruption_vent_gl: {
    id: 'eruption_vent_gl',
    name: 'Eruption Vent',
    region: 'Eruption Vent',
    x: 297,
    y: 489,
    type: 'genusLoci',
    genusLociId: 'pyroclast',
    connections: []
  }
}

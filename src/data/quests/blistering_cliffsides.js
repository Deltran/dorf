import blisteringCliffsMap from '../../assets/maps/blistering_cliffsides.png'

export const regionMeta = {
  id: 'blistering_cliffsides',
  name: 'Blistering Cliffsides',
  superRegion: 'western_veros',
  startNode: 'cliffs_01',
  width: 600,
  height: 1000,
  backgroundColor: '#2f1a1a',
  backgroundImage: blisteringCliffsMap
}

export const nodes = {
  cliffs_01: {
    id: 'cliffs_01',
    name: 'Scorched Trail',
    region: 'Blistering Cliffsides',
    x: 272,
    y: 950,
    battles: [
      { enemies: ['ash_crawler', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'ash_crawler'] },
      { enemies: ['harpy', 'harpy', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['flame_salamander', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'fire_elemental'] }
    ],
    connections: ['cliffs_02'],
    rewards: { gems: 100, gold: 720, exp: 720 },
    firstClearBonus: { gems: 140 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.7 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_02: {
    id: 'cliffs_02',
    name: 'Ember Fields',
    region: 'Blistering Cliffsides',
    x: 262,
    y: 816,
    battles: [
      { enemies: ['fire_elemental', 'fire_elemental', 'ash_crawler'] },
      { enemies: ['flame_salamander', 'flame_salamander'] },
      { enemies: ['magma_golem', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'flame_salamander', 'ash_crawler'] },
      { enemies: ['harpy', 'harpy', 'fire_elemental', 'fire_elemental'] }
    ],
    connections: ['cliffs_03', 'cliffs_04'],
    rewards: { gems: 100, gold: 750, exp: 750 },
    firstClearBonus: { gems: 145 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.75 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_03: {
    id: 'cliffs_03',
    name: 'Magma Pools',
    region: 'Blistering Cliffsides',
    x: 369,
    y: 611,
    battles: [
      { enemies: ['magma_golem', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'flame_salamander'] },
      { enemies: ['magma_golem', 'magma_golem'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'flame_salamander'] },
      { enemies: ['volcanic_drake', 'ash_crawler', 'ash_crawler'] }
    ],
    connections: ['cliffs_05'],
    rewards: { gems: 100, gold: 780, exp: 780 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_04: {
    id: 'cliffs_04',
    name: 'Sulfur Vents',
    region: 'Blistering Cliffsides',
    x: 138,
    y: 495,
    battles: [
      { enemies: ['ash_crawler', 'ash_crawler', 'ash_crawler', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'magma_golem'] },
      { enemies: ['harpy', 'harpy', 'flame_salamander', 'flame_salamander'] },
      { enemies: ['magma_golem', 'fire_elemental', 'fire_elemental'] }
    ],
    connections: ['cliffs_05'],
    rewards: { gems: 100, gold: 780, exp: 780 },
    firstClearBonus: { gems: 150 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.75 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_05: {
    id: 'cliffs_05',
    name: 'Caldera Ridge',
    region: 'Blistering Cliffsides',
    x: 283,
    y: 399,
    regionLinkPosition: { x: 461, y: 357 },
    battles: [
      { enemies: ['volcanic_drake', 'fire_elemental'] },
      { enemies: ['magma_golem', 'magma_golem', 'ash_crawler', 'ash_crawler'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['volcanic_drake', 'flame_salamander'] },
      { enemies: ['magma_golem', 'volcanic_drake'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'magma_golem', 'flame_salamander'] }
    ],
    connections: ['cliffs_06', 'eruption_vent_01'],
    rewards: { gems: 100, gold: 800, exp: 800 },
    firstClearBonus: { gems: 155 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cliffs_06: {
    id: 'cliffs_06',
    name: 'Inferno Peak',
    region: 'Blistering Cliffsides',
    x: 247,
    y: 219,
    regionLinkPosition: { x: 423, y: 202 },
    battles: [
      { enemies: ['volcanic_drake', 'volcanic_drake'] },
      { enemies: ['magma_golem', 'magma_golem', 'flame_salamander'] },
      { enemies: ['fire_elemental', 'fire_elemental', 'fire_elemental', 'fire_elemental'] },
      { enemies: ['volcanic_drake', 'magma_golem', 'fire_elemental'] },
      { enemies: ['flame_salamander', 'flame_salamander', 'volcanic_drake'] },
      { enemies: ['volcanic_drake', 'volcanic_drake', 'magma_golem'] }
    ],
    connections: ['flood_01'],
    rewards: { gems: 100, gold: 850, exp: 850 },
    firstClearBonus: { gems: 160 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 1.0 },
      { itemId: 'goblin_trinket', min: 1, max: 3, chance: 0.85 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_stormwind_peaks', min: 1, max: 1, chance: 0.1 }
    ]
  }
}

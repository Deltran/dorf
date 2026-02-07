import echoingCavernsMap from '../../assets/maps/echoing_caverns.png'

export const regionMeta = {
  id: 'echoing_caverns',
  name: 'Echoing Caverns',
  description: 'Every footstep reverberates through these sprawling underground chambers, alerting the dark cultists and stone golems that dwell within. Bioluminescent fungi cast sickly light across walls slick with moisture and old blood.',
  superRegion: 'western_veros',
  startNode: 'cave_01',
  width: 600,
  height: 1000,
  backgroundColor: '#1a1a2f',
  backgroundImage: echoingCavernsMap
}

export const nodes = {
  cave_01: {
    id: 'cave_01',
    name: 'Cavern Entrance',
    region: 'Echoing Caverns',
    x: 73,
    y: 152,
    battles: [
      { enemies: ['cave_bat', 'cave_bat', 'cave_bat'] },
      { enemies: ['cave_bat', 'dark_cultist'] },
      { enemies: ['rock_golem'] }
    ],
    connections: ['cave_02', 'cave_03'],
    rewards: { gems: 90, gold: 220, exp: 180 },
    firstClearBonus: { gems: 60 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.4 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.35 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.2 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_02: {
    id: 'cave_02',
    name: 'Cultist Shrine',
    region: 'Echoing Caverns',
    x: 149,
    y: 259,
    battles: [
      { enemies: ['dark_caster', 'dark_cultist'] },
      { enemies: ['dark_caster', 'dark_cultist', 'cave_bat'] },
      { enemies: ['dark_cultist', 'dark_caster', 'dark_cultist'] }
    ],
    connections: ['cave_05'],
    rewards: { gems: 100, gold: 250, exp: 200 },
    firstClearBonus: { gems: 70 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.4 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_03: {
    id: 'cave_03',
    name: 'Troll Bridge',
    region: 'Echoing Caverns',
    x: 92,
    y: 569,
    battles: [
      { enemies: ['rock_golem', 'cave_bat', 'cave_bat'] },
      { enemies: ['cave_troll'] },
      { enemies: ['cave_troll', 'rock_golem'] }
    ],
    connections: ['cave_05'],
    rewards: { gems: 100, gold: 250, exp: 200 },
    firstClearBonus: { gems: 70 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.5 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.4 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_04: {
    id: 'cave_04',
    name: 'Deep Chasm',
    region: 'Echoing Caverns',
    x: 358,
    y: 689,
    regionLinkPosition: { x: 215, y: 684 },
    battles: [
      { enemies: ['rock_golem', 'rock_golem'] },
      { enemies: ['cave_troll', 'dark_cultist', 'dark_cultist'] },
      { enemies: ['cave_troll', 'cave_troll'] }
    ],
    connections: ['mountain_01'],
    rewards: { gems: 100, gold: 300, exp: 250 },
    firstClearBonus: { gems: 80 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.2 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.5 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_05: {
    id: 'cave_05',
    name: 'Ritual Chamber',
    region: 'Echoing Caverns',
    x: 269,
    y: 129,
    battles: [
      { enemies: ['cultist_ritualist', 'dark_cultist', 'dark_cultist'] },
      { enemies: ['cult_warden', 'dark_caster'] },
      { enemies: ['cultist_ritualist', 'dark_caster', 'dark_cultist', 'dark_cultist'] }
    ],
    connections: ['cave_06', 'cave_07'],
    rewards: { gems: 95, gold: 270, exp: 220 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 1, chance: 0.45 },
      { itemId: 'goblin_trinket', min: 1, max: 1, chance: 0.4 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.15 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_06: {
    id: 'cave_06',
    name: 'Blood Altar',
    region: 'Echoing Caverns',
    x: 406,
    y: 355,
    battles: [
      { enemies: ['dark_caster', 'dark_caster', 'cultist_ritualist'] },
      { enemies: ['cult_warden', 'cultist_ritualist', 'dark_cultist', 'dark_cultist'] },
      { enemies: ['dark_caster', 'dark_caster', 'cultist_ritualist', 'cult_warden'] }
    ],
    connections: ['cave_04'],
    rewards: { gems: 100, gold: 285, exp: 235 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.25 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.45 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_07: {
    id: 'cave_07',
    name: 'Summoning Circle',
    region: 'Echoing Caverns',
    x: 486,
    y: 589,
    battles: [
      { enemies: ['rock_golem', 'cult_warden'] },
      { enemies: ['cave_troll', 'cultist_ritualist', 'dark_cultist'] },
      { enemies: ['cult_warden', 'cave_troll', 'cultist_ritualist', 'dark_cultist'] }
    ],
    connections: ['cave_04'],
    rewards: { gems: 100, gold: 285, exp: 235 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_medium', min: 1, max: 2, chance: 1.0 },
      { itemId: 'tome_large', min: 1, max: 1, chance: 0.25 },
      { itemId: 'goblin_trinket', min: 1, max: 2, chance: 0.45 },
      { itemId: 'shiny_pebble', min: 1, max: 1, chance: 0.1 },
      { itemId: 'lake_tower_key', min: 1, max: 1, chance: 0.15 },
      { itemId: 'shard_dragon_heart', min: 1, max: 2, chance: 0.05 },
      { itemId: 'token_whisper_lake', min: 1, max: 1, chance: 0.1 }
    ]
  },
  cave_exploration: {
    id: 'cave_exploration',
    name: 'Echoing Caverns Exploration',
    region: 'Echoing Caverns',
    x: 80,
    y: 310,
    type: 'exploration',
    unlockedBy: 'cave_01',
    backgroundId: 'cave_01',
    connections: [],
    explorationConfig: {
      requiredFights: 50,
      timeLimit: 240,
      rewards: { gold: 500, gems: 20, exp: 300 },
      requiredCrestId: 'valinar_crest',
      itemDrops: [
        { itemId: 'tome_medium', chance: 0.4 },
        { itemId: 'goblin_trinket', chance: 0.6 },
        { itemId: 'token_whispering_woods', chance: 0.15 },
        { itemId: 'token_echoing_caverns', chance: 0.15 }
      ],
      partyRequest: {
        description: 'A tank, a DPS, and a support',
        conditions: [
          { role: 'tank', count: 1 },
          { role: 'dps', count: 1 },
          { role: 'support', count: 1 }
        ]
      }
    }
  }
}

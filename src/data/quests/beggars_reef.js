export const regionMeta = {
  id: 'beggars_reef',
  name: "Beggar's Reef",
  superRegion: 'aquarias',
  startNode: 'beggar_01',
  width: 800,
  height: 500,
  backgroundColor: '#12202a'
}

export const nodes = {
  beggar_01: {
    id: 'beggar_01',
    name: 'Shanty Sprawl',
    region: "Beggar's Reef",
    x: 80,
    y: 250,
    battles: [
      { enemies: ['plague_bearer', 'desperate_vagrant'] },
      { enemies: ['slum_enforcer', 'reef_rat_swarm'] },
      { enemies: ['plague_bearer', 'desperate_vagrant', 'desperate_vagrant'] }
    ],
    connections: ['beggar_02'],
    rewards: { gems: 100, gold: 2800, exp: 2800 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  beggar_02: {
    id: 'beggar_02',
    name: "Beggar's Court",
    region: "Beggar's Reef",
    x: 200,
    y: 180,
    battles: [
      { enemies: ['desperate_vagrant', 'desperate_vagrant', 'desperate_vagrant'] },
      { enemies: ['plague_bearer', 'slum_enforcer'] },
      { enemies: ['reef_rat_swarm', 'reef_rat_swarm', 'plague_bearer'] },
      { enemies: ['slum_enforcer', 'desperate_vagrant', 'desperate_vagrant'] }
    ],
    connections: ['beggar_03'],
    rewards: { gems: 100, gold: 2850, exp: 2850 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  beggar_03: {
    id: 'beggar_03',
    name: 'The Sick Ward',
    region: "Beggar's Reef",
    x: 350,
    y: 280,
    battles: [
      { enemies: ['plague_bearer', 'plague_bearer'] },
      { enemies: ['reef_rat_swarm', 'plague_bearer', 'desperate_vagrant'] },
      { enemies: ['slum_enforcer', 'plague_bearer', 'plague_bearer'] },
      { enemies: ['reef_rat_swarm', 'reef_rat_swarm', 'slum_enforcer'] }
    ],
    connections: ['beggar_04'],
    rewards: { gems: 100, gold: 2900, exp: 2900 },
    firstClearBonus: { gems: 50 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  beggar_04: {
    id: 'beggar_04',
    name: "Peddler's Maze",
    region: "Beggar's Reef",
    x: 480,
    y: 180,
    battles: [
      { enemies: ['slum_enforcer', 'slum_enforcer'] },
      { enemies: ['desperate_vagrant', 'desperate_vagrant', 'plague_bearer', 'reef_rat_swarm'] },
      { enemies: ['plague_bearer', 'plague_bearer', 'slum_enforcer'] },
      { enemies: ['reef_rat_swarm', 'reef_rat_swarm', 'desperate_vagrant', 'desperate_vagrant'] },
      { enemies: ['slum_enforcer', 'plague_bearer', 'reef_rat_swarm', 'desperate_vagrant'] }
    ],
    connections: ['beggar_05'],
    rewards: { gems: 100, gold: 2950, exp: 2950 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  beggar_05: {
    id: 'beggar_05',
    name: "The Fence's Alcove",
    region: "Beggar's Reef",
    x: 600,
    y: 300,
    battles: [
      { enemies: ['slum_enforcer', 'slum_enforcer', 'desperate_vagrant'] },
      { enemies: ['plague_bearer', 'plague_bearer', 'reef_rat_swarm', 'reef_rat_swarm'] },
      { enemies: ['desperate_vagrant', 'desperate_vagrant', 'desperate_vagrant', 'slum_enforcer'] },
      { enemies: ['reef_rat_swarm', 'plague_bearer', 'slum_enforcer', 'desperate_vagrant'] },
      { enemies: ['slum_enforcer', 'slum_enforcer', 'plague_bearer', 'plague_bearer'] }
    ],
    connections: ['beggar_06'],
    rewards: { gems: 100, gold: 3000, exp: 3000 },
    firstClearBonus: { gems: 75 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 2, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  },
  beggar_06: {
    id: 'beggar_06',
    name: 'Drainage Tunnels',
    region: "Beggar's Reef",
    x: 720,
    y: 220,
    battles: [
      { enemies: ['slum_enforcer', 'slum_enforcer', 'reef_rat_swarm', 'plague_bearer'] },
      { enemies: ['desperate_vagrant', 'desperate_vagrant', 'desperate_vagrant', 'desperate_vagrant'] },
      { enemies: ['plague_bearer', 'plague_bearer', 'plague_bearer', 'slum_enforcer'] },
      { enemies: ['reef_rat_swarm', 'reef_rat_swarm', 'reef_rat_swarm', 'plague_bearer'] },
      { enemies: ['the_blightmother'] }
    ],
    connections: ['pearlgate_01', 'blackfin_01'],
    rewards: { gems: 100, gold: 3100, exp: 3100 },
    firstClearBonus: { gems: 100 },
    itemDrops: [
      { itemId: 'tome_large', min: 1, max: 3, chance: 0.8 },
      { itemId: 'shard_dragon_heart', min: 1, max: 1, chance: 0.05 },
      // 1-star equipment (4% each)
      { itemId: 'rusty_shiv', chance: 0.04 },
      { itemId: 'scrap_leather', chance: 0.04 },
      { itemId: 'cracked_ring', chance: 0.04 },
      { itemId: 'tattered_shroud', chance: 0.04 },
      { itemId: 'dented_buckler', chance: 0.04 },
      { itemId: 'cracked_skull', chance: 0.04 },
      { itemId: 'bent_shortbow', chance: 0.04 },
      { itemId: 'gnarled_branch', chance: 0.04 },
      { itemId: 'tarnished_pendant', chance: 0.04 },
      { itemId: 'faded_prayer_beads', chance: 0.04 },
      { itemId: 'chipped_antler', chance: 0.04 },
      { itemId: 'cracked_whistle', chance: 0.04 },
      // 1-star upgrade materials (2.5% each)
      { itemId: 'common_weapon_stone', chance: 0.025 },
      { itemId: 'common_armor_plate', chance: 0.025 },
      { itemId: 'common_gem_shard', chance: 0.025 },
      { itemId: 'common_class_token', chance: 0.025 }
    ],
    shardDropChance: 0.25
  }
}

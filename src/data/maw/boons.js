// src/data/maw/boons.js

// Boon definitions — Fight-Level Effects used as Maw boons
// Each boon maps to the FLE data shape: { hook, effect: { type, value, ... }, scope }

const boons = [
  // === OFFENSIVE (Red) ===
  // Common
  {
    id: 'keen_edge',
    name: 'Keen Edge',
    description: 'Heroes deal 10% more damage.',
    category: 'offensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 10 }
  },
  {
    id: 'sharp_strikes',
    name: 'Sharp Strikes',
    description: 'Heroes deal 15% more damage.',
    category: 'offensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 15 }
  },
  {
    id: 'enemy_frailty',
    name: 'Enemy Frailty',
    description: 'Enemies take 10% more damage.',
    category: 'offensive',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: -10 }
  },
  // Rare
  {
    id: 'brutal_force',
    name: 'Brutal Force',
    description: 'Heroes deal 25% more damage.',
    category: 'offensive',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 25 }
  },
  {
    id: 'savage_blows',
    name: 'Savage Blows',
    description: 'Enemies take 20% more damage.',
    category: 'offensive',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: -20 }
  },
  // Epic
  {
    id: 'overwhelming_power',
    name: 'Overwhelming Power',
    description: 'Heroes deal 40% more damage.',
    category: 'offensive',
    rarity: 'epic',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: 40 }
  },

  // === DEFENSIVE (Blue) ===
  // Common
  {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: 'Heroes take 10% less damage.',
    category: 'defensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 10 }
  },
  {
    id: 'natural_recovery',
    name: 'Natural Recovery',
    description: 'Heroes heal 3% max HP at start of turn.',
    category: 'defensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_turn_start',
    effect: { type: 'heal_percent_max_hp', value: 3 }
  },
  {
    id: 'toughened_hide',
    name: 'Toughened Hide',
    description: 'Heroes take 15% less damage.',
    category: 'defensive',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 15 }
  },
  // Rare
  {
    id: 'fortified',
    name: 'Fortified',
    description: 'Heroes take 25% less damage.',
    category: 'defensive',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 25 }
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Heroes heal 5% max HP at start of turn.',
    category: 'defensive',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_turn_start',
    effect: { type: 'heal_percent_max_hp', value: 5 }
  },
  // Epic
  {
    id: 'unyielding',
    name: 'Unyielding',
    description: 'Heroes take 35% less damage.',
    category: 'defensive',
    rarity: 'epic',
    scope: 'heroes',
    hook: 'on_pre_damage',
    effect: { type: 'damage_reduction', value: 35 }
  },

  // === TACTICAL (Green) ===
  // Common
  {
    id: 'cursed_ground',
    name: 'Cursed Ground',
    description: 'Enemies take 2% max HP damage at start of turn.',
    category: 'tactical',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_turn_start',
    effect: { type: 'damage_percent_max_hp', value: 2 }
  },
  {
    id: 'weakening_aura',
    name: 'Weakening Aura',
    description: 'Enemies deal 10% less damage.',
    category: 'tactical',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: -10 }
  },
  {
    id: 'erosion',
    name: 'Erosion',
    description: 'Enemies take 3% max HP damage at start of turn.',
    category: 'tactical',
    rarity: 'common',
    scope: 'enemies',
    hook: 'on_turn_start',
    effect: { type: 'damage_percent_max_hp', value: 3 }
  },
  // Rare
  {
    id: 'sapping_field',
    name: 'Sapping Field',
    description: 'Enemies deal 20% less damage.',
    category: 'tactical',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: -20 }
  },
  {
    id: 'blight',
    name: 'Blight',
    description: 'Enemies take 5% max HP damage at start of turn.',
    category: 'tactical',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_turn_start',
    effect: { type: 'damage_percent_max_hp', value: 5 }
  },
  // Epic
  {
    id: 'suffocating_miasma',
    name: 'Suffocating Miasma',
    description: 'Enemies deal 30% less damage and take 3% max HP at turn start.',
    category: 'tactical',
    rarity: 'epic',
    scope: 'enemies',
    hook: 'on_pre_damage',
    effect: { type: 'damage_multiplier', value: -30 }
  },

  // === SYNERGY (Purple) — Seed/Payoff chains ===
  // Burn chain
  {
    id: 'searing_strikes',
    name: 'Searing Strikes',
    description: 'Hero attacks have a 15% chance to burn enemies for 2 turns.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['burn'],
    effect: { type: 'apply_status', statusType: 'burn', chance: 15, duration: 2, value: 10 }
  },
  {
    id: 'fan_the_flames',
    name: 'Fan the Flames',
    description: 'Burning enemies take 15% more damage.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['burn'],
    effect: { type: 'damage_reduction', value: -15 }
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    description: 'Hero attacks have a 25% chance to burn enemies.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['burn'],
    effect: { type: 'apply_status', statusType: 'burn', chance: 25, duration: 2, value: 15 }
  },

  // Poison chain
  {
    id: 'toxic_coating',
    name: 'Toxic Coating',
    description: 'Hero attacks have a 15% chance to poison enemies for 3 turns.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['poison'],
    effect: { type: 'apply_status', statusType: 'poison', chance: 15, duration: 3, value: 8 }
  },
  {
    id: 'virulence',
    name: 'Virulence',
    description: 'Poisoned enemies take 15% more damage.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['poison'],
    effect: { type: 'damage_reduction', value: -15 }
  },

  // Slow chain
  {
    id: 'chilling_presence',
    name: 'Chilling Presence',
    description: 'Hero attacks have a 20% chance to slow enemies for 2 turns.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['slow'],
    effect: { type: 'apply_status', statusType: 'spd_down', chance: 20, duration: 2, value: 20 }
  },
  {
    id: 'frozen_prey',
    name: 'Frozen Prey',
    description: 'Slowed enemies take 20% more damage.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'enemies',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['slow'],
    effect: { type: 'damage_reduction', value: -20 }
  },

  // Lifesteal chain
  {
    id: 'vampiric_touch',
    name: 'Vampiric Touch',
    description: 'Heroes heal for 5% of damage dealt.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_post_damage',
    isSeed: true,
    seedTags: ['lifesteal'],
    effect: { type: 'heal_percent_damage', value: 5 }
  },
  {
    id: 'blood_feast',
    name: 'Blood Feast',
    description: 'Heroes heal for 15% of damage dealt.',
    category: 'synergy',
    rarity: 'epic',
    scope: 'heroes',
    hook: 'on_post_damage',
    isPayoff: true,
    payoffTags: ['lifesteal'],
    effect: { type: 'heal_percent_damage', value: 15 }
  },

  // Shield chain
  {
    id: 'arcane_barrier',
    name: 'Arcane Barrier',
    description: 'Heroes gain a shield equal to 5% max HP at start of turn.',
    category: 'synergy',
    rarity: 'common',
    scope: 'heroes',
    hook: 'on_turn_start',
    isSeed: true,
    seedTags: ['shield'],
    effect: { type: 'grant_shield', value: 5 }
  },
  {
    id: 'empowered_shields',
    name: 'Empowered Shields',
    description: 'Heroes deal 20% more damage while shielded.',
    category: 'synergy',
    rarity: 'rare',
    scope: 'heroes',
    hook: 'on_pre_damage',
    isPayoff: true,
    payoffTags: ['shield'],
    effect: { type: 'damage_multiplier', value: 20 }
  }
]

export function getAllBoons() {
  return boons
}

export function getBoon(id) {
  return boons.find(b => b.id === id) || null
}

export function getBoonsByCategory(category) {
  return boons.filter(b => b.category === category)
}

export function getBoonsByRarity(rarity) {
  return boons.filter(b => b.rarity === rarity)
}

export function getSeedBoons() {
  return boons.filter(b => b.isSeed)
}

export function getPayoffBoons() {
  return boons.filter(b => b.isPayoff)
}

export function getPayoffsForSeed(seed) {
  if (!seed.seedTags) return []
  return boons.filter(b =>
    b.isPayoff && b.payoffTags?.some(t => seed.seedTags.includes(t))
  )
}

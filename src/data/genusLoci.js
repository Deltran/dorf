// src/data/genusLoci.js

export const genusLociData = {
  valinar: {
    id: 'valinar',
    name: 'Valinar, Lake Tower Guardian',
    description: 'A corrupted sentinel who guards the ancient lake tower.',
    region: 'whisper_lake',
    imageSize: 160,
    nodeId: 'whisper_lake_genus_loci',
    keyItemId: 'lake_tower_key',
    maxPowerLevel: 20,
    baseStats: { hp: 600, atk: 60, def: 25, spd: 80 },
    statScaling: { hp: 1.15, atk: 1.1, def: 1.08 },
    abilities: [
      { id: 'iron_guard', unlocksAt: 1 },
      { id: 'heavy_strike', unlocksAt: 1 },
      { id: 'shield_bash', unlocksAt: 5 },
      { id: 'towers_wrath', unlocksAt: 10 },
      { id: 'counterattack_stance', unlocksAt: 15 },
      { id: 'judgment_of_ages', unlocksAt: 20 }
    ],
    uniqueDrop: { itemId: 'valinar_crest', guaranteed: true },
    firstClearBonus: { gems: 20 },
    currencyRewards: {
      base: { gold: 100 },
      perLevel: { gold: 25 }
    }
  },
  great_troll: {
    id: 'great_troll',
    name: 'The Great Troll Vurgorol',
    description: 'An ancient troll that has learned to regenerate by entering deep hibernation.',
    region: 'hibernation_den',
    imageSize: 180,
    nodeId: 'hibernation_den',
    keyItemId: 'den_key',
    maxPowerLevel: 20,
    baseStats: { hp: 800, atk: 50, def: 35, spd: 5 },
    statScaling: { hp: 1.15, atk: 1.1, def: 1.08 },
    abilities: [
      { id: 'crushing_blow', unlocksAt: 1 },
      { id: 'hibernation', unlocksAt: 1 },
      { id: 'regenerative_sleep', unlocksAt: 1 },
      { id: 'boulder_toss', unlocksAt: 5 },
      { id: 'thick_hide', unlocksAt: 10 },
      { id: 'rage_awakening', unlocksAt: 15 },
      { id: 'unstoppable', unlocksAt: 20 }
    ],
    uniqueDrop: { itemId: 'great_troll_crest', guaranteed: true },
    firstClearBonus: { gems: 20 },
    currencyRewards: {
      base: { gems: 10 },
      perLevel: { gems: 2 }
    }
  },
  pyroclast: {
    id: 'pyroclast',
    name: 'Pyroclast, the Living Eruption',
    description: 'A molten elemental born from the heart of the volcano. It builds pressure with each passing moment, growing stronger until it erupts with devastating force.',
    region: 'eruption_vent',
    imageSize: 180,
    nodeId: 'eruption_vent_gl',
    keyItemId: 'eruption_vent_key',
    maxPowerLevel: 20,
    baseStats: { hp: 700, atk: 65, def: 20, spd: 12 },
    statScaling: { hp: 1.15, atk: 1.12, def: 1.06 },
    abilities: [
      { id: 'magma_surge', unlocksAt: 1 },
      { id: 'tectonic_charge', unlocksAt: 1 },
      { id: 'eruption', unlocksAt: 1 },
      { id: 'molten_armor', unlocksAt: 5 },
      { id: 'pyroclastic_flow', unlocksAt: 10 },
      { id: 'magma_pool', unlocksAt: 15 },
      { id: 'cataclysm', unlocksAt: 20 }
    ],
    uniqueDrop: { itemId: 'pyroclast_crest', guaranteed: true },
    firstClearBonus: { gems: 20 },
    currencyRewards: {
      base: { gold: 24 },
      perLevel: { gold: 6 }
    },
    itemDrops: [
      { itemId: 'tome_small', min: 1, max: 3, chance: 1.0 },
      { itemId: 'tome_medium', min: 1, max: 2, chance: 0.7, perLevel: true }
    ]
  },
  thalassion: {
    id: 'thalassion',
    name: 'Thalassion, the Deep Mind',
    description: 'An ancient horror lurking in the abyss. It has controlled Aquarian kings for centuries, feeding on the city\'s despair.',
    region: 'the_abyssal_maw',
    imageSize: 200,
    nodeId: 'abyss_05',
    keyItemId: 'abyss_key',
    maxPowerLevel: 20,
    baseStats: { hp: 4500, atk: 120, def: 70, spd: 18 },
    statScaling: { hp: 1.18, atk: 1.12, def: 1.08 },
    abilities: [
      { id: 'psychic_crush', unlocksAt: 1 },
      { id: 'mind_flay', unlocksAt: 1 },
      { id: 'psychic_aura', unlocksAt: 1 },
      { id: 'endless_dreaming', unlocksAt: 1 },
      { id: 'dominate', unlocksAt: 5 },
      { id: 'call_of_the_deep', unlocksAt: 10 },
      { id: 'the_mind_unshackled', unlocksAt: 15 },
      { id: 'abyssal_reckoning', unlocksAt: 20 }
    ],
    uniqueDrop: { itemId: 'thalassion_crest', guaranteed: true },
    firstClearBonus: { gems: 50 },
    currencyRewards: {
      base: { gold: 200 },
      perLevel: { gold: 50 }
    }
  }
}

export function getGenusLoci(id) {
  return genusLociData[id] || null
}

export function getAllGenusLoci() {
  return Object.values(genusLociData)
}

export function getGenusLociByRegion(regionId) {
  return Object.values(genusLociData).find(g => g.region === regionId) || null
}

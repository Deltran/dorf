// src/data/genusLoki.js

export const genusLokiData = {
  valinar: {
    id: 'valinar',
    name: 'Valinar, Lake Tower Guardian',
    description: 'A corrupted sentinel who guards the ancient lake tower.',
    region: 'whisper_lake',
    nodeId: 'whisper_lake_genus_loki',
    keyItemId: 'lake_tower_key',
    maxPowerLevel: 20,
    baseStats: { hp: 5000, atk: 150, def: 100, spd: 80 },
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
  }
}

export function getGenusLoki(id) {
  return genusLokiData[id] || null
}

export function getAllGenusLoki() {
  return Object.values(genusLokiData)
}

export function getGenusLokiByRegion(regionId) {
  return Object.values(genusLokiData).find(g => g.region === regionId) || null
}

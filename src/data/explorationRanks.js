// src/data/explorationRanks.js

// Percentage bonus per rank level (configurable)
export const RANK_BONUS_PER_LEVEL = 5

// Rank progression from lowest to highest
export const EXPLORATION_RANKS = ['E', 'D', 'C', 'B', 'A', 'S']

// Cost to upgrade FROM each rank (S has no entry - it's max)
export const RANK_UPGRADE_COSTS = {
  E: { crests: 1, gold: 1000 },
  D: { crests: 5, gold: 1500 },
  C: { crests: 15, gold: 2250 },
  B: { crests: 50, gold: 3375 },
  A: { crests: 100, gold: 5000 }
}
